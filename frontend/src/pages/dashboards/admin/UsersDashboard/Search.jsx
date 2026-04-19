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
          color: '#fff'
        }}
      />
      {query && (
        <button 
          type="button" 
          className="btn d-flex align-items-center justify-content-center"
          onClick={handleClear}
          style={{ 
            backgroundColor: '#1a1a1a', 
            color: '#ef4444', 
            borderColor: 'rgba(16, 185, 129, 0.2)', 
            fontSize: '0.875rem',
            padding: '0.375rem 0.75rem',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1a1a';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          <i className="bi bi-x-circle me-0 me-sm-1"></i>
          <span className="d-none d-sm-inline">Clear</span>
        </button>
      )}
    </div>
  </form>
  );
};