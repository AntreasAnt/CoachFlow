import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import TraineeDashboard from '../../../components/TraineeDashboard';
import APIClient from '../../../utils/APIClient';

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredPrograms, setFeaturedPrograms] = useState([]);
  const [popularCoaches, setPopularCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightValue, setWeightValue] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [stats, setStats] = useState({
    current_weight: null,
    weight_change: null,
    change_type: 'neutral',
    workouts_this_week: 0,
    current_streak: 0,
    total_time_hours: 0
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats, programs, and coaches
      const [statsData, programsData, coachesData] = await Promise.all([
        APIClient.get(`${BACKEND_ROUTES_API}GetHomeStats.php`),
        APIClient.get(`${BACKEND_ROUTES_API}GetPrograms.php?type=marketplace&limit=6&sort_by=popular`),
        APIClient.get(`${BACKEND_ROUTES_API}GetPopularCoaches.php`)
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
      }

      if (programsData.success) {
        setFeaturedPrograms(programsData.programs || []);
      }

      if (coachesData.success) {
        setPopularCoaches(coachesData.coaches || []);
      }

    } catch (err) {
      console.error('Error fetching homepage data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogWeight = async () => {
    if (!weightValue || weightValue <= 0) {
      setNotification({ show: true, message: 'Please enter a valid weight', type: 'warning' });
      return;
    }

    try {
      setSavingWeight(true);
      const response = await fetch(`${BACKEND_ROUTES_API}QuickLogWeight.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parseFloat(weightValue) })
      });

      const data = await response.json();
      if (data.success) {
        setStats(prev => ({
          ...prev,
          current_weight: data.data.current_weight,
          weight_change: data.data.weight_change,
          change_type: data.data.change_type
        }));
        setShowWeightModal(false);
        setWeightValue('');
        
        let message = 'Weight logged successfully!';
        if (data.data.weight_change) {
          const change = Math.abs(data.data.weight_change);
          if (data.data.change_type === 'gain') {
            message += ` You gained ${change}kg from your last measurement.`;
          } else if (data.data.change_type === 'loss') {
            message += ` You lost ${change}kg from your last measurement.`;
          }
        }
        setNotification({ show: true, message, type: 'success' });
      } else {
        setNotification({ show: true, message: data.message || 'Failed to log weight', type: 'danger' });
      }
    } catch (error) {
      console.error('Error logging weight:', error);
      setNotification({ show: true, message: 'Failed to log weight', type: 'danger' });
    } finally {
      setSavingWeight(false);
    }
  };

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  return (
    <TraineeDashboard>
      <div className="container-fluid px-4 py-3">
      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchData}>
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your fitness dashboard...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          {/* Welcome Section with Quick Actions */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="bg-gradient-primary text-white rounded p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h2 className="mb-2">Ready to Train? 💪</h2>
                    <p className="mb-3 lead">Quick actions to get started with your fitness journey today.</p>
                    <div className="d-flex gap-3 flex-wrap">
                      <button 
                        className="btn btn-light btn-lg"
                        onClick={() => navigate('/trainee-dashboard/workouts')}
                      >
                        <i className="bi bi-play-circle me-2"></i>
                        Start Workout
                      </button>
                      <button 
                        className="btn btn-outline-light btn-lg"
                        onClick={() => setShowWeightModal(true)}
                      >
                        <i className="bi bi-speedometer me-2"></i>
                        Log Weight
                      </button>
                    </div>
                  </div>
                  <div className="col-md-4 text-center">
                    <div className="fs-1">🏃‍♂️</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Toast */}
          {notification.show && (
            <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
              <div className={`alert alert-${notification.type} alert-dismissible fade show`} role="alert">
                {notification.message}
                <button type="button" className="btn-close" onClick={() => setNotification({ show: false, message: '', type: '' })}></button>
              </div>
            </div>
          )}

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-primary fs-1 mb-2">⚡</div>
              <h5 className="card-title">{stats.workouts_this_week}</h5>
              <p className="card-text text-muted">Workouts This Week</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className={`fs-1 mb-2 ${stats.change_type === 'gain' ? 'text-success' : stats.change_type === 'loss' ? 'text-info' : 'text-muted'}`}>
                {stats.change_type === 'gain' ? '📈' : stats.change_type === 'loss' ? '📉' : '➖'}
              </div>
              <h5 className="card-title">
                {stats.current_weight ? `${stats.current_weight}kg` : '-'}
              </h5>
              <p className="card-text text-muted">
                {stats.weight_change ? (
                  stats.change_type === 'gain' ? `+${stats.weight_change}kg` : `${stats.weight_change}kg`
                ) : 'Current Weight'}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-warning fs-1 mb-2">🔥</div>
              <h5 className="card-title">{stats.current_streak}</h5>
              <p className="card-text text-muted">Day Streak</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-info fs-1 mb-2">⏱️</div>
              <h5 className="card-title">{stats.total_time_hours}h</h5>
              <p className="card-text text-muted">Time This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-built Workout Plans */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">🏆 Latest Workout Programs</h4>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate('/trainee-dashboard/marketplace')}
            >
              View All Programs
            </button>
          </div>
          <div className="row">
            {featuredPrograms.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                <p className="text-muted mt-3">No featured programs available yet.</p>
              </div>
            ) : (
              featuredPrograms.map(program => (
                <div key={program.id} className="col-lg-4 col-md-6 mb-3">
                  <div className="card h-100 border-0 shadow-sm hover-shadow">
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title mb-0">{program.title}</h5>
                          {program.is_featured && (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-star-fill"></i> Featured
                            </span>
                          )}
                        </div>
                        <p className="card-text text-muted small">{program.description?.substring(0, 100)}...</p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="badge bg-light text-dark">
                          {program.duration_weeks} weeks
                        </span>
                        <span className="badge bg-light text-dark">
                          {program.difficulty_level}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-star-fill text-warning me-1"></i>
                          <small>{program.rating_average || '5.0'} ({program.rating_count || 0})</small>
                        </div>
                        <small className="text-muted">{program.purchase_count || 0} purchases</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <small className="text-muted">by {program.trainer_name || 'Coach'}</small>
                        <span className="fw-bold text-primary">${program.price}</span>
                      </div>
                      <button 
                        className="btn btn-primary w-100"
                        onClick={() => navigate(`/trainee-dashboard/marketplace?programId=${program.id}`)}
                      >
                        <i className="bi bi-eye me-2"></i>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Popular Coaches */}
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">⭐ Popular Coaches</h4>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate('/trainee-dashboard/find-trainer')}
            >
              View All
            </button>
          </div>
          <div className="row">
            {popularCoaches.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="bi bi-people fs-1 text-muted mb-3 d-block"></i>
                <h5 className="text-muted mb-3">Find Your Perfect Trainer</h5>
                <p className="text-muted mb-4">Connect with professional trainers to reach your fitness goals</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/trainee-dashboard/find-trainer')}
                >
                  <i className="bi bi-search me-2"></i>
                  Browse Trainers
                </button>
              </div>
            ) : (
              popularCoaches.map(coach => (
                <div key={coach.id} className="col-lg-4 col-md-6 mb-3">
                  <div className="card h-100 border-0 shadow-sm hover-shadow">
                    <div className="card-body text-center">
                      <div className="fs-1 mb-3">{coach.avatar}</div>
                      <h5 className="card-title">{coach.name}</h5>
                      <p className="text-muted mb-2">{coach.specialization}</p>
                      <div className="d-flex justify-content-center align-items-center mb-2">
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        <span className="me-3">{coach.rating}</span>
                        <i className="bi bi-people me-1"></i>
                        <span>{coach.clients} clients</span>
                      </div>
                      <p className="fw-bold text-primary mb-3">{coach.price}</p>
                      <button 
                        className="btn btn-outline-primary w-100"
                        onClick={() => navigate('/trainee-dashboard/find-trainer')}
                      >
                        <i className="bi bi-person-plus me-2"></i>
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Weight Logging Modal */}
      {showWeightModal && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Log Your Weight</h5>
                <button className="btn-close" onClick={() => setShowWeightModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Weight (kg)</label>
                  <input 
                    type="number" 
                    className="form-control form-control-lg"
                    placeholder="Enter your weight in kg"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogWeight()}
                    autoFocus
                    step="0.1"
                    min="0"
                  />
                  <small className="text-muted">Your weight will be tracked over time to show your progress</small>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowWeightModal(false)}
                  disabled={savingWeight}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleLogWeight}
                  disabled={savingWeight}
                >
                  {savingWeight ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Log Weight
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </TraineeDashboard>
  );
};

export default HomePage;
