import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '../../../components/AdminDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import { db, signInWithBackendSession } from '../../../services/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';

const AdminDashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrainers: 0,
    totalTrainees: 0,
    activeUsers: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(BACKEND_ROUTES_API + 'GetAdminStats.php', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.message || 'Failed to fetch statistics');
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

    // Listen for unread messages directly from Firebase Firestore
    useEffect(() => {
      let unsubUser = () => {};
      let unsubConv = () => {};
      let isMounted = true;
      
      const setupFirebaseAndListen = async () => {
        try {
          const { user } = await signInWithBackendSession();
          if (user && isMounted) {
            let blockedUsers = [];
            
            // Listen to user document to keep blocked users up to date
            const userRef = doc(db, 'users', user.uid);
            unsubUser = onSnapshot(userRef, (userSnap) => {
              if (userSnap.exists()) {
                blockedUsers = userSnap.data().blocked || [];
              }
            });

            const convRef = collection(db, 'conversations');
            const q = query(
              convRef, 
              where('participants', 'array-contains', user.uid)
            );
            
            unsubConv = onSnapshot(q, (snap) => {
              let count = 0;
              snap.forEach(d => {
                const cv = d.data();
                const senderStr = String(cv.lastMessageSenderId);
                
                if (blockedUsers.includes(senderStr) || blockedUsers.includes(Number(senderStr))) {
                  return;
                }

                const isUnread = cv.lastMessage && 
                                 cv.lastMessageSenderId && 
                                 String(cv.lastMessageSenderId) !== String(user.uid) &&
                                 (!cv.lastMessageReadBy || !cv.lastMessageReadBy.includes(user.uid));
                if (isUnread) {
                  count++;
                }
              });
              setStats(prev => ({ ...prev, unreadMessages: count }));
            });
          }
        } catch (e) {
          console.error("Failed to connect to messages", e);
        }
      };
      
      setupFirebaseAndListen();
      
      return () => {
        isMounted = false;
        unsubUser();
        unsubConv();
      };
    }, []);

    return (
      <AdminDashboardLayout>
        <div className="admin-page">
          {/* Header */}
          <div className="admin-page-header">
            <div>
              <h2 className="admin-page-title">Admin Dashboard</h2>
              <p className="admin-page-subtitle">Overview of your platform</p>
            </div>
          </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger mb-4" style={{
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: '#ef4444'
          }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border" style={{ color: '#10b981' }} role="status">
              <span className="visually-hidden">Loading statistics...</span>
            </div>
          </div>
        ) : (
          <>
        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Total Users</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{stats.totalUsers}</h3>
                    <small style={{ color: '#10b981' }}>
                      <i className="bi bi-arrow-up"></i> All users
                    </small>
                  </div>
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <i className="bi bi-people fs-4" style={{ color: '#10b981' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Trainers</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{stats.totalTrainers}</h3>
                    <small style={{ color: '#10b981' }}>
                      <i className="bi bi-person-badge"></i> Active trainers
                    </small>
                  </div>
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <i className="bi bi-person-badge fs-4" style={{ color: '#10b981' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Trainees</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{stats.totalTrainees}</h3>
                    <small style={{ color: '#10b981' }}>
                      <i className="bi bi-person"></i> Active trainees
                    </small>
                  </div>
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <i className="bi bi-person fs-4" style={{ color: '#10b981' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Active Users</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{stats.activeUsers}</h3>
                    <small style={{ color: '#10b981' }}>
                      <i className="bi bi-activity"></i> Last 30 days
                    </small>
                  </div>
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <i className="bi bi-activity fs-4" style={{ color: '#10b981' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row">
          <div className="col-lg-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body p-4">
                <h5 className="mb-4" style={{ color: '#fff' }}>Quick Actions</h5>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <button
                      className="btn w-100 text-start p-3"
                      style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#fff', borderRadius: '8px' }}
                      onClick={() => navigate('/admin/users')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.borderColor = '#10b981';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                          <i className="bi bi-people fs-5" style={{ color: '#10b981' }}></i>
                        </div>
                        <div>
                          <div className="fw-bold">User Management</div>
                          <small style={{ color: '#9ca3af' }}>Manage all system users</small>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <button
                      className="btn w-100 text-start p-3"
                      style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#fff', borderRadius: '8px' }}
                      onClick={() => navigate('/admin/email-marketing')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.borderColor = '#10b981';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                          <i className="bi bi-envelope fs-5" style={{ color: '#10b981' }}></i>
                        </div>
                        <div>
                          <div className="fw-bold">Email Marketing</div>
                          <small style={{ color: '#9ca3af' }}>Manage campaigns and audiences</small>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="col-md-4 mb-3">
                    <button
                      className="btn w-100 text-start p-3"
                      style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#fff', borderRadius: '8px' }}
                      onClick={() => navigate('/admin/messages')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.borderColor = '#10b981';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                          <i className="bi bi-chat-dots fs-5" style={{ color: '#10b981' }}></i>
                        </div>
                        <div>
                            <div className="fw-bold d-flex align-items-center">
                              Messages
                              {stats.unreadMessages > 0 ? (
                                <span className="badge rounded-pill ms-2 text-bg-danger" style={{ fontSize: '0.7em' }}>
                                  {stats.unreadMessages} {stats.unreadMessages === 1 ? 'new person' : 'new people'}
                                </span>
                              ) : (
                                <span className="badge rounded-pill ms-2" style={{ fontSize: '0.7em', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                  0 new
                                </span>
                              )}
                            </div>
                          <small style={{ color: '#9ca3af' }}>View and manage conversations</small>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body p-4">
                <div className="text-center">
                  <i className="bi bi-shield-check fs-1 mb-3" style={{ color: '#10b981' }}></i>
                  <h4 style={{ color: '#fff' }}>Welcome to Admin Panel</h4>
                  <p style={{ color: '#9ca3af' }}>
                    You have full control over the CoachFlow platform. Manage users, monitor activities, and configure system settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboardHome;
