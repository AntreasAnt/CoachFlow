import React from 'react';
import '../../../styles/trainee-dashboard.css';
import TraineeDashboard from '../../../components/TraineeDashboard';

const ProgressPage = () => {
  return (
    <TraineeDashboard>
      {/* Content */}
      <div className="bg-luxury">
        <div className="bg-white border-bottom">
          <div className="container-fluid px-4 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div>
                  <h2 className="h5 mb-0 fw-bold text-dark">Progress</h2>
                  <p className="small text-muted mb-0">Track your fitness journey</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container-fluid px-4 py-4 pb-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <div className="text-center py-5">
            <i className="bi bi-graph-up-arrow display-1 text-primary mb-3"></i>
            <h2 className="h3 mb-3">Progress Tracking Coming Soon</h2>
            <p className="text-muted">View your stats and achievements.</p>
          </div>
        </div>
      </div>
    </TraineeDashboard>
  );
};

export default ProgressPage;
