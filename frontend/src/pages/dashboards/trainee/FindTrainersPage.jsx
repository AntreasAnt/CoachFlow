import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TraineeDashboard from '../../../components/TraineeDashboard';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const FindTrainersPage = () => {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    message: '',
    experienceLevel: '',
    goals: ''
  });
  const [sendingRequest, setSendingRequest] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    minRating: 0,
    maxRate: '',
    minRate: '',
    experienceLevel: '',
    verified: false,
    sortBy: 'rating'
  });
  
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    fetchTrainers();
  }, [appliedFilters]);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (appliedFilters.search) params.append('search', appliedFilters.search);
      if (appliedFilters.specialization) params.append('specialization', appliedFilters.specialization);
      if (appliedFilters.minRating > 0) params.append('minRating', appliedFilters.minRating);
      if (appliedFilters.maxRate) params.append('maxRate', appliedFilters.maxRate);
      if (appliedFilters.minRate) params.append('minRate', appliedFilters.minRate);
      if (appliedFilters.experienceLevel) params.append('experienceLevel', appliedFilters.experienceLevel);
      if (appliedFilters.verified) params.append('verified', 'true');
      params.append('sortBy', appliedFilters.sortBy);
      
      const response = await APIClient.get(
        `${BACKEND_ROUTES_API}GetAvailableTrainers.php?${params.toString()}`
      );
      
      if (response.success) {
        setTrainers(response.trainers || []);
      } else {
        setError(response.message || 'Failed to load trainers');
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Failed to load trainers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      specialization: '',
      minRating: 0,
      maxRate: '',
      minRate: '',
      experienceLevel: '',
      verified: false,
      sortBy: 'rating'
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setShowFilterModal(false);
  };

  const handleRequestConnection = (trainer) => {
    setSelectedTrainer(trainer);
    setRequestForm({
      message: '',
      experienceLevel: '',
      goals: ''
    });
    setShowRequestModal(true);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    
    if (!selectedTrainer) return;
    
    try {
      setSendingRequest(true);
      
      const response = await APIClient.post(
        `${BACKEND_ROUTES_API}SendCoachingRequest.php`,
        {
          trainerId: selectedTrainer.id,
          message: requestForm.message,
          experienceLevel: requestForm.experienceLevel,
          goals: requestForm.goals
        }
      );
      
      if (response.success) {
        setNotification({ show: true, message: 'Connection request sent successfully!', type: 'success' });
        setShowRequestModal(false);
        fetchTrainers(); // Refresh to update connection status
      } else {
        setNotification({ show: true, message: response.message || 'Failed to send request', type: 'danger' });
      }
    } catch (err) {
      console.error('Error sending request:', err);
      setNotification({ show: true, message: 'Failed to send request. Please try again.', type: 'danger' });
    } finally {
      setSendingRequest(false);
    }
  };

  const getConnectionStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge bg-success">Connected</span>;
      case 'pending':
        return <span className="badge bg-warning">Request Pending</span>;
      default:
        return null;
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

  if (loading && trainers.length === 0) {
    return (
      <TraineeDashboard>
        <div className="container-fluid p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading trainers...</p>
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
            <h2 className="mb-1">Find Your Trainer</h2>
            <p className="text-muted mb-0">Connect with professional trainers</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by name, specialization, or keywords..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyFilters();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => {
                    setFilters({ ...filters, sortBy: e.target.value });
                    setAppliedFilters({ ...appliedFilters, sortBy: e.target.value });
                  }}
                >
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="experience">Most Experienced</option>
                  <option value="clients">Most Popular</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <div className="col-md-3 d-flex gap-2">
                <button
                  className="btn btn-primary flex-fill"
                  onClick={handleApplyFilters}
                >
                  <i className="bi bi-search me-2"></i>
                  Search
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setShowFilterModal(true)}
                >
                  <i className="bi bi-funnel"></i>
                </button>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(appliedFilters.specialization || appliedFilters.minRating > 0 || 
              appliedFilters.experienceLevel || appliedFilters.verified) && (
              <div className="mt-3 d-flex flex-wrap gap-2">
                <small className="text-muted me-2">Active filters:</small>
                {appliedFilters.specialization && (
                  <span className="badge bg-primary">
                    {appliedFilters.specialization}
                    <i 
                      className="bi bi-x ms-1" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const newFilters = { ...appliedFilters, specialization: '' };
                        setFilters(newFilters);
                        setAppliedFilters(newFilters);
                      }}
                    ></i>
                  </span>
                )}
                {appliedFilters.minRating > 0 && (
                  <span className="badge bg-primary">
                    {appliedFilters.minRating}+ stars
                    <i 
                      className="bi bi-x ms-1" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const newFilters = { ...appliedFilters, minRating: 0 };
                        setFilters(newFilters);
                        setAppliedFilters(newFilters);
                      }}
                    ></i>
                  </span>
                )}
                {appliedFilters.experienceLevel && (
                  <span className="badge bg-primary">
                    {appliedFilters.experienceLevel}
                    <i 
                      className="bi bi-x ms-1" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const newFilters = { ...appliedFilters, experienceLevel: '' };
                        setFilters(newFilters);
                        setAppliedFilters(newFilters);
                      }}
                    ></i>
                  </span>
                )}
                {appliedFilters.verified && (
                  <span className="badge bg-primary">
                    Verified only
                    <i 
                      className="bi bi-x ms-1" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const newFilters = { ...appliedFilters, verified: false };
                        setFilters(newFilters);
                        setAppliedFilters(newFilters);
                      }}
                    ></i>
                  </span>
                )}
                <button 
                  className="btn btn-sm btn-link text-decoration-none p-0"
                  onClick={handleResetFilters}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Trainers List */}
        {trainers.length === 0 && !loading ? (
          <div className="text-center py-5">
            <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-muted">No trainers found</h5>
            <p className="text-muted">Try adjusting your filters or search criteria</p>
            <button className="btn btn-primary mt-3" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="row">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="col-lg-4 col-md-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    {/* Trainer Header */}
                    <div className="d-flex align-items-start mb-3">
                      <div 
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                        style={{ width: '60px', height: '60px', fontSize: '1.5rem', flexShrink: 0 }}
                      >
                        {trainer.profile_image ? (
                          <img 
                            src={trainer.profile_image} 
                            alt={trainer.name}
                            className="rounded-circle w-100 h-100 object-fit-cover"
                          />
                        ) : (
                          trainer.name?.charAt(0) || 'T'
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-start justify-content-between">
                          <div>
                            <h5 className="mb-1">
                              {trainer.name}
                              {trainer.verified && (
                                <i className="bi bi-patch-check-fill text-primary ms-2" title="Verified"></i>
                              )}
                            </h5>
                            <div className="mb-1">
                              {getRatingStars(trainer.average_rating || 0)}
                              <small className="text-muted ms-1">
                                ({trainer.total_reviews || 0})
                              </small>
                            </div>
                          </div>
                          {getConnectionStatusBadge(trainer.connection_status)}
                        </div>
                      </div>
                    </div>

                    {/* Specializations */}
                    {trainer.specializations && trainer.specializations.length > 0 && (
                      <div className="mb-3">
                        {trainer.specializations.slice(0, 3).map((spec, idx) => (
                          <span key={idx} className="badge bg-light text-dark me-1 mb-1">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    <p className="text-muted small mb-3" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {trainer.bio || 'No bio available'}
                    </p>

                    {/* Stats */}
                    <div className="d-flex justify-content-between text-muted small mb-3">
                      <div>
                        <i className="bi bi-briefcase me-1"></i>
                        {trainer.experience_years || 0} years
                      </div>
                      <div>
                        <i className="bi bi-people me-1"></i>
                        {trainer.current_clients || 0}/{trainer.max_clients || 0} clients
                      </div>
                    </div>

                    {/* Price */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold text-primary fs-5">
                        ${trainer.hourly_rate || 0}/hr
                      </span>
                      {!trainer.accepting_clients && (
                        <span className="badge bg-secondary">Fully Booked</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2">
                      {trainer.connection_status === 'active' ? (
                        <button className="btn btn-success flex-fill" disabled>
                          <i className="bi bi-check-circle me-2"></i>
                          Connected
                        </button>
                      ) : trainer.connection_status === 'pending' ? (
                        <button className="btn btn-warning flex-fill" disabled>
                          <i className="bi bi-clock me-2"></i>
                          Pending
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary flex-fill"
                          onClick={() => handleRequestConnection(trainer)}
                          disabled={!trainer.accepting_clients}
                        >
                          <i className="bi bi-person-plus me-2"></i>
                          Request Connection
                        </button>
                      )}
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => {/* TODO: View trainer profile */}}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && trainers.length > 0 && (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Filter Trainers</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowFilterModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Specialization */}
                <div className="mb-3">
                  <label className="form-label">Specialization</label>
                  <select
                    className="form-select"
                    value={filters.specialization}
                    onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                  >
                    <option value="">All Specializations</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Building">Muscle Building</option>
                    <option value="Strength Training">Strength Training</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Yoga">Yoga</option>
                    <option value="CrossFit">CrossFit</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Sports Performance">Sports Performance</option>
                  </select>
                </div>

                {/* Rating */}
                <div className="mb-3">
                  <label className="form-label">Minimum Rating</label>
                  <select
                    className="form-select"
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                  >
                    <option value="0">Any Rating</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-3">
                  <label className="form-label">Hourly Rate Range</label>
                  <div className="row g-2">
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Min"
                        value={filters.minRate}
                        onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Max"
                        value={filters.maxRate}
                        onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Experience Level */}
                <div className="mb-3">
                  <label className="form-label">Experience Level</label>
                  <select
                    className="form-select"
                    value={filters.experienceLevel}
                    onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                  >
                    <option value="">Any Experience</option>
                    <option value="beginner">2+ Years (Beginner)</option>
                    <option value="intermediate">5+ Years (Intermediate)</option>
                    <option value="expert">10+ Years (Expert)</option>
                  </select>
                </div>

                {/* Verified Only */}
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="verifiedOnly"
                    checked={filters.verified}
                    onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="verifiedOnly">
                    Verified trainers only
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetFilters}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Connection Modal */}
      {showRequestModal && selectedTrainer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSendRequest}>
                <div className="modal-header">
                  <h5 className="modal-title">Request Connection</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowRequestModal(false)}
                    disabled={sendingRequest}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3 text-center">
                    <div 
                      className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-2"
                      style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                    >
                      {selectedTrainer.name?.charAt(0) || 'T'}
                    </div>
                    <h5>{selectedTrainer.name}</h5>
                    <p className="text-muted">${selectedTrainer.hourly_rate}/hr</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Your Fitness Experience Level <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={requestForm.experienceLevel}
                      onChange={(e) => setRequestForm({ ...requestForm, experienceLevel: e.target.value })}
                      required
                    >
                      <option value="">Select your level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Your Goals <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="What are you looking to achieve? (e.g., weight loss, muscle gain, general fitness)"
                      value={requestForm.goals}
                      onChange={(e) => setRequestForm({ ...requestForm, goals: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Tell the trainer why you'd like to work with them..."
                      value={requestForm.message}
                      onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    The trainer will review your request and respond within 24-48 hours.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRequestModal(false)}
                    disabled={sendingRequest}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingRequest}
                  >
                    {sendingRequest ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{zIndex: 9999}}>
          <div className={`toast show align-items-center text-white bg-${notification.type} border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <i className={`bi bi-${
                  notification.type === 'success' ? 'check-circle' : 
                  notification.type === 'danger' ? 'x-circle' : 
                  'exclamation-triangle'
                } me-2`}></i>
                {notification.message}
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white me-2 m-auto" 
                onClick={() => setNotification({ show: false, message: '', type: '' })}
              ></button>
            </div>
          </div>
        </div>
      )}
    </TraineeDashboard>
  );
};

export default FindTrainersPage;
