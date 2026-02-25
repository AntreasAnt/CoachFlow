import React, { useState } from 'react';

export const Search = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3">
    <div className="input-group position-relative">
      <span className="input-group-text" style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
        <i className="bi bi-search"></i>
      </span>
      <input
        type="text"
        className="form-control"
        placeholder="Search user..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ 
          backgroundColor: '#2d2d2d', 
          borderColor: 'rgba(16, 185, 129, 0.2)', 
          color: '#fff',
          '::placeholder': { color: '#9ca3af' }
        }}
      />
      {/* Full button for screens sm and up */}
      {query && (
      <button 
        type="button" 
        className="btn btn-sm ms-2"
        onClick={handleClear}
        style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
      >
        <i className="bi bi-x-circle me-1"></i>
        Clear
      </button>
      )}
      {/* For extra-small screens, show a simple 'x' icon */}
      {query && (
              <button 
              type="button" 
              className="btn btn-sm d-block d-sm-none"
              onClick={handleClear}
              style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
            >
          <i className="bi bi-x"></i>
        </button>
      )}
    </div>
  </form>
  );
};