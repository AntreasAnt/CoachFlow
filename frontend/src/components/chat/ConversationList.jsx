import React, { useMemo, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatProvider';

export function ConversationList() {
  const { 
    conversations, 
    activeConversationId, 
    firebaseUser, 
    allUsers, 
    setActiveConversationId, 
    messages,
    hasMoreConversations,
    loadingMoreConversations,
    loadMoreConversations 
  } = useChat();
  const listRef = useRef(null);

  const userMap = useMemo(() => {
    const map = {};
    allUsers.forEach(u => { 
      // Support both 'userid' and 'id' fields for compatibility
      const userId = u.userid || u.id;
      map[String(userId)] = u.username || u.name || userId;
    });
    console.log('[ConversationList] User map:', map);
    console.log('[ConversationList] All users:', allUsers);
    return map;
  }, [allUsers]);

  // Check if conversation has unread messages (Instagram-style)
  const hasUnread = (conversation) => {
    if (!firebaseUser) return false;
    // Message is unread if it exists and was sent by the other person
    return conversation.lastMessage && 
           conversation.lastMessageSenderId && 
           String(conversation.lastMessageSenderId) !== String(firebaseUser.uid);
  };

  // Format time ago (Instagram-style: "2m", "1h", "3d", "2w")
  const getTimeAgo = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    
    const now = new Date();
    const date = timestamp.toDate();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd';
    return Math.floor(seconds / 604800) + 'w';
  };

  // Handle scroll to load more conversations
  useEffect(() => {
    const handleScroll = (e) => {
      const element = e.target;
      const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight;
      
      // If scrolled 80% down and there are more conversations, load them
      if (scrollPercentage > 0.8 && hasMoreConversations && !loadingMoreConversations) {
        loadMoreConversations();
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreConversations, loadingMoreConversations, loadMoreConversations]);

  if (!conversations.length) {
    return (
      <div className="text-center text-muted py-5">
        <i className="bi bi-chat-dots display-4 d-block mb-2"></i>
        <p className="mb-0">No conversations yet</p>
        <small>Start a new conversation</small>
      </div>
    );
  }

  return (
    <div ref={listRef} style={{ overflowY: 'auto', maxHeight: '100%' }}>
      {conversations.map(c => {
        const others = (c.participants || []).filter(p => firebaseUser && String(p) !== String(firebaseUser.uid));
        const otherUid = others[0];
        console.log('[ConversationList] Looking up user:', otherUid, 'Result:', userMap[String(otherUid)]);
        const displayName = userMap[String(otherUid)] || otherUid || 'User';
        const isActive = c.id === activeConversationId;
        const isUnread = hasUnread(c);
        const timeAgo = getTimeAgo(c.lastMessageAt);
        
        return (
          <div
            key={c.id}
            className={`conversation-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
            onClick={() => setActiveConversationId(c.id)}
          >
            <div className="d-flex align-items-center">
              <div className="user-avatar me-3">
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-fill" style={{ minWidth: 0 }}>
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>
                    {displayName}
                  </div>
                  {timeAgo && (
                    <div className="small text-muted ms-2" style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                      {timeAgo}
                    </div>
                  )}
                </div>
                <div className="d-flex align-items-center">
                  <div className={`last-message text-truncate ${isUnread ? 'fw-semibold text-dark' : 'text-muted'}`}>
                    {c.lastMessage || 'Start a conversation'}
                  </div>
                  {isUnread && (
                    <div className="unread-dot ms-2"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {loadingMoreConversations && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      
      {!hasMoreConversations && conversations.length > 0 && (
        <div className="text-center py-2 text-muted small">
          No more conversations
        </div>
      )}
    </div>
  );
}
