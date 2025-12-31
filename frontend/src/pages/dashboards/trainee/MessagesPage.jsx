import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import { ChatProvider, useChat } from '../../../context/ChatProvider';
import { ConversationList } from '../../../components/chat/ConversationList';
import { ChatWindow } from '../../../components/chat/ChatWindow';
import { MessageInput } from '../../../components/chat/MessageInput';
import '../../../styles/trainee-dashboard.css';
import '../../../styles/messages.css';


// Inner component that uses chat context
const MessagesContent = ({ currentUser }) => {
  const chat = useChat();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState([]);

  // Filter existing conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = chat.conversations.filter(conv => {
      const otherUserId = conv.participants.find(p => p !== chat.firebaseUser?.uid);
      const otherUser = chat.allUsers.find(u => {
        const userId = String(u.userid || u.id);
        return userId === String(otherUserId);
      });
      
      if (!otherUser) return false;
      
      const username = (otherUser.username || '').toLowerCase();
      const email = (otherUser.email || '').toLowerCase();
      
      return username.includes(query) || email.includes(query);
    });
    
    setFilteredConversations(filtered);
  }, [searchQuery, chat.conversations, chat.allUsers, chat.firebaseUser]);

  // Search users with debounce
  const searchUsers = useCallback(async (query) => {
    // If query is empty, clear results and don't search
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      const url = `${BACKEND_ROUTES_API}SearchChatUsers.php?q=${encodeURIComponent(query)}&limit=8`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.users || []);
        setHasSearched(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search - trigger after 500ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleStartConversation = (userId) => {
    chat.startDirectConversation(userId);
    setSearchQuery('');
  };

  return (
    <div className="messages-page">
      {/* Conversations Sidebar */}
      <div className={`conversations-sidebar ${chat.activeConversationId ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-link text-dark p-0 me-3"
              onClick={() => navigate(-1)}
              title="Go back"
            >
              <i className="bi bi-arrow-left fs-5"></i>
            </button>
            <h5 className="mb-0 fw-bold">Messages</h5>
          </div>
        </div>

        {/* Search Panel - Always visible */}
        <div className="search-panel">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && <div className="spinner-border spinner-border-sm"></div>}
          </div>
          
          {searchQuery && (
            <div className="search-results">
              {searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    className="search-result-item"
                    onClick={() => handleStartConversation(user.id)}
                  >
                    <div className="user-avatar">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.username}</div>
                      <div className="user-role">{user.role}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-3">
                  {isSearching ? 'Searching...' : 'No users found'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation List - Hide when searching */}
        {!searchQuery && (
          <div className="conversations-list">
            <ConversationList />
          </div>
        )}
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
            <p className="text-muted small">Choose a conversation from the left or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component with auth check
const MessagesPage = () => {
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
            role: authData.privileges || 'trainee',
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
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page-wrapper">
      {/* Header - Only visible on mobile and when no active conversation */}
      <header className="messages-header">
       
      </header>

      {/* Main Content */}
      {currentUser && (
        <ChatProvider currentUserBackend={currentUser}>
          <MessagesContent currentUser={currentUser} />
        </ChatProvider>
      )}

    </div>
  );
};

export default MessagesPage;
