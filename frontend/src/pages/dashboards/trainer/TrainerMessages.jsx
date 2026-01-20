import React, { useState, useEffect } from 'react';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { ChatWindow } from '../../../components/chat/ChatWindow';
import { ConversationList } from '../../../components/chat/ConversationList';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const TrainerMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetChatUsers.php`);
      
      if (response.success) {
        setConversations(response.chatUsers || []);
        
        // If a conversation was selected, update it with new data
        if (selectedConversation) {
          const updated = (response.chatUsers || []).find(
            conv => conv.userId === selectedConversation.userId
          );
          if (updated) {
            setSelectedConversation(updated);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  if (loading) {
    return (
      <TrainerDashboardLayout>
        <div className="container-fluid p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div className="container-fluid p-0" style={{ height: 'calc(100vh - 0px)' }}>
        <div className="row g-0 h-100">
          {/* Conversations List */}
          <div className="col-lg-4 col-md-5 border-end" style={{ height: '100%', overflowY: 'auto' }}>
            <div className="p-3 border-bottom bg-white sticky-top">
              <h4 className="mb-3">
                Messages
                {unreadCount > 0 && (
                  <span className="badge bg-danger ms-2">{unreadCount}</span>
                )}
              </h4>
              
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              {filteredConversations.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <i className="bi bi-chat-dots fs-1 text-muted mb-3 d-block"></i>
                  <h5 className="text-muted">No conversations yet</h5>
                  <p className="text-muted small">
                    Start chatting with your clients and they'll appear here
                  </p>
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                />
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="col-lg-8 col-md-7" style={{ height: '100%' }}>
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                onConversationUpdate={fetchConversations}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                <div className="text-center">
                  <i className="bi bi-chat-text fs-1 text-muted mb-3 d-block"></i>
                  <h5 className="text-muted">Select a conversation</h5>
                  <p className="text-muted">
                    Choose a client from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerMessages;
