import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import TraineeDashboard from '../../../components/TraineeDashboard';

const TrainerProfile = () => {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    if (trainerId) {
      fetchTrainerProfile();
      fetchTrainerReviews();
    }
  }, [trainerId]);

  const fetchTrainerProfile = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}GetUserProfile.php?user_id=${trainerId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTrainer(data.user);
      }
    } catch (error) {
      console.error('Error fetching trainer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainerReviews = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}GetReviews.php?user_id=${trainerId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}SendCoachingRequest.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: trainerId,
          message: requestMessage
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowRequestModal(false);
        alert('Request sent successfully!');
        navigate('/trainee-dashboard/my-requests');
      } else {
        alert(result.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Failed to send request');
    }
  };

  if (loading) {
    return (
      <TraineeDashboard>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </TraineeDashboard>
    );
  }

  if (!trainer) {
    return (
      <TraineeDashboard>
        <div className="text-center py-5">
          <h4>Trainer not found</h4>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/trainee-dashboard/find-trainer')}>
            Back to Find Trainers
          </button>
        </div>
      </TraineeDashboard>
    );
  }

  return (
    <TraineeDashboard>
      <div className="container-fluid px-4 py-4">
        {/* Back Button */}
        <button 
          className="btn btn-link text-decoration-none mb-3 p-0"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>

        {/* Profile Header */}
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-start mb-4">
                  <div className="me-4">
                    {trainer.imageid ? (
                      <img 
                        src={`/uploads/profile_pictures/${trainer.imageid}`} 
                        alt={trainer.full_name} 
                        className="rounded-circle" 
                        width="120" 
                        height="120"
                        style={{objectFit: 'cover'}}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                        style={{width: '120px', height: '120px', fontSize: '3rem'}}
                      >
                        {trainer.full_name?.charAt(0) || trainer.username?.charAt(0) || 'T'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow-1">
                    <h2 className="mb-2">{trainer.full_name || trainer.username}</h2>
                    <p className="text-muted mb-3">
                      <i className="bi bi-award me-2"></i>
                      {trainer.specializations || 'Personal Trainer'}
                    </p>
                    
                    {trainer.years_of_experience > 0 && (
                      <p className="mb-2">
                        <i className="bi bi-clock-history me-2"></i>
                        {trainer.years_of_experience} {trainer.years_of_experience === 1 ? 'year' : 'years'} of experience
                      </p>
                    )}
                    
                    {reviews.length > 0 && (
                      <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-star-fill text-warning me-2"></i>
                        <span className="fw-bold me-2">
                          {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                        </span>
                        <span className="text-muted">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                      </div>
                    )}

                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowRequestModal(true)}
                    >
                      <i className="bi bi-send me-2"></i>
                      Send Connection Request
                    </button>
                  </div>
                </div>

                {/* Bio */}
                {trainer.bio && trainer.bio.trim() && (
                  <div className="mb-4">
                    <h5 className="mb-3">About</h5>
                    <p className="text-secondary">{trainer.bio}</p>
                  </div>
                )}

                {/* Certifications */}
                {trainer.certifications && trainer.certifications.trim() && (
                  <div className="mb-4">
                    <h5 className="mb-3">Certifications</h5>
                    <div className="d-flex flex-wrap gap-2">
                      {trainer.certifications.split(',').map((cert, index) => (
                        <span key={index} className="badge bg-light text-dark border px-3 py-2">
                          {cert.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(trainer.instagram || trainer.facebook || trainer.linkedin || trainer.website) && (
                  <div className="mb-4">
                    <h5 className="mb-3">Connect</h5>
                    <div className="d-flex gap-3">
                      {trainer.instagram && (
                        <a href={trainer.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-instagram me-2"></i>Instagram
                        </a>
                      )}
                      {trainer.facebook && (
                        <a href={trainer.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-facebook me-2"></i>Facebook
                        </a>
                      )}
                      {trainer.linkedin && (
                        <a href={trainer.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-linkedin me-2"></i>LinkedIn
                        </a>
                      )}
                      {trainer.website && (
                        <a href={trainer.website} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-globe me-2"></i>Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0">
                    <i className="bi bi-star me-2"></i>
                    Reviews ({reviews.length})
                  </h5>
                </div>
                <div className="card-body">
                  {reviews.map((review, index) => (
                    <div key={index} className={`pb-3 mb-3 ${index < reviews.length - 1 ? 'border-bottom' : ''}`}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{review.reviewer_name}</strong>
                          <div className="mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <i 
                                key={star} 
                                className={`bi bi-star${star <= review.rating ? '-fill' : ''} text-warning`}
                              ></i>
                            ))}
                          </div>
                        </div>
                        <small className="text-muted">
                          {new Date(review.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      {review.review_text && (
                        <p className="text-secondary mb-0">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0 fw-semibold">
                  <i className="bi bi-info-circle me-2"></i>
                  Quick Info
                </h6>
              </div>
              <div className="card-body">
                {trainer.email && (
                  <div className="mb-3">
                    <small className="text-muted d-block">Email</small>
                    <div className="fw-semibold">{trainer.email}</div>
                  </div>
                )}
                
                {trainer.phone && (
                  <div className="mb-3">
                    <small className="text-muted d-block">Phone</small>
                    <div className="fw-semibold">{trainer.phone}</div>
                  </div>
                )}
                
                <div className="mb-0">
                  <small className="text-muted d-block">Member Since</small>
                  <div className="fw-semibold">
                    {new Date(parseInt(trainer.registrationdate) * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Send Connection Request</h5>
                  <button className="btn-close" onClick={() => setShowRequestModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted mb-3">
                    Send a request to connect with <strong>{trainer.full_name || trainer.username}</strong>
                  </p>
                  <div className="mb-3">
                    <label className="form-label">Message (Required)</label>
                    <textarea 
                      className="form-control" 
                      rows="4"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Introduce yourself and explain why you'd like to work with this trainer..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSendRequest}>
                    <i className="bi bi-send me-2"></i>
                    Send Request
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

export default TrainerProfile;
