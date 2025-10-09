import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const MyWorkouts = () => {
  const [activeView, setActiveView] = useState('plans'); // plans, create, log
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [premadeWorkoutPlans, setPremadeWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState({
    date: '',
    year: '',
    workoutPlan: '',
    sortBy: 'date'
  });
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [selectedWorkoutDetails, setSelectedWorkoutDetails] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showCancelWorkoutModal, setShowCancelWorkoutModal] = useState(false);
  const [showFinishWorkoutModal, setShowFinishWorkoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Timer states
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);
  const [isBreakTimerRunning, setIsBreakTimerRunning] = useState(false);
  const [breakTimerSetting, setBreakTimerSetting] = useState(60); // default 60 seconds
  const [isTimerMode, setIsTimerMode] = useState(true); // true for timer, false for stopwatch
  
  const workoutTimerRef = useRef(null);
  const breakTimerRef = useRef(null);

  useEffect(() => {
    fetchWorkoutData();
  }, []);

  // Timer effects
  useEffect(() => {
    if (isWorkoutTimerRunning) {
      workoutTimerRef.current = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(workoutTimerRef.current);
    }
    return () => clearInterval(workoutTimerRef.current);
  }, [isWorkoutTimerRunning]);

  useEffect(() => {
    if (isBreakTimerRunning) {
      breakTimerRef.current = setInterval(() => {
        setBreakTimer(prev => {
          if (isTimerMode && prev <= 1) {
            setIsBreakTimerRunning(false);
            alert('Break time is over!');
            return breakTimerSetting;
          }
          return isTimerMode ? prev - 1 : prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(breakTimerRef.current);
    }
    return () => clearInterval(breakTimerRef.current);
  }, [isBreakTimerRunning, isTimerMode, breakTimerSetting]);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetWorkoutData.php`);

      if (data.success) {
        setWorkoutPlans(data.workoutPlans);
        setWorkoutHistory(data.recentSessions);
        setAllExercises(data.exercises || []);
        setPremadeWorkoutPlans(data.premiumPlans || []);
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

  // Timer formatting functions
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter functions
  const filteredExercises = allExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    exercise.category.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    exercise.muscle_group.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  const filteredWorkoutHistory = workoutHistory.filter(workout => {
    let matches = true;
    
    if (historyFilter.date && workout.session_date !== historyFilter.date) {
      matches = false;
    }
    
    if (historyFilter.year && !workout.session_date.includes(historyFilter.year)) {
      matches = false;
    }
    
    if (historyFilter.workoutPlan && workout.plan_name !== historyFilter.workoutPlan) {
      matches = false;
    }
    
    return matches;
  }).sort((a, b) => {
    if (historyFilter.sortBy === 'date') {
      return new Date(b.session_date) - new Date(a.session_date);
    }
    return 0;
  });

  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    exercises: []
  });

  const [newExercise, setNewExercise] = useState({
    name: '',
    muscle_group: '',
    category: 'strength',
    equipment: '',
    instructions: ''
  });

  const [exerciseToAdd, setExerciseToAdd] = useState({
    sets: 3,
    reps: '',
    rpe: '',
    type: 'reps'
  });

  const [selectedExercise, setSelectedExercise] = useState(null);

  const [activeWorkout, setActiveWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [currentSetData, setCurrentSetData] = useState({
    weight: '',
    reps: '',
    rpe: '',
    notes: ''
  });

  // Plan management functions
  const deletePlan = async (planId) => {
    try {
      const data = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteWorkoutPlan.php`, {
        body: JSON.stringify({ planId })
      });

      if (data.success) {
        setWorkoutPlans(prev => prev.filter(plan => plan.id !== planId));
        setShowDeleteModal(false);
        setPlanToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const editPlan = async (updatedPlan) => {
    try {
      const data = await APIClient.put(`${BACKEND_ROUTES_API}UpdateWorkoutPlan.php`, updatedPlan);

      if (data.success) {
        setWorkoutPlans(prev => prev.map(plan => 
          plan.id === updatedPlan.id ? updatedPlan : plan
        ));
        setShowEditModal(false);
        setPlanToEdit(null);
      }
    } catch (err) {
      console.error('Error updating plan:', err);
    }
  };

  const startWorkout = (plan) => {
    setActiveWorkout({
      ...plan,
      startTime: new Date(),
      completedSets: plan.exercises.map(ex => Array(ex.sets).fill({
        weight: 0,
        reps: 0,
        rpe: 0,
        notes: '',
        completed: false
      }))
    });
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setWorkoutLogs([]);
    setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
    setWorkoutTimer(0);
    setIsWorkoutTimerRunning(true);
    setActiveView('log');
  };

  const completeSet = () => {
    if (!activeWorkout || !currentSetData.reps) {
      alert('Please enter the number of reps completed');
      return;
    }

    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.completedSets[currentExerciseIndex][currentSetIndex] = {
      ...currentSetData,
      weight: parseFloat(currentSetData.weight) || 0,
      reps: parseInt(currentSetData.reps) || 0,
      rpe: parseInt(currentSetData.rpe) || 0,
      completed: true
    };

    setActiveWorkout(updatedWorkout);

    // Add to workout logs
    const logEntry = {
      exerciseIndex: currentExerciseIndex,
      exerciseName: activeWorkout.exercises[currentExerciseIndex].name,
      setNumber: currentSetIndex + 1,
      weight: parseFloat(currentSetData.weight) || 0,
      reps: parseInt(currentSetData.reps) || 0,
      rpe: parseInt(currentSetData.rpe) || 0,
      notes: currentSetData.notes
    };

    setWorkoutLogs(prev => [...prev, logEntry]);

    // Reset current set data
    setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });

    // Move to next set
    const currentExercise = activeWorkout.exercises[currentExerciseIndex];
    if (currentSetIndex < currentExercise.sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    } else {
      // Move to next exercise
      nextExercise();
    }

    // Start break timer
    startBreakTimer();
  };

  const nextExercise = () => {
    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
    } else {
      // Workout completed
      finishWorkout();
    }
  };

  const openExerciseModal = (exercise) => {
    setSelectedExercise(exercise);
    setExerciseToAdd({ sets: 3, reps: '', rpe: '', type: 'reps' });
    setShowExerciseModal(true);
  };

  const addExerciseFromModal = () => {
    if (!selectedExercise || !exerciseToAdd.sets || !exerciseToAdd.reps) {
      alert('Please fill in all required fields');
      return;
    }

    const exerciseToAddToPlan = {
      ...exerciseToAdd,
      name: selectedExercise.name,
      muscle_group: selectedExercise.muscle_group,
      category: selectedExercise.category,
      equipment: selectedExercise.equipment,
      instructions: selectedExercise.instructions,
      exercise_id: selectedExercise.id
    };
    
    setNewPlan(prev => ({
      ...prev,
      exercises: [...prev.exercises, exerciseToAddToPlan]
    }));
    
    setShowExerciseModal(false);
    setSelectedExercise(null);
    setExerciseToAdd({ sets: 3, reps: '', rpe: '', type: 'reps' });
  };

  const addExerciseToPlan = (exercise) => {
    openExerciseModal(exercise);
  };

  const addCustomExercise = async () => {
    if (!newExercise.name) return;

    try {
      const data = await APIClient.post(`${BACKEND_ROUTES_API}CreateCustomExercise.php`, {
        name: newExercise.name,
        category: newExercise.category,
        muscle_group: newExercise.muscle_group,
        equipment: newExercise.equipment,
        instructions: newExercise.instructions
      });

      if (data.success) {
        // Clear the form
        setNewExercise({ 
          name: '', 
          muscle_group: '',
          category: 'strength',
          equipment: '',
          instructions: ''
        });
        
        // Refresh exercises list to include the new custom exercise
        fetchWorkoutData();
        
        // Show success modal
        setSuccessMessage('Exercise added to your library successfully!');
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error creating custom exercise:', err);
    }
  };

  const savePlan = async () => {
    if (newPlan.name && newPlan.exercises.length > 0) {
      try {
        const data = await APIClient.post(`${BACKEND_ROUTES_API}CreateWorkoutPlan.php`, newPlan);

        if (data.success) {
          fetchWorkoutData(); // Refresh the data
          setNewPlan({ name: '', description: '', exercises: [] });
          setActiveView('plans');
        }
      } catch (err) {
        console.error('Error saving plan:', err);
      }
    }
  };

  // Break timer functions
  const startBreakTimer = () => {
    if (isTimerMode) {
      setBreakTimer(breakTimerSetting);
    } else {
      setBreakTimer(0);
    }
    setIsBreakTimerRunning(true);
  };

  const resetBreakTimer = () => {
    setIsBreakTimerRunning(false);
    setBreakTimer(isTimerMode ? breakTimerSetting : 0);
  };

  const viewWorkoutDetails = async (workoutId) => {
    try {
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetWorkoutDetails.php?sessionId=${workoutId}`);

      if (data.success) {
        setSelectedWorkoutDetails(data.workoutDetails);
        setShowWorkoutDetails(true);
      }
    } catch (err) {
      console.error('Error fetching workout details:', err);
    }
  };

  // Cancel workout function
  const cancelWorkout = () => {
    setActiveWorkout(null);
    setIsWorkoutTimerRunning(false);
    setWorkoutTimer(0);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setWorkoutLogs([]);
    setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
    setShowCancelWorkoutModal(false);
    setActiveView('plans');
  };

  // Finish workout function
  const finishWorkout = async () => {
    try {
      // Save workout session
      const sessionData = await APIClient.post(`${BACKEND_ROUTES_API}SaveWorkoutSession.php`, {
        workoutPlanId: activeWorkout.id,
        planName: activeWorkout.name,
        duration: Math.floor(workoutTimer / 60), // Convert to minutes
        exercises: workoutLogs
      });

      if (sessionData.success) {
        setSuccessMessage('Workout completed successfully!');
        setShowSuccessModal(true);
        setShowFinishWorkoutModal(false);
        
        // Reset workout state
        setActiveWorkout(null);
        setIsWorkoutTimerRunning(false);
        setWorkoutTimer(0);
        setCurrentExerciseIndex(0);
        setCurrentSetIndex(0);
        setWorkoutLogs([]);
        setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
        setActiveView('plans');
        
        // Refresh data
        fetchWorkoutData();
      }
    } catch (err) {
      console.error('Error finishing workout:', err);
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

      {/* Workout Plans Grid */}
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
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setPlanToEdit(plan);
                      setShowEditModal(true);
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button 
                    className="btn btn-outline-danger"
                    onClick={() => {
                      setPlanToDelete(plan);
                      setShowDeleteModal(true);
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Buy Existing Workout Plans Section */}
      <div className="mt-5">
        <h5 className="mb-3">Premium Workout Plans</h5>
        <div className="row">
          {premadeWorkoutPlans.map((plan, index) => (
            <div key={index} className="col-lg-4 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="card-title">{plan.title}</h6>
                  <p className="text-muted small">{plan.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-primary">{plan.category}</span>
                    <span className="fw-bold text-success">${plan.price}</span>
                  </div>
                  <button className="btn btn-outline-primary w-100 mt-3">
                    <i className="bi bi-cart-plus me-2"></i>
                    Purchase Plan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workout History with Filters */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Recent Workouts</h5>
          <div className="d-flex gap-2">
            <input 
              type="date" 
              className="form-control form-control-sm"
              value={historyFilter.date}
              onChange={(e) => setHistoryFilter(prev => ({ ...prev, date: e.target.value }))}
              placeholder="Filter by date"
            />
            <input 
              type="number" 
              className="form-control form-control-sm"
              value={historyFilter.year}
              onChange={(e) => setHistoryFilter(prev => ({ ...prev, year: e.target.value }))}
              placeholder="Year"
              min="2020"
              max="2030"
            />
            <select 
              className="form-select form-select-sm"
              value={historyFilter.workoutPlan}
              onChange={(e) => setHistoryFilter(prev => ({ ...prev, workoutPlan: e.target.value }))}
            >
              <option value="">All Plans</option>
              {workoutPlans.map(plan => (
                <option key={plan.id} value={plan.name}>{plan.name}</option>
              ))}
            </select>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setHistoryFilter({ date: '', year: '', workoutPlan: '', sortBy: 'date' })}
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {filteredWorkoutHistory.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-clock-history text-muted fs-1"></i>
                <p className="text-muted mt-2">No workout history found.</p>
              </div>
            ) : (
              filteredWorkoutHistory.map(workout => (
                <div key={workout.id} className="border-bottom py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{workout.plan_name}</h6>
                      <small className="text-muted">{workout.session_date} • {workout.duration_minutes} minutes</small>
                    </div>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => viewWorkoutDetails(workout.id)}
                    >
                      View Details
                    </button>
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
              {/* Plan Details */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Plan Name</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter plan name..."
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Description</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={newPlan.description}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Plan description..."
                    />
                  </div>
                </div>
              </div>

              {/* Exercise Search */}
              <div className="mb-4">
                <h6 className="mb-3">Available Exercises</h6>
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Search exercises by name, category, or muscle group..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />
                </div>
                
                <div className="exercise-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div className="row">
                    {filteredExercises.map((exercise, index) => (
                      <div key={exercise.id || index} className="col-md-6 mb-2">
                        <div 
                          className="card card-hover border-1 cursor-pointer"
                          onClick={() => addExerciseToPlan(exercise)}
                        >
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="fw-bold">{exercise.name}</small>
                                <br />
                                <small className="text-muted">
                                  {exercise.category} • {exercise.muscle_group}
                                  {exercise.is_custom && <span className="badge bg-success ms-1">Custom</span>}
                                </small>
                              </div>
                              <i className="bi bi-plus-circle text-primary"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <hr />

              {/* Add Custom Exercise */}
              <h6 className="mb-3">Create Your Own Exercise</h6>
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
                <div className="col-md-3 mb-3">
                  <select 
                    className="form-select"
                    value={newExercise.category}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="core">Core</option>
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Muscle groups (comma separated)"
                    value={newExercise.muscle_group}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, muscle_group: e.target.value }))}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <button 
                    className="btn btn-success w-100"
                    onClick={addCustomExercise}
                    disabled={!newExercise.name}
                  >
                    <i className="bi bi-plus"></i> Add to Library
                  </button>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Equipment needed"
                    value={newExercise.equipment}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, equipment: e.target.value }))}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <textarea 
                    className="form-control"
                    placeholder="Exercise instructions..."
                    value={newExercise.instructions}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, instructions: e.target.value }))}
                    rows="2"
                  />
                </div>
              </div>

              <hr />

              {/* Buy Existing Workout Plans Tab */}
              <div className="mt-4">
                <h6 className="mb-3">Buy Existing Workout Plans</h6>
                <div className="row">
                  {premadeWorkoutPlans.slice(0, 3).map((plan, index) => (
                    <div key={index} className="col-md-4 mb-3">
                      <div className="card border-1">
                        <div className="card-body p-3">
                          <h6 className="card-title mb-2">{plan.title}</h6>
                          <p className="text-muted small mb-2">{plan.category} • {plan.difficulty_level}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-success">${plan.price}</span>
                            <button className="btn btn-outline-primary btn-sm">
                              Purchase
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top">
            <div className="card-header bg-white">
              <h6 className="mb-0">Plan Preview</h6>
            </div>
            <div className="card-body">
              <h6>{newPlan.name || 'Untitled Plan'}</h6>
              <p className="text-muted small">{newPlan.description || 'No description'}</p>
              
              {newPlan.exercises.length === 0 ? (
                <p className="text-muted small">No exercises added yet</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {newPlan.exercises.map((exercise, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                      <div>
                        <small className="fw-bold d-block">{exercise.name}</small>
                        <small className="text-muted">{exercise.sets} sets x {exercise.reps}</small>
                        {exercise.rpe && <small className="text-muted"> • RPE {exercise.rpe}</small>}
                        <br />
                        <small className="text-muted">{exercise.muscle_group}</small>
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
      {/* Workout Timer - Top Left Corner */}
      <div className="position-fixed" style={{ top: '80px', left: '20px', zIndex: 1000 }}>
        <div className="card border-0 shadow-sm">
          <div className="card-body p-2">
            <div className="d-flex align-items-center">
              <i className="bi bi-stopwatch me-2 text-primary"></i>
              <span className="fw-bold">{formatTime(workoutTimer)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Active Workout: {activeWorkout?.name}</h4>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-warning"
            onClick={cancelWorkout}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel Workout
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={() => setShowCancelWorkoutModal(true)}
          >
            <i className="bi bi-stop-circle me-2"></i>
            Cancel Workout
          </button>
        </div>
      </div>

      {activeWorkout && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6>Exercise {currentExerciseIndex + 1} of {activeWorkout.exercises.length}</h6>
                    <span className="badge bg-primary">Set {currentSetIndex + 1} of {activeWorkout.exercises[currentExerciseIndex]?.sets}</span>
                  </div>
                  <h5>{activeWorkout.exercises[currentExerciseIndex]?.name}</h5>
                  <p className="text-muted small">{activeWorkout.exercises[currentExerciseIndex]?.instructions}</p>
                </div>

                {/* Exercise Logging Form */}
                <div className="mb-4">
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Weight (kg)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="0" 
                        step="0.5"
                        value={currentSetData.weight}
                        onChange={(e) => setCurrentSetData(prev => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Reps</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="0"
                        value={currentSetData.reps}
                        onChange={(e) => setCurrentSetData(prev => ({ ...prev, reps: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">RPE (1-10)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="5" 
                        min="1" 
                        max="10"
                        value={currentSetData.rpe}
                        onChange={(e) => setCurrentSetData(prev => ({ ...prev, rpe: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Notes</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Optional notes"
                        value={currentSetData.notes}
                        onChange={(e) => setCurrentSetData(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2 mb-3">
                    <button 
                      className="btn btn-success"
                      onClick={completeSet}
                      disabled={!currentSetData.reps}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Complete Set
                    </button>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setCurrentSetIndex(currentSetIndex + 1);
                        setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
                      }}
                      disabled={currentSetIndex >= activeWorkout.exercises[currentExerciseIndex]?.sets - 1}
                    >
                      <i className="bi bi-skip-forward me-2"></i>
                      Skip Set
                    </button>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={nextExercise}
                    >
                      <i className="bi bi-arrow-right me-2"></i>
                      Next Exercise
                    </button>
                  </div>

                  {/* Break Timer Controls */}
                  <div className="card bg-light border-0">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Rest Timer</h6>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={isTimerMode}
                            onChange={(e) => {
                              setIsTimerMode(e.target.checked);
                              resetBreakTimer();
                            }}
                          />
                          <label className="form-check-label small">
                            {isTimerMode ? 'Countdown' : 'Stopwatch'}
                          </label>
                        </div>
                      </div>
                      
                      <div className="row align-items-center">
                        <div className="col-md-4">
                          {isTimerMode && (
                            <div>
                              <label className="form-label small">Rest Time (seconds)</label>
                              <input 
                                type="number" 
                                className="form-control form-control-sm"
                                value={breakTimerSetting}
                                onChange={(e) => {
                                  setBreakTimerSetting(parseInt(e.target.value) || 60);
                                  if (!isBreakTimerRunning) {
                                    setBreakTimer(parseInt(e.target.value) || 60);
                                  }
                                }}
                                min="10"
                                max="600"
                              />
                            </div>
                          )}
                        </div>
                        <div className="col-md-4 text-center">
                          <div className="fs-4 fw-bold text-primary">
                            {formatTime(breakTimer)}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex gap-1">
                            <button 
                              className={`btn btn-sm ${isBreakTimerRunning ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => {
                                if (isBreakTimerRunning) {
                                  setIsBreakTimerRunning(false);
                                } else {
                                  startBreakTimer();
                                }
                              }}
                            >
                              {isBreakTimerRunning ? 'Pause' : 'Start'}
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={resetBreakTimer}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Sets */}
                <div className="border-top pt-3">
                  <h6>Sets Progress</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Set</th>
                          <th>Weight</th>
                          <th>Reps</th>
                          <th>RPE</th>
                          <th>Notes</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: activeWorkout.exercises[currentExerciseIndex]?.sets || 0 }, (_, i) => {
                          const setData = activeWorkout.completedSets?.[currentExerciseIndex]?.[i];
                          return (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{setData?.completed ? setData.weight : '-'}</td>
                              <td>{setData?.completed ? setData.reps : '-'}</td>
                              <td>{setData?.completed ? setData.rpe || '-' : '-'}</td>
                              <td>{setData?.completed ? setData.notes || '-' : '-'}</td>
                              <td>
                                <span className={`badge ${
                                  setData?.completed ? 'bg-success' : 
                                  i === currentSetIndex ? 'bg-warning' : 'bg-light text-dark'
                                }`}>
                                  {setData?.completed ? 'Completed' : 
                                   i === currentSetIndex ? 'In Progress' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top">
              <div className="card-header bg-white">
                <h6 className="mb-0">Workout Summary</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small className="text-muted">Duration</small>
                  <h6>{formatTime(workoutTimer)}</h6>
                </div>
                <div className="mb-3">
                  <small className="text-muted">Exercises Completed</small>
                  <h6>{currentExerciseIndex} of {activeWorkout.exercises.length}</h6>
                </div>
                <div className="mb-3">
                  <small className="text-muted">Current Exercise</small>
                  <h6>{activeWorkout.exercises[currentExerciseIndex]?.name}</h6>
                </div>
                <div className="mb-3">
                  <small className="text-muted">Sets Progress</small>
                  <h6>{currentSetIndex + 1} of {activeWorkout.exercises[currentExerciseIndex]?.sets}</h6>
                </div>
                
                <hr />
                
                <h6 className="mb-2">Exercise List</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {activeWorkout.exercises.map((exercise, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded mb-2 cursor-pointer ${index === currentExerciseIndex ? 'bg-primary text-white' : 'bg-light'}`}
                      onClick={() => setCurrentExerciseIndex(index)}
                    >
                      <small className="fw-bold d-block">{exercise.name}</small>
                      <small className="opacity-75">{exercise.sets} sets x {exercise.reps}</small>
                      <br />
                      <small className="opacity-75">{exercise.muscle_group}</small>
                    </div>
                  ))}
                </div>

                <hr />

                <button 
                  className="btn btn-success w-100 mt-3"
                  onClick={() => setShowFinishWorkoutModal(true)}
                  disabled={workoutLogs.length === 0}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Finish Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Modal Components
  const DeleteModal = () => (
    <div className={`modal fade ${showDeleteModal ? 'show d-block' : ''}`} style={{ backgroundColor: showDeleteModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Delete Workout Plan</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowDeleteModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete the workout plan "<strong>{planToDelete?.name}</strong>"?</p>
            <p className="text-muted small">This action cannot be undone.</p>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={() => deletePlan(planToDelete?.id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const EditModal = () => (
    <div className={`modal fade ${showEditModal ? 'show d-block' : ''}`} style={{ backgroundColor: showEditModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Workout Plan</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowEditModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            {planToEdit && (
              <div>
                <div className="mb-3">
                  <label className="form-label">Plan Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={planToEdit.name}
                    onChange={(e) => setPlanToEdit(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control"
                    value={planToEdit.description || ''}
                    onChange={(e) => setPlanToEdit(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Exercises ({planToEdit.exercises?.length || 0})</label>
                  <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {planToEdit.exercises?.map((exercise, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong>{exercise.name}</strong>
                          <br />
                          <small className="text-muted">{exercise.sets} sets x {exercise.reps}</small>
                        </div>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setPlanToEdit(prev => ({
                            ...prev,
                            exercises: prev.exercises.filter((_, i) => i !== index)
                          }))}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => editPlan(planToEdit)}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const WorkoutDetailsModal = () => (
    <div className={`modal fade ${showWorkoutDetails ? 'show d-block' : ''}`} style={{ backgroundColor: showWorkoutDetails ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Workout Details</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowWorkoutDetails(false)}
            ></button>
          </div>
          <div className="modal-body">
            {selectedWorkoutDetails && (
              <div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Workout Plan:</strong> {selectedWorkoutDetails.plan_name}
                  </div>
                  <div className="col-md-6">
                    <strong>Date:</strong> {selectedWorkoutDetails.session_date}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Duration:</strong> {selectedWorkoutDetails.duration_minutes} minutes
                  </div>
                  <div className="col-md-6">
                    <strong>Total Sets:</strong> {selectedWorkoutDetails.total_sets}
                  </div>
                </div>
                
                <h6 className="mt-4 mb-3">Exercise Log</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Exercise</th>
                        <th>Set</th>
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>RPE</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWorkoutDetails.exerciseLogs?.map((log, index) => (
                        <tr key={index}>
                          <td>{log.exercise_name}</td>
                          <td>{log.set_number}</td>
                          <td>{log.weight_kg || '-'}</td>
                          <td>{log.reps_completed}</td>
                          <td>{log.rpe || '-'}</td>
                          <td>{log.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowWorkoutDetails(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Cancel Workout Modal
  const CancelWorkoutModal = () => (
    <div className={`modal fade ${showCancelWorkoutModal ? 'show d-block' : ''}`} style={{ backgroundColor: showCancelWorkoutModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Cancel Workout</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowCancelWorkoutModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to cancel this workout?</p>
            <p className="text-muted small">All progress will be lost and cannot be recovered.</p>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowCancelWorkoutModal(false)}
            >
              Continue Workout
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={cancelWorkout}
            >
              Cancel Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Finish Workout Modal
  const FinishWorkoutModal = () => (
    <div className={`modal fade ${showFinishWorkoutModal ? 'show d-block' : ''}`} style={{ backgroundColor: showFinishWorkoutModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Finish Workout</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowFinishWorkoutModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p>Great job! You're about to finish your workout.</p>
            <div className="workout-summary">
              <div className="row">
                <div className="col-6">
                  <strong>Duration:</strong> {formatTime(workoutTimer)}
                </div>
                <div className="col-6">
                  <strong>Sets Completed:</strong> {workoutLogs.length}
                </div>
              </div>
            </div>
            <p className="text-muted small mt-3">This will save your workout and all logged sets.</p>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowFinishWorkoutModal(false)}
            >
              Continue Workout
            </button>
            <button 
              type="button" 
              className="btn btn-success" 
              onClick={finishWorkout}
            >
              Finish Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Success Modal
  const SuccessModal = () => (
    <div className={`modal fade ${showSuccessModal ? 'show d-block' : ''}`} style={{ backgroundColor: showSuccessModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-check-circle-fill text-success me-2"></i>
              Success!
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowSuccessModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p>{successMessage}</p>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => setShowSuccessModal(false)}
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ExerciseSelectionModal = () => (
    <div className={`modal fade ${showExerciseModal ? 'show d-block' : ''}`} style={{ backgroundColor: showExerciseModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Exercise to Plan</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowExerciseModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            {selectedExercise && (
              <div>
                <div className="mb-3">
                  <h6>{selectedExercise.name}</h6>
                  <p className="text-muted small mb-0">{selectedExercise.category} • {selectedExercise.muscle_group}</p>
                  {selectedExercise.instructions && (
                    <p className="text-muted small mt-2">{selectedExercise.instructions}</p>
                  )}
                </div>
                
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Sets</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={exerciseToAdd.sets}
                      onChange={(e) => setExerciseToAdd(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Reps/Time</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g., 8-12, 30s"
                      value={exerciseToAdd.reps}
                      onChange={(e) => setExerciseToAdd(prev => ({ ...prev, reps: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Target RPE (Optional)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="1-10"
                      value={exerciseToAdd.rpe}
                      onChange={(e) => setExerciseToAdd(prev => ({ ...prev, rpe: e.target.value }))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <select 
                    className="form-select"
                    value={exerciseToAdd.type}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="reps">Reps</option>
                    <option value="time">Time</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowExerciseModal(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={addExerciseFromModal}
              disabled={!exerciseToAdd.sets || !exerciseToAdd.reps}
            >
              Add to Plan
            </button>
          </div>
        </div>
      </div>
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

      {/* Modals */}
      <DeleteModal />
      <EditModal />
      <WorkoutDetailsModal />
      <ExerciseSelectionModal />
      <CancelWorkoutModal />
      <FinishWorkoutModal />
      <SuccessModal />
    </div>
  );
};

export default MyWorkouts;
