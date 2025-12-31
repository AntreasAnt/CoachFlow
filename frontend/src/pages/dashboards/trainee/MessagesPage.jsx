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

  // Get user IDs from filtered conversations to avoid duplicates
  const existingConversationUserIds = filteredConversations.map(conv => {
    const otherUserId = conv.participants.find(p => p !== chat.firebaseUser?.uid);
    return String(otherUserId);
  });

  // Filter search results to exclude users we already have conversations with
  const uniqueSearchResults = searchResults.filter(user => {
    return !existingConversationUserIds.includes(String(user.id));
  });

  // Debug logging
  console.log('[Search] Query:', searchQuery);
  console.log('[Search] Filtered conversations:', filteredConversations.length);
  console.log('[Search] Backend results:', searchResults.length);
  console.log('[Search] Unique results (after filtering):', uniqueSearchResults.length);

  // Search users with debounce
  const searchUsers = useCallback(async (query) => {
    // If query is empty, show sample users
    if (!query.trim()) {
      setIsSearching(true);
      try {
        const response = await fetch(
          `${BACKEND_ROUTES_API}SearchChatUsers.php?q=&limit=5`,
          { credentials: 'include' }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      const response = await fetch(
        `${BACKEND_ROUTES_API}SearchChatUsers.php?q=${encodeURIComponent(query)}&limit=8`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[Search] Backend response:', data);
      if (data.success) {
        setSearchResults(data.users || []);
        setHasSearched(true);
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

  // Load sample users on mount
  useEffect(() => {
    if (!hasSearched && searchResults.length === 0) {
      searchUsers('');
    }
  }, [hasSearched, searchResults.length, searchUsers]);

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
              {/* Show existing conversations first */}
              {filteredConversations.length > 0 && (
                <>
                  <div className="text-muted small px-3 py-2 fw-bold">Existing Chats</div>
                  {filteredConversations.map(conv => {
                    const otherUserId = conv.participants.find(p => p !== chat.firebaseUser?.uid);
                    const otherUser = chat.allUsers.find(u => {
                      const userId = String(u.userid || u.id);
                      return userId === String(otherUserId);
                    });
                    return otherUser ? (
                      <div
                        key={conv.id}
                        className="search-result-item"
                        onClick={() => {
                          chat.setActiveConversationId(conv.id);
                          setSearchQuery('');
                        }}
                      >
                        <div className="user-avatar">
                          {otherUser.username[0].toUpperCase()}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{otherUser.username}</div>
                          {conv.lastMessage && (
                            <div className="text-muted small text-truncate">{conv.lastMessage}</div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })}
                </>
              )}
              
              {/* Separator if we have both */}
              {filteredConversations.length > 0 && uniqueSearchResults.length > 0 && (
                <div style={{ borderTop: '1px solid #eee', margin: '8px 0' }}></div>
              )}
              
              {/* Then show other users */}
              {uniqueSearchResults.length > 0 && (
                <>
                  <div className="text-muted small px-3 py-2 fw-bold">All Users</div>
                  {uniqueSearchResults.map(user => (
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
                  ))}
                </>
              )}
              
              {filteredConversations.length === 0 && uniqueSearchResults.length === 0 && (
                <div className="text-center text-muted py-3">
                  {isSearching ? 'Searching...' : 'No results found'}
                </div>
              )}
            </div>
          )}
          
          {!searchQuery && searchResults.length > 0 && (
            <div className="search-results">
              <div className="text-muted small px-3 py-2">Suggested users</div>
              {searchResults.map(user => (
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
              ))}
            </div>
          )}
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
      {/* Header */}
      <header className="messages-header">
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-link text-dark me-3 p-0"
            onClick={() => navigate(-1)}
            title="Go back"
          >
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <div>
            <h1 className="h5 mb-0 fw-bold text-dark">Messages</h1>
            <p className="small text-muted mb-0">Stay connected</p>
          </div>
        </div>
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
