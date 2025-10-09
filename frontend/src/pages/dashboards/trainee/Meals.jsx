import React, { useState, useEffect } from 'react';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const Meals = () => {
  const [todaysMeals, setTodaysMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2200,
    protein: 165,
    carbs: 275,
    fat: 73
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMealsData();
  }, []);

  const fetchMealsData = async () => {
    try {
      setLoading(true);
      
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetTodaysMeals.php`);

      if (data.success) {
        setTodaysMeals(data.meals);
        // Use provided nutrition goals or fallback to defaults
        if (data.nutritionGoals) {
          setDailyGoals(data.nutritionGoals);
        }
      } else {
        throw new Error(data.message || 'Failed to load meals');
      }

    } catch (err) {
      console.error('Error fetching meals data:', err);
      setError('Failed to load meals data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    Object.values(todaysMeals).forEach(mealArray => {
      mealArray.forEach(food => {
        totals.calories += food.calories || 0;
        totals.protein += food.protein || 0;
        totals.carbs += food.carbs || 0;
        totals.fat += food.fat || 0;
      });
    });
    
    return totals;
  };

  const calculateProgress = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your nutrition data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchMealsData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Today's Nutrition</h4>
        <button className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Add Food
        </button>
      </div>

      {/* Daily Overview */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="fs-1 mb-2">🔥</div>
              <h5>{totals.calories}/{dailyGoals.calories}</h5>
              <p className="text-muted small mb-0">Calories</p>
              <div className="progress mt-2" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-danger" 
                  style={{ width: `${calculateProgress(totals.calories, dailyGoals.calories)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="fs-1 mb-2">💪</div>
              <h5>{Math.round(totals.protein)}g/{dailyGoals.protein}g</h5>
              <p className="text-muted small mb-0">Protein</p>
              <div className="progress mt-2" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${calculateProgress(totals.protein, dailyGoals.protein)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="fs-1 mb-2">🍞</div>
              <h5>{Math.round(totals.carbs)}g/{dailyGoals.carbs}g</h5>
              <p className="text-muted small mb-0">Carbs</p>
              <div className="progress mt-2" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-warning" 
                  style={{ width: `${calculateProgress(totals.carbs, dailyGoals.carbs)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="fs-1 mb-2">🥑</div>
              <h5>{Math.round(totals.fat)}g/{dailyGoals.fat}g</h5>
              <p className="text-muted small mb-0">Fat</p>
              <div className="progress mt-2" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-info" 
                  style={{ width: `${calculateProgress(totals.fat, dailyGoals.fat)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="row">
        <div className="col-lg-8">
          {Object.entries(todaysMeals).map(([mealType, foods]) => (
            <div key={mealType} className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h6>
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-plus"></i> Add Food
                  </button>
                </div>
              </div>
              <div className="card-body">
                {foods.length === 0 ? (
                  <div className="text-center py-3">
                    <i className="bi bi-plus-circle text-muted fs-1"></i>
                    <p className="text-muted mt-2">No foods logged for {mealType}</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Food</th>
                          <th>Amount</th>
                          <th>Calories</th>
                          <th>Protein</th>
                          <th>Carbs</th>
                          <th>Fat</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {foods.map((food, index) => (
                          <tr key={index}>
                            <td>{food.name}</td>
                            <td>{food.amount}</td>
                            <td>{food.calories}</td>
                            <td>{food.protein}g</td>
                            <td>{food.carbs}g</td>
                            <td>{food.fat}g</td>
                            <td>
                              <button className="btn btn-sm btn-outline-danger">
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Quick Add</h6>
            </div>
            <div className="card-body">
              <p className="small text-muted">Popular foods</p>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-secondary btn-sm text-start">
                  🥚 2 Eggs - 140 cal
                </button>
                <button className="btn btn-outline-secondary btn-sm text-start">
                  🍌 Medium Banana - 105 cal
                </button>
                <button className="btn btn-outline-secondary btn-sm text-start">
                  🥛 Protein Shake - 200 cal
                </button>
                <button className="btn btn-outline-secondary btn-sm text-start">
                  🍗 Chicken Breast (100g) - 165 cal
                </button>
                <button className="btn btn-outline-secondary btn-sm text-start">
                  🍚 Rice (1 cup) - 205 cal
                </button>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-3">
            <div className="card-header bg-white">
              <h6 className="mb-0">Water Intake</h6>
            </div>
            <div className="card-body text-center">
              <div className="fs-1 mb-2">💧</div>
              <h5>1.2L / 2.5L</h5>
              <div className="progress mb-3" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-info" 
                  style={{ width: '48%' }}
                ></div>
              </div>
              <button className="btn btn-outline-info btn-sm">
                <i className="bi bi-plus"></i> Add Glass
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meals;
