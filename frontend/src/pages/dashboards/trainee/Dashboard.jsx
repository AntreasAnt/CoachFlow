import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import TraineeDashboard from '../../../components/TraineeDashboard';
import APIClient from '../../../utils/APIClient';

const DEFAULT_STATS = {
  current_weight: null,
  weight_change: null,
  change_type: 'neutral',
  workouts_this_week: 0,
  current_streak: 0,
  total_time_hours: 0,
};

const DEFAULT_SUMMARY = {
  total_calories: 0,
  total_protein: 0,
  total_carbs: 0,
  total_fat: 0,
  meal_count: 0,
};

const EMPTY_FLASH = {
  area: '',
  type: '',
  message: '',
};

const EMPTY_QUICK_FOOD = {
  meal_type: 'breakfast',
  food_name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  quantity: 1,
  serving_unit: 'entry',
  serving_size: 1,
  portion_gram_weight: null,
};

const EMPTY_SEARCH_RESULT = [];

const DEFAULT_BASE_NUTRITION = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  mode: 'per_100g',
  original_serving_size: 100,
  original_calories: 0,
  original_protein: 0,
  original_carbs: 0,
  original_fat: 0,
};

const cardStyle = {
  backgroundColor: 'rgba(15, 20, 15, 0.72)',
  border: '1px solid rgba(32, 214, 87, 0.18)',
  borderRadius: '18px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
};

const mutedTextStyle = {
  color: 'var(--text-secondary)',
};

const getTodayString = () => {
  const now = new Date();
  const localMidnightAligned = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localMidnightAligned.toISOString().split('T')[0];
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundTo = (value, decimals = 1) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const formatDecimal = (value, decimals = 1) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const rounded = roundTo(value, decimals);
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return rounded.toFixed(decimals).replace(/\.0+$/, '');
};

const createPortionLabel = (portion, index) => {
  if (!portion) {
    return `portion ${index + 1}`;
  }

  if (portion.label) {
    return portion.label;
  }

  if (portion.portion_description) {
    return portion.portion_description;
  }

  const amount = toNumber(portion.amount, 0);
  const unit = portion.measure_unit_name || portion.measureUnitName || portion.unit || '';
  const modifier = portion.modifier || '';
  const baseLabel = [amount > 0 ? amount : '', unit, modifier].filter(Boolean).join(' ').trim();

  return baseLabel || `portion ${index + 1}`;
};

const normalizePortionOptions = (rawPortions, fallbackUnit = 'portion') => {
  if (!Array.isArray(rawPortions)) {
    return [];
  }

  const options = rawPortions
    .map((portion, index) => {
      const gramWeight = toNumber(portion?.gram_weight ?? portion?.gramWeight, 0);
      const servingSize = toNumber(portion?.serving_size ?? portion?.servingSize, 0);
      const amount = toNumber(portion?.amount, 0);
      const resolvedServingSize = gramWeight > 0
        ? gramWeight
        : servingSize > 0
          ? servingSize
          : amount > 0
            ? amount
            : 1;
      const label = createPortionLabel(portion, index);

      return {
        key: `portion_${index}`,
        type: 'portion',
        label,
        display_label: gramWeight > 0
          ? `Per ${label} (${formatDecimal(gramWeight, 1)}g)`
          : `Per ${label}`,
        quantity_label: label,
        serving_size: resolvedServingSize,
        serving_unit: label || portion?.serving_unit || portion?.servingUnit || portion?.measure_unit_name || fallbackUnit,
        portion_gram_weight: gramWeight > 0 ? gramWeight : null,
      };
    })
    .filter((portion) => portion.serving_size > 0);

  const deduped = [];
  const seen = new Set();

  options.forEach((portion) => {
    const dedupeKey = `${portion.label}-${roundTo(portion.serving_size, 4)}-${portion.serving_unit}`;
    if (seen.has(dedupeKey)) {
      return;
    }
    seen.add(dedupeKey);
    deduped.push(portion);
  });

  return deduped;
};

const getMeasurementTypeMeta = (measurement) => {
  if (!measurement) {
    return {
      quantityLabel: 'units',
      step: '1',
      min: '0',
    };
  }

  if (measurement.key === 'g') {
    return {
      quantityLabel: 'grams',
      step: '1',
      min: '0',
    };
  }

  if (measurement.key === 'ml') {
    return {
      quantityLabel: 'ml',
      step: '1',
      min: '0',
    };
  }

  return {
    quantityLabel: measurement.quantity_label || measurement.label || 'portion',
    step: '1',
    min: '1',
  };
};

const calculateNutritionValues = ({
  mode,
  baseNutrition,
  originalServingSize,
  quantity,
  servingSize,
}) => {
  const safeQuantity = Math.max(0, toNumber(quantity, 0));
  const safeServingSize = Math.max(0.0001, toNumber(servingSize, 1));
  const safeOriginalServingSize = Math.max(0.0001, toNumber(originalServingSize, 1));
  const multiplier = mode === 'per_100g'
    ? (safeQuantity * safeServingSize) / 100
    : (safeQuantity * safeServingSize) / safeOriginalServingSize;

  return {
    calories: roundTo(toNumber(baseNutrition.calories) * multiplier, 1),
    protein: roundTo(toNumber(baseNutrition.protein) * multiplier, 1),
    carbs: roundTo(toNumber(baseNutrition.carbs) * multiplier, 1),
    fat: roundTo(toNumber(baseNutrition.fat) * multiplier, 1),
  };
};

const formatDate = (value) => {
  if (!value) return 'No date yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const formatWeightChange = (weightChange, changeType) => {
  if (weightChange === null || weightChange === undefined) {
    return 'Add more weigh-ins to see a trend';
  }

  if (toNumber(weightChange) === 0) {
    return 'No weight change in the last 30 days';
  }

  const prefix = changeType === 'gain' ? '+' : '';
  return `${prefix}${weightChange} kg vs 30 days`;
};

const getFlashModalColors = (type) => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: 'rgba(32, 214, 87, 0.12)',
        borderColor: 'rgba(32, 214, 87, 0.45)',
      };
    case 'danger':
      return {
        backgroundColor: 'rgba(220, 53, 69, 0.12)',
        borderColor: 'rgba(220, 53, 69, 0.45)',
      };
    case 'warning':
      return {
        backgroundColor: 'rgba(255, 193, 7, 0.12)',
        borderColor: 'rgba(255, 193, 7, 0.45)',
      };
    default:
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderColor: 'rgba(255, 255, 255, 0.18)',
      };
  }
};

const normalizeSearchFood = (food, fallbackSource) => {
  const source = food.source || fallbackSource;
  const nutrients = food.nutrients || food;
  const name = food.description || food.name || 'Food';

  return {
    id: source === 'usda' ? food.fdc_id : food.id,
    source,
    name,
    brandName: food.brand_name || '',
    label: source === 'trainer_custom'
      ? `Trainer${food.trainer_name ? ` • ${food.trainer_name}` : ''}`
      : source === 'custom'
        ? 'Custom'
        : 'USDA',
    servingSize: toNumber(food.serving_size, 100),
    servingUnit: food.serving_unit || 'g',
    calories: toNumber(nutrients.calories),
    protein: toNumber(nutrients.protein),
    carbs: toNumber(nutrients.carbs),
    fat: toNumber(nutrients.fat),
    portions: Array.isArray(food.portions)
      ? food.portions
      : Array.isArray(food.food_portions)
        ? food.food_portions
        : [],
  };
};

const HomePage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(EMPTY_FLASH);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [dailySummary, setDailySummary] = useState(DEFAULT_SUMMARY);
  const [nutritionGoal, setNutritionGoal] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [coach, setCoach] = useState(null);
  const [weightValue, setWeightValue] = useState('');
  const [bodyFatValue, setBodyFatValue] = useState('');
  const [muscleMassValue, setMuscleMassValue] = useState('');
  const [chestValue, setChestValue] = useState('');
  const [waistValue, setWaistValue] = useState('');
  const [hipsValue, setHipsValue] = useState('');
  const [quickFood, setQuickFood] = useState(EMPTY_QUICK_FOOD);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState(EMPTY_SEARCH_RESULT);
  const [selectedFoodResult, setSelectedFoodResult] = useState(null);
  const [availablePortions, setAvailablePortions] = useState([]);
  const [selectedPortionKey, setSelectedPortionKey] = useState('base');
  const [baseNutrition, setBaseNutrition] = useState(DEFAULT_BASE_NUTRITION);
  const [loadingPortions, setLoadingPortions] = useState(false);
  const [searchingFoods, setSearchingFoods] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [savingFood, setSavingFood] = useState(false);

  const showFlash = (area, type, message) => {
    setFlash({ area, type, message });
  };

  const loadNutritionSummary = async () => {
    const today = getTodayString();
    const summaryResponse = await APIClient.get(
      `${BACKEND_ROUTES_API}GetDailySummaries.php?start_date=${today}&end_date=${today}`
    );

    if (!summaryResponse.success) {
      throw new Error(summaryResponse.error || 'Failed to load nutrition summary');
    }

    const todaySummary = Array.isArray(summaryResponse.summaries) && summaryResponse.summaries.length > 0
      ? summaryResponse.summaries[0]
      : null;

    setNutritionGoal(summaryResponse.goal || null);
    setDailySummary(
      todaySummary
        ? {
            total_calories: toNumber(todaySummary.total_calories),
            total_protein: toNumber(todaySummary.total_protein),
            total_carbs: toNumber(todaySummary.total_carbs),
            total_fat: toNumber(todaySummary.total_fat),
            meal_count: toNumber(todaySummary.meal_count),
          }
        : DEFAULT_SUMMARY
    );
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    const today = getTodayString();
    const requests = await Promise.allSettled([
      APIClient.get(`${BACKEND_ROUTES_API}GetHomeStats.php`),
      APIClient.get(`${BACKEND_ROUTES_API}GetDailySummaries.php?start_date=${today}&end_date=${today}`),
      APIClient.get(`${BACKEND_ROUTES_API}GetWorkoutData.php`),
      APIClient.get(`${BACKEND_ROUTES_API}GetMyAssignedPrograms.php`),
      APIClient.get(`${BACKEND_ROUTES_API}GetMyCoach.php`),
    ]);

    requests.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('Dashboard request failed:', result.reason);
      }
    });

    let hasAnyData = false;

    const statsResult = requests[0];
    if (statsResult.status === 'fulfilled' && statsResult.value.success) {
      setStats({
        current_weight: statsResult.value.stats?.current_weight ?? null,
        weight_change: statsResult.value.stats?.weight_change ?? null,
        change_type: statsResult.value.stats?.change_type || 'neutral',
        workouts_this_week: toNumber(statsResult.value.stats?.workouts_this_week),
        current_streak: toNumber(statsResult.value.stats?.current_streak),
        total_time_hours: toNumber(statsResult.value.stats?.total_time_hours),
      });
      hasAnyData = true;
    } else {
      setStats(DEFAULT_STATS);
    }

    const summaryResult = requests[1];
    if (summaryResult.status === 'fulfilled' && summaryResult.value.success) {
      const todaySummary = Array.isArray(summaryResult.value.summaries) && summaryResult.value.summaries.length > 0
        ? summaryResult.value.summaries[0]
        : null;

      setNutritionGoal(summaryResult.value.goal || null);
      setDailySummary(
        todaySummary
          ? {
              total_calories: toNumber(todaySummary.total_calories),
              total_protein: toNumber(todaySummary.total_protein),
              total_carbs: toNumber(todaySummary.total_carbs),
              total_fat: toNumber(todaySummary.total_fat),
              meal_count: toNumber(todaySummary.meal_count),
            }
          : DEFAULT_SUMMARY
      );
      hasAnyData = true;
    } else {
      setNutritionGoal(null);
      setDailySummary(DEFAULT_SUMMARY);
    }

    const workoutResult = requests[2];
    if (workoutResult.status === 'fulfilled' && workoutResult.value.success) {
      setWorkoutPlans(workoutResult.value.workoutPlans || []);
      setRecentSessions(workoutResult.value.recentSessions || []);
      hasAnyData = true;
    } else {
      setWorkoutPlans([]);
      setRecentSessions([]);
    }

    const assignedResult = requests[3];
    if (assignedResult.status === 'fulfilled' && assignedResult.value.success) {
      setAssignedPrograms(assignedResult.value.programs || []);
      hasAnyData = true;
    } else {
      setAssignedPrograms([]);
    }

    const coachResult = requests[4];
    if (coachResult.status === 'fulfilled' && coachResult.value.success) {
      setCoach(coachResult.value.coach || null);
      hasAnyData = true;
    } else {
      setCoach(null);
    }

    if (!hasAnyData) {
      setError('Could not load your dashboard right now. Please try again.');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!flash.message) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setFlash(EMPTY_FLASH);
    }, 4000);

    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const trimmedQuery = foodSearchQuery.trim();

    if (trimmedQuery.length < 2) {
      setFoodSearchResults(EMPTY_SEARCH_RESULT);
      setSearchingFoods(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSearchingFoods(true);
        const response = await APIClient.get(
          `${BACKEND_ROUTES_API}SearchFoods.php?query=${encodeURIComponent(trimmedQuery)}&source=all`,
          { signal: controller.signal }
        );

        if (!response.success) {
          setFoodSearchResults(EMPTY_SEARCH_RESULT);
          return;
        }

        const usdaFoods = (response.results?.usda_foods || []).map((food) => normalizeSearchFood(food, 'usda'));
        const customFoods = (response.results?.custom_foods || []).map((food) => normalizeSearchFood(food, food.source || 'custom'));

        setFoodSearchResults([...customFoods, ...usdaFoods].slice(0, 6));
      } catch (searchError) {
        if (searchError.name !== 'AbortError') {
          console.error('Error searching foods:', searchError);
          setFoodSearchResults(EMPTY_SEARCH_RESULT);
        }
      } finally {
        setSearchingFoods(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [foodSearchQuery]);

  const resetSelectedFoodState = () => {
    setSelectedFoodResult(null);
    setAvailablePortions([]);
    setSelectedPortionKey('base');
    setBaseNutrition(DEFAULT_BASE_NUTRITION);
    setLoadingPortions(false);
  };

  const updateQuickFoodField = (field, value) => {
    setQuickFood((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (['food_name', 'calories', 'protein', 'carbs', 'fat'].includes(field)) {
      resetSelectedFoodState();
    }
  };

  const applySelectionNutrition = ({
    quantity,
    servingSize,
    servingUnit,
    portionGramWeight,
  }) => {
    const normalizedQuantity = Math.max(0, toNumber(quantity, 0));
    const normalizedServingSize = Math.max(0.0001, toNumber(servingSize, 1));
    const nutrition = calculateNutritionValues({
      mode: baseNutrition.mode,
      baseNutrition,
      originalServingSize: baseNutrition.original_serving_size,
      quantity: normalizedQuantity,
      servingSize: normalizedServingSize,
    });

    setQuickFood((previous) => ({
      ...previous,
      quantity: normalizedQuantity,
      serving_size: normalizedServingSize,
      serving_unit: servingUnit,
      portion_gram_weight: portionGramWeight,
      calories: formatDecimal(nutrition.calories, 1),
      protein: formatDecimal(nutrition.protein, 1),
      carbs: formatDecimal(nutrition.carbs, 1),
      fat: formatDecimal(nutrition.fat, 1),
    }));
  };

  const handleMeasurementTypeChange = (portionKey) => {
    const selectedPortion = availablePortions.find((portion) => portion.key === portionKey);
    if (!selectedPortion) {
      return;
    }

    const defaultQuantity = selectedPortion.type === 'portion' ? 1 : 100;

    setSelectedPortionKey(portionKey);
    applySelectionNutrition({
      quantity: defaultQuantity,
      servingSize: selectedPortion.serving_size,
      servingUnit: selectedPortion.serving_unit,
      portionGramWeight: selectedPortion.portion_gram_weight,
    });
  };

  const handleQuantityChange = (nextQuantity) => {
    const selectedMeasurement = availablePortions.find((portion) => portion.key === selectedPortionKey);
    const parsedQuantity = Number.parseFloat(nextQuantity);

    if (!Number.isFinite(parsedQuantity)) {
      return;
    }

    const normalizedQuantity = selectedMeasurement?.type === 'portion'
      ? Math.max(1, Math.round(parsedQuantity || 1))
      : Math.max(0, Math.round(parsedQuantity || 0));

    applySelectionNutrition({
      quantity: normalizedQuantity,
      servingSize: quickFood.serving_size,
      servingUnit: quickFood.serving_unit,
      portionGramWeight: quickFood.portion_gram_weight,
    });
  };

  const handleSelectFoodResult = async (food) => {
    setSelectedFoodResult(food);
    setFoodSearchQuery('');
    setFoodSearchResults(EMPTY_SEARCH_RESULT);
    setLoadingPortions(true);

    const baseValues = {
      calories: toNumber(food.calories),
      protein: toNumber(food.protein),
      carbs: toNumber(food.carbs),
      fat: toNumber(food.fat),
    };

    const originalServingSize = Math.max(0.0001, toNumber(food.servingSize, 100));
    const normalizedBaseValues = {
      calories: (baseValues.calories / originalServingSize) * 100,
      protein: (baseValues.protein / originalServingSize) * 100,
      carbs: (baseValues.carbs / originalServingSize) * 100,
      fat: (baseValues.fat / originalServingSize) * 100,
    };

    setBaseNutrition({
      ...normalizedBaseValues,
      mode: 'per_100g',
      original_serving_size: originalServingSize,
      original_calories: baseValues.calories,
      original_protein: baseValues.protein,
      original_carbs: baseValues.carbs,
      original_fat: baseValues.fat,
    });

    let fetchedPortions = Array.isArray(food.portions) ? [...food.portions] : [];
    if (food.food_portions && Array.isArray(food.food_portions)) {
      fetchedPortions = [...fetchedPortions, ...food.food_portions];
    }

    if (food.source === 'usda' && food.id && fetchedPortions.length === 0) {
      try {
        const portionsResponse = await APIClient.get(
          `${BACKEND_ROUTES_API}GetFoodPortions.php?fdc_id=${encodeURIComponent(food.id)}`
        );

        if (portionsResponse.success && Array.isArray(portionsResponse.portions)) {
          fetchedPortions = [...fetchedPortions, ...portionsResponse.portions];
        }
      } catch (portionError) {
        console.error('Error loading food portions:', portionError);
      }
    }

    const normalizedPortions = normalizePortionOptions(fetchedPortions, food.servingUnit || 'portion');
    const allPortionOptions = [
      {
        key: 'g',
        type: 'measurement',
        label: 'Grams (g)',
        display_label: 'Grams (g)',
        quantity_label: 'grams',
        serving_size: 1,
        serving_unit: 'g',
        portion_gram_weight: null,
      },
      {
        key: 'ml',
        type: 'measurement',
        label: 'Milliliters (ml)',
        display_label: 'Milliliters (ml)',
        quantity_label: 'ml',
        serving_size: 1,
        serving_unit: 'ml',
        portion_gram_weight: null,
      },
      ...normalizedPortions,
    ];
    const defaultPortion = allPortionOptions[(food.servingUnit || '').toLowerCase() === 'ml' ? 1 : 0];
    const defaultQuantity = defaultPortion.key === 'g' || defaultPortion.key === 'ml' ? 100 : 1;

    const defaultNutrition = calculateNutritionValues({
      mode: 'per_100g',
      baseNutrition: normalizedBaseValues,
      originalServingSize,
      quantity: defaultQuantity,
      servingSize: defaultPortion.serving_size,
    });

    setAvailablePortions(allPortionOptions);
    setSelectedPortionKey(defaultPortion.key);
    setQuickFood((previous) => ({
      ...previous,
      food_name: food.name,
      calories: formatDecimal(defaultNutrition.calories, 1),
      protein: formatDecimal(defaultNutrition.protein, 1),
      carbs: formatDecimal(defaultNutrition.carbs, 1),
      fat: formatDecimal(defaultNutrition.fat, 1),
      quantity: defaultQuantity,
      serving_size: defaultPortion.serving_size,
      serving_unit: defaultPortion.serving_unit,
      portion_gram_weight: defaultPortion.portion_gram_weight,
    }));
    setLoadingPortions(false);
  };

  const clearSelectedFoodResult = () => {
    resetSelectedFoodState();
    setFoodSearchQuery('');
    setFoodSearchResults(EMPTY_SEARCH_RESULT);
  };

  const handleWeightSubmit = async (event) => {
    event.preventDefault();

    const parsedWeight = Number.parseFloat(weightValue);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      showFlash('weight', 'warning', 'Enter a valid weight first.');
      return;
    }

    try {
      setSavingWeight(true);
      
      const payload = { weight: parsedWeight };
      
      const parsedFat = Number.parseFloat(bodyFatValue);
      if (Number.isFinite(parsedFat) && parsedFat > 0) {
        payload.body_fat = parsedFat;
      }
      
      const parsedMuscle = Number.parseFloat(muscleMassValue);
      if (Number.isFinite(parsedMuscle) && parsedMuscle > 0) {
        payload.muscle_mass = parsedMuscle;
      }
      
      const parsedChest = Number.parseFloat(chestValue);
      if (Number.isFinite(parsedChest) && parsedChest > 0) {
        payload.chest_cm = parsedChest;
      }
      
      const parsedWaist = Number.parseFloat(waistValue);
      if (Number.isFinite(parsedWaist) && parsedWaist > 0) {
        payload.waist_cm = parsedWaist;
      }
      
      const parsedHips = Number.parseFloat(hipsValue);
      if (Number.isFinite(parsedHips) && parsedHips > 0) {
        payload.hips_cm = parsedHips;
      }

      const response = await APIClient.post(`${BACKEND_ROUTES_API}QuickLogWeight.php`, payload);

      if (!response.success) {
        throw new Error(response.message || 'Failed to log body composition');
      }

      setStats((previous) => ({
        ...previous,
        current_weight: response.data?.current_weight ?? previous.current_weight,
        weight_change: response.data?.weight_change ?? previous.weight_change,
        change_type: response.data?.change_type || previous.change_type,
      }));
      setWeightValue('');
      setBodyFatValue('');
      setMuscleMassValue('');
      setChestValue('');
      setWaistValue('');
      setHipsValue('');
      showFlash('weight', 'success', 'Body composition logged.');
    } catch (submitError) {
      console.error('Error logging weight:', submitError);
      showFlash('weight', 'danger', submitError.message || 'Failed to log weight.');
    } finally {
      setSavingWeight(false);
    }
  };

  const handleQuickFoodSubmit = async (event) => {
    event.preventDefault();

    const foodName = quickFood.food_name.trim();
    const calories = Number.parseFloat(quickFood.calories);

    if (!foodName) {
      showFlash('food', 'warning', 'Add a food name first.');
      return;
    }

    if (!Number.isFinite(calories) || calories <= 0) {
      showFlash('food', 'warning', 'Enter valid calories first.');
      return;
    }

    try {
      setSavingFood(true);
      const quantity = Math.max(0.1, toNumber(quickFood.quantity, 1));
      const servingSize = Math.max(0.0001, toNumber(quickFood.serving_size, 1));
      const protein = toNumber(quickFood.protein, 0);
      const carbs = toNumber(quickFood.carbs, 0);
      const fat = toNumber(quickFood.fat, 0);
      const payload = selectedFoodResult
        ? {
            log_date: getTodayString(),
            meal_type: quickFood.meal_type,
            food_source: selectedFoodResult.source,
            food_id: selectedFoodResult.id || 0,
            food_name: selectedFoodResult.name,
            serving_size: servingSize,
            serving_unit: quickFood.serving_unit || selectedFoodResult.servingUnit || 'g',
            quantity,
            calories,
            protein,
            carbs,
            fat,
            notes: 'Dashboard quick log (searched food)',
          }
        : {
            log_date: getTodayString(),
            meal_type: quickFood.meal_type,
            food_source: 'custom',
            food_id: 0,
            food_name: foodName,
            serving_size: 1,
            serving_unit: 'entry',
            quantity: 1,
            calories,
            protein,
            carbs,
            fat,
            notes: 'Dashboard quick log',
          };

      const response = await APIClient.post(`${BACKEND_ROUTES_API}LogFood.php`, {
        ...payload,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to log food');
      }

      setQuickFood(EMPTY_QUICK_FOOD);
      resetSelectedFoodState();
      setFoodSearchQuery('');
      setFoodSearchResults(EMPTY_SEARCH_RESULT);
      await loadNutritionSummary();
      showFlash('food', 'success', `${foodName} logged.`);
    } catch (submitError) {
      console.error('Error logging food:', submitError);
      showFlash('food', 'danger', submitError.message || 'Failed to log food.');
    } finally {
      setSavingFood(false);
    }
  };

  const totalPlans = workoutPlans.length + assignedPrograms.length;
  const lastWorkout = recentSessions[0] || null;
  const calorieTarget = toNumber(nutritionGoal?.target_calories, 0);
  const calorieProgress = calorieTarget > 0
    ? Math.min(100, (toNumber(dailySummary.total_calories) / calorieTarget) * 100)
    : 0;
  const startWorkoutNote = totalPlans > 0
    ? `${totalPlans} plan${totalPlans === 1 ? '' : 's'} ready • ${stats.workouts_this_week} this week`
    : 'Open your plans and start your next session';

  const quickSummaryItems = [
    `${stats.workouts_this_week} workout${stats.workouts_this_week === 1 ? '' : 's'} this week`,
    `${Math.round(toNumber(dailySummary.total_calories))} kcal today`,
    stats.current_weight ? `${stats.current_weight} kg latest` : 'No weight logged yet',
  ];

  const selectedMeasurement = availablePortions.find((portion) => portion.key === selectedPortionKey) || null;
  const quantityMeta = getMeasurementTypeMeta(selectedMeasurement);

  if (lastWorkout?.session_date) {
    quickSummaryItems.push(`Last workout ${formatDate(lastWorkout.session_date)}`);
  }

  return (
    <TraineeDashboard>
      <div
        className="container-fluid px-3 px-md-4 py-3"
        style={{
          backgroundColor: 'var(--brand-dark)',
          paddingBottom: '210px',
        }}
      >
        {error && (
          <div className="alert alert-danger rounded-4 mb-3 d-flex align-items-center justify-content-between gap-3" role="alert">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-light" onClick={loadDashboardData}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ color: 'var(--brand-primary)' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-3">
              <div className={coach?.trainer_id ? 'col-12 col-xl-6' : 'col-12'}>
                <div className="card border-0 h-100" style={cardStyle}>
                  <div className="card-body p-4 d-flex flex-column gap-3">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        <h5 className="mb-1" style={{ color: 'var(--brand-white)', fontWeight: 700 }}>Start workout</h5>
                        <p className="small mb-0" style={mutedTextStyle}>{startWorkoutNote}</p>
                      </div>
                      <i className="bi bi-play-circle-fill" style={{ color: 'var(--brand-primary)', fontSize: '1.15rem' }}></i>
                    </div>

                    <div>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          backgroundColor: 'var(--brand-primary)',
                          color: 'var(--brand-dark)',
                          border: 'none',
                          fontWeight: 700,
                        }}
                        onClick={() => navigate('/trainee-dashboard/my-plans')}
                      >
                        Start now
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {coach?.trainer_id && (
                <div className="col-12 col-xl-6">
                  <div className="card border-0 h-100" style={cardStyle}>
                    <div className="card-body p-4 d-flex flex-column gap-3">
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <div>
                          <h5 className="mb-1" style={{ color: 'var(--brand-white)', fontWeight: 700 }}>Message coach</h5>
                          <p className="small mb-0" style={mutedTextStyle}>{coach.name || coach.username || 'Open messages'}</p>
                        </div>
                        <i className="bi bi-chat-dots-fill" style={{ color: 'var(--brand-primary)', fontSize: '1.1rem' }}></i>
                      </div>

                      <div>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--brand-primary)',
                            border: '1px solid rgba(32, 214, 87, 0.4)',
                            fontWeight: 700,
                          }}
                          onClick={() => navigate('/trainee-dashboard/messages', {
                            state: { selectedUserId: coach.trainer_id },
                          })}
                        >
                          Open chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
              {quickSummaryItems.map((item) => (
                <span
                  key={item}
                  className="px-3 py-2 rounded-pill small"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="row g-3">
              <div className="col-12 col-xl-8">
                <div className="card border-0" style={cardStyle}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                      <div>
                        <h5 className="mb-1" style={{ color: 'var(--brand-white)', fontWeight: 700 }}>Quick food log</h5>
                        <p className="small mb-0" style={mutedTextStyle}>Search, choose portion, check macros, then log.</p>
                      </div>
                      <i className="bi bi-egg-fried" style={{ color: 'var(--brand-primary)' }}></i>
                    </div>

                    <form onSubmit={handleQuickFoodSubmit}>
                      <div className="row g-2 align-items-center mb-2">
                        <div className="col-12 col-md-3">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Meal</label>
                          <select
                            className="form-select"
                            value={quickFood.meal_type}
                            onChange={(event) => {
                              setQuickFood((previous) => ({
                                ...previous,
                                meal_type: event.target.value,
                              }));
                            }}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="col-12 col-md-5">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Food</label>
                          <input
                            type="text"
                            className="form-control"
                            value={quickFood.food_name}
                            onChange={(event) => updateQuickFoodField('food_name', event.target.value)}
                            placeholder="Chicken wrap"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Calories <span style={{ color: 'var(--brand-primary)' }}>*</span></label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="form-control"
                            value={quickFood.calories}
                            onChange={(event) => updateQuickFoodField('calories', event.target.value)}
                            placeholder="450"
                            required
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="row g-2 align-items-center">
                        <div className="col-12 col-md-3">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Protein (g)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            className="form-control"
                            value={quickFood.protein}
                            onChange={(event) => updateQuickFoodField('protein', event.target.value)}
                            placeholder="30"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Carbs (g)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            className="form-control"
                            value={quickFood.carbs}
                            onChange={(event) => updateQuickFoodField('carbs', event.target.value)}
                            placeholder="45"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Fat (g)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            className="form-control"
                            value={quickFood.fat}
                            onChange={(event) => updateQuickFoodField('fat', event.target.value)}
                            placeholder="15"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <label
                            className="form-label small"
                            style={{ visibility: 'hidden' }}
                            aria-hidden="true"
                          >
                            Action
                          </label>
                          <button
                            type="submit"
                            className="btn w-100"
                            disabled={savingFood}
                            style={{
                              backgroundColor: 'var(--brand-primary)',
                              color: 'var(--brand-dark)',
                              border: 'none',
                              fontWeight: 700,
                            }}
                          >
                            {savingFood ? 'Saving...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </form>

                    {flash.message && flash.area === 'food' && (
                      <div
                        className="mt-3"
                        style={{
                          ...getFlashModalColors(flash.type),
                          border: `1px solid ${getFlashModalColors(flash.type).borderColor}`,
                          borderRadius: '12px',
                          padding: '0.75rem 0.9rem',
                          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
                        }}
                        role="alert"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span style={{ color: 'var(--brand-white)', fontWeight: 600 }}>{flash.message}</span>
                        </div>
                      </div>
                    )}

                    {selectedFoodResult && (
                      <div
                        className="mt-3 p-3 rounded-3"
                        style={{
                          backgroundColor: 'rgba(32, 214, 87, 0.08)',
                          border: '1px solid rgba(32, 214, 87, 0.18)',
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="small" style={{ color: 'var(--brand-white)' }}>
                            Using search result: {selectedFoodResult.name}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm p-0"
                            style={{ color: 'var(--brand-primary)', border: 'none' }}
                            onClick={clearSelectedFoodResult}
                          >
                            Clear
                          </button>
                        </div>

                        <div className="row g-2 mt-2">
                          <div className="col-12 col-md-8">
                            <label className="form-label small mb-1" style={{ color: 'var(--brand-white)' }}>
                              Measurement type
                            </label>
                            <select
                              className="form-select"
                              value={selectedPortionKey}
                              onChange={(event) => handleMeasurementTypeChange(event.target.value)}
                              disabled={loadingPortions || availablePortions.length === 0}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: 'var(--brand-white)',
                              }}
                            >
                              {availablePortions.map((portion) => (
                                <option key={portion.key} value={portion.key}>
                                  {portion.display_label || portion.label}
                                </option>
                              ))}
                            </select>
                            {loadingPortions && (
                              <div className="small mt-1" style={mutedTextStyle}>Loading portions...</div>
                            )}
                          </div>

                          <div className="col-12 col-md-4">
                            <label className="form-label small mb-1" style={{ color: 'var(--brand-white)' }}>
                              Quantity ({quantityMeta.quantityLabel})
                            </label>
                            <input
                              type="number"
                              min={quantityMeta.min}
                              step={quantityMeta.step}
                              className="form-control"
                              value={selectedMeasurement?.type === 'portion'
                                ? Math.round(quickFood.quantity || 1)
                                : Math.round(quickFood.quantity || 0)}
                              onChange={(event) => handleQuantityChange(event.target.value)}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: 'var(--brand-white)',
                              }}
                            />
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 mt-3">
                          <span
                            className="px-2 py-1 rounded-pill small"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--brand-white)' }}
                          >
                            {formatDecimal(toNumber(quickFood.calories), 1)} kcal
                          </span>
                          <span
                            className="px-2 py-1 rounded-pill small"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--brand-white)' }}
                          >
                            P {formatDecimal(toNumber(quickFood.protein), 1)}g
                          </span>
                          <span
                            className="px-2 py-1 rounded-pill small"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--brand-white)' }}
                          >
                            C {formatDecimal(toNumber(quickFood.carbs), 1)}g
                          </span>
                          <span
                            className="px-2 py-1 rounded-pill small"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--brand-white)' }}
                          >
                            F {formatDecimal(toNumber(quickFood.fat), 1)}g
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <label className="form-label small" style={{ color: 'var(--brand-white)' }}>
                        Search food database (optional)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={foodSearchQuery}
                        onChange={(event) => setFoodSearchQuery(event.target.value)}
                        placeholder="Search chicken, rice, banana..."
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'var(--brand-white)',
                        }}
                      />

                      {searchingFoods && (
                        <div className="small mt-2" style={mutedTextStyle}>Searching...</div>
                      )}

                      {!searchingFoods && foodSearchQuery.trim().length >= 2 && foodSearchResults.length === 0 && (
                        <div className="small mt-2" style={mutedTextStyle}>No foods found.</div>
                      )}

                      {foodSearchResults.length > 0 && (
                        <div className="d-flex flex-column gap-2 mt-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                          {foodSearchResults.map((food) => (
                            <button
                              key={`${food.source}-${food.id}-${food.name}`}
                              type="button"
                              className="btn text-start border-0 px-3 py-2"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '12px',
                                color: 'var(--brand-white)',
                              }}
                              onClick={() => handleSelectFoodResult(food)}
                            >
                              <div className="d-flex justify-content-between align-items-start gap-3">
                                <div>
                                  <div className="small fw-semibold">{food.name}</div>
                                  <div className="small" style={mutedTextStyle}>
                                    {food.label}{food.brandName ? ` • ${food.brandName}` : ''}
                                  </div>
                                </div>
                                <div className="small text-nowrap" style={{ color: 'var(--brand-primary)' }}>
                                  {Math.round(food.calories)} kcal
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="d-flex justify-content-between small mb-2" style={mutedTextStyle}>
                        <span>{Math.round(toNumber(dailySummary.total_calories))} kcal today</span>
                        <span>{calorieTarget > 0 ? `${Math.round(calorieTarget)} kcal target` : 'No target yet'}</span>
                      </div>
                      <div className="progress" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${calorieProgress}%`, backgroundColor: 'var(--brand-primary)' }}
                          aria-valuenow={calorieProgress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-link px-0 mt-2"
                        style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}
                        onClick={() => navigate('/trainee-dashboard/my-plans', {
                          state: { activeTab: 'meals' },
                        })}
                      >
                        Open meals in plans
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-4">
                <div className="card border-0 h-100" style={cardStyle}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                      <div>
                        <h5 className="mb-1" style={{ color: 'var(--brand-white)', fontWeight: 700 }}>Quick Log</h5>
                        <p className="small mb-0" style={mutedTextStyle}>Save today&apos;s body composition.</p>
                      </div>
                      <i className="bi bi-speedometer2" style={{ color: 'var(--brand-primary)' }}></i>
                    </div>

                    <div className="mb-3">
                      <div className="small mb-1" style={mutedTextStyle}>Current</div>
                      <div className="h4 mb-0" style={{ color: 'var(--brand-white)', fontWeight: 700 }}>
                        {stats.current_weight ? `${stats.current_weight} kg` : '—'}
                      </div>
                    </div>

                    <form onSubmit={handleWeightSubmit}>
                      <div className="row g-2 align-items-center mb-3">
                        <div className="col-12">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Weight (kg) *</label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            required
                            className="form-control"
                            value={weightValue}
                            onChange={(event) => setWeightValue(event.target.value)}
                            placeholder={stats.current_weight ? `${stats.current_weight}` : '72.5'}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="row g-2 align-items-center mb-3">
                        <div className="col-6">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Fat (%)</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            className="form-control"
                            value={bodyFatValue}
                            onChange={(event) => setBodyFatValue(event.target.value)}
                            placeholder="e.g. 15"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Muscle (kg)</label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            className="form-control"
                            value={muscleMassValue}
                            onChange={(event) => setMuscleMassValue(event.target.value)}
                            placeholder="e.g. 35"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="row g-2 align-items-center mb-3">
                        <div className="col-4">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Chest (cm)</label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            className="form-control"
                            value={chestValue}
                            onChange={(event) => setChestValue(event.target.value)}
                            placeholder="e.g. 100"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                        <div className="col-4">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Waist (cm)</label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            className="form-control"
                            value={waistValue}
                            onChange={(event) => setWaistValue(event.target.value)}
                            placeholder="e.g. 85"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                        <div className="col-4">
                          <label className="form-label small" style={{ color: 'var(--brand-white)' }}>Hips (cm)</label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            className="form-control"
                            value={hipsValue}
                            onChange={(event) => setHipsValue(event.target.value)}
                            placeholder="e.g. 95"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--brand-white)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="row g-2">
                        <div className="col-12">
                          <button
                            type="submit"
                            className="btn w-100"
                            disabled={savingWeight}
                            style={{
                              backgroundColor: 'var(--brand-primary)',
                              color: 'var(--brand-dark)',
                              border: 'none',
                              fontWeight: 700,
                            }}
                          >
                            {savingWeight ? 'Saving...' : 'Save Measurements'}
                          </button>
                        </div>
                      </div>
                    </form>

                    {flash.message && flash.area === 'weight' && (
                      <div
                        className="mt-3"
                        style={{
                          ...getFlashModalColors(flash.type),
                          border: `1px solid ${getFlashModalColors(flash.type).borderColor}`,
                          borderRadius: '12px',
                          padding: '0.75rem 0.9rem',
                          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
                        }}
                        role="alert"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span style={{ color: 'var(--brand-white)', fontWeight: 600 }}>{flash.message}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 small" style={mutedTextStyle}>
                      {formatWeightChange(stats.weight_change, stats.change_type)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TraineeDashboard>
  );
};

export default HomePage;
