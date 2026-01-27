import React, { useState } from 'react';
import TraineeDashboard from '../../../components/TraineeDashboard';
import MyWorkouts from './MyWorkouts';
import MealsPage from './MealsPage';

const MyPlansPage = () => {
  const [activeTab, setActiveTab] = useState('workouts');

  return (
    <TraineeDashboard>
      <div className="container-fluid px-4 py-3" style={{ paddingBottom: '100px' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-1">My Plans</h2>
          <p className="text-muted mb-0">Track your workouts and meals</p>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
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
