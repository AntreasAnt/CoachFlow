import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const AdminDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isNarrowScreen, setIsNarrowScreen] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 991.98px)').matches;
  });
  
  // Initialize sidebar state from localStorage, default to false (expanded)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      if (window.matchMedia('(max-width: 991.98px)').matches) return true;
    }
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === 'true';
  });

  // Force collapsed sidebar on md/sm (no option to expand)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(max-width: 991.98px)');

    const apply = () => {
      const narrow = mediaQuery.matches;
      setIsNarrowScreen(narrow);
      if (narrow) {
        setIsSidebarCollapsed(true);
      } else {
        const saved = localStorage.getItem('adminSidebarCollapsed');
        setIsSidebarCollapsed(saved === 'true');
      }
    };

    apply();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', apply);
      return () => mediaQuery.removeEventListener('change', apply);
    }

    // Safari fallback
    mediaQuery.addListener(apply);
    return () => mediaQuery.removeListener(apply);
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (!isNarrowScreen) {
      localStorage.setItem('adminSidebarCollapsed', isSidebarCollapsed);
    }
  }, [isSidebarCollapsed, isNarrowScreen]);

  const isActive = (path) => {
    if (path === '/admin-dashboard') {
      return location.pathname === path || location.pathname === '/';
    }
    return location.pathname === path;
  };

  const navItems = [
    { path: '/admin-dashboard', icon: 'speedometer2', label: 'Dashboard' },
    { path: '/admin/analytics', icon: 'graph-up', label: 'Analytics' },
    { path: '/admin/users', icon: 'people', label: 'User Management' },
    { path: '/admin/email-marketing', icon: 'envelope-at', label: 'Email Marketing' },
    { path: '/admin/messages', icon: 'chat-dots', label: 'Messages' },
  ];

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
      {/* Sidebar */}
      <div 
        className="text-white d-flex flex-column"
        style={{
          backgroundColor: '#000000',
          width: isSidebarCollapsed ? '80px' : '280px',
          minWidth: isSidebarCollapsed ? '80px' : '280px',
          maxWidth: isSidebarCollapsed ? '80px' : '280px',
          flexShrink: 0,
          transition: 'all 0.3s ease',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          borderRight: '1px solid rgba(16, 185, 129, 0.2)'
        }}
      >
        {/* Logo */}
        <div className="p-3" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
          {!isNarrowScreen && (
            <div className={`d-flex ${isSidebarCollapsed ? 'justify-content-center' : 'justify-content-end'} ${isSidebarCollapsed ? '' : 'mb-2'}`}>
              <button
                className="btn btn-sm"
                style={{ 
                  color: '#10b981', 
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '0.375rem 0.75rem'
                }}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <i className={`bi bi-${isSidebarCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
              </button>
            </div>
          )}
          {!isSidebarCollapsed && (
            <div className="text-center">
              <h4 className="mb-0 text-white">
                <i className="bi bi-lightning-charge-fill me-2" style={{ color: '#10b981' }}></i>
                CoachFlow
              </h4>
              <small className="d-block mt-1" style={{ color: '#9ca3af' }}>Admin Panel</small>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 py-3">
          <ul className="nav flex-column">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <button
                  className={`btn w-100 ${isSidebarCollapsed ? 'text-center' : 'text-start'} rounded-0 border-0 py-3`}
                  style={{
                    backgroundColor: isActive(item.path) ? '#10b981' : 'transparent',
                    color: isActive(item.path) ? '#ffffff' : '#9ca3af',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => navigate(item.path)}
                  title={isSidebarCollapsed ? item.label : ''}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                      e.currentTarget.style.color = '#10b981';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#9ca3af';
                    }
                  }}
                >
                  <i className={`bi bi-${item.icon} fs-5 ${isSidebarCollapsed ? '' : 'me-3'}`}></i>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <LogoutButton 
            className="btn w-100 d-flex justify-content-center align-items-center"
            style={{ color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' }}
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
            {!isSidebarCollapsed && <span className="ms-2">Logout</span>}
          </LogoutButton>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-grow-1"
        style={{
          backgroundColor: '#1a1a1a',
          minHeight: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div className="container-fluid py-4 px-3 px-lg-4" style={{ maxWidth: '1400px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
