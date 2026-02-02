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
    navigate('/trainer-dashboard/messages', { state: { selectedUserId: client.trainee_id } });
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
        <div className="container-fluid p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div className="container p-4" style={{ minHeight: 'calc(100vh - 0px)' }}>
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Client Management</h2>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('clients')}
            >
              <i className="bi bi-people me-2"></i>
              My Clients ({clients.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
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
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No clients yet. Accept coaching requests to get started!
              </div>
            ) : (
              <div className="row">
                {clients.map(client => (
                  <div key={client.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body position-relative">
                        <div className="position-absolute" style={{ top: '10px', right: '10px' }}>
                          <button 
                            className="btn btn-sm btn-light border-0"
                            type="button" 
                            onClick={() => setOpenDropdownId(openDropdownId === client.id ? null : client.id)}
                            style={{ padding: '2px 8px' }}
                          >
                            <i className="bi bi-three-dots-vertical text-dark"></i>
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
                                style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1001 }}
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
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '50px', height: '50px', fontSize: '20px' }}>
                            {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0">{client.name || 'Client'}</h5>
                            <small className="text-muted">{client.email}</small>
                          </div>
                        </div>

                        <div className="mb-3">
                          <small className="text-muted d-block">Since: {formatDate(client.accepted_at || client.created_at)}</small>
                          {client.assigned_programs > 0 && (
                            <small className="text-muted d-block">Programs: {client.assigned_programs}</small>
                          )}
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openChat(client)}
                            title="Send message"
                          >
                            <i className="bi bi-chat-dots"></i>
                          </button>
                          <button
                            className="btn btn-outline-primary btn-sm flex-grow-1"
                            onClick={() => navigate(`/trainer/clients/${client.trainee_id}/manage`)}
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
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No pending coaching requests.
              </div>
            ) : (
              <div className="row">
                {requests.map(request => (
                  <div key={request.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '50px', height: '50px', fontSize: '20px' }}>
                            {request.trainee_name ? request.trainee_name.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="mb-0">{request.trainee_name || 'Trainee'}</h5>
                            <small className="text-muted">{request.trainee_email}</small>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mb-3">
                            <small className="text-muted d-block mb-1">Message:</small>
                            <p className="small mb-0">{request.message}</p>
                          </div>
                        )}

                        <div className="mb-3">
                          <small className="text-muted">Requested: {formatDate(request.created_at)}</small>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success btn-sm flex-grow-1"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Accept
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm flex-grow-1"
                            onClick={() => handleDeclineRequest(request.id)}
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
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Assign Program to {selectedClient?.name}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowAssignProgramModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {programs.length === 0 ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      You don't have any programs yet. Create a program first!
                    </div>
                  ) : (
                    <div>
                      <label className="form-label">Select Program</label>
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
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAssignProgramModal(false)}
                  >
                    Cancel
                  </button>
                  {programs.length > 0 && (
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleAssignProgram}
                      disabled={!selectedProgram}
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
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title">End Coaching Relationship?</h5>
                  <button className="btn-close" onClick={() => setShowDisconnectModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted">
                    Are you sure you want to end your coaching relationship with <strong>{selectedClient?.name}</strong>? 
                    This action will disconnect you from your client.
                  </p>
                  <div className="mb-3">
                    <label className="form-label">Reason for ending relationship (required)</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={disconnectReason}
                      onChange={(e) => setDisconnectReason(e.target.value)}
                      placeholder="Please let us know why you're ending this relationship..."
                    ></textarea>
                  </div>
                  <div className="alert alert-warning small mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    The client will be notified about the relationship ending.
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button className="btn btn-secondary" onClick={() => setShowDisconnectModal(false)}>
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
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerClientsManagement;
