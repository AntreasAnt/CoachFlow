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
  const [quickFoodLog, setQuickFoodLog] = useState({ meal: '', calories: '' });
  const [loggingFood, setLoggingFood] = useState(false);

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

  const handleQuickLogFood = async () => {
    if (!quickFoodLog.meal || !quickFoodLog.calories) {
      setNotification({ show: true, message: 'Please enter meal name and calories', type: 'warning' });
      return;
    }

    try {
      setLoggingFood(true);
      // TODO: Replace with actual API endpoint when available
      // Simulating API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNotification({ show: true, message: `${quickFoodLog.meal} logged successfully! (${quickFoodLog.calories} cal)`, type: 'success' });
      setQuickFoodLog({ meal: '', calories: '' });
    } catch (error) {
      console.error('Error logging food:', error);
      setNotification({ show: true, message: 'Failed to log food', type: 'danger' });
    } finally {
      setLoggingFood(false);
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
      <div className="container-fluid px-3 px-md-4 py-3" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '100vh' }}>
      {/* Error State */}
      {error && (
        <div className="alert alert-danger rounded-4" role="alert" style={{ border: '1px solid rgba(220, 53, 69, 0.3)', backgroundColor: 'rgba(220, 53, 69, 0.1)' }}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-sm ms-3" 
            onClick={fetchData}
            style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-dark)', border: 'none' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: 'var(--brand-primary)', width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading your fitness dashboard...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          {/* Hero: Welcome + Quick Actions */}
          <div className="row mb-4">
            <div className="col-12">
              <div 
                className="rounded-4 p-4 p-md-5" 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(32, 214, 87, 0.15) 0%, rgba(15, 20, 15, 0.8) 100%)',
                  border: '1px solid rgba(32, 214, 87, 0.3)',
                  boxShadow: '0 8px 32px rgba(32, 214, 87, 0.2)'
                }}
              >
                <h2 className="mb-2" style={{ color: 'var(--brand-white)', fontWeight: '700', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
                  Welcome Back! 💪
                </h2>
                <p className="mb-4" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1rem, 2vw, 1.1rem)' }}>
                  Ready to crush your fitness goals today?
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <button 
                    className="btn btn-lg rounded-pill px-4"
                    onClick={() => navigate('/trainee-dashboard/workouts')}
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--brand-dark)',
                      border: 'none',
                      fontWeight: '600',
                      boxShadow: '0 4px 16px rgba(32, 214, 87, 0.3)'
                    }}
                  >
                    <i className="bi bi-play-circle-fill me-2"></i>
                    Start Workout
                  </button>
                  <button 
                    className="btn btn-lg rounded-pill px-4"
                    onClick={() => document.getElementById('quick-food-section')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--brand-primary)',
                      border: '2px solid var(--brand-primary)',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-egg-fried me-2"></i>
                    Log Food
                  </button>
                  <button 
                    className="btn btn-lg rounded-pill px-4"
                    onClick={() => setShowWeightModal(true)}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--brand-primary)',
                      border: '2px solid var(--brand-primary)',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-speedometer me-2"></i>
                    Log Weight
                  </button>
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

          {/* Row 1: Today's Workout Card (large) + Quick Stats */}
          <div className="row mb-4">
            {/* Today's Workout Card */}
            <div className="col-lg-8 mb-3 mb-lg-0">
              <div 
                className="card border-0 rounded-4 h-100" 
                style={{ 
                  backgroundColor: 'rgba(15, 20, 15, 0.6)',
                  border: '1px solid rgba(32, 214, 87, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 style={{ color: 'var(--brand-white)', fontWeight: '700' }}>Today's Workout</h4>
                      <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>Upper Body Strength</p>
                    </div>
                    <span className="badge rounded-pill px-3 py-2" style={{ backgroundColor: 'rgba(32, 214, 87, 0.2)', color: 'var(--brand-primary)' }}>
                      Week 2, Day 3
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-clock me-2" style={{ color: 'var(--brand-primary)' }}></i>
                        <span style={{ color: 'var(--text-primary)' }}>45 min</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-fire me-2" style={{ color: 'var(--brand-primary)' }}></i>
                        <span style={{ color: 'var(--text-primary)' }}>~350 cal</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-lightning-charge-fill me-2" style={{ color: 'var(--brand-primary)' }}></i>
                        <span style={{ color: 'var(--text-primary)' }}>Intermediate</span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h6 style={{ color: 'var(--brand-white)', fontSize: '0.9rem', fontWeight: '600' }}>Exercises:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {['Bench Press', 'Shoulder Press', 'Bent Over Row', 'Bicep Curls', 'Tricep Dips'].map((exercise, idx) => (
                          <span key={idx} className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)', padding: '0.5rem 1rem' }}>
                            {exercise}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-3">
                    <button 
                      className="btn rounded-pill px-4 flex-grow-1"
                      onClick={() => navigate('/trainee-dashboard/workouts')}
                      style={{
                        backgroundColor: 'var(--brand-primary)',
                        color: 'var(--brand-dark)',
                        border: 'none',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-play-circle-fill me-2"></i>
                      Start Workout
                    </button>
                    <button 
                      className="btn rounded-pill px-4"
                      onClick={() => navigate('/trainee-dashboard/workouts')}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--brand-primary)',
                        border: '1px solid var(--brand-primary)',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-eye me-2"></i>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="col-lg-4">
              <div className="row h-100">
                <div className="col-6 col-lg-12 mb-3">
                  <div 
                    className="card border-0 rounded-4 text-center h-100" 
                    style={{ 
                      backgroundColor: 'rgba(15, 20, 15, 0.6)',
                      border: '1px solid rgba(32, 214, 87, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div className="card-body py-3">
                      <div className="mb-2" style={{ fontSize: '1.8rem' }}>⚖️</div>
                      <h4 className="mb-1" style={{ color: 'var(--brand-primary)', fontWeight: '700' }}>
                        {stats.current_weight ? `${stats.current_weight}kg` : '-'}
                      </h4>
                      <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {stats.weight_change ? `${stats.change_type === 'gain' ? '+' : ''}${stats.weight_change}kg` : 'Current Weight'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-lg-12 mb-3">
                  <div 
                    className="card border-0 rounded-4 text-center h-100" 
                    style={{ 
                      backgroundColor: 'rgba(15, 20, 15, 0.6)',
                      border: '1px solid rgba(32, 214, 87, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div className="card-body py-3">
                      <div className="mb-2" style={{ fontSize: '1.8rem' }}>🔥</div>
                      <h4 className="mb-1" style={{ color: 'var(--brand-primary)', fontWeight: '700' }}>{stats.current_streak}</h4>
                      <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Day Streak</p>
                    </div>
                  </div>
                </div>
                <div className="col-12 d-none d-lg-block">
                  <div 
                    className="card border-0 rounded-4 text-center h-100" 
                    style={{ 
                      backgroundColor: 'rgba(15, 20, 15, 0.6)',
                      border: '1px solid rgba(32, 214, 87, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div className="card-body py-3">
                      <div className="mb-2" style={{ fontSize: '1.8rem' }}>⚡</div>
                      <h4 className="mb-1" style={{ color: 'var(--brand-primary)', fontWeight: '700' }}>{stats.workouts_this_week}</h4>
                      <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Workouts This Week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Quick Log Food Section */}
          <div id="quick-food-section" className="row mb-4">
            <div className="col-12">
              <div 
                className="card border-0 rounded-4" 
                style={{ 
                  backgroundColor: 'rgba(15, 20, 15, 0.6)',
                  border: '1px solid rgba(32, 214, 87, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="card-body p-4">
                  <h4 className="mb-3" style={{ color: 'var(--brand-white)', fontWeight: '700' }}>
                    <i className="bi bi-egg-fried me-2" style={{ color: 'var(--brand-primary)' }}></i>
                    Quick Log Food
                  </h4>
                  <div className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Meal / Food Item</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g., Chicken Breast, Oatmeal"
                        value={quickFoodLog.meal}
                        onChange={(e) => setQuickFoodLog(prev => ({ ...prev, meal: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(247, 255, 247, 0.05)',
                          border: '1px solid rgba(74, 74, 90, 0.3)',
                          color: 'var(--brand-white)',
                          padding: '0.75rem',
                          borderRadius: '12px'
                        }}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Calories</label>
                      <input 
                        type="number" 
                        className="form-control"
                        placeholder="e.g., 250"
                        value={quickFoodLog.calories}
                        onChange={(e) => setQuickFoodLog(prev => ({ ...prev, calories: e.target.value }))}
                        style={{
                          backgroundColor: 'rgba(247, 255, 247, 0.05)',
                          border: '1px solid rgba(74, 74, 90, 0.3)',
                          color: 'var(--brand-white)',
                          padding: '0.75rem',
                          borderRadius: '12px'
                        }}
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end gap-2">
                      <button 
                        className="btn rounded-pill px-4 flex-grow-1"
                        onClick={handleQuickLogFood}
                        disabled={loggingFood}
                        style={{
                          backgroundColor: 'var(--brand-primary)',
                          color: 'var(--brand-dark)',
                          border: 'none',
                          fontWeight: '600',
                          padding: '0.75rem'
                        }}
                      >
                        {loggingFood ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Logging...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-plus-circle me-2"></i>
                            Log Food
                          </>
                        )}
                      </button>
                      <button 
                        className="btn rounded-pill px-4"
                        onClick={() => navigate('/trainee-dashboard/nutrition')}
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--brand-primary)',
                          border: '1px solid var(--brand-primary)',
                          fontWeight: '600',
                          padding: '0.75rem'
                        }}
                      >
                        <i className="bi bi-journal-text"></i>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-4">
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Today's Calories: </span>
                      <span style={{ color: 'var(--brand-primary)', fontWeight: '700' }}>1,850 / 2,200</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Protein: </span>
                      <span style={{ color: 'var(--brand-primary)', fontWeight: '700' }}>85g / 150g</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Active Program Progress */}
          <div className="row mb-4">
            <div className="col-12">
              <div 
                className="card border-0 rounded-4" 
                style={{ 
                  backgroundColor: 'rgba(15, 20, 15, 0.6)',
                  border: '1px solid rgba(32, 214, 87, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h4 style={{ color: 'var(--brand-white)', fontWeight: '700' }}>Active Program</h4>
                      <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>12-Week Muscle Building Program</p>
                    </div>
                    <button 
                      className="btn btn-sm rounded-pill"
                      onClick={() => navigate('/trainee-dashboard/my-plans')}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--brand-primary)',
                        border: '1px solid var(--brand-primary)',
                        fontWeight: '500'
                      }}
                    >
                      View All Programs
                    </button>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-8 mb-3 mb-md-0">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Overall Progress</span>
                          <span style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>18%</span>
                        </div>
                        <div style={{ 
                          height: '12px', 
                          backgroundColor: 'rgba(74, 74, 90, 0.3)', 
                          borderRadius: '10px', 
                          overflow: 'hidden' 
                        }}>
                          <div style={{ 
                            width: '18%', 
                            height: '100%', 
                            background: 'linear-gradient(90deg, var(--brand-primary) 0%, rgba(32, 214, 87, 0.7) 100%)',
                            transition: 'width 0.5s ease'
                          }}></div>
                        </div>
                      </div>
                      
                      <div className="row g-3">
                        <div className="col-4">
                          <div className="text-center p-3 rounded-3" style={{ backgroundColor: 'rgba(32, 214, 87, 0.1)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                            <h5 style={{ color: 'var(--brand-primary)', fontWeight: '700', marginBottom: '0.25rem' }}>15 / 84</h5>
                            <small style={{ color: 'var(--text-secondary)' }}>Workouts Done</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="text-center p-3 rounded-3" style={{ backgroundColor: 'rgba(32, 214, 87, 0.1)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                            <h5 style={{ color: 'var(--brand-primary)', fontWeight: '700', marginBottom: '0.25rem' }}>2 / 12</h5>
                            <small style={{ color: 'var(--text-secondary)' }}>Weeks Done</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="text-center p-3 rounded-3" style={{ backgroundColor: 'rgba(32, 214, 87, 0.1)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                            <h5 style={{ color: 'var(--brand-primary)', fontWeight: '700', marginBottom: '0.25rem' }}>10</h5>
                            <small style={{ color: 'var(--text-secondary)' }}>Weeks Left</small>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="d-flex flex-column h-100 justify-content-center">
                        <button 
                          className="btn rounded-pill mb-2"
                          onClick={() => navigate('/trainee-dashboard/workouts')}
                          style={{
                            backgroundColor: 'var(--brand-primary)',
                            color: 'var(--brand-dark)',
                            border: 'none',
                            fontWeight: '600',
                            padding: '0.75rem'
                          }}
                        >
                          <i className="bi bi-play-circle-fill me-2"></i>
                          Continue Program
                        </button>
                        <button 
                          className="btn rounded-pill"
                          onClick={() => navigate('/trainee-dashboard/analytics')}
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--brand-primary)',
                            border: '1px solid var(--brand-primary)',
                            fontWeight: '600',
                            padding: '0.75rem'
                          }}
                        >
                          <i className="bi bi-graph-up me-2"></i>
                          View Progress
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Recent Activity Timeline */}
          <div className="row mb-4">
            <div className="col-12">
              <div 
                className="card border-0 rounded-4" 
                style={{ 
                  backgroundColor: 'rgba(15, 20, 15, 0.6)',
                  border: '1px solid rgba(32, 214, 87, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="card-body p-4">
                  <h4 className="mb-4" style={{ color: 'var(--brand-white)', fontWeight: '700' }}>Recent Activity</h4>
                  
                  <div className="activity-timeline">
                    {[
                      { icon: 'bi-trophy-fill', color: 'var(--brand-primary)', title: 'Completed Upper Body Workout', time: '2 hours ago', detail: 'Great job! 45 minutes, 350 calories burned' },
                      { icon: 'bi-egg-fried', color: '#FFA500', title: 'Logged Lunch', time: '4 hours ago', detail: 'Grilled chicken with rice - 650 calories' },
                      { icon: 'bi-speedometer', color: '#4A9DFF', title: 'Weight Update', time: 'Yesterday', detail: 'New weight: 78.5kg (-0.5kg)' },
                      { icon: 'bi-fire', color: '#FF4444', title: '7 Day Streak!', time: 'Yesterday', detail: 'Keep up the momentum!' }
                    ].map((activity, idx) => (
                      <div key={idx} className="d-flex gap-3 mb-4" style={{ position: 'relative' }}>
                        <div 
                          className="d-flex align-items-center justify-content-center flex-shrink-0" 
                          style={{ 
                            width: '48px', 
                            height: '48px', 
                            backgroundColor: `${activity.color}20`,
                            border: `2px solid ${activity.color}`,
                            borderRadius: '12px'
                          }}
                        >
                          <i className={`bi ${activity.icon}`} style={{ color: activity.color, fontSize: '1.2rem' }}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="mb-0" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>{activity.title}</h6>
                            <small style={{ color: 'var(--text-secondary)' }}>{activity.time}</small>
                          </div>
                          <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{activity.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center mt-3">
                    <button 
                      className="btn btn-sm rounded-pill"
                      onClick={() => navigate('/trainee-dashboard/analytics')}
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--brand-primary)',
                        border: '1px solid rgba(32, 214, 87, 0.3)',
                        fontWeight: '500',
                        padding: '0.5rem 1.5rem'
                      }}
                    >
                      View Full Activity History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Marketplace Programs (smaller priority) */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>Explore More Programs</h5>
                <button 
                  className="btn btn-sm rounded-pill"
                  onClick={() => navigate('/trainee-dashboard/marketplace')}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--brand-primary)',
                    border: '1px solid var(--brand-primary)',
                    fontWeight: '500'
                  }}
                >
                  Browse All
                </button>
              </div>
              <div className="row">
                {featuredPrograms.slice(0, 3).map(program => (
                  <div key={program.id} className="col-lg-4 col-md-6 mb-3">
                    <div 
                      className="card h-100 border-0 rounded-4" 
                      style={{
                        backgroundColor: 'rgba(15, 20, 15, 0.6)',
                        border: '1px solid rgba(74, 74, 90, 0.3)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = 'var(--brand-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(74, 74, 90, 0.3)';
                      }}
                    >
                      <div className="card-body p-3">
                        <h6 className="mb-2" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>{program.title}</h6>
                        <div className="d-flex gap-2 mb-2">
                          <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)', fontSize: '0.75rem' }}>
                            {program.duration_weeks}w
                          </span>
                          <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)', fontSize: '0.75rem' }}>
                            {program.difficulty_level}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small style={{ color: 'var(--text-secondary)' }}>
                            <i className="bi bi-star-fill me-1" style={{ color: 'var(--brand-primary)' }}></i>
                            {program.rating_average || '5.0'}
                          </small>
                          <span className="fw-bold" style={{ color: 'var(--brand-primary)' }}>${program.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Weight Logging Modal */}
      {showWeightModal && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content rounded-4 border-0" 
              style={{
                backgroundColor: 'rgba(15, 20, 15, 0.95)',
                border: '1px solid rgba(32, 214, 87, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="modal-header border-0">
                <h5 className="modal-title" style={{ color: 'var(--brand-white)', fontWeight: '700' }}>Log Your Weight</h5>
                <button 
                  className="btn-close" 
                  onClick={() => setShowWeightModal(false)}
                  style={{ filter: 'invert(1)' }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Weight (kg)</label>
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
                    style={{
                      backgroundColor: 'rgba(247, 255, 247, 0.05)',
                      border: '1px solid rgba(74, 74, 90, 0.3)',
                      color: 'var(--brand-white)',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px'
                    }}
                  />
                  <small style={{ color: 'var(--text-secondary)' }}>Your weight will be tracked over time to show your progress</small>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn rounded-pill px-4" 
                  onClick={() => setShowWeightModal(false)}
                  disabled={savingWeight}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(74, 74, 90, 0.3)'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn rounded-pill px-4"
                  onClick={handleLogWeight}
                  disabled={savingWeight}
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--brand-dark)',
                    border: 'none',
                    fontWeight: '600'
                  }}
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
