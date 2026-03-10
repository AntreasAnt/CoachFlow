import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useChat } from '../../context/ChatProvider';

export function ChatWindow() {
  const { messages, firebaseUser, typingMap, activeConversationId, conversations, blocked, blockUser, unblockUser, deleteConversation, allUsers, markAsRead, setActiveConversationId } = useChat();
  const bottomRef = useRef(null);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

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

  // Close actions menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };
    
    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

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
    return <div className="text-white-50">Select or start a conversation.</div>;
  }

  const isOwnMessage = (senderId) => firebaseUser && String(senderId) === String(firebaseUser.uid);
  const isMessageUnread = (msg) => firebaseUser && !msg.readBy?.includes(firebaseUser.uid);

  return (
    <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
      {/* Compact Chat Header */}
      <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2d2d2d', flexShrink: 0 }}>
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-link text-white d-md-none p-0 me-2"
            onClick={() => setActiveConversationId(null)}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div className="user-avatar me-2" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
            {otherDisplayName[0]?.toUpperCase()}
          </div>
          <span className="fw-semibold text-white">{otherDisplayName}</span>
        </div>
        <div className="position-relative" ref={actionsRef}>
          <button 
            className="btn btn-sm text-white-50 p-1" 
            onClick={() => setShowActions(!showActions)}
          >
            <i className="bi bi-three-dots-vertical"></i>
          </button>
          {showActions && (
            <div 
              className="position-absolute end-0 mt-1 rounded shadow-lg" 
              style={{ 
                backgroundColor: '#2d2d2d', 
                border: '1px solid #3d3d3d',
                minWidth: '180px',
                zIndex: 1000
              }}
            >
              <div className="py-1">
                {otherParticipantUid && !blocked.includes(String(otherParticipantUid)) && (
                  <button 
                    className="btn btn-sm w-100 text-start text-warning px-3 py-2" 
                    style={{ border: 'none', backgroundColor: 'transparent' }}
                    onClick={() => {
                      blockUser(otherParticipantUid);
                      setShowActions(false);
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 193, 7, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <i className="bi bi-slash-circle me-2"></i>Block
                  </button>
                )}
                {otherParticipantUid && blocked.includes(String(otherParticipantUid)) && (
                  <button 
                    className="btn btn-sm w-100 text-start text-success px-3 py-2" 
                    style={{ border: 'none', backgroundColor: 'transparent' }}
                    onClick={() => {
                      unblockUser(otherParticipantUid);
                      setShowActions(false);
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(25, 135, 84, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <i className="bi bi-check-circle me-2"></i>Unblock
                  </button>
                )}
                <button 
                  className="btn btn-sm w-100 text-start text-danger px-3 py-2" 
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                  onClick={() => {
                    deleteConversation();
                    setShowActions(false);
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <i className="bi bi-trash me-2"></i>Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-area p-3">
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
            <span className="text-white-50 small">{otherDisplayName} is typing</span>
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
