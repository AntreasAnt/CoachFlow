import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const TrainerDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/trainer-dashboard', icon: 'speedometer2', label: 'Overview' },
    { path: '/trainer-dashboard/profile', icon: 'person-circle', label: 'Profile' },
    { path: '/trainer-dashboard/programs', icon: 'grid-3x3-gap', label: 'Programs' },
    { path: '/trainer-dashboard/clients', icon: 'people', label: 'Clients' },
    { path: '/trainer-dashboard/payments', icon: 'credit-card', label: 'Payments' },
    { path: '/trainer-dashboard/messages', icon: 'chat-dots', label: 'Messages' },
  ];

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div 
        className="bg-dark text-white d-flex flex-column"
        style={{
          width: isSidebarCollapsed ? '80px' : '320px',
          transition: 'width 0.3s ease',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        {/* Logo */}
        <div className="p-3 border-bottom border-secondary">
          <div className="d-flex justify-content-end mb-2">
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <i className={`bi bi-${isSidebarCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
            </button>
          </div>
          {!isSidebarCollapsed && (
            <div className="text-center">
              <h4 className="mb-0 text-white">
                <i className="bi bi-lightning-charge-fill text-primary me-2"></i>
                CoachFlow
              </h4>
              <small className="text-light d-block mt-1">Trainer Dashboard</small>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 py-3">
          <ul className="nav flex-column">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <button
                  className={`btn w-100 text-start rounded-0 border-0 py-3 ${
                    isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-light'
                  }`}
                  onClick={() => navigate(item.path)}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  <i className={`bi bi-${item.icon} fs-5 ${isSidebarCollapsed ? '' : 'me-3'}`}></i>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-top border-secondary">
          <LogoutButton 
            className="btn btn-outline-light w-100"
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
            {!isSidebarCollapsed && <span className="ms-2">Logout</span>}
          </LogoutButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
};

export default TrainerDashboardLayout;
