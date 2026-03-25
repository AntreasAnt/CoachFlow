import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TraineeDashboard from '../../../components/TraineeDashboard';
import MyWorkouts from './MyWorkouts';
import MealsPage from './MealsPage';

const MyPlansPage = () => {
  const location = useLocation();
  const requestedTab = location.state?.startWorkout
    ? 'workouts'
    : location.state?.activeTab === 'meals'
      ? 'meals'
      : 'workouts';
  const [activeTab, setActiveTab] = useState(requestedTab);

  useEffect(() => {
    if (location.state?.startWorkout) {
      setActiveTab('workouts');
      return;
    }

    if (location.state?.activeTab === 'meals' || location.state?.activeTab === 'workouts') {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  return (
    <TraineeDashboard>
      <div className="container-fluid p-4" style={{ paddingBottom: '100px' }}>
        {/* Tabs */}
        <ul className="nav nav-tabs mb-4 border-secondary">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'workouts' ? 'active' : ''}`} 
              onClick={() => setActiveTab('workouts')}
            >
              <i className="bi bi-dumbbell me-2"></i>
              Workouts
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'meals' ? 'active' : ''}`} 
              onClick={() => setActiveTab('meals')}
            >
              <i className="bi bi-calendar3 me-2"></i>
              Meals
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'workouts' && (
            <div className="tab-pane fade show active">
              <MyWorkouts embedded={true} />
            </div>
          )}
          {activeTab === 'meals' && (
            <div className="tab-pane fade show active">
              <MealsPage embedded={true} />
            </div>
          )}
        </div>
      </div>
    </TraineeDashboard>
  );
};

export default MyPlansPage;
