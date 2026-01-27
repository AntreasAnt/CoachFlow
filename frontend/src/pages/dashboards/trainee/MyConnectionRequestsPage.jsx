import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TraineeDashboard from '../../../components/TraineeDashboard';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const MyConnectionRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await APIClient.get(
        `${BACKEND_ROUTES_API}GetTraineeCoachingRequests.php`
      );
      
      if (response.success) {
        setRequests(response.requests || []);
      } else {
        setError(response.message || 'Failed to load requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning">Pending</span>;
      case 'accepted':
        return <span className="badge bg-success">Accepted</span>;
      case 'declined':
        return <span className="badge bg-danger">Declined</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="bi bi-star-fill text-warning"></i>);
    }
    if (hasHalfStar) {
      stars.push(<i key="half" className="bi bi-star-half text-warning"></i>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<i key={`empty-${i}`} className="bi bi-star text-warning"></i>);
    }
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <TraineeDashboard>
        <div className="container-fluid p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your requests...</p>
          </div>
        </div>
      </TraineeDashboard>
    );
  }

  return (
    <TraineeDashboard>
      <div className="container-fluid p-4" style={{ paddingBottom: '100px' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">My Connection Requests</h2>
            <p className="text-muted mb-0">Track your trainer connection requests</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/trainee-dashboard/find-trainer')}
          >
            <i className="bi bi-search me-2"></i>
            Find Trainers
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-muted mb-3">No connection requests yet</h5>
            <p className="text-muted mb-4">Start by finding a trainer that matches your fitness goals</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/trainee-dashboard/find-trainer')}
            >
              <i className="bi bi-search me-2"></i>
              Browse Trainers
            </button>
          </div>
        ) : (
          <div className="row">
            {requests.map((request) => (
              <div key={request.id} className="col-lg-6 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    {/* Header with status */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-start">
                        <div 
                          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                          style={{ width: '50px', height: '50px', fontSize: '1.25rem', flexShrink: 0 }}
                        >
                          {request.profile_image ? (
                            <img 
                              src={request.profile_image} 
                              alt={request.trainer_name}
                              className="rounded-circle w-100 h-100 object-fit-cover"
                            />
                          ) : (
                            request.trainer_name?.charAt(0) || 'T'
                          )}
                        </div>
                        <div>
                          <h5 className="mb-1">{request.trainer_name}</h5>
                          <div className="mb-1">
                            {getRatingStars(request.average_rating || 0)}
                          </div>
                          <p className="text-muted small mb-0">
                            ${request.hourly_rate || 0}/hr
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Specializations */}
                    {request.specializations && request.specializations.length > 0 && (
                      <div className="mb-3">
                        {request.specializations.slice(0, 3).map((spec, idx) => (
                          <span key={idx} className="badge bg-light text-dark me-1 mb-1">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Request Details */}
                    <div className="mb-3">
                      <div className="small text-muted mb-2">
                        <i className="bi bi-clock me-1"></i>
                        Requested: {formatDate(request.created_at)}
                      </div>
                      
                      {request.processed_at && (
                        <div className="small text-muted mb-2">
                          <i className="bi bi-check-circle me-1"></i>
                          {request.status === 'accepted' ? 'Accepted' : 'Declined'}: {formatDate(request.processed_at)}
                        </div>
                      )}

                      <div className="small mb-2">
                        <strong>Experience Level:</strong> {request.experience_level}
                      </div>

                      {request.goals && (
                        <div className="small mb-2">
                          <strong>Your Goals:</strong>
                          <p className="mb-0 text-muted">{request.goals}</p>
                        </div>
                      )}

                      {request.message && (
                        <div className="small">
                          <strong>Your Message:</strong>
                          <p className="mb-0 text-muted">{request.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions based on status */}
                    <div className="d-flex gap-2">
                      {request.status === 'pending' && (
                        <div className="alert alert-info w-100 mb-0 py-2">
                          <i className="bi bi-hourglass-split me-2"></i>
                          <small>Waiting for trainer's response</small>
                        </div>
                      )}
                      
                      {request.status === 'accepted' && (
                        <>
                          <button 
                            className="btn btn-success flex-fill"
                            onClick={() => navigate('/coach')}
                          >
                            <i className="bi bi-person-check me-2"></i>
                            View Coach
                          </button>
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => navigate('/messages')}
                          >
                            <i className="bi bi-chat-dots"></i>
                          </button>
                        </>
                      )}
                      
                      {request.status === 'declined' && (
                        <button 
                          className="btn btn-outline-primary w-100"
                          onClick={() => navigate('/trainee-dashboard/find-trainer')}
                        >
                          <i className="bi bi-search me-2"></i>
                          Find Another Trainer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TraineeDashboard>
  );
};

export default MyConnectionRequestsPage;
