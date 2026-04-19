import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const TrainerClientsManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [recentDisconnects, setRecentDisconnects] = useState([]);
  const [showAllDisconnects, setShowAllDisconnects] = useState(false);
  const [dismissedDisconnectId, setDismissedDisconnectId] = useState(() => {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem('trainerDismissedDisconnectId');
    return val ? Number(val) : null;
  });
  const [requests, setRequests] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState('');
  const [requestActionModal, setRequestActionModal] = useState({ show: false, action: null, request: null, submitting: false });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Pagination & Search States
  const [clientSearch, setClientSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [clientTotalPages, setClientTotalPages] = useState(1);
  const [debouncedClientSearch, setDebouncedClientSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClientSearch(clientSearch);
      setClientPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  useEffect(() => {
    fetchActiveClients(clientPage, debouncedClientSearch);
  }, [clientPage, debouncedClientSearch]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchActiveClients = async (page = 1, search = '') => {
    try {
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerClients.php?page=${page}&limit=5&search=${encodeURIComponent(search)}`);
      if (response.success) {
        setClients(response.clients || []);
        if (response.pagination) {
          setClientTotalPages(response.pagination.total_pages || 1);
        }
        if (response.recent_disconnects) {
           setRecentDisconnects(response.recent_disconnects || []);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Clients are fetched by fetchActiveClients separately based on deps
      
      // Fetch coaching requests
      const requestsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetCoachingRequests.php`);
      if (requestsResponse.success) {
        setRequests(requestsResponse.requests || []);
      }

      // Fetch trainer's programs for assignment
      const programsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerPrograms.php`);
      if (programsResponse.success) {
        setPrograms(programsResponse.programs || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tab = (searchParams.get('tab') || '').toLowerCase();
    if (tab === 'requests') setActiveTab('requests');
    if (tab === 'clients') setActiveTab('clients');
  }, [searchParams]);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const openRequestActionModal = (action, request) => {
    setRequestActionModal({ show: true, action, request, submitting: false });
  };

  const closeRequestActionModal = () => {
    if (requestActionModal.submitting) return;
    setRequestActionModal({ show: false, action: null, request: null, submitting: false });
  };

  const handleConfirmRequestAction = async () => {
    const requestId = requestActionModal.request?.id;
    const action = requestActionModal.action;

    if (!requestId || (action !== 'accept' && action !== 'decline')) {
      closeRequestActionModal();
      return;
    }

    setRequestActionModal((prev) => ({ ...prev, submitting: true }));
    try {
      const endpoint = action === 'accept' ? 'AcceptCoachingRequest.php' : 'DeclineCoachingRequest.php';
      const response = await APIClient.post(`${BACKEND_ROUTES_API}${endpoint}`, { requestId });

      if (response.success) {
        setNotification({
          show: true,
          message: action === 'accept' ? 'Coaching request accepted successfully' : 'Coaching request declined',
          type: 'success'
        });
        closeRequestActionModal();
        fetchInitialData(); fetchActiveClients(1, debouncedClientSearch);
      } else {
        setNotification({ show: true, message: response.message || `Failed to ${action} request`, type: 'danger' });
        setRequestActionModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch (error) {
      console.error(`Error attempting to ${action} request:`, error);
      setNotification({ show: true, message: `Failed to ${action} request. Please try again.`, type: 'danger' });
      setRequestActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const openAssignProgram = (client) => {
    setSelectedClient(client);
    setSelectedProgram('');
    setShowAssignProgramModal(true);
  };

  const handleAssignProgram = async () => {
    if (!selectedProgram) {
      alert('Please select a program');
      return;
    }

    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}AssignProgramToClient.php`, {
        clientId: selectedClient.id,
        programId: selectedProgram
      });

      if (response.success) {
        setShowAssignProgramModal(false);
        alert('Program assigned successfully!');
        fetchInitialData(); fetchActiveClients(1, debouncedClientSearch);
      } else {
        alert(response.message || 'Failed to assign program');
      }
    } catch (error) {
      console.error('Error assigning program:', error);
      alert('Failed to assign program. Please try again.');
    }
  };

  const openChat = (client) => {
    navigate('/messages', { state: { selectedUserId: client.trainee_id } });
  };

  const openDisconnectModal = (client) => {
    setSelectedClient(client);
    setDisconnectReason('');
    setShowDisconnectModal(true);
  };

  const handleDisconnect = async () => {
    if (!disconnectReason.trim()) {
      setNotification({ show: true, message: 'Please provide a reason for disconnecting', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}DisconnectCoaching.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship_id: selectedClient.id,
          reason: disconnectReason
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowDisconnectModal(false);
        setNotification({ show: true, message: 'Successfully ended coaching relationship', type: 'success' });
        fetchInitialData(); fetchActiveClients(1, debouncedClientSearch); // Refresh client list
      } else {
        setNotification({ show: true, message: result.message || 'Failed to disconnect', type: 'danger' });
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      setNotification({ show: true, message: 'Failed to disconnect. Please try again.', type: 'danger' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonthYear = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const dismissDisconnectNotice = (relationshipId) => {
    setDismissedDisconnectId(relationshipId);
    setShowAllDisconnects(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('trainerDismissedDisconnectId', String(relationshipId));
    }
  };

  if (loading) {
    return (
      <TrainerDashboardLayout>
        <div className="text-center py-5" style={{ minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
          <div className="spinner-border" role="status" style={{ color: '#10b981' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#fff' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold" style={{ color: '#fff' }}>Client Management</h2>
            <p style={{ color: '#9ca3af' }}>Manage your clients and coaching requests</p>
          </div>
        </div>

        {recentDisconnects.length > 0 && recentDisconnects[0]?.relationship_id !== dismissedDisconnectId && (
          <div className="alert mb-4" style={{ backgroundColor: 'rgba(251, 191, 36, 0.18)', border: '1px solid rgba(251, 191, 36, 0.28)', color: '#fbbf24' }}>
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div className="d-flex align-items-start gap-2">
                <i className="bi bi-info-circle" style={{ marginTop: '2px' }}></i>
                <div>
                  <div className="fw-semibold">Recent disconnect</div>
                  <div className="small" style={{ color: '#d1d5db' }}>
                    {recentDisconnects[0].name}
                    {recentDisconnects[0].ended_at ? ` (ended ${formatDate(recentDisconnects[0].ended_at)})` : ''}
                    {' — '}disconnected by {recentDisconnects[0].disconnected_by_role}
                    {recentDisconnects.length > 1 && (
                      <>
                        {' • '}
                        <button
                          type="button"
                          className="btn btn-link p-0 align-baseline"
                          onClick={() => setShowAllDisconnects((v) => !v)}
                          style={{ color: '#fbbf24', textDecoration: 'underline' }}
                        >
                          {showAllDisconnects
                            ? 'Hide'
                            : `Show ${recentDisconnects.length - 1} more`}
                        </button>
                      </>
                    )}
                  </div>
                  {showAllDisconnects && recentDisconnects.length > 1 && (
                    <div className="small mt-2" style={{ color: '#d1d5db' }}>
                      {recentDisconnects.slice(1).map((d) => (
                        <div key={d.relationship_id}>
                          {d.name}
                          {d.ended_at ? ` (ended ${formatDate(d.ended_at)})` : ''}
                          {' — '}disconnected by {d.disconnected_by_role}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Dismiss"
                onClick={() => dismissDisconnectNotice(recentDisconnects[0].relationship_id)}
                style={{ marginTop: '2px' }}
              ></button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <style>
          {`
            .client-tab {
              transition: all 0.3s ease;
              padding: 12px 20px;
              margin-right: 4px;
              border-radius: 8px 8px 0 0;
            }
            .client-tab:hover {
              background-color: rgba(16, 185, 129, 0.1) !important;
              color: #10b981 !important;
            }

            .modal-header.dark-modal-header {
              background: #2d2d2d !important;
              background-color: #2d2d2d !important;
              background-image: none !important;
            }
          `}
        </style>
        <ul className="nav nav-tabs mb-4" style={{ borderBottom: '2px solid rgba(16, 185, 129, 0.2)' }}>
          <li className="nav-item">
            <button
              className="client-tab"
              onClick={() => setActiveTab('clients')}
              style={{
                color: activeTab === 'clients' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'clients' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'clients' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'clients' ? '600' : '400'
              }}
            >
              <i className="bi bi-people me-2"></i>
              My Clients ({clients.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className="client-tab"
              onClick={() => setActiveTab('requests')}
              style={{
                color: activeTab === 'requests' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'requests' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'requests' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'requests' ? '600' : '400'
              }}
            >
              <i className="bi bi-person-plus me-2"></i>
              Requests ({requests.length})
            </button>
          </li>
        </ul>

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div>
            <div className="mb-4">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search clients by name, username, or email..." 
                value={clientSearch} 
                onChange={(e) => setClientSearch(e.target.value)} 
                style={{ backgroundColor: '#1f1f1f', color: '#fff', border: '1px solid #333' }}
              />
            </div>
            {clients.length === 0 ? (
              <div className="alert" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}>
                <i className="bi bi-info-circle me-2"></i>
                {debouncedClientSearch ? 'No clients match your search.' : 'No clients yet. Accept coaching requests to get started!'}
              </div>
            ) : (
              <>
                <div className="row">
                  {clients.map(client => (
                  <div key={client.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div className="card-body position-relative">
                        <div className="position-absolute" style={{ top: '10px', right: '10px' }}>
                          <button 
                            className="btn btn-sm border-0"
                            type="button" 
                            onClick={() => setOpenDropdownId(openDropdownId === client.id ? null : client.id)}
                            style={{ padding: '2px 8px', backgroundColor: '#1a1a1a' }}
                          >
                            <i className="bi bi-three-dots-vertical" style={{ color: '#fff' }}></i>
                          </button>
                          {openDropdownId === client.id && (
                            <>
                              <div 
                                className="position-fixed top-0 start-0 w-100 h-100" 
                                style={{ zIndex: 1000 }}
                                onClick={() => setOpenDropdownId(null)}
                              ></div>
                              <div 
                                className="dropdown-menu dropdown-menu-end show" 
                                style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1001, backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                              >
                                <button 
                                  className="text-danger"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    openDisconnectModal(client);
                                  }}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '0.25rem 1rem',
                                    clear: 'both',
                                    fontWeight: '400',
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: 'transparent',
                                    border: 0,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <i className="bi bi-x-circle me-2"></i>
                                  End Relationship
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="d-flex align-items-center mb-3">
                          {client.profile_image ? (
                            <img
                              src={client.profile_image}
                              alt={client.name || 'Client'}
                              className="rounded-circle me-3"
                              style={{ width: '50px', height: '50px', objectFit: 'cover', border: '2px solid rgba(16, 185, 129, 0.4)' }}
                            />
                          ) : (
                            <div className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                                 style={{ width: '50px', height: '50px', fontSize: '20px', backgroundColor: '#10b981' }}>
                              {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                          )}
                          <div className="flex-grow-1">
                              <h5 className="mb-0" style={{ color: '#fff' }}>{client.name || client.username || 'Client'}</h5>
                              {client.username && <div className="small mb-1" style={{ color: '#10b981', fontWeight: '500' }}>@{client.username}</div>}
                            <small style={{ color: '#9ca3af' }}>{client.email}</small>
                          </div>
                        </div>

                        <div className="mb-3">
                            <small className="d-block" style={{ color: '#9ca3af' }}>Since: {formatMonthYear(client.started_at)}</small>
                          {client.assigned_programs > 0 && (
                            <small className="d-block" style={{ color: '#9ca3af' }}>Programs: {client.assigned_programs}</small>
                          )}
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm"
                            onClick={() => openChat(client)}
                            title="Send message"
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                          >
                            <i className="bi bi-chat-dots"></i>
                          </button>
                          <button
                            className="btn btn-sm flex-grow-1"
                            onClick={() => navigate(`/clients/${client.trainee_id}/manage`)}
                            style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                          >
                            <i className="bi bi-gear me-1"></i>
                            Manage Programs
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {clientTotalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center mt-4 gap-3">
                  <button
                    className="btn btn-sm"
                    onClick={() => setClientPage(Math.max(1, clientPage - 1))}
                    disabled={clientPage === 1}
                    style={{
                      backgroundColor: clientPage === 1 ? '#333' : '#2d2d2d',
                      color: clientPage === 1 ? '#666' : '#fff',
                      border: '1px solid #444',
                      cursor: clientPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className="bi bi-chevron-left me-1"></i> Previous
                  </button>
                  <span style={{ color: '#9ca3af' }}>
                    Page {clientPage} of {clientTotalPages}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => setClientPage(Math.min(clientTotalPages, clientPage + 1))}
                    disabled={clientPage === clientTotalPages}
                    style={{
                      backgroundColor: clientPage === clientTotalPages ? '#333' : '#2d2d2d',
                      color: clientPage === clientTotalPages ? '#666' : '#fff',
                      border: '1px solid #444',
                      cursor: clientPage === clientTotalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next <i className="bi bi-chevron-right ms-1"></i>
                  </button>
                </div>
              )}
            </>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            {requests.length === 0 ? (
              <div className="alert" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}>
                <i className="bi bi-info-circle me-2"></i>
                No pending coaching requests.
              </div>
            ) : (
              <div className="row">
                {requests.map(request => (
                  <div key={request.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          {request.profile_image ? (
                            <img
                              src={request.profile_image}
                              alt={request.trainee_name || 'Trainee'}
                              className="rounded-circle me-3"
                              style={{ width: '50px', height: '50px', objectFit: 'cover', border: '2px solid rgba(107, 114, 128, 0.4)' }}
                            />
                          ) : (
                            <div className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                                 style={{ width: '50px', height: '50px', fontSize: '20px', backgroundColor: '#6b7280' }}>
                              {request.trainee_name ? request.trainee_name.charAt(0).toUpperCase() : 'T'}
                            </div>
                          )}
                          <div className="flex-grow-1">
                              <h5 className="mb-0" style={{ color: '#fff' }}>{request.trainee_name || request.trainee_username || 'Trainee'}</h5>
                              {request.trainee_username && <div className="small mb-1" style={{ color: '#10b981', fontWeight: '500' }}>@{request.trainee_username}</div>}
                            <small style={{ color: '#9ca3af' }}>{request.trainee_email}</small>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mb-3">
                            <small className="d-block mb-1" style={{ color: '#9ca3af' }}>Message:</small>
                            <p className="small mb-0" style={{ color: '#fff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{request.message}</p>
                          </div>
                        )}

                        {(request.experience_level || request.goals) && (
                          <div className="mb-3">
                            <div className="d-flex justify-content-between gap-3">
                              <div style={{ minWidth: 0 }}>
                                <small className="d-block mb-1" style={{ color: '#9ca3af' }}>Experience level:</small>
                                <div className="small" style={{ color: '#fff', wordBreak: 'break-word' }}>{request.experience_level || 'Not specified'}</div>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <small className="d-block mb-1" style={{ color: '#9ca3af' }}>Goals:</small>
                                <div className="small" style={{ color: '#fff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{request.goals || 'Not specified'}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <small style={{ color: '#9ca3af' }}>Requested: {formatDate(request.created_at)}</small>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm flex-grow-1"
                            onClick={() => openRequestActionModal('accept', request)}
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Accept
                          </button>
                          <button
                            className="btn btn-sm flex-grow-1"
                            onClick={() => openRequestActionModal('decline', request)}
                            style={{ backgroundColor: 'transparent', color: '#dc3545', border: '1px solid #dc3545' }}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accept/Decline Request Modal */}
        {requestActionModal.show && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="modal-header dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: '#fff' }}>
                    {requestActionModal.action === 'accept' ? 'Accept coaching request?' : 'Decline coaching request?'}
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={closeRequestActionModal}
                    disabled={requestActionModal.submitting}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="mb-2" style={{ color: '#d1d5db' }}>
                    {requestActionModal.action === 'accept'
                      ? 'This will add the trainee to your active clients.'
                      : 'This will remove the request from your pending list.'}
                  </p>
                  <div className="rounded p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div className="fw-semibold" style={{ color: '#fff' }}>
                        {requestActionModal.request?.trainee_name || requestActionModal.request?.trainee_username || 'Trainee'}
                      </div>
                      {requestActionModal.request?.trainee_username && (
                        <div className="small mb-1" style={{ color: '#10b981', fontWeight: '500' }}>
                          @{requestActionModal.request.trainee_username}
                        </div>
                      )}
                    <div className="small" style={{ color: '#9ca3af' }}>
                      {requestActionModal.request?.trainee_email || ''}
                    </div>
                    <div className="mt-3">
                      <div className="small" style={{ color: '#9ca3af' }}>Experience level</div>
                      <div style={{ color: '#fff', wordBreak: 'break-word' }}>{requestActionModal.request?.experience_level || 'Not specified'}</div>
                    </div>
                    <div className="mt-3">
                      <div className="small" style={{ color: '#9ca3af' }}>Goals</div>
                      <div style={{ color: '#fff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{requestActionModal.request?.goals || 'Not specified'}</div>
                    </div>
                    {requestActionModal.request?.message && (
                      <div className="mt-3">
                        <div className="small" style={{ color: '#9ca3af' }}>Message</div>
                        <div style={{ color: '#fff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{requestActionModal.request?.message}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <button
                    className="btn"
                    onClick={closeRequestActionModal}
                    disabled={requestActionModal.submitting}
                    style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn"
                    onClick={handleConfirmRequestAction}
                    disabled={requestActionModal.submitting}
                    style={{
                      backgroundColor: requestActionModal.action === 'accept' ? '#10b981' : '#dc3545',
                      color: '#fff',
                      border: 'none'
                    }}
                  >
                    {requestActionModal.submitting
                      ? 'Please wait...'
                      : requestActionModal.action === 'accept'
                        ? 'Confirm Accept'
                        : 'Confirm Decline'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Assign Program Modal */}
          {showAssignProgramModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
              <div className="modal-dialog">
                <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: '#fff' }}>Assign Program to {selectedClient?.name}</h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white"
                    onClick={() => setShowAssignProgramModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {programs.length === 0 ? (
                    <div className="alert" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      You don't have any programs yet. Create a program first!
                    </div>
                  ) : (
                    <div>
                      <label className="form-label" style={{ color: '#fff' }}>Select Program</label>
                      <select 
                        className="form-select"
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                      >
                        <option value="">Choose a program...</option>
                        {programs.map(program => (
                          <option key={program.id} value={program.id}>
                            {program.title} - ${program.price}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <button 
                    type="button" 
                    className="btn"
                    onClick={() => setShowAssignProgramModal(false)}
                    style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                  >
                    Cancel
                  </button>
                  {programs.length > 0 && (
                    <button 
                      type="button" 
                      className="btn"
                      onClick={handleAssignProgram}
                      disabled={!selectedProgram}
                      style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                    >
                      Assign Program
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disconnect Modal */}
        {showDisconnectModal && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="modal-header dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: '#fff' }}>End Coaching Relationship?</h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowDisconnectModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p style={{ color: '#9ca3af' }}>
                    Are you sure you want to end your coaching relationship with <strong style={{ color: '#fff' }}>{selectedClient?.name}</strong>? 
                    This action will disconnect you from your client.
                  </p>
                  <div className="mb-3">
                    <label className="form-label" style={{ color: '#fff' }}>Reason for ending relationship (required)</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={disconnectReason}
                      onChange={(e) => setDisconnectReason(e.target.value)}
                      placeholder="Please let us know why you're ending this relationship..."
                    ></textarea>
                  </div>
                  <div className="alert small mb-0" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    The client will be notified about the relationship ending.
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <button className="btn" onClick={() => setShowDisconnectModal(false)} style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleDisconnect}>
                    Confirm End Relationship
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {notification.show && (
          <div className="position-fixed top-0 end-0 p-3" style={{zIndex: 9999}}>
            <div className="toast show align-items-center text-white border-0" role="alert" style={{ backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'danger' ? '#dc3545' : '#fbbf24' }}>
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
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerClientsManagement;
