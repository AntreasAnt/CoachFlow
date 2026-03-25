import React, { useState } from 'react';

const CreateWorkoutProgram = ({ onSave, onCancel, allExercises, onAddCustomExercise }) => {
  const [programPackage, setProgramPackage] = useState({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    duration_weeks: 4,
    category: 'Strength'
  });

  const [workoutSessions, setWorkoutSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState({
    name: '',
    description: '',
    exercises: [],
    week_number: 1,
    day_number: 1
  });

  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editingSessionIndex, setEditingSessionIndex] = useState(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseToAdd, setExerciseToAdd] = useState({ sets: 3, reps: '', rpe: '', type: 'reps' });
  
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscle_group: '',
    category: 'strength',
    equipment: '',
    instructions: ''
  });

  const categories = ['Strength', 'Cardio', 'Hybrid', 'Weight Loss', 'Muscle Building', 'Endurance', 'Flexibility', 'General Fitness'];

  const filteredExercises = React.useMemo(() => {
    return (allExercises || [])
      .filter(exercise => exercise.is_custom == 0)
      .filter(ex =>
        ex.name?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        ex.category?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        ex.muscle_group?.toLowerCase().includes(exerciseSearch.toLowerCase())
      );
  }, [allExercises, exerciseSearch]);

  const customExercises = React.useMemo(() => {
    return (allExercises || []).filter(exercise => exercise.is_custom == 1);
  }, [allExercises]);

  const saveCurrentSession = () => {
    if (!currentSession.name || currentSession.exercises.length === 0) {
      alert('Please add a session name and at least one exercise');
      return;
    }

    if (isEditingSession) {
      const updatedSessions = [...workoutSessions];
      updatedSessions[editingSessionIndex] = currentSession;
      setWorkoutSessions(updatedSessions);
      setIsEditingSession(false);
      setEditingSessionIndex(null);
    } else {
      setWorkoutSessions(prev => [...prev, currentSession]);
    }

    resetSessionForm();
  };

  const resetSessionForm = () => {
    setCurrentSession({
      name: '',
      description: '',
      exercises: [],
      week_number: 1,
      day_number: 1
    });
  };

  const editSession = (index) => {
    setCurrentSession(workoutSessions[index]);
    setIsEditingSession(true);
    setEditingSessionIndex(index);
  };

  const deleteSession = (index) => {
    if (confirm('Are you sure you want to delete this workout session?')) {
      setWorkoutSessions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateSession = (index) => {
    const sessionToDuplicate = { ...workoutSessions[index] };
    sessionToDuplicate.name = sessionToDuplicate.name + ' (Copy)';
    setWorkoutSessions(prev => [...prev, sessionToDuplicate]);
  };

  const openExerciseModal = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
    setExerciseToAdd({ sets: 3, reps: '10-12', rpe: '7-8', type: 'reps' });
  };

  const addExerciseFromModal = () => {
    if (!selectedExercise || !exerciseToAdd.sets || !exerciseToAdd.reps) {
      alert('Please select an exercise and provide sets/reps');
      return;
    }

    const newExercise = {
      exercise_id: selectedExercise.id,
      name: selectedExercise.name,
      muscle_group: selectedExercise.muscle_group,
      category: selectedExercise.category,
      sets: parseInt(exerciseToAdd.sets),
      reps: exerciseToAdd.type === 'reps' ? exerciseToAdd.reps : null,
      duration: exerciseToAdd.type === 'duration' ? exerciseToAdd.reps : null,
      rpe: exerciseToAdd.rpe || null,
      type: exerciseToAdd.type
    };

    setCurrentSession(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));

    setShowExerciseModal(false);
    setSelectedExercise(null);
    setExerciseToAdd({ sets: 3, reps: '10-12', rpe: '7-8', type: 'reps' });
  };

  const addExerciseToSession = (exercise) => {
    openExerciseModal(exercise);
  };

  const addCustomExercise = async () => {
    if (!newExercise.name || !onAddCustomExercise) return;

    const success = await onAddCustomExercise({
      name: newExercise.name,
      category: newExercise.category,
      muscle_group: newExercise.muscle_group,
      equipment: newExercise.equipment,
      instructions: newExercise.instructions
    });

    if (success) {
      setNewExercise({
        name: '',
        muscle_group: '',
        category: 'strength',
        equipment: '',
        instructions: ''
      });
    }
  };

  const removeExerciseFromSession = (index) => {
    setCurrentSession(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProgram = () => {
    if (!programPackage.title) {
      alert('Please enter a program title');
      return;
    }

    if (workoutSessions.length === 0) {
      alert('Please add at least one workout session');
      return;
    }

    const programData = {
      ...programPackage,
      sessions: workoutSessions
    };

    onSave(programData);
  };

  return (
    <>
      <style>{`
        .form-control::placeholder,
        .form-select::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .form-control:focus,
        .form-select:focus {
          background: rgba(30, 35, 30, 0.9) !important;
          border-color: rgba(32, 214, 87, 0.6) !important;
          box-shadow: 0 0 0 0.25rem rgba(32, 214, 87, 0.15) !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }
        .list-group-item-action:hover {
          background: rgba(32, 214, 87, 0.2) !important;
        }
      `}</style>
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Create Workout Program</h4>
        <button className="btn btn-outline-secondary" onClick={onCancel}>
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
      </div>

      {/* Program Details */}
      <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
        <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.2)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0' }}>
          <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Program Details</h6>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Program Title *</label>
            <input 
              type="text" 
              className="form-control"
              style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
              value={programPackage.title}
              onChange={(e) => setProgramPackage(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., 12-Week Strength Builder"
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Description</label>
            <textarea 
              className="form-control"
              style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
              rows="3"
              value={programPackage.description}
              onChange={(e) => setProgramPackage(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief program description..."
            />
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Category</label>
              <select 
                className="form-select"
                style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                value={programPackage.category}
                onChange={(e) => setProgramPackage(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Difficulty Level</label>
              <select 
                className="form-select"
                style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                value={programPackage.difficulty_level}
                onChange={(e) => setProgramPackage(prev => ({ ...prev, difficulty_level: e.target.value }))}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Duration (weeks)</label>
              <input 
                type="number" 
                className="form-control"
                style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                value={programPackage.duration_weeks}
                onChange={(e) => setProgramPackage(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workout Sessions List */}
      <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
        <div className="card-header d-flex justify-content-between align-items-center" style={{ background: 'rgba(32, 214, 87, 0.2)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0' }}>
          <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Workout Sessions ({workoutSessions.length})</h6>
          <small style={{ color: 'rgba(255,255,255,0.7)' }}>Individual workouts in this program</small>
        </div>
        <div className="card-body">
          {workoutSessions.length === 0 ? (
            <p className="text-center py-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No workout sessions added yet. Create one below!
            </p>
          ) : (
            <div className="list-group">
              {workoutSessions.map((session, index) => (
                <div key={index} className="list-group-item" style={{ background: 'rgba(30, 35, 30, 0.6)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>{session.name}</h6>
                      <p className="mb-1 small" style={{ color: 'rgba(255,255,255,0.7)' }}>{session.description}</p>
                      <div className="d-flex gap-2">
                        <span className="badge bg-info">Week {session.week_number}</span>
                        <span className="badge bg-info">Day {session.day_number}</span>
                        <span className="badge bg-secondary">{session.exercises.length} exercises</span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => duplicateSession(index)}
                        title="Duplicate"
                      >
                        <i className="bi bi-files"></i>
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => editSession(index)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteSession(index)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Session Builder */}
      <div className="card mb-4" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
        <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.2)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0' }}>
          <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {isEditingSession ? 'Edit Workout Session' : 'Create New Workout Session'}
          </h6>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Session Name *</label>
              <input 
                type="text" 
                className="form-control"
                style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                value={currentSession.name}
                onChange={(e) => setCurrentSession(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Upper Body Strength"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Description</label>
              <input 
                type="text" 
                className="form-control"
                style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                value={currentSession.description}
                onChange={(e) => setCurrentSession(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Session description..."
              />
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Week Number</label>
              <input 
                type="number" 
                className="form-control"
                style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                value={currentSession.week_number}
                onChange={(e) => setCurrentSession(prev => ({ ...prev, week_number: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Day Number</label>
              <input 
                type="number" 
                className="form-control"
                style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                value={currentSession.day_number}
                onChange={(e) => setCurrentSession(prev => ({ ...prev, day_number: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>
          </div>

          <hr />

          <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>Add Exercises to This Session</h6>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search exercises by name, category, or muscle group..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
            />
          </div>

          <p className="small" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Showing {filteredExercises.length} global exercises (custom exercises shown below)
          </p>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div className="row">
              {filteredExercises.map((exercise) => (
                <div key={`global-${exercise.id}`} className="col-md-6 mb-2">
                  <div
                    className="card"
                    onClick={() => addExerciseToSession(exercise)}
                    style={{ background: 'rgba(30, 35, 30, 0.6)', border: '1px solid rgba(32, 214, 87, 0.25)', cursor: 'pointer' }}
                  >
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{exercise.name}</small>
                          <br />
                          <small style={{ color: 'rgba(255,255,255,0.7)' }}>{exercise.category} • {exercise.muscle_group}</small>
                        </div>
                        <i className="bi bi-plus-circle" style={{ color: 'rgba(32, 214, 87, 0.95)' }}></i>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr style={{ borderColor: 'rgba(32, 214, 87, 0.2)' }} />

          <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>My Exercises ({customExercises.length})</h6>
          {customExercises.length === 0 ? (
            <p className="small" style={{ color: 'rgba(255,255,255,0.6)' }}>No custom exercises yet. Create one below.</p>
          ) : (
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              <div className="row">
                {customExercises.map((exercise) => (
                  <div key={`custom-${exercise.id}`} className="col-md-6 mb-2">
                    <div className="card" style={{ background: 'rgba(30, 35, 30, 0.6)', border: '1px solid rgba(32, 214, 87, 0.25)' }}>
                      <div className="card-body py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => addExerciseToSession(exercise)}>
                            <small className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{exercise.name}</small>
                            <br />
                            <small style={{ color: 'rgba(255,255,255,0.7)' }}>{exercise.category} • {exercise.muscle_group}</small>
                          </div>
                          <button
                            className="btn btn-sm"
                            onClick={() => addExerciseToSession(exercise)}
                            style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(32, 214, 87, 0.95)' }}
                          >
                            <i className="bi bi-plus-circle"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr />

          <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>Create Your Own Exercise</h6>
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
                placeholder="Muscle group"
                value={newExercise.muscle_group}
                onChange={(e) => setNewExercise(prev => ({ ...prev, muscle_group: e.target.value }))}
              />
            </div>
            <div className="col-md-2 mb-3">
              <button
                className="btn w-100"
                onClick={addCustomExercise}
                disabled={!newExercise.name}
                style={{ background: 'rgba(32, 214, 87, 0.2)', border: '1px solid rgba(32, 214, 87, 0.4)', color: 'rgba(32, 214, 87, 0.95)', fontWeight: '600' }}
              >
                Add
              </button>
            </div>
          </div>

          <hr />

          <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>Session Exercises ({currentSession.exercises.length})</h6>
          {currentSession.exercises.length === 0 ? (
            <p className="small" style={{ color: 'rgba(255,255,255,0.6)' }}>No exercises added yet</p>
          ) : (
            <div className="mb-3">
              {currentSession.exercises.map((exercise, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ background: 'rgba(30, 35, 30, 0.6)', border: '1px solid rgba(32, 214, 87, 0.25)' }}>
                  <div>
                    <small className="fw-bold d-block" style={{ color: 'rgba(255,255,255,0.9)' }}>{exercise.name}</small>
                    <small style={{ color: 'rgba(255,255,255,0.7)' }}>{exercise.sets} sets x {exercise.type === 'reps' ? exercise.reps : exercise.duration}</small>
                    {exercise.rpe && <small style={{ color: 'rgba(255,255,255,0.7)' }}> • RPE {exercise.rpe}</small>}
                    <br />
                    <small style={{ color: 'rgba(255,255,255,0.7)' }}>{exercise.muscle_group}</small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeExerciseFromSession(index)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="d-flex gap-2">
            <button 
              className="btn btn-success"
              onClick={saveCurrentSession}
              disabled={!currentSession.name || currentSession.exercises.length === 0}
            >
              <i className="bi bi-check-circle me-2"></i>
              {isEditingSession ? 'Update Session' : 'Add Session to Program'}
            </button>
            {isEditingSession && (
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setIsEditingSession(false);
                  setEditingSessionIndex(null);
                  resetSessionForm();
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Program Button */}
      <div className="d-flex gap-2 justify-content-end">
        <button 
          className="btn btn-lg btn-success"
          onClick={handleSaveProgram}
          disabled={!programPackage.title || workoutSessions.length === 0}
        >
          <i className="bi bi-save me-2"></i>
          Save Program
        </button>
      </div>

      {/* Exercise Modal */}
      {showExerciseModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem', overflow: 'hidden' }}>
              <div className="modal-header" style={{ background: 'rgba(15, 20, 15, 0.95)', borderBottom: '1px solid rgba(32, 214, 87, 0.2)' }}>
                <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>Add {selectedExercise?.name}</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  style={{ opacity: 0.9 }}
                  onClick={() => setShowExerciseModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Sets *</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                    value={exerciseToAdd.sets}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Reps *</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                    value={exerciseToAdd.reps}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, reps: e.target.value }))}
                    placeholder="e.g., 8-12"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>RPE</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                    value={exerciseToAdd.rpe}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, rpe: e.target.value }))}
                    placeholder="e.g., 7-8"
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
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
                  disabled={!selectedExercise || !exerciseToAdd.sets || !exerciseToAdd.reps}
                >
                  Add to Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default CreateWorkoutProgram;
