import React, { useState, useEffect } from 'react';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import BackButton from '../../../components/BackButton';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';

// Add inline styles for card hover effect
const styles = `
  .card-hover {
    transition: all 0.3s ease;
    border: 1px solid #dee2e6;
  }
  .card-hover:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
    border-color: #0d6efd;
  }
  .cursor-pointer {
    cursor: pointer;
  }
`;

const CreatePrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [activeView, setActiveView] = useState('list'); // list, create, edit
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, programId: null, programTitle: '' });
  const [allExercises, setAllExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseToAdd, setExerciseToAdd] = useState({ sets: 3, reps: '', rpe: '', type: 'reps' });
  
  // New exercise creation
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscle_group: '',
    category: 'strength',
    equipment: '',
    instructions: ''
  });
  
  // Program Package (the big program that contains workout sessions)
  const [programPackage, setProgramPackage] = useState({
    title: '',
    description: '',
    long_description: '',
    meta_title: '',
    meta_description: '',
    tags: [],
    difficulty_level: 'beginner',
    duration_weeks: 4,
    category: 'Strength',
    price: 0,
    currency: 'USD',
    status: 'draft'
  });

  // Workout Sessions (individual workouts inside the package)
  const [workoutSessions, setWorkoutSessions] = useState([]); // Array of workout sessions
  const [currentSession, setCurrentSession] = useState({ 
    name: '', 
    description: '', 
    exercises: [],
    week_number: 1,
    day_number: 1
  });

  const [currentTag, setCurrentTag] = useState('');
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editingSessionIndex, setEditingSessionIndex] = useState(null);

  const categories = ['Strength', 'Cardio', 'Hybrid', 'Weight Loss', 'Muscle Building', 'Endurance', 'Flexibility', 'General Fitness'];
  
  // Toast notification function
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };
  
  useEffect(() => {
    fetchPrograms();
    fetchExercises();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPrograms.php?type=my-programs`);
      
      if (data.success) {
        setPrograms(data.programs || []);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetWorkoutData.php`);
      
      if (data.success) {
        const exercises = data.exercises || [];
        
        // Deduplicate by exercise NAME (database has duplicates with different IDs)
        const uniqueExercises = [];
        const seenNames = new Set();
        
        exercises.forEach(exercise => {
          const key = `${exercise.name.toLowerCase()}-${exercise.is_custom}`; // Unique by name + custom flag
          if (!seenNames.has(key)) {
            seenNames.add(key);
            uniqueExercises.push(exercise);
          }
        });
        
        setAllExercises(uniqueExercises);
      }
    } catch (err) {
      showToast('Failed to load exercises. Please refresh the page.', 'error');
    }
  };

  // Filter exercises by search (only global exercises, memoized)
  const filteredExercises = React.useMemo(() => {
    return allExercises
      .filter(exercise => exercise.is_custom == 0)
      .filter(exercise =>
        exercise.name?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.category?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.muscle_group?.toLowerCase().includes(exerciseSearch.toLowerCase())
      );
  }, [allExercises, exerciseSearch]);

  // Get custom exercises
  const customExercises = React.useMemo(() => {
    return allExercises.filter(exercise => exercise.is_custom == 1);
  }, [allExercises]);

  // Add tag
  const addTag = () => {
    if (currentTag && !programPackage.tags.includes(currentTag)) {
      setProgramPackage(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setProgramPackage(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Exercise Modal Functions
  const openExerciseModal = (exercise) => {
    setSelectedExercise(exercise);
    setExerciseToAdd({ sets: 3, reps: '10-12', rpe: '7-8', type: 'reps' });
    setShowExerciseModal(true);
  };

  const addExerciseFromModal = () => {
    if (!selectedExercise || !exerciseToAdd.sets || !exerciseToAdd.reps) {
      showToast('Please fill in exercise name and muscle group', 'warning');
      return;
    }

    const exerciseToAddToSession = {
      ...exerciseToAdd,
      name: selectedExercise.name,
      muscle_group: selectedExercise.muscle_group,
      category: selectedExercise.category,
      equipment: selectedExercise.equipment,
      instructions: selectedExercise.instructions,
      exercise_id: selectedExercise.id
    };
    
    setCurrentSession(prev => ({
      ...prev,
      exercises: [...prev.exercises, exerciseToAddToSession]
    }));
    
    setShowExerciseModal(false);
    setSelectedExercise(null);
    setExerciseToAdd({ sets: 3, reps: '10-12', rpe: '7-8', type: 'reps' });
  };

  const addExerciseToSession = (exercise) => {
    openExerciseModal(exercise);
  };

  // Custom Exercise Creation
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
        setNewExercise({ 
          name: '', 
          muscle_group: '',
          category: 'strength',
          equipment: '',
          instructions: ''
        });
        fetchExercises();
        showToast('Exercise added successfully!', 'success');
      }
    } catch (err) {
      console.error('Error creating custom exercise:', err);
    }
  };

  // Delete Custom Exercise
  const deleteCustomExercise = async (exerciseId) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;

    try {
      const data = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteCustomExercise.php`, { 
        exerciseId 
      });

      if (data.success) {
        showToast('Exercise deleted successfully!', 'success');
        fetchExercises();
      } else {
        showToast(data.message || 'Could not delete exercise', 'error');
      }
    } catch (err) {
      showToast('Error deleting exercise: ' + err.message, 'error');
    }
  };

  // Workout Session Management
  const saveCurrentSession = () => {
    if (!currentSession.name || currentSession.exercises.length === 0) {
      showToast('Please add a session name and at least one exercise', 'warning');
      return;
    }

    const wasEditing = isEditingSession;
    
    if (isEditingSession) {
      // Update existing session
      const updatedSessions = [...workoutSessions];
      updatedSessions[editingSessionIndex] = currentSession;
      setWorkoutSessions(updatedSessions);
      setIsEditingSession(false);
      setEditingSessionIndex(null);
    } else {
      // Add new session
      setWorkoutSessions(prev => [...prev, currentSession]);
    }

    // Reset current session
    resetSessionForm();
    showToast(wasEditing ? 'Workout session updated!' : 'Workout session added!', 'success');
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

  // Save Complete Program Package
  const saveProgram = async () => {
    if (!programPackage.title) {
      showToast('Please enter a program title', 'warning');
      return;
    }

    if (workoutSessions.length === 0) {
      showToast('Please add at least one workout session', 'warning');
      return;
    }

    try {
      const programData = {
        ...programPackage,
        sessions: workoutSessions
      };

      const data = editingProgramId
        ? await APIClient.put(`${BACKEND_ROUTES_API}UpdateProgram.php`, { ...programData, id: editingProgramId })
        : await APIClient.post(`${BACKEND_ROUTES_API}CreateProgram.php`, programData);

      if (data.success) {
        showToast(editingProgramId ? 'Program updated successfully!' : 'Program created successfully!', 'success');
        resetProgramForm();
        setActiveView('list');
        fetchPrograms();
      } else {
        showToast('Error saving program: ' + (data.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Error saving program: ' + err.message, 'error');
    }
  };

  const resetProgramForm = () => {
    setProgramPackage({
      title: '',
      description: '',
      long_description: '',
      meta_title: '',
      meta_description: '',
      tags: [],
      difficulty_level: 'beginner',
      duration_weeks: 4,
      category: 'Strength',
      price: 0,
      currency: 'USD',
      status: 'draft'
    });
    setWorkoutSessions([]);
    resetSessionForm();
    setEditingProgramId(null);
    setIsEditingSession(false);
    setEditingSessionIndex(null);
  };

  const deleteProgram = async (id) => {
    try {
      const data = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteProgram.php`, { id });
      
      if (data.success) {
        showToast('Program deleted successfully!', 'success');
        setDeleteModal({ show: false, programId: null, programTitle: '' });
        fetchPrograms();
      }
    } catch (err) {
      console.error('Error deleting program:', err);
      showToast('Error deleting program', 'error');
    }
  };

  const confirmDelete = (program) => {
    setDeleteModal({ show: true, programId: program.id, programTitle: program.title });
  };

  const editProgram = async (program) => {
    try {
      // Fetch full program details including sessions
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPrograms.php?id=${program.id}`);
      
      if (!data.success || !data.program) {
        showToast('Failed to load program details', 'error');
        return;
      }
      
      const fullProgram = data.program;
      
      // Load program data
      setEditingProgramId(fullProgram.id);
      setProgramPackage({
        title: fullProgram.title,
        description: fullProgram.description,
        long_description: fullProgram.long_description || '',
        meta_title: fullProgram.meta_title || '',
        meta_description: fullProgram.meta_description || '',
        tags: fullProgram.tags || [],
        difficulty_level: fullProgram.difficulty_level,
        duration_weeks: fullProgram.duration_weeks,
        category: fullProgram.category,
        price: fullProgram.price,
        currency: fullProgram.currency,
        status: fullProgram.status
      });

      // Load sessions with exercises
      if (fullProgram.sessions && fullProgram.sessions.length > 0) {
        // Use sessions from API
        const sessions = fullProgram.sessions.map(session => ({
          name: session.session_name,
          description: session.session_description || '',
          week_number: session.week_number,
          day_number: session.day_number,
          exercises: session.exercises.map(ex => ({
            exercise_id: ex.exercise_id,
            name: ex.name || 'Exercise',
            sets: ex.sets,
            reps: ex.reps,
            rpe: ex.rpe || '',
            muscle_group: ex.muscle_group || '',
            category: ex.category || ''
          }))
        }));
        setWorkoutSessions(sessions);
      } else if (fullProgram.exercises && fullProgram.exercises.length > 0) {
        // Fallback: group exercises by week and day if no sessions
        const grouped = {};
        fullProgram.exercises.forEach(ex => {
          const key = `${ex.week_number}-${ex.day_number}`;
          if (!grouped[key]) {
            grouped[key] = {
              name: `Week ${ex.week_number} Day ${ex.day_number}`,
              description: ex.notes || '',
              week_number: ex.week_number,
              day_number: ex.day_number,
              exercises: []
            };
          }
          grouped[key].exercises.push({
            exercise_id: ex.exercise_id,
            name: ex.name || 'Exercise',
            sets: ex.sets,
            reps: ex.reps,
            rpe: ex.rpe,
            muscle_group: ex.muscle_group || '',
            category: ex.category || ''
          });
        });
        setWorkoutSessions(Object.values(grouped));
      } else {
        setWorkoutSessions([]);
      }

      setActiveView('create');
    } catch (err) {
      showToast('Error loading program: ' + err.message, 'error');
    }
  };

  // Render Functions
  const renderListView = () => (
    <div>
      <style>{styles}</style>
      
      <BackButton className="mb-3" />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">My Training Programs</h4>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetProgramForm();
            setActiveView('create');
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create New Program
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
          <p className="text-muted mt-3">No programs yet. Create your first training program!</p>
        </div>
      ) : (
        <div className="row">
          {programs.map(program => (
            <div key={program.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card card-hover h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{program.title}</h5>
                    <span className={`badge bg-${program.status === 'published' ? 'success' : 'warning'}`}>
                      {program.status}
                    </span>
                  </div>
                  
                  <p className="text-muted small">{program.description}</p>
                  
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    <span className="badge bg-light text-dark">{program.category}</span>
                    <span className="badge bg-light text-dark">{program.difficulty_level}</span>
                    <span className="badge bg-light text-dark">{program.duration_weeks} weeks</span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="h5 mb-0 text-success">${program.price}</span>
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => editProgram(program)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-outline-danger"
                        onClick={() => confirmDelete(program)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateView = () => (
    <div>
      <style>{styles}</style>
      
      <button 
        className="btn btn-secondary mb-3"
        onClick={() => {
          resetProgramForm();
          setActiveView('list');
        }}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back to Programs
      </button>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">{editingProgramId ? 'Edit Program' : 'Create Training Program'}</h4>
      </div>

      <div className="row">
        {/* Left Column - Program Package Details */}
        <div className="col-lg-8">
          {/* Program Package Information */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h6 className="mb-0">Program Package Details</h6>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-8">
                  <label className="form-label">Program Title *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={programPackage.title}
                    onChange={(e) => setProgramPackage(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., 12-Week Muscle Building Program"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Price (USD) *</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={programPackage.price}
                    onChange={(e) => setProgramPackage(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Short Description</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={programPackage.description}
                  onChange={(e) => setProgramPackage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief program description..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Full Description</label>
                <textarea 
                  className="form-control"
                  rows="4"
                  value={programPackage.long_description}
                  onChange={(e) => setProgramPackage(prev => ({ ...prev, long_description: e.target.value }))}
                  placeholder="Detailed program description, benefits, what's included..."
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={programPackage.category}
                    onChange={(e) => setProgramPackage(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Difficulty Level</label>
                  <select 
                    className="form-select"
                    value={programPackage.difficulty_level}
                    onChange={(e) => setProgramPackage(prev => ({ ...prev, difficulty_level: e.target.value }))}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Duration (weeks)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={programPackage.duration_weeks}
                    onChange={(e) => setProgramPackage(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-8">
                  <label className="form-label">Tags</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tags (press Enter)"
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={addTag}
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-2">
                    {programPackage.tags.map((tag, index) => (
                      <span key={index} className="badge bg-primary me-1 mb-1">
                        {tag}
                        <i 
                          className="bi bi-x-circle ms-1 cursor-pointer"
                          onClick={() => removeTag(tag)}
                          style={{ cursor: 'pointer' }}
                        ></i>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select"
                    value={programPackage.status}
                    onChange={(e) => setProgramPackage(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Workout Sessions List */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Workout Sessions ({workoutSessions.length})</h6>
              <small className="text-muted">Individual workouts in this program</small>
            </div>
            <div className="card-body">
              {workoutSessions.length === 0 ? (
                <p className="text-muted text-center py-3">
                  No workout sessions added yet. Create one below!
                </p>
              ) : (
                <div className="list-group">
                  {workoutSessions.map((session, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{session.name}</h6>
                          <p className="mb-1 text-muted small">{session.description}</p>
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

          {/* Current Workout Session Builder (same as trainee workout creation) */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">
                {isEditingSession ? 'Edit Workout Session' : 'Create New Workout Session'}
              </h6>
            </div>
            <div className="card-body">
              {/* Session Details */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Session Name *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={currentSession.name}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Upper Body Strength"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Description</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={currentSession.description}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Session description..."
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label">Week Number</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={currentSession.week_number}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, week_number: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Day Number</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={currentSession.day_number}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, day_number: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="7"
                  />
                </div>
              </div>

              <hr />

              {/* Exercise Search */}
              <h6 className="mb-3">Add Exercises to This Session</h6>
              <div className="mb-3">
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Search exercises by name, category, or muscle group..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                />
              </div>
              
              <p className="text-muted small">
                Showing {filteredExercises.length} global exercises (custom exercises shown below)
              </p>
              
              <div className="exercise-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div className="row">
                  {filteredExercises.map((exercise) => (
                    
                      <div key={`global-${exercise.id}`} className="col-md-6 mb-2">
                        <div 
                          className="card card-hover border-1 cursor-pointer"
                          onClick={() => addExerciseToSession(exercise)}
                        >
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="fw-bold">{exercise.name}</small>
                                <br />
                                <small className="text-muted">
                                  {exercise.category} • {exercise.muscle_group}
                                </small>
                              </div>
                              <i className="bi bi-plus-circle text-primary"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <hr />

              {/* My Custom Exercises */}
              <h6 className="mb-3">My Exercises ({customExercises.length})</h6>
              {customExercises.length === 0 ? (
                <p className="text-muted small">No custom exercises yet. Create one above!</p>
              ) : (
                <div className="exercise-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <div className="row">
                    {customExercises.map((exercise) => (
                      <div key={`custom-${exercise.id}`} className="col-md-6 mb-2">
                        <div className="card border-1">
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div 
                                className="flex-grow-1 cursor-pointer"
                                onClick={() => addExerciseToSession(exercise)}
                              >
                                <small className="fw-bold">{exercise.name}</small>
                                <br />
                                <small className="text-muted">
                                  {exercise.category} • {exercise.muscle_group}
                                </small>
                              </div>
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addExerciseToSession(exercise);
                                  }}
                                  title="Add to session"
                                >
                                  <i className="bi bi-plus-circle"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCustomExercise(exercise.id);
                                  }}
                                  title="Delete exercise"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    placeholder="Muscle group"
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
                    <i className="bi bi-plus"></i> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="col-lg-4">
          {/* Session Preview */}
          <div className="card border-0 shadow-sm sticky-top mb-3">
            <div className="card-header bg-white">
              <h6 className="mb-0">Current Session Preview</h6>
            </div>
            <div className="card-body">
              <h6>{currentSession.name || 'Untitled Session'}</h6>
              <p className="text-muted small">{currentSession.description || 'No description'}</p>
              <div className="mb-3">
                <span className="badge bg-info me-1">Week {currentSession.week_number}</span>
                <span className="badge bg-info">Day {currentSession.day_number}</span>
              </div>
              
              {currentSession.exercises.length === 0 ? (
                <p className="text-muted small">No exercises added yet</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {currentSession.exercises.map((exercise, index) => (
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
                        onClick={() => setCurrentSession(prev => ({
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
              
              <div className="d-flex gap-2 mt-3">
                <button 
                  className="btn btn-success flex-grow-1"
                  onClick={saveCurrentSession}
                  disabled={!currentSession.name || currentSession.exercises.length === 0}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  {isEditingSession ? 'Update Session' : 'Add Session'}
                </button>
                {isEditingSession && (
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      resetSessionForm();
                      setIsEditingSession(false);
                      setEditingSessionIndex(null);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Save Program Button */}
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <button 
                className="btn btn-primary w-100 btn-lg mb-2"
                onClick={saveProgram}
                disabled={!programPackage.title || (!editingProgramId && workoutSessions.length === 0)}
              >
                <i className="bi bi-save me-2"></i>
                {editingProgramId ? 'Update Program Package' : 'Create Program Package'}
              </button>
              <button 
                className="btn btn-secondary w-100"
                onClick={() => {
                  resetProgramForm();
                  setActiveView('list');
                }}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancel
              </button>
              <small className="text-muted d-block mt-2 text-center">
                {workoutSessions.length} workout session(s) ready
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Modal */}
      {showExerciseModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add {selectedExercise?.name}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowExerciseModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Sets *</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={exerciseToAdd.sets}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reps *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={exerciseToAdd.reps}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, reps: e.target.value }))}
                    placeholder="e.g., 8-12 or 10"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">RPE</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={exerciseToAdd.rpe}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, rpe: e.target.value }))}
                    placeholder="e.g., 7-8"
                  />
                </div>
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
                >
                  Add Exercise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <TrainerDashboardLayout>
      <div className="container py-4" style={{ minHeight: 'calc(100vh - 0px)' }}>
        {activeView === 'list' && renderListView()}
        {activeView === 'create' && renderCreateView()}
      
        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirm Delete
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setDeleteModal({ show: false, programId: null, programTitle: '' })}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">Are you sure you want to delete <strong>"{deleteModal.programTitle}"</strong>?</p>
                <p className="text-muted small mt-2 mb-0">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setDeleteModal({ show: false, programId: null, programTitle: '' })}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={() => deleteProgram(deleteModal.programId)}
                >
                  <i className="bi bi-trash me-2"></i>
                  Delete Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bootstrap Toast Notification */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
          <div className={`toast show`} role="alert">
            <div className={`toast-header bg-${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'danger' : 'warning'} text-white`}>
              <strong className="me-auto">
                {toast.type === 'success' ? '✓ Success' : toast.type === 'error' ? '✕ Error' : '⚠ Warning'}
              </strong>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
              ></button>
            </div>
            <div className="toast-body">{toast.message}</div>
          </div>
        </div>
      )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default CreatePrograms;
