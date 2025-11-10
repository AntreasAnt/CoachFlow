import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/trainee-dashboard.css';

const CoachPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 bg-luxury">
      {/* Header */}
      <header className="bg-white shadow-sm border-bottom sticky-top">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div>
                <h1 className="h4 mb-0 fw-bold text-dark">
                  Your Coach
                </h1>
                <p className="small text-muted mb-0">
                  Connect with your personal trainer
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-fluid px-4 py-4 pb-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center py-5">
          <i className="bi bi-person-check-fill display-1 text-primary mb-3"></i>
          <h2 className="h3 mb-3">Coach Connection Coming Soon</h2>
          <p className="text-muted">Connect with your personal trainer and get expert guidance.</p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed-bottom footer-menu" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="container-fluid" style={{ backgroundColor: 'white', borderTop: '1px solid #dee2e6' }}>
          <div className="row">
            <div className="col">
              <div className={window.location.pathname === '/' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-house${window.location.pathname === '/' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1">Home</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={window.location.pathname === '/workouts' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/workouts' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/workouts')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-lightning${window.location.pathname === '/workouts' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1">Workouts</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={window.location.pathname === '/meals' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/meals' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/meals')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-${window.location.pathname === '/meals' ? 'cup-hot-fill' : 'cup-hot'} fs-5`}></i>
                    <small className="mt-1">Meals</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={window.location.pathname === '/progress' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/progress' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/progress')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-graph-up${window.location.pathname === '/progress' ? '-arrow' : ''} fs-5`}></i>
                    <small className="mt-1">Progress</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={window.location.pathname === '/coach' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/coach' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/coach')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-person-check${window.location.pathname === '/coach' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1">Coach</small>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CoachPage;
