import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ClientAnalytics = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainee, setTrainee] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('90'); // days
  const [trainingPeriodId, setTrainingPeriodId] = useState(null);

  useEffect(() => {
    if (clientId) {
      fetchClientAnalytics();
    }
  }, [clientId, dateRange, trainingPeriodId]);

  const fetchClientAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const params = new URLSearchParams({
        trainee_id: clientId,
        start_date: startDate,
        end_date: endDate,
      });

      if (trainingPeriodId) {
        params.append('training_period_id', trainingPeriodId);
      }

      const response = await APIClient.get(
        `${BACKEND_ROUTES_API}GetTraineeAnalytics.php?${params.toString()}`
      );

      console.log('Analytics Response:', response);
      console.log('Program Performance:', response?.analytics?.program_performance);

      if (response.success) {
        setTrainee(response.trainee);
        setAnalytics(response.analytics);
      } else {
        setError(response.message || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching client analytics:', err);
      setError('Failed to load analytics. You may not have permission to view this client.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  const formatDecimal = (num, decimals = 1) => {
    if (!num) return '0';
    return parseFloat(num).toFixed(decimals);
  };

  if (loading) {
    return (
      <TrainerDashboardLayout>
        <div className="container-fluid p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading client analytics...</p>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  if (error) {
    return (
      <TrainerDashboardLayout>
        <div className="container-fluid p-4">
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
          <Link to="/trainer-dashboard/clients" className="btn btn-primary">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Clients
          </Link>
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link
              to="/trainer-dashboard/clients"
              className="text-decoration-none text-muted mb-2 d-inline-block"
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Clients
            </Link>
            <h2 className="mb-1">
              {trainee?.name}'s Analytics
            </h2>
            <p className="text-muted mb-0">{trainee?.email}</p>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="180">Last 6 Months</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        {analytics?.overview && (
          <div className="row mb-4">
            <div className="col-lg-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Workouts</p>
                      <h3 className="mb-0">{formatNumber(analytics.overview.total_workouts)}</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-activity text-primary fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Volume</p>
                      <h3 className="mb-0">{formatNumber(analytics.overview.total_volume_kg)} kg</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-graph-up text-success fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Unique Exercises</p>
                      <h3 className="mb-0">{formatNumber(analytics.overview.unique_exercises)}</h3>
                    </div>
                    <div className="bg-info bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-list-task text-info fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Average RPE</p>
                      <h3 className="mb-0">{formatDecimal(analytics.overview.avg_rpe)}</h3>
                    </div>
                    <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                      <i className="bi bi-lightning text-warning fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats Row */}
        {analytics?.overview && (
          <div className="row mb-4">
            <div className="col-lg-4 col-md-6 mb-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted mb-3">Training Volume</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Total Reps:</span>
                    <strong>{formatNumber(analytics.overview.total_reps)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Total Sets:</span>
                    <strong>{formatNumber(analytics.overview.total_sets)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Training Time:</span>
                    <strong>{formatNumber(analytics.overview.total_minutes)} min</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Consistency Stats */}
            {analytics?.consistency && (
              <div className="col-lg-4 col-md-6 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="text-muted mb-3">Consistency</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Workouts/Week:</span>
                      <strong>{formatDecimal(analytics.consistency.workouts_per_week)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Active Days:</span>
                      <strong>{formatNumber(analytics.consistency.active_days)}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Adherence:</span>
                      <strong>{formatNumber(analytics.consistency.adherence_percentage)}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Streak */}
            {analytics?.consistency?.streaks && (
              <div className="col-lg-4 col-md-6 mb-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="text-muted mb-3">Workout Streak 🔥</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Current Streak:</span>
                      <strong className="text-danger">
                        {formatNumber(analytics.consistency.streaks.workout_streak?.current_streak || 0)} days
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Longest Streak:</span>
                      <strong>{formatNumber(analytics.consistency.streaks.workout_streak?.longest_streak || 0)} days</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Total Training Time:</span>
                      <strong>{Math.floor(analytics.overview.total_minutes / 60)}h {analytics.overview.total_minutes % 60}m</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weekly Breakdown Table */}
        {analytics?.volume_trends && analytics.volume_trends.length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-table me-2"></i>
                Weekly Training Breakdown
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Week Starting</th>
                      <th>Workouts</th>
                      <th>Volume (kg)</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Avg RPE</th>
                      <th>Duration</th>
                      <th>Exercises</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.volume_trends.slice(0, 12).map((week, index) => (
                      <tr key={index}>
                        <td>
                          <small className="text-muted">
                            {new Date(week.week_start_date).toLocaleDateString()}
                          </small>
                        </td>
                        <td><strong>{week.total_workouts}</strong></td>
                        <td><strong>{formatNumber(week.total_volume_kg)} kg</strong></td>
                        <td>{formatNumber(week.total_sets)}</td>
                        <td>{formatNumber(week.total_reps)}</td>
                        <td>
                          <span className={`badge ${week.avg_rpe >= 8 ? 'bg-danger' : week.avg_rpe >= 6 ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {formatDecimal(week.avg_rpe)}
                          </span>
                        </td>
                        <td>{week.total_duration_minutes || 0} min</td>
                        <td>{week.unique_exercises || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-light fw-bold">
                      <td>TOTAL</td>
                      <td>{formatNumber(analytics.overview.total_workouts)}</td>
                      <td>{formatNumber(analytics.overview.total_volume_kg)} kg</td>
                      <td>{formatNumber(analytics.overview.total_sets)}</td>
                      <td>{formatNumber(analytics.overview.total_reps)}</td>
                      <td>
                        <span className="badge bg-primary">
                          {formatDecimal(analytics.overview.avg_rpe)}
                        </span>
                      </td>
                      <td>{formatNumber(analytics.overview.total_minutes)} min</td>
                      <td>{formatNumber(analytics.overview.unique_exercises)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Volume Trends Chart */}
        {analytics?.volume_trends && analytics.volume_trends.length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart-line me-2"></i>
                Weekly Volume & RPE Trends
              </h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analytics.volume_trends.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week_start_date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(date) => `Week of ${new Date(date).toLocaleDateString()}`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_volume_kg" fill="#0088FE" name="Volume (kg)" />
                  <Line yAxisId="right" type="monotone" dataKey="avg_rpe" stroke="#FF8042" name="Avg RPE" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Strength Progress Chart */}
        {analytics?.strength_progress && analytics.strength_progress.length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-graph-up-arrow me-2"></i>
                Strength Progress (Est. 1RM)
              </h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analytics.strength_progress.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="recorded_date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="estimated_1rm" stroke="#00C49F" name="Est. 1RM (kg)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3">
                <p className="text-muted small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Showing the most recent 1RM estimates calculated from workout performance
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Program Performance Breakdown */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <i className="bi bi-grid-3x3 me-2"></i>
              Performance by Program
            </h5>
            <p className="text-muted small mb-0 mt-1">
              Breakdown of training volume, reps, and intensity by program
            </p>
          </div>
          <div className="card-body">
            {analytics?.program_performance && analytics.program_performance.length > 0 ? (
              <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Program Name</th>
                      <th>Workouts</th>
                      <th>Volume (kg)</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Avg RPE</th>
                      <th>Exercises</th>
                      <th>Duration</th>
                      <th>Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.program_performance.map((program, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{program.program_name}</strong>
                        </td>
                        <td><strong>{program.total_workouts}</strong></td>
                        <td><strong className="text-primary">{formatNumber(program.total_volume_kg)} kg</strong></td>
                        <td>{formatNumber(program.total_sets)}</td>
                        <td>{formatNumber(program.total_reps)}</td>
                        <td>
                          <span className={`badge ${program.avg_rpe >= 8 ? 'bg-danger' : program.avg_rpe >= 6 ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {formatDecimal(program.avg_rpe)}
                          </span>
                        </td>
                        <td>{program.unique_exercises}</td>
                        <td>{formatNumber(program.total_minutes)} min</td>
                        <td>
                          <small className="text-muted">
                            {new Date(program.first_workout).toLocaleDateString()} - {new Date(program.last_workout).toLocaleDateString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-light fw-bold">
                      <td>TOTAL</td>
                      <td>{formatNumber(analytics.overview.total_workouts)}</td>
                      <td className="text-primary">{formatNumber(analytics.overview.total_volume_kg)} kg</td>
                      <td>{formatNumber(analytics.overview.total_sets)}</td>
                      <td>{formatNumber(analytics.overview.total_reps)}</td>
                      <td>
                        <span className="badge bg-primary">
                          {formatDecimal(analytics.overview.avg_rpe)}
                        </span>
                      </td>
                      <td>{formatNumber(analytics.overview.unique_exercises)}</td>
                      <td>{formatNumber(analytics.overview.total_minutes)} min</td>
                      <td>-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Program Performance Cards */}
              <div className="row mt-4">
                {analytics.program_performance.slice(0, 3).map((program, index) => (
                  <div key={index} className="col-md-4 mb-3">
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <h6 className="text-truncate mb-3" title={program.program_name}>
                          {program.program_name}
                        </h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">Total Volume:</span>
                          <strong>{formatNumber(program.total_volume_kg)} kg</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">Workouts:</span>
                          <strong>{program.total_workouts}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">Avg RPE:</span>
                          <span className={`badge ${program.avg_rpe >= 8 ? 'bg-danger' : program.avg_rpe >= 6 ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {formatDecimal(program.avg_rpe)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Sets × Reps:</span>
                          <strong>{formatNumber(program.total_sets)} × {formatNumber(program.total_reps)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-4 text-muted"></i>
                <p className="mt-3 text-muted">
                  No program-specific data available yet.
                </p>
                <p className="text-muted small">
                  This trainee hasn't completed any workouts with assigned programs,
                  or their workouts don't have program associations yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Volume Trends Chart */}
        {analytics?.volume_trends && analytics.volume_trends.length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Weekly Volume Trends
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Workouts</th>
                      <th>Total Volume (kg)</th>
                      <th>Total Reps</th>
                      <th>Avg RPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.volume_trends.slice(0, 12).map((week, index) => (
                      <tr key={index}>
                        <td>
                          <small className="text-muted">
                            {new Date(week.week_start_date).toLocaleDateString()}
                          </small>
                        </td>
                        <td><strong>{week.total_workouts}</strong></td>
                        <td><strong>{formatNumber(week.total_volume_kg)} kg</strong></td>
                        <td>{formatNumber(week.total_reps)}</td>
                        <td>
                          <span className={`badge ${week.avg_rpe >= 8 ? 'bg-danger' : week.avg_rpe >= 6 ? 'bg-warning' : 'bg-success'}`}>
                            {formatDecimal(week.avg_rpe)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Personal Records */}
        {analytics?.personal_records && analytics.personal_records.length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-trophy text-warning me-2"></i>
                Personal Records
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {analytics.personal_records.slice(0, 6).map((record, index) => (
                  <div key={index} className="col-lg-4 col-md-6 mb-3">
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="text-truncate" style={{ maxWidth: '70%' }}>
                          {record.exercise_name}
                        </strong>
                        <span className="badge bg-primary">{formatDecimal(record.estimated_1rm)} kg</span>
                      </div>
                      <small className="text-muted">
                        {record.based_on_weight} kg × {record.based_on_reps} reps
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Strength Progress Chart Placeholder */}
        {analytics?.strength_progress && analytics.strength_progress.length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Strength Progress
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Exercise</th>
                      <th>Est. 1RM</th>
                      <th>Based On</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.strength_progress.slice(0, 10).map((progress, index) => (
                      <tr key={index}>
                        <td>{progress.exercise_name}</td>
                        <td>
                          <strong>{formatDecimal(progress.estimated_1rm)} kg</strong>
                        </td>
                        <td>
                          {progress.based_on_weight} kg × {progress.based_on_reps} reps
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(progress.recorded_date).toLocaleDateString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Body Composition */}
        {analytics?.body_composition && analytics.body_composition.length > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-person me-2"></i>
                Body Composition
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Weight</th>
                      <th>Body Fat %</th>
                      <th>Muscle Mass</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.body_composition.slice(0, 10).map((measurement, index) => (
                      <tr key={index}>
                        <td>
                          <small className="text-muted">
                            {new Date(measurement.measurement_date).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <strong>{formatDecimal(measurement.weight_kg)} kg</strong>
                        </td>
                        <td>
                          {measurement.body_fat_percentage
                            ? `${formatDecimal(measurement.body_fat_percentage)}%`
                            : '-'}
                        </td>
                        <td>
                          {measurement.muscle_mass_kg
                            ? `${formatDecimal(measurement.muscle_mass_kg)} kg`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Top Exercises */}
        {analytics?.overview && analytics.overview.total_workouts > 0 && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="bi bi-list-check me-2"></i>
                Most Frequent Exercises
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted">Training {formatNumber(analytics.overview.unique_exercises)} different exercises</p>
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-muted mb-3">Volume Distribution</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Sets:</span>
                    <strong>{formatNumber(analytics.overview.total_sets)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Reps:</span>
                    <strong>{formatNumber(analytics.overview.total_reps)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Avg Sets/Workout:</span>
                    <strong>{formatDecimal(analytics.overview.total_sets / (analytics.overview.total_workouts || 1))}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted mb-3">Training Intensity</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Average RPE:</span>
                    <strong>{formatDecimal(analytics.overview.avg_rpe)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Training Time:</span>
                    <strong>{Math.floor(analytics.overview.total_minutes / 60)}h {analytics.overview.total_minutes % 60}m</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Avg Workout Duration:</span>
                    <strong>{formatNumber(analytics.overview.total_minutes / (analytics.overview.total_workouts || 1))} min</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {analytics && !analytics.overview?.total_workouts && (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-bar-chart fs-1 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">No Analytics Data Yet</h5>
              <p className="text-muted">
                This client hasn't logged any workouts in the selected time period.
              </p>
            </div>
          </div>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default ClientAnalytics;
