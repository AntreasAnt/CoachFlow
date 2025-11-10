import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';

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
            <div className="dropdown">
              <button className="btn btn-outline-dark btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={() => navigate('/profile')}
                  >
                    <i className="bi bi-person me-2"></i>Profile
                  </button>
                </li>
                <li>
                  <a className="dropdown-item" href="#">
                    <i className="bi bi-gear me-2"></i>Settings
                  </a>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li><LogoutButton className="dropdown-item" /></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TraineeHeader;
