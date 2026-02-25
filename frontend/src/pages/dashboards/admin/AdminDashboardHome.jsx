import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '../../../components/AdminDashboardLayout';

const AdminDashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrainers: 0,
    totalTrainees: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // You can fetch real stats here later
    // For now using placeholder data
    setStats({
      totalUsers: 247,
      totalTrainers: 56,
      totalTrainees: 178,
      activeUsers: 189
    });
  }, []);

  return (
    <AdminDashboardLayout>
      <div style={{ color: '#fff' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-1 fw-bold" style={{ color: '#fff' }}>Admin Dashboard</h2>
          <p style={{ color: '#9ca3af' }}>Overview of your platform</p>
        </div>

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
                  <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
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
                  <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
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
                  <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
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
                  <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
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
                        <div className="rounded-circle p-2 me-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
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
                      style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#fff', borderRadius: '8px', opacity: 0.5 }}
                      disabled
                    >
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle p-2 me-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                          <i className="bi bi-envelope fs-5" style={{ color: '#10b981' }}></i>
                        </div>
                        <div>
                          <div className="fw-bold">Email Marketing</div>
                          <small style={{ color: '#9ca3af' }}>Coming soon</small>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="col-md-4 mb-3">
                    <button
                      className="btn w-100 text-start p-3"
                      style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#fff', borderRadius: '8px', opacity: 0.5 }}
                      disabled
                    >
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle p-2 me-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                          <i className="bi bi-gear fs-5" style={{ color: '#10b981' }}></i>
                        </div>
                        <div>
                          <div className="fw-bold">System Settings</div>
                          <small style={{ color: '#9ca3af' }}>Coming soon</small>
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
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboardHome;
