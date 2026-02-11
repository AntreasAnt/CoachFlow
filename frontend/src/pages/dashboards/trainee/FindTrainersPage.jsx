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
        <div className="container-fluid p-4" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '80vh' }}>
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ color: 'var(--brand-primary)', width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading trainers...</p>
          </div>
        </div>
      </TraineeDashboard>
    );
  }

  return (
    <TraineeDashboard>
      <div className="container-fluid px-3 px-md-4 py-3" style={{ paddingBottom: '100px', backgroundColor: 'var(--brand-dark)', minHeight: '100vh' }}>
        {/* Header */}
        

        {/* Search and Filter Bar */}
        <div 
          className="card border-0 rounded-4 mb-4"
          style={{
            backgroundColor: 'rgba(15, 20, 15, 0.6)',
            border: '1px solid rgba(32, 214, 87, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: 'rgba(247, 255, 247, 0.05)', border: '1px solid rgba(74, 74, 90, 0.3)', color: 'var(--brand-primary)' }}>
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, specialization, or keywords..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyFilters();
                      }
                    }}
                    style={{
                      backgroundColor: 'rgba(247, 255, 247, 0.05)',
                      border: '1px solid rgba(74, 74, 90, 0.3)',
                      color: 'var(--brand-white)',
                      borderLeft: 'none'
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
                  style={{
                    backgroundColor: 'rgba(247, 255, 247, 0.05)',
                    border: '1px solid rgba(74, 74, 90, 0.3)',
                    color: 'var(--brand-white)',
                    borderRadius: '12px'
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
                  className="btn rounded-pill flex-fill"
                  onClick={handleApplyFilters}
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--brand-dark)',
                    border: 'none',
                    fontWeight: '600'
                  }}
                >
                  <i className="bi bi-search me-2"></i>
                  Search
                </button>
                <button
                  className="btn rounded-pill"
                  onClick={() => setShowFilterModal(true)}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--brand-primary)',
                    border: '1px solid var(--brand-primary)',
                    fontWeight: '600'
                  }}
                >
                  <i className="bi bi-funnel"></i>
                </button>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(appliedFilters.specialization || appliedFilters.minRating > 0 || 
              appliedFilters.experienceLevel || appliedFilters.verified) && (
              <div className="mt-3 d-flex flex-wrap gap-2">
                <small className="me-2" style={{ color: 'var(--text-secondary)' }}>Active filters:</small>
                {appliedFilters.specialization && (
                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.2)', color: 'var(--brand-primary)' }}>
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
                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.2)', color: 'var(--brand-primary)' }}>
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
          <div className="alert rounded-4" role="alert" style={{ border: '1px solid rgba(220, 53, 69, 0.3)', backgroundColor: 'rgba(220, 53, 69, 0.1)', color: 'var(--text-primary)' }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Trainers List */}
        {trainers.length === 0 && !loading ? (
          <div className="text-center py-5">
            <i className="bi bi-search fs-1 mb-3 d-block" style={{ color: 'var(--text-secondary)' }}></i>
            <h5 style={{ color: 'var(--brand-white)' }}>No trainers found</h5>
            <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or search criteria</p>
            <button 
              className="btn rounded-pill px-4 mt-3" 
              onClick={handleResetFilters}
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--brand-dark)',
                border: 'none',
                fontWeight: '600'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="row">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="col-lg-4 col-md-6 mb-4">
                <div 
                  className="card border-0 rounded-4 h-100"
                  style={{
                    backgroundColor: 'rgba(15, 20, 15, 0.6)',
                    border: '1px solid rgba(74, 74, 90, 0.3)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = 'var(--brand-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(74, 74, 90, 0.3)';
                  }}
                >
                  <div className="card-body p-4">
                    {/* Trainer Header */}
                    <div className="d-flex align-items-start mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: '60px', height: '60px', fontSize: '1.5rem', flexShrink: 0, backgroundColor: 'var(--brand-primary)', color: 'var(--brand-dark)', fontWeight: '700' }}
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
                            <h5 className="mb-1" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>
                              {trainer.name}
                              {trainer.verified && (
                                <i className="bi bi-patch-check-fill ms-2" style={{ color: 'var(--brand-primary)' }} title="Verified"></i>
                              )}
                            </h5>
                            <div className="mb-1">
                              {getRatingStars(trainer.average_rating || 0)}
                              <small className="ms-1" style={{ color: 'var(--text-secondary)' }}>
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
                          <span key={idx} className="badge rounded-pill me-1 mb-1" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    <p className="small mb-3" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: 'var(--text-secondary)'
                    }}>
                      {trainer.bio || 'No bio available'}
                    </p>

                    {/* Stats */}
                    <div className="d-flex justify-content-between small mb-3" style={{ color: 'var(--text-secondary)' }}>
                      <div>
                        <i className="bi bi-briefcase me-1" style={{ color: 'var(--brand-primary)' }}></i>
                        {trainer.experience_years || 0} years
                      </div>
                      <div>
                        <i className="bi bi-people me-1" style={{ color: 'var(--brand-primary)' }}></i>
                        {trainer.current_clients || 0}/{trainer.max_clients || 0} clients
                      </div>
                    </div>

                    {/* Price */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold fs-5" style={{ color: 'var(--brand-primary)' }}>
                        ${trainer.hourly_rate || 0}/hr
                      </span>
                      {!trainer.accepting_clients && (
                        <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(74, 74, 90, 0.3)', color: 'var(--text-secondary)' }}>Fully Booked</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2">
                      {trainer.connection_status === 'active' ? (
                        <button className="btn rounded-pill flex-fill" disabled style={{ backgroundColor: 'rgba(32, 214, 87, 0.3)', color: 'var(--brand-white)', border: 'none' }}>
                          <i className="bi bi-check-circle me-2"></i>
                          Connected
                        </button>
                      ) : trainer.connection_status === 'pending' ? (
                        <button className="btn rounded-pill flex-fill" disabled style={{ backgroundColor: 'rgba(255, 193, 7, 0.3)', color: 'var(--brand-white)', border: 'none' }}>
                          <i className="bi bi-clock me-2"></i>
                          Pending
                        </button>
                      ) : (
                        <button 
                          className="btn rounded-pill flex-fill"
                          onClick={() => handleRequestConnection(trainer)}
                          disabled={!trainer.accepting_clients}
                          style={{
                            backgroundColor: 'var(--brand-primary)',
                            color: 'var(--brand-dark)',
                            border: 'none',
                            fontWeight: '600'
                          }}
                        >
                          <i className="bi bi-person-plus me-2"></i>
                          Request Connection
                        </button>
                      )}
                      <button 
                        className="btn rounded-pill"
                        onClick={() => {/* TODO: View trainer profile */}}
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--brand-primary)',
                          border: '1px solid var(--brand-primary)',
                          fontWeight: '600'
                        }}
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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
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
                <h5 className="modal-title" style={{ color: 'var(--brand-white)', fontWeight: '700' }}>Filter Trainers</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowFilterModal(false)}
                  style={{ filter: 'invert(1)' }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Specialization */}
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Specialization</label>
                  <select
                    className="form-select"
                    value={filters.specialization}
                    onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                    style={{
                      backgroundColor: 'rgba(247, 255, 247, 0.05)',
                      border: '1px solid rgba(74, 74, 90, 0.3)',
                      color: 'var(--brand-white)',
                      borderRadius: '12px'
                    }}
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
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Minimum Rating</label>
                  <select
                    className="form-select"
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                    style={{
                      backgroundColor: 'rgba(247, 255, 247, 0.05)',
                      border: '1px solid rgba(74, 74, 90, 0.3)',
                      color: 'var(--brand-white)',
                      borderRadius: '12px'
                    }}
                  >
                    <option value="0">Any Rating</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Hourly Rate Range</label>
                  <div className="row g-2">
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Min"
                        value={filters.minRate}
                        onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
                        style={{
                          backgroundColor: 'rgba(247, 255, 247, 0.05)',
                          border: '1px solid rgba(74, 74, 90, 0.3)',
                          color: 'var(--brand-white)',
                          borderRadius: '12px'
                        }}
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Max"
                        value={filters.maxRate}
                        onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                        style={{
                          backgroundColor: 'rgba(247, 255, 247, 0.05)',
                          border: '1px solid rgba(74, 74, 90, 0.3)',
                          color: 'var(--brand-white)',
                          borderRadius: '12px'
                        }}
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
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn rounded-pill px-4"
                  onClick={handleResetFilters}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(74, 74, 90, 0.3)'
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn rounded-pill px-4"
                  onClick={handleApplyFilters}
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--brand-dark)',
                    border: 'none',
                    fontWeight: '600'
                  }}
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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content rounded-4 border-0"
              style={{
                backgroundColor: 'rgba(15, 20, 15, 0.95)',
                border: '1px solid rgba(32, 214, 87, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
              }}
            >
              <form onSubmit={handleSendRequest}>
                <div className="modal-body pt-4">
                  <div className="d-flex justify-content-end mb-3">
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowRequestModal(false)}
                      disabled={sendingRequest}
                      style={{ filter: 'invert(1)' }}
                    ></button>
                  </div>
                  <div className="mb-3 text-center">
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                      style={{ width: '80px', height: '80px', fontSize: '2rem', backgroundColor: 'var(--brand-primary)', color: 'var(--brand-dark)', fontWeight: '700' }}
                    >
                      {selectedTrainer.name?.charAt(0) || 'T'}
                    </div>
                    <h5 style={{ color: 'var(--brand-white)' }}>{selectedTrainer.name}</h5>
                    <p style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>${selectedTrainer.hourly_rate}/hr</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      Your Fitness Experience Level <span style={{ color: 'var(--brand-primary)' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={requestForm.experienceLevel}
                      onChange={(e) => setRequestForm({ ...requestForm, experienceLevel: e.target.value })}
                      required
                      style={{
                        backgroundColor: 'rgba(247, 255, 247, 0.05)',
                        border: '1px solid rgba(74, 74, 90, 0.3)',
                        color: 'var(--brand-white)',
                        borderRadius: '12px'
                      }}
                    >
                      <option value="">Select your level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      Your Goals <span style={{ color: 'var(--brand-primary)' }}>*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="What are you looking to achieve? (e.g., weight loss, muscle gain, general fitness)"
                      value={requestForm.goals}
                      onChange={(e) => setRequestForm({ ...requestForm, goals: e.target.value })}
                      required
                      style={{
                        backgroundColor: 'rgba(247, 255, 247, 0.05)',
                        border: '1px solid rgba(74, 74, 90, 0.3)',
                        color: 'var(--brand-white)',
                        borderRadius: '12px'
                      }}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Message (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Tell the trainer why you'd like to work with them..."
                      value={requestForm.message}
                      onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                      style={{
                        backgroundColor: 'rgba(247, 255, 247, 0.05)',
                        border: '1px solid rgba(74, 74, 90, 0.3)',
                        color: 'var(--brand-white)',
                        borderRadius: '12px'
                      }}
                    ></textarea>
                  </div>

                  <div className="alert rounded-3" style={{ backgroundColor: 'rgba(32, 214, 87, 0.1)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'var(--brand-light)' }}>
                    <i className="bi bi-info-circle me-2" style={{ color: 'var(--brand-primary)' }}></i>
                    The trainer will review your request and respond within 24-48 hours.
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn rounded-pill px-4"
                    onClick={() => setShowRequestModal(false)}
                    disabled={sendingRequest}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid rgba(74, 74, 90, 0.3)'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn rounded-pill px-4"
                    disabled={sendingRequest}
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--brand-dark)',
                      border: 'none',
                      fontWeight: '600'
                    }}
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
