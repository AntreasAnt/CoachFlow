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
  const [achievements, setAchievements] = useState({ earned: [], available: [] });
  const [alerts, setAlerts] = useState([]);
  const [bodyComposition, setBodyComposition] = useState([]);
  
  // Initialize with last 90 days
  const getDefaultEndDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
    fetchAchievements();
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

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}GetAchievements.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setAchievements({
          earned: data.earned,
          available: data.available
        });
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
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
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2><i className="bi bi-graph-up me-2"></i>Analytics</h2>
            <p className="text-muted">Track your progress and achievements</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate('/trainee-dashboard/training-periods')}
            >
              <i className="bi bi-arrow-left-right me-2"></i>Compare Periods
            </button>
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted small mb-0">From:</label>
              <input 
                type="date" 
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                style={{ width: '150px' }}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted small mb-0">To:</label>
              <input 
                type="date" 
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={getDefaultEndDate()}
                style={{ width: '150px' }}
              />
            </div>
          </div>
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

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
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
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>
              <i className="bi bi-trophy me-2"></i>Achievements
              {achievements.earned.length > 0 && (
                <span className="badge bg-warning text-dark ms-2">{achievements.earned.length}</span>
              )}
            </button>
          </li>
        </ul>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="text-muted mb-1 small">Total Workouts</p>
                        <h3 className="mb-0">{overview.total_workouts || 0}</h3>
                      </div>
                      <div className="bg-primary bg-opacity-10 p-3 rounded">
                        <i className="bi bi-calendar-check text-primary fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="text-muted mb-1 small">Total Volume</p>
                        <h3 className="mb-0">{(overview.total_volume_kg || 0).toLocaleString()}kg</h3>
                      </div>
                      <div className="bg-success bg-opacity-10 p-3 rounded">
                        <i className="bi bi-box-seam text-success fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="text-muted mb-1 small">Avg RPE</p>
                        <h3 className="mb-0">{(overview.avg_rpe || 0).toFixed(1)}</h3>
                      </div>
                      <div className="bg-warning bg-opacity-10 p-3 rounded">
                        <i className="bi bi-speedometer text-warning fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="text-muted mb-1 small">Current Streak</p>
                        <h3 className="mb-0">
                          {consistency.streaks?.workout_streak?.current_streak || 0} 🔥
                        </h3>
                      </div>
                      <div className="bg-danger bg-opacity-10 p-3 rounded">
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
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Weekly Volume Trends</h5>
                  </div>
                  <div className="card-body">
                    {volumeTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={volumeTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week_start_date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total_volume_kg" fill="#0088FE" name="Volume (kg)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted text-center">No volume data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Records */}
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Recent Personal Records</h5>
                    <span className="badge bg-warning">{personalRecords.length} PRs</span>
                  </div>
                  <div className="card-body">
                    {personalRecords.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {personalRecords.slice(0, 5).map((pr, index) => (
                          <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{pr.exercise_name}</strong>
                              <br />
                              <small className="text-muted">
                                {pr.based_on_weight}kg × {pr.based_on_reps} reps
                              </small>
                            </div>
                            <div className="text-end">
                              <div className="badge bg-primary">{pr.record_value}kg (1RM)</div>
                              <br />
                              <small className="text-muted">{new Date(pr.achieved_date).toLocaleDateString()}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-center">No personal records yet. Keep training!</p>
                    )}
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
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white">
                        <h6 className="mb-0">{exercise}</h6>
                      </div>
                      <div className="card-body">
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="recorded_date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="estimated_1rm" stroke="#0088FE" name="Est. 1RM (kg)" />
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
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Weekly Training Volume</h5>
                  </div>
                  <div className="card-body">
                    {volumeTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={volumeTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week_start_date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="total_volume_kg" stroke="#0088FE" name="Volume (kg)" />
                          <Line yAxisId="right" type="monotone" dataKey="avg_rpe" stroke="#FF8042" name="Avg RPE" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted text-center">No volume data available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-muted">Total Reps</h6>
                    <h2>{(overview.total_reps || 0).toLocaleString()}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-muted">Total Sets</h6>
                    <h2>{(overview.total_sets || 0).toLocaleString()}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-muted">Unique Exercises</h6>
                    <h2>{overview.unique_exercises || 0}</h2>
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
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white">
                        <h5 className="mb-0">Weight Progress</h5>
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
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white">
                        <h5 className="mb-0">Body Fat %</h5>
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
                          <p className="text-muted text-center">No body fat data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white">
                        <h5 className="mb-0">Muscle Mass</h5>
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
                          <p className="text-muted text-center">No muscle mass data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Measurements Table */}
                <div className="row">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white">
                        <h5 className="mb-0">Recent Measurements</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Weight (kg)</th>
                                <th>Body Fat %</th>
                                <th>Muscle Mass (kg)</th>
                                <th>Chest (cm)</th>
                                <th>Waist (cm)</th>
                                <th>Hips (cm)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bodyCompositionData.slice(0, 10).map((measurement, index) => (
                                <tr key={index}>
                                  <td>{new Date(measurement.measurement_date).toLocaleDateString()}</td>
                                  <td>{measurement.weight_kg || '-'}</td>
                                  <td>{measurement.body_fat_percentage ? `${measurement.body_fat_percentage}%` : '-'}</td>
                                  <td>{measurement.muscle_mass_kg || '-'}</td>
                                  <td>{measurement.chest_cm || '-'}</td>
                                  <td>{measurement.waist_cm || '-'}</td>
                                  <td>{measurement.hips_cm || '-'}</td>
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
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-person-badge display-1 text-muted"></i>
                  <h5 className="mt-3">No Body Composition Data</h5>
                  <p className="text-muted">Start logging your weight and measurements to track your body composition progress</p>
                  <button className="btn btn-primary" onClick={() => navigate('/progress')}>
                    <i className="bi bi-plus-circle me-2"></i>Add Measurement
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div>
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm bg-gradient-primary text-white">
                  <div className="card-body text-center py-4">
                    <h1 className="display-4 mb-0">{achievements.earned.length}</h1>
                    <p className="mb-0">Achievements Unlocked</p>
                  </div>
                </div>
              </div>
            </div>

            {achievements.earned.length > 0 && (
              <div className="mb-4">
                <h5 className="mb-3">Earned Achievements</h5>
                <div className="row">
                  {achievements.earned.map((achievement, index) => (
                    <div key={index} className="col-md-4 mb-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body text-center">
                          <i className={`bi ${achievement.icon} ${achievement.color || 'text-warning'} display-4`}></i>
                          <h6 className="mt-3 mb-2">{achievement.achievement_name}</h6>
                          <p className="text-muted small mb-2">{achievement.description}</p>
                          {achievement.value && (
                            <span className="badge bg-primary">{achievement.value}</span>
                          )}
                          <div className="mt-2">
                            <small className="text-muted">
                              {new Date(achievement.achieved_date).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {achievements.available.length > 0 && (
              <div>
                <h5 className="mb-3">Available Achievements</h5>
                <div className="row">
                  {achievements.available.slice(0, 6).map((achievement, index) => (
                    <div key={index} className="col-md-4 mb-3">
                      <div className="card border-0 shadow-sm h-100 opacity-75">
                        <div className="card-body text-center">
                          <i className={`bi ${achievement.icon} text-secondary display-4`}></i>
                          <h6 className="mt-3 mb-2">{achievement.name}</h6>
                          <p className="text-muted small mb-0">{achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
