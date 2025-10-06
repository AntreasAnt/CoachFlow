import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from "../config/config";

const LogoutButton = ({ className = "btn btn-outline-danger" }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch(BACKEND_ROUTES_API + "Logout.php", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Clear any local storage
        localStorage.removeItem('user');
        // Redirect to home page and force refresh
        window.location.href = '/';
      } else {
        console.error('Logout failed:', data.message);
        // Even if logout fails on server, clear local data and redirect
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local data and redirect
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className={className}
      title="Logout"
    >
      <i className="bi bi-box-arrow-right me-1"></i>
      Logout
    </button>
  );
};

export default LogoutButton;
