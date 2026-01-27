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
                  window.location.pathname === '/dashboard' ? 'text-primary nav-btn-active' : 'text-muted'
                }`}
                onClick={() => navigate('/dashboard')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-house${window.location.pathname === '/dashboard' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Home</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-2 border-0 ${
                  window.location.pathname === '/trainee-dashboard/find-trainer' ? 'text-primary nav-btn-active' : 'text-muted'
                }`}
                onClick={() => navigate('/trainee-dashboard/find-trainer')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-search${window.location.pathname === '/trainee-dashboard/find-trainer' ? '-heart' : ''} fs-5`}></i>
                  <small className="mt-1">Trainers</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-2 border-0 ${
                  window.location.pathname === '/trainee-dashboard/my-plans' ? 'text-primary nav-btn-active' : 'text-muted'
                }`}
                onClick={() => navigate('/trainee-dashboard/my-plans')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-clipboard${window.location.pathname === '/trainee-dashboard/my-plans' ? '-check' : ''} fs-5`}></i>
                  <small className="mt-1">My Plans</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-2 border-0 ${
                  window.location.pathname === '/trainee-dashboard/client-chat' ? 'text-primary nav-btn-active' : 'text-muted'
                }`}
                onClick={() => navigate('/trainee-dashboard/client-chat')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-chat${window.location.pathname === '/trainee-dashboard/client-chat' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Chat</small>
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
