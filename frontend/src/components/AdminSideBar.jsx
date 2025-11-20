import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const AdminSideBar = () => {
  return (
    <nav className="col-md-2 d-none d-md-block bg-dark sidebar px-0">
      <div className="position-sticky pt-3">
        <div className="text-center mb-4">
          <h5 className="text-white">CoachFlow</h5>
          <p className="text-muted small">Admin</p>
        </div>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link className="nav-link text-white" to="/admin/dashboard">
              <i className="bi bi-speedometer2 me-2"></i>
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-light" to="/admin/users">
              <i className="bi bi-people me-2"></i>
              User Management
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-light" to="/admin/trainers">
              <i className="bi bi-person-badge me-2"></i>
              Trainers
            </Link>
          </li>
          <li className="nav-item mt-3 pt-3 border-top">
            <LogoutButton className="btn btn-outline-light w-100" />
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default AdminSideBar;
