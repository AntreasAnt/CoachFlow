import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import TraineeDashboard from '../../../components/TraineeDashboard';
import CreateWorkoutProgram from './CreateWorkoutProgram';

const MyWorkouts = ({ embedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Workout history date-window helpers (Meals-style)
  const todayStr = new Date().toISOString().split('T')[0];
  const dateToStr = (d) => d.toISOString().split('T')[0];
  const addDays = (dateStr, delta) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + delta);
    return dateToStr(d);
  };
  const formatYmdShort = (ymd) => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return localDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const [activeView, setActiveView] = useState('plans'); // plans, create, log
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [purchasedPrograms, setPurchasedPrograms] = useState([]);
  const [hiddenPurchasedPrograms, setHiddenPurchasedPrograms] = useState([]);
  const [trainerAssignedPrograms, setTrainerAssignedPrograms] = useState([]);
  const [assignedProgramsLoading, setAssignedProgramsLoading] = useState(false);
  const [plansTab, setPlansTab] = useState('my'); // my | premium | coach
  const [myPlansPagination, setMyPlansPagination] = useState({ page: 1, limit: 6, total: 0, has_more: false });
  const [myPlansLoading, setMyPlansLoading] = useState(false);
  const [purchasedPagination, setPurchasedPagination] = useState({ page: 1, limit: 6, total: 0, has_more: false });
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [assignedPagination, setAssignedPagination] = useState({ page: 1, limit: 6, total: 0, has_more: false });
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allExercises, setAllExercises] = useState([]);
  const [premadeWorkoutPlans, setPremadeWorkoutPlans] = useState([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Program Package (container for workout sessions)
  const [programPackage, setProgramPackage] = useState({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    duration_weeks: 4,
    category: 'Strength'
  });
  
  // Workout Sessions (individual workouts inside the program)
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
  
  // Search and filter states
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState({
    startDate: addDays(todayStr, -6),
    endDate: todayStr,
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
  const [showEndWorkoutModal, setShowEndWorkoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBreakOverModal, setShowBreakOverModal] = useState(false);
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
  const didInitialLoadRef = useRef(false);

  useEffect(() => {
    // Check if we're coming from ProgramView with workout data to start
    if (location.state?.startWorkout && location.state?.workoutData) {
      console.log('Starting workout from location state:', location.state.workoutData);
      setActiveWorkout(location.state.workoutData);
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      setWorkoutLogs([]);
      setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
      setWorkoutTimer(0);
      setIsWorkoutTimerRunning(true);
      setActiveView('log');
      
      // Clear the location state so it doesn't restart on refresh
      window.history.replaceState({}, document.title);
      // We purposefully DO NOT return here, so that initial data still loads!
    }

    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;

    fetchWorkoutData();
    initDefaultPlansTab();
  }, [location.state]);

  const initDefaultPlansTab = async () => {
    try {
      const coachResp = await APIClient.get(`${BACKEND_ROUTES_API}GetMyCoach.php`);
      const hasCoach = Boolean(coachResp?.success && coachResp?.has_coach);

      if (hasCoach) {
        setPlansTab('coach');
        // Preload the coach tab so it's immediately populated.
        loadTrainerAssignedPrograms({ page: 1, replace: true });
      } else {
        setPlansTab('my');
        loadMyWorkoutPlans({ page: 1, replace: true });
      }
    } catch (e) {
      console.error('Error determining default plans tab', e);
      setPlansTab('my');
      loadMyWorkoutPlans({ page: 1, replace: true });
    }
  };

  useEffect(() => {
    // Lazy-load tab content when user switches tabs
    if (plansTab === 'my' && workoutPlans.length === 0 && !myPlansLoading) {
      loadMyWorkoutPlans({ page: 1, replace: true });
    }
    if (plansTab === 'premium' && purchasedPrograms.length === 0 && !purchasedLoading) {
      loadPurchasedPrograms({ page: 1, replace: true });
    }
    if (plansTab === 'coach' && trainerAssignedPrograms.length === 0 && !assignedProgramsLoading) {
      loadTrainerAssignedPrograms({ page: 1, replace: true });
    }
    if (plansTab === 'premium' && premadeWorkoutPlans.length === 0 && !marketplaceLoading) {
      loadMarketplacePrograms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plansTab]);

  useEffect(() => {
    // The create screen shows a small marketplace teaser; load it only when needed.
    if (activeView === 'create' && premadeWorkoutPlans.length === 0 && !marketplaceLoading) {
      loadMarketplacePrograms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  useEffect(() => {
    fetchRecentSessions(historyFilter.startDate, historyFilter.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyFilter.startDate, historyFilter.endDate]);

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
            setShowBreakOverModal(true);
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

      // Keep this call lightweight for faster loading (plans are fetched separately with pagination)
      const data = await APIClient.get(
        `${BACKEND_ROUTES_API}GetWorkoutData.php?include_plans=0&include_premium_plans=0&include_personal_records=0`
      );

      if (data.success) {
        // initial recent sessions come from GetWorkoutData
        setWorkoutHistory(data.recentSessions || []);
        setAllExercises(data.exercises || []);
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

  const loadMarketplacePrograms = async () => {
    try {
      setMarketplaceLoading(true);
      const marketplaceData = await APIClient.get(
        `${BACKEND_ROUTES_API}GetPrograms.php?type=marketplace&limit=6&sort_by=popular`
      );
      if (marketplaceData.success) {
        setPremadeWorkoutPlans(marketplaceData.programs || []);
      }
    } catch (e) {
      console.error('Error loading marketplace programs', e);
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const loadMyWorkoutPlans = async ({ page = 1, replace = false } = {}) => {
    try {
      setMyPlansLoading(true);
      const limit = myPlansPagination.limit || 6;
      const resp = await APIClient.get(
        `${BACKEND_ROUTES_API}GetUserWorkoutPlans.php?page=${page}&limit=${limit}&include_details=0`
      );
      if (resp.success) {
        setWorkoutPlans(prev => (replace ? (resp.plans || []) : [...prev, ...(resp.plans || [])]));
        if (resp.pagination) {
          setMyPlansPagination(resp.pagination);
        }
      }
    } catch (e) {
      console.error('Error loading paged workout plans', e);
    } finally {
      setMyPlansLoading(false);
    }
  };

  const loadPurchasedPrograms = async ({ page = 1, replace = false } = {}) => {
    try {
      setPurchasedLoading(true);
      const limit = purchasedPagination.limit || 6;
      const resp = await APIClient.get(`${BACKEND_ROUTES_API}GetPurchasedPrograms.php?page=${page}&limit=${limit}`);
      if (resp.success) {
        setPurchasedPrograms(prev => (replace ? (resp.purchases || []) : [...prev, ...(resp.purchases || [])]));
        setHiddenPurchasedPrograms(resp.hiddenPurchases || []);
        if (resp.purchasesPagination) {
          setPurchasedPagination(resp.purchasesPagination);
        }
      }
    } catch (e) {
      console.error('Error loading paged purchased programs', e);
    } finally {
      setPurchasedLoading(false);
    }
  };

  const loadTrainerAssignedPrograms = async ({ page = 1, replace = false } = {}) => {
    setAssignedProgramsLoading(true);
    try {
      const limit = assignedPagination.limit || 6;
      const resp = await APIClient.get(`${BACKEND_ROUTES_API}GetMyAssignedPrograms.php?page=${page}&limit=${limit}`);
      if (resp.success && resp.programs) {
        setTrainerAssignedPrograms(prev => (replace ? resp.programs : [...prev, ...resp.programs]));
        if (resp.pagination) {
          setAssignedPagination(resp.pagination);
        }
      } else {
        if (replace) setTrainerAssignedPrograms([]);
      }
    } catch (error) {
      console.error('Error loading trainer assigned programs:', error);
      if (replace) setTrainerAssignedPrograms([]);
    }
    setAssignedProgramsLoading(false);
  };

  const ensureUserPlanDetails = async (plan) => {
    if (plan?.exercises?.length || plan?.sessions?.length) return plan;
    const resp = await APIClient.get(`${BACKEND_ROUTES_API}GetUserWorkoutPlan.php?planId=${encodeURIComponent(plan.id)}`);
    if (resp.success && resp.plan) return resp.plan;
    throw new Error(resp.message || 'Failed to load plan details');
  };

  const fetchRecentSessions = async (startDate, endDate) => {
    try {
      setHistoryLoading(true);
      const resp = await APIClient.get(
        `${BACKEND_ROUTES_API}GetRecentWorkouts.php?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );
      if (resp.success) {
        setWorkoutHistory(resp.sessions || []);
      }
    } catch (e) {
      console.error('Error fetching paged sessions', e);
    } finally {
      setHistoryLoading(false);
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

    // Backend already returns sessions in the selected date range
    
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

  const canGoNewer = new Date(historyFilter.endDate) < new Date(todayStr);
  const goOlder = () => {
    const rangeDays = Math.max(
      1,
      Math.round((new Date(historyFilter.endDate) - new Date(historyFilter.startDate)) / (1000 * 60 * 60 * 24)) + 1
    );
    const newEnd = addDays(historyFilter.startDate, -1);
    const newStart = addDays(newEnd, -(rangeDays - 1));
    setHistoryFilter((prev) => ({ ...prev, startDate: newStart, endDate: newEnd }));
  };
  const goNewer = () => {
    if (!canGoNewer) return;
    const rangeDays = Math.max(
      1,
      Math.round((new Date(historyFilter.endDate) - new Date(historyFilter.startDate)) / (1000 * 60 * 60 * 24)) + 1
    );
    const newStart = addDays(historyFilter.endDate, 1);
    let newEnd = addDays(newStart, rangeDays - 1);
    if (new Date(newEnd) > new Date(todayStr)) newEnd = todayStr;
    setHistoryFilter((prev) => ({ ...prev, startDate: newStart, endDate: newEnd }));
  };

  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    exercises: []
  });
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

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
      console.log('deletePlan called with:', { planId, planToDelete });
      
      // Check if this is a purchased program
      if (planToDelete?.isPurchased) {
        console.log('Deleting purchased program:', planId);
        
        // Hide purchase (soft delete)
        const data = await APIClient.delete(`${BACKEND_ROUTES_API}DeletePurchase.php`, {
          programId: planId
        });

        if (data.success) {
          setPurchasedPrograms(prev => prev.filter(p => p.program_id !== planId));
          setShowDeleteModal(false);
          setPlanToDelete(null);
          setSuccessMessage('Program hidden from your library');
          setShowSuccessModal(true);
          // Refresh to update lists
          fetchWorkoutData();
        }
      } else {
        // Delete user's own workout plan
        const data = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteWorkoutPlan.php`, {
          planId: planId
        });

        if (data.success) {
          setWorkoutPlans(prev => prev.filter(plan => plan.id !== planId));
          setShowDeleteModal(false);
          setPlanToDelete(null);
        }
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

  const restorePurchasedProgram = async (program) => {
    try {
      const data = await APIClient.post(`${BACKEND_ROUTES_API}RestorePurchase.php`, {
        programId: program.program_id
      });

      if (data.success) {
        setHiddenPurchasedPrograms(prev => prev.filter(p => p.program_id !== program.program_id));
        setPurchasedPrograms(prev => [program, ...prev]);
        setSuccessMessage('Program restored to My Plans');
        setShowSuccessModal(true);
        // Refresh the premium tab list if it’s loaded
        loadPurchasedPrograms({ page: 1, replace: true });
      }
    } catch (error) {
      console.error('Error restoring purchased program:', error);
    }
  };

  const startWorkout = async (plan) => {
    try {
      console.log('Starting workout with plan:', plan);
      const fullPlan = await ensureUserPlanDetails(plan);

      const workoutData = {
        ...fullPlan,
        startTime: new Date(),
        completedSets: (fullPlan.exercises || []).map(ex => 
          Array.from({ length: parseInt(ex.sets) || 3 }, () => ({
            weight: 0,
            reps: 0,
            rpe: 0,
            notes: '',
            completed: false
          }))
        )
      };

      console.log('Active workout data structure:', workoutData);
      setActiveWorkout(workoutData);
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      setWorkoutLogs([]);
      setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
      setWorkoutTimer(0);
      setIsWorkoutTimerRunning(true);
      setActiveView('log');
    } catch (e) {
      console.error('Failed to start workout', e);
      alert(e.message || 'Failed to start workout');
    }
  };

  const completeSet = () => {
    console.log('Complete set called');
    if (!activeWorkout || !currentSetData.reps) {
      alert('Please enter the number of reps completed');
      return;
    }

    // Create completely isolated deep copies for state safety
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.completedSets = activeWorkout.completedSets.map((exSets, exIdx) => {
      if (exIdx !== currentExerciseIndex) return exSets;
      return exSets.map((set, setIdx) => {
        if (setIdx !== currentSetIndex) return set;
        return {
          ...currentSetData,
          weight: parseFloat(currentSetData.weight) || 0,
          reps: parseInt(currentSetData.reps) || 0,
          rpe: parseInt(currentSetData.rpe) || 0,
          completed: true
        };
      });
    });

    setActiveWorkout(updatedWorkout);

    // Add to workout logs
    const logEntry = {
      exerciseIndex: currentExerciseIndex,
      exerciseName: activeWorkout.exercises[currentExerciseIndex]?.name || activeWorkout.exercises[currentExerciseIndex]?.exercise_name || 'Unknown Exercise',
      setNumber: currentSetIndex + 1,
      weight: parseFloat(currentSetData.weight) || 0,
      reps: parseInt(currentSetData.reps) || 0,
      rpe: parseInt(currentSetData.rpe) || 0,
      notes: currentSetData.notes
    };

    setWorkoutLogs(prev => {
      const existingIndex = prev.findIndex(log => log.exerciseIndex === currentExerciseIndex && log.setNumber === currentSetIndex + 1);
      if (existingIndex >= 0) {
         const newLogs = [...prev];
         newLogs[existingIndex] = logEntry;
         return newLogs;
      }
      return [...prev, logEntry];
    });

    // Reset current set data or load next if available
    const currentExercise = activeWorkout.exercises[currentExerciseIndex];
    const totalSets = parseInt(currentExercise.sets) || 3;

    console.log('Exercise progress:', {
      currentExerciseIndex,
      currentSetIndex,
      totalExercises: activeWorkout.exercises.length,
      setsInCurrentExercise: totalSets
    });

    // Find next uncompleted set in current exercise
    let nextUncompletedSetIndex = -1;
    for (let i = 0; i < totalSets; i++) {
      if (!updatedWorkout.completedSets[currentExerciseIndex][i].completed) {
        nextUncompletedSetIndex = i;
        break;
      }
    }

    if (nextUncompletedSetIndex !== -1) {
      // Move to next uncompleted set
      console.log('Moving to next uncompleted set:', nextUncompletedSetIndex);
      setCurrentSetIndex(nextUncompletedSetIndex);
      
      const setData = updatedWorkout.completedSets[currentExerciseIndex][nextUncompletedSetIndex];
      setCurrentSetData({
         weight: setData?.completed ? setData.weight : '',
         reps: setData?.completed ? setData.reps : '',
         rpe: setData?.completed ? setData.rpe || '' : '',
         notes: setData?.completed ? setData.notes || '' : ''
      });
    } else {
      // All sets completed in this exercise
      if (currentExerciseIndex >= activeWorkout.exercises.length - 1) {
        // This is the last exercise - auto finish workout
        console.log('Auto-finishing workout');
        setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
        setTimeout(() => {
          setShowFinishWorkoutModal(true);
        }, 1000); // Small delay to show completion
      } else {
        // Move to next exercise
        console.log('Moving to next exercise');
        nextExercise();
      }
    }

    // Start break timer
    startBreakTimer();
  };

  const nextExercise = () => {
    setCurrentExerciseIndex(prevIndex => {
      if (prevIndex < activeWorkout.exercises.length - 1) {
        // Find the next exercise that has sets
        return prevIndex + 1;
      }
      return prevIndex;
    });
    setCurrentSetIndex(0);
    setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
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
        let data;
        if (isEditMode) {
          // Update existing plan
          const updateData = { ...newPlan, id: editingPlanId };
          data = await APIClient.put(`${BACKEND_ROUTES_API}UpdateWorkoutPlan.php`, updateData);
        } else {
          // Create new plan
          data = await APIClient.post(`${BACKEND_ROUTES_API}CreateWorkoutPlan.php`, newPlan);
        }

        if (data.success) {
          fetchWorkoutData(); // Refresh the data
          resetPlanForm();
          setActiveView('plans');
        }
      } catch (err) {
        console.error('Error saving plan:', err);
      }
    }
  };

  const resetPlanForm = () => {
    setNewPlan({ name: '', description: '', exercises: [] });
    setIsEditMode(false);
    setEditingPlanId(null);
  };

  // Handle saving program package with sessions (new session-based approach)
  const handleSaveProgram = async (programData) => {
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}CreateWorkoutProgram.php`, {
        title: programData.title,
        description: programData.description,
        difficulty_level: programData.difficulty_level,
        duration_weeks: programData.duration_weeks,
        category: programData.category,
        sessions: programData.sessions
      });

      if (response.success) {
        fetchWorkoutData(); // Refresh the data
        loadMyWorkoutPlans({ page: 1, replace: true }); // Refresh the plans list
        setActiveView('plans');
        setSuccessMessage('Program created successfully!');
        setShowSuccessModal(true);
      } else {
        alert('Failed to create program: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving program:', err);
      alert('Error creating program');
    }
  };

  // Handle adding custom exercise
  const handleAddCustomExercise = async (exerciseData) => {
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}CreateCustomExercise.php`, exerciseData);
      
      if (response.success) {
        // Refresh exercises list
        const updatedExercises = await APIClient.get(`${BACKEND_ROUTES_API}GetExercises.php`);
        if (updatedExercises.exercises) {
          setAllExercises(updatedExercises.exercises);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding custom exercise:', err);
      return false;
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
      console.log('Fetching workout details for ID:', workoutId);
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetWorkoutDetails.php?sessionId=${workoutId}`);
      console.log('Received data:', data);

      if (data.success) {
        console.log('Setting workout details:', data.workoutDetails);
        setSelectedWorkoutDetails(data.workoutDetails);
        setShowWorkoutDetails(true);
        console.log('Modal should now be visible');
      } else {
        console.error('API returned error:', data.message);
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
    setIsBreakTimerRunning(false);
    setBreakTimer(0);
    setShowBreakOverModal(false);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setWorkoutLogs([]);
    setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
    setShowCancelWorkoutModal(false);
    setActiveView('plans');
  };

  // End workout early function (saves current progress)
  const endWorkoutEarly = async () => {
    console.log('End workout early called');
    console.log('Active workout object:', activeWorkout);
    
    if (!activeWorkout) {
      alert('No active workout found');
      return;
    }

    if (!activeWorkout.id || !activeWorkout.name) {
      alert('Invalid workout data');
      console.error('Active workout missing required fields:', activeWorkout);
      return;
    }
    
    const duration = Math.max(1, Math.floor(workoutTimer / 60)); // Ensure at least 1 minute
    
    // For program workouts (with programId), use null since they don't have user_workout_plan entries
    // For regular workout plans, use the plan ID
    const workoutPlanId = activeWorkout.programId ? null : activeWorkout.id;
    
    const requestData = {
      workoutPlanId: workoutPlanId,
      planName: activeWorkout.name,
      duration: duration,
      isEndedEarly: true
    };

    console.log('Request data for SaveWorkoutSession (early end):', requestData);
    console.log('Request data stringified:', JSON.stringify(requestData));
    console.log('Request data types:', {
      workoutPlanId: typeof requestData.workoutPlanId,
      planName: typeof requestData.planName,
      duration: typeof requestData.duration
    });
    
    try {
      // Step 1: Save workout session
      const sessionData = await APIClient.post(`${BACKEND_ROUTES_API}SaveWorkoutSession.php`, requestData);

      console.log('End workout early - save session response:', sessionData);

      if (sessionData.success && sessionData.sessionId) {
        // Step 2: Save workout logs if there are any
        if (workoutLogs.length > 0) {
          const logsData = await APIClient.post(`${BACKEND_ROUTES_API}SaveWorkoutLogs.php`, {
            sessionId: sessionData.sessionId,
            logs: workoutLogs
          });

          console.log('End workout early - save logs response:', logsData);

          if (!logsData.success) {
            console.error('Failed to save workout logs:', logsData.message);
            alert('Workout saved but failed to save exercise logs: ' + (logsData.message || 'Unknown error'));
            return;
          }
        }

        setSuccessMessage('Workout ended and progress saved!');
        setShowSuccessModal(true);
        
        // Reset workout state
        setActiveWorkout(null);
        setIsWorkoutTimerRunning(false);
        setWorkoutTimer(0);
        setIsBreakTimerRunning(false);
        setBreakTimer(0);
        setShowBreakOverModal(false);
        setCurrentExerciseIndex(0);
        setCurrentSetIndex(0);
        setWorkoutLogs([]);
        setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
        setActiveView('plans');
        
        // Refresh data
        fetchWorkoutData();
      } else {
        console.error('Failed to end workout early:', sessionData.message);
        alert('Failed to save workout: ' + (sessionData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error ending workout:', err);
      alert('Error ending workout: ' + err.message);
    }
  };

  // Finish workout function (complete workout)
  const finishWorkout = async () => {
    console.log('Finish workout called');
    console.log('Active workout object:', activeWorkout);
    console.log('Workout timer:', workoutTimer);
    
    if (!activeWorkout) {
      alert('No active workout found');
      return;
    }

    if (!activeWorkout.id) {
      alert('Invalid workout ID');
      console.error('Active workout missing ID:', activeWorkout);
      return;
    }

    if (!activeWorkout.name) {
      alert('Invalid workout name');
      console.error('Active workout missing name:', activeWorkout);
      return;
    }
    
    const duration = Math.max(1, Math.floor(workoutTimer / 60)); // Ensure at least 1 minute
    
    // For program workouts (with programId), use null since they don't have user_workout_plan entries
    // For regular workout plans, use the plan ID
    const workoutPlanId = activeWorkout.programId ? null : activeWorkout.id;
    
    const requestData = {
      workoutPlanId: workoutPlanId,
      planName: activeWorkout.name,
      duration: duration
    };

    console.log('Request data for SaveWorkoutSession:', requestData);
    console.log('Request data stringified:', JSON.stringify(requestData));
    console.log('Request data types:', {
      workoutPlanId: typeof requestData.workoutPlanId,
      planName: typeof requestData.planName,
      duration: typeof requestData.duration
    });

    try {
      // Step 1: Save workout session
      const sessionData = await APIClient.post(`${BACKEND_ROUTES_API}SaveWorkoutSession.php`, requestData);

      console.log('Save session response:', sessionData);

      if (sessionData.success && sessionData.sessionId) {
        // Step 2: Save workout logs if there are any
        if (workoutLogs.length > 0) {
          const logsData = await APIClient.post(`${BACKEND_ROUTES_API}SaveWorkoutLogs.php`, {
            sessionId: sessionData.sessionId,
            logs: workoutLogs
          });

          console.log('Save logs response:', logsData);

          if (!logsData.success) {
            console.error('Failed to save workout logs:', logsData.message);
            alert('Workout saved but failed to save exercise logs: ' + (logsData.message || 'Unknown error'));
            return;
          }
        }

        setSuccessMessage('Workout completed successfully!');
        setShowSuccessModal(true);
        setShowFinishWorkoutModal(false);
        
        // Reset workout state
        setActiveWorkout(null);
        setIsWorkoutTimerRunning(false);
        setWorkoutTimer(0);
        setIsBreakTimerRunning(false);
        setBreakTimer(0);
        setShowBreakOverModal(false);
        setCurrentExerciseIndex(0);
        setCurrentSetIndex(0);
        setWorkoutLogs([]);
        setCurrentSetData({ weight: '', reps: '', rpe: '', notes: '' });
        setActiveView('plans');
        
        // Refresh data
        fetchWorkoutData();
      } else {
        console.error('Failed to save workout session:', sessionData.message);
        alert('Failed to save workout: ' + (sessionData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error finishing workout:', err);
      alert('Error finishing workout: ' + err.message);
    }
  };

  const renderPlansView = () => (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="h5 mb-0 fw-bold" style={{ color: '#ffffff' }}>My Workout Plans</h2>
          <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Your training programs and workouts</p>
        </div>
        {plansTab === 'my' && (
          <button 
            className="btn rounded-pill px-4 align-self-start align-self-sm-center text-nowrap"
            onClick={() => {
              resetPlanForm();
              setActiveView('create');
            }}
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--brand-dark)',
              border: 'none',
              fontWeight: '600'
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Plan
          </button>
        )}
      </div>

      {/* Plans Tabs */}
      <ul className="nav nav-pills mb-4" style={{ gap: '0.5rem' }}>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill ${plansTab === 'my' ? 'active' : ''}`}
            onClick={() => setPlansTab('my')}
            style={{
              backgroundColor: plansTab === 'my' ? 'var(--brand-primary)' : 'rgba(32, 214, 87, 0.08)',
              color: plansTab === 'my' ? 'var(--brand-dark)' : 'var(--brand-white)',
              border: '1px solid rgba(32, 214, 87, 0.25)',
              fontWeight: 600
            }}
          >
            My Workout Plans
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill ${plansTab === 'premium' ? 'active' : ''}`}
            onClick={() => setPlansTab('premium')}
            style={{
              backgroundColor: plansTab === 'premium' ? 'var(--brand-primary)' : 'rgba(32, 214, 87, 0.08)',
              color: plansTab === 'premium' ? 'var(--brand-dark)' : 'var(--brand-white)',
              border: '1px solid rgba(32, 214, 87, 0.25)',
              fontWeight: 600
            }}
          >
            Premium (Bought)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill ${plansTab === 'coach' ? 'active' : ''}`}
            onClick={() => setPlansTab('coach')}
            style={{
              backgroundColor: plansTab === 'coach' ? 'var(--brand-primary)' : 'rgba(32, 214, 87, 0.08)',
              color: plansTab === 'coach' ? 'var(--brand-dark)' : 'var(--brand-white)',
              border: '1px solid rgba(32, 214, 87, 0.25)',
              fontWeight: 600
            }}
          >
            By Coach
          </button>
        </li>
      </ul>

      {/* Trainer Assigned Programs */}
      {plansTab === 'coach' && (
        <div 
          className="card border-0 rounded-4 mb-4"
          style={{
            backgroundColor: 'rgba(15, 20, 15, 0.6)',
            border: '1px solid rgba(32, 214, 87, 0.3)',
            boxShadow: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(32, 214, 87, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="card-header border-0" style={{ backgroundColor: '#000000 !important', background: '#000000 !important', borderBottom: '1px solid rgba(32, 214, 87, 0.2)', padding: '1.25rem', borderRadius: '1rem 1rem 0 0', backdropFilter: 'none' }}>
            <div className="d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-center gap-3">
              <div>
                <h5 className="mb-1" style={{ color: '#ffffff', fontWeight: '700' }}>
                  <i className="bi bi-person-check me-2" style={{ color: 'var(--brand-primary)' }}></i>
                  Your Trainer's Workout Programs
                </h5>
                <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Follow these programs for best results • Continue using your own plans below</small>
              </div>
              <span className="badge rounded-pill text-uppercase" style={{ backgroundColor: 'rgba(32, 214, 87, 0.2)', color: 'var(--brand-primary)', padding: '0.5rem 1rem', width: 'fit-content' }}>Priority Programs</span>
            </div>
          </div>
          <div className="card-body">
            {assignedProgramsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status" style={{ color: 'var(--brand-primary)' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Loading assigned programs...</p>
              </div>
            ) : trainerAssignedPrograms.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-person-check fs-1" style={{ color: 'var(--text-secondary)' }}></i>
                <p className="mt-2 mb-0" style={{ color: 'var(--text-secondary)' }}>No coach programs assigned yet.</p>
              </div>
            ) : (
              <>
                <div className="row">
                  {trainerAssignedPrograms.map(program => (
                    <div key={`assigned-${program.assignment_id}`} className="col-lg-6 mb-3">
                      <div 
                        className="card rounded-4 h-100" 
                        style={{ 
                          backgroundColor: 'rgba(15, 20, 15, 0.6)',
                          border: '2px solid var(--brand-primary)',
                          boxShadow: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(32, 214, 87, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="card-body p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h5 className="card-title" style={{ color: '#ffffff', fontWeight: '600' }}>{program.title}</h5>
                            <span className="badge rounded-pill" style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-dark)' }}>
                              <i className="bi bi-star me-1"></i>
                              Trainer Assigned
                            </span>
                          </div>
                          
                          <div className="mb-2">
                            <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: '#ffffff' }}>{program.difficulty_level}</span>
                            <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: '#ffffff' }}>{program.duration_weeks}w</span>
                            <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: '#ffffff' }}>{program.category}</span>
                          </div>

                          <div className="mb-3">
                            <small style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Description:</small>
                            <p className="small mb-0 mt-1" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{program.description || 'No description available'}</p>
                          </div>

                          <div className="mb-3">
                            <small style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Assigned by: <strong style={{ color: 'var(--brand-primary)' }}>{program.trainer_name}</strong> on {program.assigned_at_formatted}
                            </small>
                          </div>

                          <div className="d-flex gap-2">
                            <button 
                              className="btn rounded-pill flex-fill"
                              onClick={() => navigate(`/trainee-dashboard/program/${program.id}`, { 
                                state: { 
                                  programData: program,
                                  fromAssigned: true
                                } 
                              })}
                              style={{
                                backgroundColor: 'var(--brand-primary)',
                                color: 'var(--brand-dark)',
                                border: 'none',
                                fontWeight: '600'
                              }}
                            >
                              <i className="bi bi-play-fill me-1"></i>
                              Start Program
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {assignedPagination?.has_more && (
                  <div className="d-flex justify-content-center pt-2">
                    <button
                      className="btn rounded-pill px-4"
                      disabled={assignedProgramsLoading}
                      onClick={() => loadTrainerAssignedPrograms({ page: (assignedPagination.page || 1) + 1, replace: false })}
                      style={{
                        backgroundColor: 'rgba(32, 214, 87, 0.1)',
                        color: 'var(--brand-primary)',
                        border: '1px solid rgba(32, 214, 87, 0.3)',
                        fontWeight: 600
                      }}
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Workout Plans Grid */}
      <div className="row">
        {plansTab === 'premium' && purchasedLoading && purchasedPrograms.length === 0 && hiddenPurchasedPrograms.length === 0 && (
          <div className="col-12">
            <div className="text-center py-4">
              <div className="spinner-border" role="status" style={{ color: 'var(--brand-primary)' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Loading purchased programs...</p>
            </div>
          </div>
        )}

        {plansTab === 'premium' && !purchasedLoading && purchasedPrograms.length === 0 && hiddenPurchasedPrograms.length === 0 && (
          <div className="col-12">
            <div className="text-center py-4">
              <i className="bi bi-bag-check fs-1" style={{ color: 'var(--text-secondary)' }}></i>
              <p className="mt-2 mb-0" style={{ color: 'var(--text-secondary)' }}>No purchased programs yet.</p>
            </div>
          </div>
        )}

        {plansTab === 'premium' && purchasedPrograms.map(program => (
          <div key={`purchased-${program.program_id}`} className="col-lg-6 mb-3">
            <div 
              className="card border-0 rounded-4 h-100" 
              style={{ 
                backgroundColor: 'rgba(15, 20, 15, 0.6)',
                border: '1px solid rgba(32, 214, 87, 0.3)',
                boxShadow: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(32, 214, 87, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(32, 214, 87, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>{program.title}</h5>
                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.2)', color: 'var(--brand-primary)', padding: '0.5rem 1rem' }}>
                    <i className="bi bi-bag-check me-1"></i>
                    Purchased
                  </span>
                </div>
                
                <div className="mb-2">
                  <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>{program.difficulty_level}</span>
                  <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>{program.duration_weeks}w</span>
                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>{program.category}</span>
                </div>

                <div className="mb-3">
                  <small style={{ color: 'var(--text-secondary)' }}>Description:</small>
                  <p className="small mb-0 mt-1" style={{ color: 'var(--text-primary)' }}>{program.description || 'No description available'}</p>
                </div>

                <div className="mb-3">
                  <small style={{ color: 'var(--text-secondary)' }}>By: <strong style={{ color: 'var(--brand-primary)' }}>{program.trainer_name}</strong></small>
                </div>

                <div className="d-flex gap-2">
                  <button 
                    className="btn rounded-pill flex-fill"
                    onClick={() => navigate(`/trainee-dashboard/program/${program.program_id}`)}
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--brand-dark)',
                      border: 'none',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-play-circle me-2"></i>
                    Start Program
                  </button>
                  <button 
                    className="btn rounded-pill"
                    onClick={() => {
                      setPlanToDelete({ id: program.program_id, name: program.title, isPurchased: true });
                      setShowDeleteModal(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                      color: '#dc3545',
                      border: '1px solid rgba(220, 53, 69, 0.3)'
                    }}
                  >
                    <i className="bi bi-eye-slash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {plansTab === 'premium' && hiddenPurchasedPrograms.map(program => (
          <div key={`hidden-purchased-${program.program_id}`} className="col-lg-6 mb-3">
            <div
              className="card border-0 rounded-4 h-100"
              style={{
                backgroundColor: 'rgba(15, 20, 15, 0.45)',
                border: '1px dashed rgba(255, 255, 255, 0.25)',
                boxShadow: 'none'
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>{program.title}</h5>
                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', padding: '0.5rem 1rem' }}>
                    <i className="bi bi-eye-slash me-1"></i>
                    Hidden
                  </span>
                </div>

                <div className="mb-2">
                  <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>{program.difficulty_level}</span>
                  <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>{program.duration_weeks}w</span>
                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>{program.category}</span>
                </div>

                <div className="mb-3">
                  <small style={{ color: 'var(--text-secondary)' }}>Description:</small>
                  <p className="small mb-0 mt-1" style={{ color: 'var(--text-primary)' }}>{program.description || 'No description available'}</p>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn rounded-pill flex-fill"
                    onClick={() => restorePurchasedProgram(program)}
                    style={{
                      backgroundColor: 'rgba(32, 214, 87, 0.1)',
                      color: 'var(--brand-primary)',
                      border: '1px solid rgba(32, 214, 87, 0.35)',
                      fontWeight: '600'
                    }}
                  >
                    <i className="bi bi-eye me-2"></i>
                    Unhide Program
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {plansTab === 'premium' && purchasedPagination?.has_more && (
          <div className="col-12">
            <div className="d-flex justify-content-center pt-2">
              <button
                className="btn rounded-pill px-4"
                disabled={purchasedLoading}
                onClick={() => loadPurchasedPrograms({ page: (purchasedPagination.page || 1) + 1, replace: false })}
                style={{
                  backgroundColor: 'rgba(32, 214, 87, 0.1)',
                  color: 'var(--brand-primary)',
                  border: '1px solid rgba(32, 214, 87, 0.3)',
                  fontWeight: 600
                }}
              >
                Load more
              </button>
            </div>
          </div>
        )}

        {plansTab === 'my' && myPlansLoading && workoutPlans.length === 0 && (
          <div className="col-12">
            <div className="text-center py-4">
              <div className="spinner-border" role="status" style={{ color: 'var(--brand-primary)' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Loading your plans...</p>
            </div>
          </div>
        )}

        {plansTab === 'my' && !myPlansLoading && workoutPlans.length === 0 && (
          <div className="col-12">
            <div className="text-center py-4">
              <i className="bi bi-journal-plus fs-1" style={{ color: 'var(--text-secondary)' }}></i>
              <p className="mt-2 mb-0" style={{ color: 'var(--text-secondary)' }}>No workout plans yet. Create one to get started.</p>
            </div>
          </div>
        )}

        {plansTab === 'my' && workoutPlans.map(plan => (
          <div key={plan.id} className="col-lg-6 mb-3">
            <div 
              className="card border-0 rounded-4 h-100"
              style={{ 
                backgroundColor: 'rgba(15, 20, 15, 0.6)',
                border: '1px solid rgba(32, 214, 87, 0.3)',
                boxShadow: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(32, 214, 87, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(32, 214, 87, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>{plan.name}</h5>
                  {plan.is_program_package == 1 ? (
                    <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.2)', color: 'var(--brand-primary)', padding: '0.5rem 1rem' }}>{plan.session_count || 0} sessions</span>
                  ) : (
                    <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)', padding: '0.5rem 1rem' }}>{plan.exercise_count ?? (plan.exercises?.length || 0)} exercises</span>
                  )}
                </div>
                
                {plan.is_program_package == 1 && (
                  <div className="mb-2">
                    <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>{plan.difficulty_level}</span>
                    <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>{plan.duration_weeks}w</span>
                    <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>{plan.category}</span>
                  </div>
                )}
                
                <div className="mb-3">
                  <small style={{ color: 'var(--text-secondary)' }}>Description:</small>
                  <p className="small mb-0 mt-1" style={{ color: 'var(--text-primary)' }}>{plan.description || 'No description available'}</p>
                </div>

                <div className="mb-3">
                  <small style={{ color: 'var(--text-secondary)' }}>Last performed: {plan.last_performed || 'Never'}</small>
                </div>

                <div className="d-flex gap-2">
                  {plan.is_program_package == 1 ? (
                    <>
                      <button 
                        className="btn rounded-pill flex-fill"
                        onClick={() => navigate(`/trainee-dashboard/user-program/${plan.id}`)}
                        style={{
                          backgroundColor: 'var(--brand-primary)',
                          color: 'var(--brand-dark)',
                          border: 'none',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-eye me-2"></i>
                        View
                      </button>
                      <button 
                        className="btn rounded-pill"
                        onClick={() => navigate(`/trainee-dashboard/user-program/${plan.id}/edit`)}
                        style={{
                          backgroundColor: 'rgba(32, 214, 87, 0.1)',
                          color: 'var(--brand-primary)',
                          border: '1px solid rgba(32, 214, 87, 0.3)'
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn rounded-pill flex-fill"
                        onClick={() => startWorkout(plan)}
                        style={{
                          backgroundColor: 'var(--brand-primary)',
                          color: 'var(--brand-dark)',
                          border: 'none',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-play-circle me-2"></i>
                        Start Workout
                      </button>
                      <button 
                        className="btn rounded-pill"
                        onClick={async () => {
                          try {
                            const fullPlan = await ensureUserPlanDetails(plan);
                            setNewPlan({
                              name: fullPlan.name,
                              description: fullPlan.description || '',
                              exercises: fullPlan.exercises || []
                            });
                            setIsEditMode(true);
                            setEditingPlanId(fullPlan.id);
                            setActiveView('create');
                          } catch (e) {
                            console.error('Failed to load plan for editing', e);
                            alert(e.message || 'Failed to load plan for editing');
                          }
                        }}
                        style={{
                          backgroundColor: 'rgba(32, 214, 87, 0.1)',
                          color: 'var(--brand-primary)',
                          border: '1px solid rgba(32, 214, 87, 0.3)'
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                    </>
                  )}
                  <button 
                    className="btn rounded-pill"
                    onClick={() => {
                      setPlanToDelete(plan);
                      setShowDeleteModal(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                      color: '#dc3545',
                      border: '1px solid rgba(220, 53, 69, 0.3)'
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {plansTab === 'my' && myPlansPagination?.has_more && (
          <div className="col-12">
            <div className="d-flex justify-content-center pt-2">
              <button
                className="btn rounded-pill px-4"
                disabled={myPlansLoading}
                onClick={() => loadMyWorkoutPlans({ page: (myPlansPagination.page || 1) + 1, replace: false })}
                style={{
                  backgroundColor: 'rgba(32, 214, 87, 0.1)',
                  color: 'var(--brand-primary)',
                  border: '1px solid rgba(32, 214, 87, 0.3)',
                  fontWeight: 600
                }}
              >
                Load more
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Premium Workout Plans Section */}
      {plansTab === 'premium' && premadeWorkoutPlans.length > 0 && (
        <div className="mt-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0" style={{ color: 'var(--brand-white)', fontWeight: '700' }}>
              <i className="bi bi-trophy-fill me-2" style={{ color: 'var(--brand-primary)' }}></i>
              Premium Workout Programs
            </h5>
            <button 
              className="btn rounded-pill px-4"
              onClick={() => navigate('/trainee-dashboard/marketplace')}
              style={{
                backgroundColor: 'rgba(32, 214, 87, 0.1)',
                color: 'var(--brand-primary)',
                border: '1px solid rgba(32, 214, 87, 0.3)',
                fontWeight: '600'
              }}
            >
              <i className="bi bi-shop me-2"></i>
              View All Programs
            </button>
          </div>
          <div className="row">
            {premadeWorkoutPlans.slice(0, 3).map((plan, index) => (
              <div key={index} className="col-lg-4 mb-3">
                <div 
                  className="card border-0 rounded-4 h-100"
                  style={{ 
                    backgroundColor: 'rgba(15, 20, 15, 0.6)',
                    border: '1px solid rgba(32, 214, 87, 0.3)',
                    boxShadow: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-primary)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(32, 214, 87, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(32, 214, 87, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="card-body p-4">
                    <div className="mb-3">
                      <h6 className="card-title mb-2" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>{plan.title}</h6>
                      <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>{plan.description?.substring(0, 100)}...</p>
                    </div>
                    <div className="mb-3">
                      <span className="badge rounded-pill me-1" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>{plan.difficulty_level}</span>
                      <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-light)' }}>{plan.duration_weeks} weeks</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(32, 214, 87, 0.2)', color: 'var(--brand-primary)', padding: '0.5rem 1rem' }}>{plan.category}</span>
                      <span className="fw-bold" style={{ color: 'var(--brand-primary)', fontSize: '1.25rem' }}>€{plan.price}</span>
                    </div>
                    <button 
                      className="btn rounded-pill w-100"
                      onClick={() => navigate(`/trainee-dashboard/marketplace?programId=${plan.id}`)}
                      style={{
                        backgroundColor: 'rgba(32, 214, 87, 0.1)',
                        color: 'var(--brand-primary)',
                        border: '1px solid rgba(32, 214, 87, 0.3)',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-eye me-2"></i>
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout History with Filters */}
      <div className="mt-5 overflow-hidden">
        <div className="d-flex flex-column flex-lg-row justify-content-lg-between align-items-lg-center gap-3 mb-4">
          <h5 className="mb-0" style={{ color: 'var(--brand-white)', fontWeight: '700', minWidth: 'max-content' }}>
            <i className="bi bi-clock-history me-2" style={{ color: 'var(--brand-primary)' }}></i>
            Recent Workouts
          </h5>
          <div className="workout-history-filters w-100 w-lg-auto justify-content-start justify-content-lg-end">
            <input 
              type="date" 
              className="form-control form-control-sm workout-history-filter workout-history-date"
              value={historyFilter.startDate}
              onChange={(e) => {
                const nextStart = e.target.value;
                if (!nextStart) return;
                setHistoryFilter((prev) => {
                  const next = { ...prev, startDate: nextStart };
                  if (next.endDate && nextStart > next.endDate) next.endDate = nextStart;
                  return next;
                });
              }}
              placeholder="Filter by date"
              style={{
                backgroundColor: 'rgba(247, 255, 247, 0.05)',
                border: '1px solid rgba(32, 214, 87, 0.2)',
                color: 'var(--brand-white)',
                colorScheme: 'dark'
              }}
            />
            <input 
              type="date" 
              className="form-control form-control-sm workout-history-filter workout-history-date"
              value={historyFilter.endDate}
              onChange={(e) => {
                const nextEnd = e.target.value;
                if (!nextEnd) return;
                setHistoryFilter((prev) => {
                  const next = { ...prev, endDate: nextEnd };
                  if (next.startDate && nextEnd < next.startDate) next.startDate = nextEnd;
                  return next;
                });
              }}
              placeholder="Filter by date"
              style={{
                backgroundColor: 'rgba(247, 255, 247, 0.05)',
                border: '1px solid rgba(32, 214, 87, 0.2)',
                color: 'var(--brand-white)',
                colorScheme: 'dark'
              }}
            />
            <select 
              className="form-select form-select-sm workout-history-filter workout-history-plan"
              value={historyFilter.workoutPlan}
              onChange={(e) => setHistoryFilter(prev => ({ ...prev, workoutPlan: e.target.value }))}
              style={{
                backgroundColor: 'rgba(247, 255, 247, 0.05)',
                border: '1px solid rgba(32, 214, 87, 0.2)',
                color: 'var(--brand-white)',
                minWidth: '130px'
              }}
            >
              <option value="">All Plans</option>
              {workoutPlans.map(plan => (
                <option key={plan.id} value={plan.name}>{plan.name}</option>
              ))}
            </select>
            <button 
              className="btn btn-sm rounded-pill workout-history-clear"
              onClick={() => {
                setHistoryFilter({ startDate: addDays(todayStr, -6), endDate: todayStr, workoutPlan: '', sortBy: 'date' });
              }}
              style={{
                backgroundColor: 'rgba(32, 214, 87, 0.1)',
                color: 'var(--brand-primary)',
                border: '1px solid rgba(32, 214, 87, 0.3)',
                minWidth: '80px'
              }}
            >
              Clear
            </button>
          </div>
        </div>
        
        <div 
          className="card border-0 rounded-4"
          style={{ 
            backgroundColor: 'rgba(15, 20, 15, 0.6)',
            border: '1px solid rgba(32, 214, 87, 0.3)',
            boxShadow: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(32, 214, 87, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="card-body p-4">
            {filteredWorkoutHistory.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-clock-history fs-1" style={{ color: 'var(--text-secondary)' }}></i>
                <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>No workout history found.</p>
              </div>
            ) : (
              filteredWorkoutHistory.map(workout => (
                <div 
                  key={workout.id} 
                  className="py-3"
                  style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.1)' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1" style={{ color: 'var(--brand-white)', fontWeight: '600' }}>{workout.plan_name}</h6>
                      <small style={{ color: 'var(--text-secondary)' }}>{workout.session_date} • {workout.duration_minutes} minutes</small>
                    </div>
                    <button 
                      className="btn btn-sm rounded-pill"
                      onClick={() => viewWorkoutDetails(workout.id)}
                      style={{
                        backgroundColor: 'rgba(32, 214, 87, 0.1)',
                        color: 'var(--brand-primary)',
                        border: '1px solid rgba(32, 214, 87, 0.3)'
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
            <div className="pt-3">
              <div className="d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-sm rounded-pill"
                  onClick={goOlder}
                  disabled={historyLoading}
                  style={{
                    backgroundColor: 'rgba(32, 214, 87, 0.1)',
                    color: 'var(--brand-primary)',
                    border: '1px solid rgba(32, 214, 87, 0.3)',
                    opacity: historyLoading ? 0.5 : 1
                  }}
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </button>
                <button
                  className="btn btn-sm rounded-pill"
                  onClick={goNewer}
                  disabled={historyLoading || !canGoNewer}
                  style={{
                    backgroundColor: 'rgba(32, 214, 87, 0.1)',
                    color: 'var(--brand-primary)',
                    border: '1px solid rgba(32, 214, 87, 0.3)',
                    opacity: (historyLoading || !canGoNewer) ? 0.5 : 1
                  }}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              <div className="small text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
                {formatYmdShort(historyFilter.startDate)} – {formatYmdShort(historyFilter.endDate)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateView = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>{isEditMode ? 'Edit Workout Plan' : 'Create Workout Plan'}</h4>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => {
            resetPlanForm();
            setActiveView('plans');
          }}
        >
          <i className="bi bi-arrow-left me-2"></i>
          {isEditMode ? 'Cancel Edit' : 'Back'}
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
            <div className="card-body">
              {/* Plan Details */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Plan Name</label>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                      value={newPlan.name}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter plan name..."
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Description</label>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                      value={newPlan.description}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Plan description..."
                    />
                  </div>
                </div>
              </div>

              {/* Exercise Search */}
              <div className="mb-4">
                <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>Available Exercises</h6>
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
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
                          className="card card-hover cursor-pointer"
                          style={{ background: 'rgba(30, 35, 30, 0.6)', border: '1px solid rgba(32, 214, 87, 0.3)' }}
                          onClick={() => addExerciseToPlan(exercise)}
                        >
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{exercise.name}</small>
                                <br />
                                <small style={{ color: 'rgba(255,255,255,0.7)' }}>
                                  {exercise.category} • {exercise.muscle_group}
                                  {Boolean(exercise.is_custom) && <span className="badge bg-success ms-1">Custom</span>}
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
              <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>Create Your Own Exercise</h6>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                    placeholder="Exercise name"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <select 
                    className="form-select"
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
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
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
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
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
                    placeholder="Equipment needed"
                    value={newExercise.equipment}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, equipment: e.target.value }))}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <textarea 
                    className="form-control"
                    style={{ background: 'rgba(30, 35, 30, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', color: 'rgba(255,255,255,0.9)' }}
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
                <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>Buy Existing Workout Plans</h6>
                <div className="row">
                  {premadeWorkoutPlans.slice(0, 3).map((plan, index) => (
                    <div key={index} className="col-md-4 mb-3">
                      <div className="card" style={{ background: 'rgba(30, 35, 30, 0.6)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
                        <div className="card-body p-3">
                          <h6 className="card-title mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{plan.title}</h6>
                          <p className="small mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{plan.category} • {plan.difficulty_level}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-success">€{plan.price}</span>
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
          <div className="card sticky-top" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem' }}>
            <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.2)', borderBottom: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '1rem 1rem 0 0' }}>
              <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Plan Preview</h6>
            </div>
            <div className="card-body">
              <h6 style={{ color: 'rgba(255,255,255,0.9)' }}>{newPlan.name || 'Untitled Plan'}</h6>
              <p className="small" style={{ color: 'rgba(255,255,255,0.7)' }}>{newPlan.description || 'No description'}</p>
              
              {newPlan.exercises.length === 0 ? (
                <p className="small" style={{ color: 'rgba(255,255,255,0.6)' }}>No exercises added yet</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {newPlan.exercises.map((exercise, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ background: 'rgba(30, 35, 30, 0.6)' }}>
                      <div>
                        <small className="fw-bold d-block" style={{ color: 'rgba(255,255,255,0.9)' }}>{exercise.name}</small>
                        <small style={{ color: 'rgba(255,255,255,0.7)' }}>{exercise.sets} sets x {exercise.reps}</small>
                        {exercise.rpe && <small style={{ color: 'rgba(255,255,255,0.7)' }}> • RPE {exercise.rpe}</small>}
                        <br />
                        <small style={{ color: 'rgba(255,255,255,0.7)' }}>{exercise.muscle_group}</small>
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
                {isEditMode ? 'Update Plan' : 'Save Plan'}
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
      <div className="position-fixed" style={{ top: '80px', left: '20px', zIndex: 1050 }}>
        <div className="card" style={{ background: 'rgba(15, 20, 15, 0.9)', border: '1px solid rgba(32, 214, 87, 0.3)', borderRadius: '0.75rem', backdropFilter: 'blur(10px)' }}>
          <div className="card-body p-2">
            <div className="d-flex align-items-center">
              <i className="bi bi-stopwatch me-2" style={{ color: 'rgba(32, 214, 87, 0.9)' }}></i>
              <span className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{formatTime(workoutTimer)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h4 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Active Workout:<br className="d-block d-md-none" /> {activeWorkout?.name}</h4>
        <div className="d-flex flex-wrap gap-2">
          <button 
            className="btn btn-outline-danger flex-grow-1 flex-md-grow-0"
            onClick={() => setShowCancelWorkoutModal(true)}
            title="Cancel workout without saving progress"
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel Workout
          </button>
          <button 
            className="btn btn-outline-warning flex-grow-1 flex-md-grow-0"
            onClick={() => setShowEndWorkoutModal(true)}
            title="End workout early but save current progress"
          >
            <i className="bi bi-stop-circle me-2"></i>
            End Workout Early
          </button>
        </div>
      </div>

      {activeWorkout && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '1rem' }}>
              <div className="card-body">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: '500' }}>Exercise {currentExerciseIndex + 1} of {activeWorkout.exercises.length}</small>
                    <span className="badge" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(32, 214, 87, 1)', border: '1px solid rgba(32, 214, 87, 0.3)', padding: '0.35rem 0.75rem' }}>Set {currentSetIndex + 1} of {activeWorkout.exercises[currentExerciseIndex]?.sets}</span>
                  </div>
                  <h4 style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '0.5rem', fontWeight: '600' }}>{activeWorkout.exercises[currentExerciseIndex]?.name}</h4>
                  {activeWorkout.exercises[currentExerciseIndex]?.instructions && (
                    <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>{activeWorkout.exercises[currentExerciseIndex]?.instructions}</p>
                  )}
                </div>

                {/* Exercise Logging Form */}
                <div className="mb-4">
                  <div className="row">
                    <div className="col-6 col-sm-6 col-md-3 mb-3">
                      <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Weight (kg)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}
                        placeholder="0" 
                        step="0.5"
                        min="0"
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        value={currentSetData.weight}
                        onChange={(e) => setCurrentSetData(prev => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>
                    <div className="col-6 col-sm-6 col-md-3 mb-3">
                      <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Reps</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}
                        placeholder="0"
                        min="0"
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        value={currentSetData.reps}
                        onChange={(e) => setCurrentSetData(prev => ({ ...prev, reps: e.target.value }))}
                      />
                    </div>
                    <div className="col-6 col-sm-6 col-md-3 mb-3">
                      <label className="form-label border-0" style={{ color: 'rgba(255,255,255,0.9)' }}>RPE (1-10)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}
                        placeholder="5" 
                        min="1" 
                        max="10"
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        value={currentSetData.rpe}
                        onChange={(e) => setCurrentSetData(prev => ({ ...prev, rpe: e.target.value }))}
                      />
                    </div>
                    <div className="col-6 col-sm-6 col-md-3 mb-3">
                      <label className="form-label border-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Notes</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}
                        placeholder="Optional notes"
                        value={currentSetData.notes}
                        onChange={(e) => setCurrentSetData(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    <button 
                      className="btn btn-success flex-grow-1 flex-md-grow-0"
                      style={{ borderRadius: '0.5rem', fontWeight: '500' }}
                      onClick={completeSet}
                      disabled={!currentSetData.reps}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Complete Set
                    </button>
                    <button 
                      className="btn btn-outline-secondary flex-grow-1 flex-md-grow-0"
                      style={{ borderRadius: '0.5rem', fontWeight: '500' }}
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
                      className="btn btn-outline-primary flex-grow-1 flex-md-grow-0"
                      style={{ borderRadius: '0.5rem', fontWeight: '500' }}
                      onClick={nextExercise}
                    >
                      <i className="bi bi-arrow-right me-2"></i>
                      Next Exercise
                    </button>
                  </div>

                  {/* Break Timer Controls */}
                  <div className="card border-0" style={{ background: 'rgba(30, 35, 30, 0.3)', border: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '0.75rem' }}>
                    <div className="card-body p-3">
                      <div className="d-flex flex-wrap flex-md-row justify-content-between align-items-center gap-3 mb-3">
                        <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: '600' }}>Rest Timer</h6>
                        <div className="form-check form-switch d-flex align-items-center gap-2 m-0 mt-md-0 mt-sm-0">
                          <input 
                            className="form-check-input m-0" 
                            type="checkbox" 
                            id="timerModeSwitch"
                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                            checked={isTimerMode}
                            onChange={(e) => {
                              setIsTimerMode(e.target.checked);
                              resetBreakTimer();
                            }}
                          />
                          <label className="form-check-label mb-0" htmlFor="timerModeSwitch" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer' }}>
                            {isTimerMode ? 'Countdown' : 'Stopwatch'}
                          </label>
                        </div>
                      </div>
                      
                      <div className="d-flex flex-column flex-md-row align-items-center gap-3">
                        {isTimerMode && (
                          <div className="w-100 w-md-auto" style={{ flex: '1' }}>
                            <label className="form-label small mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Rest Time (seconds)</label>
                            <input 
                              type="number" 
                              className="form-control form-control-sm"
                              style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)', borderRadius: '0.5rem' }}
                              value={breakTimerSetting}
                              onKeyDown={(e) => {
                                if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
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
                        
                        <div className="text-center w-100 w-md-auto" style={{ flex: '1' }}>
                          <div className="fs-2 fw-bold" style={{ color: 'rgba(32, 214, 87, 0.9)', lineHeight: '1.2' }}>
                            {formatTime(breakTimer)}
                          </div>
                        </div>

                        <div className="w-100 w-md-auto d-flex justify-content-center justify-content-md-end gap-2" style={{ flex: '1' }}>
                          <button 
                            className={`btn ${isBreakTimerRunning ? 'btn-warning' : 'btn-success'} flex-grow-1 flex-md-grow-0`}
                            style={{ borderRadius: '0.5rem', fontWeight: '500', padding: '0.5rem 1rem' }}
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
                            className="btn btn-outline-secondary flex-grow-1 flex-md-grow-0"
                            style={{ borderRadius: '0.5rem', fontWeight: '500', padding: '0.5rem 1rem' }}
                            onClick={resetBreakTimer}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Sets */}
                <div className="border-top pt-3" style={{ borderColor: 'rgba(32, 214, 87, 0.2) !important' }}>
                  <h6 style={{ color: 'rgba(255,255,255,0.9)' }}>Sets Progress</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.2)' }}>
                          <th style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '500', paddingBottom: '0.75rem' }}>Set</th>
                          <th style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '500', paddingBottom: '0.75rem' }}>Weight</th>
                          <th style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '500', paddingBottom: '0.75rem' }}>Reps</th>
                          <th style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '500', paddingBottom: '0.75rem' }}>RPE</th>
                          <th style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '500', paddingBottom: '0.75rem' }}>Notes</th>
                          <th style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '500', paddingBottom: '0.75rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: activeWorkout.exercises[currentExerciseIndex]?.sets || 0 }, (_, i) => {
                          const setData = activeWorkout.completedSets?.[currentExerciseIndex]?.[i];
                          return (
                            <tr 
                              key={i} 
                              style={{ 
                                borderBottom: '1px solid rgba(32, 214, 87, 0.1)',
                                cursor: 'pointer',
                                background: i === currentSetIndex ? 'rgba(32, 214, 87, 0.15)' : 'transparent',
                                transition: 'background 0.2s'
                              }}
                              onClick={() => {
                                setCurrentSetIndex(i);
                                setCurrentSetData({
                                  weight: setData?.completed ? setData.weight : '',
                                  reps: setData?.completed ? setData.reps : '',
                                  rpe: setData?.completed ? setData.rpe || '' : '',
                                  notes: setData?.completed ? setData.notes || '' : ''
                                });
                              }}
                              onMouseEnter={(e) => {
                                if (i !== currentSetIndex) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                              }}
                              onMouseLeave={(e) => {
                                if (i !== currentSetIndex) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <td style={{ color: 'rgba(255,255,255,0.9)', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>{i + 1}</td>
                              <td style={{ color: 'rgba(255,255,255,0.9)', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>{setData?.completed ? setData.weight : '-'}</td>
                              <td style={{ color: 'rgba(255,255,255,0.9)', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>{setData?.completed ? setData.reps : '-'}</td>
                              <td style={{ color: 'rgba(255,255,255,0.9)', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>{setData?.completed ? setData.rpe || '-' : '-'}</td>
                              <td style={{ color: 'rgba(255,255,255,0.8)', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>{setData?.completed ? setData.notes || '-' : '-'}</td>
                              <td style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
                                <span className={`badge ${
                                  setData?.completed ? 'bg-success' : 
                                  i === currentSetIndex ? 'bg-warning text-dark' : ''
                                }`} style={!setData?.completed && i !== currentSetIndex ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' } : {}}>
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

          <div className="col-lg-4 mt-4 mt-lg-0">
            <div className="card sticky-top" style={{ background: 'rgba(15, 20, 15, 0.7)', border: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '1rem' }}>
              <div className="card-header" style={{ background: 'rgba(32, 214, 87, 0.1)', borderBottom: '1px solid rgba(32, 214, 87, 0.2)', borderRadius: '1rem 1rem 0 0' }}>
                <h6 className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Workout Summary</h6>
              </div>
              <div className="card-body">
                <div className="mb-3 pb-2" style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.1)' }}>
                  <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Duration</small>
                  <h6 style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.25rem', marginTop: '0.25rem', marginBottom: '0' }}>{formatTime(workoutTimer)}</h6>
                </div>
                <div className="mb-3 pb-2" style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.1)' }}>
                  <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Exercises Completed</small>
                  <h6 style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.25rem', marginTop: '0.25rem', marginBottom: '0' }}>{currentExerciseIndex} of {activeWorkout.exercises.length}</h6>
                </div>
                <div className="mb-3 pb-2" style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.1)' }}>
                  <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Current Exercise</small>
                  <h6 style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.1rem', marginTop: '0.25rem', marginBottom: '0' }}>{activeWorkout.exercises[currentExerciseIndex]?.name}</h6>
                </div>
                <div className="mb-3">
                  <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Sets Progress</small>
                  <h6 style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.25rem', marginTop: '0.25rem', marginBottom: '0' }}>{currentSetIndex + 1} of {activeWorkout.exercises[currentExerciseIndex]?.sets}</h6>
                </div>

                <hr style={{ borderColor: 'rgba(32, 214, 87, 0.15)', margin: '1.5rem 0' }} />
                
                <h6 className="mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>Exercise List</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {activeWorkout.exercises.map((exercise, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded mb-2 cursor-pointer ${index === currentExerciseIndex ? 'bg-primary text-white' : ''}`}
                      style={index !== currentExerciseIndex ? { background: 'rgba(30, 35, 30, 0.4)', border: '1px solid rgba(32, 214, 87, 0.15)' } : {}}
                      onClick={() => {
                        setCurrentExerciseIndex(index);
                        
                        // Check if there's a currently active set we should switch to
                        // typically the first uncompleted set for this exercise
                        const uncompletedSetIndex = activeWorkout.completedSets?.[index]?.findIndex(set => !set.completed);
                        const nextSetIndex = uncompletedSetIndex !== -1 ? uncompletedSetIndex : (activeWorkout.exercises[index]?.sets - 1 || 0);
                        
                        setCurrentSetIndex(nextSetIndex);
                        const setData = activeWorkout.completedSets?.[index]?.[nextSetIndex];
                        setCurrentSetData({
                          weight: setData?.completed ? setData.weight : '',
                          reps: setData?.completed ? setData.reps : '',
                          rpe: setData?.completed ? setData.rpe || '' : '',
                          notes: setData?.completed ? setData.notes || '' : ''
                        });
                      }}
                    >
                      <small className="fw-bold d-block" style={index !== currentExerciseIndex ? { color: 'rgba(255,255,255,0.9)' } : {}}>{exercise.name}</small>
                      <small className="opacity-75" style={index !== currentExerciseIndex ? { color: 'rgba(255,255,255,0.7)' } : {}}>{exercise.sets} sets x {exercise.reps}</small>
                      <br />
                      <small className="opacity-75" style={index !== currentExerciseIndex ? { color: 'rgba(255,255,255,0.7)' } : {}}>{exercise.muscle_group}</small>
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
    <div className={`modal fade ${showDeleteModal ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showDeleteModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog w-100 m-0">
        <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>{planToDelete?.isPurchased ? 'Hide' : 'Delete'} Workout Plan</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowDeleteModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>Are you sure you want to {planToDelete?.isPurchased ? 'hide' : 'delete'} the workout plan "<strong>{planToDelete?.name}</strong>"?</p>
            {planToDelete?.isPurchased ? (
              <p className="small" style={{ color: 'rgba(255,255,255,0.7)' }}>This will hide the program from your library. You can unhide it anytime from the Hidden section in My Plans.</p>
            ) : (
              <p className="small" style={{ color: 'rgba(255,255,255,0.7)' }}>This action cannot be undone.</p>
            )}
          </div>
          <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
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
              onClick={() => {
                console.log('Delete button clicked, planToDelete:', planToDelete);
                deletePlan(planToDelete?.id);
              }}
            >
              {planToDelete?.isPurchased ? 'Hide' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const EditModal = () => (
    <div className={`modal fade ${showEditModal ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showEditModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog w-100 modal-lg m-0">
        <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>Edit Workout Plan</h5>
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
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Plan Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)' }}
                    value={planToEdit.name}
                    onChange={(e) => setPlanToEdit(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Description</label>
                  <textarea 
                    className="form-control"
                    style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)' }}
                    value={planToEdit.description || ''}
                    onChange={(e) => setPlanToEdit(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Exercises ({planToEdit.exercises?.length || 0})</label>
                  <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(30, 35, 30, 0.5)', borderColor: 'rgba(32, 214, 87, 0.2) !important' }}>
                    {planToEdit.exercises?.map((exercise, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{exercise.name}</strong>
                          <br />
                          <small style={{ color: 'rgba(255,255,255,0.7)' }}>{exercise.sets} sets x {exercise.reps}</small>
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
          <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
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

  const WorkoutDetailsModal = () => {
    const [expandedExercise, setExpandedExercise] = useState(null);

    // Group exercises by name for better display
    const groupedExercises = selectedWorkoutDetails?.exerciseLogs?.reduce((acc, log) => {
      if (!acc[log.exercise_name]) {
        acc[log.exercise_name] = [];
      }
      acc[log.exercise_name].push(log);
      return acc;
    }, {}) || {};

    // Calculate total volume and other stats
    const calculateStats = () => {
      if (!selectedWorkoutDetails?.exerciseLogs) return {};
      
      let totalVolume = 0;
      let totalReps = 0;
      let uniqueExercises = new Set();
      let rpeSum = 0;
      let rpeCount = 0;

      selectedWorkoutDetails.exerciseLogs.forEach(log => {
        uniqueExercises.add(log.exercise_name);
        totalReps += parseInt(log.reps_completed) || 0;
        
        if (log.weight_kg && log.reps_completed) {
          totalVolume += (parseFloat(log.weight_kg) * parseInt(log.reps_completed));
        }
        
        if (log.rpe) {
          rpeSum += parseFloat(log.rpe);
          rpeCount++;
        }
      });

      return {
        totalVolume: totalVolume.toFixed(1),
        totalReps,
        uniqueExercises: uniqueExercises.size,
        avgRpe: rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : null
      };
    };

    const stats = calculateStats();

    return (
      <div className={`modal fade ${showWorkoutDetails ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showWorkoutDetails ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
        <div className="modal-dialog w-100 modal-xl m-0">
          <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
            <div className="modal-header dark-modal-header">
              <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <i className="bi bi-clipboard-data me-2"></i>
                Workout Details
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowWorkoutDetails(false)}
              ></button>
            </div>
            <div className="modal-body">
              {selectedWorkoutDetails && (
                <div>
                  {/* Workout Overview */}
                  <div className="card border-0 mb-4" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                    <div className="card-body p-3">
                      <div className="row">
                        <div className="col-md-8">
                          <h6 className="card-title mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            <i className="bi bi-clipboard-check me-2" style={{ color: 'rgba(32, 214, 87, 0.9)' }}></i>
                            {selectedWorkoutDetails.plan_name}
                          </h6>
                          <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(selectedWorkoutDetails.session_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="col-md-4 text-end">
                          {selectedWorkoutDetails.rating && (
                            <div className="mb-2">
                              <span className="badge" style={{ background: 'rgba(255, 193, 7, 0.2)', color: 'rgba(255, 193, 7, 0.9)' }}>
                                <i className="bi bi-star-fill me-1"></i>
                                Rating: {selectedWorkoutDetails.rating}/10
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Cards */}
                  <div className="row mb-4">
                    <div className="col-md-2 col-6 mb-3">
                      <div className="card border-0 h-100 text-center" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                        <div className="card-body p-3">
                          <div className="fs-4" style={{ color: 'rgba(32, 214, 87, 0.9)' }}>
                            <i className="bi bi-clock"></i>
                          </div>
                          <div className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{selectedWorkoutDetails.duration_minutes}</div>
                          <small style={{ color: 'rgba(255,255,255,0.7)' }}>Minutes</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                      <div className="card border-0 h-100 text-center" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                        <div className="card-body p-3">
                          <div className="fs-4" style={{ color: 'rgba(32, 214, 87, 0.9)' }}>
                            <i className="bi bi-list-ol"></i>
                          </div>
                          <div className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{selectedWorkoutDetails.total_sets}</div>
                          <small style={{ color: 'rgba(255,255,255,0.7)' }}>Total Sets</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                      <div className="card border-0 h-100 text-center" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                        <div className="card-body p-3">
                          <div className="fs-4" style={{ color: 'rgba(32, 214, 87, 0.9)' }}>
                            <i className="bi bi-arrow-repeat"></i>
                          </div>
                          <div className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{stats.totalReps}</div>
                          <small style={{ color: 'rgba(255,255,255,0.7)' }}>Total Reps</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                      <div className="card border-0 h-100 text-center" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                        <div className="card-body p-3">
                          <div className="fs-4" style={{ color: 'rgba(255, 193, 7, 0.9)' }}>
                            <i className="bi bi-trophy"></i>
                          </div>
                          <div className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{stats.uniqueExercises}</div>
                          <small style={{ color: 'rgba(255,255,255,0.7)' }}>Exercises</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                      <div className="card border-0 h-100 text-center" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                        <div className="card-body p-3">
                          <div className="fs-4" style={{ color: 'rgba(220, 53, 69, 0.9)' }}>
                            <i className="bi bi-speedometer2"></i>
                          </div>
                          <div className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{stats.totalVolume}</div>
                          <small style={{ color: 'rgba(255,255,255,0.7)' }}>Volume (kg)</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-2 col-6 mb-3">
                      <div className="card border-0 h-100 text-center" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                        <div className="card-body p-3">
                          <div className="fs-4" style={{ color: 'rgba(108, 117, 125, 0.9)' }}>
                            <i className="bi bi-graph-up"></i>
                          </div>
                          <div className="fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>{stats.avgRpe || '-'}</div>
                          <small style={{ color: 'rgba(255,255,255,0.7)' }}>Avg RPE</small>
                        </div>
                      </div>
                    </div>
                  </div>
                
                  {/* Exercise Breakdown */}
                  <h6 className="mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <i className="bi bi-list-check me-2"></i>
                    Exercise Breakdown
                  </h6>
                  
                  {Object.keys(groupedExercises).length > 0 ? (
                    <div className="accordion">
                      {Object.entries(groupedExercises).map(([exerciseName, sets], exerciseIndex) => {
                        const isExpanded = expandedExercise === exerciseIndex;
                        return (
                          <div key={exerciseIndex} className="card border-0 mb-2" style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)' }}>
                            <div 
                              className={`btn text-start p-3 rounded ${isExpanded ? 'shadow-sm' : ''}`}
                              style={{ cursor: 'pointer', background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)' }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpandedExercise(isExpanded ? null : exerciseIndex);
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-center w-100">
                                <div>
                                  <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{exerciseName}</strong>
                                </div>
                                <div className="d-flex align-items-center">
                                  <span className="badge me-2" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(32, 214, 87, 0.9)' }}>{sets.length} sets</span>
                                  <span className="badge me-2" style={{ background: 'rgba(108, 117, 125, 0.2)', color: 'rgba(255,255,255,0.7)' }}>
                                    {sets.reduce((sum, set) => sum + (parseInt(set.reps_completed) || 0), 0)} reps
                                  </span>
                                  <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: 'rgba(255,255,255,0.9)' }}></i>
                                </div>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="card-body pt-0">
                                <div className="table-responsive">
                                  <table className="table table-sm">
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.2)' }}>
                                        <th style={{ color: 'rgba(255,255,255,0.9)' }}>Set</th>
                                        <th style={{ color: 'rgba(255,255,255,0.9)' }}>Weight (kg)</th>
                                        <th style={{ color: 'rgba(255,255,255,0.9)' }}>Reps</th>
                                        <th style={{ color: 'rgba(255,255,255,0.9)' }}>RPE</th>
                                        <th style={{ color: 'rgba(255,255,255,0.9)' }}>Volume (kg)</th>
                                        <th style={{ color: 'rgba(255,255,255,0.9)' }}>Notes</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sets.map((set, setIndex) => {
                                        const volume = set.weight_kg && set.reps_completed ? 
                                          (parseFloat(set.weight_kg) * parseInt(set.reps_completed)).toFixed(1) : '-';
                                        
                                        return (
                                          <tr key={setIndex} style={{ borderBottom: '1px solid rgba(32, 214, 87, 0.1)' }}>
                                            <td style={{ color: 'rgba(255,255,255,0.9)' }}>
                                              <span className="badge" style={{ background: 'rgba(32, 214, 87, 0.2)', color: 'rgba(32, 214, 87, 0.9)' }}>{set.set_number}</span>
                                            </td>
                                            <td style={{ color: 'rgba(255,255,255,0.9)' }}>{set.weight_kg || '-'}</td>
                                            <td style={{ color: 'rgba(255,255,255,0.9)' }}>{set.reps_completed}</td>
                                            <td>
                                              {set.rpe ? (
                                                <span className={`badge`} style={{ 
                                                  background: set.rpe <= 6 ? 'rgba(25, 135, 84, 0.2)' : 
                                                              set.rpe <= 8 ? 'rgba(255, 193, 7, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                                                  color: set.rpe <= 6 ? 'rgba(25, 135, 84, 0.9)' : 
                                                         set.rpe <= 8 ? 'rgba(255, 193, 7, 0.9)' : 'rgba(220, 53, 69, 0.9)'
                                                }}>
                                                  {set.rpe}
                                                </span>
                                              ) : <span style={{ color: 'rgba(255,255,255,0.7)' }}>-</span>}
                                            </td>
                                            <td style={{ color: 'rgba(255,255,255,0.9)' }}>{volume}</td>
                                            <td>
                                              <small style={{ color: 'rgba(255,255,255,0.7)' }}>
                                                {set.notes || '-'}
                                              </small>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <i className="bi bi-inbox fs-1"></i>
                      <p>No exercise data recorded for this workout.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
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
  };

  // Cancel Workout Modal
  const CancelWorkoutModal = () => (
    <div className={`modal fade ${showCancelWorkoutModal ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showCancelWorkoutModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog w-100 m-0">
        <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>Cancel Workout</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowCancelWorkoutModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>Are you sure you want to cancel this workout?</p>
            <p className="small" style={{ color: 'rgba(220, 53, 69, 0.9)' }}><strong>Warning:</strong> All progress will be lost and cannot be recovered.</p>
            <p className="small" style={{ color: 'rgba(255,255,255,0.7)' }}>If you want to save your progress, use "End Workout Early" instead.</p>
          </div>
          <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
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

  // End Workout Early Modal
  const EndWorkoutModal = () => (
    <div className={`modal fade ${showEndWorkoutModal ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showEndWorkoutModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog w-100 m-0">
        <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>End Workout Early</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowEndWorkoutModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>Do you want to end your workout early?</p>
            <p className="small" style={{ color: 'rgba(32, 214, 87, 0.9)' }}><strong>Your current progress will be saved.</strong></p>
            <p className="small" style={{ color: 'rgba(255,255,255,0.7)' }}>You can continue this workout later or start a new one.</p>
          </div>
          <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowEndWorkoutModal(false)}
            >
              Continue Workout
            </button>
            <button 
              type="button" 
              className="btn btn-warning" 
              onClick={() => {
                endWorkoutEarly();
                setShowEndWorkoutModal(false);
              }}
            >
              End Workout Early
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Finish Workout Modal
  const FinishWorkoutModal = () => (
    <div className={`modal fade ${showFinishWorkoutModal ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showFinishWorkoutModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog w-100 m-0">
        <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>Finish Workout</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowFinishWorkoutModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>Great job! You're about to finish your workout.</p>
            <div className="workout-summary">
              <div className="row">
                <div className="col-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <strong>Duration:</strong> {formatTime(workoutTimer)}
                </div>
                <div className="col-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <strong>Sets Completed:</strong> {workoutLogs.length}
                </div>
              </div>
            </div>
            <p className="small mt-3" style={{ color: 'rgba(255,255,255,0.7)' }}>This will save your workout and all logged sets.</p>
          </div>
          <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
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

  // Break Over Modal
  const BreakOverModal = () => (
    <div className={`modal fade ${showBreakOverModal ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showBreakOverModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog w-100 m-0">
        <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <i className="bi bi-alarm me-2" style={{ color: 'rgba(255, 193, 7, 0.9)' }}></i>
              Break Time Over!
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowBreakOverModal(false)}
            ></button>
          </div>
          <div className="modal-body text-center">
            <div className="mb-3">
              <i className="bi bi-stopwatch" style={{ fontSize: '3rem', color: 'rgba(255, 193, 7, 0.9)' }}></i>
            </div>
            <h6 style={{ color: 'rgba(255,255,255,0.9)' }}>Your rest period is complete!</h6>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Time to get back to your workout.</p>
          </div>
          <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
            <button 
              type="button" 
              className="btn btn-warning w-100" 
              onClick={() => setShowBreakOverModal(false)}
            >
              <i className="bi bi-play-circle me-2"></i>
              Continue Workout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Success Modal
  const SuccessModal = () => (
    <div className={`modal fade ${showSuccessModal ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showSuccessModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog w-100 m-0">
        <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <i className="bi bi-check-circle-fill me-2" style={{ color: 'rgba(32, 214, 87, 0.9)' }}></i>
              Success!
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setShowSuccessModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>{successMessage}</p>
          </div>
          <div className="modal-footer" style={{ background: 'rgba(20, 25, 20, 0.95)', borderTop: '1px solid rgba(32, 214, 87, 0.3)' }}>
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
    <div className={`modal fade ${showExerciseModal ? 'show d-flex align-items-center justify-content-center' : ''}`} style={{ backgroundColor: showExerciseModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog w-100 m-0">
        <div className="modal-content" style={{ background: 'rgba(15, 20, 15, 0.95)', border: '1px solid rgba(32, 214, 87, 0.3)' }}>
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title" style={{ color: 'rgba(255,255,255,0.9)' }}>Add Exercise to Plan</h5>
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
                  <h6 style={{ color: 'rgba(255,255,255,0.9)' }}>{selectedExercise.name}</h6>
                  <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedExercise.category} • {selectedExercise.muscle_group}</p>
                  {selectedExercise.instructions && (
                    <p className="small mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedExercise.instructions}</p>
                  )}
                </div>
                
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Sets</label>
                    <input 
                      type="number" 
                      className="form-control"
                      style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)' }}
                      value={exerciseToAdd.sets}
                      onChange={(e) => setExerciseToAdd(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Reps/Time</label>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)' }}
                      placeholder="e.g., 8-12, 30s"
                      value={exerciseToAdd.reps}
                      onChange={(e) => setExerciseToAdd(prev => ({ ...prev, reps: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Target RPE (Optional)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)' }}
                      placeholder="1-10"
                      value={exerciseToAdd.rpe}
                      onChange={(e) => setExerciseToAdd(prev => ({ ...prev, rpe: e.target.value }))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Type</label>
                  <select 
                    className="form-select"
                    style={{ background: 'rgba(30, 35, 30, 0.5)', border: '1px solid rgba(32, 214, 87, 0.2)', color: 'rgba(255,255,255,0.9)' }}
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
              disabled={!exerciseToAdd.sets || !exerciseToAdd.reps}
            >
              Add to Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <>
      <style>{`
        .form-control::placeholder,
        .form-select::placeholder {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .form-control:focus,
        .form-select:focus {
          background: rgba(30, 35, 30, 0.6) !important;
          border-color: rgba(32, 214, 87, 0.5) !important;
          box-shadow: 0 0 0 0.2rem rgba(32, 214, 87, 0.1) !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }
        .card-hover:hover {
          background: rgba(32, 214, 87, 0.15) !important;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .table-borderless td {
          border: none !important;
        }
      `}</style>
      <div className="container-fluid px-2 px-md-4 py-3" style={{ overflowX: 'hidden', paddingBottom: embedded ? '0' : '100px', backgroundColor: embedded ? 'transparent' : 'var(--brand-dark)', minHeight: embedded ? 'auto' : '100vh' }}>
        {/* Error State */}
        {error && (
          <div className="alert rounded-4" role="alert" style={{ border: '1px solid rgba(220, 53, 69, 0.3)', backgroundColor: 'rgba(220, 53, 69, 0.1)', color: 'var(--text-primary)' }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button 
              className="btn btn-sm ms-3" 
              onClick={fetchWorkoutData}
              style={{ backgroundColor: 'rgba(220, 53, 69, 0.2)', color: 'var(--text-primary)', border: '1px solid rgba(220, 53, 69, 0.3)' }}
            >
              Try Again
            </button>
          </div>
        )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: 'var(--brand-primary)', width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading your workouts...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {activeView === 'plans' && renderPlansView()}
          {activeView === 'create' && (
            <div>
              <CreateWorkoutProgram 
                onSave={handleSaveProgram}
                onCancel={() => setActiveView('plans')}
                allExercises={allExercises}
                onAddCustomExercise={handleAddCustomExercise}
              />
            </div>
          )}
          {activeView === 'log' && renderLogView()}
        </>
      )}

      {/* Modals */}
      <DeleteModal />
      <EditModal />
      <WorkoutDetailsModal />
      <ExerciseSelectionModal />
      <CancelWorkoutModal />
      <EndWorkoutModal />
      <FinishWorkoutModal />
      <BreakOverModal />
      <SuccessModal />

      {/* Bottom navigation provided by TraineeDashboard */}
      </div>
    </>
  );

  return embedded ? content : <TraineeDashboard>{content}</TraineeDashboard>;
};

export default MyWorkouts;
