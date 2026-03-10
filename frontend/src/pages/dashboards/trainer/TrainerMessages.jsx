import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import { ChatProvider, useChat } from '../../../context/ChatProvider';
import { ConversationList } from '../../../components/chat/ConversationList';
import { ChatWindow } from '../../../components/chat/ChatWindow';
import { MessageInput } from '../../../components/chat/MessageInput';
import '../../../styles/messages.css';

// Simple header component for fullscreen messages
const TrainerMessagesHeader = () => {
  const navigate = useNavigate();

  return (
    <header style={{ 
      backgroundColor: 'rgba(15, 20, 15, 0.95)', 
      borderBottom: '1px solid rgba(32, 214, 87, 0.2)', 
      boxShadow: '0 2px 16px rgba(0, 0, 0, 0.3)' 
    }}>
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h4 mb-0 fw-bold" style={{ color: 'var(--brand-white)' }}>CoachFlow</h1>
            <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>Trainer Dashboard</p>
          </div>
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <button 
              className="btn btn-sm"
              onClick={() => navigate('/')}
              title="Dashboard"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--brand-primary)',
                border: '1px solid rgba(32, 214, 87, 0.3)',
                borderRadius: '10px',
                padding: '0.5rem 0.75rem',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="bi bi-speedometer2"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Inner component that uses chat context
const TrainerMessagesContent = () => {
  const chat = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-select conversation from navigation state
  useEffect(() => {
    if (location.state?.selectedUserId && chat.firebaseUser) {
      chat.startDirectConversation(location.state.selectedUserId);
    }
  }, [location.state, chat.firebaseUser]);

  return (
    <div className="messages-page">
      {/* Conversations Sidebar */}
      <div className={`conversations-sidebar ${chat.activeConversationId ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm d-flex align-items-center gap-2"
              onClick={() => navigate('/')}
              style={{
                backgroundColor: 'rgba(32, 214, 87, 0.1)',
                color: 'var(--brand-primary)',
                border: '1px solid rgba(32, 214, 87, 0.3)',
                borderRadius: '10px',
                padding: '0.5rem 0.75rem',
                transition: 'all 0.2s ease'
              }}
              title="Back to Dashboard"
            >
              <i className="bi bi-arrow-left"></i>
              <span className="fw-semibold">Back</span>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="conversations-list">
          <ConversationList />
        </div>
      </div>

      {/* Chat Window */}
      <div className={`chat-area ${!chat.activeConversationId ? 'mobile-hidden' : ''}`}>
        {chat.activeConversationId ? (
          <>
            <ChatWindow />
            <MessageInput />
          </>
        ) : (
          <div className="empty-state">
            <i className="bi bi-chat-dots display-1 text-muted mb-3"></i>
            <h5 className="text-muted">Select a conversation</h5>
            <p className="text-muted small">Choose a client from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component
const TrainerMessages = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await fetch(BACKEND_ROUTES_API + "VerifyPrivilage.php", {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        const authData = await authResponse.json();
        
        if (authData.success && authData.privileges && authData.privileges !== 'loggedout') {
          setCurrentUser({
            username: authData.username || 'user',
            role: authData.privileges || 'trainer',
            userid: authData.user_id || 1
          });
        } else {
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-vh-100" style={{ backgroundColor: 'var(--brand-dark)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TrainerMessagesHeader />
        <div className="d-flex justify-content-center align-items-center" style={{ flex: 1 }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: 'var(--brand-dark)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TrainerMessagesHeader />
      <div style={{ 
        padding: 0, 
        margin: 0,
        width: '100%',
        flex: 1,
        maxWidth: '100vw', 
        overflow: 'hidden'
      }}>
        <div className="messages-page-wrapper" style={{ height: '100%' }}>
          {/* Main Content */}
          {currentUser && (
            <ChatProvider currentUserBackend={currentUser}>
              <TrainerMessagesContent />
            </ChatProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerMessages;
