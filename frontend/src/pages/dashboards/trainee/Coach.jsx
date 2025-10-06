import React, { useState, useEffect } from 'react';
import { BACKEND_ROUTES_API } from '../../../config/config';

const Coach = () => {
  const [hasCoach, setHasCoach] = useState(true); // Change to false to show coach search
  const [currentCoach, setCurrentCoach] = useState(null);
  const [messages, setMessages] = useState([]);
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoachData();
  }, []);

  const fetchCoachData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_ROUTES_API}GetCoachData.php`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch coach data');
      }

      const data = await response.json();

      if (data.success) {
        setCurrentCoach(data.currentCoach);
        setMessages(data.messages);
        setAvailableCoaches(data.availableCoaches);
      } else {
        throw new Error(data.message || 'Failed to load coach data');
      }

    } catch (err) {
      console.error('Error fetching coach data:', err);
      setError('Failed to load coach data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        sender: 'trainee',
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading coach data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchCoachData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderCurrentCoach = () => {
    if (!currentCoach) {
      return (
        <div className="text-center py-4">
          <i className="bi bi-person-plus text-muted fs-1"></i>
          <p className="text-muted mt-2">No coach assigned yet</p>
          <button className="btn btn-primary">Find a Coach</button>
        </div>
      );
    }

    return (
    <div>
      {/* Coach Profile */}
      <div className="row mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-start">
                <div className="text-center me-4">
                  <div className="fs-1 mb-2">{currentCoach.avatar}</div>
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-star-fill text-warning me-1"></i>
                    <span className="fw-bold">{currentCoach.average_rating}</span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h4 className="mb-1">{currentCoach.name}</h4>
                      <p className="text-muted mb-2">{currentCoach.specializations}</p>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-success mb-2">Active</span>
                      <br />
                      <span className="fw-bold text-primary">${currentCoach.hourly_rate}/hr</span>
                    </div>
                  </div>
                  
                  <p className="mb-3">{currentCoach.bio}</p>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <small className="text-muted">Experience</small>
                      <p className="fw-bold mb-0">{currentCoach.experience_years} years</p>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Total Clients</small>
                      <p className="fw-bold mb-0">{currentCoach.total_clients}</p>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Rating</small>
                      <p className="fw-bold mb-0">{currentCoach.average_rating}/5.0</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">Certifications</small>
                    <div className="mt-1">
                      {currentCoach.certifications && currentCoach.certifications.split(',').map((cert, index) => (
                        <span key={index} className="badge bg-light text-dark me-2">{cert.trim()}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary">
                      <i className="bi bi-chat-dots me-2"></i>
                      Send Message
                    </button>
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-calendar me-2"></i>
                      Schedule Session
                    </button>
                    <button className="btn btn-outline-secondary">
                      <i className="bi bi-person-x me-2"></i>
                      End Coaching
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Quick Stats</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Sessions Completed</span>
                  <span className="fw-bold">24</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Coaching Since</span>
                  <span className="fw-bold">Jan 2024</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Response Time</span>
                  <span className="fw-bold">&lt; 2 hours</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Next Session</span>
                  <span className="fw-bold">Tomorrow 6PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Recent Messages</h6>
                <button className="btn btn-primary btn-sm">
                  <i className="bi bi-chat-dots me-2"></i>
                  New Message
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="messages-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {messages.map(message => (
                  <div key={message.id} className={`d-flex mb-3 ${message.from === 'trainee' ? 'justify-content-end' : ''}`}>
                    <div className={`message-bubble p-3 rounded ${message.from === 'coach' ? 'bg-light me-5' : 'bg-primary text-white ms-5'}`} style={{ maxWidth: '70%' }}>
                      <p className="mb-1">{message.message}</p>
                      <small className={message.from === 'coach' ? 'text-muted' : 'text-white-50'}>
                        {message.timestamp}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
              
              <hr />
              
              <div className="d-flex gap-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Type your message..."
                />
                <button className="btn btn-primary">
                  <i className="bi bi-send"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderCoachSearch = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Find Your Perfect Coach</h4>
        <div className="d-flex gap-2">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by specialization..."
            style={{ width: '250px' }}
          />
          <button className="btn btn-outline-primary">
            <i className="bi bi-funnel"></i> Filter
          </button>
        </div>
      </div>

      <div className="row">
        {availableCoaches.map(coach => (
          <div key={coach.id} className="col-lg-4 col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-center mb-3">
                  <div className="fs-1 mb-2">{coach.avatar}</div>
                  {coach.verified && (
                    <span className="badge bg-success mb-2">
                      <i className="bi bi-check-circle me-1"></i>
                      Verified
                    </span>
                  )}
                  <h5 className="card-title">{coach.name}</h5>
                  <p className="text-muted small">{coach.specialization}</p>
                </div>

                <div className="row text-center mb-3">
                  <div className="col-4">
                    <div className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-star-fill text-warning me-1"></i>
                      <span className="small fw-bold">{coach.rating}</span>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-people me-1"></i>
                      <span className="small">{coach.clients}</span>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-clock me-1"></i>
                      <span className="small">{coach.experience}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-3">
                  <span className="fw-bold text-primary">{coach.price}</span>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-fill">
                    <i className="bi bi-person-plus me-2"></i>
                    Hire Coach
                  </button>
                  <button className="btn btn-outline-primary">
                    <i className="bi bi-eye"></i>
                  </button>
                  <button className="btn btn-outline-secondary">
                    <i className="bi bi-chat-dots"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-4">
        <button className="btn btn-outline-primary">
          <i className="bi bi-arrow-clockwise me-2"></i>
          Load More Coaches
        </button>
      </div>
    </div>
  );

  return (
    <div className="container-fluid px-4 py-3">
      {hasCoach ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">My Coach</h4>
            <button 
              className="btn btn-outline-primary"
              onClick={() => setHasCoach(false)}
            >
              <i className="bi bi-search me-2"></i>
              Find New Coach
            </button>
          </div>
          {renderCurrentCoach()}
        </div>
      ) : (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">Available Coaches</h4>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => setHasCoach(true)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to My Coach
            </button>
          </div>
          {renderCoachSearch()}
        </div>
      )}
    </div>
  );
};

export default Coach;
