import React, { useMemo } from 'react';
import { useChat } from '../../context/ChatProvider';

export function ConversationList() {
  const { conversations, activeConversationId, firebaseUser, allUsers, setActiveConversationId, messages } = useChat();

  const userMap = useMemo(() => {
    const map = {};
    allUsers.forEach(u => { map[String(u.id)] = u.username || u.id; });
    console.log('[ConversationList] User map created:', map);
    console.log('[ConversationList] allUsers:', allUsers);
    return map;
  }, [allUsers]);

  // Calculate unread count for each conversation
  const getUnreadCount = (conversation) => {
    if (!firebaseUser) return 0;
    // This is a simplified version - you'd need to fetch messages per conversation
    // For now, we'll use a placeholder approach
    return conversation.unreadCount || 0;
  };

  if (!conversations.length) {
    return (
      <div className="text-center text-muted py-5">
        <i className="bi bi-chat-dots display-4 d-block mb-2"></i>
        <p className="mb-0">No conversations yet</p>
        <small>Start a new conversation using the + button above</small>
      </div>
    );
  }

  return (
    <div>
      {conversations.map(c => {
        const others = (c.participants || []).filter(p => firebaseUser && String(p) !== String(firebaseUser.uid));
        const otherUid = others[0];
        console.log('[ConversationList] Conversation:', c.id, 'Other UID:', otherUid, 'Lookup result:', userMap[String(otherUid)]);
        const displayName = userMap[String(otherUid)] || otherUid || 'User';
        const unreadCount = getUnreadCount(c);
        const isActive = c.id === activeConversationId;
        const hasUnread = unreadCount > 0;
        
        return (
          <div
            key={c.id}
            className={`conversation-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}`}
            onClick={() => setActiveConversationId(c.id)}
          >
            <div className="d-flex align-items-center">
              <div className="user-avatar me-3">
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-fill" style={{ minWidth: 0 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>
                    {displayName}
                  </div>
                  {c.lastMessageAt && (
                    <div className="small text-muted ms-2" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(c.lastMessageAt.toDate()).toLocaleDateString() === new Date().toLocaleDateString()
                        ? new Date(c.lastMessageAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(c.lastMessageAt.toDate()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <div className="last-message text-truncate">
                  {c.lastMessage || 'Start a conversation'}
                </div>
              </div>
            </div>
            {hasUnread && (
              <div className="unread-badge">{unreadCount}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
