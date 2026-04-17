import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const TrainerDashboardHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    clientGrowth: 0,
    activePrograms: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalSales: 0,
    pendingRequests: 0,
    unreadMessages: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topPrograms, setTopPrograms] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerDashboardStats.php`);
      if (statsResponse.success) {
        setStats(statsResponse.stats || stats);
        setRecentActivity(statsResponse.recentActivity || []);
        setTopPrograms(statsResponse.topPrograms || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <TrainerDashboardLayout>
        <div className="container-fluid p-4" style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#10b981' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#fff' }}>
        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Total Clients</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{stats.totalClients}</h3>
                      <small style={{ color: stats.clientGrowth > 0 ? '#10b981' : (stats.clientGrowth < 0 ? '#ef4444' : '#9ca3af') }}>
                        {stats.totalClients > 0 ? (
                          <>
                            {stats.clientGrowth > 0 && <i className="bi bi-arrow-up"></i>}
                            {stats.clientGrowth < 0 && <i className="bi bi-arrow-down"></i>}
                            {stats.clientGrowth === 0 && <i className="bi bi-dash"></i>}
                            {' '}{Math.abs(stats.clientGrowth)}% this month
                          </>
                        ) : "No clients yet"}
                    </small>
                  </div>
                  <div className="trainer-stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
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
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Monthly Revenue</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{formatCurrency(stats.monthlyRevenue)}</h3>
                      <small style={{ color: stats.revenueGrowth > 0 ? '#10b981' : (stats.revenueGrowth < 0 ? '#ef4444' : '#9ca3af') }}>
                        {stats.monthlyRevenue > 0 || stats.revenueGrowth !== 0 ? (
                          <>
                            {stats.revenueGrowth > 0 && <i className="bi bi-arrow-up"></i>}
                            {stats.revenueGrowth < 0 && <i className="bi bi-arrow-down"></i>}
                            {stats.revenueGrowth === 0 && <i className="bi bi-dash"></i>}
                            {' '}{Math.abs(stats.revenueGrowth)}% this month
                          </>
                        ) : "No revenue yet"}
                    </small>
                  </div>
                  <div className="trainer-stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <i className="bi bi-currency-dollar fs-4" style={{ color: '#10b981' }}></i>
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
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Active Programs</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{stats.activePrograms}</h3>
                    <small style={{ color: '#9ca3af' }}>Published programs</small>
                  </div>
                  <div className="trainer-stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <i className="bi bi-collection fs-4" style={{ color: '#10b981' }}></i>
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
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Total Sales</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{stats.totalSales}</h3>
                    <small style={{ color: '#9ca3af' }}>Program purchases</small>
                  </div>
                  <div className="trainer-stat-icon" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)' }}>
                    <i className="bi bi-cart-check fs-4" style={{ color: '#fbbf24' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts/Notifications */}
        <div className="row mb-4">
          {stats.pendingRequests > 0 && (
            <div className="col-lg-6 mb-3">
              <div className="alert border-0 shadow-sm mb-0" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1" style={{ color: '#fbbf24' }}>
                      <i className="bi bi-inbox me-2"></i>
                      {stats.pendingRequests} New Client Request{stats.pendingRequests !== 1 ? 's' : ''}
                    </h6>
                    <p className="mb-0 small" style={{ color: '#d1d5db' }}>
                      You have pending coaching requests waiting for review
                    </p>
                  </div>
                  <button
                    className="btn"
                    style={{ backgroundColor: '#fbbf24', color: '#1a1a1a' }}
                    onClick={() => navigate('/clients?tab=requests')}
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          )}

          {stats.unreadMessages > 0 && (
            <div className="col-lg-6 mb-3">
              <div className="alert border-0 shadow-sm mb-0" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1" style={{ color: '#10b981' }}>
                      <i className="bi bi-chat-dots me-2"></i>
                      {stats.unreadMessages} Unread Message{stats.unreadMessages !== 1 ? 's' : ''}
                    </h6>
                    <p className="mb-0 small" style={{ color: '#d1d5db' }}>
                      Clients are waiting for your response
                    </p>
                  </div>
                  <button
                    className="btn"
                    style={{ backgroundColor: '#10b981', color: '#fff' }}
                    onClick={() => navigate('/messages')}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="row">
          {/* Recent Activity */}
          <div className="col-lg-8 mb-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h5 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Recent Activity</h5>
              </div>
              <div className="card-body">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-activity fs-1 mb-3 d-block" style={{ color: '#6b7280' }}></i>
                    <p style={{ color: '#9ca3af' }}>No recent activity</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="list-group-item border-0 px-0" style={{ backgroundColor: 'transparent' }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex align-items-start">
                            <div className="trainer-activity-icon me-3" style={{ backgroundColor: activity.type === 'sale' ? 'rgba(16, 185, 129, 0.2)' : activity.type === 'client' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}>
                              <i className={`bi bi-${activity.type === 'sale' ? 'cart-check' : activity.type === 'client' ? 'person-plus' : 'chat-dots'}`} style={{ color: activity.type === 'sale' ? '#10b981' : activity.type === 'client' ? '#3b82f6' : '#10b981' }}></i>
                            </div>
                            <div>
                              <h6 className="mb-1" style={{ color: '#fff' }}>{activity.title}</h6>
                              <small style={{ color: '#9ca3af' }}>{activity.description}</small>
                            </div>
                          </div>
                          <small style={{ color: '#9ca3af' }}>{activity.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Top Programs */}
          <div className="col-lg-4">
            {/* Quick Actions */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h6 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Quick Actions</h6>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    className="btn text-start"
                    style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                    onClick={() => navigate('/programs')}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Create New Program
                  </button>
                  <button
                    className="btn text-start"
                    style={{ backgroundColor: 'transparent', color: '#10b981', border: '1px solid #10b981' }}
                    onClick={() => navigate('/clients')}
                  >
                    <i className="bi bi-people me-2"></i>
                    View Clients
                  </button>
                  <button
                    className="btn text-start"
                    style={{ backgroundColor: 'transparent', color: '#10b981', border: '1px solid #10b981' }}
                    onClick={() => navigate('/payments')}
                  >
                    <i className="bi bi-credit-card me-2"></i>
                    View Earnings
                  </button>
                  <button
                    className="btn text-start"
                    style={{ backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' }}
                    onClick={() => navigate('/profile')}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Top Programs */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h6 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Top Selling Programs</h6>
              </div>
              <div className="card-body">
                {topPrograms.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="small mb-0" style={{ color: '#9ca3af' }}>No sales yet</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {topPrograms.slice(0, 5).map((program, index) => (
                      <div key={index} className="list-group-item border-0 px-0" style={{ backgroundColor: 'transparent' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-0 small" style={{ color: '#fff' }}>{program.title}</h6>
                            <small style={{ color: '#9ca3af' }}>{program.sales} sales</small>
                          </div>
                          <span className="badge" style={{ backgroundColor: '#10b981', color: '#fff' }}>{formatCurrency(program.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerDashboardHome;
