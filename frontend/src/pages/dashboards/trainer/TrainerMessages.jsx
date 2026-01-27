import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import { ChatProvider, useChat } from '../../../context/ChatProvider';
import { ConversationList } from '../../../components/chat/ConversationList';
import { ChatWindow } from '../../../components/chat/ChatWindow';
import { MessageInput } from '../../../components/chat/MessageInput';
import '../../../styles/messages.css';

// Inner component that uses chat context
const TrainerMessagesContent = () => {
  const chat = useChat();
  const location = useLocation();

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
          <h5 className="mb-0 fw-bold">Messages</h5>
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
      <TrainerDashboardLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div className="messages-page-wrapper">
        {currentUser && (
          <ChatProvider currentUserBackend={currentUser}>
            <TrainerMessagesContent />
          </ChatProvider>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerMessages;
