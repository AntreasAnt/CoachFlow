import React, { useState, useEffect } from 'react';
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

  const renderCurrentCoach = () => {
    if (!currentCoach) return (
      <div className="text-center py-4">
        <i className="bi bi-person-plus text-muted fs-1"></i>
        <p className="text-muted mt-2">No coach assigned yet</p>
        <button className="btn btn-primary" onClick={() => setHasCoach(false)}>Find a Coach</button>
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
        <h4 className="mb-0">Available Coaches</h4>
        <button className="btn btn-outline-secondary" onClick={() => setHasCoach(true)}>
          <i className="bi bi-arrow-left me-2"></i>Back to My Coach
        </button>
      </div>

      <div className="row">
        {availableCoaches.map(coach => (
          <div key={coach.id} className="col-lg-4 col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className="fs-1 mb-2">{coach.avatar}</div>
                <h5 className="card-title">{coach.name}</h5>
                <p className="text-muted small">{coach.specialization}</p>
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-primary flex-fill">Hire</button>
                  <button className="btn btn-outline-primary">View</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-4">
        <button className="btn btn-outline-primary">Load More Coaches</button>
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
