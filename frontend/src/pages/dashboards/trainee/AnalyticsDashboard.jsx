import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TraineeDashboard from '../../../components/TraineeDashboard';
import { BACKEND_ROUTES_API } from '../../../config/config';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [bodyComposition, setBodyComposition] = useState([]);
  
  // Initialize with last 90 days
  const getDefaultEndDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const getDefaultStartDate = () => {
    const date = new Date();
    // Inclusive 90-day window
    date.setDate(date.getDate() - 89);
    return date.toISOString().split('T')[0];
  };
  
  const [dateRange, setDateRange] = useState('90');
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Keep a fixed period window ending at the selected endDate
    const days = Math.max(1, parseInt(dateRange, 10) || 90);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(end.getTime())) return;
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));

    setStartDate(start.toISOString().split('T')[0]);
  }, [dateRange, endDate]);

  useEffect(() => {
    fetchAnalytics();
    fetchAlerts();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${BACKEND_ROUTES_API}GetUserAnalytics.php?start_date=${startDate}&end_date=${endDate}`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}GetPerformanceAlerts.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}DismissAlert.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId })
      });
      
      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
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

  const overview = analytics?.overview || {};
  const volumeTrends = analytics?.volume_trends || [];
  const strengthProgress = analytics?.strength_progress || {};
  const consistency = analytics?.consistency || {};
  const personalRecords = analytics?.personal_records || [];
  const bodyCompositionData = analytics?.body_composition || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <TraineeDashboard>
      <div className="container-fluid p-4" style={{ paddingBottom: '100px' }}>
        {/* Tabs */}
        <ul className="nav nav-tabs mb-4 border-secondary">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <i className="bi bi-speedometer2 me-2"></i>Overview
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'strength' ? 'active' : ''}`} onClick={() => setActiveTab('strength')}>
              <i className="bi bi-lightning-charge me-2"></i>Strength
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'volume' ? 'active' : ''}`} onClick={() => setActiveTab('volume')}>
              <i className="bi bi-bar-chart me-2"></i>Volume
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>
              <i className="bi bi-person-badge me-2"></i>Body Composition
            </button>
          </li>
        </ul>

        {/* Date Range Filters */}
        <div className="workout-history-filters w-100 justify-content-start justify-content-lg-end mb-3">
          <select
            className="form-select dark-input workout-history-filter"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last Year</option>
          </select>
          <input 
            type="date" 
            className="form-control dark-input workout-history-filter workout-history-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={getDefaultEndDate()}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Performance Alerts */}
        {alerts.length > 0 && (
          <div className="mb-4">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className={`alert alert-${alert.severity === 'warning' ? 'warning' : 'info'} alert-dismissible fade show`}>
                <i className={`bi bi-${alert.severity === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
                <strong>{alert.title}</strong>: {alert.message}
                <button type="button" className="btn-close" onClick={() => dismissAlert(alert.id)}></button>
              </div>
            ))}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="row mb-4">
              <div className="col-12 col-sm-6 col-lg-3 mb-3">
                <div className="card border-0 shadow-sm dark-card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center gap-2">
                      <div className="text-truncate">
                        <p className="text-white-50 mb-1 small text-truncate">Total Workouts</p>
                        <h3 className="mb-0 text-white">{overview.total_workouts || 0}</h3>
                      </div>
                      <div className="bg-primary bg-opacity-10 p-3 rounded flex-shrink-0">
                        <i className="bi bi-calendar-check text-primary fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3 mb-3">
                <div className="card border-0 shadow-sm dark-card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center gap-2">
                      <div className="text-truncate">
                        <p className="text-white-50 mb-1 small text-truncate">Total Volume</p>
                        <h3 className="mb-0 text-white text-truncate" title={`${Number(overview.total_volume_kg || 0).toLocaleString()}kg`}>
                          {Number(overview.total_volume_kg || 0) >= 1000 ? `${(Number(overview.total_volume_kg || 0) / 1000).toFixed(1)}k` : Number(overview.total_volume_kg || 0).toLocaleString()} kg
                        </h3>
                      </div>
                      <div className="bg-success bg-opacity-10 p-3 rounded flex-shrink-0">
                        <i className="bi bi-box-seam text-success fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3 mb-3">
                <div className="card border-0 shadow-sm dark-card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center gap-2">
                      <div className="text-truncate">
                        <p className="text-white-50 mb-1 small text-truncate">Avg RPE</p>
                        <h3 className="mb-0 text-white">{Number(overview.avg_rpe || 0).toFixed(1)}</h3>
                      </div>
                      <div className="bg-warning bg-opacity-10 p-3 rounded flex-shrink-0">
                        <i className="bi bi-speedometer text-warning fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-sm-6 col-lg-3 mb-3">
                <div className="card border-0 shadow-sm dark-card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center gap-2">
                      <div className="text-truncate">
                        <p className="text-white-50 mb-1 small text-truncate">Current Streak</p>
                        <h3 className="mb-0 text-white">
                          {consistency.streaks?.workout_streak?.current_streak || 0} 🔥
                        </h3>
                      </div>
                      <div className="bg-danger bg-opacity-10 p-3 rounded flex-shrink-0">
                        <i className="bi bi-fire text-danger fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Trends Chart */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-header dark-card border-0">
                    <h5 className="mb-0 text-white">Weekly Volume Trends</h5>
                  </div>
                  <div className="card-body">
                    {volumeTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={volumeTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="week_start_date" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                          <Legend />
                          <Bar dataKey="total_volume_kg" fill="#10b981" name="Volume (kg)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-white-50 text-center">No volume data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Records */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-header dark-card border-0 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-white">Recent Personal Records</h5>
                    <span className="badge bg-warning">{personalRecords.length} PRs</span>
                  </div>
                  <div className="card-body">
                    {personalRecords.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {personalRecords.slice(0, 5).map((pr, index) => (
                          <div key={index} className="list-group-item d-flex justify-content-between align-items-center dark-card border-secondary">
                            <div>
                              <strong className="text-white">{pr.exercise_name}</strong>
                              <br />
                              <small className="text-white-50">
                                {pr.based_on_weight}kg × {pr.based_on_reps} reps
                              </small>
                            </div>
                            <div className="text-end">
                              <div className="badge bg-primary">{pr.estimated_1rm || pr.record_value}kg (1RM)</div>
                              <br />
                              <small className="text-white-50">{new Date(pr.achieved_date || pr.recorded_date).toLocaleDateString()}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white-50 text-center">No personal records yet. Keep training!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Breakdown */}
            {volumeTrends.length > 0 && (
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm dark-card">
                    <div className="card-header dark-card border-0">
                      <h5 className="mb-0 text-white">Weekly Breakdown</h5>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-dark table-hover">
                          <thead>
                            <tr>
                              <th>Week</th>
                              <th>Workouts</th>
                              <th>Volume (kg)</th>
                              <th>Sets</th>
                              <th>Reps</th>
                              <th>Avg RPE</th>
                              <th>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {volumeTrends.slice(0, 12).map((week, index) => (
                              <tr key={index}>
                                <td>
                                  <small className="text-white-50">
                                    {new Date(week.week_start_date).toLocaleDateString()}
                                  </small>
                                </td>
                                <td><strong>{week.total_workouts || 0}</strong></td>
                                <td><strong>{Number(week.total_volume_kg || 0).toLocaleString()} kg</strong></td>
                                <td>{week.total_sets || 0}</td>
                                <td>{Number(week.total_reps || 0).toLocaleString()}</td>
                                <td>
                                  <span className={`badge ${Number(week.avg_rpe) >= 8 ? 'bg-danger' : Number(week.avg_rpe) >= 6 ? 'bg-warning' : 'bg-success'}`}>
                                    {Number(week.avg_rpe || 0).toFixed(1)}
                                  </span>
                                </td>
                                <td>{week.total_duration_minutes || 0} min</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Training Summary */}
            <div className="row mt-4">
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-body">
                    <h6 className="text-white-50 mb-3">Volume Stats</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-white-50">Total Reps:</span>
                      <strong className="text-white">{(overview.total_reps || 0).toLocaleString()}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-white-50">Total Sets:</span>
                      <strong className="text-white">{(overview.total_sets || 0).toLocaleString()}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-white-50">Avg Sets/Workout:</span>
                      <strong className="text-white">{overview.total_workouts ? ((overview.total_sets || 0) / overview.total_workouts).toFixed(1) : 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-body">
                    <h6 className="text-white-50 mb-3">Training Time</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-white-50">Total Time:</span>
                      <strong className="text-white">{Math.floor((overview.total_minutes || 0) / 60)}h {(overview.total_minutes || 0) % 60}m</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-white-50">Avg Duration:</span>
                      <strong className="text-white">{overview.total_workouts ? ((overview.total_minutes || 0) / overview.total_workouts).toFixed(0) : 0} min</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-white-50">Unique Exercises:</span>
                      <strong className="text-white">{overview.unique_exercises || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-body">
                    <h6 className="text-white-50 mb-3">Consistency</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-white-50">Workouts/Week:</span>
                      <strong className="text-white">{consistency.workouts_per_week ? Number(consistency.workouts_per_week).toFixed(1) : 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-white-50">Active Days:</span>
                      <strong className="text-white">{consistency.active_days || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-white-50">Adherence:</span>
                      <strong className="text-white">{consistency.adherence_percentage || 0}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strength Tab */}
        {activeTab === 'strength' && (
          <div>
            <div className="row">
              {Object.keys(strengthProgress).length > 0 ? (
                Object.entries(strengthProgress).map(([exercise, data]) => (
                  <div key={exercise} className="col-md-6 mb-4">
                    <div className="card border-0 shadow-sm dark-card">
                      <div className="card-header dark-card border-0">
                        <h6 className="mb-0 text-white">{exercise}</h6>
                      </div>
                      <div className="card-body">
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="recorded_date" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                            <Legend />
                            <Line type="monotone" dataKey="estimated_1rm" stroke="#10b981" name="Est. 1RM (kg)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Complete workouts with weight and reps (1-12 reps) to see strength progression charts.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Volume Tab */}
        {activeTab === 'volume' && (
          <div>
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-header dark-card border-0">
                    <h5 className="mb-0 text-white">Weekly Training Volume</h5>
                  </div>
                  <div className="card-body">
                    {volumeTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={volumeTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="week_start_date" stroke="#888" />
                          <YAxis yAxisId="left" stroke="#888" />
                          <YAxis yAxisId="right" orientation="right" stroke="#888" />
                          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="total_volume_kg" stroke="#10b981" name="Volume (kg)" />
                          <Line yAxisId="right" type="monotone" dataKey="avg_rpe" stroke="#FF8042" name="Avg RPE" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-white-50 text-center">No volume data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-body text-center">
                    <h6 className="text-white-50">Total Reps</h6>
                    <h2 className="text-white">{(overview.total_reps || 0).toLocaleString()}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-body text-center">
                    <h6 className="text-white-50">Total Sets</h6>
                    <h2 className="text-white">{(overview.total_sets || 0).toLocaleString()}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm dark-card">
                  <div className="card-body text-center">
                    <h6 className="text-white-50">Unique Exercises</h6>
                    <h2 className="text-white">{overview.unique_exercises || 0}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Body Composition Tab */}
        {activeTab === 'body' && (
          <div>
            {bodyCompositionData.length > 0 ? (
              <>
                {/* Weight Progress Chart */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm dark-card">
                      <div className="card-header dark-card border-0">
                        <h5 className="mb-0 text-white">Weight Progress</h5>
                      </div>
                      <div className="card-body">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={bodyCompositionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="measurement_date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="weight_kg" stroke="#0088FE" name="Weight (kg)" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Composition Metrics */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm dark-card">
                      <div className="card-header dark-card border-0">
                        <h5 className="mb-0 text-white">Body Fat %</h5>
                      </div>
                      <div className="card-body">
                        {bodyCompositionData.some(d => d.body_fat_percentage) ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={bodyCompositionData.filter(d => d.body_fat_percentage)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="measurement_date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="body_fat_percentage" stroke="#FF8042" name="Body Fat %" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-white-50 text-center">No body fat data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm dark-card">
                      <div className="card-header dark-card border-0">
                        <h5 className="mb-0 text-white">Muscle Mass</h5>
                      </div>
                      <div className="card-body">
                        {bodyCompositionData.some(d => d.muscle_mass_kg) ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={bodyCompositionData.filter(d => d.muscle_mass_kg)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="measurement_date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="muscle_mass_kg" stroke="#00C49F" name="Muscle Mass (kg)" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-white-50 text-center">No muscle mass data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Measurements Table */}
                <div className="row">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm dark-card">
                      <div className="card-header dark-card border-0">
                        <h5 className="mb-0 text-white">Recent Measurements</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover text-white">
                            <thead>
                              <tr>
                                <th className="text-white">Date</th>
                                <th className="text-white">Weight (kg)</th>
                                <th className="text-white">Body Fat %</th>
                                <th className="text-white">Muscle Mass (kg)</th>
                                <th className="text-white">Chest (cm)</th>
                                <th className="text-white">Waist (cm)</th>
                                <th className="text-white">Hips (cm)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bodyCompositionData.slice(0, 10).map((measurement, index) => (
                                <tr key={index} className="text-white-50">
                                  <td className="text-white-50">{new Date(measurement.measurement_date).toLocaleDateString()}</td>
                                  <td className="text-white-50">{measurement.weight_kg || '-'}</td>
                                  <td className="text-white-50">{measurement.body_fat_percentage ? `${measurement.body_fat_percentage}%` : '-'}</td>
                                  <td className="text-white-50">{measurement.muscle_mass_kg || '-'}</td>
                                  <td className="text-white-50">{measurement.chest_cm || '-'}</td>
                                  <td className="text-white-50">{measurement.waist_cm || '-'}</td>
                                  <td className="text-white-50">{measurement.hips_cm || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="card border-0 shadow-sm dark-card">
                <div className="card-body text-center py-5">
                  <i className="bi bi-person-badge display-1 text-white-50"></i>
                  <h5 className="mt-3">No Body Composition Data</h5>
                  <p className="text-white-50">Start logging your weight and measurements to track your body composition progress</p>
                  <button className="btn btn-primary" onClick={() => navigate('/progress')}>
                    <i className="bi bi-plus-circle me-2"></i>Add Measurement
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TraineeDashboard>
  );
};

export default AnalyticsDashboard;
