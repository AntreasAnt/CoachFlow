import React, { useState } from 'react';
import TraineeDashboard from '../../../components/TraineeDashboard';
import MyWorkouts from './MyWorkouts';
import MealsPage from './MealsPage';

const MyPlansPage = () => {
  const [activeTab, setActiveTab] = useState('workouts');

  return (
    <TraineeDashboard>
      <div className="container-fluid px-3 px-md-4 py-3" style={{ paddingBottom: '100px', backgroundColor: 'var(--brand-dark)', minHeight: '100vh' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-2" style={{ color: 'var(--brand-white)', fontWeight: '700', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
            <i className="bi bi-clipboard-check me-2" style={{ color: 'var(--brand-primary)' }}></i>
            My Plans
          </h2>
          <p className="mb-0" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Track your workouts and meals</p>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4" style={{ borderBottom: '2px solid rgba(32, 214, 87, 0.2)' }}>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'workouts' ? 'active' : ''}`}
              onClick={() => setActiveTab('workouts')}
              style={{
                backgroundColor: activeTab === 'workouts' ? 'rgba(32, 214, 87, 0.15)' : 'transparent',
                color: activeTab === 'workouts' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: activeTab === 'workouts' ? '2px solid var(--brand-primary)' : 'none',
                fontWeight: activeTab === 'workouts' ? '600' : '400',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px 8px 0 0'
              }}
            >
              <i className="bi bi-dumbbell me-2"></i>
              Workouts
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'meals' ? 'active' : ''}`}
              onClick={() => setActiveTab('meals')}
              style={{
                backgroundColor: activeTab === 'meals' ? 'rgba(32, 214, 87, 0.15)' : 'transparent',
                color: activeTab === 'meals' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: activeTab === 'meals' ? '2px solid var(--brand-primary)' : 'none',
                fontWeight: activeTab === 'meals' ? '600' : '400',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px 8px 0 0'
              }}
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
