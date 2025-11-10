import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  
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
    loadData();
  }, []);

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
        alert('Nutrition goal set successfully!');
      } else {
        alert(data.error || 'Failed to set goal');
      }
    } catch (error) {
      console.error('Error setting goal:', error);
      alert('Failed to set goal');
    }
    setLoading(false);
  };

  const handleSearchFoods = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const url = `${BACKEND_ROUTES_API}SearchFoods.php?query=${encodeURIComponent(searchQuery)}&source=all`;
      console.log('Searching URL:', url); // Debug log
      const response = await fetch(url, { credentials: 'include' });
      console.log('Response status:', response.status); // Debug log
      const data = await response.json();
      console.log('Search response:', data); // Debug log
      if (data.success) {
        console.log('Search results:', data.results); // Debug log
        setSearchResults(data.results);
      } else {
        console.error('Search failed:', data.error || data.message);
      }
    } catch (error) {
      console.error('Error searching foods:', error);
    }
    setLoading(false);
  };

  const selectFood = (food, source) => {
    const nutrients = source === 'usda' ? food.nutrients : food;
    setLogForm({
      ...logForm,
      food_source: source,
      food_id: source === 'usda' ? food.fdc_id : food.id,
      food_name: food.description || food.name,
      serving_size: food.serving_size || 100,
      serving_unit: food.serving_unit || 'g',
      calories: nutrients.calories || food.calories || '',
      protein: nutrients.protein || food.protein || '',
      carbs: nutrients.carbs || food.carbs || '',
      fat: nutrients.fat || food.fat || ''
    });
    setSearchResults({ usda_foods: [], custom_foods: [] });
    setSearchQuery('');
  };

  const handleLogFood = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_ROUTES_API}/LogFood.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(logForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowLogModal(false);
        resetLogForm();
        await loadData();
        alert('Food logged successfully!');
      } else {
        alert(data.error || 'Failed to log food');
      }
    } catch (error) {
      console.error('Error logging food:', error);
      alert('Failed to log food');
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
                onClick={() => setShowGoalModal(true)}
              >
                <i className="bi bi-target me-1"></i>
                {nutritionGoal ? 'Edit Goal' : 'Set Goal'}
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowLogModal(true)}
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
                            </tr>
                          </thead>
                          <tbody>
                            {logs.map((log) => (
                              <tr key={log.id}>
                                <td>
                                  <strong>{log.food_name}</strong>
                                  {log.notes && <><br/><small className="text-muted">{log.notes}</small></>}
                                </td>
                                <td>{log.quantity} × {log.serving_size}{log.serving_unit}</td>
                                <td>{Math.round(log.calories * log.quantity)} kcal</td>
                                <td>{Math.round(log.protein * log.quantity)}g</td>
                                <td>{Math.round(log.carbs * log.quantity)}g</td>
                                <td>{Math.round(log.fat * log.quantity)}g</td>
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
                <button type="button" className="btn-close" onClick={() => {setShowLogModal(false); resetLogForm();}}></button>
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchFoods())}
                      />
                      <button 
                        className="btn btn-outline-primary" 
                        type="button"
                        onClick={handleSearchFoods}
                        disabled={loading}
                      >
                        <i className="bi bi-search"></i>
                      </button>
                    </div>
                    
                    {/* Search Results */}
                    {(searchResults.usda_foods.length > 0 || searchResults.custom_foods.length > 0) && (
                      <div className="mt-2" style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px'}}>
                        {searchResults.usda_foods.map((food, idx) => (
                          <div 
                            key={`usda-${idx}`}
                            className="p-2 border-bottom cursor-pointer hover-bg-light"
                            style={{cursor: 'pointer'}}
                            onClick={() => selectFood(food, 'usda')}
                          >
                            <strong>{food.description}</strong>
                            {food.brand_name && <><br/><small className="text-muted">{food.brand_name}</small></>}
                          </div>
                        ))}
                        {searchResults.custom_foods.map((food) => (
                          <div 
                            key={`custom-${food.id}`}
                            className="p-2 border-bottom cursor-pointer hover-bg-light"
                            style={{cursor: 'pointer'}}
                            onClick={() => selectFood(food, 'custom')}
                          >
                            <strong>{food.name}</strong> <span className="badge bg-info">Custom</span>
                            {food.brand_name && <><br/><small className="text-muted">{food.brand_name}</small></>}
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
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Serving Size *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.serving_size}
                            onChange={(e) => setLogForm({...logForm, serving_size: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Unit *</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={logForm.serving_unit}
                            onChange={(e) => setLogForm({...logForm, serving_unit: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Quantity *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.quantity}
                            onChange={(e) => setLogForm({...logForm, quantity: e.target.value})}
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
                            onChange={(e) => setLogForm({...logForm, calories: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Protein (g) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.protein}
                            onChange={(e) => setLogForm({...logForm, protein: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Carbs (g) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.carbs}
                            onChange={(e) => setLogForm({...logForm, carbs: e.target.value})}
                            required
                          />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Fat (g) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control"
                            value={logForm.fat}
                            onChange={(e) => setLogForm({...logForm, fat: e.target.value})}
                            required
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
                  <button type="button" className="btn btn-secondary" onClick={() => {setShowLogModal(false); resetLogForm();}}>
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
