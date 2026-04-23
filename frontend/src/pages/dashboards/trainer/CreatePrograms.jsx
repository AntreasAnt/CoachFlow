import React, { useState, useEffect } from 'react';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';

// Add inline styles for card hover effect
const styles = `
  .form-control, .form-select {
    background-color: #1a1a1a !important;
    border: 1px solid #3d3d3d !important;
    color: #fff !important;
  }
  .form-control:focus, .form-select:focus {
    background-color: #1a1a1a !important;
    border-color: #3d3d3d !important;
    color: #fff !important;
    box-shadow: none !important;
  }
  .cf-dark-modal-header {
    background: #2d2d2d !important;
    background-color: #2d2d2d !important;
    background-image: none !important;
  }
  .card-hover {
    transition: all 0.3s ease;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  .card-hover:hover {
    box-shadow: 0 0.5rem 1rem rgba(16, 185, 129, 0.3);
    transform: translateY(-2px);
    border-color: #10b981;
    background-color: #2d2d2d !important;
  }
  .cursor-pointer {
    cursor: pointer;
  }
  .exercise-list::-webkit-scrollbar,
  .session-preview-list::-webkit-scrollbar {
    width: 8px;
  }
  .exercise-list::-webkit-scrollbar-track,
  .session-preview-list::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 4px;
  }
  .exercise-list::-webkit-scrollbar-thumb,
  .session-preview-list::-webkit-scrollbar-thumb {
    background: #10b981;
    border-radius: 4px;
  }
  .exercise-list::-webkit-scrollbar-thumb:hover,
  .session-preview-list::-webkit-scrollbar-thumb:hover {
    background: #059669;
  }
`;

const CreatePrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [programsPerPage] = useState(6);
  const [programSearch, setProgramSearch] = useState('');
  const [activeView, setActiveView] = useState('list'); // list, create, edit
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, programId: null, programTitle: '' });
  const [deleteExerciseModal, setDeleteExerciseModal] = useState({ show: false, exerciseId: null, exerciseName: '' });
  const [editExerciseModal, setEditExerciseModal] = useState({ show: false, exerciseId: null, name: '', muscle_group: '', category: 'strength', equipment: '', instructions: '' });
  const [allExercises, setAllExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [customExerciseSearch, setCustomExerciseSearch] = useState('');
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
    currency: 'EUR',
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
    // fetchPrograms is handled by the dependency array useEffects below
    fetchExercises();
  }, []);

  const fetchPrograms = async (page = currentPage, search = programSearch) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'my-programs',
        page: page,
        limit: programsPerPage,
        search: search
      });
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPrograms.php?${params.toString()}`);
      
      if (data.success) {
        setPrograms(data.programs || []);
        setTotalPrograms(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchPrograms(1, programSearch);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [programSearch]);

  useEffect(() => {
    fetchPrograms(currentPage, programSearch);
  }, [currentPage]);

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

  // Filter custom exercises by search (memoized)
  const filteredCustomExercises = React.useMemo(() => {
    return customExercises.filter(exercise =>
      exercise.name?.toLowerCase().includes(customExerciseSearch.toLowerCase()) ||
      exercise.category?.toLowerCase().includes(customExerciseSearch.toLowerCase()) ||
      exercise.muscle_group?.toLowerCase().includes(customExerciseSearch.toLowerCase())
    );
  }, [customExercises, customExerciseSearch]);

  // Add tag
  const addTag = () => {
    if (currentTag && !programPackage.tags.includes(currentTag) && programPackage.tags.length < 3) {
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

  // Edit Custom Exercise
  const executeEditCustomExercise = async () => {
    if (!editExerciseModal.name) return;

    try {
      const data = await APIClient.post(`${BACKEND_ROUTES_API}EditCustomExercise.php`, {
        exerciseId: editExerciseModal.exerciseId,
        name: editExerciseModal.name,
        category: editExerciseModal.category,
        muscle_group: editExerciseModal.muscle_group,
        equipment: editExerciseModal.equipment,
        instructions: editExerciseModal.instructions
      });

      if (data.success) {
        showToast('Exercise updated successfully!', 'success');
        setEditExerciseModal({ show: false, exerciseId: null, name: '', muscle_group: '', category: 'strength', equipment: '', instructions: '' });
        fetchExercises();
      } else {
        showToast(data.message || 'Could not update exercise', 'error');
      }
    } catch (err) {
      showToast('Error updating exercise: ' + err.message, 'error');
    }
  };

  // Delete Custom Exercise
  const executeDeleteCustomExercise = async () => {
    if (!deleteExerciseModal.exerciseId) return;

    try {
      const data = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteCustomExercise.php`, { 
        exerciseId: deleteExerciseModal.exerciseId 
      });

      if (data.success) {
        showToast('Exercise deleted successfully!', 'success');
        setDeleteExerciseModal({ show: false, exerciseId: null, exerciseName: '' });
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
      currency: 'EUR',
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
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: '#fff' }}>My Training Programs</h2>
          <p style={{ color: '#9ca3af' }}>Create, manage, and organize your training programs</p>
        </div>
        <button 
          className="btn text-nowrap"
          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
          onClick={() => {
            resetProgramForm();
            setActiveView('create');
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create New Program
        </button>
      </div>

      <div className="mb-4">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search programs by title, category..." 
          value={programSearch} 
          onChange={(e) => setProgramSearch(e.target.value)} 
          style={{ backgroundColor: '#1f1f1f', color: '#fff', border: '1px solid #333' }}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#10b981' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#6b7280' }}></i>
          <p className="mt-3" style={{ color: '#9ca3af' }}>No programs yet. Create your first training program!</p>
        </div>
      ) : (
        <div className="row">
          {programs.map(program => (
            <div key={program.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0" style={{ color: '#fff' }}>{program.title}</h5>
                    <span className={`badge bg-${program.status === 'published' ? 'success' : 'warning'}`}>
                      {program.status}
                    </span>
                  </div>
                  
                  <p className="text-muted small" style={{ color: '#9ca3af' }}>{program.description}</p>
                  
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>{categories[program.category] || program.category}</span>
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>{program.difficulty_level}</span>
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>{program.duration_weeks} weeks</span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="h5 mb-0" style={{ color: '#10b981' }}>€{program.price}</span>
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-sm"
                        onClick={() => editProgram(program)}
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm"
                        onClick={() => confirmDelete(program)}
                        style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', color: '#dc3545', border: '1px solid rgba(220, 53, 69, 0.3)' }}
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

      {totalPrograms > programsPerPage && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ backgroundColor: '#2d2d2d', color: '#10b981', border: '1px solid #333' }}
                >
                  Previous
                </button>
              </li>
              {[...Array(Math.ceil(totalPrograms / programsPerPage))].map((_, index) => (
                <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(index + 1)}
                    style={{ 
                      backgroundColor: currentPage === index + 1 ? '#10b981' : '#2d2d2d', 
                      color: currentPage === index + 1 ? '#fff' : '#10b981', 
                      border: '1px solid #333' 
                    }}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === Math.ceil(totalPrograms / programsPerPage) ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalPrograms / programsPerPage), prev + 1))}
                  style={{ backgroundColor: '#2d2d2d', color: '#10b981', border: '1px solid #333' }}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );

  const renderCreateView = () => (
    <div style={{ color: '#fff' }}>
      <style>{styles}</style>
      
      <button 
        className="btn mb-3"
        onClick={() => {
          resetProgramForm();
          setActiveView('list');
        }}
        style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back to Programs
      </button>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0" style={{ color: '#fff' }}>{editingProgramId ? 'Edit Program' : 'Create Training Program'}</h4>
      </div>

      <div className="row">
        {/* Left Column - Program Package Details */}
        <div className="col-12">
          {/* Program Package Information */}
          <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-header border-bottom" style={{ backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <h6 className="mb-0" style={{ color: '#fff' }}>Program Package Details</h6>
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
                  <label className="form-label">Price (EUR) *</label>
                  <input 
                    type="number" 
                    className="form-control number-input-light-arrows"
                    value={programPackage.price}
                    onChange={(e) => setProgramPackage(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                  />
                  <style dangerouslySetInnerHTML={{__html: `
                    .number-input-light-arrows::-webkit-inner-spin-button,
                    .number-input-light-arrows::-webkit-outer-spin-button {
                      opacity: 1;
                      filter: invert(1);
                    }
                  `}} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Short Description (Visible on Marketplace)</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={programPackage.description}
                  onChange={(e) => setProgramPackage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief program description to attract buyers..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Program Guide & Full Description</label>
                <textarea 
                  className="form-control"
                  rows="4"
                  value={programPackage.long_description}
                  onChange={(e) => setProgramPackage(prev => ({ ...prev, long_description: e.target.value }))}
                  placeholder="Detailed description, tips for success, usage instructions, benefits..."
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
                    className="form-control number-input-light-arrows"
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
                      placeholder={programPackage.tags.length >= 3 ? "Max 3 tags allowed" : "Add tags (press Enter)"}
                      disabled={programPackage.tags.length >= 3}
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={addTag}
                      disabled={programPackage.tags.length >= 3}
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
          <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-header border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <h6 className="mb-0" style={{ color: '#fff' }}>Workout Sessions ({workoutSessions.length})</h6>
              <small style={{ color: '#9ca3af' }}>Individual workouts in this program</small>
            </div>
            <div className="card-body">
              {workoutSessions.length === 0 ? (
                <p className="text-center py-3" style={{ color: '#9ca3af' }}>
                  No workout sessions added yet. Create one below!
                </p>
              ) : (
                <div className="list-group">
                  {workoutSessions.map((session, index) => (
                    <div key={index} style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '12px', borderRadius: '12px', padding: '16px' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-2" style={{ color: '#10b981', fontWeight: 'bold' }}>{session.name}</h6>
                          <p className="mb-2 small" style={{ color: '#9ca3af' }}>{session.description}</p>
                          <div className="d-flex gap-2">
                            <span className="badge" style={{ backgroundColor: '#000', color: '#fff', padding: '6px 12px', fontWeight: '600' }}>WEEK {session.week_number}</span>
                            <span className="badge" style={{ backgroundColor: '#000', color: '#fff', padding: '6px 12px', fontWeight: '600' }}>DAY {session.day_number}</span>
                            <span className="badge" style={{ backgroundColor: '#000', color: '#fff', padding: '6px 12px', fontWeight: '600' }}>{session.exercises.length} EXERCISES</span>
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm"
                            onClick={() => duplicateSession(index)}
                            title="Duplicate"
                            style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                          >
                            <i className="bi bi-files"></i>
                          </button>
                          <button 
                            className="btn btn-sm"
                            onClick={() => editSession(index)}
                            title="Edit"
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm"
                            onClick={() => deleteSession(index)}
                            title="Delete"
                            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
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
          <div className="card border-0 shadow-sm" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-header text-white" style={{ backgroundColor: '#10b981' }}>
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
              <h6 className="mb-3" style={{ color: '#fff' }}>Add Exercises to This Session</h6>
              <div className="mb-3">
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Search exercises by name, category, or muscle group..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                />
              </div>
              
              <p className="small mt-2" style={{ color: '#9ca3af' }}>
                Showing {filteredExercises.length} global exercises
              </p>
              
              <div className="exercise-list" style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
                <div className="row g-2 m-0">
                  {filteredExercises.map((exercise) => (
                    
                      <div key={`global-${exercise.id}`} className="col-md-6 mb-2">
                        <div 
                          className="card card-hover cursor-pointer"
                          onClick={() => addExerciseToSession(exercise)}
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                        >
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="fw-bold" style={{ color: '#fff' }}>{exercise.name}</small>
                                <br />
                                <small style={{ color: '#9ca3af' }}>
                                  {exercise.category} • {exercise.muscle_group}
                                </small>
                              </div>
                              <i className="bi bi-plus-circle" style={{ color: '#10b981' }}></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <hr style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }} />

              {/* My Custom Exercises */}
              <h6 className="mb-3" style={{ color: '#fff' }}>My Exercises ({customExercises.length})</h6>
              
              {customExercises.length > 0 && (
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Search my exercises by name, category, or muscle group..."
                    value={customExerciseSearch}
                    onChange={(e) => setCustomExerciseSearch(e.target.value)}
                  />
                  <p className="small mt-2" style={{ color: '#9ca3af' }}>
                    Showing {filteredCustomExercises.length} out of {customExercises.length} custom exercises
                  </p>
                </div>
              )}

              {customExercises.length === 0 ? (
                <p className="small" style={{ color: '#9ca3af' }}>No custom exercises yet. Create one above!</p>
              ) : filteredCustomExercises.length === 0 ? (
                <p className="small" style={{ color: '#9ca3af' }}>No custom exercises match your search.</p>
              ) : (
                <div className="exercise-list" style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
                  <div className="row g-2 m-0">
                    {filteredCustomExercises.map((exercise) => (
                      <div key={`custom-${exercise.id}`} className="col-md-6 mb-2">
                        <div className="card" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div 
                                className="flex-grow-1 cursor-pointer"
                                onClick={() => addExerciseToSession(exercise)}
                              >
                                <small className="fw-bold" style={{ color: '#fff' }}>{exercise.name}</small>
                                <br />
                                <small style={{ color: '#9ca3af' }}>
                                  {exercise.category} • {exercise.muscle_group}
                                </small>
                              </div>
                              <div className="d-flex gap-1" style={{ alignItems: 'center' }}>
                                <button
                                  className="btn btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addExerciseToSession(exercise);
                                  }}
                                  title="Add to session"
                                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                >
                                  <i className="bi bi-plus-circle"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditExerciseModal({
                                      show: true,
                                      exerciseId: exercise.id,
                                      name: exercise.name,
                                      category: exercise.category,
                                      muscle_group: exercise.muscle_group,
                                      equipment: exercise.equipment || '',
                                      instructions: exercise.instructions || ''
                                    });
                                  }}
                                  title="Edit exercise"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteExerciseModal({ show: true, exerciseId: exercise.id, exerciseName: exercise.name });
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
              <h6 className="mb-3" style={{ color: '#fff' }}>Create Your Own Exercise</h6>
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
                    style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: '600' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Session Preview and Add Session */}
          <div className="card border-0 shadow-sm mt-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-header border-bottom" style={{ backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <h6 className="mb-0" style={{ color: '#fff' }}>Current Session Preview</h6>
            </div>
            <div className="card-body">
              <h6 style={{ color: '#fff' }}>{currentSession.name || 'Untitled Session'}</h6>
              <p className="small" style={{ color: '#9ca3af' }}>{currentSession.description || 'No description'}</p>
              <div className="mb-3">
                <span className="badge me-1" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Week {currentSession.week_number}</span>
                <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Day {currentSession.day_number}</span>
              </div>
              
              {currentSession.exercises.length === 0 ? (
                <p className="small" style={{ color: '#9ca3af' }}>No exercises added yet</p>
              ) : (
                <div className="session-preview-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {currentSession.exercises.map((exercise, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#1a1a1a' }}>
                      <div>
                        <small className="fw-bold d-block" style={{ color: '#fff' }}>{exercise.name}</small>
                        <small style={{ color: '#9ca3af' }}>{exercise.sets} sets x {exercise.reps}</small>
                        {exercise.rpe && <small style={{ color: '#9ca3af' }}> • RPE {exercise.rpe}</small>}
                        <br />
                        <small style={{ color: '#9ca3af' }}>{exercise.muscle_group}</small>
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
                  className="btn flex-grow-1"
                  onClick={saveCurrentSession}
                  disabled={!currentSession.name || currentSession.exercises.length === 0}
                  style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  {isEditingSession ? 'Update Session' : 'Add Session'}
                </button>
                {isEditingSession && (
                  <button 
                    className="btn"
                    onClick={() => {
                      resetSessionForm();
                      setIsEditingSession(false);
                      setEditingSessionIndex(null);
                    }}
                    style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Save Program Button */}
          <div className="card border-0 shadow-sm mt-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-body">
              <button 
                className="btn w-100 btn-lg mb-2"
                onClick={saveProgram}
                disabled={!programPackage.title || (!editingProgramId && workoutSessions.length === 0)}
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
              >
                <i className="bi bi-save me-2"></i>
                {editingProgramId ? 'Update Program Package' : 'Create Program Package'}
              </button>
              <button 
                className="btn w-100"
                onClick={() => {
                  resetProgramForm();
                  setActiveView('list');
                }}
                style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
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
            <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="modal-header cf-dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h5 className="modal-title fw-bold" style={{ color: '#fff' }}>Add {selectedExercise?.name}</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowExerciseModal(false)}
                ></button>
              </div>
              <div className="modal-body" style={{ color: '#ffffff' }}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#d1d5db' }}>Sets *</label>
                  <input 
                    type="number" 
                    className="form-control"
                    
                    value={exerciseToAdd.sets}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#d1d5db' }}>Reps *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    
                    value={exerciseToAdd.reps}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, reps: e.target.value }))}
                    placeholder="e.g., 8-12 or 10"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#d1d5db' }}>RPE</label>
                  <input 
                    type="text" 
                    className="form-control"
                    
                    value={exerciseToAdd.rpe}
                    onChange={(e) => setExerciseToAdd(prev => ({ ...prev, rpe: e.target.value }))}
                    placeholder="e.g., 7-8"
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ backgroundColor: '#2d2d2d', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary text-white" 
                  onClick={() => setShowExerciseModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn"
                  style={{ backgroundColor: '#10b981', color: '#fff', border: '1px solid #10b981' }}
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
      <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#fff' }}>
        {activeView === 'list' && renderListView()}
        {activeView === 'create' && renderCreateView()}
      
        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div className="modal-header cf-dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h5 className="modal-title fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                  Confirm Delete
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setDeleteModal({ show: false, programId: null, programTitle: '' })}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Are you sure you want to delete <strong>"{deleteModal.programTitle}"</strong>?</p>
                <p className="small mt-2 mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>This action cannot be undone.</p>
              </div>
              <div className="modal-footer" style={{ backgroundColor: '#2d2d2d', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary text-white" 
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

      {/* Edit Custom Exercise Modal */}
      {editExerciseModal.show && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div className="modal-header cf-dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h5 className="modal-title fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <i className="bi bi-pencil me-2 text-warning"></i>
                Edit Custom Exercise
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setEditExerciseModal({ show: false, exerciseId: null, name: '', muscle_group: '', category: 'strength', equipment: '', instructions: '' })}
              ></button>
            </div>
            <div className="modal-body" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <div className="mb-3">
                <label className="form-label text-white">Exercise Name *</label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #3d3d3d', color: '#fff' }}
                  value={editExerciseModal.name}
                  onChange={(e) => setEditExerciseModal(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-white">Category</label>
                <select 
                  className="form-select"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #3d3d3d', color: '#fff' }}
                  value={editExerciseModal.category}
                  onChange={(e) => setEditExerciseModal(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="core">Core</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label text-white">Muscle Group</label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #3d3d3d', color: '#fff' }}
                  value={editExerciseModal.muscle_group}
                  onChange={(e) => setEditExerciseModal(prev => ({ ...prev, muscle_group: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ backgroundColor: '#2d2d2d', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <button 
                type="button" 
                className="btn btn-outline-secondary text-white" 
                onClick={() => setEditExerciseModal({ show: false, exerciseId: null, name: '', muscle_group: '', category: 'strength', equipment: '', instructions: '' })}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-warning text-dark fw-bold" 
                onClick={executeEditCustomExercise}
                disabled={!editExerciseModal.name}
              >
                <i className="bi bi-save me-2"></i>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Delete Custom Exercise Confirmation Modal */}
      {deleteExerciseModal.show && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div className="modal-header cf-dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h5 className="modal-title fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                Confirm Delete Exercise
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setDeleteExerciseModal({ show: false, exerciseId: null, exerciseName: '' })}
              ></button>
            </div>
            <div className="modal-body">
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Are you sure you want to delete <strong>"{deleteExerciseModal.exerciseName}"</strong>?</p>
              <p className="small mt-2 mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>This action cannot be undone and will permanently remove this exercise.</p>
            </div>
            <div className="modal-footer" style={{ backgroundColor: '#2d2d2d', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <button 
                type="button" 
                className="btn btn-outline-secondary text-white" 
                onClick={() => setDeleteExerciseModal({ show: false, exerciseId: null, exerciseName: '' })}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={executeDeleteCustomExercise}
              >
                <i className="bi bi-trash me-2"></i>
                Delete Exercise
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Bootstrap Toast Notification */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
          <div className="toast show" role="alert" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="toast-header text-white" style={{ backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#dc3545' : '#fbbf24', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <strong className="me-auto">
                {toast.type === 'success' ? '✓ Success' : toast.type === 'error' ? '✕ Error' : '⚠ Warning'}
              </strong>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
              ></button>
            </div>
            <div className="toast-body" style={{ color: '#fff' }}>{toast.message}</div>
          </div>
        </div>
      )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default CreatePrograms;
