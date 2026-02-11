import React from 'react';
import { useNavigate } from 'react-router-dom';
import TraineeHeader from './TraineeHeader';

const TraineeDashboard = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100" style={{ backgroundColor: 'var(--brand-dark)' }}>
      <TraineeHeader />

      <main className="pb-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {children}
      </main>

      <nav className="fixed-bottom footer-menu" style={{ paddingBottom: 'env(safe-area-inset-bottom)',backgroundColor: 'transparent' }}>
        <div 
          className="container-fluid" 
          style={{ 
            backgroundColor: 'rgba(15, 20, 15, 1)',
            borderTop: '1px solid rgba(32, 214, 87, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.3)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            margin: '0px',
            padding: '0'
          }}
        >
          <div className="row">
            <div className="col">
              <button
                className="btn w-100 py-2 border-0"
                onClick={() => navigate('/dashboard')}
                style={{
                  backgroundColor: 'transparent',
                  color: window.location.pathname === '/dashboard' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-house${window.location.pathname === '/dashboard' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Home</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className="btn w-100 py-2 border-0"
                onClick={() => navigate('/trainee-dashboard/find-trainer')}
                style={{
                  backgroundColor: 'transparent',
                  color: window.location.pathname === '/trainee-dashboard/find-trainer' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-search${window.location.pathname === '/trainee-dashboard/find-trainer' ? '-heart' : ''} fs-5`}></i>
                  <small className="mt-1">Trainers</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className="btn w-100 py-2 border-0"
                onClick={() => navigate('/trainee-dashboard/my-plans')}
                style={{
                  backgroundColor: 'transparent',
                  color: window.location.pathname === '/trainee-dashboard/my-plans' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-clipboard${window.location.pathname === '/trainee-dashboard/my-plans' ? '-check' : ''} fs-5`}></i>
                  <small className="mt-1">My Plans</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className="btn w-100 py-2 border-0"
                onClick={() => navigate('/trainee-dashboard/my-coach')}
                style={{
                  backgroundColor: 'transparent',
                  color: window.location.pathname === '/trainee-dashboard/my-coach' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-person-badge${window.location.pathname === '/trainee-dashboard/my-coach' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">My Coach</small>
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
