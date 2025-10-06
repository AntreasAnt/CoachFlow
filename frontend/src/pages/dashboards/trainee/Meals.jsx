import React, { useState } from 'react';

const Meals = () => {
  const [todaysMeals, setTodaysMeals] = useState([
    {
      id: 1,
      type: 'Breakfast',
      foods: [
        { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3 },
        { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 }
      ],
      time: '08:00'
    },
    {
      id: 2,
      type: 'Lunch',
      foods: [],
      time: '12:30'
    }
  ]);

  const [dailyGoals] = useState({
    calories: 2200,
    protein: 165,
    carbs: 275,
    fat: 73
  });

  const calculateTotals = () => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    todaysMeals.forEach(meal => {
      meal.foods.forEach(food => {
        totals.calories += food.calories;
        totals.protein += food.protein;
        totals.carbs += food.carbs;
        totals.fat += food.fat;
      });
    });
    return totals;
  };

  const totals = calculateTotals();

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
                  style={{ width: `${Math.min((totals.calories / dailyGoals.calories) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="fs-1 mb-2">💪</div>
              <h5>{totals.protein}g/{dailyGoals.protein}g</h5>
              <p className="text-muted small mb-0">Protein</p>
              <div className="progress mt-2" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${Math.min((totals.protein / dailyGoals.protein) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="fs-1 mb-2">🍞</div>
              <h5>{totals.carbs}g/{dailyGoals.carbs}g</h5>
              <p className="text-muted small mb-0">Carbs</p>
              <div className="progress mt-2" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-warning" 
                  style={{ width: `${Math.min((totals.carbs / dailyGoals.carbs) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <div className="fs-1 mb-2">🥑</div>
              <h5>{totals.fat}g/{dailyGoals.fat}g</h5>
              <p className="text-muted small mb-0">Fat</p>
              <div className="progress mt-2" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-info" 
                  style={{ width: `${Math.min((totals.fat / dailyGoals.fat) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="row">
        <div className="col-lg-8">
          {todaysMeals.map(meal => (
            <div key={meal.id} className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{meal.type} - {meal.time}</h6>
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-plus"></i> Add Food
                  </button>
                </div>
              </div>
              <div className="card-body">
                {meal.foods.length === 0 ? (
                  <div className="text-center py-3">
                    <i className="bi bi-plus-circle text-muted fs-1"></i>
                    <p className="text-muted mt-2">No foods logged for {meal.type.toLowerCase()}</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Food</th>
                          <th>Calories</th>
                          <th>Protein</th>
                          <th>Carbs</th>
                          <th>Fat</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {meal.foods.map((food, index) => (
                          <tr key={index}>
                            <td>{food.name}</td>
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
