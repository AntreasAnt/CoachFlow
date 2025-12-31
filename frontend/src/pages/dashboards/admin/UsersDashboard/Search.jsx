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
      <span className="input-group-text">
        <i className="bi bi-search"></i>
      </span>
      <input
        type="text"
        className="form-control"
  placeholder="Search user..."
        value={query}
        // the user types in the input field, the query state is updated with the current value of the input field.
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* Full button for screens sm and up */}
      {query && (
      <button 
        type="button" 
        className="btn btn-sm btn-secondary ms-2"
        onClick={handleClear}
      >
        <i className="bi bi-x-circle me-1"></i>
        Clear
      </button>
      )}
      {/* For extra-small screens, show a simple 'x' icon */}
      {query && (
              <button 
              type="button" 
              className="btn btn-sm btn-secondary d-block d-sm-none"
              onClick={handleClear}
            >
          <i className="bi bi-x"></i>
        </button>
      )}
    </div>
  </form>
  );
};