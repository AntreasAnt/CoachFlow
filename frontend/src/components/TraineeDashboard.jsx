import React from 'react';
import { useNavigate } from 'react-router-dom';
import TraineeHeader from './TraineeHeader';

const TraineeDashboard = ({ children }) => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const isHomeRoute = currentPath === '/dashboard';
  const isAnalyticsRoute = currentPath === '/trainee-dashboard/analytics';
  const isPlansRoute = currentPath === '/trainee-dashboard/my-plans';
  const isCoachRoute = currentPath === '/trainee-dashboard/my-coach'
    || currentPath === '/trainee-dashboard/find-trainer'
    || currentPath.startsWith('/trainee-dashboard/trainer/');

  return (
    <div className="min-vh-100" style={{ backgroundColor: 'var(--brand-dark)' }}>
      <TraineeHeader />

      <main className="pb-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {children}
      </main>

      <nav className="fixed-bottom footer-menu" style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: 'transparent'
      }}>        <div 
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
                  color: isHomeRoute ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-house${isHomeRoute ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Home</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className="btn w-100 py-2 border-0"
                onClick={() => navigate('/trainee-dashboard/my-plans')}
                style={{
                  backgroundColor: 'transparent',
                  color: isPlansRoute ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-clipboard${isPlansRoute ? '-check' : ''} fs-5`}></i>
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
                  color: isCoachRoute ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-person-badge${isCoachRoute ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">My Coach</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className="btn w-100 py-2 border-0"
                onClick={() => navigate('/trainee-dashboard/analytics')}
                style={{
                  backgroundColor: 'transparent',
                  color: isAnalyticsRoute ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-bar-chart-line${isAnalyticsRoute ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Analytics</small>
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
