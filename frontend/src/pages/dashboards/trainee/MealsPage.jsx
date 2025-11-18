import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/trainee-dashboard.css';
import { API_BASE_URL, BACKEND_ROUTES_API } from '../../../config/config';
import TraineeHeader from '../../../components/TraineeHeader';

const MealsPage = () => {
  const navigate = useNavigate();
  const [todayLogs, setTodayLogs] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [nutritionGoal, setNutritionGoal] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ usda_foods: [], custom_foods: [] });
  const [resultsFor, setResultsFor] = useState('');
  const [searching, setSearching] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');
  const searchAbortRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [availablePortions, setAvailablePortions] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Store base nutritional values (per serving) for proportional calculation
  const [baseNutrition, setBaseNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    serving_size: 0,
    original_serving_size: 0,
    original_calories: 0,
    original_protein: 0,
    original_carbs: 0,
    original_fat: 0
  });
  
  // Form states
  const [goalForm, setGoalForm] = useState({
    goal_type: 'daily',
    target_calories: '',
    target_protein: '',
    target_carbs: '',
    target_fat: ''
  });
  
  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    food_source: 'usda',
    food_id: '',
    food_name: '',
    serving_size: '',
    serving_unit: 'g',
    quantity: 1,
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: ''
  });

  useEffect(() => {
  // Ensure a clean search state when the page mounts
  resetSearchState();
    loadData();
  }, []);

  // Helper function to convert text to title case
  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to format serving string nicely (e.g., 2 eggs instead of "2 1 egg")
  const formatServing = (quantityVal, unitRaw) => {
    if (!unitRaw) return String(quantityVal || '');
    const qtyNum = parseFloat(quantityVal);
    const qtyDisplay = Number.isNaN(qtyNum) ? 0 : (Number.isInteger(qtyNum) ? qtyNum : parseFloat(qtyNum.toFixed(2)));
    const unit = String(unitRaw).trim();

    // Handle internal portion unit keys
    if (unit.startsWith('portion_')) {
      return `${qtyDisplay} portion${qtyDisplay === 1 ? '' : 's'}`;
    }

    // Grams / ml simple case
    if (unit === 'g' || unit === 'ml') {
      return `${qtyDisplay} ${unit}`;
    }

    // Remove leading numeric like "1 " from labels such as "1 egg", "1 slice", "1 cup, diced"
    let label = unit.replace(/^\s*\d+(?:\.\d+)?\s*/, '');

    // Keep any comma suffix (", large") intact; pluralize the noun before the comma
    const commaIdx = label.indexOf(',');
    const main = (commaIdx >= 0) ? label.slice(0, commaIdx).trim() : label.trim();
    const rest = (commaIdx >= 0) ? label.slice(commaIdx) : '';

    // Find last word in main to pluralize
    const lastWordMatch = main.match(/([A-Za-z]+)\s*$/);
    if (!lastWordMatch) {
      return `${qtyDisplay} ${label}`.trim();
    }

    const noun = lastWordMatch[1];
    const nounStart = main.lastIndexOf(noun);

    const pluralize = (w, q) => {
      if (q === 1) return w;
      const wl = w.toLowerCase();
      // Special cases
      const specials = { egg: 'eggs', leaf: 'leaves', loaf: 'loaves', knife: 'knives' };
      if (specials[wl]) return specials[wl];
      if (/(?:ch|sh)$/.test(wl) || /(?:s|x|z)$/.test(wl)) return w + 'es';
      if (/[^aeiou]y$/.test(wl)) return w.slice(0, -1) + 'ies';
      if (/fe$/.test(wl)) return w.slice(0, -2) + 'ves';
      if (/f$/.test(wl)) return w.slice(0, -1) + 'ves';
      return w + 's';
    };

    const pluralNoun = pluralize(noun, qtyDisplay);
    const mainPlural = main.slice(0, nounStart) + pluralNoun;
    return `${qtyDisplay} ${mainPlural}${rest}`;
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const loadData = async () => {
    await Promise.all([
      loadNutritionGoal(),
      loadTodayLogs(),
      loadDailySummary()
    ]);
  };

  const loadNutritionGoal = async () => {
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}/GetNutritionGoal.php`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.goal) {
        setNutritionGoal(data.goal);
      }
    } catch (error) {
      console.error('Error loading nutrition goal:', error);
    }
  };

  const loadTodayLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${BACKEND_ROUTES_API}/GetFoodLogs.php?start_date=${today}&end_date=${today}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      if (data.success) {
        setTodayLogs(data.logs);
      }
    } catch (error) {
      console.error('Error loading food logs:', error);
    }
  };

  const loadDailySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${BACKEND_ROUTES_API}/GetDailySummaries.php?start_date=${today}&end_date=${today}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      if (data.success && data.summaries.length > 0) {
        setDailySummary(data.summaries[0]);
      } else {
        setDailySummary({
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0
        });
      }
    } catch (error) {
      console.error('Error loading daily summary:', error);
      setDailySummary({
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0
      });
    }
  };

  // Debounced search when typing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setIsDebouncing(false);
      setPendingQuery('');
      return;
    }
    setIsDebouncing(true);
    setPendingQuery(searchQuery.trim());
    const id = setTimeout(() => {
      handleSearchFoods();
    }, 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // When results for the current query are committed to state, stop showing Searching…
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (resultsFor && resultsFor === trimmed) {
      // Results corresponding to current input are now rendered; clear pending/searching
      setSearching(false);
      setPendingQuery('');
      setIsDebouncing(false);
    }
  }, [resultsFor, searchQuery]);

  // Abort any in-flight search on unmount
  useEffect(() => {
    return () => {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, []);

  const handleSetGoal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}/SetNutritionGoal.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(goalForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowGoalModal(false);
        await loadNutritionGoal();
        showToast('Nutrition goal set successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to set goal', 'danger');
      }
    } catch (error) {
      console.error('Error setting goal:', error);
      showToast('Failed to set goal', 'danger');
    }
    setLoading(false);
  };

  const handleSearchFoods = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    
    // Cancel any in-flight search
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

  setIsDebouncing(false);
  setSearching(true);
  setPendingQuery(q);
    try {
      const url = `${BACKEND_ROUTES_API}SearchFoods.php?query=${encodeURIComponent(q)}&source=all`;
      console.log('Searching URL:', url); // Debug log
      const response = await fetch(url, { credentials: 'include', signal: controller.signal });
      console.log('Response status:', response.status); // Debug log
      const data = await response.json();
      console.log('Search response:', data); // Debug log
      if (data.success) {
        console.log('Search results:', data.results); // Debug log
        setSearchResults(data.results);
        setResultsFor(q);
      } else {
        console.error('Search failed:', data.error || data.message);
        setSearchResults({ usda_foods: [], custom_foods: [] });
        setResultsFor(q);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error searching foods:', error);
      }
    }
    // Do not clear searching here; wait for the commit effect tied to resultsFor === current input
  };

  const resetSearchState = () => {
    // Abort any inflight request
    if (searchAbortRef.current) {
      try { searchAbortRef.current.abort(); } catch {}
    }
    setSearchQuery('');
    setSearchResults({ usda_foods: [], custom_foods: [] });
    setResultsFor('');
    setSearching(false);
    setIsDebouncing(false);
    setPendingQuery('');
  };

  const selectFood = async (food, source) => {
    const nutrients = source === 'usda' ? food.nutrients : food;
    const baseCalories = parseFloat(nutrients.calories || food.calories || 0);
    const baseProtein = parseFloat(nutrients.protein || food.protein || 0);
    const baseCarbs = parseFloat(nutrients.carbs || food.carbs || 0);
    const baseFat = parseFloat(nutrients.fat || food.fat || 0);
    const baseServingSize = parseFloat(food.serving_size || 100);
    
    // Normalize to per 100g for consistent calculation
    const caloriesPer100g = baseCalories / baseServingSize * 100;
    const proteinPer100g = baseProtein / baseServingSize * 100;
    const carbsPer100g = baseCarbs / baseServingSize * 100;
    const fatPer100g = baseFat / baseServingSize * 100;

    // Immediately show selection (default to grams, 100g) for instant feedback
    const defaultQuantity = 100;
    const foodName = toTitleCase(food.description || food.name);
    setBaseNutrition({
      calories: caloriesPer100g,
      protein: proteinPer100g,
      carbs: carbsPer100g,
      fat: fatPer100g,
      serving_size: 100,
      original_serving_size: baseServingSize,
      original_calories: baseCalories,
      original_protein: baseProtein,
      original_carbs: baseCarbs,
      original_fat: baseFat
    });
    setLogForm(prev => ({
      ...prev,
      food_source: source,
      food_id: source === 'usda' ? food.fdc_id : food.id,
      food_name: foodName,
      serving_size: baseServingSize,
      serving_unit: 'g',
      quantity: defaultQuantity,
      calories: (caloriesPer100g * (defaultQuantity / 100)).toFixed(1),
      protein: (proteinPer100g * (defaultQuantity / 100)).toFixed(1),
      carbs: (carbsPer100g * (defaultQuantity / 100)).toFixed(1),
      fat: (fatPer100g * (defaultQuantity / 100)).toFixed(1),
      portion_gram_weight: null
    }));
    // Collapse results for clarity
  setSearchResults({ usda_foods: [], custom_foods: [] });
  setResultsFor('');
  setSearchQuery('');
    // Now fetch portions in the background
    setLoading(true);
    
    // Fetch portions from API only when food is selected (for performance)
    let portions = [];
    if (source === 'usda' && food.fdc_id) {
      try {
        const response = await fetch(
          `${BACKEND_ROUTES_API}/GetFoodPortions.php?fdc_id=${food.fdc_id}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        if (data.success && data.portions) {
          portions = data.portions;
        }
      } catch (error) {
        console.error('Error fetching portions:', error);
      }
  }
  setAvailablePortions(portions);
    setLoading(false);
  };

  const handleQuantityChange = (newQuantity) => {
    let quantity = parseFloat(newQuantity) || 0;
    // For grams/ml, normalize to integer values
    if (logForm.serving_unit === 'g' || logForm.serving_unit === 'ml') {
      quantity = Math.max(0, Math.round(quantity));
    }
    
    let newCalories, newProtein, newCarbs, newFat;
    
    // Check if using gram/ml based or portion-based measurement
    if (logForm.serving_unit === 'g' || logForm.serving_unit === 'ml') {
      // Calculate based on per 100g values
      const multiplier = quantity / 100;
      newCalories = (baseNutrition.calories * multiplier).toFixed(1);
      newProtein = (baseNutrition.protein * multiplier).toFixed(1);
      newCarbs = (baseNutrition.carbs * multiplier).toFixed(1);
      newFat = (baseNutrition.fat * multiplier).toFixed(1);
    } else if (logForm.serving_unit.startsWith('portion_') && logForm.portion_gram_weight) {
      // Calculate based on the gram weight of the selected portion
      const multiplier = (logForm.portion_gram_weight * quantity) / 100;
      newCalories = (baseNutrition.calories * multiplier).toFixed(1);
      newProtein = (baseNutrition.protein * multiplier).toFixed(1);
      newCarbs = (baseNutrition.carbs * multiplier).toFixed(1);
      newFat = (baseNutrition.fat * multiplier).toFixed(1);
    } else {
      // Fallback to original serving size
      newCalories = (baseNutrition.original_calories * quantity).toFixed(1);
      newProtein = (baseNutrition.original_protein * quantity).toFixed(1);
      newCarbs = (baseNutrition.original_carbs * quantity).toFixed(1);
      newFat = (baseNutrition.original_fat * quantity).toFixed(1);
    }
    
    setLogForm({
      ...logForm,
      quantity: quantity,
      calories: newCalories,
      protein: newProtein,
      carbs: newCarbs,
      fat: newFat
    });
  };

  const handleMeasurementTypeChange = (newUnit) => {
    // Set default quantity based on measurement type
    let defaultQuantity;
    let calories, protein, carbs, fat;
    let portionGramWeight = null;
    
    if (newUnit === 'g' || newUnit === 'ml') {
      // For grams/ml, default to 100 and calculate based on per 100g values
      defaultQuantity = 100;
      const multiplier = defaultQuantity / 100;
      calories = (baseNutrition.calories * multiplier).toFixed(1);
      protein = (baseNutrition.protein * multiplier).toFixed(1);
      carbs = (baseNutrition.carbs * multiplier).toFixed(1);
      fat = (baseNutrition.fat * multiplier).toFixed(1);
    } else if (newUnit.startsWith('portion_')) {
      // This is a specific portion from the API (e.g., "portion_0" for first portion)
      const portionIndex = parseInt(newUnit.split('_')[1]);
      const portion = availablePortions[portionIndex];
      
      if (portion) {
        defaultQuantity = 1;
        portionGramWeight = portion.gram_weight;
        
        // Calculate nutrition based on the gram weight of the portion
        const multiplier = portionGramWeight / 100;
        calories = (baseNutrition.calories * multiplier).toFixed(1);
        protein = (baseNutrition.protein * multiplier).toFixed(1);
        carbs = (baseNutrition.carbs * multiplier).toFixed(1);
        fat = (baseNutrition.fat * multiplier).toFixed(1);
      }
    } else {
      // Fallback to original serving size
      defaultQuantity = 1;
      calories = baseNutrition.original_calories?.toFixed(1) || '0';
      protein = baseNutrition.original_protein?.toFixed(1) || '0';
      carbs = baseNutrition.original_carbs?.toFixed(1) || '0';
      fat = baseNutrition.original_fat?.toFixed(1) || '0';
    }
    
    setLogForm(prev => ({
      ...prev,
      serving_unit: newUnit,
      quantity: defaultQuantity,
      portion_gram_weight: portionGramWeight,
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat
    }));
  };

  const handleLogFood = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare payload with human-friendly serving unit for portion-based entries
      const payload = { ...logForm };
      if (typeof payload.serving_unit === 'string' && payload.serving_unit.startsWith('portion_')) {
        const portionIndex = parseInt(payload.serving_unit.split('_')[1]);
        const portion = availablePortions[portionIndex];
        // Use portion label and gram weight when available; fall back to generic 'portion'
        if (portion) {
          payload.serving_unit = portion.label; // e.g., "large egg", "slice", "cup"
          payload.serving_size = portion.gram_weight; // grams per portion
        } else {
          payload.serving_unit = 'portion';
        }
        // Ensure integer quantity for portion-based measures
        payload.quantity = Math.max(1, Math.round(parseFloat(payload.quantity) || 1));
      }

      const response = await fetch(`${BACKEND_ROUTES_API}/LogFood.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setShowLogModal(false);
        resetLogForm();
        await loadData();
        showToast('Food logged successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to log food', 'danger');
      }
    } catch (error) {
      console.error('Error logging food:', error);
      showToast('Failed to log food', 'danger');
    }
    setLoading(false);
  };

  const handleDeleteLog = async (logId) => {
    setLoading(true);
    try {
      console.log('Deleting log ID:', logId);
      const response = await fetch(`${BACKEND_ROUTES_API}/DeleteFoodLog.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ log_id: logId })
      });
      
      console.log('Delete response status:', response.status);
      
      // Get the response as text first to see what's actually returned
      const responseText = await response.text();
      console.log('Delete response text:', responseText);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', responseText);
        showToast('Server returned invalid response', 'danger');
        setLoading(false);
        return;
      }
      
      console.log('Delete response data:', data);
      
      if (data.success) {
        await loadData();
        showToast('Food log deleted successfully!', 'success');
      } else {
        console.error('Delete failed:', data);
        showToast(data.error || 'Failed to delete food log', 'danger');
      }
    } catch (error) {
      console.error('Error deleting food log:', error);
      showToast('Failed to delete food log', 'danger');
    }
    setLoading(false);
  };

  const resetLogForm = () => {
    setLogForm({
      log_date: new Date().toISOString().split('T')[0],
      meal_type: 'breakfast',
      food_source: 'usda',
      food_id: '',
      food_name: '',
      serving_size: '',
      serving_unit: 'g',
      quantity: 1,
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      notes: ''
    });
  };

  const calculateProgress = (current, target) => {
    if (!target) return 0;
    return Math.min(100, (current / target) * 100);
  };

  const groupLogsByMealType = () => {
    const grouped = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
      other: []
    };
    
    todayLogs.forEach(log => {
      if (grouped[log.meal_type]) {
        grouped[log.meal_type].push(log);
      }
    });
    
    return grouped;
  };

  const groupedLogs = groupLogsByMealType();

  return (
    <div className="min-vh-100 bg-white">
      <TraineeHeader />
      
      {/* Toast Notification */}
      {toast.show && (
        <div 
          className="position-fixed top-0 end-0 p-3" 
          style={{ zIndex: 9999, marginTop: '80px' }}
        >
          <div className={`alert alert-${toast.type} alert-dismissible fade show shadow-lg`} role="alert">
            <strong>{toast.type === 'success' ? '✓' : '✕'}</strong> {toast.message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setToast({ ...toast, show: false })}
            ></button>
          </div>
        </div>
      )}
      
      {/* Meals Content */}
      <div className="bg-luxury">
        {/* Page Header */}
        <div className="bg-white border-bottom">
          <div className="container-fluid px-4 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="h5 mb-0 fw-bold text-dark">Meals & Nutrition</h2>
                <p className="small text-muted mb-0">Track your food and macros</p>
              </div>
              <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  // Prefill goal form with current values when editing
                  if (nutritionGoal) {
                    setGoalForm({
                      goal_type: nutritionGoal.goal_type || 'daily',
                      target_calories: nutritionGoal.target_calories ?? '',
                      target_protein: nutritionGoal.target_protein ?? '',
                      target_carbs: nutritionGoal.target_carbs ?? '',
                      target_fat: nutritionGoal.target_fat ?? ''
                    });
                  }
                  setShowGoalModal(true);
                }}
              >
                <i className="bi bi-target me-1"></i>
                {nutritionGoal ? 'Edit Goal' : 'Set Goal'}
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => { resetSearchState(); setShowLogModal(true); }}
              >
                <i className="bi bi-plus-lg me-1"></i>
                Log Food
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-fluid px-4 py-4 pb-5">
        {/* Daily Summary Cards */}
        {dailySummary && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-muted">Calories</h6>
                    <i className="bi bi-fire text-danger"></i>
                  </div>
                  <h3 className="mb-1">{Math.round(dailySummary.total_calories || 0)}</h3>
                  {nutritionGoal && (
                    <>
                      <small className="text-muted">of {nutritionGoal.target_calories} kcal</small>
                      <div className="progress mt-2" style={{height: '4px'}}>
                        <div 
                          className="progress-bar bg-danger" 
                          style={{width: `${calculateProgress(dailySummary.total_calories, nutritionGoal.target_calories)}%`}}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-muted">Protein</h6>
                    <i className="bi bi-egg text-primary"></i>
                  </div>
                  <h3 className="mb-1">{Math.round(dailySummary.total_protein || 0)}g</h3>
                  {nutritionGoal && nutritionGoal.target_protein && (
                    <>
                      <small className="text-muted">of {nutritionGoal.target_protein}g</small>
                      <div className="progress mt-2" style={{height: '4px'}}>
                        <div 
                          className="progress-bar bg-primary" 
                          style={{width: `${calculateProgress(dailySummary.total_protein, nutritionGoal.target_protein)}%`}}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-muted">Carbs</h6>
                    <i className="bi bi-clipboard-data text-warning"></i>
                  </div>
                  <h3 className="mb-1">{Math.round(dailySummary.total_carbs || 0)}g</h3>
                  {nutritionGoal && nutritionGoal.target_carbs && (
                    <>
                      <small className="text-muted">of {nutritionGoal.target_carbs}g</small>
                      <div className="progress mt-2" style={{height: '4px'}}>
                        <div 
                          className="progress-bar bg-warning" 
                          style={{width: `${calculateProgress(dailySummary.total_carbs, nutritionGoal.target_carbs)}%`}}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 text-muted">Fat</h6>
                    <i className="bi bi-droplet text-info"></i>
                  </div>
                  <h3 className="mb-1">{Math.round(dailySummary.total_fat || 0)}g</h3>
                  {nutritionGoal && nutritionGoal.target_fat && (
                    <>
                      <small className="text-muted">of {nutritionGoal.target_fat}g</small>
                      <div className="progress mt-2" style={{height: '4px'}}>
                        <div 
                          className="progress-bar bg-info" 
                          style={{width: `${calculateProgress(dailySummary.total_fat, nutritionGoal.target_fat)}%`}}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Meals */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom">
            <h5 className="mb-0">Today's Meals</h5>
          </div>
          <div className="card-body">
            {todayLogs.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-journal-plus display-4 text-muted mb-3"></i>
                <p className="text-muted">No meals logged today. Start tracking your nutrition!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowLogModal(true)}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Log Your First Meal
                </button>
              </div>
            ) : (
              <div>
                {Object.entries(groupedLogs).map(([mealType, logs]) => (
                  logs.length > 0 && (
                    <div key={mealType} className="mb-4">
                      <h6 className="text-capitalize text-muted mb-3">
                        <i className="bi bi-circle-fill me-2" style={{fontSize: '8px'}}></i>
                        {mealType}
                      </h6>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Food</th>
                              <th>Serving</th>
                              <th>Calories</th>
                              <th>Protein</th>
                              <th>Carbs</th>
                              <th>Fat</th>
                              <th>Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logs.map((log) => (
                              <tr key={log.id}>
                                <td>
                                  <strong>{toTitleCase(log.food_name)}</strong>
                                  {log.notes && <><br/><small className="text-muted">{log.notes}</small></>}
                                </td>
                                <td>{formatServing(log.quantity, log.serving_unit)}</td>
                                <td>{Math.round(log.calories)} kcal</td>
                                <td>{Math.round(log.protein)}g</td>
                                <td>{Math.round(log.carbs)}g</td>
                                <td>{Math.round(log.fat)}g</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteLog(log.id)}
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Set Nutrition Goal</h5>
                <button type="button" className="btn-close" onClick={() => setShowGoalModal(false)}></button>
              </div>
              <form onSubmit={handleSetGoal}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Goal Type</label>
                    <select 
                      className="form-select" 
                      value={goalForm.goal_type}
                      onChange={(e) => setGoalForm({...goalForm, goal_type: e.target.value})}
                      required
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Target Calories *</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={goalForm.target_calories}
                      onChange={(e) => setGoalForm({...goalForm, target_calories: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Protein (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_protein}
                        onChange={(e) => setGoalForm({...goalForm, target_protein: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Carbs (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_carbs}
                        onChange={(e) => setGoalForm({...goalForm, target_carbs: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Fat (g)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={goalForm.target_fat}
                        onChange={(e) => setGoalForm({...goalForm, target_fat: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Log Food Modal */}
      {showLogModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Log Food</h5>
                <button type="button" className="btn-close" onClick={() => {setShowLogModal(false); resetLogForm(); resetSearchState();}}></button>
              </div>
              <form onSubmit={handleLogFood}>
                <div className="modal-body">
              {/* Search Foods */}
                  <div className="mb-4">
                    <label className="form-label">Search Food</label>
                    <div className="input-group">
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Search USDA database..."
                        value={searchQuery}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSearchQuery(v);
                          const len = v.trim().length;
                          if (len >= 2) {
                            // show immediate feedback while debounce counts down
                            setIsDebouncing(true);
                          } else {
                            setIsDebouncing(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // stop debouncing and trigger search now
                            setIsDebouncing(false);
                            handleSearchFoods();
                          }
                        }}
                      />
                      {/* Removed search button per request; search triggers on typing (debounced) or Enter */}
                    </div>
                    {/* Search state feedback */}
                    <div className="mt-1" aria-live="polite">
            {((searching || isDebouncing) || (pendingQuery && pendingQuery === searchQuery.trim())) && (
                        <small className="text-muted">
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Searching…
                        </small>
                      )}
            {!searching && !isDebouncing && !pendingQuery && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                        <small className="text-muted">Type at least 2 characters to search</small>
                      )}
            {!searching && !isDebouncing && !pendingQuery && searchQuery.trim().length >= 2 && (resultsFor === searchQuery.trim()) && (searchResults.usda_foods.length + searchResults.custom_foods.length === 0) && (
                        <small className="text-muted">No results for "{searchQuery.trim()}"</small>
                      )}
                    </div>
                    
                    {/* Search Results */}
                    {(searchResults.usda_foods.length > 0 || searchResults.custom_foods.length > 0) && (
                      <div className="mt-2" style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px'}}>
            {searchResults.usda_foods.map((food, idx) => (
                          <div 
                            key={`usda-${idx}`}
                            className="p-2 border-bottom cursor-pointer hover-bg-light"
                            style={{cursor: 'pointer'}}
              onMouseDown={(e) => { e.preventDefault(); selectFood(food, 'usda'); }}
                          >
                            <div><strong>{toTitleCase(food.description)}</strong></div>
                            {food.brand_name && <div><small className="text-muted">{toTitleCase(food.brand_name)}</small></div>}
                            <div className="mt-1">
                              <small className="text-muted">
                                {food.nutrients.calories || 0} cal • 
                                P: {food.nutrients.protein || 0}g • 
                                C: {food.nutrients.carbs || 0}g • 
                                F: {food.nutrients.fat || 0}g
                                {food.serving_size && ` (per ${food.serving_size}${food.serving_unit || 'g'})`}
                              </small>
                            </div>
                          </div>
                        ))}
            {searchResults.custom_foods.map((food) => (
                          <div 
                            key={`custom-${food.id}`}
                            className="p-2 border-bottom cursor-pointer hover-bg-light"
                            style={{cursor: 'pointer'}}
              onMouseDown={(e) => { e.preventDefault(); selectFood(food, 'custom'); }}
                          >
                            <div>
                              <strong>{toTitleCase(food.name)}</strong> <span className="badge bg-info">Custom</span>
                            </div>
                            {food.brand_name && <div><small className="text-muted">{toTitleCase(food.brand_name)}</small></div>}
                            <div className="mt-1">
                              <small className="text-muted">
                                {food.calories || 0} cal • 
                                P: {food.protein || 0}g • 
                                C: {food.carbs || 0}g • 
                                F: {food.fat || 0}g
                                {food.serving_size && ` (per ${food.serving_size}${food.serving_unit || 'g'})`}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {logForm.food_name && (
                    <>
                      <div className="alert alert-info">
                        <strong>Selected:</strong> {logForm.food_name}
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Date *</label>
                          <input 
                            type="date" 
                            className="form-control"
                            value={logForm.log_date}
                            onChange={(e) => setLogForm({...logForm, log_date: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Meal Type *</label>
                          <select 
                            className="form-select"
                            value={logForm.meal_type}
                            onChange={(e) => setLogForm({...logForm, meal_type: e.target.value})}
                            required
                          >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Measurement Type *</label>
                          <select 
                            className="form-select"
                            value={logForm.serving_unit}
                            onChange={(e) => handleMeasurementTypeChange(e.target.value)}
                            required
                          >
                            <option value="g">Grams (g)</option>
                            <option value="ml">Milliliters (ml)</option>
                            {availablePortions.map((portion, index) => (
                              <option key={index} value={`portion_${index}`}>
                                Per {portion.label} ({portion.gram_weight}g)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            Quantity ({
                              logForm.serving_unit === 'g' ? 'grams' : 
                              logForm.serving_unit === 'ml' ? 'ml' : 
                              (typeof logForm.serving_unit === 'string' && logForm.serving_unit.startsWith('portion_')) ? 
                                (availablePortions[parseInt(logForm.serving_unit.split('_')[1])] ? availablePortions[parseInt(logForm.serving_unit.split('_')[1])].label : 'portion') :
                                'units'
                            }) *
                          </label>
                          <input 
                            type="number" 
                            step={(typeof logForm.serving_unit === 'string' && logForm.serving_unit.startsWith('portion_')) ? "1" : (logForm.serving_unit === 'g' ? "1" : (logForm.serving_unit === 'ml' ? "1" : "1"))}
                            className="form-control"
                            value={(typeof logForm.serving_unit === 'string' && logForm.serving_unit.startsWith('portion_'))
                              ? Math.round(logForm.quantity || 1)
                              : ((logForm.serving_unit === 'g' || logForm.serving_unit === 'ml')
                                  ? Math.round(logForm.quantity || 0)
                                  : logForm.quantity)
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (typeof logForm.serving_unit === 'string' && logForm.serving_unit.startsWith('portion_')) {
                                const intVal = Math.max(1, Math.round(parseFloat(raw) || 1));
                                handleQuantityChange(intVal);
                              } else if (logForm.serving_unit === 'g' || logForm.serving_unit === 'ml') {
                                const intVal = Math.max(0, Math.round(parseFloat(raw) || 0));
                                handleQuantityChange(intVal);
                              } else {
                                handleQuantityChange(raw);
                              }
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Calories *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.calories}
                            readOnly
                            style={{backgroundColor: '#f8f9fa'}}
                          />
                          <small className="text-muted">Auto-calculated based on quantity</small>
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Protein (g) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.protein}
                            readOnly
                            style={{backgroundColor: '#f8f9fa'}}
                          />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Carbs (g) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.carbs}
                            readOnly
                            style={{backgroundColor: '#f8f9fa'}}
                          />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Fat (g) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.fat}
                            readOnly
                            style={{backgroundColor: '#f8f9fa'}}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Notes</label>
                        <textarea 
                          className="form-control"
                          rows="2"
                          value={logForm.notes}
                          onChange={(e) => setLogForm({...logForm, notes: e.target.value})}
                        ></textarea>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => {setShowLogModal(false); resetLogForm(); resetSearchState();}}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading || !logForm.food_name}>
                    {loading ? 'Logging...' : 'Log Food'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed-bottom footer-menu" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="container-fluid" style={{ backgroundColor: 'white', borderTop: '1px solid #dee2e6' }}>
          <div className="row">
            <div className="col">
              <div className={window.location.pathname === '/' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-house${window.location.pathname === '/' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1">Home</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={window.location.pathname === '/workouts' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/workouts' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/workouts')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-lightning${window.location.pathname === '/workouts' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1">Workouts</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={window.location.pathname === '/meals' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/meals' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/meals')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-${window.location.pathname === '/meals' ? 'cup-hot-fill' : 'cup-hot'} fs-5`}></i>
                    <small className="mt-1">Meals</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={window.location.pathname === '/progress' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/progress' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/progress')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-graph-up${window.location.pathname === '/progress' ? '-arrow' : ''} fs-5`}></i>
                    <small className="mt-1">Progress</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={window.location.pathname === '/coach' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    window.location.pathname === '/coach' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/coach')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-person-check${window.location.pathname === '/coach' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1">Coach</small>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      </div>
    </div>
  );
};

export default MealsPage;
