import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signInWithBackendSession } from '../services/firebase';

const TraineeHeader = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Sign in to Firebase to track unread messages
  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await signInWithBackendSession();
      if (mounted && result.user) {
        setFirebaseUser(result.user);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Listen for unread messages count
  useEffect(() => {
    if (!firebaseUser) return;
    
    const convRef = collection(db, 'conversations');
    const q = query(convRef, where('participants', 'array-contains', firebaseUser.uid));
    
    const unsub = onSnapshot(q, (snapshot) => {
      let totalUnread = 0;
      snapshot.forEach((doc) => {
        const conv = doc.data();
        // Simple heuristic: if lastMessage exists and you're not the sender, count as unread
        // In production, you'd check actual message read status
        if (conv.lastMessage && conv.lastMessageSenderId && conv.lastMessageSenderId !== firebaseUser.uid) {
          totalUnread++;
        }
      });
      setUnreadCount(totalUnread);
    });
    
    return () => unsub();
  }, [firebaseUser]);

  return (
    <header className="bg-white shadow-sm border-bottom">
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h4 mb-0 fw-bold text-dark">CoachFlow</h1>
            <p className="small text-muted mb-0">Welcome back, Trainee!</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button 
              className="btn btn-outline-dark btn-sm position-relative"
              onClick={() => navigate('/messages')}
              title="Messages"
            >
              <i className="bi bi-chat-dots"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount > 9 ? '9+' : unreadCount}
                  <span className="visually-hidden">unread messages</span>
                </span>
              )}
            </button>
            <button 
              className="btn btn-outline-dark btn-sm"
              onClick={() => navigate('/profile')}
              title="Profile"
            >
              <i className="bi bi-person-circle"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TraineeHeader;
