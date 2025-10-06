import React, { useState, useEffect } from 'react';
import { BACKEND_ROUTES_API } from '../../../config/config';

const MyWorkouts = () => {
  const [activeView, setActiveView] = useState('plans'); // plans, create, log
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [prebuiltExercises, setPrebuiltExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkoutData();
  }, []);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_ROUTES_API}GetWorkoutData.php`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workout data');
      }

      const data = await response.json();

      if (data.success) {
        setWorkoutPlans(data.workoutPlans);
        setWorkoutHistory(data.recentSessions);
        setPrebuiltExercises(data.premiumPlans);
      } else {
        throw new Error(data.message || 'Failed to load workout data');
      }

    } catch (err) {
      console.error('Error fetching workout data:', err);
      setError('Failed to load workout data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [newPlan, setNewPlan] = useState({
    name: '',
    exercises: []
  });

  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: '',
    type: 'reps'
  });

  const [activeWorkout, setActiveWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  const startWorkout = (plan) => {
    setActiveWorkout({
      ...plan,
      startTime: new Date(),
      currentSets: plan.exercises.map(ex => Array(ex.sets).fill({ reps: 0, weight: 0, completed: false }))
    });
    setActiveView('log');
  };

  const addExerciseToPlan = (exercise) => {
    setNewPlan(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...newExercise, name: exercise.name }]
    }));
    setNewExercise({ name: '', sets: 3, reps: '', type: 'reps' });
  };

  const savePlan = () => {
    if (newPlan.name && newPlan.exercises.length > 0) {
      setWorkoutPlans(prev => [...prev, { ...newPlan, id: Date.now(), lastPerformed: 'Never' }]);
      setNewPlan({ name: '', exercises: [] });
      setActiveView('plans');
    }
  };

  const renderPlansView = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">My Workout Plans</h4>
        <button 
          className="btn btn-primary"
          onClick={() => setActiveView('create')}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create Plan
        </button>
      </div>

      <div className="row">
        {workoutPlans.map(plan => (
          <div key={plan.id} className="col-lg-6 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title">{plan.name}</h5>
                  <span className="badge bg-light text-dark">{plan.exercises?.length || 0} exercises</span>
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">Description:</small>
                  <p className="small text-muted mb-0 mt-1">{plan.description || 'No description available'}</p>
                </div>

                <div className="mb-3">
                  <small className="text-muted">Last performed: {plan.last_performed || 'Never'}</small>
                </div>

                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-primary flex-fill"
                    onClick={() => startWorkout(plan)}
                  >
                    <i className="bi bi-play-circle me-2"></i>
                    Start Workout
                  </button>
                  <button className="btn btn-outline-secondary">
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button className="btn btn-outline-danger">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workout History */}
      <div className="mt-5">
        <h5 className="mb-3">Recent Workouts</h5>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {workoutHistory.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-clock-history text-muted fs-1"></i>
                <p className="text-muted mt-2">No workout history yet. Start your first workout!</p>
              </div>
            ) : (
              workoutHistory.map(workout => (
                <div key={workout.id} className="border-bottom py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{workout.plan_name}</h6>
                      <small className="text-muted">{workout.session_date} • {workout.duration_minutes} minutes</small>
                    </div>
                    <button className="btn btn-outline-primary btn-sm">View Details</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateView = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Create Workout Plan</h4>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => setActiveView('plans')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Plan Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter plan name..."
                />
              </div>

              <h6 className="mb-3">Premium Workout Plans</h6>
              <div className="row">
                {prebuiltExercises.map((plan, index) => (
                  <div key={index} className="col-md-6 mb-2">
                    <div 
                      className="card card-hover border-1 cursor-pointer"
                      onClick={() => addExerciseToPlan(plan)}
                    >
                      <div className="card-body py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="fw-bold">{plan.title}</small>
                            <br />
                            <small className="text-muted">{plan.category} • {plan.difficulty_level} • ${plan.price}</small>
                          </div>
                          <i className="bi bi-plus-circle text-primary"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <hr />

              <h6 className="mb-3">Add Custom Exercise</h6>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Exercise name"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Sets"
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, sets: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Reps/Time"
                    value={newExercise.reps}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, reps: e.target.value }))}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <select 
                    className="form-select"
                    value={newExercise.type}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="reps">Reps</option>
                    <option value="time">Time</option>
                  </select>
                </div>
                <div className="col-md-1 mb-3">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => addExerciseToPlan({ name: newExercise.name })}
                    disabled={!newExercise.name}
                  >
                    <i className="bi bi-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Plan Preview</h6>
            </div>
            <div className="card-body">
              <h6>{newPlan.name || 'Untitled Plan'}</h6>
              {newPlan.exercises.length === 0 ? (
                <p className="text-muted small">No exercises added yet</p>
              ) : (
                <div>
                  {newPlan.exercises.map((exercise, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <small className="fw-bold">{exercise.name}</small>
                        <br />
                        <small className="text-muted">{exercise.sets} sets x {exercise.reps}</small>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setNewPlan(prev => ({
                          ...prev,
                          exercises: prev.exercises.filter((_, i) => i !== index)
                        }))}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button 
                className="btn btn-success w-100 mt-3"
                onClick={savePlan}
                disabled={!newPlan.name || newPlan.exercises.length === 0}
              >
                <i className="bi bi-save me-2"></i>
                Save Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogView = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Active Workout: {activeWorkout?.name}</h4>
        <button 
          className="btn btn-outline-danger"
          onClick={() => {
            setActiveWorkout(null);
            setActiveView('plans');
          }}
        >
          End Workout
        </button>
      </div>

      {activeWorkout && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6>Exercise {currentExerciseIndex + 1} of {activeWorkout.exercises.length}</h6>
                    <span className="badge bg-primary">Set 1 of {activeWorkout.exercises[currentExerciseIndex]?.sets}</span>
                  </div>
                  <h5>{activeWorkout.exercises[currentExerciseIndex]?.name}</h5>
                </div>

                <div className="mb-4">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Weight (kg)</label>
                      <input type="number" className="form-control" placeholder="0" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Reps</label>
                      <input type="number" className="form-control" placeholder="0" />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">RPE (1-10)</label>
                      <input type="number" className="form-control" placeholder="5" min="1" max="10" />
                    </div>
                  </div>
                  <button className="btn btn-success me-2">
                    <i className="bi bi-check-circle me-2"></i>
                    Complete Set
                  </button>
                  <button className="btn btn-outline-secondary">
                    <i className="bi bi-skip-forward me-2"></i>
                    Next Exercise
                  </button>
                </div>

                <div className="border-top pt-3">
                  <h6>Previous Sets</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Set</th>
                          <th>Weight</th>
                          <th>Reps</th>
                          <th>RPE</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
                          <td><span className="badge bg-warning">In Progress</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">Workout Summary</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small className="text-muted">Duration</small>
                  <h6>00:12:34</h6>
                </div>
                <div className="mb-3">
                  <small className="text-muted">Exercises Completed</small>
                  <h6>0 of {activeWorkout.exercises.length}</h6>
                </div>
                <div className="mb-3">
                  <small className="text-muted">Total Sets</small>
                  <h6>0 of {activeWorkout.exercises.reduce((total, ex) => total + ex.sets, 0)}</h6>
                </div>
                
                <hr />
                
                <h6 className="mb-2">Exercise List</h6>
                {activeWorkout.exercises.map((exercise, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded mb-2 ${index === currentExerciseIndex ? 'bg-primary text-white' : 'bg-light'}`}
                  >
                    <small className="fw-bold">{exercise.name}</small>
                    <br />
                    <small>{exercise.sets} sets x {exercise.reps}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid px-4 py-3">
      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchWorkoutData}>
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your workouts...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {activeView === 'plans' && renderPlansView()}
          {activeView === 'create' && renderCreateView()}
          {activeView === 'log' && renderLogView()}
        </>
      )}
    </div>
  );
};

export default MyWorkouts;
