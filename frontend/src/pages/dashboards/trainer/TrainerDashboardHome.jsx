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
    activePrograms: 0,
    monthlyRevenue: 0,
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
      currency: 'USD'
    }).format(amount || 0);
  };

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
      <div className="container p-4" style={{ minHeight: 'calc(100vh - 0px)' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-1">Welcome Back! 👋</h2>
          <p className="text-muted">Here's what's happening with your coaching business</p>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Total Clients</p>
                    <h3 className="mb-0">{stats.totalClients}</h3>
                    <small className="text-success">
                      <i className="bi bi-arrow-up"></i> 12% this month
                    </small>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-people text-primary fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Monthly Revenue</p>
                    <h3 className="mb-0">{formatCurrency(stats.monthlyRevenue)}</h3>
                    <small className="text-success">
                      <i className="bi bi-arrow-up"></i> 8% this month
                    </small>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-currency-dollar text-success fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Active Programs</p>
                    <h3 className="mb-0">{stats.activePrograms}</h3>
                    <small className="text-muted">Published programs</small>
                  </div>
                  <div className="bg-info bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-collection text-info fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Total Sales</p>
                    <h3 className="mb-0">{stats.totalSales}</h3>
                    <small className="text-muted">Program purchases</small>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-cart-check text-warning fs-4"></i>
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
              <div className="alert alert-warning border-0 shadow-sm mb-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="alert-heading mb-1">
                      <i className="bi bi-inbox me-2"></i>
                      {stats.pendingRequests} New Client Request{stats.pendingRequests !== 1 ? 's' : ''}
                    </h6>
                    <p className="mb-0 small">
                      You have pending coaching requests waiting for review
                    </p>
                  </div>
                  <button
                    className="btn btn-warning"
                    onClick={() => navigate('/trainer-dashboard/clients')}
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          )}

          {stats.unreadMessages > 0 && (
            <div className="col-lg-6 mb-3">
              <div className="alert alert-info border-0 shadow-sm mb-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="alert-heading mb-1">
                      <i className="bi bi-chat-dots me-2"></i>
                      {stats.unreadMessages} Unread Message{stats.unreadMessages !== 1 ? 's' : ''}
                    </h6>
                    <p className="mb-0 small">
                      Clients are waiting for your response
                    </p>
                  </div>
                  <button
                    className="btn btn-info"
                    onClick={() => navigate('/trainer-dashboard/messages')}
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
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0">Recent Activity</h5>
              </div>
              <div className="card-body">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-activity fs-1 mb-3 d-block"></i>
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="list-group-item border-0 px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex align-items-start">
                            <div className={`rounded-circle bg-${activity.type === 'sale' ? 'success' : activity.type === 'client' ? 'primary' : 'info'} bg-opacity-10 p-2 me-3`}>
                              <i className={`bi bi-${activity.type === 'sale' ? 'cart-check' : activity.type === 'client' ? 'person-plus' : 'chat-dots'} text-${activity.type === 'sale' ? 'success' : activity.type === 'client' ? 'primary' : 'info'}`}></i>
                            </div>
                            <div>
                              <h6 className="mb-1">{activity.title}</h6>
                              <small className="text-muted">{activity.description}</small>
                            </div>
                          </div>
                          <small className="text-muted">{activity.time}</small>
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
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0">Quick Actions</h6>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary text-start"
                    onClick={() => navigate('/trainer-dashboard/programs')}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Create New Program
                  </button>
                  <button
                    className="btn btn-outline-primary text-start"
                    onClick={() => navigate('/trainer-dashboard/clients')}
                  >
                    <i className="bi bi-people me-2"></i>
                    View Clients
                  </button>
                  <button
                    className="btn btn-outline-success text-start"
                    onClick={() => navigate('/trainer-dashboard/payments')}
                  >
                    <i className="bi bi-credit-card me-2"></i>
                    View Earnings
                  </button>
                  <button
                    className="btn btn-outline-secondary text-start"
                    onClick={() => navigate('/trainer-dashboard/profile')}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Top Programs */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0">Top Selling Programs</h6>
              </div>
              <div className="card-body">
                {topPrograms.length === 0 ? (
                  <div className="text-center py-3 text-muted">
                    <p className="small mb-0">No sales yet</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {topPrograms.slice(0, 5).map((program, index) => (
                      <div key={index} className="list-group-item border-0 px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-0 small">{program.title}</h6>
                            <small className="text-muted">{program.sales} sales</small>
                          </div>
                          <span className="badge bg-success">{formatCurrency(program.revenue)}</span>
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
