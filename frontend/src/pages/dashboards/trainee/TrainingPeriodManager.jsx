import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TraineeDashboard from '../../../components/TraineeDashboard';
import { BACKEND_ROUTES_API } from '../../../config/config';

const TrainingPeriodManager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState({ period1: null, period2: null });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const [formData, setFormData] = useState({
    period_name: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const fetchPeriods = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}GetTrainingPeriods.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPeriods(data.periods);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching periods:', error);
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.period_name || !formData.start_date) {
      setNotification({ show: true, message: 'Period name and start date are required', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}CreateTrainingPeriod.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ show: true, message: 'Training period created successfully', type: 'success' });
        setShowCreateModal(false);
        setFormData({ period_name: '', start_date: '', end_date: '', notes: '' });
        fetchPeriods();
      } else {
        setNotification({ show: true, message: data.message || 'Failed to create period', type: 'danger' });
      }
    } catch (error) {
      console.error('Error creating period:', error);
      setNotification({ show: true, message: 'Failed to create training period', type: 'danger' });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}UpdateTrainingPeriod.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_id: editingPeriod.id,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ show: true, message: 'Training period updated successfully', type: 'success' });
        setShowEditModal(false);
        setEditingPeriod(null);
        fetchPeriods();
      } else {
        setNotification({ show: true, message: data.message || 'Failed to update period', type: 'danger' });
      }
    } catch (error) {
      console.error('Error updating period:', error);
      setNotification({ show: true, message: 'Failed to update training period', type: 'danger' });
    }
  };

  const handleEndPeriod = async (periodId) => {
    if (!window.confirm('Are you sure you want to end this training period?')) return;

    try {
      const response = await fetch(`${BACKEND_ROUTES_API}EndTrainingPeriod.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_id: periodId })
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ show: true, message: 'Training period ended', type: 'success' });
        fetchPeriods();
      }
    } catch (error) {
      console.error('Error ending period:', error);
      setNotification({ show: true, message: 'Failed to end period', type: 'danger' });
    }
  };

  const openEditModal = (period) => {
    setEditingPeriod(period);
    setFormData({
      period_name: period.period_name,
      start_date: period.start_date,
      end_date: period.end_date || '',
      notes: period.notes || ''
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({ period_name: '', start_date: '', end_date: '', notes: '' });
    setShowCreateModal(true);
  };

  const handleCompare = async () => {
    if (!selectedPeriods.period1 || !selectedPeriods.period2) {
      setNotification({ show: true, message: 'Please select two periods to compare', type: 'warning' });
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_ROUTES_API}CompareTrainingPeriods.php?period1_id=${selectedPeriods.period1}&period2_id=${selectedPeriods.period2}`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      if (data.success) {
        setComparison(data.comparison);
        setShowCompareModal(true);
      } else {
        setNotification({ show: true, message: data.message || 'Failed to compare periods', type: 'danger' });
      }
    } catch (error) {
      console.error('Error comparing periods:', error);
      setNotification({ show: true, message: 'Failed to compare training periods', type: 'danger' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Ongoing';
    return new Date(dateString).toLocaleDateString();
  };

  const getChangeColor = (value) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  };

  const getChangeIcon = (value) => {
    if (value > 0) return 'bi-arrow-up-circle-fill';
    if (value < 0) return 'bi-arrow-down-circle-fill';
    return 'bi-dash-circle';
  };

  if (loading) {
    return (
      <TraineeDashboard>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </TraineeDashboard>
    );
  }

  return (
    <TraineeDashboard>
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2><i className="bi bi-calendar-range me-2"></i>Training Periods</h2>
            <p className="text-muted">Manage and compare your training periods</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <i className="bi bi-plus-circle me-2"></i>New Period
          </button>
        </div>

        {/* Toast Notification */}
        {notification.show && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show`}>
            {notification.message}
            <button type="button" className="btn-close" onClick={() => setNotification({ show: false, message: '', type: '' })}></button>
          </div>
        )}

        {/* Compare Section */}
        {periods.length >= 2 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3"><i className="bi bi-arrow-left-right me-2"></i>Compare Training Periods</h5>
              <div className="row g-3 align-items-end">
                <div className="col-md-5">
                  <label className="form-label">Period 1</label>
                  <select 
                    className="form-select" 
                    value={selectedPeriods.period1 || ''}
                    onChange={(e) => setSelectedPeriods({...selectedPeriods, period1: e.target.value})}
                  >
                    <option value="">Select first period</option>
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.period_name} ({formatDate(p.start_date)} - {formatDate(p.end_date)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="form-label">Period 2</label>
                  <select 
                    className="form-select"
                    value={selectedPeriods.period2 || ''}
                    onChange={(e) => setSelectedPeriods({...selectedPeriods, period2: e.target.value})}
                  >
                    <option value="">Select second period</option>
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.period_name} ({formatDate(p.start_date)} - {formatDate(p.end_date)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button 
                    className="btn btn-outline-primary w-100" 
                    onClick={handleCompare}
                    disabled={!selectedPeriods.period1 || !selectedPeriods.period2}
                  >
                    Compare
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Periods List */}
        <div className="row">
          {periods.length === 0 ? (
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-calendar-x display-1 text-muted"></i>
                  <h5 className="mt-3">No Training Periods Yet</h5>
                  <p className="text-muted">Create your first training period to start tracking your progress over time</p>
                  <button className="btn btn-primary" onClick={openCreateModal}>
                    <i className="bi bi-plus-circle me-2"></i>Create First Period
                  </button>
                </div>
              </div>
            </div>
          ) : (
            periods.map(period => (
              <div key={period.id} className="col-md-6 col-lg-4 mb-4">
                <div className={`card border-0 shadow-sm h-100 ${period.is_active ? 'border-start border-primary border-4' : ''}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="mb-1">{period.period_name}</h5>
                        {period.is_active && (
                          <span className="badge bg-success">Active</span>
                        )}
                      </div>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-light"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button className="dropdown-item" onClick={() => openEditModal(period)}>
                              <i className="bi bi-pencil me-2"></i>Edit
                            </button>
                          </li>
                          {period.is_active && (
                            <li>
                              <button className="dropdown-item text-warning" onClick={() => handleEndPeriod(period.id)}>
                                <i className="bi bi-stop-circle me-2"></i>End Period
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted d-block">
                        <i className="bi bi-calendar-event me-1"></i>
                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                      </small>
                      {period.trainer_name && (
                        <small className="text-muted d-block mt-1">
                          <i className="bi bi-person-badge me-1"></i>
                          With {period.trainer_name}
                        </small>
                      )}
                      {!period.trainer_name && (
                        <small className="text-muted d-block mt-1">
                          <i className="bi bi-person me-1"></i>
                          Training Alone
                        </small>
                      )}
                    </div>

                    {period.workouts_count !== undefined && (
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Workouts</span>
                        <span className="badge bg-primary">{period.workouts_count}</span>
                      </div>
                    )}

                    {period.notes && (
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted">{period.notes}</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Period Modal */}
        {showCreateModal && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title">Create Training Period</h5>
                  <button className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <form onSubmit={handleCreate}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Period Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g., Training with John - Jan 2026"
                        value={formData.period_name}
                        onChange={(e) => setFormData({...formData, period_name: e.target.value})}
                        required
                      />
                      <small className="text-muted">Give this training period a descriptive name</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Start Date *</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">End Date (Optional)</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                      <small className="text-muted">Leave empty if period is ongoing</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes (Optional)</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        placeholder="Any notes about this training period..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer border-0">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create Period
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Period Modal */}
        {showEditModal && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title">Edit Training Period</h5>
                  <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <form onSubmit={handleEdit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Period Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={formData.period_name}
                        onChange={(e) => setFormData({...formData, period_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Start Date *</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">End Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer border-0">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Modal */}
        {showCompareModal && comparison && (
          <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title">Training Period Comparison</h5>
                  <button className="btn-close" onClick={() => setShowCompareModal(false)}></button>
                </div>
                <div className="modal-body">
                  {/* Period Info */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6 className="text-primary">Period 1</h6>
                          <h5>{comparison.period1.info.period_name}</h5>
                          <p className="text-muted mb-0">
                            {formatDate(comparison.period1.info.start_date)} - {formatDate(comparison.period1.info.end_date)}
                          </p>
                          {comparison.period1.info.trainer_name && (
                            <small className="text-muted">With {comparison.period1.info.trainer_name}</small>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6 className="text-success">Period 2</h6>
                          <h5>{comparison.period2.info.period_name}</h5>
                          <p className="text-muted mb-0">
                            {formatDate(comparison.period2.info.start_date)} - {formatDate(comparison.period2.info.end_date)}
                          </p>
                          {comparison.period2.info.trainer_name && (
                            <small className="text-muted">With {comparison.period2.info.trainer_name}</small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Stats */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="text-muted">Total Workouts</h6>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="h4 text-primary me-3">{comparison.changes.workouts.period1}</span>
                              <i className="bi bi-arrow-right"></i>
                              <span className="h4 text-success ms-3">{comparison.changes.workouts.period2}</span>
                            </div>
                            <div className={`${getChangeColor(comparison.changes.workouts.change)}`}>
                              <i className={`bi ${getChangeIcon(comparison.changes.workouts.change)} me-1`}></i>
                              {comparison.changes.workouts.change > 0 ? '+' : ''}{comparison.changes.workouts.change}
                              <small className="d-block">({comparison.changes.workouts.percent.toFixed(1)}%)</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="text-muted">Total Volume (kg)</h6>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="h4 text-primary me-3">{comparison.changes.volume.period1.toLocaleString()}</span>
                              <i className="bi bi-arrow-right"></i>
                              <span className="h4 text-success ms-3">{comparison.changes.volume.period2.toLocaleString()}</span>
                            </div>
                            <div className={`${getChangeColor(comparison.changes.volume.change)}`}>
                              <i className={`bi ${getChangeIcon(comparison.changes.volume.change)} me-1`}></i>
                              {comparison.changes.volume.change > 0 ? '+' : ''}{comparison.changes.volume.change.toLocaleString()}
                              <small className="d-block">({comparison.changes.volume.percent.toFixed(1)}%)</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="text-muted">Average RPE</h6>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="h4 text-primary me-3">{comparison.changes.avg_rpe.period1}</span>
                              <i className="bi bi-arrow-right"></i>
                              <span className="h4 text-success ms-3">{comparison.changes.avg_rpe.period2}</span>
                            </div>
                            <div className={`${getChangeColor(comparison.changes.avg_rpe.change)}`}>
                              <i className={`bi ${getChangeIcon(comparison.changes.avg_rpe.change)} me-1`}></i>
                              {comparison.changes.avg_rpe.change > 0 ? '+' : ''}{comparison.changes.avg_rpe.change}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="text-muted">Personal Records</h6>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="h4 text-primary me-3">{comparison.changes.personal_records.period1}</span>
                              <i className="bi bi-arrow-right"></i>
                              <span className="h4 text-success ms-3">{comparison.changes.personal_records.period2}</span>
                            </div>
                            <div className={`${getChangeColor(comparison.changes.personal_records.change)}`}>
                              <i className={`bi ${getChangeIcon(comparison.changes.personal_records.change)} me-1`}></i>
                              {comparison.changes.personal_records.change > 0 ? '+' : ''}{comparison.changes.personal_records.change}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Summary:</strong> 
                    {comparison.changes.volume.change > 0 ? (
                      <span> You increased your training volume by {comparison.changes.volume.percent.toFixed(1)}% in Period 2.</span>
                    ) : (
                      <span> Your training volume decreased by {Math.abs(comparison.changes.volume.percent).toFixed(1)}% in Period 2.</span>
                    )}
                    {comparison.changes.personal_records.change > 0 && (
                      <span> You also set {comparison.changes.personal_records.change} more personal record{comparison.changes.personal_records.change > 1 ? 's' : ''}!</span>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button className="btn btn-secondary" onClick={() => setShowCompareModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TraineeDashboard>
  );
};

export default TrainingPeriodManager;
