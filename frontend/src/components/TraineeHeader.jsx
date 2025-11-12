import React from 'react';
import { useNavigate } from 'react-router-dom';

const TraineeHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-bottom">
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h4 mb-0 fw-bold text-dark">CoachFlow</h1>
            <p className="small text-muted mb-0">Welcome back, Trainee!</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-dark btn-sm">
              <i className="bi bi-bell"></i>
            </button>
            <button 
              className="btn btn-outline-dark btn-sm"
              onClick={() => navigate('/profile')}
              title="Profile"
            >
              <i className="bi bi-person-circle"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TraineeHeader;
