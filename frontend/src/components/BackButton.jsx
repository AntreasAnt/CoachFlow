import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ className = '', style = {} }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to trainer dashboard if no history
      navigate('/trainer/dashboard');
    }
  };

  return (
    <button 
      className={`btn btn-secondary ${className}`}
      onClick={handleBack}
      style={style}
    >
      <i className="bi bi-arrow-left me-2"></i>
      Back
    </button>
  );
};

export default BackButton;
