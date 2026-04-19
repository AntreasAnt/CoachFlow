import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TraineeDashboard from '../../../components/TraineeDashboard';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const EMPTY_CONNECTION_LOCK = {
  status: 'none',
  trainerId: null,
  trainerName: '',
  requestId: null,
};

const FindTrainersPage = ({
  embedded = false,
  forceViewOnly = false,
  lockBannerMessage = '',
  headerContent = null,
  showMyCoachShortcut = true,
  initialConnectionView = 'all',
}) => {
  const PAGE_SIZE = 12;

  const navigate = useNavigate();
  const location = useLocation();

  const resolveInitialConnectionView = () => {
    if (initialConnectionView === 'requests') {
      return 'requests';
    }

    if (location.state?.initialConnectionView === 'requests' || location.state?.connectionView === 'requests') {
      return 'requests';
    }

    return 'all';
  };

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    message: '',
    experienceLevel: '',
    goals: ''
  });
  const [sendingRequest, setSendingRequest] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [hiddenTrainers, setHiddenTrainers] = useState(() => {
    const stored = localStorage.getItem('hiddenTrainers');
    return stored ? JSON.parse(stored) : [];
  });
  const [connectionView, setConnectionView] = useState(resolveInitialConnectionView);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [trainerToCancel, setTrainerToCancel] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [connectionLock, setConnectionLock] = useState(EMPTY_CONNECTION_LOCK);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    minRating: 0,
    sortBy: 'rating'
  });
  
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    fetchTrainers();
  }, [appliedFilters, currentPage, connectionView]);

  useEffect(() => {
    setConnectionView(resolveInitialConnectionView());
  }, [initialConnectionView, location.state]);

  useEffect(() => {
    setCurrentPage(1);
  }, [connectionView]);

  // Auto-apply search (Search button removed)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters((prev) => ({ ...prev, search: filters.search }));
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Auto-apply rating slider
  useEffect(() => {
    setAppliedFilters((prev) => ({ ...prev, minRating: filters.minRating }));
    setCurrentPage(1);
  }, [filters.minRating]);

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
      if (appliedFilters.minRating > 0) params.append('minRating', appliedFilters.minRating);
      params.append('sortBy', appliedFilters.sortBy);

      const limit = connectionView === 'requests' ? 50 : PAGE_SIZE;
      const offset = connectionView === 'requests' ? 0 : (currentPage - 1) * PAGE_SIZE;
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      
      const response = await APIClient.get(
        `${BACKEND_ROUTES_API}GetAvailableTrainers.php?${params.toString()}`
      );
      
      if (response.success) {
        setTrainers(response.trainers || []);
        setTotal(Number(response.total || 0));
        setConnectionLock({
          status: response.user_connection_status || 'none',
          trainerId: response.user_connected_trainer_id || response.user_pending_trainer_id || null,
          trainerName: response.user_connected_trainer_name || response.user_pending_trainer_name || '',
          requestId: response.user_pending_request_id || null,
        });
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

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      minRating: 0,
      sortBy: 'rating'
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setCurrentPage(1);
  };

  const handleRequestConnection = (trainer) => {
    if (forceViewOnly || connectionLock.status === 'active' || connectionLock.status === 'pending') {
      setNotification({
        show: true,
        message: lockBannerMessage || (connectionLock.status === 'pending'
          ? `You already have a pending request${connectionLock.trainerName ? ` with ${connectionLock.trainerName}` : ''}.`
          : `You are already connected${connectionLock.trainerName ? ` to ${connectionLock.trainerName}` : ' to a trainer'}.`),
        type: 'warning'
      });
      return;
    }

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
      setNotification({ show: true, message: 'Failed to send request: ${err.message} ', type: 'danger' });
    } finally {
      setSendingRequest(false);
    }
  };

  const handleCancelRequest = (trainer) => {
    if (!trainer?.request_id) return;

    setTrainerToCancel(trainer);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    if (cancellingRequest) return;
    setShowCancelModal(false);
    setTrainerToCancel(null);
  };

  const handleConfirmCancelRequest = async () => {
    if (!trainerToCancel?.request_id) return;

    try {
      setCancellingRequest(trainerToCancel.id);
      
      const response = await APIClient.post(
        `${BACKEND_ROUTES_API}CancelCoachingRequest.php`,
        { requestId: trainerToCancel.request_id }
      );
      
      if (response.success) {
        setNotification({ show: true, message: 'Request cancelled successfully!', type: 'success' });
        setShowCancelModal(false);
        setTrainerToCancel(null);
        fetchTrainers(); // Refresh to update connection status
      } else {
        setNotification({ show: true, message: response.message || 'Failed to cancel request', type: 'danger' });
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      setNotification({ show: true, message: 'Failed to cancel request: ${err.message}', type: 'danger' });
    } finally {
      setCancellingRequest(null);
    }
  };

  const handleHideTrainer = (trainerId) => {
    const updated = [...hiddenTrainers, trainerId];
    setHiddenTrainers(updated);
    localStorage.setItem('hiddenTrainers', JSON.stringify(updated));
    setNotification({ show: true, message: 'Trainer hidden successfully', type: 'success' });
  };

  const handleUnhideAll = () => {
    setHiddenTrainers([]);
    localStorage.removeItem('hiddenTrainers');
    setNotification({ show: true, message: 'All trainers shown', type: 'success' });
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

  const lockStatus = forceViewOnly ? 'active' : connectionLock.status;
  const activeLockMessage = lockBannerMessage || (
    lockStatus === 'active'
      ? `You're already connected${connectionLock.trainerName ? ` to ${connectionLock.trainerName}` : ' to a trainer'}. You can browse coaches, but you can't send another request right now.`
      : lockStatus === 'pending'
        ? `You already have a pending request${connectionLock.trainerName ? ` with ${connectionLock.trainerName}` : ''}. Wait for a response or cancel it before contacting another coach.`
        : ''
  );

  const isRequestLocked = (trainer) => {
    if (trainer.connection_status === 'active' || trainer.connection_status === 'pending') {
      return false;
    }

    if (!trainer.accepting_clients) {
      return true;
    }

    return forceViewOnly || connectionLock.status === 'active' || connectionLock.status === 'pending';
  };

  const getLockedActionMeta = (trainer) => {
    if (!trainer.accepting_clients) {
      return {
        label: 'Fully Booked',
        icon: 'bi-slash-circle',
        backgroundColor: 'rgba(74, 74, 90, 0.22)',
        border: '1px solid rgba(74, 74, 90, 0.35)',
        color: 'var(--text-secondary)'
      };
    }

    if (forceViewOnly || connectionLock.status === 'active') {
      return {
        label: 'Already Connected',
        icon: 'bi-lock',
        backgroundColor: 'rgba(32, 214, 87, 0.1)',
        border: '1px solid rgba(32, 214, 87, 0.25)',
        color: 'rgba(255,255,255,0.78)'
      };
    }

    if (connectionLock.status === 'pending') {
      return {
        label: 'Pending Elsewhere',
        icon: 'bi-hourglass-split',
        backgroundColor: 'rgba(255, 193, 7, 0.12)',
        border: '1px solid rgba(255, 193, 7, 0.35)',
        color: 'rgba(255,255,255,0.85)'
      };
    }

    return {
      label: 'Request Connection',
      icon: 'bi-person-plus',
      backgroundColor: 'var(--brand-primary)',
      border: 'none',
      color: 'var(--brand-dark)'
    };
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

  const visibleTrainers = trainers
    .filter(trainer => !hiddenTrainers.includes(trainer.id))
    .filter(trainer => {
      if (connectionView === 'requests') {
        return trainer.connection_status === 'pending' || trainer.connection_status === 'active';
      }
      return true;
    });

  const requestRelatedCount = (connectionLock.status === 'pending' || connectionLock.status === 'active') ? 1 : 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading && trainers.length === 0) {
    const loadingContent = (
      <div className="container-fluid p-4" style={{ backgroundColor: 'var(--brand-dark)', minHeight: '80vh' }}>
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: 'var(--brand-primary)', width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading trainers...</p>
        </div>
      </div>
    );

    return embedded ? loadingContent : <TraineeDashboard>{loadingContent}</TraineeDashboard>;
  }

  const pageContent = (
    <>
      <div className="container-fluid px-3 px-md-4 py-3" style={{ paddingBottom: '100px', backgroundColor: 'var(--brand-dark)', minHeight: '100vh' }}>
        {headerContent && <div className="mb-4">{headerContent}</div>}

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            className="btn btn-sm rounded-pill"
            onClick={() => setConnectionView('all')}
            style={{
              backgroundColor: connectionView === 'all' ? 'rgba(32, 214, 87, 0.18)' : 'rgba(30, 35, 30, 0.5)',
              border: connectionView === 'all' ? '1px solid rgba(32, 214, 87, 0.35)' : '1px solid rgba(32, 214, 87, 0.2)',
              color: connectionView === 'all' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
              fontWeight: 600,
              padding: '0.5rem 1rem'
            }}
          >
            <i className="bi bi-people me-2"></i>
            All Coaches
          </button>
          <button
            className="btn btn-sm rounded-pill"
            onClick={() => setConnectionView('requests')}
            style={{
              backgroundColor: connectionView === 'requests' ? 'rgba(255, 193, 7, 0.16)' : 'rgba(30, 35, 30, 0.5)',
              border: connectionView === 'requests' ? '1px solid rgba(255, 193, 7, 0.35)' : '1px solid rgba(32, 214, 87, 0.2)',
              color: connectionView === 'requests' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
              fontWeight: 600,
              padding: '0.5rem 1rem'
            }}
          >
            <i className="bi bi-hourglass-split me-2"></i>
            My Requests ({requestRelatedCount})
          </button>
        </div>

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
                    placeholder="Search by name, username, or specialization..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: 'rgba(247, 255, 247, 0.05)',
                    border: '1px solid rgba(74, 74, 90, 0.3)',
                    color: 'var(--brand-white)',
                    borderRadius: '12px'
                  }}
                >
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="clients">Most Popular</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <div className="col-md-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small style={{ color: 'var(--text-secondary)' }}>Min rating</small>
                      <small style={{ color: 'var(--brand-white)', fontWeight: 600 }}>
                        {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
                      </small>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={filters.minRating}
                      onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(appliedFilters.minRating > 0) && (
              <div className="mt-3 d-flex flex-wrap gap-2">
                <small className="me-2" style={{ color: 'var(--text-secondary)' }}>Active filters:</small>
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
                        setCurrentPage(1);
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

        {activeLockMessage && (
          <div
            className="alert rounded-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3"
            role="alert"
            style={{
              border: lockStatus === 'pending' ? '1px solid rgba(255, 193, 7, 0.35)' : '1px solid rgba(32, 214, 87, 0.28)',
              backgroundColor: lockStatus === 'pending' ? 'rgba(255, 193, 7, 0.12)' : 'rgba(32, 214, 87, 0.08)',
              color: 'var(--text-primary)'
            }}
          >
            <div>
              <div className="fw-semibold mb-1" style={{ color: 'var(--brand-white)' }}>
                <i className={`bi ${lockStatus === 'pending' ? 'bi-hourglass-split' : 'bi-shield-lock'} me-2`}></i>
                Coach requests are locked
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{activeLockMessage}</div>
            </div>
            <div className="d-flex gap-2">
              {showMyCoachShortcut && (forceViewOnly || connectionLock.status === 'active') && (
                <button
                  className="btn btn-sm rounded-pill"
                  onClick={() => navigate('/trainee-dashboard/my-coach')}
                  style={{
                    backgroundColor: 'rgba(32, 214, 87, 0.16)',
                    color: 'var(--brand-white)',
                    border: '1px solid rgba(32, 214, 87, 0.28)',
                    fontWeight: '600'
                  }}
                >
                  My Coach
                </button>
              )}
              {connectionLock.status === 'pending' && (
                <button
                  className="btn btn-sm rounded-pill"
                  onClick={() => setConnectionView(connectionView === 'requests' ? 'all' : 'requests')}
                  style={{
                    backgroundColor: connectionView === 'requests' ? 'rgba(32, 214, 87, 0.16)' : 'rgba(255, 193, 7, 0.16)',
                    color: 'var(--brand-white)',
                    border: connectionView === 'requests' ? '1px solid rgba(32, 214, 87, 0.28)' : '1px solid rgba(255, 193, 7, 0.28)',
                    fontWeight: '600'
                  }}
                >
                  {connectionView === 'requests' ? 'All Trainers' : 'My Requests'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Trainers List */}
        {visibleTrainers.length === 0 && !loading ? (
          <div className="text-center py-5">
            <i className={`bi ${connectionView === 'requests' ? 'bi-hourglass-split' : 'bi-search'} fs-1 mb-3 d-block`} style={{ color: 'var(--text-secondary)' }}></i>
            <h5 style={{ color: 'var(--brand-white)' }}>
              {connectionView === 'requests' ? 'No requests to show' : 'No trainers found'}
            </h5>
            <p style={{ color: 'var(--text-secondary)' }}>
              {connectionView === 'requests'
                ? 'You currently have no pending or active coach requests in this list.'
                : 'Try adjusting your filters or search criteria'}
            </p>
            <button 
              className="btn rounded-pill px-4 mt-3" 
              onClick={() => {
                if (connectionView === 'requests') {
                  setConnectionView('all');
                  return;
                }
                handleResetFilters();
              }}
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--brand-dark)',
                border: 'none',
                fontWeight: '600'
              }}
            >
              {connectionView === 'requests' ? 'Show All Coaches' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div>
            {/* Hidden trainers notice */}
            {hiddenTrainers.length > 0 && (
              <div className="alert rounded-4 d-flex justify-content-between align-items-center mb-4" style={{ border: '1px solid rgba(32, 214, 87, 0.3)', backgroundColor: 'rgba(32, 214, 87, 0.1)', color: 'var(--brand-light)' }}>
                <div>
                  <i className="bi bi-eye-slash me-2"></i>
                  {hiddenTrainers.length} trainer(s) hidden
                </div>
                <button 
                  className="btn btn-sm rounded-pill"
                  onClick={handleUnhideAll}
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--brand-dark)',
                    border: 'none',
                    fontWeight: '600'
                  }}
                >
                  Show All
                </button>
              </div>
            )}
            
            <div className="row">
            {visibleTrainers.map((trainer) => (
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
                            <h5 className="mb-0" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>
                              {trainer.name}
                              {!!trainer.verified && (
                                <i className="bi bi-patch-check-fill ms-2" style={{ color: 'var(--brand-primary)' }} title="Verified"></i>
                              )}
                            </h5>
                            {trainer.username && (
                              <p className="mb-1 mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                @{trainer.username}
                              </p>
                            )}
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

                    {!trainer.accepting_clients && (
                      <div className="mb-3">
                        <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(74, 74, 90, 0.3)', color: 'var(--text-secondary)' }}>Fully Booked</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="d-flex gap-2">
                      {trainer.connection_status === 'active' ? (
                        <button className="btn rounded-pill flex-fill" disabled style={{ backgroundColor: 'rgba(32, 214, 87, 0.3)', color: 'var(--brand-white)', border: 'none' }}>
                          <i className="bi bi-check-circle me-2"></i>
                          Connected
                        </button>
                      ) : trainer.connection_status === 'pending' ? (
                        <button 
                          className="btn rounded-pill flex-fill"
                          onClick={() => handleCancelRequest(trainer)}
                          disabled={Boolean(cancellingRequest)}
                          style={{ 
                            backgroundColor: 'rgba(220, 53, 69, 0.2)', 
                            color: '#dc3545', 
                            border: '1px solid rgba(220, 53, 69, 0.5)',
                            fontWeight: '600'
                          }}
                        >
                          {cancellingRequest === trainer.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-x-circle me-2"></i>
                              Cancel Request
                            </>
                          )}
                        </button>
                      ) : isRequestLocked(trainer) ? (
                        <button
                          className="btn rounded-pill flex-fill"
                          disabled
                          style={{
                            backgroundColor: getLockedActionMeta(trainer).backgroundColor,
                            color: getLockedActionMeta(trainer).color,
                            border: getLockedActionMeta(trainer).border,
                            fontWeight: '600'
                          }}
                        >
                          <i className={`bi ${getLockedActionMeta(trainer).icon} me-2`}></i>
                          {getLockedActionMeta(trainer).label}
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
                        onClick={() => handleHideTrainer(trainer.id)}
                        title="Hide trainer"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)',
                          border: '1px solid rgba(74, 74, 90, 0.3)',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-eye-slash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {connectionView === 'all' && totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button
                type="button"
                className="btn btn-sm rounded-pill"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  backgroundColor: 'rgba(30, 35, 30, 0.5)',
                  border: '1px solid rgba(32, 214, 87, 0.25)',
                  color: 'var(--brand-white)',
                  fontWeight: '600'
                }}
              >
                Previous
              </button>

              <div className="small" style={{ color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </div>

              <button
                type="button"
                className="btn btn-sm rounded-pill"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  backgroundColor: 'rgba(30, 35, 30, 0.5)',
                  border: '1px solid rgba(32, 214, 87, 0.25)',
                  color: 'var(--brand-white)',
                  fontWeight: '600'
                }}
              >
                Next
              </button>
            </div>
          )}

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

      {/* Cancel Request Modal */}
      {showCancelModal && trainerToCancel && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content rounded-4 border-0"
              style={{
                backgroundColor: 'rgba(15, 20, 15, 0.95)',
                border: '1px solid rgba(220, 53, 69, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden'
              }}
            >
              <div className="modal-header dark-modal-header" style={{ borderBottom: '1px solid rgba(220, 53, 69, 0.3)', backgroundColor: 'rgba(15, 20, 15, 0.95)' }}>
                <h5 className="modal-title" style={{ color: 'var(--brand-white)', fontWeight: '700' }}>Cancel Coaching Request?</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeCancelModal}
                  disabled={Boolean(cancellingRequest)}
                  style={{ filter: 'invert(1)' }}
                ></button>
              </div>

              <div className="modal-body">
                <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Are you sure you want to cancel your coaching request with{' '}
                  <strong style={{ color: 'var(--brand-white)' }}>{trainerToCancel.name}</strong>?
                </p>
                <div className="alert rounded-3 mb-0" style={{ backgroundColor: 'rgba(255, 193, 7, 0.12)', border: '1px solid rgba(255, 193, 7, 0.3)', color: 'var(--text-primary)' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  You can send a new request again after cancelling.
                </div>
              </div>

              <div
                className="modal-footer border-0"
                style={{ justifyContent: 'space-between', gap: '0.75rem' }}
              >
                <button
                  type="button"
                  className="btn rounded-pill px-4"
                  onClick={closeCancelModal}
                  disabled={Boolean(cancellingRequest)}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(74, 74, 90, 0.3)',
                    fontWeight: '600'
                  }}
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  className="btn rounded-pill px-4"
                  onClick={handleConfirmCancelRequest}
                  disabled={Boolean(cancellingRequest)}
                  style={{
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    color: '#dc3545',
                    border: '1px solid rgba(220, 53, 69, 0.5)',
                    fontWeight: '700'
                  }}
                >
                  {Boolean(cancellingRequest) ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel Request
                    </>
                  )}
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
                    <div>
                      <h5 className="mb-0" style={{ color: 'var(--brand-white)' }}>{selectedTrainer.name}</h5>
                      {selectedTrainer.username && (
                        <p className="mb-0 mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          @{selectedTrainer.username}
                        </p>
                      )}
                    </div>
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
    </>
  );

  return embedded ? pageContent : <TraineeDashboard>{pageContent}</TraineeDashboard>;
};

export default FindTrainersPage;
