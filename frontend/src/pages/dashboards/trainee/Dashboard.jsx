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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch published programs (limit 6, prioritize featured) and popular coaches
      const programsData = await APIClient.get(
        `${BACKEND_ROUTES_API}GetPrograms.php?type=marketplace&limit=6&sort_by=popular`
      );

      const coachesData = await APIClient.get(
        `${BACKEND_ROUTES_API}GetPopularCoaches.php`
      );

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
          {/* Welcome Section */}
          <div className="row mb-4">
        <div className="col-12">
          <div className="bg-gradient-primary text-white rounded p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="row align-items-center">
              <div className="col-md-8">
                <h2 className="mb-2">Welcome to Your Fitness Journey! 🎯</h2>
                <p className="mb-3 lead">Discover premium workout plans and connect with top coaches to achieve your fitness goals.</p>
                <button className="btn btn-light btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Start Your Journey
                </button>
              </div>
              <div className="col-md-4 text-center">
                <div className="fs-1">🏃‍♂️</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-primary fs-1 mb-2">⚡</div>
              <h5 className="card-title">4</h5>
              <p className="card-text text-muted">Workouts This Week</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-success fs-1 mb-2">📈</div>
              <h5 className="card-title">+2.5kg</h5>
              <p className="card-text text-muted">Progress This Month</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-warning fs-1 mb-2">🔥</div>
              <h5 className="card-title">12</h5>
              <p className="card-text text-muted">Day Streak</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-info fs-1 mb-2">⏱️</div>
              <h5 className="card-title">6.5h</h5>
              <p className="card-text text-muted">Total Time</p>
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
            <button className="btn btn-outline-primary btn-sm">View All</button>
          </div>
          <div className="row">
            {popularCoaches.map(coach => (
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
                    <button className="btn btn-outline-primary w-100">
                      <i className="bi bi-chat-dots me-2"></i>
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
      </div>
    </TraineeDashboard>
  );
};

export default HomePage;
