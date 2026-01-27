import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import TraineeDashboard from '../../../components/TraineeDashboard';

const Coach = () => {
  const [hasCoach, setHasCoach] = useState(true);
  const [currentCoach, setCurrentCoach] = useState(null);
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoachData();
  }, []);

  const fetchCoachData = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${BACKEND_ROUTES_API}GetCoachData.php`, { credentials: 'include' });
      const data = await resp.json();
      if (data.success) {
        setCurrentCoach(data.currentCoach || null);
        setAvailableCoaches(data.availableCoaches || []);
      } else {
        setError(data.message || 'Failed to load coach data');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load coach data');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const renderCurrentCoach = () => {
    if (!currentCoach) return (
      <div className="text-center py-4">
        <i className="bi bi-person-plus text-muted fs-1"></i>
        <p className="text-muted mt-2">No coach assigned yet</p>
        <button className="btn btn-primary" onClick={() => navigate('/trainee-dashboard/find-trainer')}>Find a Trainer</button>
      </div>
    );

    return (
      <div>
        <div className="row mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-start">
                  <div className="text-center me-4">
                    <div className="fs-1 mb-2">{currentCoach.avatar}</div>
                    <div className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-star-fill text-warning me-1"></i>
                      <span className="fw-bold">{currentCoach.average_rating}</span>
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h4 className="mb-1">{currentCoach.name}</h4>
                        <p className="text-muted mb-2">{currentCoach.specializations}</p>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-success mb-2">Active</span>
                        <br />
                        <span className="fw-bold text-primary">${currentCoach.hourly_rate}/hr</span>
                      </div>
                    </div>

                    <p className="mb-3">{currentCoach.bio}</p>

                    <div className="d-flex gap-2">
                      <button className="btn btn-primary flex-fill">Hire Coach</button>
                      <button className="btn btn-outline-primary">View</button>
                      <button className="btn btn-outline-secondary">Message</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">Quick Stats</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">Sessions Completed: <strong>24</strong></div>
                <div className="mb-3">Response Time: <strong>&lt; 2 hours</strong></div>
                <div className="mb-3">Next Session: <strong>Tomorrow 6PM</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCoachSearch = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Find Your Trainer</h4>
        <button className="btn btn-outline-secondary" onClick={() => setHasCoach(true)}>
          <i className="bi bi-arrow-left me-2"></i>Back to My Coach
        </button>
      </div>

      <div className="text-center py-5">
        <i className="bi bi-search-heart fs-1 text-primary mb-3 d-block"></i>
        <h5 className="mb-3">Looking for a trainer?</h5>
        <p className="text-muted mb-4">Browse through our verified trainers and find the perfect match for your fitness goals</p>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/trainee-dashboard/find-trainer')}
        >
          <i className="bi bi-search me-2"></i>
          Browse Trainers
        </button>
      </div>
    </div>
  );

  return (
    <TraineeDashboard>
      <div className="container-fluid px-4 py-3" style={{ paddingBottom: '100px' }}>
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            <p className="mt-3 text-muted">Loading coach data...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">{error}</div>
        )}

        {!loading && !error && (
          <>
            {hasCoach ? renderCurrentCoach() : renderCoachSearch()}
          </>
        )}
      </div>
    </TraineeDashboard>
  );
};

export default Coach;
