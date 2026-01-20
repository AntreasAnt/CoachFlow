import React, { useState, useEffect } from 'react';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const TrainerClients = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [clients, setClients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchClientsData();
  }, []);

  const fetchClientsData = async () => {
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

    } catch (error) {
      console.error('Error fetching clients data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}AcceptCoachingRequest.php`, {
        requestId
      });

      if (response.success) {
        setShowRequestModal(false);
        fetchClientsData();
        alert('Coaching request accepted successfully!');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}DeclineCoachingRequest.php`, {
        requestId
      });

      if (response.success) {
        setShowRequestModal(false);
        fetchClientsData();
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
    }
  };

  const formatDate = (dateString) => {
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
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">My Clients</h2>
            <p className="text-muted mb-0">Manage your coaching relationships</p>
          </div>
          {requests.length > 0 && (
            <span className="badge bg-danger rounded-pill fs-6">
              {requests.length} New Request{requests.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Active Clients</p>
                    <h3 className="mb-0">{clients.length}</h3>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-people text-primary fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Pending Requests</p>
                    <h3 className="mb-0">{requests.length}</h3>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-hourglass-split text-warning fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Programs Assigned</p>
                    <h3 className="mb-0">
                      {clients.reduce((sum, client) => sum + (client.assigned_programs || 0), 0)}
                    </h3>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-collection text-success fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">This Week</p>
                    <h3 className="mb-0">24</h3>
                  </div>
                  <div className="bg-info bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-calendar-check text-info fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <i className="bi bi-people me-2"></i>
              Active Clients ({clients.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <i className="bi bi-inbox me-2"></i>
              Requests ({requests.length})
              {requests.length > 0 && (
                <span className="badge bg-danger ms-2">{requests.length}</span>
              )}
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'active' && (
          <div>
            {clients.length === 0 ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-people fs-1 text-muted mb-3 d-block"></i>
                  <h5 className="text-muted">No active clients yet</h5>
                  <p className="text-muted">
                    Clients will appear here once they request coaching from you
                  </p>
                </div>
              </div>
            ) : (
              <div className="row">
                {clients.map((client) => (
                  <div key={client.id} className="col-lg-4 col-md-6 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                            style={{ width: '50px', height: '50px', fontSize: '1.25rem' }}
                          >
                            {client.name?.charAt(0) || 'C'}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">{client.name}</h6>
                            <small className="text-muted">{client.email}</small>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Started:</span>
                            <span className="small">{formatDate(client.started_at)}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Programs:</span>
                            <span className="badge bg-primary">{client.assigned_programs || 0}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted small">Last Active:</span>
                            <span className="small">{client.last_active || 'Today'}</span>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary flex-fill"
                            onClick={() => {
                              setSelectedClient(client);
                              setShowClientModal(true);
                            }}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </button>
                          <button className="btn btn-sm btn-outline-secondary">
                            <i className="bi bi-chat-dots"></i>
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

        {activeTab === 'requests' && (
          <div>
            {requests.length === 0 ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                  <h5 className="text-muted">No pending requests</h5>
                  <p className="text-muted">
                    Coaching requests from trainees will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className="row">
                {requests.map((request) => (
                  <div key={request.id} className="col-lg-6 mb-4">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex align-items-start mb-3">
                          <div
                            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                            style={{ width: '50px', height: '50px', fontSize: '1.25rem' }}
                          >
                            {request.trainee_name?.charAt(0) || 'T'}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{request.trainee_name}</h6>
                            <small className="text-muted">{request.trainee_email}</small>
                            <div className="mt-2">
                              <span className="badge bg-warning text-dark">
                                <i className="bi bi-clock me-1"></i>
                                {formatDate(request.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mb-3">
                            <p className="text-muted mb-0 small">
                              <i className="bi bi-chat-quote me-2"></i>
                              "{request.message}"
                            </p>
                          </div>
                        )}

                        <div className="mb-3">
                          <div className="row g-2 small">
                            <div className="col-6">
                              <div className="text-muted">Experience:</div>
                              <div>{request.experience_level || 'Not specified'}</div>
                            </div>
                            <div className="col-6">
                              <div className="text-muted">Goals:</div>
                              <div>{request.goals || 'Not specified'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-success flex-fill"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Accept
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary flex-fill"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRequestModal(true);
                            }}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View Details
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            <i className="bi bi-x-circle"></i>
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
      </div>

      {/* Client Details Modal */}
      {showClientModal && selectedClient && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Client Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowClientModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                  >
                    {selectedClient.name?.charAt(0) || 'C'}
                  </div>
                  <h4>{selectedClient.name}</h4>
                  <p className="text-muted">{selectedClient.email}</p>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Contact Information</h6>
                    <p className="text-muted">
                      <i className="bi bi-envelope me-2"></i>
                      {selectedClient.email}
                    </p>
                    {selectedClient.phone && (
                      <p className="text-muted">
                        <i className="bi bi-telephone me-2"></i>
                        {selectedClient.phone}
                      </p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6>Coaching Details</h6>
                    <p className="text-muted">
                      <i className="bi bi-calendar me-2"></i>
                      Started: {formatDate(selectedClient.started_at)}
                    </p>
                    <p className="text-muted">
                      <i className="bi bi-collection me-2"></i>
                      Programs: {selectedClient.assigned_programs || 0}
                    </p>
                  </div>
                </div>

                <h6>Assigned Programs</h6>
                <p className="text-muted">No programs assigned yet</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClientModal(false)}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Assign Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Coaching Request Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRequestModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>{selectedRequest.trainee_name}</h6>
                  <p className="text-muted">{selectedRequest.trainee_email}</p>
                </div>

                {selectedRequest.message && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Message:</label>
                    <p className="text-muted">{selectedRequest.message}</p>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold">Experience Level:</label>
                  <p className="text-muted">{selectedRequest.experience_level || 'Not specified'}</p>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Goals:</label>
                  <p className="text-muted">{selectedRequest.goals || 'Not specified'}</p>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Requested:</label>
                  <p className="text-muted">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => handleDeclineRequest(selectedRequest.id)}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleAcceptRequest(selectedRequest.id)}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Accept Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TrainerDashboardLayout>
  );
};

export default TrainerClients;
