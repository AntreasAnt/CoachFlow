import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from '../../components/LogoutButton';

const TraineeDashboard = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-primary sidebar">
          <div className="position-sticky pt-3">
            <div className="text-center mb-4">
              <h4 className="text-white">CoachFlow</h4>
              <p className="text-white-50 small">My Fitness Journey</p>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link className="nav-link text-white" to="/trainee/dashboard">
                  <i className="bi bi-house me-2"></i>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainee/workouts">
                  <i className="bi bi-lightning me-2"></i>
                  My Workouts
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainee/progress">
                  <i className="bi bi-graph-up me-2"></i>
                  Progress
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainee/nutrition">
                  <i className="bi bi-apple me-2"></i>
                  Nutrition
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainee/messages">
                  <i className="bi bi-chat-dots me-2"></i>
                  Messages
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainee/profile">
                  <i className="bi bi-person me-2"></i>
                  Profile
                </Link>
              </li>
              <li className="nav-item mt-3 pt-3 border-top">
                <LogoutButton className="btn btn-outline-light w-100" />
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Welcome Back, John!</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <Link to="/trainee/start-workout" className="btn btn-sm btn-primary">
                  <i className="bi bi-play-circle me-1"></i>
                  Start Workout
                </Link>
              </div>
            </div>
          </div>

          {/* Today's Workout */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow rounded-4 bg-gradient" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                <div className="card-body text-white p-4">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h3 className="card-title mb-3">Today's Workout: Upper Body Strength</h3>
                      <p className="card-text mb-3">Focus on building strength in your chest, back, and arms. Duration: 45 minutes</p>
                      <Link to="/trainee/workout/today" className="btn btn-light btn-lg">
                        <i className="bi bi-play-circle me-2"></i>Start Now
                      </Link>
                    </div>
                    <div className="col-md-4 text-center">
                      <i className="bi bi-lightning-fill" style={{fontSize: '4rem'}}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4">
                <div className="card-body text-center">
                  <div className="text-primary mb-2">
                    <i className="bi bi-calendar-check fs-1"></i>
                  </div>
                  <div className="text-xs font-weight-bold text-uppercase text-muted mb-1">
                    Workouts This Week
                  </div>
                  <div className="h4 mb-0 font-weight-bold text-primary">4/5</div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4">
                <div className="card-body text-center">
                  <div className="text-success mb-2">
                    <i className="bi bi-trophy fs-1"></i>
                  </div>
                  <div className="text-xs font-weight-bold text-uppercase text-muted mb-1">
                    Streak Days
                  </div>
                  <div className="h4 mb-0 font-weight-bold text-success">12</div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4">
                <div className="card-body text-center">
                  <div className="text-info mb-2">
                    <i className="bi bi-stopwatch fs-1"></i>
                  </div>
                  <div className="text-xs font-weight-bold text-uppercase text-muted mb-1">
                    Total Minutes
                  </div>
                  <div className="h4 mb-0 font-weight-bold text-info">1,240</div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4">
                <div className="card-body text-center">
                  <div className="text-warning mb-2">
                    <i className="bi bi-fire fs-1"></i>
                  </div>
                  <div className="text-xs font-weight-bold text-uppercase text-muted mb-1">
                    Calories Burned
                  </div>
                  <div className="h4 mb-0 font-weight-bold text-warning">2,850</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Progress */}
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3 d-flex justify-content-between align-items-center">
                  <h6 className="m-0 font-weight-bold text-primary">Recent Workouts</h6>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Lower Body Strength</h6>
                        <small className="text-muted">Yesterday - 50 minutes</small>
                      </div>
                      <span className="badge bg-success rounded-pill">Completed</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">HIIT Cardio Session</h6>
                        <small className="text-muted">2 days ago - 30 minutes</small>
                      </div>
                      <span className="badge bg-success rounded-pill">Completed</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Full Body Circuit</h6>
                        <small className="text-muted">3 days ago - 45 minutes</small>
                      </div>
                      <span className="badge bg-success rounded-pill">Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Quick Actions</h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <Link to="/trainee/start-workout" className="btn btn-primary">
                      <i className="bi bi-play-circle me-2"></i>Start Workout
                    </Link>
                    <Link to="/trainee/progress-photo" className="btn btn-outline-primary">
                      <i className="bi bi-camera me-2"></i>Upload Progress Photo
                    </Link>
                    <Link to="/trainee/message-trainer" className="btn btn-outline-success">
                      <i className="bi bi-chat-dots me-2"></i>Message Trainer
                    </Link>
                  </div>
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="card shadow rounded-4 mb-4 bg-light">
                <div className="card-body text-center">
                  <i className="bi bi-quote text-primary fs-2 mb-3"></i>
                  <blockquote className="blockquote mb-0">
                    <p className="mb-2">"The only bad workout is the one that didn't happen."</p>
                    <footer className="blockquote-footer">
                      <small className="text-muted">Stay motivated!</small>
                    </footer>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TraineeDashboard;
