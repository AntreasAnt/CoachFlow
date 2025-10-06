import React, { useState } from 'react';

const Progress = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [workoutHistory] = useState([
    { date: '2024-10-06', type: 'Upper Body', duration: 45, exercises: 6 },
    { date: '2024-10-04', type: 'Lower Body', duration: 50, exercises: 5 },
    { date: '2024-10-02', type: 'Cardio', duration: 30, exercises: 3 },
    { date: '2024-09-30', type: 'Upper Body', duration: 42, exercises: 6 },
    { date: '2024-09-28', type: 'Full Body', duration: 55, exercises: 8 }
  ]);

  const [bodyMeasurements] = useState([
    { date: '2024-10-01', weight: 75.2, bodyFat: 15.2, muscle: 62.1 },
    { date: '2024-09-15', weight: 74.8, bodyFat: 15.8, muscle: 61.5 },
    { date: '2024-09-01', weight: 74.1, bodyFat: 16.2, muscle: 60.8 },
    { date: '2024-08-15', weight: 73.5, bodyFat: 16.8, muscle: 60.2 }
  ]);

  const [personalRecords] = useState([
    { exercise: 'Bench Press', weight: 85, date: '2024-10-01', improvement: '+5kg' },
    { exercise: 'Squats', weight: 120, date: '2024-09-28', improvement: '+10kg' },
    { exercise: 'Deadlift', weight: 140, date: '2024-09-25', improvement: '+15kg' },
    { exercise: 'Pull-ups', reps: 12, date: '2024-10-04', improvement: '+2 reps' }
  ]);

  const renderOverview = () => (
    <div>
      {/* Progress Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="text-primary fs-1 mb-2">🏋️</div>
              <h5 className="card-title">25</h5>
              <p className="card-text text-muted">Total Workouts</p>
              <small className="text-success">+3 this week</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="text-success fs-1 mb-2">⚡</div>
              <h5 className="card-title">18.5h</h5>
              <p className="card-text text-muted">Total Time</p>
              <small className="text-success">+2.5h this week</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="text-warning fs-1 mb-2">🔥</div>
              <h5 className="card-title">12</h5>
              <p className="card-text text-muted">Day Streak</p>
              <small className="text-warning">Personal best!</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="text-info fs-1 mb-2">📈</div>
              <h5 className="card-title">+2.5kg</h5>
              <p className="card-text text-muted">Weight Gain</p>
              <small className="text-info">Last 30 days</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Workout Frequency</h6>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <i className="bi bi-bar-chart text-muted fs-1"></i>
                <p className="text-muted mt-2">Workout frequency chart would go here</p>
                <small className="text-muted">Integration with charting library needed</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Body Composition</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Weight</span>
                  <span className="fw-bold">75.2 kg</span>
                </div>
                <div className="progress mt-1" style={{ height: '4px' }}>
                  <div className="progress-bar bg-primary" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Body Fat</span>
                  <span className="fw-bold">15.2%</span>
                </div>
                <div className="progress mt-1" style={{ height: '4px' }}>
                  <div className="progress-bar bg-warning" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <span>Muscle Mass</span>
                  <span className="fw-bold">62.1%</span>
                </div>
                <div className="progress mt-1" style={{ height: '4px' }}>
                  <div className="progress-bar bg-success" style={{ width: '62%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Recent Achievements</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    <div className="text-success fs-3 me-3">🏆</div>
                    <div>
                      <h6 className="mb-1">New Personal Record!</h6>
                      <p className="mb-0 small text-muted">Bench Press: 85kg (+5kg improvement)</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    <div className="text-warning fs-3 me-3">🔥</div>
                    <div>
                      <h6 className="mb-1">12-Day Streak!</h6>
                      <p className="mb-0 small text-muted">Your longest streak yet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkouts = () => (
    <div>
      <h5 className="mb-3">Workout History</h5>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Workout Type</th>
                  <th>Duration</th>
                  <th>Exercises</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workoutHistory.map((workout, index) => (
                  <tr key={index}>
                    <td>{workout.date}</td>
                    <td>{workout.type}</td>
                    <td>{workout.duration} min</td>
                    <td>{workout.exercises} exercises</td>
                    <td>
                      <button className="btn btn-outline-primary btn-sm">
                        <i className="bi bi-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMeasurements = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Body Measurements</h5>
        <button className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Add Measurement
        </button>
      </div>
      
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight (kg)</th>
                  <th>Body Fat (%)</th>
                  <th>Muscle Mass (%)</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {bodyMeasurements.map((measurement, index) => (
                  <tr key={index}>
                    <td>{measurement.date}</td>
                    <td>{measurement.weight}</td>
                    <td>{measurement.bodyFat}</td>
                    <td>{measurement.muscle}</td>
                    <td>
                      {index < bodyMeasurements.length - 1 && (
                        <span className={`badge ${measurement.weight > bodyMeasurements[index + 1].weight ? 'bg-success' : 'bg-danger'}`}>
                          {measurement.weight > bodyMeasurements[index + 1].weight ? '+' : ''}
                          {(measurement.weight - bodyMeasurements[index + 1].weight).toFixed(1)}kg
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecords = () => (
    <div>
      <h5 className="mb-3">Personal Records</h5>
      <div className="row">
        {personalRecords.map((record, index) => (
          <div key={index} className="col-lg-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="card-title">{record.exercise}</h6>
                    <p className="card-text fs-4 fw-bold text-primary mb-1">
                      {record.weight ? `${record.weight}kg` : `${record.reps} reps`}
                    </p>
                    <small className="text-muted">{record.date}</small>
                  </div>
                  <span className="badge bg-success">{record.improvement}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Progress Tracking</h4>
        <div className="btn-group" role="group">
          <button
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`btn ${activeTab === 'workouts' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('workouts')}
          >
            Workouts
          </button>
          <button
            className={`btn ${activeTab === 'measurements' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('measurements')}
          >
            Measurements
          </button>
          <button
            className={`btn ${activeTab === 'records' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('records')}
          >
            Records
          </button>
        </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'workouts' && renderWorkouts()}
      {activeTab === 'measurements' && renderMeasurements()}
      {activeTab === 'records' && renderRecords()}
    </div>
  );
};

export default Progress;
