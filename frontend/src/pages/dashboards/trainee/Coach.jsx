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
      <div className="text-center py-5" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem', padding: '3rem' }}>
        <i className="bi bi-person-plus fs-1 d-block mb-3" style={{ color: 'rgba(32, 214, 87, 0.6)' }}></i>
        <p className="mt-2 mb-4" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>No coach assigned yet</p>
        <button className="btn btn-lg" style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 2rem', borderRadius: '0.5rem' }} onClick={() => navigate('/trainee-dashboard/find-trainer')}>
          <i className="bi bi-search me-2"></i>Find a Trainer
        </button>
      </div>
    );

    return (
      <div>
        {/* Main Coach Card */}
        <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
          <div className="card-body" style={{ padding: '2rem' }}>
            <div className="d-flex align-items-start gap-4">
              {/* Avatar Section */}
              <div className="text-center" style={{ minWidth: '120px' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '100px', height: '100px', background: 'rgba(32, 214, 87, 0.2)', border: '2px solid rgba(32, 214, 87, 0.4)', fontSize: '3rem' }}>
                  {currentCoach.avatar || currentCoach.name?.charAt(0) || 'C'}
                </div>
                <div className="d-flex align-items-center justify-content-center gap-1" style={{ background: 'rgba(255, 193, 7, 0.15)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                  <i className="bi bi-star-fill" style={{ color: '#ffc107' }}></i>
                  <span className="fw-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>{currentCoach.average_rating || '5.0'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>({currentCoach.review_count || '1'} reviews)</span>
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h3 className="mb-2" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>{currentCoach.name}</h3>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-award" style={{ color: 'rgba(32, 214, 87, 0.8)' }}></i>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{currentCoach.specializations || 'Personal Trainer'}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="badge mb-2" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(32, 214, 87, 0.4)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                      <i className="bi bi-check-circle me-1"></i>ACTIVE
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div style={{ background: 'rgba(30, 35, 30, 0.5)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                      <small className="d-block mb-1" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Connected Since</small>
                      <strong style={{ color: 'rgba(255,255,255,0.95)' }}>{currentCoach.connected_since || 'Recently'}</strong>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div style={{ background: 'rgba(30, 35, 30, 0.5)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                      <small className="d-block mb-1" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</small>
                      <strong style={{ color: 'rgba(32, 214, 87, 0.9)' }}>Active</strong>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div style={{ background: 'rgba(30, 35, 30, 0.5)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                      <small className="d-block mb-1" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Rating</small>
                      <strong style={{ color: 'rgba(255,255,255,0.95)' }}>{currentCoach.average_rating || '5.0'} / 5.0</strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button className="btn" style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', flex: 1 }}>
                    <i className="bi bi-chat-dots me-2"></i>Send Message
                  </button>
                  <button className="btn" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }} onClick={() => navigate(`/trainee-dashboard/coach-review/${currentCoach.id}`)}>
                    <i className="bi bi-star me-2"></i>Edit Review
                  </button>
                  <button className="btn" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}>
                    <i className="bi bi-gear"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Relationship Settings Card */}
        <div className="card" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
          <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.1)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0', padding: '1rem 1.5rem' }}>
            <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>
              <i className="bi bi-gear me-2"></i>Relationship Settings
            </h6>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>Manage your coaching relationship and preferences</p>
            <button className="btn btn-sm" style={{ background: 'rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.4)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem', padding: '0.5rem 1rem' }}>
              <i className="bi bi-x-circle me-2"></i>End Coaching Relationship
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCoachSearch = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>Find Your Trainer</h4>
        <button className="btn" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }} onClick={() => setHasCoach(true)}>
          <i className="bi bi-arrow-left me-2"></i>Back to My Coach
        </button>
      </div>

      <div className="text-center py-5" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem', padding: '4rem 2rem' }}>
        <i className="bi bi-search-heart fs-1 mb-3 d-block" style={{ color: 'rgba(32, 214, 87, 0.8)' }}></i>
        <h5 className="mb-3" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '600' }}>Looking for a trainer?</h5>
        <p className="mb-4" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '500px', margin: '0 auto 2rem' }}>Browse through our verified trainers and find the perfect match for your fitness goals</p>
        <button 
          className="btn btn-lg"
          style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(255,255,255,0.9)', padding: '0.75rem 2rem', borderRadius: '0.5rem' }}
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
      <div className="container-fluid px-3 px-md-4 py-3" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '100vh', paddingBottom: '100px' }}>
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'rgba(32, 214, 87, 0.8)' }} role="status"><span className="visually-hidden">Loading...</span></div>
            <p className="mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>Loading coach data...</p>
          </div>
        )}

        {error && (
          <div className="alert" style={{ background: 'rgba(220, 53, 69, 0.2)', border: '1px solid rgba(220, 53, 69, 0.3)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.75rem' }} role="alert">{error}</div>
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
