import React, { useState } from 'react';

const Coach = () => {
  const [hasCoach, setHasCoach] = useState(true); // Change to false to show coach search
  
  const [currentCoach] = useState({
    name: "Coach Mike Johnson",
    specialization: "Strength Training & Bodybuilding",
    rating: 4.9,
    experience: "8 years",
    clients: 150,
    avatar: "👨‍💼",
    price: "$50/session",
    certifications: ["NASM-CPT", "CSCS", "Precision Nutrition L1"],
    bio: "Passionate fitness coach with 8+ years of experience helping clients achieve their strength and physique goals. Specialized in powerlifting, bodybuilding, and functional movement patterns."
  });

  const [messages] = useState([
    {
      id: 1,
      from: "coach",
      message: "Great job on yesterday's workout! I noticed you increased your bench press weight. Keep up the excellent work!",
      timestamp: "2 hours ago",
      read: true
    },
    {
      id: 2,
      from: "trainee",
      message: "Thank you! I felt really strong yesterday. Should I increase the weight again next session?",
      timestamp: "1 hour ago",
      read: true
    },
    {
      id: 3,
      from: "coach",
      message: "Let's see how you feel during the warm-up sets. If they feel easy, we can add 2.5kg more.",
      timestamp: "30 minutes ago",
      read: false
    }
  ]);

  const [availableCoaches] = useState([
    {
      id: 1,
      name: "Coach Sarah Wilson",
      specialization: "Weight Loss & Conditioning",
      rating: 4.8,
      experience: "6 years",
      clients: 200,
      avatar: "👩‍💼",
      price: "$45/session",
      verified: true
    },
    {
      id: 2,
      name: "Coach Alex Thompson",
      specialization: "Bodybuilding & Nutrition",
      rating: 4.7,
      experience: "10 years",
      clients: 120,
      avatar: "👨‍🏫",
      price: "$60/session",
      verified: true
    },
    {
      id: 3,
      name: "Coach Emma Davis",
      specialization: "Functional Training",
      rating: 4.9,
      experience: "5 years",
      clients: 85,
      avatar: "👩‍🏫",
      price: "$40/session",
      verified: true
    }
  ]);

  const renderCurrentCoach = () => (
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
                    <span className="fw-bold">{currentCoach.rating}</span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h4 className="mb-1">{currentCoach.name}</h4>
                      <p className="text-muted mb-2">{currentCoach.specialization}</p>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-success mb-2">Active</span>
                      <br />
                      <span className="fw-bold text-primary">{currentCoach.price}</span>
                    </div>
                  </div>
                  
                  <p className="mb-3">{currentCoach.bio}</p>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <small className="text-muted">Experience</small>
                      <p className="fw-bold mb-0">{currentCoach.experience}</p>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Total Clients</small>
                      <p className="fw-bold mb-0">{currentCoach.clients}</p>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Rating</small>
                      <p className="fw-bold mb-0">{currentCoach.rating}/5.0</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted">Certifications</small>
                    <div className="mt-1">
                      {currentCoach.certifications.map((cert, index) => (
                        <span key={index} className="badge bg-light text-dark me-2">{cert}</span>
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
