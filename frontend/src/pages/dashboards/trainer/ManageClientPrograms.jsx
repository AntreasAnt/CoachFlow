import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';

// Reuse the same styles from CreatePrograms
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

const ManageClientPrograms = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // overview, assign-program, create-program, browse-programs, nutrition
  const [clientInfo, setClientInfo] = useState(null);
  
  // Programs
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [allTrainerPrograms, setAllTrainerPrograms] = useState([]); // All programs including from other clients
  const [selectedProgramToAssign, setSelectedProgramToAssign] = useState('');
  const [programSearchQuery, setProgramSearchQuery] = useState('');
  
  // Exercises for program creation
  const [allExercises, setAllExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
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
  
  // Meals
  const [nutritionGoal, setNutritionGoal] = useState(null);
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [showCustomMealTypeModal, setShowCustomMealTypeModal] = useState(false);
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
  
  const categories = ['Strength', 'Cardio', 'Hybrid', 'Weight Loss', 'Muscle Building', 'Endurance', 'Flexibility', 'General Fitness'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // mealTypes is now customMealTypes state
  
  useEffect(() => {
    fetchClientData();
    fetchExercises();
    fetchAllTrainerPrograms();
    fetchTrainerCustomFoods();
  }, [clientId]);
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };
  
  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client info
      const url = `${BACKEND_ROUTES_API}GetClientInfo.php?client_id=${clientId}`;
      console.log('Fetching client info from:', url);
      const clientResponse = await APIClient.get(url);
      if (clientResponse.success) {
        setClientInfo(clientResponse.client);
      }
      
      // Fetch assigned programs
      const assignedResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetClientAssignedPrograms.php?client_id=${clientId}`);
      if (assignedResponse.success) {
        setAssignedPrograms(assignedResponse.programs || []);
      }
      
      // Fetch available programs to assign
      const availableResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerPrograms.php`);
      if (availableResponse.success) {
        setAvailablePrograms(availableResponse.programs || []);
      }
      
      // Fetch client nutrition goal
      const goalResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetClientNutritionGoal.php?client_id=${clientId}`);
      if (goalResponse.success && goalResponse.goal) {
        setNutritionGoal(goalResponse.goal);
      }
      
      // Fetch weekly meal plan
      const mealsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetClientWeeklyMeals.php?client_id=${clientId}`);
      if (mealsResponse.success) {
        setWeeklyMeals(mealsResponse.meals || []);
      }
      
    } catch (error) {
      console.error('Error fetching client data:', error);
      showToast('Error loading client data', 'error');
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
  
  const handleAssignProgram = async () => {
    if (!selectedProgramToAssign) {
      showToast('Please select a program', 'warning');
      return;
    }
    
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}AssignProgramToClient.php`, {
        client_id: clientId,
        program_id: selectedProgramToAssign
      });
      
      if (response.success) {
        showToast('Program assigned successfully!', 'success');
        setActiveView('overview');
        setSelectedProgramToAssign('');
        fetchClientData();
      } else {
        showToast(response.message || 'Failed to assign program', 'error');
      }
    } catch (error) {
      console.error('Error assigning program:', error);
      showToast('Error assigning program', 'error');
    }
  };
  
  const handleUnassignProgram = async (assignmentId) => {
    if (!confirm('Remove this program from client?')) return;
    
    try {
      const response = await APIClient.delete(`${BACKEND_ROUTES_API}UnassignProgramFromClient.php`, {
        assignment_id: assignmentId
      });
      
      if (response.success) {
        showToast('Program removed successfully!', 'success');
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
    
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}SetClientWeeklyMeals.php`, {
        client_id: clientId,
        day_of_week: currentMeal.day_of_week,
        meal_type: currentMeal.meal_type,
        food_items: currentMeal.food_items,
        notes: currentMeal.notes
      });
      
      if (response.success) {
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
        showToast(response.message || 'Failed to save meal', 'error');
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      showToast('Error saving meal', 'error');
    }
  };
  
  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Delete this meal?')) return;
    
    try {
      const response = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteClientMeal.php`, {
        meal_id: mealId
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
    const portions = food.portions || food.foodPortions || [];
    setAvailablePortions(portions);
    
    // Calculate base nutrition per 100g
    let calories, protein, carbs, fat;
    
    if (food.source === 'usda') {
      const nutrients = food.foodNutrients || [];
      calories = nutrients.find(n => n.nutrientId === 1008)?.value || 0;
      protein = nutrients.find(n => n.nutrientId === 1003)?.value || 0;
      carbs = nutrients.find(n => n.nutrientId === 1005)?.value || 0;
      fat = nutrients.find(n => n.nutrientId === 1004)?.value || 0;
    } else {
      calories = food.calories || 0;
      protein = food.protein || 0;
      carbs = food.carbs || 0;
      fat = food.fat || 0;
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
      quantity: 1,
      calories: calories.toFixed(1),
      protein: protein.toFixed(1),
      carbs: carbs.toFixed(1),
      fat: fat.toFixed(1)
    };
    
    addFoodToMeal(foodItem);
    setMealSearchQuery('');
    setFoodSearchResults([]);
  };
  
  const handleMeasurementTypeChange = (newUnit, foodItemIndex) => {
    const updatedFoodItems = [...currentMeal.food_items];
    const foodItem = updatedFoodItems[foodItemIndex];
    
    let defaultQuantity = 1;
    let portionGramWeight = null;
    let calories, protein, carbs, fat;
    
    if (newUnit === 'g' || newUnit === 'ml') {
      const multiplier = 100 / 100; // per 100g
      calories = (baseNutrition.calories * multiplier).toFixed(1);
      protein = (baseNutrition.protein * multiplier).toFixed(1);
      carbs = (baseNutrition.carbs * multiplier).toFixed(1);
      fat = (baseNutrition.fat * multiplier).toFixed(1);
      defaultQuantity = 100;
    } else if (newUnit.startsWith('portion_')) {
      const portionIndex = parseInt(newUnit.split('_')[1]);
      const portion = availablePortions[portionIndex];
      portionGramWeight = portion.gramWeight || portion.gram_weight || 100;
      const multiplier = portionGramWeight / 100;
      calories = (baseNutrition.calories * multiplier).toFixed(1);
      protein = (baseNutrition.protein * multiplier).toFixed(1);
      carbs = (baseNutrition.carbs * multiplier).toFixed(1);
      fat = (baseNutrition.fat * multiplier).toFixed(1);
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
  
  const handleCreateCustomFood = async (e) => {
    e.preventDefault();
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}CreateTrainerCustomFood.php`, customFoodForm);
      if (response.success) {
        showToast('Custom food created successfully!', 'success');
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
        showToast(response.message || 'Failed to create custom food', 'error');
      }
    } catch (error) {
      console.error('Error creating custom food:', error);
      showToast('Error creating custom food', 'error');
    }
  };
  
  const handleDeleteCustomFood = async (foodId) => {
    if (!confirm('Delete this custom food?')) return;
    try {
      const response = await APIClient.delete(`${BACKEND_ROUTES_API}DeleteTrainerCustomFood.php`, { food_id: foodId });
      if (response.success) {
        showToast('Custom food deleted!', 'success');
        fetchTrainerCustomFoods();
      } else {
        showToast(response.message || 'Failed to delete', 'error');
      }
    } catch (error) {
      console.error('Error deleting custom food:', error);
      showToast('Error deleting custom food', 'error');
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
    if (confirm(`Remove "${mealType}" meal type?`)) {
      setCustomMealTypes(customMealTypes.filter(mt => mt !== mealType));
      showToast('Meal type removed!', 'success');
    }
  };
  
  const getMealForDayAndType = (dayOfWeek, mealType) => {
    return weeklyMeals.find(m => m.day_of_week === dayOfWeek && m.meal_type === mealType);
  };

  const saveNutritionGoal = async () => {
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}SetClientNutritionGoal.php`, {
        client_id: clientId,
        ...goalForm
      });
      
      if (response.success) {
        showToast('Nutrition goal set successfully!', 'success');
        setShowGoalModal(false);
        fetchClientData();
      } else {
        showToast(response.message || 'Failed to set goal', 'error');
      }
    } catch (error) {
      console.error('Error setting goal:', error);
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
  
  const filteredExercises = React.useMemo(() => {
    return allExercises
      .filter(exercise => exercise.is_custom == 0)
      .filter(exercise =>
        exercise.name?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.category?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        exercise.muscle_group?.toLowerCase().includes(exerciseSearch.toLowerCase())
      );
  }, [allExercises, exerciseSearch]);
  
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
        sessions: workoutSessions,
        client_id: clientId // Link to specific client
      };
      
      const response = await APIClient.post(`${BACKEND_ROUTES_API}CreateClientProgram.php`, programData);
      
      if (response.success) {
        showToast('Custom program created and assigned!', 'success');
        setActiveView('overview');
        resetProgramForm();
        fetchClientData();
      } else {
        showToast(response.message || 'Failed to create program', 'error');
      }
    } catch (error) {
      console.error('Error creating program:', error);
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
        <div className="container py-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }
  
  return (
    <TrainerDashboardLayout>
      <style>{styles}</style>
      <div className="container py-4" style={{ minHeight: 'calc(100vh - 0px)' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button 
              className="btn btn-link p-0 mb-2"
              onClick={() => navigate('/trainer/clients')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Clients
            </button>
            <h4 className="mb-0">
              Manage Programs & Nutrition for {clientInfo?.full_name || clientInfo?.username}
            </h4>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <i className="bi bi-grid me-2"></i>
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeView === 'assign-program' ? 'active' : ''}`}
              onClick={() => setActiveView('assign-program')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Assign Existing Program
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeView === 'create-program' ? 'active' : ''}`}
              onClick={() => setActiveView('create-program')}
            >
              <i className="bi bi-plus-square me-2"></i>
              Create Custom Program
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeView === 'nutrition' ? 'active' : ''}`}
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
            <div className="card mb-4">
              <div className="card-header bg-white">
                <h5 className="mb-0">Assigned Programs ({assignedPrograms.length})</h5>
              </div>
              <div className="card-body">
                {assignedPrograms.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-inbox display-4 text-muted"></i>
                    <p className="text-muted mt-3">No programs assigned yet</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setActiveView('assign-program')}
                    >
                      Assign a Program
                    </button>
                  </div>
                ) : (
                  <div className="row">
                    {assignedPrograms.map(program => (
                      <div key={program.assignment_id} className="col-md-6 col-lg-4 mb-3">
                        <div className="card card-hover h-100">
                          <div className="card-body">
                            <h6 className="card-title">{program.title}</h6>
                            <p className="text-muted small mb-2">{program.description}</p>
                            <div className="d-flex flex-wrap gap-1 mb-2">
                              <span className="badge bg-light text-dark">{program.category}</span>
                              <span className="badge bg-light text-dark">{program.duration_weeks} weeks</span>
                            </div>
                            <small className="text-muted">
                              Assigned {new Date(program.assigned_at).toLocaleDateString()}
                            </small>
                            <div className="mt-3">
                              <button 
                                className="btn btn-sm btn-outline-danger w-100"
                                onClick={() => handleUnassignProgram(program.assignment_id)}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Nutrition Overview */}
            <div className="card">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Nutrition Goals</h5>
                <button 
                  className="btn btn-sm btn-primary"
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
              <div className="card-body">
                {nutritionGoal ? (
                  <div className="row">
                    <div className="col-md-3">
                      <h6 className="text-muted small">CALORIES</h6>
                      <h4 className="mb-0">{nutritionGoal.target_calories}</h4>
                    </div>
                    <div className="col-md-3">
                      <h6 className="text-muted small">PROTEIN</h6>
                      <h4 className="mb-0">{nutritionGoal.target_protein}g</h4>
                    </div>
                    <div className="col-md-3">
                      <h6 className="text-muted small">CARBS</h6>
                      <h4 className="mb-0">{nutritionGoal.target_carbs}g</h4>
                    </div>
                    <div className="col-md-3">
                      <h6 className="text-muted small">FAT</h6>
                      <h4 className="mb-0">{nutritionGoal.target_fat}g</h4>
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
        
        {/* Assign Existing Program Tab */}
        {activeView === 'assign-program' && (
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Select a Program to Assign</h5>
            </div>
            <div className="card-body">
              {availablePrograms.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">You don't have any programs yet. Create one first!</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/trainer/programs')}
                  >
                    Create a Program
                  </button>
                </div>
              ) : (
                <div>
                  <div className="row">
                    {availablePrograms.map(program => (
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
                            <div className="d-flex flex-wrap gap-1">
                              <span className="badge bg-light text-dark">{program.category}</span>
                              <span className="badge bg-light text-dark">{program.difficulty_level}</span>
                              <span className="badge bg-light text-dark">{program.duration_weeks} weeks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <button 
                      className="btn btn-primary"
                      onClick={handleAssignProgram}
                      disabled={!selectedProgramToAssign}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Assign Selected Program
                    </button>
                    <button 
                      className="btn btn-secondary ms-2"
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
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Browse All Your Programs</h5>
              <small className="text-muted">Select any program you've created to assign to this client</small>
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
                  
                  <div className="mt-4">
                    <button 
                      className="btn btn-primary"
                      onClick={handleAssignProgram}
                      disabled={!selectedProgramToAssign}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Assign Selected Program
                    </button>
                    <button 
                      className="btn btn-secondary ms-2"
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
          <div>
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              This custom program will be created specifically for {clientInfo?.full_name || clientInfo?.username} and automatically assigned to them.
            </div>
            
            {/* Program creation interface - simplified version for client-specific programs */}
            <div className="card mb-4">
              <div className="card-header bg-white">
                <h5 className="mb-0">Program Details</h5>
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
            <div className="card mb-4">
              <div className="card-header bg-white">
                <h5 className="mb-0">Workout Sessions ({workoutSessions.length})</h5>
              </div>
              <div className="card-body">
                {workoutSessions.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    No workout sessions added yet. Create one below!
                  </p>
                ) : (
                  <div className="list-group mb-3">
                    {workoutSessions.map((session, index) => (
                      <div key={index} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6>{session.name}</h6>
                            <p className="text-muted small mb-1">{session.description}</p>
                            <span className="badge bg-info me-1">Week {session.week_number}</span>
                            <span className="badge bg-info me-1">Day {session.day_number}</span>
                            <span className="badge bg-secondary">{session.exercises.length} exercises</span>
                          </div>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setWorkoutSessions(prev => prev.filter((_, i) => i !== index))}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Session Builder */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Create Workout Session</h5>
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
                <h6 className="mb-3">Add Exercises</h6>
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Search exercises..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />
                </div>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div className="row">
                    {filteredExercises.slice(0, 20).map((exercise) => (
                      <div key={exercise.id} className="col-md-6 mb-2">
                        <div 
                          className="card card-hover cursor-pointer"
                          onClick={() => openExerciseModal(exercise)}
                        >
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between">
                              <div>
                                <small className="fw-bold">{exercise.name}</small>
                                <br />
                                <small className="text-muted">{exercise.muscle_group}</small>
                              </div>
                              <i className="bi bi-plus-circle text-primary"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <hr />
                
                {/* Current Session Exercises */}
                <h6 className="mb-3">Session Exercises ({currentSession.exercises.length})</h6>
                {currentSession.exercises.length === 0 ? (
                  <p className="text-muted small">No exercises added yet</p>
                ) : (
                  <div className="mb-3">
                    {currentSession.exercises.map((exercise, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                        <div>
                          <small className="fw-bold">{exercise.name}</small>
                          <br />
                          <small className="text-muted">{exercise.sets} sets x {exercise.reps} {exercise.rpe && `• RPE ${exercise.rpe}`}</small>
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
            <div className="card">
              <div className="card-body">
                <button 
                  className="btn btn-primary btn-lg me-2"
                  onClick={saveCustomProgram}
                  disabled={!programPackage.title || workoutSessions.length === 0}
                >
                  <i className="bi bi-save me-2"></i>
                  Create & Assign Program
                </button>
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActiveView('overview')}
                >
                  Cancel
                </button>
                <small className="text-muted ms-3">
                  {workoutSessions.length} session(s) ready
                </small>
              </div>
            </div>
          </div>
        )}
        
        {/* Nutrition Tab */}
        {activeView === 'nutrition' && (
          <div>
            {/* Nutrition Goals Section */}
            <div className="card mb-4">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Nutrition Goals</h5>
                <button 
                  className="btn btn-sm btn-primary"
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
              <div className="card-body">
                {nutritionGoal ? (
                  <div className="row">
                    <div className="col-md-3">
                      <div className="card">
                        <div className="card-body text-center">
                          <h6 className="text-muted small">CALORIES</h6>
                          <h3 className="mb-0">{nutritionGoal.target_calories}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card">
                        <div className="card-body text-center">
                          <h6 className="text-muted small">PROTEIN</h6>
                          <h3 className="mb-0">{nutritionGoal.target_protein}g</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card">
                        <div className="card-body text-center">
                          <h6 className="text-muted small">CARBS</h6>
                          <h3 className="mb-0">{nutritionGoal.target_carbs}g</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card">
                        <div className="card-body text-center">
                          <h6 className="text-muted small">FAT</h6>
                          <h3 className="mb-0">{nutritionGoal.target_fat}g</h3>
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
            
            {/* Weekly Meal Plan Section */}
            <div className="card">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Weekly Meal Plan</h5>
                  <small className="text-muted">Plan meals for each day of the week</small>
                </div>
                <div className="btn-group btn-group-sm">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setShowCustomFoodModal(true)}
                    title="Create custom food"
                  >
                    <i className="bi bi-plus-circle me-1"></i> Custom Food
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCustomMealTypeModal(true)}
                    title="Manage meal types"
                  >
                    <i className="bi bi-gear me-1"></i> Meal Types
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '15%' }}>Day</th>
                        {customMealTypes.map(mealType => (
                          <th key={mealType} className="text-capitalize">{mealType}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {daysOfWeek.map((day, dayIndex) => (
                        <tr key={dayIndex}>
                          <td className="fw-bold">{day}</td>
                          {customMealTypes.map(mealType => {
                            const meal = getMealForDayAndType(dayIndex + 1, mealType);
                            return (
                              <td key={mealType}>
                                {meal ? (
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <small>
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
                                    className="btn btn-sm btn-outline-secondary w-100"
                                    onClick={() => openMealModal(dayIndex + 1, mealType)}
                                  >
                                    <i className="bi bi-plus"></i> Add
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
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {daysOfWeek[currentMeal.day_of_week - 1]} - {currentMeal.meal_type.charAt(0).toUpperCase() + currentMeal.meal_type.slice(1)}
                  </h5>
                  <button 
                    className="btn-close" 
                    onClick={() => setShowMealModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSaveMeal}>
                  <div className="modal-body">
                    {/* Search Foods */}
                    <div className="mb-3">
                      <label className="form-label">Search & Add Foods</label>
                      <div className="input-group">
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Search for foods..."
                          value={mealSearchQuery}
                          onChange={(e) => setMealSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), searchFoods())}
                        />
                        <button 
                          type="button"
                          className="btn btn-primary"
                          onClick={searchFoods}
                        >
                          Search
                        </button>
                      </div>
                    </div>
                    
                    {/* Search Results */}
                    {foodSearchResults.length > 0 && (
                      <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <h6 className="small text-muted">
                          {searching ? 'Searching...' : `Results for "${resultsFor}":`}
                        </h6>
                        <div className="list-group">
                          {foodSearchResults.slice(0, 15).map((food, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="list-group-item list-group-item-action text-start"
                              onClick={() => selectFood(food)}
                            >
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <div className="fw-bold small">{food.description || food.name}</div>
                                  {food.brand_name && (
                                    <div className="text-muted small">{food.brand_name}</div>
                                  )}
                                  {food.trainer_name && (
                                    <div className="text-primary small">By: {food.trainer_name}</div>
                                  )}
                                  <div className="text-muted small">
                                    {food.source === 'usda' && (
                                      <>
                                        {food.foodNutrients && (
                                          <>
                                            Cal: {food.foodNutrients.find(n => n.nutrientId === 1008)?.value?.toFixed(0) || 0} • 
                                            P: {food.foodNutrients.find(n => n.nutrientId === 1003)?.value?.toFixed(1) || 0}g • 
                                            C: {food.foodNutrients.find(n => n.nutrientId === 1005)?.value?.toFixed(1) || 0}g • 
                                            F: {food.foodNutrients.find(n => n.nutrientId === 1004)?.value?.toFixed(1) || 0}g
                                          </>
                                        )}
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
                                <span className={`badge ${food.source === 'trainer_custom' ? 'bg-success' : food.source === 'custom' ? 'bg-info' : 'bg-secondary'}`}>
                                  {food.source === 'trainer_custom' ? 'Trainer' : food.source}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Selected Foods */}
                    <div className="mb-3">
                      <label className="form-label">Selected Foods:</label>
                      {currentMeal.food_items.length === 0 ? (
                        <p className="text-muted small">No foods added yet</p>
                      ) : (
                        <div className="list-group">
                          {currentMeal.food_items.map((food, idx) => (
                            <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                              <span>{food.name || food.food_name}</span>
                              <button 
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeFoodFromMeal(idx)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Notes */}
                    <div className="mb-3">
                      <label className="form-label">Notes (Optional)</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={currentMeal.notes}
                        onChange={(e) => setCurrentMeal(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any notes or instructions..."
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      onClick={() => setShowMealModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn btn-primary"
                    >
                      Save Meal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Exercise Modal */}
        {showExerciseModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add {selectedExercise?.name}</h5>
                  <button 
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
                      placeholder="e.g., 8-12"
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
                    className="btn btn-secondary" 
                    onClick={() => setShowExerciseModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
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
        
        {/* Nutrition Goal Modal */}
        {showGoalModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Set Nutrition Goals</h5>
                  <button 
                    className="btn-close" 
                    onClick={() => setShowGoalModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSetNutritionGoal}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Goal Type</label>
                      <select 
                        className="form-select"
                        value={goalForm.goal_type}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, goal_type: e.target.value }))}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Target Calories</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_calories}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_calories: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Target Protein (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_protein}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_protein: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Target Carbs (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_carbs}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_carbs: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Target Fat (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_fat}
                        onChange={(e) => setGoalForm(prev => ({ ...prev, target_fat: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      onClick={() => setShowGoalModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn btn-primary"
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
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Custom Food</h5>
                  <button className="btn-close" onClick={() => setShowCustomFoodModal(false)}></button>
                </div>
                <form onSubmit={handleCreateCustomFood}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Food Name *</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={customFoodForm.name}
                        onChange={(e) => setCustomFoodForm({...customFoodForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Brand</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={customFoodForm.brand}
                        onChange={(e) => setCustomFoodForm({...customFoodForm, brand: e.target.value})}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Serving Size *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.serving_size}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, serving_size: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Unit *</label>
                        <select 
                          className="form-select"
                          value={customFoodForm.serving_unit}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, serving_unit: e.target.value})}
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
                        <label className="form-label">Calories *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.calories}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, calories: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Protein (g) *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.protein}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, protein: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Carbs (g) *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.carbs}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, carbs: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Fat (g) *</label>
                        <input 
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={customFoodForm.fat}
                          onChange={(e) => setCustomFoodForm({...customFoodForm, fat: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCustomFoodModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Create Food</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Custom Meal Type Modal */}
        {showCustomMealTypeModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Manage Meal Types</h5>
                  <button className="btn-close" onClick={() => setShowCustomMealTypeModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Add New Meal Type</label>
                    <div className="input-group">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="e.g., Pre-workout, Post-workout"
                        value={newMealType}
                        onChange={(e) => setNewMealType(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMealType())}
                      />
                      <button 
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddMealType}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Current Meal Types:</label>
                    <div className="list-group">
                      {customMealTypes.map((mealType, idx) => (
                        <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="text-capitalize">{mealType}</span>
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveMealType(mealType)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCustomMealTypeModal(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
            <div className="toast show" role="alert">
              <div className={`toast-header bg-${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'danger' : 'warning'} text-white`}>
                <strong className="me-auto">
                  {toast.type === 'success' ? '✓ Success' : toast.type === 'error' ? '✕ Error' : '⚠ Warning'}
                </strong>
                <button 
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

export default ManageClientPrograms;
