import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db, storage, signInWithBackendSession } from '../services/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuid } from 'uuid';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

// Conversation ID for 1:1 chats: sorted participant IDs joined with '_'
function directConversationId(a, b) {
  return ['dm', ...[a, b].sort()].join('_');
}

export function ChatProvider({ currentUserBackend, children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingMap, setTypingMap] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [blocked, setBlocked] = useState([]);

  // Enforce custom token auth only; no anonymous fallback
  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await signInWithBackendSession();
      if (!mounted) return;
      if (result.user) {
        setFirebaseUser(result.user);
      } else {
        setAuthError(result.error || 'auth_failed');
        console.warn('[Chat] Firebase auth not established:', result);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Sync backend user into Firestore users collection
  useEffect(() => {
    if (!firebaseUser || !currentUserBackend?.userid) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    getDoc(userRef).then(snap => {
      if (!snap.exists()) {
        setDoc(userRef, {
          username: currentUserBackend.username || 'Unknown',
          role: currentUserBackend.role || 'user',
          createdAt: serverTimestamp(),
          blocked: [],
        });
        setBlocked([]);
      } else {
        setBlocked(snap.data().blocked || []);
      }
    });
  }, [firebaseUser, currentUserBackend]);

  // Fetch all chat users from MySQL backend and sync to Firestore (requires Firebase auth)
  useEffect(() => {
    const loadAndSyncUsers = async () => {
      try {
        // Fetch users from MySQL backend
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/backend/src/routes/GetChatUsers.php`, {
          credentials: 'include'
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error('[Chat] Failed to fetch users from backend:', res.status, errorText);
          return;
        }
        const data = await res.json();
        if (!data.success || !data.users) {
          console.warn('[Chat] No users returned from backend:', data);
          return;
        }
        
        // Set all users state FIRST (before Firestore sync)
        setAllUsers(data.users);
        
        // Note: We don't sync MySQL users to Firestore anymore
        // Each user's Firestore doc is created on first auth using their Firebase UID
      } catch (err) {
        console.error('[Chat] Error loading/syncing users:', err);
      }
    };
    if (firebaseUser && currentUserBackend?.userid) {
      loadAndSyncUsers();
    }
  }, [firebaseUser, currentUserBackend]);

  // Subscribe to conversations where current user participates (requires Firebase auth)
  useEffect(() => {
    if (!firebaseUser || !currentUserBackend?.userid) return;
    const convRef = collection(db, 'conversations');
    const q = query(convRef, where('participants', 'array-contains', firebaseUser.uid), orderBy('lastMessageAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setConversations(list);
    });
    return () => unsub();
  }, [firebaseUser, currentUserBackend]);

  // Subscribe to messages for active conversation (requires Firebase auth)
  useEffect(() => {
    if (!firebaseUser || !activeConversationId) { setMessages([]); return; }
    const msgRef = collection(db, 'conversations', activeConversationId, 'messages');
    const q = query(msgRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setMessages(list);
    });
    return () => unsub();
  }, [firebaseUser, activeConversationId]);

  const startDirectConversation = useCallback(async (otherUserId) => {
    if (!firebaseUser || !currentUserBackend?.userid) return;
    if (blocked.includes(String(otherUserId))) {
      console.warn('Cannot start conversation: user is blocked');
      return;
    }
    
    try {
      const cid = directConversationId(firebaseUser.uid, String(otherUserId));
      const convDoc = doc(db, 'conversations', cid);
      const snap = await getDoc(convDoc);
      if (!snap.exists()) {
        await setDoc(convDoc, {
          participants: [firebaseUser.uid, String(otherUserId)],
          isGroup: false,
          lastMessage: null,
          lastMessageAt: null,
          createdAt: serverTimestamp(),
          createdBy: firebaseUser.uid,
        });
      }
      setActiveConversationId(cid);
    } catch (error) {
      console.error('[ChatProvider] Error starting conversation:', error);
    }
  }, [firebaseUser, currentUserBackend, blocked]);

  // Group conversations removed per updated requirements (direct messaging only)

  const sendMessage = useCallback(async ({ text, files }) => {
    if (!firebaseUser || !activeConversationId || !currentUserBackend?.userid) return;
    const msgRef = collection(db, 'conversations', activeConversationId, 'messages');

    let attachmentMeta = [];
    if (files && files.length) {
      for (const f of files) {
        const fileRef = ref(storage, `attachments/${activeConversationId}/${uuid()}_${f.name}`);
        await uploadBytes(fileRef, f);
        const url = await getDownloadURL(fileRef);
        attachmentMeta.push({ name: f.name, url, type: f.type, size: f.size });
      }
    }

    const docData = {
      senderId: firebaseUser.uid,
      text: text || '',
      attachments: attachmentMeta,
      createdAt: serverTimestamp(),
      readBy: [firebaseUser.uid],
      type: attachmentMeta.length ? 'mixed' : 'text',
    };

    const newMsg = await addDoc(msgRef, docData);
    // Update conversation last message
    await updateDoc(doc(db, 'conversations', activeConversationId), {
      lastMessage: docData.text || (attachmentMeta.length ? '[Attachment]' : ''),
      lastMessageAt: serverTimestamp(),
    });
    return newMsg.id;
  }, [activeConversationId, currentUserBackend]);

  const markConversationRead = useCallback(async () => {
    if (!firebaseUser || !activeConversationId || !currentUserBackend?.userid) return;
    const msgRef = collection(db, 'conversations', activeConversationId, 'messages');
    const snap = await getDocs(query(msgRef, orderBy('createdAt', 'asc')));
    const ops = [];
    snap.forEach(d => {
      const data = d.data();
      if (!data.readBy || !data.readBy.includes(firebaseUser.uid)) {
        ops.push(updateDoc(doc(db, 'conversations', activeConversationId, 'messages', d.id), {
          readBy: data.readBy ? [...data.readBy, firebaseUser.uid] : [firebaseUser.uid]
        }));
      }
    });
    if (ops.length) await Promise.all(ops);
  }, [firebaseUser, activeConversationId, currentUserBackend]);

  const blockUser = useCallback(async (userId) => {
    if (!firebaseUser || !currentUserBackend?.userid) return;
    if (blocked.includes(String(userId))) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const updated = [...blocked, String(userId)];
    await updateDoc(userRef, { blocked: updated });
    setBlocked(updated);
  }, [firebaseUser, blocked, currentUserBackend]);

  const unblockUser = useCallback(async (userId) => {
    if (!firebaseUser || !currentUserBackend?.userid) return;
    if (!blocked.includes(String(userId))) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const updated = blocked.filter(id => id !== String(userId));
    await updateDoc(userRef, { blocked: updated });
    setBlocked(updated);
  }, [firebaseUser, blocked, currentUserBackend]);

  const deleteConversation = useCallback(async () => {
    if (!firebaseUser || !activeConversationId || !currentUserBackend?.userid) return;
    const convDoc = doc(db, 'conversations', activeConversationId);
    const snap = await getDoc(convDoc);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.createdBy === firebaseUser.uid) {
      // delete messages
      const msgRef = collection(db, 'conversations', activeConversationId, 'messages');
      const msgSnap = await getDocs(msgRef);
      const deletions = [];
      msgSnap.forEach(m => deletions.push(deleteDoc(doc(db, 'conversations', activeConversationId, 'messages', m.id))));
      await Promise.all(deletions);
      await deleteDoc(convDoc);
      setActiveConversationId(null);
    } else {
      console.warn('User not allowed to delete this conversation');
    }
  }, [firebaseUser, activeConversationId, currentUserBackend]);

  const setTyping = useCallback(async (isTyping) => {
    if (!firebaseUser || !activeConversationId || !currentUserBackend?.userid) return;
    // Store typing state in conversation doc under typing map
    const convDoc = doc(db, 'conversations', activeConversationId);
    await updateDoc(convDoc, { [`typing.${firebaseUser.uid}`]: !!isTyping });
  }, [firebaseUser, activeConversationId, currentUserBackend]);

  // Subscribe to typing updates (optional improvement)
  useEffect(() => {
    if (!firebaseUser || !activeConversationId) { setTypingMap({}); return; }
    const convDoc = doc(db, 'conversations', activeConversationId);
    const unsub = onSnapshot(convDoc, snap => {
      const data = snap.data();
      setTypingMap(data?.typing || {});
    });
    return () => unsub();
  }, [firebaseUser, activeConversationId]);

  const value = {
    loading,
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    startDirectConversation,
    // createGroupConversation removed
    sendMessage,
    markConversationRead,
    typingMap,
    setTyping,
    currentUser: currentUserBackend,
    firebaseUser, // Add firebaseUser to context
    allUsers,
    blocked,
    blockUser,
    unblockUser,
    deleteConversation,
    authError,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
