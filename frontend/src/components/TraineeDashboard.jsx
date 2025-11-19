import React from 'react';
import { useNavigate } from 'react-router-dom';
import TraineeHeader from './TraineeHeader';

const TraineeDashboard = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 bg-white">
      <TraineeHeader />

      <main className="pb-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {children}
      </main>

      <nav className="fixed-bottom footer-menu">
        <div className="container-fluid" style={{ backgroundColor: 'white', borderTop: '1px solid #dee2e6' }}>
          <div className="row">
            <div className="col">
              <button
                className={`btn w-100 py-2 border-0 ${
                  window.location.pathname === '/' ? 'text-primary nav-btn-active' : 'text-muted'
                }`}
                onClick={() => navigate('/')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-house${window.location.pathname === '/dashboard' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Home
                  </small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-2 border-0 ${
                  window.location.pathname === '/workouts' ? 'text-primary nav-btn-active' : 'text-muted'
                }`}
                onClick={() => navigate('/workouts')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-lightning${window.location.pathname === '/workouts' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Workouts</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-2 border-0 ${
                  window.location.pathname === '/meals' ? 'text-primary nav-btn-active' : 'text-muted'
                }`}
                onClick={() => navigate('/meals')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-cup-hot${window.location.pathname === '/meals' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Meals</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-2 border-0 ${
                  window.location.pathname === '/progress' ? 'text-primary nav-btn-active' : 'text-muted'
                }`}
                onClick={() => navigate('/progress')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-graph-up${window.location.pathname === '/progress' ? '-arrow' : ''} fs-5`}></i>
                  <small className="mt-1">Progress</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-2 border-0 ${
                  window.location.pathname === '/coach' ? 'text-primary nav-btn-active' : 'text-muted'
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
      </nav>
    </div>
  );
};

export default TraineeDashboard;
