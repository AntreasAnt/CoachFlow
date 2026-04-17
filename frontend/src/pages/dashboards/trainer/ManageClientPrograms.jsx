import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Dark theme styles
const styles = `
  .card-hover {
    border: 1px solid #3d3d3d;
    background: #2d2d2d !important;
  }
  .card-hover .card-body {
    background: #2d2d2d !important;
  }
  .cursor-pointer {
    cursor: pointer;
  }
  
  /* Main tab styling */
  .manage-client-tab {
    background: transparent !important;
    border: none !important;
    border-bottom: 3px solid transparent !important;
    color: #9ca3af !important;
    padding: 0.75rem 1.5rem !important;
    border-radius: 0 !important;
    transition: all 0.3s ease !important;
    white-space: nowrap !important;
  }
  
  .manage-client-tab:hover {
    color: #10b981 !important;
    background: rgba(16, 185, 129, 0.05) !important;
  }
  
  .manage-client-tab.active {
    background: rgba(16, 185, 129, 0.1) !important;
    border-bottom: 3px solid #10b981 !important;
    color: #10b981 !important;
  }
  
  /* Pill button styling */
  .program-pill {
    background: #2d2d2d !important;
    border: 1px solid #3d3d3d !important;
    color: #9ca3af !important;
    padding: 0.5rem 1.25rem !important;
    border-radius: 50px !important;
    transition: all 0.3s ease !important;
    white-space: nowrap !important;
  }
  
  .program-pill:hover {
    background: rgba(16, 185, 129, 0.1) !important;
    border-color: #10b981 !important;
    color: #10b981 !important;
  }
  
  .program-pill.active {
    background: #10b981 !important;
    border-color: #10b981 !important;
    color: #ffffff !important;
  }

  @media (max-width: 575.98px) {
    .manage-client-tab {
      padding: 0.5rem 0.75rem !important;
      font-size: 0.9rem !important;
    }
    .program-pill {
      padding: 0.4rem 0.75rem !important;
      font-size: 0.9rem !important;
    }
  }

  /* Top navigation tabs: allow horizontal scroll on mobile */
  .manage-client-nav-tabs {
    gap: 0.25rem;
  }

  .manage-client-nav-tabs .nav-item {
    flex: 0 0 auto;
  }

  @media (max-width: 575.98px) {
    .manage-client-nav-tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding-bottom: 0.25rem;
    }
    .manage-client-nav-tabs::-webkit-scrollbar {
      height: 0;
    }
    .manage-client-tab {
      white-space: nowrap !important;
    }
  }

  /* Create Custom Program: dark theme contrast fixes */
  .manage-client-create-program {
    color: #ffffff;
    --bs-body-color: rgba(255, 255, 255, 0.9);
    --bs-heading-color: #ffffff;
    --bs-secondary-color: rgba(255, 255, 255, 0.6);
    --bs-border-color: #3d3d3d;
  }

  .manage-client-create-program h1,
  .manage-client-create-program h2,
  .manage-client-create-program h3,
  .manage-client-create-program h4,
  .manage-client-create-program h5,
  .manage-client-create-program h6 {
    color: #ffffff;
    font-weight: 700;
  }

  .manage-client-create-program hr {
    border-color: rgba(255, 255, 255, 0.12);
    opacity: 1;
  }

  .manage-client-create-program .alert {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: rgba(255, 255, 255, 0.85);
  }

  .manage-client-create-program .card {
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
  }

  .manage-client-create-program .card-header {
    background: #1a1a1a !important;
    border-bottom: 1px solid #3d3d3d !important;
    color: #ffffff !important;
  }

  .manage-client-create-program .card-header h5,
  .manage-client-create-program .card-header h6 {
    color: #ffffff !important;
  }

  .manage-client-create-program .card-body {
    background: #1a1a1a;
  }

  .manage-client-create-program .form-label {
    color: rgba(255, 255, 255, 0.85);
  }

  .manage-client-create-program .form-control,
  .manage-client-create-program .form-select {
    background: #2d2d2d;
    border: 1px solid #3d3d3d;
    color: #ffffff;
    border-radius: 12px;
    padding: 0.85rem 1rem;
  }

  .manage-client-create-program .form-control::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  .manage-client-create-program .list-group-item {
    background: #2d2d2d;
    border: 1px solid #3d3d3d;
    color: #ffffff;
  }

  /* Fix places still using light backgrounds inside the dark UI */
  .manage-client-create-program .bg-light {
    background: #2d2d2d !important;
  }

  .manage-client-create-program .rounded {
    border: 1px solid #3d3d3d;
  }

  .manage-client-create-program .text-muted {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  /* Nutrition goals (overview card) */
  .nutrition-goals-header {
    gap: 0.75rem;
  }

  .nutrition-goals-btn {
    background: #10b981 !important;
    border: none !important;
    color: #ffffff !important;
    border-radius: 8px !important;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .nutrition-goals-btn:hover {
    background: #059669 !important;
    transform: translateY(-1px);
  }

  .nutrition-goals-stat {
    background: #2d2d2d !important;
    border: 1px solid #3d3d3d !important;
  }

  .nutrition-goals-stat .label {
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .nutrition-goals-stat .value {
    color: #ffffff;
    font-weight: 700;
    line-height: 1.1;
    font-size: 1.35rem;
  }

  @media (max-width: 575.98px) {
    .nutrition-goals-stat .value {
      font-size: 1.2rem;
    }
  }
`;

const ManageClientPrograms = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // overview, assign-program, create-program, browse-programs, nutrition
  const [clientInfo, setClientInfo] = useState(null);
  
  // Programs
  const [assignedPrograms, setAssignedPrograms] = useState([]); // Trainer-assigned programs
  const [clientPrograms, setClientPrograms] = useState([]); // Client's self-created programs
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [allTrainerPrograms, setAllTrainerPrograms] = useState([]); // All programs including from other clients
  const [selectedProgramToAssign, setSelectedProgramToAssign] = useState('');
  const [programSearchQuery, setProgramSearchQuery] = useState('');
  const [programPage, setProgramPage] = useState(1);
  const [programTotalPages, setProgramTotalPages] = useState(1);
  const [programAssignmentFilter, setProgramAssignmentFilter] = useState('all');
  
  // Program viewing/editing
  const [viewingProgram, setViewingProgram] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  
  // Exercises for program creation
  const [allExercises, setAllExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [deleteExerciseModal, setDeleteExerciseModal] = useState({ show: false, exerciseId: null, exerciseName: '' });
  const [editExerciseModal, setEditExerciseModal] = useState({ show: false, exerciseId: null, name: '', muscle_group: '', category: 'strength', equipment: '', instructions: '' });
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [customExerciseSearch, setCustomExerciseSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseToAdd, setExerciseToAdd] = useState({ sets: 3, reps: '', rpe: '', type: 'reps' });
  
  // Custom program creation (same as CreatePrograms.jsx)
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
    status: 'draft',
    is_client_specific: true // Flag to indicate this is a client-specific program
  });
  
  const [workoutSessions, setWorkoutSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState({ 
    name: '', 
    description: '', 
    exercises: [],
    week_number: 1,
    day_number: 1
  });
  
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscle_group: '',
    category: 'strength',
    equipment: '',
    instructions: ''
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [isEditingSession, setIsEditingSession] = useState(false);
  const [editingSessionIndex, setEditingSessionIndex] = useState(null);
  
  // Function to view/edit program
  const handleViewProgram = async (program) => {
    try {
      setLoading(true);
      
      // For custom programs (those created by trainers), use the custom endpoint
      let response;
      try {
        response = await APIClient.get(`${BACKEND_ROUTES_API}GetCustomProgramDetails.php?programId=${program.id}`);
      } catch (error) {
        // If custom endpoint fails, fall back to basic program info
        console.warn('Custom program details fetch failed, using basic info:', error);
        response = { success: true, program: program };
      }
      
      if (response.success) {
        setViewingProgram(response.program);
      } else {
        // If the program details endpoint doesn't work for custom programs,
        // just show the basic program info
        setViewingProgram(program);
      }
      
      setShowProgramModal(true);
    } catch (error) {
      console.error('Error fetching program details:', error);
      // Show basic program info if detailed fetch fails
      setViewingProgram(program);
      setShowProgramModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditProgram = async (programId) => {
    try {
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetCustomProgramDetails.php?programId=${programId}`);
      if (response.success && response.program) {
        setProgramPackage({
          title: response.program.title || '',
          description: response.program.description || '',
          category: response.program.category || 'General Fitness',
          difficulty_level: response.program.difficulty_level || 'beginner',
          duration_weeks: response.program.duration_weeks || 4
        });
        setWorkoutSessions(response.program.sessions || []);
        setEditingProgramId(response.program.id);
        setActiveView('create-program');
        window.scrollTo(0, 0);
      } else {
         showToast('Failed to load program details for editing', 'error');
      }
    } catch (err) {
      console.error('Error fetching program details:', err);
      showToast('Error loading program for editing', 'error');
    }
  };

  const handleDeleteProgram = (programId) => {
    setDeleteProgramModal({ show: true, programId });
  };
  
  const executeDeleteProgram = async () => {
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}DeleteTrainerProgram.php`, { 
        program_id: deleteProgramModal.programId 
      });
      if (response.success) {
        showToast('Program deleted successfully', 'success');
        setDeleteProgramModal({ show: false, programId: null });
        if (typeof fetchAvailablePrograms === 'function') {
            fetchAvailablePrograms(1, programSearchQuery);
        } else {
            fetchClientData();
        }
      } else {
        showToast(response.message || 'Error deleting program', 'error');
      }
    } catch (err) {
      console.error('Error deleting program:', err);
      showToast('Error deleting program', 'error');
    }
  };

  // Meals
  const [nutritionGoal, setNutritionGoal] = useState(null); // Trainer-assigned goal
  const [selfNutritionGoal, setSelfNutritionGoal] = useState(null); // Client's self-created goal
  const [nutritionTab, setNutritionTab] = useState('trainer'); // 'trainer' or 'self'
  const [programTab, setProgramTab] = useState('trainer'); // 'trainer' or 'self' - trainer assignments as primary
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [showCustomMealTypeModal, setShowCustomMealTypeModal] = useState(false);
  const [unassignProgramModal, setUnassignProgramModal] = useState({ show: false, assignmentId: null });
  const [deleteMealModal, setDeleteMealModal] = useState({ show: false, mealId: null });
  const [deleteMealTypeModal, setDeleteMealTypeModal] = useState({ show: false, mealType: '' });
  const [deleteCustomFoodModal, setDeleteCustomFoodModal] = useState({ show: false, foodId: null });
  const [deleteProgramModal, setDeleteProgramModal] = useState({ show: false, programId: null });
  const [customMealTypes, setCustomMealTypes] = useState(['breakfast', 'lunch', 'dinner', 'snack']); // Customizable
  const [newMealType, setNewMealType] = useState('');
  const [trainerCustomFoods, setTrainerCustomFoods] = useState([]);
  const [customFoodForm, setCustomFoodForm] = useState({
    name: '',
    brand: '',
    serving_size: 100,
    serving_unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    portions: []
  });
  const [currentMeal, setCurrentMeal] = useState({
    day_of_week: 1,
    meal_type: 'breakfast',
    food_items: [],
    notes: ''
  });
  const [mealSearchQuery, setMealSearchQuery] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resultsFor, setResultsFor] = useState('');
  const [availablePortions, setAvailablePortions] = useState([]);
  const [baseNutrition, setBaseNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    serving_size: 0
  });
  const [goalForm, setGoalForm] = useState({
    goal_type: 'daily',
    target_calories: '',
    target_protein: '',
    target_carbs: '',
    target_fat: ''
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Date formatting helper for initial state
  const getDaysAgoDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };
  
  const [analyticsStartDate, setAnalyticsStartDate] = useState(getDaysAgoDate(90));
  const [analyticsEndDate, setAnalyticsEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [analyticsActiveTab, setAnalyticsActiveTab] = useState('overview');
  
  const categories = ['Strength', 'Cardio', 'Hybrid', 'Weight Loss', 'Muscle Building', 'Endurance', 'Flexibility', 'General Fitness'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // mealTypes is now customMealTypes state
  
  useEffect(() => {
    fetchClientData();
    fetchExercises();
    fetchAllTrainerPrograms();
    fetchTrainerCustomFoods();
  }, [clientId]);
  
  useEffect(() => {
    if (activeView === 'analytics' && clientId) {
      fetchAnalytics();
    }
  }, [activeView, clientId, analyticsStartDate, analyticsEndDate]);
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };
  
  // Debug function to create coaching relationship
  const createCoachingRelationship = async () => {
    try {
      console.log('[DEBUG_MANAGE_CLIENT] Creating coaching relationship for clientId:', clientId);
      const response = await APIClient.post(`${BACKEND_ROUTES_API}DebugClients.php`, {
        trainee_id: clientId
      });
      
      console.log('[DEBUG_MANAGE_CLIENT] Create relationship response:', response);
      
      if (response.success) {
        showToast('Coaching relationship created successfully!', 'success');
        // Retry fetching client data
        setTimeout(() => fetchClientData(), 1000);
      } else {
        showToast(response.message || 'Failed to create relationship', 'error');
      }
    } catch (error) {
      console.error('[DEBUG_MANAGE_CLIENT] Error creating relationship:', error);
      showToast('Error creating coaching relationship', 'error');
    }
  };
  
  
  const fetchAvailablePrograms = async (page = programPage, search = programSearchQuery, filter = programAssignmentFilter) => {
    console.log('[DEBUG_MANAGE_CLIENT] Fetching available programs...', { page, search, filter });
    try {
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerPrograms.php?page=${page}&limit=6&client_id=${clientId}&assignment_filter=${filter}${search ? '&search=' + encodeURIComponent(search) : ''}`);
      if (response.success) {
        setAvailablePrograms(response.programs || []);
        if (response.pagination) {
          setProgramTotalPages(response.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('[DEBUG_MANAGE_CLIENT] Available programs request failed:', err);
    }
  };

  useEffect(() => {
    if (activeView === 'assign-program') {
      fetchAvailablePrograms(programPage, programSearchQuery, programAssignmentFilter);
    }
  }, [programPage, programAssignmentFilter, activeView]);

  const fetchClientData = async () => {
    console.log('[DEBUG_MANAGE_CLIENT] fetchClientData called for clientId:', clientId);
    
    try {
      setLoading(true);
      
      // Fetch client info
      const url = `${BACKEND_ROUTES_API}GetClientInfo.php?client_id=${clientId}`;
      console.log('[DEBUG_MANAGE_CLIENT] Fetching client info from:', url);
      
      let clientResponse;
      try {
        clientResponse = await APIClient.get(url);
        console.log('[DEBUG_MANAGE_CLIENT] Client info response:', clientResponse);
      } catch (clientError) {
        console.error('[DEBUG_MANAGE_CLIENT] Client info request failed:', clientError);
        throw new Error(`Client info failed: ${clientError.message}`);
      }
      
      if (clientResponse.success) {
        console.log('[DEBUG_MANAGE_CLIENT] Client info received successfully:', clientResponse.client);
        setClientInfo(clientResponse.client);
      } else {
        // Client not found - show helpful error
        console.error('[DEBUG_MANAGE_CLIENT] Client not found:', clientResponse);
        showToast(`Client not found. ${clientResponse.message || ''}`, 'error');
        if (clientResponse.debug) {
          console.error('[DEBUG_MANAGE_CLIENT] Debug info:', clientResponse.debug);
        }
        return;
      }
      
      // Fetch assigned programs
      console.log('[DEBUG_MANAGE_CLIENT] Fetching assigned programs...');
      try {
        const assignedResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetClientAssignedPrograms.php?client_id=${clientId}`);
        console.log('[DEBUG_MANAGE_CLIENT] Assigned programs response:', assignedResponse);
        if (assignedResponse.success) {
          setAssignedPrograms(assignedResponse.programs || []);
        } else {
          console.warn('[DEBUG_MANAGE_CLIENT] Assigned programs request unsuccessful:', assignedResponse.message);
        }
      } catch (assignedError) {
        console.error('[DEBUG_MANAGE_CLIENT] Assigned programs request failed:', assignedError);
        // Don't throw, continue with other requests
      }
      
      // Fetch client's self-created programs
      console.log('[DEBUG_MANAGE_CLIENT] Fetching client self-created programs...');
      try {
        const clientProgramsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetClientPrograms.php?client_id=${clientId}`);
        console.log('[DEBUG_MANAGE_CLIENT] Client programs response:', clientProgramsResponse);
        if (clientProgramsResponse.success) {
          setClientPrograms(clientProgramsResponse.programs || []);
        } else {
          console.warn('[DEBUG_MANAGE_CLIENT] Client programs request unsuccessful:', clientProgramsResponse.message);
        }
      } catch (clientProgramsError) {
        console.error('[DEBUG_MANAGE_CLIENT] Client programs request failed:', clientProgramsError);
        // Don't throw, continue with other requests
      }
      
      // Fetch available programs to assign
      await fetchAvailablePrograms();
      
      // Fetch client nutrition goal
      console.log('[DEBUG_MANAGE_CLIENT] Fetching nutrition goal...');
      try {
        const goalResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetClientNutritionGoal.php?client_id=${clientId}`);
        console.log('[DEBUG_MANAGE_CLIENT] Nutrition goal response:', goalResponse);
        if (goalResponse.success) {
          setNutritionGoal(goalResponse.trainer_goal);
          setSelfNutritionGoal(goalResponse.self_goal);
        } else {
          console.warn('[DEBUG_MANAGE_CLIENT] Nutrition goal request unsuccessful:', goalResponse.message);
        }
      } catch (goalError) {
        console.error('[DEBUG_MANAGE_CLIENT] Nutrition goal request failed:', goalError);
        // Don't throw, continue with other requests
      }
      
      // Fetch weekly meal plan
      console.log('[DEBUG_MANAGE_CLIENT] Fetching weekly meals...');
      try {
        const mealsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetClientWeeklyMeals.php?client_id=${clientId}`);
        console.log('[DEBUG_MANAGE_CLIENT] Weekly meals response:', mealsResponse);
        if (mealsResponse.success) {
          setWeeklyMeals(mealsResponse.meals || []);
        } else {
          console.warn('[DEBUG_MANAGE_CLIENT] Weekly meals request unsuccessful:', mealsResponse.message);
        }
      } catch (mealsError) {
        console.error('[DEBUG_MANAGE_CLIENT] Weekly meals request failed:', mealsError);
        // Don't throw, continue with other requests
      }
      
    } catch (error) {
      console.error('[DEBUG_MANAGE_CLIENT] Error in fetchClientData:', error);
      console.error('[DEBUG_MANAGE_CLIENT] Error message:', error.message);
      console.error('[DEBUG_MANAGE_CLIENT] Error stack:', error.stack);
      
      // Check if it's a 404 error
      if (error.message && error.message.includes('404')) {
        console.error('[DEBUG_MANAGE_CLIENT] 404 error detected');
        showToast('Client not found.', 'error');
      } else if (error.message && error.message.includes('403')) {
        console.error('[DEBUG_MANAGE_CLIENT] 403 error detected');
        showToast('You do not have access to this client', 'error');
      } else {
        console.error('[DEBUG_MANAGE_CLIENT] Other error detected');
        showToast(`Error loading client data: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllTrainerPrograms = async () => {
    try {
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerPrograms.php`);
      if (response.success) {
        setAllTrainerPrograms(response.programs || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };
  
  const fetchExercises = async () => {
    try {
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetWorkoutData.php`);
      if (data.success) {
        const exercises = data.exercises || [];
        const uniqueExercises = [];
        const seenNames = new Set();
        
        exercises.forEach(exercise => {
          const key = `${exercise.name.toLowerCase()}-${exercise.is_custom}`;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            uniqueExercises.push(exercise);
          }
        });
        
        setAllExercises(uniqueExercises);
      }
    } catch (err) {
      showToast('Failed to load exercises', 'error');
    }
  };
  
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      const params = new URLSearchParams({
        trainee_id: clientId,
        start_date: analyticsStartDate,
        end_date: analyticsEndDate,
      });

      const response = await APIClient.get(
        `${BACKEND_ROUTES_API}GetTraineeAnalytics.php?${params.toString()}`
      );

      if (response.success) {
        console.log('Analytics data received:', response.analytics);
        setAnalytics(response.analytics);
      } else {
        showToast('Failed to load analytics', 'error');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      showToast('Error loading analytics', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  const formatVolume = (vol) => {
    const num = Number(vol || 0);
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString();
  };

  const formatDecimal = (num, decimals = 1) => {
    if (!num) return '0';
    return parseFloat(num).toFixed(decimals);
  };
  
  const handleAssignProgram = async () => {
    console.log('[DEBUG_MANAGE_CLIENT] handleAssignProgram called');
    console.log('[DEBUG_MANAGE_CLIENT] selectedProgramToAssign:', selectedProgramToAssign);
    console.log('[DEBUG_MANAGE_CLIENT] clientId:', clientId);
    
    if (!selectedProgramToAssign) {
      console.log('[DEBUG_MANAGE_CLIENT] No program selected');
      showToast('Please select a program', 'warning');
      return;
    }
    
    try {
      console.log('[DEBUG_MANAGE_CLIENT] Sending assign program request...');
      const response = await APIClient.post(`${BACKEND_ROUTES_API}AssignProgramToClient.php`, {
        clientId: clientId,
        programId: selectedProgramToAssign
      });
      
      console.log('[DEBUG_MANAGE_CLIENT] Assign program response:', response);
      
      if (response.success) {
        console.log('[DEBUG_MANAGE_CLIENT] Program assigned successfully');
        showToast('Program assigned successfully!', 'success');
        setActiveView('overview'); 
        setProgramTab('trainer'); // Switch to trainer tab to show the newly assigned program
        setSelectedProgramToAssign('');
        fetchClientData();
      } else {
        console.log('[DEBUG_MANAGE_CLIENT] Assign program failed:', response.message);
        showToast(response.message || 'Failed to assign program', 'error');
      }
    } catch (error) {
      console.error('[DEBUG_MANAGE_CLIENT] Error assigning program:', error);
      showToast('Error assigning program', 'error');
    }
  };
  
  const handleUnassignProgram = (assignmentId) => {
    setUnassignProgramModal({ show: true, assignmentId });
  };

  const executeUnassignProgram = async () => {
    if (!unassignProgramModal.assignmentId) return;

    try {
      const response = await APIClient.delete(`${BACKEND_ROUTES_API}UnassignProgramFromClient.php`, {
        assignment_id: unassignProgramModal.assignmentId
      });
      
      if (response.success) {
        showToast('Program removed successfully!', 'success');
        setUnassignProgramModal({ show: false, assignmentId: null });
        fetchClientData();
      } else {
        showToast(response.message || 'Failed to remove program', 'error');
      }
    } catch (error) {
      console.error('Error removing program:', error);
      showToast('Error removing program', 'error');
    }
  };
  
  const handleSetNutritionGoal = async (e) => {
    e.preventDefault();
    await saveNutritionGoal();
  };
  
  const handleSaveMeal = async (e) => {
    e.preventDefault();
    console.log('[DEBUG_MANAGE_CLIENT] handleSaveMeal called');
    console.log('[DEBUG_MANAGE_CLIENT] currentMeal:', currentMeal);
    console.log('[DEBUG_MANAGE_CLIENT] clientId:', clientId);
    
    try {
      console.log('[DEBUG_MANAGE_CLIENT] Sending save meal request...');
      const response = await APIClient.post(`${BACKEND_ROUTES_API}SetClientWeeklyMeals.php`, {
        client_id: clientId,
        day_of_week: currentMeal.day_of_week,
        meal_type: currentMeal.meal_type,
        food_items: currentMeal.food_items,
        notes: currentMeal.notes
      });
      
      console.log('[DEBUG_MANAGE_CLIENT] Save meal response:', response);
      
      if (response.success) {
        console.log('[DEBUG_MANAGE_CLIENT] Meal saved successfully');
        showToast('Meal saved successfully!', 'success');
        setShowMealModal(false);
        setCurrentMeal({
          day_of_week: 1,
          meal_type: 'breakfast',
          food_items: [],
          notes: ''
        });
        fetchClientData();
      } else {
        console.log('[DEBUG_MANAGE_CLIENT] Save meal failed:', response.message);
        showToast(response.message || 'Failed to save meal', 'error');
      }
    } catch (error) {
      console.error('[DEBUG_MANAGE_CLIENT] Error saving meal:', error);
      showToast('Error saving meal', 'error');
    }
  };
  
  const handleDeleteMeal = (mealId) => {
    setDeleteMealModal({ show: true, mealId });
  };

  const confirmDeleteMeal = async () => {
    if (!deleteMealModal.mealId) return;
    
    try {
      const response = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteClientMeal.php`, {
        meal_id: deleteMealModal.mealId
      });
      
      if (response.success) {
        showToast('Meal deleted successfully!', 'success');
        fetchClientData();
      } else {
        showToast(response.message || 'Failed to delete meal', 'error');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      showToast('Error deleting meal', 'error');
    } finally {
      setDeleteMealModal({ show: false, mealId: null });
    }
  };
  
  const openMealModal = (dayOfWeek, mealType, existingMeal = null) => {
    if (existingMeal) {
      setCurrentMeal({
        id: existingMeal.id,
        day_of_week: existingMeal.day_of_week,
        meal_type: existingMeal.meal_type,
        food_items: existingMeal.food_items || [],
        notes: existingMeal.notes || ''
      });
    } else {
      setCurrentMeal({
        day_of_week: dayOfWeek,
        meal_type: mealType,
        food_items: [],
        notes: ''
      });
    }
    setShowMealModal(true);
  };
  
  const addFoodToMeal = (foodItem) => {
    setCurrentMeal(prev => ({
      ...prev,
      food_items: [...prev.food_items, foodItem]
    }));
  };
  
  const removeFoodFromMeal = (index) => {
    setCurrentMeal(prev => ({
      ...prev,
      food_items: prev.food_items.filter((_, i) => i !== index)
    }));
  };
  
  const searchFoods = async () => {
    if (!mealSearchQuery || mealSearchQuery.length < 2) return;
    
    setSearching(true);
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}SearchFoods.php?query=${encodeURIComponent(mealSearchQuery)}&source=all`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const allFoods = [
          ...(data.results.usda_foods || []).map(f => ({ ...f, source: 'usda' })),
          ...(data.results.custom_foods || []).map(f => ({ ...f, source: f.source || 'custom' }))
        ];
        setFoodSearchResults(allFoods);
        setResultsFor(mealSearchQuery);
      }
    } catch (error) {
      console.error('Error searching foods:', error);
    } finally {
      setSearching(false);
    }
  };
  
  const selectFood = async (food) => {
    // Extract portions if available
    let portions = food.food_portions || food.portions || food.foodPortions || [];
    setAvailablePortions(portions);
    
    // Calculate base nutrition per 100g
    let calories, protein, carbs, fat;
    
    if (food.source === 'usda') {
      const nutrients = food.nutrients || {};
      calories = parseFloat(nutrients.calories || 0);
      protein = parseFloat(nutrients.protein || 0);
      carbs = parseFloat(nutrients.carbs || 0);
      fat = parseFloat(nutrients.fat || 0);
    } else {
      calories = parseFloat(food.calories || 0);
      protein = parseFloat(food.protein || 0);
      carbs = parseFloat(food.carbs || 0);
      fat = parseFloat(food.fat || 0);
    }
    
    setBaseNutrition({
      calories,
      protein,
      carbs,
      fat,
      serving_size: food.serving_size || 100
    });
    
    // Set initial food item
    const foodItem = {
      food_id: food.fdc_id || food.id,
      food_name: food.description || food.name,
      source: food.source,
      serving_size: food.serving_size || 100,
      serving_unit: 'g',
      quantity: 100,
      calories: calories.toFixed(1),
      protein: protein.toFixed(1),
      carbs: carbs.toFixed(1),
      fat: fat.toFixed(1),
      base_calories: calories,
      base_protein: protein,
      base_carbs: carbs,
      base_fat: fat,
      available_portions: portions || []
    };
    
    addFoodToMeal(foodItem);
    setMealSearchQuery('');
    setFoodSearchResults([]);
  };
  
  const handleQuantityChange = (newQuantity, foodItemIndex) => {
    const updatedFoodItems = [...currentMeal.food_items];
    const foodItem = updatedFoodItems[foodItemIndex];
    let quantity = parseFloat(newQuantity) || 0;
    
    if (foodItem.serving_unit === 'g' || foodItem.serving_unit === 'ml') {
      quantity = Math.max(0, Math.round(quantity));
    }
    
    let multiplier;
    if (foodItem.serving_unit === 'g' || foodItem.serving_unit === 'ml') {
      multiplier = quantity / 100;
    } else if (foodItem.serving_unit.startsWith('portion_') && foodItem.portion_gram_weight) {
      multiplier = (foodItem.portion_gram_weight * quantity) / 100;
    } else {
      multiplier = quantity;
    }
    
    foodItem.quantity = quantity;
    foodItem.calories = (foodItem.base_calories * multiplier).toFixed(1);
    foodItem.protein = (foodItem.base_protein * multiplier).toFixed(1);
    foodItem.carbs = (foodItem.base_carbs * multiplier).toFixed(1);
    foodItem.fat = (foodItem.base_fat * multiplier).toFixed(1);
    
    setCurrentMeal(prev => ({
      ...prev,
      food_items: updatedFoodItems
    }));
  };

  const handleMeasurementTypeChange = (newUnit, foodItemIndex) => {
    const updatedFoodItems = [...currentMeal.food_items];
    const foodItem = updatedFoodItems[foodItemIndex];
    
    let defaultQuantity = 1;
    let portionGramWeight = null;
    let calories, protein, carbs, fat;
    
    if (newUnit === 'g' || newUnit === 'ml') {
      const multiplier = 100 / 100; // per 100g
      calories = (foodItem.base_calories * multiplier).toFixed(1);
      protein = (foodItem.base_protein * multiplier).toFixed(1);
      carbs = (foodItem.base_carbs * multiplier).toFixed(1);
      fat = (foodItem.base_fat * multiplier).toFixed(1);
      defaultQuantity = 100;
    } else if (newUnit.startsWith('portion_')) {
      const portionIndex = parseInt(newUnit.split('_')[1]);
      const portion = foodItem.available_portions[portionIndex];
      portionGramWeight = portion.gramWeight || portion.gram_weight || 100;
      const multiplier = portionGramWeight / 100;
      calories = (foodItem.base_calories * multiplier).toFixed(1);
      protein = (foodItem.base_protein * multiplier).toFixed(1);
      carbs = (foodItem.base_carbs * multiplier).toFixed(1);
      fat = (foodItem.base_fat * multiplier).toFixed(1);
    }
    
    foodItem.serving_unit = newUnit;
    foodItem.quantity = defaultQuantity;
    foodItem.portion_gram_weight = portionGramWeight;
    foodItem.calories = calories;
    foodItem.protein = protein;
    foodItem.carbs = carbs;
    foodItem.fat = fat;
    
    setCurrentMeal(prev => ({
      ...prev,
      food_items: updatedFoodItems
    }));
  };
  
  const fetchTrainerCustomFoods = async () => {
    try {
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerCustomFoods.php`);
      if (response.success) {
        setTrainerCustomFoods(response.foods || []);
      }
    } catch (error) {
      console.error('Error fetching custom foods:', error);
    }
  };
  
  const handleSaveCustomFood = async (e) => {
    e.preventDefault();
    try {
      const endpoint = customFoodForm.id 
        ? `${BACKEND_ROUTES_API}UpdateTrainerCustomFood.php`
        : `${BACKEND_ROUTES_API}CreateTrainerCustomFood.php`;
        
      const response = await APIClient.post(endpoint, customFoodForm);
      if (response.success) {
        showToast(customFoodForm.id ? 'Custom food updated!' : 'Custom food created!', 'success');
        setShowCustomFoodModal(false);
        setCustomFoodForm({
          name: '',
          brand: '',
          serving_size: 100,
          serving_unit: 'g',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          portions: []
        });
        fetchTrainerCustomFoods();
      } else {
        showToast(response.message || 'Failed to save custom food', 'error');
      }
    } catch (error) {
      console.error('Error saving custom food:', error);
      showToast('Error saving custom food', 'error');
    }
  };
  
  const handleDeleteCustomFood = (foodId) => {
    setDeleteCustomFoodModal({ show: true, foodId });
  };

  const confirmDeleteCustomFood = async () => {
    if (!deleteCustomFoodModal.foodId) return;
    try {
      const response = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteTrainerCustomFood.php`, { food_id: deleteCustomFoodModal.foodId });
      if (response.success) {
        showToast('Custom food deleted!', 'success');
        fetchTrainerCustomFoods();
      } else {
        showToast(response.message || 'Failed to delete', 'error');
      }
    } catch (error) {
      console.error('Error deleting custom food:', error);
      showToast('Error deleting custom food', 'error');
    } finally {
      setDeleteCustomFoodModal({ show: false, foodId: null });
    }
  };
  
  const handleAddMealType = () => {
    if (newMealType && !customMealTypes.includes(newMealType.toLowerCase())) {
      setCustomMealTypes([...customMealTypes, newMealType.toLowerCase()]);
      setNewMealType('');
      setShowCustomMealTypeModal(false);
      showToast('Meal type added!', 'success');
    }
  };
  
  const handleRemoveMealType = (mealType) => {
    if (customMealTypes.length <= 1) {
      showToast('Must have at least one meal type', 'error');
      return;
    }
    setDeleteMealTypeModal({ show: true, mealType });
  };

  const confirmRemoveMealType = () => {
    if (!deleteMealTypeModal.mealType) return;
    
    setCustomMealTypes(customMealTypes.filter(mt => mt !== deleteMealTypeModal.mealType));
    showToast('Meal type removed!', 'success');
    setDeleteMealTypeModal({ show: false, mealType: '' });
  };
  
  const getMealForDayAndType = (dayOfWeek, mealType) => {
    return weeklyMeals.find(m => m.day_of_week === dayOfWeek && m.meal_type === mealType);
  };

  const saveNutritionGoal = async () => {
    console.log('[DEBUG_MANAGE_CLIENT] saveNutritionGoal called');
    console.log('[DEBUG_MANAGE_CLIENT] clientId:', clientId);
    console.log('[DEBUG_MANAGE_CLIENT] goalForm:', goalForm);
    
    try {
      console.log('[DEBUG_MANAGE_CLIENT] Sending nutrition goal request...');
      const response = await APIClient.post(`${BACKEND_ROUTES_API}SetClientNutritionGoal.php`, {
        client_id: clientId,
        ...goalForm
      });
      
      console.log('[DEBUG_MANAGE_CLIENT] Nutrition goal response:', response);
      
      if (response.success) {
        console.log('[DEBUG_MANAGE_CLIENT] Nutrition goal set successfully');
        showToast('Nutrition goal set successfully!', 'success');
        setShowGoalModal(false);
        fetchClientData();
      } else {
        console.log('[DEBUG_MANAGE_CLIENT] Nutrition goal failed:', response.message);
        showToast(response.message || 'Failed to set goal', 'error');
      }
    } catch (error) {
      console.error('[DEBUG_MANAGE_CLIENT] Error setting goal:', error);
      showToast('Error setting goal', 'error');
    }
  };
  
  // Program creation functions (same as CreatePrograms.jsx)
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
  
  const openExerciseModal = (exercise) => {
    setSelectedExercise(exercise);
    setExerciseToAdd({ sets: 3, reps: '10-12', rpe: '7-8', type: 'reps' });
    setShowExerciseModal(true);
  };
  
  const addExerciseFromModal = () => {
    if (!selectedExercise || !exerciseToAdd.sets || !exerciseToAdd.reps) {
      showToast('Please fill in all exercise details', 'warning');
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
  
  const filteredExercises = React.useMemo(() => {
    return allExercises
      .filter(exercise => exercise.is_custom == 0)
      .filter(exercise =>
        exercise.name?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.category?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.muscle_group?.toLowerCase().includes(exerciseSearch.toLowerCase())
      );
  }, [allExercises, exerciseSearch]);

  const filteredCustomExercises = React.useMemo(() => {
    return allExercises
      .filter(exercise => exercise.is_custom == 1)
      .filter(exercise =>
        exercise.name?.toLowerCase().includes(customExerciseSearch.toLowerCase()) ||
        exercise.category?.toLowerCase().includes(customExerciseSearch.toLowerCase()) ||
        exercise.muscle_group?.toLowerCase().includes(customExerciseSearch.toLowerCase())
      );
  }, [allExercises, customExerciseSearch]);
  
  const filteredPrograms = React.useMemo(() => {
    if (!programSearchQuery) return allTrainerPrograms;
    const query = programSearchQuery.toLowerCase();
    return allTrainerPrograms.filter(program =>
      program.title?.toLowerCase().includes(query) ||
      program.description?.toLowerCase().includes(query) ||
      program.category?.toLowerCase().includes(query)
    );
  }, [allTrainerPrograms, programSearchQuery]);
  
  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    setSelectedExercise(null);
    setExerciseToAdd({ sets: 3, reps: '10-12', rpe: '7-8', type: 'reps' });
  };
  
  const saveCurrentSession = () => {
    if (!currentSession.name || currentSession.exercises.length === 0) {
      showToast('Please add a session name and at least one exercise', 'warning');
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
    showToast(isEditingSession ? 'Session updated!' : 'Session added!', 'success');
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
  
  const saveCustomProgram = async () => {
    console.log('[DEBUG_MANAGE_CLIENT] saveCustomProgram called');
    console.log('[DEBUG_MANAGE_CLIENT] programPackage:', programPackage);
    console.log('[DEBUG_MANAGE_CLIENT] workoutSessions:', workoutSessions);
    console.log('[DEBUG_MANAGE_CLIENT] clientId:', clientId);
    
    if (!programPackage.title) {
      console.log('[DEBUG_MANAGE_CLIENT] No program title provided');
      showToast('Please enter a program title', 'warning');
      return;
    }
    
    if (workoutSessions.length === 0) {
      console.log('[DEBUG_MANAGE_CLIENT] No workout sessions provided');
      showToast('Please add at least one workout session', 'warning');
      return;
    }
    
    try {
      const programData = {
        ...programPackage,
        sessions: workoutSessions,
        client_id: clientId // Link to specific client
      };
      
      console.log('[DEBUG_MANAGE_CLIENT] Sending custom program request with data:', programData);
      let response;
      if (editingProgramId) {
        programData.program_id = editingProgramId;
        response = await APIClient.post(`${BACKEND_ROUTES_API}UpdateClientProgram.php`, programData);
      } else {
        response = await APIClient.post(`${BACKEND_ROUTES_API}CreateClientProgram.php`, programData);
      }
      
      console.log('[DEBUG_MANAGE_CLIENT] Custom program response:', response);
      
      if (response.success) {
        console.log('[DEBUG_MANAGE_CLIENT] Custom program created successfully');
        showToast('Custom program created and assigned!', 'success');
        setActiveView('overview');
        setProgramTab('trainer'); // Switch to trainer tab to show the newly created program
        resetProgramForm();
        fetchClientData();
      } else {
        console.log('[DEBUG_MANAGE_CLIENT] Custom program creation failed:', response.message);
        showToast(response.message || 'Failed to create program', 'error');
      }
    } catch (error) {
      console.error('[DEBUG_MANAGE_CLIENT] Error creating program:', error);
      showToast('Error creating program', 'error');
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
      status: 'draft',
      is_client_specific: true
    });
    setWorkoutSessions([]);
    resetSessionForm();
  };
  
  if (loading) {
    return (
      <TrainerDashboardLayout>
        <div className="container-fluid py-4 px-0">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  // Show error state if client not found (no coaching relationship)
  if (!loading && !clientInfo) {
    return (
      <TrainerDashboardLayout>
        <div className="container-fluid py-4 px-0">
          <div className="text-center py-5">
            <div className="mb-4">
              <i className="bi bi-exclamation-triangle-fill display-1 text-warning"></i>
            </div>
            <h4 className="mb-3">Client Relationship Not Found</h4>
            <p className="text-muted mb-4">
              No active coaching relationship exists between you and client ID {clientId}.
              <br />
              This might happen if the relationship was not properly established.
            </p>
            <div className="d-grid gap-2 d-sm-flex justify-content-center">
              <button 
                className="btn text-nowrap"
                style={{
                  background: 'transparent',
                  border: '2px solid #6b7280',
                  color: '#9ca3af',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.color = '#10b981';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#6b7280';
                  e.target.style.color = '#9ca3af';
                }}
                onClick={() => navigate('/clients')}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Back to Clients
              </button>
              <button 
                className="btn text-nowrap"
                style={{
                  background: '#10b981',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#10b981';
                }}
                onClick={createCoachingRelationship}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Create Coaching Relationship
              </button>
            </div>
            <div className="mt-3">
              <small className="text-muted">
                Creating the relationship will allow you to manage this client's programs and nutrition.
              </small>
            </div>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }
  
  return (
    <TrainerDashboardLayout>
      <style>{styles}</style>
      <div className="container-fluid py-4 px-0" style={{ minHeight: 'calc(100vh - 0px)' }}>
        {/* Header */}
        <div className="d-grid gap-2 mb-4">
          <button 
            className="btn btn-link p-0 text-start text-nowrap"
            style={{ color: '#10b981', textDecoration: 'none', transition: 'color 0.3s ease' }}
            onMouseEnter={(e) => {
              e.target.style.color = '#059669';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#10b981';
            }}
            onClick={() => navigate('/clients')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Clients
          </button>
          <h4 className="mb-0 fs-5 fs-sm-4" style={{ color: '#ffffff' }}>
            Manage Programs & Nutrition for {clientInfo?.full_name || clientInfo?.username}
          </h4>
        </div>
        
        {/* Navigation Tabs */}
        <ul className="nav nav-tabs mb-4 manage-client-nav-tabs" style={{ borderBottom: '2px solid #3d3d3d' }}>
          <li className="nav-item">
            <button 
              className={`manage-client-tab ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <i className="bi bi-grid me-2"></i>
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`manage-client-tab ${activeView === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveView('analytics')}
            >
              <i className="bi bi-graph-up me-2"></i>
              Analytics
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`manage-client-tab ${activeView === 'assign-program' ? 'active' : ''}`}
              onClick={() => setActiveView('assign-program')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Assign Existing Program
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`manage-client-tab ${activeView === 'create-program' ? 'active' : ''}`}
              onClick={() => setActiveView('create-program')}
            >
              <i className="bi bi-plus-square me-2"></i>
              Create Custom Program
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`manage-client-tab ${activeView === 'nutrition' ? 'active' : ''}`}
              onClick={() => setActiveView('nutrition')}
            >
              <i className="bi bi-cup-hot me-2"></i>
              Nutrition Goals
            </button>
          </li>
        </ul>
        
        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div>
            {/* Assigned Programs */}
            <div className="card mb-4" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
              <div className="card-header d-flex justify-content-between align-items-center" style={{ background: '#1a1a1a', borderBottom: '1px solid #3d3d3d' }}>
                <div>
                  <h5 className="mb-0" style={{ color: '#ffffff' }}>Client Programs</h5>
                  <small className="text-muted">Manage training programs for this client</small>
                </div>
              </div>
              <div className="card-body" style={{ background: '#1a1a1a' }}>
                {/* Program Tabs */}
                <ul className="nav nav-pills mb-4 d-grid gap-2 d-sm-flex">
                  <li className="nav-item me-0 me-sm-2">
                    <button 
                      className={`program-pill ${programTab === 'trainer' ? 'active' : ''}`}
                      onClick={() => setProgramTab('trainer')}
                    >
                      <i className="bi bi-person-check me-2"></i>
                      Trainer Assigned ({assignedPrograms.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`program-pill ${programTab === 'self' ? 'active' : ''}`}
                      onClick={() => setProgramTab('self')}
                    >
                      <i className="bi bi-person me-2"></i>
                      Client Created ({clientPrograms.length})
                    </button>
                  </li>
                </ul>

                {/* Trainer Assigned Programs Tab */}
                {programTab === 'trainer' && (
                  <div>
                    {assignedPrograms.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-clipboard-check display-4 mb-3" style={{ color: '#10b981' }}></i>
                        <h6 style={{ color: '#ffffff' }}>No programs assigned yet</h6>
                        <p className="text-muted mb-3">Assign training programs to guide this client's workouts</p>
                        <button 
                          className="btn"
                          style={{
                            background: '#10b981',
                            border: 'none',
                            color: '#ffffff',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#10b981';
                          }}
                          onClick={() => setActiveView('assign-program')}
                        >
                          <i className="bi bi-plus-lg me-1"></i>
                          Assign a Program
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="d-grid gap-2 d-sm-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted">Programs assigned by you as trainer</span>
                          <button 
                            className="btn btn-sm text-nowrap"
                            style={{
                              background: '#10b981',
                              border: 'none',
                              color: '#ffffff',
                              padding: '0.375rem 1rem',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#059669';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#10b981';
                            }}
                            onClick={() => setActiveView('assign-program')}
                          >
                            <i className="bi bi-plus-lg me-1"></i>
                            Assign More
                          </button>
                        </div>
                        <div className="row">
                          {assignedPrograms.map(program => (
                            <div key={program.assignment_id} className="col-md-6 col-lg-4 mb-3">
                              <div className="card h-100" style={{ background: '#252525', border: '1px solid #333333', borderRadius: '12px' }}>
                                <div className="card-body d-flex flex-column p-4">
                                  <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                      <h5 className="fw-bold mb-2 outline-none" style={{ color: '#ffffff', fontSize: '1.2rem' }}>{program.title}</h5>
                                      <span className="badge" style={{ 
                                        background: 'transparent',
                                        color: '#9ca3af', 
                                        border: '1px solid #4b5563', 
                                        padding: '0.4em 0.8em',
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        fontSize: '0.75rem'
                                      }}>
                                        Already Assigned
                                      </span>
                                    </div>
                                    
                                    <div className="dropdown position-relative">
                                      <button 
                                        className="btn btn-link text-muted p-0" 
                                        style={{ color: '#9ca3af', textDecoration: 'none' }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const menu = e.currentTarget.nextElementSibling;
                                          const isShowing = menu.classList.contains('show');
                                          
                                          // Close all other dropdowns
                                          document.querySelectorAll('.program-dropdown-menu.show').forEach(m => m.classList.remove('show'));
                                          
                                          if (!isShowing) {
                                            menu.classList.add('show');
                                            const closeDropdown = (evt) => {
                                              if (menu && !menu.contains(evt.target)) {
                                                menu.classList.remove('show');
                                                document.removeEventListener('click', closeDropdown);
                                              }
                                            };
                                            setTimeout(() => document.addEventListener('click', closeDropdown), 0);
                                          }
                                        }}
                                      >
                                        <i className="bi bi-three-dots-vertical fs-5"></i>
                                      </button>
                                      <ul className="dropdown-menu program-dropdown-menu position-absolute shadow border-0" style={{ 
                                        right: 0, 
                                        top: '100%', 
                                        minWidth: '130px', 
                                        zIndex: 1050,
                                        background: '#f8f9fa',
                                        borderRadius: '12px',
                                        padding: '4px',
                                        overflow: 'hidden'
                                      }}>
                                        <li style={{ margin: 0, padding: 0 }}>
                                          <button 
                                            className="dropdown-item d-flex align-items-center" 
                                            style={{
                                              color: '#ef4444',
                                              borderRadius: '8px',
                                              padding: '8px 12px',
                                              fontWeight: '500',
                                              transition: 'all 0.2s ease',
                                              margin: 0
                                            }}
                                            onMouseEnter={(e) => {
                                              e.target.style.background = '#fee2e2';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.background = 'transparent';
                                            }}
                                            onClick={(e) => { e.stopPropagation(); handleUnassignProgram(program.assignment_id); }}
                                          >
                                            <i className="bi bi-trash3 me-2"></i> Unassign
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  {program.description && (
                                    <p className="text-muted small mb-4" style={{ color: '#9ca3af', minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{program.description}</p>
                                  )}
                                  
                                  <div className="d-flex flex-wrap gap-2 mb-3 mt-auto">
                                    <span className="badge d-flex align-items-center inline-flex" style={{ background: '#374151', color: '#e5e7eb', padding: '0.4em 0.9em', borderRadius: '50rem', fontWeight: '500' }}>
                                      <i className="bi bi-tag" style={{ marginRight: '6px', fontSize: '0.85rem' }}></i> {program.category}
                                    </span>
                                    {program.difficulty_level && (
                                      <span className="badge d-flex align-items-center inline-flex" style={{ background: '#374151', color: '#e5e7eb', padding: '0.4em 0.9em', borderRadius: '50rem', fontWeight: '500' }}>
                                        {program.difficulty_level}
                                      </span>
                                    )}
                                    <span className="badge d-flex align-items-center inline-flex" style={{ background: '#374151', color: '#e5e7eb', padding: '0.4em 0.9em', borderRadius: '50rem', fontWeight: '500' }}>
                                      <i className="bi bi-clock" style={{ marginRight: '6px', fontSize: '0.85rem' }}></i> {program.duration_weeks} WEEKS
                                    </span>
                                  </div>
                                  
                                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top" style={{ borderColor: '#333333' }}>
                                    <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '500' }}>
                                      <i className="bi bi-calendar-check me-2"></i>
                                      {new Date(program.assigned_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                    <button 
                                      className="btn btn-sm text-white"
                                      style={{ 
                                        background: '#000000',
                                        border: '1px solid #111111',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1rem',
                                        fontWeight: '600',
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.target.style.background = '#1a1a1a'}
                                      onMouseLeave={(e) => e.target.style.background = '#000000'}
                                      onClick={(e) => { e.stopPropagation(); handleViewProgram(program); }}
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Client Created Programs Tab */}
                {programTab === 'self' && (
                  <div>
                    {clientPrograms.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-person-workspace display-4 mb-3" style={{ color: '#6b7280' }}></i>
                        <h6 style={{ color: '#ffffff' }}>No self-created programs</h6>
                        <p className="text-muted">Programs created by the client will appear here</p>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-3">
                          <span className="text-muted">Programs created by the client independently</span>
                        </div>
                        <div className="row">
                          {clientPrograms.map(program => (
                            <div key={program.id} className="col-md-6 col-lg-4 mb-3">
                              <div className="card card-hover h-100" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                                <div className="card-body d-flex flex-column" style={{ background: '#2d2d2d' }}>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="card-title mb-0" style={{ color: '#ffffff' }}>{program.title}</h6>
                                    <span className="badge" style={{ background: '#6b7280', color: '#ffffff' }}>SELF-CREATED</span>
                                  </div>
                                  <p className="text-muted small mb-2">{program.description}</p>
                                  <div className="d-flex flex-wrap gap-1 mb-2">
                                    <span className="badge" style={{ background: '#ffffff', color: '#000000' }}>{program.category || 'Custom'}</span>
                                    <span className="badge" style={{ background: '#ffffff', color: '#000000' }}>{program.duration_weeks || 'Flexible'} weeks</span>
                                  </div>
                                  <small className="text-muted">
                                    <i className="bi bi-calendar3 me-1"></i>
                                    Created {new Date(program.created_at).toLocaleDateString()}
                                  </small>
                                  <div className="mt-auto pt-3">
                                    <button 
                                      className="btn btn-sm w-100"
                                      style={{ 
                                        background: 'transparent',
                                        border: '2px solid #10b981',
                                        color: '#10b981',
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                      }}
                                      onClick={() => handleViewProgram(program)}
                                    >
                                      <i className="bi bi-eye me-1"></i>
                                      View Program
                                    </button>
                                  </div>
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
            </div>
            
            {/* Nutrition Overview */}
            <div className="card" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
              <div className="card-header d-grid nutrition-goals-header d-sm-flex justify-content-between align-items-center" style={{ background: '#1a1a1a', borderBottom: '1px solid #3d3d3d' }}>
                <h5 className="mb-0" style={{ color: '#ffffff' }}>Nutrition Goals</h5>
                <button 
                  className="btn btn-sm text-nowrap nutrition-goals-btn"
                  onClick={() => {
                    if (nutritionGoal) {
                      setGoalForm({
                        goal_type: nutritionGoal.goal_type || 'daily',
                        target_calories: nutritionGoal.target_calories || '',
                        target_protein: nutritionGoal.target_protein || '',
                        target_carbs: nutritionGoal.target_carbs || '',
                        target_fat: nutritionGoal.target_fat || ''
                      });
                    }
                    setShowGoalModal(true);
                  }}
                >
                  {nutritionGoal ? 'Edit Goals' : 'Set Goals'}
                </button>
              </div>
              <div className="card-body" style={{ background: '#1a1a1a' }}>
                {nutritionGoal ? (
                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <div className="card nutrition-goals-stat h-100">
                        <div className="card-body text-center">
                          <div className="text-muted small label">CALORIES</div>
                          <div className="value mt-1">{nutritionGoal.target_calories}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="card nutrition-goals-stat h-100">
                        <div className="card-body text-center">
                          <div className="text-muted small label">PROTEIN</div>
                          <div className="value mt-1">{nutritionGoal.target_protein}g</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="card nutrition-goals-stat h-100">
                        <div className="card-body text-center">
                          <div className="text-muted small label">CARBS</div>
                          <div className="value mt-1">{nutritionGoal.target_carbs}g</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="card nutrition-goals-stat h-100">
                        <div className="card-body text-center">
                          <div className="text-muted small label">FAT</div>
                          <div className="value mt-1">{nutritionGoal.target_fat}g</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No nutrition goals set for this client</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeView === 'analytics' && (
          <div>
            {/* Note of the day Assigned Together */}
            {clientInfo?.joined_date && (
              <div className="alert mb-3" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <i className="bi bi-clock-history me-2"></i>
                Started Coaching on: <strong>{new Date(clientInfo.joined_date).toLocaleDateString()}</strong>
              </div>
            )}
            
            {/* Specific Date Range Filter */}
            <div className="d-flex justify-content-end mb-4 flex-wrap gap-3 align-items-center">
              <div className="d-flex align-items-center">
                <span className="me-2 text-white-50 fw-bold">From:</span>
                <input
                  type="date"
                  className="form-control"
                  value={analyticsStartDate}
                  onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  style={{
                    background: '#2d2d2d',
                    border: '1px solid #3d3d3d',
                    color: '#ffffff',
                    width: 'auto',
                    colorScheme: 'dark'
                  }}
                />
              </div>
              <div className="d-flex align-items-center">
                <span className="me-2 text-white-50 fw-bold">To:</span>
                <input
                  type="date"
                  className="form-control"
                  value={analyticsEndDate}
                  onChange={(e) => setAnalyticsEndDate(e.target.value)}
                  style={{
                    background: '#2d2d2d',
                    border: '1px solid #3d3d3d',
                    color: '#ffffff',
                    width: 'auto',
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>

            <ul className="nav nav-tabs mb-4 border-secondary" style={{ borderColor: '#3d3d3d !important' }}>
              <li className="nav-item">
                <button 
                  className={`nav-link ${analyticsActiveTab === 'overview' ? 'active' : ''}`} 
                  onClick={() => setAnalyticsActiveTab('overview')}
                  style={{ 
                    color: analyticsActiveTab === 'overview' ? '#10b981' : '#ffffff', 
                    backgroundColor: analyticsActiveTab === 'overview' ? '#2d2d2d' : 'transparent',
                    borderColor: analyticsActiveTab === 'overview' ? '#3d3d3d #3d3d3d #2d2d2d' : 'transparent',
                    marginBottom: '-1px'
                  }}
                >
                  <i className="bi bi-speedometer2 me-2"></i>Overview
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${analyticsActiveTab === 'strength' ? 'active' : ''}`} 
                  onClick={() => setAnalyticsActiveTab('strength')}
                  style={{ 
                    color: analyticsActiveTab === 'strength' ? '#10b981' : '#ffffff', 
                    backgroundColor: analyticsActiveTab === 'strength' ? '#2d2d2d' : 'transparent',
                    borderColor: analyticsActiveTab === 'strength' ? '#3d3d3d #3d3d3d #2d2d2d' : 'transparent',
                    marginBottom: '-1px'
                  }}
                >
                  <i className="bi bi-lightning-charge me-2"></i>Strength
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${analyticsActiveTab === 'volume' ? 'active' : ''}`} 
                  onClick={() => setAnalyticsActiveTab('volume')}
                  style={{ 
                    color: analyticsActiveTab === 'volume' ? '#10b981' : '#ffffff', 
                    backgroundColor: analyticsActiveTab === 'volume' ? '#2d2d2d' : 'transparent',
                    borderColor: analyticsActiveTab === 'volume' ? '#3d3d3d #3d3d3d #2d2d2d' : 'transparent',
                    marginBottom: '-1px'
                  }}
                >
                  <i className="bi bi-bar-chart me-2"></i>Volume
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${analyticsActiveTab === 'body' ? 'active' : ''}`} 
                  onClick={() => setAnalyticsActiveTab('body')}
                  style={{ 
                    color: analyticsActiveTab === 'body' ? '#10b981' : '#ffffff', 
                    backgroundColor: analyticsActiveTab === 'body' ? '#2d2d2d' : 'transparent',
                    borderColor: analyticsActiveTab === 'body' ? '#3d3d3d #3d3d3d #2d2d2d' : 'transparent',
                    marginBottom: '-1px'
                  }}
                >
                  <i className="bi bi-person-badge me-2"></i>Body Composition
                </button>
              </li>
            </ul>

            {analyticsLoading ? (
              <div className="card" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
                <div className="card-body text-center py-5">
                  <div className="spinner-border" style={{ color: '#10b981' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading analytics...</p>
                </div>
              </div>
            ) : analytics && analytics.overview ? (
              <>
                {analyticsActiveTab === 'overview' && (
                  <>
                {/* Overview Stats */}
                <div className="row mb-4">
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-truncate me-2">
                            <p className="text-muted mb-1 small text-truncate">Total Workouts</p>
                            <h3 className="mb-0 text-truncate" style={{ color: '#ffffff' }}>{formatNumber(analytics.overview.total_workouts)}</h3>
                          </div>
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ background: 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px' }}>
                            <i className="bi bi-activity fs-4" style={{ color: '#10b981' }}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-truncate me-2">
                            <p className="text-muted mb-1 small text-truncate">Total Volume</p>
                            <h3 className="mb-0 text-truncate" style={{ color: '#ffffff' }}>{formatVolume(analytics.overview.total_volume_kg)}&nbsp;kg</h3>
                          </div>
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ background: 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px' }}>
                            <i className="bi bi-graph-up fs-4" style={{ color: '#10b981' }}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-truncate me-2">
                            <p className="text-muted mb-1 small text-truncate">Unique Exercises</p>
                            <h3 className="mb-0 text-truncate" style={{ color: '#ffffff' }}>{formatNumber(analytics.overview.unique_exercises)}</h3>
                          </div>
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ background: 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px' }}>
                            <i className="bi bi-list-task fs-4" style={{ color: '#10b981' }}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-truncate me-2">
                            <p className="text-muted mb-1 small text-truncate">Average RPE</p>
                            <h3 className="mb-0 text-truncate" style={{ color: '#ffffff' }}>{formatDecimal(analytics.overview.avg_rpe)}</h3>
                          </div>
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ background: 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px' }}>
                            <i className="bi bi-lightning fs-4" style={{ color: '#10b981' }}></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </>
                )}

                {analyticsActiveTab === 'volume' && (
                  <>
                {/* Additional Stats Row */}
                <div className="row mb-4">
                  <div className="col-lg-4 col-md-6 mb-3">
                    <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                      <div className="card-body">
                        <h6 className="text-muted mb-3">Training Volume</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Reps:</span>
                          <strong style={{ color: '#ffffff' }}>{formatNumber(analytics.overview.total_reps)}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Total Sets:</span>
                          <strong style={{ color: '#ffffff' }}>{formatNumber(analytics.overview.total_sets)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Training Time:</span>
                          <strong style={{ color: '#ffffff' }}>{formatNumber(analytics.overview.total_minutes)}&nbsp;min</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consistency Stats */}
                  {analytics.consistency && (
                    <div className="col-lg-4 col-md-6 mb-3">
                      <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                        <div className="card-body">
                          <h6 className="text-muted mb-3">Consistency</h6>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Workouts/Week:</span>
                            <strong style={{ color: '#ffffff' }}>{formatDecimal(analytics.consistency.workouts_per_week)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Active Days:</span>
                            <strong style={{ color: '#ffffff' }}>{formatNumber(analytics.consistency.active_days)}</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Adherence:</span>
                            <strong style={{ color: '#ffffff' }}>{formatNumber(analytics.consistency.adherence_percentage)}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current Streak */}
                  {analytics.consistency?.streaks && (
                    <div className="col-lg-4 col-md-6 mb-3">
                      <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                        <div className="card-body">
                          <h6 className="text-muted mb-3">Workout Streak 🔥</h6>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Current Streak:</span>
                            <strong style={{ color: '#ef4444' }}>
                              {formatNumber(analytics.consistency.streaks.workout_streak?.current_streak || 0)} days
                            </strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Longest Streak:</span>
                            <strong style={{ color: '#ffffff' }}>{formatNumber(analytics.consistency.streaks.workout_streak?.longest_streak || 0)} days</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Total Training Time:</span>
                            <strong style={{ color: '#ffffff' }}>{Math.floor(analytics.overview.total_minutes / 60)}h {analytics.overview.total_minutes % 60}m</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weekly Breakdown Table */}
                {analytics.volume_trends && analytics.volume_trends.length > 0 && (
                  <div className="card mb-4" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                    <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                      <h5 className="mb-0" style={{ color: '#ffffff' }}>
                        <i className="bi bi-table me-2"></i>
                        Weekly Training Breakdown
                      </h5>
                    </div>
                    <div className="card-body" style={{ background: '#2d2d2d' }}>
                      <div className="table-responsive">
                        <table className="table table-hover" style={{ color: '#ffffff' }}>
                          <thead style={{ background: '#1a1a1a' }}>
                            <tr>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Week Starting</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Workouts</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Volume (kg)</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Sets</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Reps</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Avg RPE</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Duration</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Exercises</th>
                            </tr>
                          </thead>
                          <tbody style={{ background: '#2d2d2d' }}>
                            {analytics.volume_trends.map((week, index) => (
                              <tr key={index} style={{ borderColor: '#3d3d3d' }}>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  <small className="text-muted">
                                    {new Date(week.week_start_date).toLocaleDateString()}
                                  </small>
                                </td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}><strong>{week.total_workouts}</strong></td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}><strong>{formatVolume(week.total_volume_kg)}&nbsp;kg</strong></td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{formatNumber(week.total_sets)}</td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{formatNumber(week.total_reps)}</td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  <span className="badge" style={{ 
                                    background: week.avg_rpe >= 8 ? '#ef4444' : week.avg_rpe >= 6 ? '#f59e0b' : '#10b981',
                                    color: '#ffffff'
                                  }}>
                                    {formatDecimal(week.avg_rpe)}
                                  </span>
                                </td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{week.total_duration_minutes || 0}&nbsp;min</td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{week.unique_exercises || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot style={{ background: '#1a1a1a' }}>
                            <tr>
                              <td style={{ color: '#ffffff', fontWeight: 'bold', borderColor: '#3d3d3d' }}>TOTAL</td>
                              <td style={{ color: '#ffffff', fontWeight: 'bold', borderColor: '#3d3d3d' }}>{formatNumber(analytics.overview.total_workouts)}</td>
                              <td style={{ color: '#ffffff', fontWeight: 'bold', borderColor: '#3d3d3d' }}>{formatVolume(analytics.overview.total_volume_kg)}&nbsp;kg</td>
                              <td style={{ color: '#ffffff', fontWeight: 'bold', borderColor: '#3d3d3d' }}>{formatNumber(analytics.overview.total_sets)}</td>
                              <td style={{ color: '#ffffff', fontWeight: 'bold', borderColor: '#3d3d3d' }}>{formatNumber(analytics.overview.total_reps)}</td>
                              <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                <span className="badge" style={{ background: '#10b981', color: '#ffffff' }}>
                                  {formatDecimal(analytics.overview.avg_rpe)}
                                </span>
                              </td>
                              <td style={{ color: '#ffffff', fontWeight: 'bold', borderColor: '#3d3d3d' }}>{formatNumber(analytics.overview.total_minutes)}&nbsp;min</td>
                              <td style={{ color: '#ffffff', fontWeight: 'bold', borderColor: '#3d3d3d' }}>{formatNumber(analytics.overview.unique_exercises)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Volume Trends Chart */}
                {analytics.volume_trends && analytics.volume_trends.length > 0 && (
                  <div className="card mb-4" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                    <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                      <h5 className="mb-0" style={{ color: '#ffffff' }}>
                        <i className="bi bi-bar-chart-line me-2"></i>
                        Weekly Volume Trends
                      </h5>
                    </div>
                    <div className="card-body" style={{ background: '#2d2d2d' }}>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={analytics.volume_trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
                          <XAxis 
                            dataKey="week_start_date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            stroke="#9ca3af"
                          />
                          <YAxis yAxisId="left" stroke="#9ca3af" />
                          <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                          <Tooltip 
                            labelFormatter={(date) => `Week of ${new Date(date).toLocaleDateString()}`}
                            contentStyle={{ background: '#1a1a1a', border: '1px solid #3d3d3d', borderRadius: '8px', color: '#ffffff' }}
                          />
                          <Legend wrapperStyle={{ color: '#ffffff' }} />
                          <Bar yAxisId="left" dataKey="total_volume_kg" fill="#10b981" name="Volume (kg)" />
                          <Line yAxisId="right" type="monotone" dataKey="avg_rpe" stroke="#f59e0b" name="Avg RPE" strokeWidth={2} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                  </>
                )}

                {analyticsActiveTab === 'strength' && (
                  <>
                {/* Strength Progress Chart */}
                {analytics.strength_progress && analytics.strength_progress.length > 0 && (
                  <div className="card mb-4" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                    <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                      <h5 className="mb-0" style={{ color: '#ffffff' }}>
                        <i className="bi bi-graph-up-arrow me-2"></i>
                        Strength Progress (Est. 1RM)
                      </h5>
                    </div>
                    <div className="card-body" style={{ background: '#2d2d2d' }}>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={analytics.strength_progress}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
                          <XAxis 
                            dataKey="recorded_date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            stroke="#9ca3af"
                          />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip 
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            contentStyle={{ background: '#1a1a1a', border: '1px solid #3d3d3d', borderRadius: '8px', color: '#ffffff' }}
                          />
                          <Legend wrapperStyle={{ color: '#ffffff' }} />
                          <Line type="monotone" dataKey="estimated_1rm" stroke="#10b981" name="Est. 1RM (kg)" strokeWidth={2} />
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
                  </>
                )}

                {analyticsActiveTab === 'overview' && (
                  <>
                {/* Program Performance Breakdown */}
                {analytics.program_performance && analytics.program_performance.length > 0 && (
                  <div className="card mb-4" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                    <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                      <h5 className="mb-0" style={{ color: '#ffffff' }}>
                        <i className="bi bi-grid-3x3 me-2"></i>
                        Performance by Program
                      </h5>
                      <p className="text-muted small mb-0 mt-1">
                        Breakdown of training volume, reps, and intensity by program
                      </p>
                    </div>
                    <div className="card-body" style={{ background: '#2d2d2d' }}>
                      <div className="table-responsive">
                        <table className="table table-hover" style={{ color: '#ffffff' }}>
                          <thead style={{ background: '#1a1a1a' }}>
                            <tr>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Program Name</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Workouts</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Volume (kg)</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Sets</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Reps</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Avg RPE</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Exercises</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Duration</th>
                            </tr>
                          </thead>
                          <tbody style={{ background: '#2d2d2d' }}>
                            {analytics.program_performance.map((program, index) => (
                              <tr key={index} style={{ borderColor: '#3d3d3d' }}>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  <strong>{program.program_name}</strong>
                                </td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}><strong>{program.total_workouts}</strong></td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  <strong style={{ color: '#10b981' }}>{formatVolume(program.total_volume_kg)}&nbsp;kg</strong>
                                </td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{formatNumber(program.total_sets)}</td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{formatNumber(program.total_reps)}</td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  <span className="badge" style={{ 
                                    background: program.avg_rpe >= 8 ? '#ef4444' : program.avg_rpe >= 6 ? '#f59e0b' : '#10b981',
                                    color: '#ffffff'
                                  }}>
                                    {formatDecimal(program.avg_rpe)}
                                  </span>
                                </td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{program.unique_exercises}</td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{formatNumber(program.total_minutes)}&nbsp;min</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Program Performance Cards */}
                      <div className="row mt-4">
                        {analytics.program_performance.map((program, index) => (
                          <div key={index} className="col-md-4 mb-3">
                            <div className="card" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
                              <div className="card-body">
                                <h6 className="text-truncate mb-3" title={program.program_name} style={{ color: '#ffffff' }}>
                                  {program.program_name}
                                </h6>
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="text-muted small">Total Volume:</span>
                                  <strong style={{ color: '#ffffff' }}>{formatVolume(program.total_volume_kg)}&nbsp;kg</strong>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="text-muted small">Workouts:</span>
                                  <strong style={{ color: '#ffffff' }}>{program.total_workouts}</strong>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="text-muted small">Avg RPE:</span>
                                  <span className="badge" style={{ 
                                    background: program.avg_rpe >= 8 ? '#ef4444' : program.avg_rpe >= 6 ? '#f59e0b' : '#10b981',
                                    color: '#ffffff'
                                  }}>
                                    {formatDecimal(program.avg_rpe)}
                                  </span>
                                </div>
                                <div className="d-flex justify-content-between">
                                  <span className="text-muted small">Sets × Reps:</span>
                                  <strong style={{ color: '#ffffff' }}>{formatNumber(program.total_sets)} × {formatNumber(program.total_reps)}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                  </>
                )}

                {analyticsActiveTab === 'strength' && (
                  <>
                {/* Personal Records */}
                {analytics.personal_records && analytics.personal_records.length > 0 && (
                  <div className="card mb-4" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                    <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                      <h5 className="mb-0" style={{ color: '#ffffff' }}>
                        <i className="bi bi-trophy me-2" style={{ color: '#f59e0b' }}></i>
                        Personal Records
                      </h5>
                    </div>
                    <div className="card-body" style={{ background: '#2d2d2d' }}>
                      <div className="row">
                        {analytics.personal_records.map((record, index) => (
                          <div key={index} className="col-lg-4 col-md-6 mb-3">
                            <div className="p-3 rounded" style={{ border: '1px solid #3d3d3d', background: '#1a1a1a' }}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <strong className="text-truncate" style={{ maxWidth: '70%', color: '#ffffff' }}>
                                  {record.exercise_name}
                                </strong>
                                <span className="badge" style={{ background: '#10b981', color: '#ffffff' }}>
                                  {formatDecimal(record.record_value)}&nbsp;kg
                                </span>
                              </div>
                              <small className="text-muted">
                                {record.based_on_weight}&nbsp;kg × {record.based_on_reps} reps
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Body Composition */}
                  </>
                )}
                
                {analyticsActiveTab === 'body' && (
                  <>
                {analytics.body_composition && analytics.body_composition.length > 0 ? (
                  <>
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                          <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                            <h5 className="mb-0" style={{ color: '#ffffff' }}>Weight Progress</h5>
                          </div>
                          <div className="card-body" style={{ background: '#2d2d2d' }}>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={analytics.body_composition}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
                                <XAxis dataKey="measurement_date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#3d3d3d', color: '#ffffff' }} />
                                <Legend wrapperStyle={{ color: '#ffffff' }} />
                                <Line type="monotone" dataKey="weight_kg" stroke="#10b981" name="Weight (kg)" strokeWidth={2} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="row mb-4">
                      <div className="col-md-6 mb-3">
                        <div className="card h-100" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                          <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                            <h5 className="mb-0" style={{ color: '#ffffff' }}>Body Fat %</h5>
                          </div>
                          <div className="card-body" style={{ background: '#2d2d2d' }}>
                            {analytics.body_composition.some(d => d.body_fat_percentage) ? (
                              <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={analytics.body_composition.filter(d => d.body_fat_percentage)}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
                                  <XAxis dataKey="measurement_date" stroke="#9ca3af" />
                                  <YAxis stroke="#9ca3af" />
                                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#3d3d3d', color: '#ffffff' }} />
                                  <Legend wrapperStyle={{ color: '#ffffff' }} />
                                  <Line type="monotone" dataKey="body_fat_percentage" stroke="#f59e0b" name="Body Fat %" strokeWidth={2} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-muted text-center mt-5">No body fat data available</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <div className="card h-100" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                          <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                            <h5 className="mb-0" style={{ color: '#ffffff' }}>Muscle Mass</h5>
                          </div>
                          <div className="card-body" style={{ background: '#2d2d2d' }}>
                            {analytics.body_composition.some(d => d.muscle_mass_kg) ? (
                              <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={analytics.body_composition.filter(d => d.muscle_mass_kg)}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#3d3d3d" />
                                  <XAxis dataKey="measurement_date" stroke="#9ca3af" />
                                  <YAxis stroke="#9ca3af" />
                                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#3d3d3d', color: '#ffffff' }} />
                                  <Legend wrapperStyle={{ color: '#ffffff' }} />
                                  <Line type="monotone" dataKey="muscle_mass_kg" stroke="#3b82f6" name="Muscle Mass (kg)" strokeWidth={2} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-muted text-center mt-5">No muscle mass data available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  <div className="card mb-4" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                    <div className="card-header" style={{ background: '#2d2d2d', borderBottom: '1px solid #3d3d3d' }}>
                      <h5 className="mb-0" style={{ color: '#ffffff' }}>
                        <i className="bi bi-person me-2"></i>
                        Recent Measurements
                      </h5>
                    </div>
                    <div className="card-body" style={{ background: '#2d2d2d' }}>
                      <div className="table-responsive">
                        <table className="table table-hover" style={{ color: '#ffffff' }}>
                          <thead style={{ background: '#1a1a1a' }}>
                            <tr>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Date</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Weight</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Body Fat %</th>
                              <th style={{ color: '#9ca3af', borderColor: '#3d3d3d' }}>Muscle Mass</th>
                            </tr>
                          </thead>
                          <tbody style={{ background: '#2d2d2d' }}>
                            {analytics.body_composition.map((entry, index) => (
                              <tr key={index} style={{ borderColor: '#3d3d3d' }}>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  <small className="text-muted">
                                    {new Date(entry.measurement_date).toLocaleDateString()}
                                  </small>
                                </td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  <strong>{formatDecimal(entry.weight_kg)}&nbsp;kg</strong>
                                </td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  {entry.body_fat_percentage ? `${formatDecimal(entry.body_fat_percentage)}%` : 'N/A'}
                                </td>
                                <td style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>
                                  {entry.muscle_mass_kg ? `${formatDecimal(entry.muscle_mass_kg)}\u00A0kg` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  </>
                ) : (
                  <div className="card" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
                    <div className="card-body text-center py-5">
                      <i className="bi bi-person-badge display-1 mb-3" style={{ color: '#6b7280' }}></i>
                      <h5 className="mb-3" style={{ color: '#ffffff' }}>No Body Composition Data Available</h5>
                      <p className="text-muted">This client hasn't logged any body composition measurements yet.</p>
                    </div>
                  </div>
                )}
                </>
                )}
              </>
            ) : (
              <div className="card" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
                <div className="card-body text-center py-5">
                  <i className="bi bi-graph-up display-1 mb-3" style={{ color: '#6b7280' }}></i>
                  <h5 className="mb-3" style={{ color: '#ffffff' }}>No Analytics Data Available</h5>
                  <p className="text-muted">This client hasn't logged any workouts yet.</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Assign Existing Program Tab */}
        {activeView === 'assign-program' && (
          <div className="card" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
            <div className="card-header" style={{ background: '#1a1a1a', borderBottom: '1px solid #3d3d3d' }}>
              <h5 className="mb-0" style={{ color: '#ffffff' }}>Select a Program to Assign</h5>
            </div>
            <div className="card-body" style={{ background: '#1a1a1a' }}>
              <div className="mb-4 d-flex flex-column flex-md-row gap-2">
                <div style={{ flex: 1 }}>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Search your programs..."
                    value={programSearchQuery}
                    onChange={(e) => { setProgramSearchQuery(e.target.value); setProgramPage(1); }}
                    onKeyPress={(e) => { if (e.key === 'Enter') fetchAvailablePrograms(1, programSearchQuery, programAssignmentFilter); }}
                    style={{ backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #3d3d3d', minHeight: '40px' }}
                  />
                </div>
                <div className="d-flex gap-2">
                  <select 
                    className="form-select flex-grow-1" 
                    value={programAssignmentFilter} 
                    onChange={(e) => { setProgramAssignmentFilter(e.target.value); setProgramPage(1); }}
                    style={{ backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #3d3d3d', minWidth: '160px' }}
                  >
                    <option value="all">All Programs</option>
                    <option value="unassigned">Not Assigned</option>
                    <option value="assigned">Already Assigned</option>
                  </select>
                  <button className="btn px-4" style={{ backgroundColor: '#10b981', color: '#fff', whiteSpace: 'nowrap' }} onClick={() => fetchAvailablePrograms(1, programSearchQuery, programAssignmentFilter)}>Search</button>
                </div>
              </div>
              {availablePrograms.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No programs found.</p>
                  <button 
                    className="btn"
                    style={{
                      background: '#10b981', border: 'none', color: '#ffffff',
                      padding: '0.5rem 1.5rem', borderRadius: '8px', transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#059669'}
                    onMouseLeave={(e) => e.target.style.background = '#10b981'}
                    onClick={() => { setProgramPackage({ title: '', description: '', category: 'General Fitness', difficulty_level: 'beginner', duration_weeks: 4 }); setWorkoutSessions([]); setEditingProgramId(null); setActiveView('create-program'); }}
                  >
                    Create Custom Program
                  </button>
                </div>
              ) : (
                <div>
                  <div className="row">
                    {availablePrograms.map(program => {
                      const isAssigned = assignedPrograms.some(ap => ap.id === program.id);
                      return (
                      <div key={program.id} className="col-md-6 col-lg-4 mb-3">
                        <div 
                          className={`card h-100 border-0 shadow-sm ${isAssigned ? '' : 'card-hover cursor-pointer'}`}
                          style={{
                            border: isAssigned ? '1px solid rgba(255,255,255,0.1)' : (selectedProgramToAssign === program.id ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.2)'),
                            background: isAssigned ? 'rgba(255,255,255,0.03)' : (selectedProgramToAssign === program.id ? 'rgba(16, 185, 129, 0.1)' : '#2d2d2d'),
                            opacity: isAssigned ? 0.7 : 1,
                            pointerEvents: isAssigned ? 'none' : 'auto'
                          }}
                          onClick={() => {
                            if (!isAssigned) setSelectedProgramToAssign(program.id);
                          }}
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex flex-column">
                                <h5 className="card-title fw-bold mb-1" style={{ color: '#ffffff' }}>{program.title}</h5>
                                {isAssigned && (
                                  <span className="badge" style={{ width: 'fit-content', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#9ca3af', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px', fontSize: '0.7rem' }}>
                                    Already Assigned
                                  </span>
                                )}
                              </div>
                              <div className="d-flex align-items-center gap-2" style={{ pointerEvents: 'auto' }}>
                                {!isAssigned && selectedProgramToAssign === program.id && (
                                  <i className="bi bi-check-circle-fill me-2 fs-5" style={{ color: '#10b981' }}></i>
                                )}
                                <button className="btn btn-sm btn-outline-success p-1 border-0" style={{color: '#10b981'}} onClick={(e) => { e.stopPropagation(); handleEditProgram(program.id); }} title="Edit"><i className="bi bi-pencil fs-5"></i></button>
                                <button className="btn btn-sm btn-outline-danger p-1 border-0" style={{color: '#ef4444'}} onClick={(e) => { e.stopPropagation(); handleDeleteProgram(program.id); }} title="Delete"><i className="bi bi-trash fs-5"></i></button>
                              </div>
                            </div>
                            
                            <p className="text-muted small mb-3" style={{ color: '#9ca3af', minHeight: '40px' }}>{program.description}</p>
                            
                            <div className="d-flex flex-wrap gap-1 mt-auto">
                              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>{program.category}</span>
                              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>{program.difficulty_level}</span>
                              <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>{program.duration_weeks} weeks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                  {programTotalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <nav>
                        <ul className="pagination pagination-sm m-0" style={{ gap: '5px' }}>
                          <li className={`page-item ${programPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" style={{ backgroundColor: '#2d2d2d', borderColor: '#3d3d3d', color: '#fff', borderRadius: '4px' }} onClick={() => setProgramPage(p => Math.max(1, p - 1))}>Previous</button>
                          </li>
                          {[...Array(programTotalPages)].map((_, i) => (
                            <li key={i + 1} className={`page-item ${programPage === i + 1 ? 'active' : ''}`}>
                              <button className="page-link" style={{ backgroundColor: programPage === i + 1 ? '#10b981' : '#2d2d2d', borderColor: programPage === i + 1 ? '#10b981' : '#3d3d3d', color: '#fff', borderRadius: '4px' }} onClick={() => setProgramPage(i + 1)}>{i + 1}</button>
                            </li>
                          ))}
                          <li className={`page-item ${programPage === programTotalPages ? 'disabled' : ''}`}>
                            <button className="page-link" style={{ backgroundColor: '#2d2d2d', borderColor: '#3d3d3d', color: '#fff', borderRadius: '4px' }} onClick={() => setProgramPage(p => Math.min(programTotalPages, p + 1))}>Next</button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                  {programTotalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <nav>
                        <ul className="pagination pagination-sm m-0" style={{ gap: '5px' }}>
                          <li className={`page-item ${programPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" style={{ backgroundColor: '#2d2d2d', borderColor: '#3d3d3d', color: '#fff', borderRadius: '4px' }} onClick={() => setProgramPage(p => Math.max(1, p - 1))}>Previous</button>
                          </li>
                          {[...Array(programTotalPages)].map((_, i) => (
                            <li key={i + 1} className={`page-item ${programPage === i + 1 ? 'active' : ''}`}>
                              <button className="page-link" style={{ backgroundColor: programPage === i + 1 ? '#10b981' : '#2d2d2d', borderColor: programPage === i + 1 ? '#10b981' : '#3d3d3d', color: '#fff', borderRadius: '4px' }} onClick={() => setProgramPage(i + 1)}>{i + 1}</button>
                            </li>
                          ))}
                          <li className={`page-item ${programPage === programTotalPages ? 'disabled' : ''}`}>
                            <button className="page-link" style={{ backgroundColor: '#2d2d2d', borderColor: '#3d3d3d', color: '#fff', borderRadius: '4px' }} onClick={() => setProgramPage(p => Math.min(programTotalPages, p + 1))}>Next</button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                  
                  <div className="mt-4 d-grid gap-2 d-sm-flex align-items-center">
                    <button 
                      className="btn text-nowrap"
                      style={{
                        background: selectedProgramToAssign ? '#10b981' : '#3d3d3d',
                        border: 'none',
                        color: '#ffffff',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        cursor: selectedProgramToAssign ? 'pointer' : 'not-allowed'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedProgramToAssign) e.target.style.background = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedProgramToAssign) e.target.style.background = '#10b981';
                      }}
                      onClick={handleAssignProgram}
                      disabled={!selectedProgramToAssign}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Assign Selected Program
                    </button>
                    <button 
                      className="btn text-nowrap ms-0 ms-sm-2"
                      style={{
                        background: 'transparent',
                        border: '2px solid #6b7280',
                        color: '#9ca3af',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#10b981';
                        e.target.style.color = '#10b981';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#6b7280';
                        e.target.style.color = '#9ca3af';
                      }}
                      onClick={() => setActiveView('overview')}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Browse & Reuse Programs Tab */}
        {activeView === 'browse-programs' && (
          <div className="card border-0 shadow-sm" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-header text-white" style={{ backgroundColor: '#10b981' }}>
              <h6 className="mb-0">Browse All Your Programs</h6>
              <small className="text-white-50">Select any program you've created to assign to this client</small>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Search programs..."
                  value={programSearchQuery}
                  onChange={(e) => setProgramSearchQuery(e.target.value)}
                />
              </div>
              
              {filteredPrograms.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No programs found. Create your first program!</p>
                </div>
              ) : (
                <div>
                  <div className="row">
                    {filteredPrograms.map(program => (
                      <div key={program.id} className="col-md-6 col-lg-4 mb-3">
                        <div 
                          className={`card card-hover cursor-pointer h-100 ${selectedProgramToAssign === program.id ? 'border-primary' : ''}`}
                          onClick={() => setSelectedProgramToAssign(program.id)}
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title mb-0">{program.title}</h6>
                              {selectedProgramToAssign === program.id && (
                                <i className="bi bi-check-circle-fill text-primary"></i>
                              )}
                            </div>
                            <p className="text-muted small mb-2">{program.description}</p>
                            <div className="d-flex flex-wrap gap-1 mb-2">
                              <span className="badge bg-light text-dark">{program.category}</span>
                              <span className="badge bg-light text-dark">{program.difficulty_level}</span>
                              <span className="badge bg-light text-dark">{program.duration_weeks} weeks</span>
                            </div>
                            <small className="text-muted">
                              {program.status === 'published' ? 'Premium Program' : 'Draft/Custom Program'}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 d-grid gap-2 d-sm-flex align-items-center">
                    <button 
                      className="btn btn-primary text-nowrap"
                      onClick={handleAssignProgram}
                      disabled={!selectedProgramToAssign}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Assign Selected Program
                    </button>
                    <button 
                      className="btn btn-secondary text-nowrap ms-0 ms-sm-2"
                      onClick={() => {
                        setSelectedProgramToAssign('');
                        setActiveView('overview');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Create Custom Program Tab - Same interface as CreatePrograms.jsx */}
        {activeView === 'create-program' && (
          <div className="manage-client-create-program">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              This custom program will be created specifically for {clientInfo?.full_name || clientInfo?.username} and automatically assigned to them.
            </div>
            
            {/* Program creation interface - simplified version for client-specific programs */}
            <div className="card mb-4 border-0 shadow-sm" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header text-white" style={{ backgroundColor: '#10b981' }}>
                <h6 className="mb-0">Program Details</h6>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Program Title *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={programPackage.title}
                      onChange={(e) => setProgramPackage(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={`Custom program for ${clientInfo?.full_name || 'client'}`}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    value={programPackage.description}
                    onChange={(e) => setProgramPackage(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Program description..."
                  />
                </div>
                
                <div className="row">
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
              </div>
            </div>
            
            {/* Workout Sessions */}
            <div className="card mb-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <h5 className="mb-0" style={{ color: '#fff' }}>Workout Sessions ({workoutSessions.length})</h5>
              </div>
              <div className="card-body">
                {workoutSessions.length === 0 ? (
                  <p className="text-center py-3" style={{ color: '#9ca3af' }}>
                    No workout sessions added yet. Create one below!
                  </p>
                ) : (
                  <div className="list-group mb-3" style={{ backgroundColor: 'transparent' }}>
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
                              onClick={() => setWorkoutSessions(prev => prev.filter((_, i) => i !== index))}
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
            
            {/* Session Builder */}
            <div className="card mb-4 border-0 shadow-sm" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header text-white" style={{ backgroundColor: '#10b981' }}>
                <h6 className="mb-0">Create Workout Session</h6>
              </div>
              <div className="card-body">
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
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
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
                
                {/* Exercise List */}
                <h6 className="mb-3">Add Global Exercises</h6>
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Search global exercises by name, category..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />
                  <p className="small mt-2 text-muted">
                    Showing {filteredExercises.length} global exercises
                  </p>
                </div>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
                  <div className="row g-2 m-0">
                    {filteredExercises.slice(0, 50).map((exercise) => (
                      <div key={exercise.id} className="col-md-6 mb-2">
                        <div 
                          className="card card-hover cursor-pointer"
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                          onClick={() => openExerciseModal(exercise)}
                        >
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="fw-bold" style={{ color: '#fff' }}>{exercise.name}</small>
                                <br />
                                <small style={{ color: '#9ca3af' }}>{exercise.muscle_group} • {exercise.category}</small>
                              </div>
                              <i className="bi bi-plus-circle text-primary"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <hr style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }} />

                <h6 className="mb-3">Add Custom Exercises</h6>
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Search your custom exercises..."
                    value={customExerciseSearch}
                    onChange={(e) => setCustomExerciseSearch(e.target.value)}
                  />
                  <p className="small mt-2 text-muted">
                    Showing {filteredCustomExercises.length} custom exercises
                  </p>
                </div>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
                  <div className="row g-2 m-0">
                    {filteredCustomExercises.map((exercise) => (
                      <div key={exercise.id} className="col-md-6 mb-2">
                        <div 
                          className="card card-hover"
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                        >
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div 
                                className="flex-grow-1 cursor-pointer"
                                onClick={() => openExerciseModal(exercise)}
                              >
                                <small className="fw-bold" style={{ color: '#fff' }}>{exercise.name}</small>
                                <br />
                                <small style={{ color: '#9ca3af' }}>{exercise.muscle_group} • {exercise.category}</small>
                              </div>
                              <div className="d-flex gap-1" style={{ alignItems: 'center' }}>
                                <button
                                  className="btn btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openExerciseModal(exercise);
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
                
                <hr style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }} />

                {/* Add Custom Exercise */}
                <h6 className="mb-3" style={{ color: '#fff' }}>Create Your Own Exercise</h6>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <input 
                      type="text" 
                      className="form-control bg-dark border-secondary text-white"
                      placeholder="Exercise name"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <select 
                      className="form-select bg-dark border-secondary text-white"
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
                      className="form-control bg-dark border-secondary text-white"
                      placeholder="Muscle group"
                      value={newExercise.muscle_group}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, muscle_group: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-2 mb-3">
                    <button 
                      className="btn w-100"
                      onClick={(e) => { e.preventDefault(); addCustomExercise(); }}
                      disabled={!newExercise.name}
                      style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: '600' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                <hr style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }} />
                
                {/* Current Session Exercises */}
                <h6 className="mb-3" style={{ color: '#fff' }}>Session Exercises ({currentSession.exercises.length})</h6>
                {currentSession.exercises.length === 0 ? (
                  <p className="small" style={{ color: '#9ca3af' }}>No exercises added yet</p>
                ) : (
                  <div className="mb-3">
                    {currentSession.exercises.map((exercise, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div>
                          <small className="fw-bold" style={{ color: '#fff' }}>{exercise.name}</small>
                          <br />
                          <small style={{ color: '#9ca3af' }}>{exercise.sets} sets x {exercise.reps} {exercise.rpe && `• RPE ${exercise.rpe}`}</small>
                        </div>
                        <button 
                          className="btn btn-sm"
                          style={{ color: '#ef4444', borderColor: '#ef4444' }}
                          title="Remove Exercise"
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
                
                <button 
                  className="btn btn-success me-2"
                  onClick={saveCurrentSession}
                  disabled={!currentSession.name || currentSession.exercises.length === 0}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Session to Program
                </button>
              </div>
            </div>
            
            {/* Save Program */}
            <div className="card border-0 shadow-sm" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-grid gap-2 d-sm-flex align-items-center">
                  <button 
                    className="btn btn-primary btn-lg text-nowrap"
                    onClick={saveCustomProgram}
                    disabled={!programPackage.title || workoutSessions.length === 0}
                  >
                    <i className="bi bi-save me-2"></i>
                    Create & Assign Program
                  </button>
                  <button 
                    className="btn btn-secondary btn-lg text-nowrap"
                    onClick={() => setActiveView('overview')}
                  >
                    Cancel
                  </button>
                  <small className="text-muted ms-0 ms-sm-3">
                    {workoutSessions.length} session(s) ready
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Nutrition Tab */}
        {activeView === 'nutrition' && (
          <div>
            {/* Nutrition Goals Section */}
            <div className="card mb-4" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
              <div className="card-header" style={{ background: '#1a1a1a', borderBottom: '1px solid #3d3d3d' }}>
                <div className="d-grid gap-2 d-sm-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0" style={{ color: '#ffffff' }}>Nutrition Goals</h5>
                  <button 
                    className="btn btn-sm text-nowrap"
                    style={{
                      background: '#10b981',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#10b981';
                    }}
                    onClick={() => {
                      if (nutritionGoal) {
                        setGoalForm({
                          goal_type: nutritionGoal.goal_type || 'daily',
                          target_calories: nutritionGoal.target_calories || '',
                          target_protein: nutritionGoal.target_protein || '',
                          target_carbs: nutritionGoal.target_carbs || '',
                          target_fat: nutritionGoal.target_fat || ''
                        });
                      }
                      setShowGoalModal(true);
                    }}
                  >
                    {nutritionGoal ? 'Edit Trainer Goals' : 'Set Trainer Goals'}
                  </button>
                </div>
                
                {/* Tabs for Trainer vs Client Goals */}
                <ul className="nav nav-tabs card-header-tabs d-grid gap-2 d-sm-flex" style={{ borderBottom: '2px solid #3d3d3d' }}>
                  <li className="nav-item">
                    <button 
                      className={`program-pill ${nutritionTab === 'trainer' ? 'active' : ''}`}
                      onClick={() => setNutritionTab('trainer')}
                      style={{ borderRadius: '8px 8px 0 0' }}
                    >
                      <i className="bi bi-person-badge me-2"></i>
                      Trainer Assigned
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`program-pill ${nutritionTab === 'self' ? 'active' : ''}`}
                      onClick={() => setNutritionTab('self')}
                      style={{ borderRadius: '8px 8px 0 0' }}
                    >
                      <i className="bi bi-person me-2"></i>
                      Client's Own Goals
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body" style={{ background: '#1a1a1a' }}>
                {nutritionTab === 'trainer' ? (
                  // Trainer-assigned goals
                  nutritionGoal ? (
                    <div>
                      <div className="alert mb-3" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981' }}>
                        <i className="bi bi-info-circle me-2"></i>
                        These are the nutrition goals you've assigned to this client.
                      </div>
                      <div className="row g-3">
                        <div className="col-6 col-md-3">
                          <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                            <div className="card-body text-center">
                              <h6 className="text-muted small">CALORIES</h6>
                              <h3 className="mb-0" style={{ color: '#ffffff' }}>{nutritionGoal.target_calories}</h3>
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                            <div className="card-body text-center">
                              <h6 className="text-muted small">PROTEIN</h6>
                              <h3 className="mb-0" style={{ color: '#ffffff' }}>{nutritionGoal.target_protein}g</h3>
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                            <div className="card-body text-center">
                              <h6 className="text-muted small">CARBS</h6>
                              <h3 className="mb-0" style={{ color: '#ffffff' }}>{nutritionGoal.target_carbs}g</h3>
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                            <div className="card-body text-center">
                              <h6 className="text-muted small">FAT</h6>
                              <h3 className="mb-0" style={{ color: '#ffffff' }}>{nutritionGoal.target_fat}g</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="bi bi-clipboard-data" style={{ fontSize: '3rem', color: '#6b7280' }}></i>
                      <p className="text-muted mt-3 mb-0">You haven't set nutrition goals for this client yet</p>
                      <button 
                        className="btn mt-3"
                        style={{
                          background: '#10b981',
                          border: 'none',
                          color: '#ffffff',
                          padding: '0.5rem 1.5rem',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#10b981';
                        }}
                        onClick={() => setShowGoalModal(true)}
                      >
                        Set Nutrition Goals
                      </button>
                    </div>
                  )
                ) : (
                  // Client's self-created goals (read-only)
                  selfNutritionGoal ? (
                    <div>
                      <div className="alert mb-3" style={{ background: 'rgba(107, 114, 128, 0.1)', border: '1px solid #6b7280', color: '#9ca3af' }}>
                        <i className="bi bi-eye me-2"></i>
                        These are the nutrition goals your client set for themselves. You can view but not edit them.
                      </div>
                      <div className="row g-3">
                        <div className="col-6 col-md-3">
                          <div className="card" style={{ background: '#2d2d2d', border: '1px solid #6b7280' }}>
                            <div className="card-body text-center">
                              <h6 className="text-muted small">CALORIES</h6>
                              <h3 className="mb-0" style={{ color: '#ffffff' }}>{selfNutritionGoal.target_calories}</h3>
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="card" style={{ background: '#2d2d2d', border: '1px solid #6b7280' }}>
                            <div className="card-body text-center">
                              <h6 className="text-muted small">PROTEIN</h6>
                              <h3 className="mb-0" style={{ color: '#ffffff' }}>{selfNutritionGoal.target_protein}g</h3>
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="card" style={{ background: '#2d2d2d', border: '1px solid #6b7280' }}>
                            <div className="card-body text-center">
                              <h6 className="text-muted small">CARBS</h6>
                              <h3 className="mb-0" style={{ color: '#ffffff' }}>{selfNutritionGoal.target_carbs}g</h3>
                            </div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="card" style={{ background: '#2d2d2d', border: '1px solid #6b7280' }}>
                            <div className="card-body text-center">
                              <h6 className="text-muted small">FAT</h6>
                              <h3 className="mb-0" style={{ color: '#ffffff' }}>{selfNutritionGoal.target_fat}g</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="bi bi-clipboard-x" style={{ fontSize: '3rem', color: '#6b7280' }}></i>
                      <p className="text-muted mt-3 mb-0">Your client hasn't set their own nutrition goals yet</p>
                    </div>
                  )
                )}
              </div>
            </div>
            
            {/* Weekly Meal Plan Section */}
            <div className="card" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d' }}>
              <div className="card-header d-grid gap-2 d-sm-flex justify-content-between align-items-center" style={{ background: '#1a1a1a', borderBottom: '1px solid #3d3d3d' }}>
                <div>
                  <h5 className="mb-0" style={{ color: '#ffffff' }}>Weekly Meal Plan</h5>
                  <small className="text-muted">Plan meals for each day of the week</small>
                </div>
                <div className="btn-group btn-group-sm">
                  <button 
                    className="btn btn-sm"
                    style={{
                      background: 'transparent',
                      border: '1px solid #10b981',
                      color: '#10b981',
                      borderRadius: '8px 0 0 8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                    }}
                    onClick={() => setShowCustomFoodModal(true)}
                    title="Create custom food"
                  >
                    <i className="bi bi-plus-circle me-1"></i> Custom Food
                  </button>
                  <button 
                    className="btn btn-sm"
                    style={{
                      background: 'transparent',
                      border: '1px solid #6b7280',
                      borderLeft: 'none',
                      color: '#9ca3af',
                      borderRadius: '0 8px 8px 0',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(107, 114, 128, 0.1)';
                      e.target.style.borderColor = '#9ca3af';
                      e.target.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = '#6b7280';
                      e.target.style.color = '#9ca3af';
                    }}
                    onClick={() => setShowCustomMealTypeModal(true)}
                    title="Manage meal types"
                  >
                    <i className="bi bi-gear me-1"></i> Meal Types
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ background: '#1a1a1a' }}>
                <div className="table-responsive">
                  <table className="table table-bordered table-dark mb-0" style={{ borderColor: '#3d3d3d' }}>
                    <thead style={{ background: '#2d2d2d' }}>
                      <tr>
                        <th style={{ width: '15%', minWidth: '120px', color: '#ffffff', borderColor: '#3d3d3d' }}>Day</th>
                        {customMealTypes.map(mealType => (
                          <th key={mealType} className="text-capitalize" style={{ color: '#ffffff', borderColor: '#3d3d3d', minWidth: '250px' }}>{mealType}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ background: '#1a1a1a' }}>
                      {daysOfWeek.map((day, dayIndex) => (
                        <tr key={dayIndex}>
                          <td className="fw-bold" style={{ color: '#ffffff', borderColor: '#3d3d3d' }}>{day}</td>
                          {customMealTypes.map(mealType => {
                            const meal = getMealForDayAndType(dayIndex + 1, mealType);
                            return (
                              <td key={mealType} style={{ borderColor: '#3d3d3d' }}>
                                {meal ? (
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <small style={{ color: '#9ca3af' }}>
                                        {meal.food_items && meal.food_items.length > 0 ? (
                                          <ul className="list-unstyled mb-0">
                                            {meal.food_items.map((food, idx) => (
                                              <li key={idx}>• {food.name || food.food_name}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span className="text-muted">No items</span>
                                        )}
                                        {meal.notes && <p className="text-muted small mb-0 mt-1">{meal.notes}</p>}
                                      </small>
                                    </div>
                                    <div className="btn-group btn-group-sm">
                                      <button 
                                        className="btn btn-outline-primary"
                                        onClick={() => openMealModal(dayIndex + 1, mealType, meal)}
                                        title="Edit"
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                      <button 
                                        className="btn btn-outline-danger"
                                        onClick={() => handleDeleteMeal(meal.id)}
                                        title="Delete"
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                                    onClick={() => openMealModal(dayIndex + 1, mealType)}
                                    aria-label="Add meal"
                                  >
                                    <i className="bi bi-plus" aria-hidden="true"></i>
                                    <span className="visually-hidden">Add</span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Meal Modal */}
        {showMealModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: '#fff' }}>
                    {daysOfWeek[currentMeal.day_of_week - 1]} - {currentMeal.meal_type.charAt(0).toUpperCase() + currentMeal.meal_type.slice(1)}
                  </h5>
                  <button 
                    type="button"
                    className="btn-close btn-close-white" 
                    onClick={() => setShowMealModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSaveMeal}>
                  <div className="modal-body">
                    {/* Search Foods */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label mb-0" style={{ color: '#fff' }}>Search & Add Foods</label>
                        <button 
                          type="button" 
                          className="btn btn-sm"
                          onClick={() => {
                            setCustomFoodForm({ name: '', brand: '', serving_size: 100, serving_unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0 });
                            setShowCustomFoodModal(true);
                          }}
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                        >
                          <i className="bi bi-plus-circle me-1"></i> New Custom Food
                        </button>
                      </div>
                      <div className="input-group">
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Search for foods..."
                          value={mealSearchQuery}
                          onChange={(e) => setMealSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchFoods())}
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        />
                        <button 
                          type="button"
                          className="btn"
                          onClick={searchFoods}
                          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                        >
                          Search
                        </button>
                      </div>
                    </div>
                    
                    {/* Search State & Results */}
                    {searching && (
                      <div className="mb-3 small" style={{ color: '#9ca3af' }}>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Searching...
                      </div>
                    )}
                    
                    {!searching && mealSearchQuery.trim().length >= 2 && resultsFor === mealSearchQuery.trim() && foodSearchResults.length === 0 && (
                      <div className="mb-3 small" style={{ color: '#9ca3af' }}>
                        No results found for "{mealSearchQuery.trim()}"
                      </div>
                    )}

                    {!searching && foodSearchResults.length > 0 && (
                      <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <h6 className="small" style={{ color: '#9ca3af' }}>
                          Results for "{resultsFor}":
                        </h6>
                        <div>
                          {foodSearchResults.slice(0, 15).map((food, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-100 text-start p-3 mb-2 rounded"
                              onClick={() => selectFood(food)}
                              style={{ 
                                backgroundColor: '#1a1a1a', 
                                border: '1px solid rgba(16, 185, 129, 0.2)', 
                                color: '#fff',
                                cursor: 'pointer'
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <div className="fw-bold small">{food.description || food.name}</div>
                                  {food.brand_name && (
                                    <div className="small" style={{ color: '#9ca3af' }}>{food.brand_name}</div>
                                  )}
                                  {food.trainer_name && (
                                    <div className="small" style={{ color: '#10b981' }}>By: {food.trainer_name}</div>
                                  )}
                                  <div className="small mt-1" style={{ color: '#9ca3af' }}>
                                    {food.source === 'usda' && food.nutrients && (
                                      <>
                                        Cal: {Math.round(food.nutrients.calories || 0)} • 
                                        P: {(food.nutrients.protein || 0).toFixed(1)}g • 
                                        C: {(food.nutrients.carbs || 0).toFixed(1)}g • 
                                        F: {(food.nutrients.fat || 0).toFixed(1)}g
                                      </>
                                    )}
                                    {(food.source === 'custom' || food.source === 'trainer_custom') && (
                                      <>
                                        Cal: {food.calories || 0} • 
                                        P: {food.protein || 0}g • 
                                        C: {food.carbs || 0}g • 
                                        F: {food.fat || 0}g
                                        {food.serving_size && ` (per ${food.serving_size}${food.serving_unit || 'g'})`}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <span className={`badge ${food.source === 'trainer_custom' ? 'bg-success text-dark' : food.source === 'custom' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                                  {food.source === 'trainer_custom' ? 'Trainer' : food.source}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Custom Foods List */}
                    {!searching && trainerCustomFoods.length > 0 && (
                      <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <h6 className="small" style={{ color: '#10b981' }}>My Custom Foods:</h6>
                        <div>
                          {trainerCustomFoods
                            .filter(f => !mealSearchQuery || f.name.toLowerCase().includes(mealSearchQuery.toLowerCase()))
                            .map((food, idx) => (
                              <div
                                key={`custom_${food.id}_${idx}`}
                                className="w-100 text-start p-3 mb-2 rounded d-flex justify-content-between align-items-center"
                                style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                              >
                                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => selectFood({ ...food, source: 'trainer_custom' })}>
                                  <div className="fw-bold small">{food.name}</div>
                                  {food.brand && (
                                    <div className="small" style={{ color: '#9ca3af' }}>{food.brand}</div>
                                  )}
                                  <div className="small mt-1" style={{ color: '#9ca3af' }}>
                                    Cal: {food.calories || 0} • P: {food.protein || 0}g • C: {food.carbs || 0}g • F: {food.fat || 0}g
                                    {food.serving_size && ` (per ${parseFloat(food.serving_size)}${food.serving_unit || 'g'})`}
                                  </div>
                                </div>
                                <div className="d-flex flex-column align-items-end" style={{ minWidth: '70px' }}>
                                  <span className="badge bg-success text-dark mb-2">Trainer</span>
                                  <div className="btn-group">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success p-1"
                                      title="Edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCustomFoodForm({ ...food, portions: [] });
                                        setShowCustomFoodModal(true);
                                      }}
                                      style={{ border: 'none', color: '#10b981' }}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger p-1"
                                      title="Delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCustomFood(food.id);
                                      }}
                                      style={{ border: 'none', color: '#ef4444' }}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {trainerCustomFoods.filter(f => !mealSearchQuery || f.name.toLowerCase().includes(mealSearchQuery.toLowerCase())).length === 0 && (
                            <p className="small text-muted">No custom foods match.</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Selected Foods */}
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>Selected Foods:</label>
                      {currentMeal.food_items.length === 0 ? (
                        <p className="small" style={{ color: '#9ca3af' }}>No foods added yet</p>
                      ) : (
                        <div>
                          {currentMeal.food_items.map((food, idx) => (
                            <div 
                              key={idx} 
                              className="mb-2 p-3 rounded"
                              style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{food.name || food.food_name}</span>
                                <button 
                                  type="button"
                                  className="btn btn-sm"
                                  onClick={() => removeFoodFromMeal(idx)}
                                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                              <div className="row g-2">
                                <div className="col-md-4">
                                  <label className="form-label small" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Quantity</label>
                                  <input 
                                    type="number"
                                    className="form-control"
                                    value={food.quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value, idx)}
                                    step="any"
                                    min="0.1"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(32, 214, 87, 0.3)' }}
                                  />
                                </div>
                                <div className="col-md-8">
                                  <label className="form-label small" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Measurement Type</label>
                                  <select 
                                    className="form-select"
                                    value={food.serving_unit}
                                    onChange={(e) => handleMeasurementTypeChange(e.target.value, idx)}
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(32, 214, 87, 0.3)' }}
                                  >
                                    <option value="g" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Grams (g)</option>
                                    <option value="ml" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Milliliters (ml)</option>
                                    {food.available_portions?.map((port, pIdx) => {
                                      let label = port.modifier || port.measureUnit?.name || port.measureUnitName || port.measure_unit_name || port.portion_description || port.label || `Portion ${pIdx + 1}`;
                                      let weight = port.gramWeight || port.gram_weight || 0;
                                      return (
                                        <option key={`portion_${pIdx}`} value={`portion_${pIdx}`} style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
                                          {label} {weight ? `(${weight}g)` : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>
                              <div className="mt-2 text-end">
                                <small style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{food.calories} cal</span>
                                  <span className="mx-2">•</span>
                                  <span>P: {food.protein}g</span>
                                  <span className="mx-2">•</span>
                                  <span>C: {food.carbs}g</span>
                                  <span className="mx-2">•</span>
                                  <span>F: {food.fat}g</span>
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Notes */}
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>Notes (Optional)</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={currentMeal.notes}
                        onChange={(e) => setCurrentMeal(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any notes or instructions..."
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                      />
                    </div>
                  </div>
                  <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <button 
                      type="button"
                      className="btn" 
                      onClick={() => setShowMealModal(false)}
                      style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn"
                      style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                    >
                      Save Meal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Meal Confirmation Modal */}
        {deleteMealModal.show && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                    Confirm Delete Meal
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setDeleteMealModal({ show: false, mealId: null })}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Are you sure you want to delete this meal?</p>
                  <p className="small mt-2 mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>This action cannot be undone.</p>
                </div>
                <div className="modal-footer" style={{ backgroundColor: '#2d2d2d', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary text-white" 
                    onClick={() => setDeleteMealModal({ show: false, mealId: null })}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn"
                    style={{ backgroundColor: '#ef4444', color: '#fff' }}
                    onClick={confirmDeleteMeal}
                  >
                    Delete Meal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Meal Type Confirmation Modal */}
        {deleteMealTypeModal.show && (
          <div className="modal show d-block" tabindex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                    Confirm Remove Meal Type
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setDeleteMealTypeModal({ show: false, mealType: '' })}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Are you sure you want to remove the <strong>"{deleteMealTypeModal.mealType}"</strong> meal type?</p>
                </div>
                <div className="modal-footer" style={{ backgroundColor: '#2d2d2d', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary text-white" 
                    onClick={() => setDeleteMealTypeModal({ show: false, mealType: '' })}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn"
                    style={{ backgroundColor: '#ef4444', color: '#fff' }}
                    onClick={confirmRemoveMealType}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Custom Food Confirmation Modal */}
        {deleteCustomFoodModal.show && (
          <div className="modal show d-block" tabindex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title fw-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                    Confirm Delete Custom Food
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setDeleteCustomFoodModal({ show: false, foodId: null })}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>Are you sure you want to delete this custom food?</p>
                </div>
                <div className="modal-footer" style={{ backgroundColor: '#2d2d2d', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary text-white" 
                    onClick={() => setDeleteCustomFoodModal({ show: false, foodId: null })}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn"
                    style={{ backgroundColor: '#ef4444', color: '#fff' }}
                    onClick={confirmDeleteCustomFood}
                  >
                    Delete Food
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Custom Exercise Confirmation Modal */}
        {deleteExerciseModal.show && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
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

        {/* Exercise Modal */}
        {showExerciseModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
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
                      style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid rgba(16, 185, 129, 0.2)' }}
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
                      style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                      value={exerciseToAdd.reps}
                      onChange={(e) => setExerciseToAdd(prev => ({ ...prev, reps: e.target.value }))}
                      placeholder="e.g., 8-12"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#d1d5db' }}>RPE</label>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                      value={exerciseToAdd.rpe}
                      onChange={(e) => setExerciseToAdd(prev => ({ ...prev, rpe: e.target.value }))}
                      placeholder="e.g., 7-8"
                    />
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <button 
                    className="btn btn-outline-secondary" 
                    style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                    onClick={() => setShowExerciseModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn fw-bold" 
                    style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                    onClick={addExerciseFromModal}
                  >
                    Add Exercise
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
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
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
        
        {/* Nutrition Goal Modal */}
        {showGoalModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: '#fff' }}>Set Nutrition Goals</h5>
                  <button 
                    type="button"
                    className="btn-close btn-close-white" 
                    onClick={() => setShowGoalModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSetNutritionGoal}>
                  <div className="modal-body" style={{ color: '#fff' }}>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#d1d5db' }}>Goal Type</label>
                      <select 
                        className="form-select dropdown-dark"
                        value={goalForm.goal_type}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, goal_type: e.target.value }))}
                        style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444' }}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#d1d5db' }}>Target Calories</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_calories}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_calories: e.target.value }))}
                        style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444' }}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#d1d5db' }}>Target Protein (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_protein}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_protein: e.target.value }))}
                        style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444' }}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#d1d5db' }}>Target Carbs (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_carbs}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_carbs: e.target.value }))}
                        style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444' }}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#d1d5db' }}>Target Fat (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_fat}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_fat: e.target.value }))}
                        style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444' }}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <button 
                      type="button"
                      className="btn" 
                      onClick={() => setShowGoalModal(false)}
                      style={{ backgroundColor: '#4b5563', color: '#fff', border: 'none' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn"
                      style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                    >
                      Save Goals
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Custom Food Modal */}
        {showCustomFoodModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: '#fff' }}>{customFoodForm.id ? 'Edit' : 'Create'} Custom Food</h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => {
                      setShowCustomFoodModal(false);
                      setCustomFoodForm({ name: '', brand: '', serving_size: 100, serving_unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0, portions: [] });
                    }}
                  ></button>
                </div>
                <form onSubmit={handleSaveCustomFood}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>Food Name *</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={customFoodForm.name}
                        onChange={(e) => setCustomFoodForm({...customFoodForm, name: e.target.value})}
                        required
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>Serving Size *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.serving_size}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, serving_size: parseFloat(e.target.value)})}
                          required
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>Unit *</label>
                        <select 
                          className="form-select"
                          value={customFoodForm.serving_unit}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, serving_unit: e.target.value})}
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        >
                          <option value="g">Grams (g)</option>
                          <option value="ml">Milliliters (ml)</option>
                          <option value="oz">Ounces (oz)</option>
                          <option value="cup">Cup</option>
                          <option value="tbsp">Tablespoon</option>
                          <option value="tsp">Teaspoon</option>
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>Calories *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.calories}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, calories: parseFloat(e.target.value)})}
                          required
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>Protein (g) *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.protein}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, protein: parseFloat(e.target.value)})}
                          required
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>Carbs (g) *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.carbs}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, carbs: parseFloat(e.target.value)})}
                          required
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>Fat (g) *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.fat}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, fat: parseFloat(e.target.value)})}
                          required
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        />
                      </div>
                    </div>
                    

                  </div>
                  <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={() => setShowCustomFoodModal(false)}
                      style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn"
                      style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                    >
                      {customFoodForm.id ? 'Save Changes' : 'Create Food'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Custom Meal Type Modal */}
        {showCustomMealTypeModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="modal-header dark-modal-header" style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="modal-title" style={{ color: '#fff' }}>Manage Meal Types</h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setShowCustomMealTypeModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ color: '#fff' }}>Add New Meal Type</label>
                    <div className="input-group">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="e.g., Pre-workout, Post-workout"
                        value={newMealType}
                        onChange={(e) => setNewMealType(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMealType())}
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                      />
                      <button 
                        type="button"
                        className="btn"
                        onClick={handleAddMealType}
                        style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label" style={{ color: '#fff' }}>Current Meal Types:</label>
                    <div>
                      {customMealTypes.map((mealType, idx) => (
                        <div 
                          key={idx} 
                          className="d-flex justify-content-between align-items-center mb-2 p-3 rounded"
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                        >
                          <span className="text-capitalize" style={{ color: '#fff' }}>{mealType}</span>
                          <button 
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleRemoveMealType(mealType)}
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => setShowCustomMealTypeModal(false)}
                    style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Program View/Edit Modal */}
        {(showProgramModal && (viewingProgram || editingProgram)) && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content" style={{ background: '#1a1a1a', color: '#ffffff' }}>
                <div className="modal-header" style={{ background: '#1a1a1a', borderBottom: '1px solid #3d3d3d' }}>
                  <h5 className="modal-title" style={{ color: '#ffffff' }}>
                    {editingProgram ? 'Edit Program' : 'Program Details'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => {
                      setShowProgramModal(false);
                      setViewingProgram(null);
                      setEditingProgram(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body" style={{ background: '#1a1a1a' }}>
                  {editingProgram ? (
                    // Edit Mode
                    <form>
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#ffffff' }}>Program Title</label>
                        <input 
                          type="text"
                          className="form-control"
                          style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', color: '#ffffff' }}
                          value={editingProgram.title || ''}
                          onChange={(e) => setEditingProgram({...editingProgram, title: e.target.value})}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#ffffff' }}>Description</label>
                        <textarea 
                          className="form-control"
                          style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', color: '#ffffff' }}
                          rows="3"
                          value={editingProgram.description || ''}
                          onChange={(e) => setEditingProgram({...editingProgram, description: e.target.value})}
                        ></textarea>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#ffffff' }}>Category</label>
                          <select 
                            className="form-control"
                            style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', color: '#ffffff' }}
                            value={editingProgram.category || ''}
                            onChange={(e) => setEditingProgram({...editingProgram, category: e.target.value})}
                          >
                            <option value="Strength">Strength</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Flexibility">Flexibility</option>
                            <option value="General Fitness">General Fitness</option>
                          </select>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#ffffff' }}>Difficulty</label>
                          <select 
                            className="form-control"
                            style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', color: '#ffffff' }}
                            value={editingProgram.difficulty_level || ''}
                            onChange={(e) => setEditingProgram({...editingProgram, difficulty_level: e.target.value})}
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#ffffff' }}>Duration (weeks)</label>
                        <input 
                          type="number"
                          className="form-control"
                          style={{ background: '#2d2d2d', border: '1px solid #3d3d3d', color: '#ffffff' }}
                          min="1"
                          max="52"
                          value={editingProgram.duration_weeks || ''}
                          onChange={(e) => setEditingProgram({...editingProgram, duration_weeks: parseInt(e.target.value)})}
                        />
                      </div>
                    </form>
                  ) : (
                    // View Mode
                    <div>
                      <div className="mb-4">
                        <h6 style={{ color: '#ffffff' }}>Program Information</h6>
                        <div className="row">
                          <div className="col-md-6">
                            <p style={{ color: '#ffffff' }}><strong>Title:</strong> {viewingProgram.title}</p>
                            <p style={{ color: '#ffffff' }}><strong>Category:</strong> {viewingProgram.category}</p>
                            <p style={{ color: '#ffffff' }}><strong>Difficulty:</strong> <span className="text-capitalize">{viewingProgram.difficulty_level}</span></p>
                          </div>
                          <div className="col-md-6">
                            <p style={{ color: '#ffffff' }}><strong>Duration:</strong> {viewingProgram.duration_weeks} weeks</p>
                            <p style={{ color: '#ffffff' }}><strong>Created:</strong> {viewingProgram.created_at ? new Date(viewingProgram.created_at).toLocaleDateString() : 'N/A'}</p>
                            {viewingProgram.trainer_name && (
                              <p style={{ color: '#ffffff' }}><strong>Created by:</strong> {viewingProgram.trainer_name}</p>
                            )}
                          </div>
                        </div>
                        {viewingProgram.description && (
                          <div>
                            <p style={{ color: '#ffffff' }}><strong>Description:</strong></p>
                            <p className="text-muted">{viewingProgram.description}</p>
                          </div>
                        )}
                      </div>
                      
                      {viewingProgram.sessions && viewingProgram.sessions.length > 0 && (
                        <div className="mb-4">
                          <h6 style={{ color: '#ffffff' }}>Workout Sessions</h6>
                          <div className="row">
                            {viewingProgram.sessions.map((session, index) => (
                              <div key={index} className="col-12 mb-3">
                                <div className="card" style={{ background: '#2d2d2d', border: '1px solid #3d3d3d' }}>
                                  <div className="card-body" style={{ background: '#2d2d2d' }}>
                                    <h6 className="card-title" style={{ color: '#ffffff' }}>{session.name || session.session_name}</h6>
                                    {session.session_description && (
                                      <p className="card-text small text-muted">{session.session_description}</p>
                                    )}
                                    <div className="d-flex gap-2 mb-3">
                                      <span className="badge" style={{ background: '#ffffff', color: '#000000' }}>Week {session.week_number}</span>
                                      <span className="badge" style={{ background: '#ffffff', color: '#000000' }}>Day {session.day_number}</span>
                                    </div>
                                    
                                    {/* Exercise Details */}
                                    {session.exercises && session.exercises.length > 0 && (
                                      <div>
                                        <h6 className="mb-2" style={{ color: '#ffffff' }}>Exercises ({session.exercises.length})</h6>
                                        <div className="row">
                                          {session.exercises.map((exercise, exIndex) => (
                                            <div key={exIndex} className="col-md-6 mb-2">
                                              <div className="border rounded p-2" style={{ background: '#1a1a1a', borderColor: '#3d3d3d' }}>
                                                <div className="d-flex justify-content-between align-items-start">
                                                  <div>
                                                    <strong style={{ color: '#ffffff' }}>{exercise.exercise_name}</strong>
                                                    <div className="text-muted small">
                                                      {exercise.muscle_group && `${exercise.muscle_group} • `}
                                                      {exercise.equipment && exercise.equipment}
                                                    </div>
                                                  </div>
                                                  <span className="badge" style={{ background: '#4f46e5', color: '#ffffff' }}>{exercise.exercise_order}</span>
                                                </div>
                                                <div className="mt-1">
                                                  <span style={{ color: '#ffffff' }}>
                                                    <strong>{exercise.sets}</strong> sets × <strong>{exercise.reps}</strong> reps
                                                    {exercise.rpe && ` @ RPE ${exercise.rpe}`}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {(!session.exercises || session.exercises.length === 0) && (
                                      <div className="text-muted">
                                        <small>No exercises added to this session</small>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!viewingProgram.sessions || viewingProgram.sessions.length === 0) && (
                        <div className="text-center py-4">
                          <i className="bi bi-clipboard display-4 text-muted mb-3"></i>
                          <h6 className="text-muted">No detailed sessions available</h6>
                          <p className="text-muted">This is a basic program assignment.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ background: '#1a1a1a', borderTop: '1px solid #3d3d3d' }}>
                  {editingProgram ? (
                    <>
                      <button 
                        type="button" 
                        className="btn"
                        style={{ background: '#6b7280', color: '#ffffff', border: 'none' }}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn"
                        style={{ background: '#10b981', color: '#ffffff', border: 'none' }}
                        onClick={handleSaveProgram}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        className="btn"
                        style={{ background: '#6b7280', color: '#ffffff', border: 'none' }}
                        onClick={() => {
                          setShowProgramModal(false);
                          setViewingProgram(null);
                        }}
                      >
                        Close
                      </button>
                      {viewingProgram && viewingProgram.created_by_trainer_id && (
                        <button 
                          type="button" 
                          className="btn"
                          style={{ background: '#ef4444', color: '#ffffff', border: 'none' }}
                          onClick={() => handleDeleteProgram(viewingProgram)}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Delete Program
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
            <div className="toast show" role="alert" style={{ backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}>
              <div className={`toast-header bg-${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'danger' : 'warning'} text-white`} style={{ borderBottom: 'none' }}>
                <strong className="me-auto">
                  {toast.type === 'success' ? '✓ Success' : toast.type === 'error' ? '✕ Error' : '⚠ Warning'}
                </strong>
                <button 
                  className="btn-close btn-close-white" 
                  onClick={() => setToast({ show: false, message: '', type: 'success' })}
                ></button>
              </div>
              <div className="toast-body" style={{ color: '#fff', fontSize: '15px' }}>{toast.message}</div>
            </div>
          </div>
        )}

        {/* Unassign Program Confirmation Modal */}
        {unassignProgramModal.show && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <div className="modal-header border-bottom border-dark position-relative" style={{ background: '#1a1a1a' }}>
                  <h5 className="modal-title fw-bold" style={{ color: '#ffffff' }}>
                    <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                    Remove from client?
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setUnassignProgramModal({ show: false, assignmentId: null })}
                  ></button>
                </div>
                <div className="modal-body py-4">
                  <p className="text-white fs-5 mb-0 text-center">Are you sure you want to unassign this program?</p>
                </div>
                <div className="modal-footer border-top border-dark d-flex justify-content-center gap-3">
                  <button 
                    type="button" 
                    className="btn btn-dark px-4 py-2"
                    onClick={() => setUnassignProgramModal({ show: false, assignmentId: null })}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning px-4 py-2 fw-bold shadow-sm"
                    onClick={executeUnassignProgram}
                  >
                    Yes, Unassign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      
        {/* Delete Program Confirmation Modal */}
        {deleteProgramModal.show && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0" style={{ background: '#1a1a1a', border: '1px solid #3d3d3d', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <div className="modal-header border-bottom border-dark position-relative" style={{ background: '#1a1a1a' }}>
                  <h5 className="modal-title fw-bold" style={{ color: '#ffffff' }}>
                    <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                    Confirm Delete
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setDeleteProgramModal({ show: false, programId: null })}
                  ></button>
                </div>
                <div className="modal-body py-4">
                  <p className="text-white fs-5 mb-0 text-center">Are you sure you want to delete this program?</p>
                  <p className="text-muted small text-center mt-2">
                    Existing clients will still have access to it, but it will be removed permanently from your assignment list.
                  </p>
                </div>
                <div className="modal-footer border-top border-dark d-flex justify-content-center gap-3">
                  <button 
                    type="button" 
                    className="btn btn-dark px-4 py-2"
                    onClick={() => setDeleteProgramModal({ show: false, programId: null })}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger px-4 py-2 fw-bold shadow-sm"
                    onClick={executeDeleteProgram}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default ManageClientPrograms;
