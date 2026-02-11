import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signInWithBackendSession } from '../services/firebase';

const TraineeHeader = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

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
        // Check if conversation has unread messages:
        // 1. There is a last message
        // 2. The last message was sent by someone else
        // 3. Current user hasn't read it (not in lastMessageReadBy array)
        if (conv.lastMessage && 
            conv.lastMessageSenderId && 
            conv.lastMessageSenderId !== firebaseUser.uid &&
            (!conv.lastMessageReadBy || !conv.lastMessageReadBy.includes(firebaseUser.uid))) {
          totalUnread++;
        }
      });
      setUnreadCount(totalUnread);
    });
    
    return () => unsub();
  }, [firebaseUser]);

  return (
    <header style={{ backgroundColor: 'rgba(15, 20, 15, 0.95)', borderBottom: '1px solid rgba(32, 214, 87, 0.2)', boxShadow: '0 2px 16px rgba(0, 0, 0, 0.3)' }}>
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h4 mb-0 fw-bold" style={{ color: 'var(--brand-white)' }}>CoachFlow</h1>
            <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>Welcome back, Trainee!</p>
          </div>
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <button 
              className="btn btn-sm"
              onClick={() => navigate('/trainee-dashboard/analytics')}
              onMouseEnter={() => setHoveredBtn('analytics')}
              onMouseLeave={() => setHoveredBtn(null)}
              title="Analytics"
              style={{
                backgroundColor: hoveredBtn === 'analytics' ? 'rgba(32, 214, 87, 0.1)' : 'transparent',
                color: 'var(--brand-primary)',
                border: hoveredBtn === 'analytics' ? '1px solid rgba(32, 214, 87, 0.6)' : '1px solid rgba(32, 214, 87, 0.3)',
                borderRadius: '10px',
                padding: '0.5rem 0.75rem',
                transform: hoveredBtn === 'analytics' ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="bi bi-graph-up"></i>
            </button>
            <button 
              className="btn btn-sm position-relative"
              onClick={() => navigate('/messages')}
              onMouseEnter={() => setHoveredBtn('messages')}
              onMouseLeave={() => setHoveredBtn(null)}
              title="Messages"
              style={{
                backgroundColor: hoveredBtn === 'messages' ? 'rgba(32, 214, 87, 0.1)' : 'transparent',
                color: 'var(--brand-primary)',
                border: hoveredBtn === 'messages' ? '1px solid rgba(32, 214, 87, 0.6)' : '1px solid rgba(32, 214, 87, 0.3)',
                borderRadius: '10px',
                padding: '0.5rem 0.75rem',
                transform: hoveredBtn === 'messages' ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="bi bi-chat-dots"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill" style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-dark)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                  <span className="visually-hidden">unread messages</span>
                </span>
              )}
            </button>
            <button 
              className="btn btn-sm"
              onClick={() => navigate('/profile')}
              onMouseEnter={() => setHoveredBtn('profile')}
              onMouseLeave={() => setHoveredBtn(null)}
              title="Profile"
              style={{
                backgroundColor: hoveredBtn === 'profile' ? 'rgba(32, 214, 87, 0.1)' : 'transparent',
                color: 'var(--brand-primary)',
                border: hoveredBtn === 'profile' ? '1px solid rgba(32, 214, 87, 0.6)' : '1px solid rgba(32, 214, 87, 0.3)',
                borderRadius: '10px',
                padding: '0.5rem 0.75rem',
                transform: hoveredBtn === 'profile' ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.2s ease'
              }}
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
