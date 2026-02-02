import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useChat } from '../../context/ChatProvider';
import { useNavigate } from 'react-router-dom';

export function ChatWindow() {
  const { messages, firebaseUser, typingMap, activeConversationId, conversations, blocked, blockUser, unblockUser, deleteConversation, allUsers, markAsRead, setActiveConversationId } = useChat();
  const bottomRef = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const navigate = useNavigate();

  const activeConversation = useMemo(() => conversations.find(c => c.id === activeConversationId), [conversations, activeConversationId]);
  const participants = activeConversation?.participants || [];
  const otherParticipantUid = useMemo(() => {
    if (!participants || !firebaseUser) return null;
    return participants.find(p => String(p) !== String(firebaseUser.uid));
  }, [participants, firebaseUser]);

  const otherDisplayName = useMemo(() => {
    if (!otherParticipantUid) return 'Conversation';
    const match = allUsers.find(u => {
      const userId = String(u.userId || u.userid || u.id);
      return userId === String(otherParticipantUid);
    });
    return match?.displayName || match?.username || match?.name || otherParticipantUid;
  }, [otherParticipantUid, allUsers]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && firebaseUser) {
      messages.forEach(msg => {
        if (!msg.readBy?.includes(firebaseUser.uid)) {
          markAsRead?.(msg.id);
        }
      });
    }
  }, [messages, firebaseUser, markAsRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversationId) {
    return <div className="text-muted">Select or start a conversation.</div>;
  }

  const isOwnMessage = (senderId) => firebaseUser && String(senderId) === String(firebaseUser.uid);
  const isMessageUnread = (msg) => firebaseUser && !msg.readBy?.includes(firebaseUser.uid);

  return (
    <div className="d-flex flex-column h-100">
      {/* Chat Header */}
      <div className="chat-window-header d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-link text-dark d-md-none p-0 me-3"
            onClick={() => setActiveConversationId(null)}
          >
            <i className="bi bi-arrow-left fs-5"></i>
          </button>
          <div className="user-avatar me-2">
            {otherDisplayName[0]?.toUpperCase()}
          </div>
          <div className="fw-semibold">{otherDisplayName}</div>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowActions(a => !a)}>
          <i className="bi bi-three-dots-vertical"></i>
        </button>
      </div>

      {/* Actions Menu */}
      {showActions && (
        <div className="bg-light border-bottom p-2">
          <div className="d-flex flex-wrap gap-2">
            {otherParticipantUid && !blocked.includes(String(otherParticipantUid)) && (
              <button type="button" className="btn btn-sm btn-warning" onClick={() => blockUser(otherParticipantUid)}>
                <i className="bi bi-slash-circle me-1"></i>Block User
              </button>
            )}
            {otherParticipantUid && blocked.includes(String(otherParticipantUid)) && (
              <button type="button" className="btn btn-sm btn-success" onClick={() => unblockUser(otherParticipantUid)}>
                <i className="bi bi-check-circle me-1"></i>Unblock User
              </button>
            )}
            <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteConversation()}>
              <i className="bi bi-trash me-1"></i>Delete Conversation
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-fill p-3" style={{ overflowY: 'auto' }}>
        {messages.map(m => {
          const isOwn = isOwnMessage(m.senderId);
          const isUnread = isMessageUnread(m);
          
          return (
            <div key={m.id} className={`d-flex mb-3 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${isUnread ? 'unread' : ''}`} style={{ maxWidth: '70%' }}>
                {m.text && <div>{m.text}</div>}
                <div className="message-timestamp mt-1">
                  {m.createdAt?.toDate ? new Date(m.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={bottomRef} />
      </div>

      {/* Typing Indicator - Above input field */}
      {otherParticipantUid && typingMap[otherParticipantUid] && (
        <div className="typing-indicator-container">
          <div className="typing-indicator-small">
            <span className="text-muted small">{otherDisplayName} is typing</span>
            <div className="typing-dots">
              <div className="dot-small"></div>
              <div className="dot-small"></div>
              <div className="dot-small"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
