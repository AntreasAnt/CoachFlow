import React from 'react';

const HomePage = () => {
  const prebuiltPlans = [
    {
      id: 1,
      title: "Beginner's Strength",
      description: "Perfect for those starting their fitness journey",
      duration: "8 weeks",
      price: "$29.99",
      rating: 4.8,
      coach: "Coach Mike",
      image: "💪"
    },
    {
      id: 2,
      title: "Weight Loss Challenge",
      description: "High-intensity workouts to burn fat fast",
      duration: "12 weeks",
      price: "$49.99",
      rating: 4.9,
      coach: "Coach Sarah",
      image: "🔥"
    },
    {
      id: 3,
      title: "Muscle Building Pro",
      description: "Advanced program for serious muscle gains",
      duration: "16 weeks",
      price: "$79.99",
      rating: 4.7,
      coach: "Coach Alex",
      image: "🏋️"
    }
  ];

  const popularCoaches = [
    {
      id: 1,
      name: "Coach Mike",
      specialization: "Strength Training",
      rating: 4.9,
      clients: 150,
      price: "$50/session",
      avatar: "👨‍💼"
    },
    {
      id: 2,
      name: "Coach Sarah",
      specialization: "Weight Loss",
      rating: 4.8,
      clients: 200,
      price: "$45/session",
      avatar: "👩‍💼"
    },
    {
      id: 3,
      name: "Coach Alex",
      specialization: "Bodybuilding",
      rating: 4.7,
      clients: 120,
      price: "$60/session",
      avatar: "👨‍🏫"
    }
  ];

  return (
    <div className="container-fluid px-4 py-3">
      {/* Welcome Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-gradient-primary text-white rounded p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="row align-items-center">
              <div className="col-md-8">
                <h2 className="mb-2">Welcome to Your Fitness Journey! 🎯</h2>
                <p className="mb-3 lead">Discover premium workout plans and connect with top coaches to achieve your fitness goals.</p>
                <button className="btn btn-light btn-lg">
                  <i className="bi bi-play-circle me-2"></i>
                  Start Your Journey
                </button>
              </div>
              <div className="col-md-4 text-center">
                <div className="fs-1">🏃‍♂️</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-primary fs-1 mb-2">⚡</div>
              <h5 className="card-title">4</h5>
              <p className="card-text text-muted">Workouts This Week</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-success fs-1 mb-2">📈</div>
              <h5 className="card-title">+2.5kg</h5>
              <p className="card-text text-muted">Progress This Month</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-warning fs-1 mb-2">🔥</div>
              <h5 className="card-title">12</h5>
              <p className="card-text text-muted">Day Streak</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body py-4">
              <div className="text-info fs-1 mb-2">⏱️</div>
              <h5 className="card-title">6.5h</h5>
              <p className="card-text text-muted">Total Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-built Workout Plans */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">🏆 Premium Workout Plans</h4>
            <button className="btn btn-outline-primary btn-sm">View All</button>
          </div>
          <div className="row">
            {prebuiltPlans.map(plan => (
              <div key={plan.id} className="col-lg-4 col-md-6 mb-3">
                <div className="card h-100 border-0 shadow-sm hover-shadow">
                  <div className="card-body">
                    <div className="text-center mb-3">
                      <div className="fs-1 mb-2">{plan.image}</div>
                      <h5 className="card-title">{plan.title}</h5>
                      <p className="card-text text-muted small">{plan.description}</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-light text-dark">{plan.duration}</span>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        <small>{plan.rating}</small>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <small className="text-muted">by {plan.coach}</small>
                      <span className="fw-bold text-primary">{plan.price}</span>
                    </div>
                    <button className="btn btn-primary w-100">
                      <i className="bi bi-cart-plus me-2"></i>
                      Purchase Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Coaches */}
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">⭐ Popular Coaches</h4>
            <button className="btn btn-outline-primary btn-sm">View All</button>
          </div>
          <div className="row">
            {popularCoaches.map(coach => (
              <div key={coach.id} className="col-lg-4 col-md-6 mb-3">
                <div className="card h-100 border-0 shadow-sm hover-shadow">
                  <div className="card-body text-center">
                    <div className="fs-1 mb-3">{coach.avatar}</div>
                    <h5 className="card-title">{coach.name}</h5>
                    <p className="text-muted mb-2">{coach.specialization}</p>
                    <div className="d-flex justify-content-center align-items-center mb-2">
                      <i className="bi bi-star-fill text-warning me-1"></i>
                      <span className="me-3">{coach.rating}</span>
                      <i className="bi bi-people me-1"></i>
                      <span>{coach.clients} clients</span>
                    </div>
                    <p className="fw-bold text-primary mb-3">{coach.price}</p>
                    <button className="btn btn-outline-primary w-100">
                      <i className="bi bi-chat-dots me-2"></i>
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
