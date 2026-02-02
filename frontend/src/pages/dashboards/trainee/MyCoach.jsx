import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import TraineeDashboard from '../../../components/TraineeDashboard';
import '../../../styles/CoachPage.css';

const MyCoach = () => {
  const [coach, setCoach] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoachData();
  }, []);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchCoachData = async () => {
    try {
      setLoading(true);
      
      // Fetch current coach relationship
      const resp = await fetch(`${BACKEND_ROUTES_API}GetMyCoach.php`, { 
        credentials: 'include' 
      });
      const data = await resp.json();
      
      if (data.success && data.coach) {
        // Convert string numbers to actual numbers and parse specializations
        let specializations = 'Personal Trainer';
        try {
          const specs = data.coach.specializations;
          if (specs && specs !== '[]' && specs !== '0') {
            // Try parsing as JSON first
            try {
              const parsed = JSON.parse(specs);
              if (Array.isArray(parsed) && parsed.length > 0) {
                specializations = parsed.join(', ');
              } else if (typeof specs === 'string' && specs.trim()) {
                specializations = specs;
              }
            } catch {
              // If not JSON, use as-is if not empty
              if (specs.trim()) specializations = specs;
            }
          }
        } catch (e) {
          console.error('Error parsing specializations:', e);
        }
        
        const coachData = {
          ...data.coach,
          average_rating: parseFloat(data.coach.average_rating) || 0,
          review_count: parseInt(data.coach.review_count) || 0,
          years_of_experience: parseInt(data.coach.years_of_experience) || 0,
          specializations: specializations
        };
        console.log('Coach data loaded:', coachData);
        console.log('Trainer ID:', coachData.trainer_id);
        setCoach(coachData);
        
        // Fetch my review if I've reviewed this trainer
        const reviewResp = await fetch(
          `${BACKEND_ROUTES_API}GetMyReview.php?reviewee_id=${data.coach.trainer_id}`, 
          { credentials: 'include' }
        );
        const reviewData = await reviewResp.json();
        
        if (reviewData.success && reviewData.has_reviewed) {
          setMyReview(reviewData.review);
          setRating(reviewData.review.rating);
          setReviewText(reviewData.review.review_text || '');
        }
      }
    } catch (err) {
      console.error('Error fetching coach:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageTrainer = () => {
    navigate('/messages', { state: { selectedUserId: coach.trainer_id } });
  };

  const handleDisconnect = async () => {
    if (!disconnectReason.trim()) {
      setToast({ show: true, message: 'Please provide a reason for disconnecting', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}DisconnectCoaching.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship_id: coach.relationship_id,
          reason: disconnectReason
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowDisconnectModal(false);
        setCoach(null);
        setToast({ show: true, message: 'Successfully disconnected from trainer', type: 'success' });
      } else {
        setToast({ show: true, message: result.message || 'Failed to disconnect', type: 'danger' });
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      setToast({ show: true, message: 'Failed to disconnect. Please try again.', type: 'danger' });
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setToast({ show: true, message: 'Please select a rating', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}SubmitReview.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewee_id: coach.trainer_id,
          rating: rating,
          review_text: reviewText
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowReviewModal(false);
        setMyReview({ rating, review_text: reviewText });
        setToast({ 
          show: true, 
          message: `Review ${result.action === 'created' ? 'submitted' : 'updated'} successfully!`, 
          type: 'success' 
        });
        fetchCoachData(); // Refresh to get updated rating
      } else {
        setToast({ show: true, message: result.message || 'Failed to submit review', type: 'danger' });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setToast({ show: true, message: 'Failed to submit review. Please try again.', type: 'danger' });
    }
  };

  if (loading) {
    return (
      <TraineeDashboard>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your trainer...</p>
        </div>
      </TraineeDashboard>
    );
  }

  if (!coach) {
    return (
      <TraineeDashboard>
        <div className="container-fluid px-4 py-5">
          <div className="text-center py-5">
            <i className="bi bi-person-x fs-1 text-muted mb-3 d-block"></i>
            <h4 className="mb-3">No Active Trainer</h4>
            <p className="text-muted mb-4">You don't have a trainer yet. Find one to start your fitness journey!</p>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/trainee-dashboard/find-trainer')}
            >
              <i className="bi bi-search me-2"></i>
              Find a Trainer
            </button>
          </div>
        </div>
      </TraineeDashboard>
    );
  }

  return (
    <TraineeDashboard>
      <div className="coach-page container-fluid px-4 py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">
            <i className="bi bi-person-badge me-2 text-primary"></i>
            My Trainer
          </h2>
        </div>

        {/* Main Coach Card */}
        <div className="row g-4">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                {/* Trainer Header */}
                <div className="d-flex align-items-start mb-4">
                  <div className="trainer-avatar me-4">
                    {coach.image ? (
                      <img src={coach.image} alt={coach.name} className="rounded-circle" width="100" height="100" />
                    ) : (
                      <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{width: '100px', height: '100px', fontSize: '2.5rem'}}>
                        {coach.name?.charAt(0) || 'T'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h3 className="mb-1">{coach.name || coach.username}</h3>
                        <p className="text-muted mb-2">
                          <i className="bi bi-award me-1"></i>
                          {coach.specializations || 'Personal Trainer'}
                        </p>
                        {coach.years_of_experience > 0 && (
                          <p className="text-muted small mb-2">
                            <i className="bi bi-clock-history me-1"></i>
                            {coach.years_of_experience} {coach.years_of_experience === 1 ? 'year' : 'years'} experience
                          </p>
                        )}
                      </div>
                      <div className="text-end">
                        <span className="badge bg-success-subtle text-success px-3 py-2 mb-2">
                          <i className="bi bi-check-circle me-1"></i>
                          Active
                        </span>
                        {coach.average_rating > 0 && (
                          <div className="d-flex align-items-center justify-content-end mt-2">
                            <i className="bi bi-star-fill text-warning me-1"></i>
                            <span className="fw-bold">{coach.average_rating.toFixed(1)}</span>
                            <span className="text-muted ms-1">({coach.review_count} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {coach.bio && coach.bio.trim() && (
                      <p className="mt-3 mb-0 text-secondary">{coach.bio}</p>
                    )}

                    {coach.certifications && coach.certifications.trim() && (
                      <div className="mt-3">
                        <small className="text-muted d-block mb-1">Certifications:</small>
                        <div className="d-flex flex-wrap gap-2">
                          {coach.certifications.split(',').map((cert, index) => (
                            <span key={index} className="badge bg-light text-dark border">
                              {cert.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2 flex-wrap">
                  <button 
                    className="btn btn-primary flex-grow-1"
                    onClick={handleMessageTrainer}
                  >
                    <i className="bi bi-chat-dots me-2"></i>
                    Send Message
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <i className="bi bi-star me-2"></i>
                    {myReview ? 'Edit Review' : 'Rate Trainer'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-md-4">
            {/* Connection Info */}
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0 fw-semibold">
                  <i className="bi bi-info-circle me-2"></i>
                  Connection Info
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small className="text-muted">Connected Since</small>
                  <div className="fw-semibold">{new Date(coach.started_at).toLocaleDateString()}</div>
                </div>
                <div className="mb-3">
                  <small className="text-muted">Status</small>
                  <div><span className="badge bg-success">Active</span></div>
                </div>
              </div>
            </div>

            {/* My Review */}
            {myReview && (
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-header bg-white border-bottom">
                  <h6 className="mb-0 fw-semibold">
                    <i className="bi bi-star me-2"></i>
                    My Review
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className={`bi bi-star${star <= myReview.rating ? '-fill' : ''} text-warning`}></i>
                    ))}
                  </div>
                  {myReview.review_text && (
                    <p className="text-secondary small mb-0">{myReview.review_text}</p>
                  )}
                  <button 
                    className="btn btn-sm btn-link p-0 mt-2 text-decoration-none"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Edit review
                  </button>
                </div>
              </div>
            )}

            {/* Settings - Disconnect is here (subtle) */}
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <details className="settings-accordion">
                  <summary className="text-muted small" style={{cursor: 'pointer', userSelect: 'none'}}>
                    <i className="bi bi-gear me-2"></i>
                    Relationship Settings
                  </summary>
                  <div className="mt-3 pt-3 border-top">
                    <p className="small text-muted mb-2">
                      If you need to change trainers, you can end this coaching relationship.
                    </p>
                    <button 
                      className="btn btn-sm btn-outline-danger w-100"
                      onClick={() => setShowDisconnectModal(true)}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      End Coaching Relationship
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Disconnect Modal */}
        {showDisconnectModal && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title">End Coaching Relationship?</h5>
                  <button className="btn-close" onClick={() => setShowDisconnectModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted">
                    Are you sure you want to end your coaching relationship with <strong>{coach.name}</strong>? 
                    This action will disconnect you from your trainer.
                  </p>
                  <div className="mb-3">
                    <label className="form-label">Reason for disconnecting (required)</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={disconnectReason}
                      onChange={(e) => setDisconnectReason(e.target.value)}
                      placeholder="Please let us know why you're disconnecting..."
                    ></textarea>
                  </div>
                  <div className="alert alert-warning small mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    You can find a new trainer after disconnecting.
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button className="btn btn-secondary" onClick={() => setShowDisconnectModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleDisconnect}>
                    Confirm Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title">{myReview ? 'Edit' : 'Rate'} Your Trainer</h5>
                  <button className="btn-close" onClick={() => setShowReviewModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Rating</label>
                    <div className="star-rating-input" style={{fontSize: '2rem'}}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <i 
                          key={star}
                          className={`bi bi-star${star <= (hoverRating || rating) ? '-fill' : ''} text-warning`}
                          style={{cursor: 'pointer', marginRight: '0.25rem'}}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                        ></i>
                      ))}
                    </div>
                    {rating > 0 && (
                      <small className="text-muted">
                        {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Needs Improvement'}
                      </small>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Review (Optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="4"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this trainer..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSubmitReview}>
                    <i className="bi bi-check-lg me-2"></i>
                    {myReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="position-fixed top-0 end-0 p-3" style={{zIndex: 9999}}>
            <div className={`toast show align-items-center text-white bg-${toast.type} border-0`} role="alert">
              <div className="d-flex">
                <div className="toast-body">
                  <i className={`bi bi-${
                    toast.type === 'success' ? 'check-circle' : 
                    toast.type === 'danger' ? 'x-circle' : 
                    'exclamation-triangle'
                  } me-2`}></i>
                  {toast.message}
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white me-2 m-auto" 
                  onClick={() => setToast({ show: false, message: '', type: '' })}
                ></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TraineeDashboard>
  );
};

export default MyCoach;