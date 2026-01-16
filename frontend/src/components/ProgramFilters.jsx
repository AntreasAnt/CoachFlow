import React from 'react';

const ProgramFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const categories = [
    'Strength Training',
    'Cardio',
    'Yoga',
    'HIIT',
    'Bodybuilding',
    'Weight Loss',
    'Flexibility',
    'Sports Training'
  ];

  const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            Filters
          </h5>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={onClearFilters}
          >
            <i className="bi bi-x-circle me-1"></i>
            Clear All
          </button>
        </div>

        <div className="row g-3">
          {/* Search */}
          <div className="col-md-12">
            <label className="form-label small fw-bold">Search Programs</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title or description..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Category */}
          <div className="col-md-6">
            <label className="form-label small fw-bold">Category</label>
            <select
              className="form-select"
              value={filters.category || ''}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div className="col-md-6">
            <label className="form-label small fw-bold">Difficulty Level</label>
            <select
              className="form-select"
              value={filters.difficulty_level || ''}
              onChange={(e) => onFilterChange({ ...filters, difficulty_level: e.target.value })}
            >
              <option value="">All Levels</option>
              {difficultyLevels.map(level => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="col-md-6">
            <label className="form-label small fw-bold">Duration (weeks)</label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min"
                  min="1"
                  value={filters.min_duration || ''}
                  onChange={(e) => onFilterChange({ ...filters, min_duration: e.target.value })}
                />
              </div>
              <div className="col-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max"
                  min="1"
                  value={filters.max_duration || ''}
                  onChange={(e) => onFilterChange({ ...filters, max_duration: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="col-md-6">
            <label className="form-label small fw-bold">Price Range ($)</label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min"
                  min="0"
                  value={filters.min_price || ''}
                  onChange={(e) => onFilterChange({ ...filters, min_price: e.target.value })}
                />
              </div>
              <div className="col-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max"
                  min="0"
                  value={filters.max_price || ''}
                  onChange={(e) => onFilterChange({ ...filters, max_price: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Trainer Name */}
          <div className="col-md-12">
            <label className="form-label small fw-bold">Trainer Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by trainer name..."
              value={filters.trainer_name || ''}
              onChange={(e) => onFilterChange({ ...filters, trainer_name: e.target.value })}
            />
          </div>

          {/* Sort By */}
          <div className="col-md-12">
            <label className="form-label small fw-bold">Sort By</label>
            <select
              className="form-select"
              value={filters.sort_by || 'popular'}
              onChange={(e) => onFilterChange({ ...filters, sort_by: e.target.value })}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramFilters;
