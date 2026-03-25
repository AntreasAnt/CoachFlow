import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const TrainerClientsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch active clients
      const clientsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerClients.php`);
      if (clientsResponse.success) {
        setClients(clientsResponse.clients || []);
      }

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

  const handleAcceptRequest = async (requestId) => {
    if (!confirm('Accept this coaching request?')) return;
    
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}AcceptCoachingRequest.php`, {
        requestId
      });

      if (response.success) {
        fetchData();
        alert('Coaching request accepted successfully!');
      } else {
        alert(response.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    if (!confirm('Decline this coaching request?')) return;
    
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}DeclineCoachingRequest.php`, {
        requestId
      });

      if (response.success) {
        fetchData();
      } else {
        alert(response.message || 'Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
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
        fetchData();
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
        fetchData(); // Refresh client list
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
            {clients.length === 0 ? (
              <div className="alert" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}>
                <i className="bi bi-info-circle me-2"></i>
                No clients yet. Accept coaching requests to get started!
              </div>
            ) : (
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
                            <h5 className="mb-0" style={{ color: '#fff' }}>{client.name || 'Client'}</h5>
                            <small style={{ color: '#9ca3af' }}>{client.email}</small>
                          </div>
                        </div>

                        <div className="mb-3">
                          <small className="d-block" style={{ color: '#9ca3af' }}>Since: {formatDate(client.accepted_at || client.created_at)}</small>
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
                            <h5 className="mb-0" style={{ color: '#fff' }}>{request.trainee_name || 'Trainee'}</h5>
                            <small style={{ color: '#9ca3af' }}>{request.trainee_email}</small>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mb-3">
                            <small className="d-block mb-1" style={{ color: '#9ca3af' }}>Message:</small>
                            <p className="small mb-0" style={{ color: '#fff' }}>{request.message}</p>
                          </div>
                        )}

                        <div className="mb-3">
                          <small style={{ color: '#9ca3af' }}>Requested: {formatDate(request.created_at)}</small>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm flex-grow-1"
                            onClick={() => handleAcceptRequest(request.id)}
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Accept
                          </button>
                          <button
                            className="btn btn-sm flex-grow-1"
                            onClick={() => handleDeclineRequest(request.id)}
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
                <div className="modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
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
