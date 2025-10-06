import React, { useState } from 'react';
import LogoutButton from '../../components/LogoutButton';
import HomePage from './trainee/HomePage';
import MyWorkouts from './trainee/MyWorkouts';
import Meals from './trainee/Meals';
import Progress from './trainee/Progress';
import Coach from './trainee/Coach';
import '../../styles/trainee-dashboard.css';

const TraineeDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'workouts':
        return <MyWorkouts />;
      case 'meals':
        return <Meals />;
      case 'progress':
        return <Progress />;
      case 'coach':
        return <Coach />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-vh-100 bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-bottom">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h4 mb-0 fw-bold text-dark">CoachFlow</h1>
              <p className="small text-muted mb-0">Welcome back, Trainee!</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-outline-dark btn-sm">
                <i className="bi bi-bell"></i>
              </button>
              <div className="dropdown">
                <button className="btn btn-outline-dark btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  <i className="bi bi-person-circle"></i>
                </button>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#"><i className="bi bi-person me-2"></i>Profile</a></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-gear me-2"></i>Settings</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><LogoutButton className="dropdown-item" /></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed-bottom footer-menu">
        <div className="container-fluid">
          <div className="row">
            <div className="col">
              <button
                className={`btn w-100 py-3 border-0 ${activeTab === 'home' ? 'text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('home')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-house${activeTab === 'home' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Home</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-3 border-0 ${activeTab === 'workouts' ? 'text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('workouts')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-lightning${activeTab === 'workouts' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Workouts</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-3 border-0 ${activeTab === 'meals' ? 'text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('meals')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-apple fs-5`}></i>
                  <small className="mt-1">Meals</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-3 border-0 ${activeTab === 'progress' ? 'text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('progress')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-graph-up${activeTab === 'progress' ? '-arrow' : ''} fs-5`}></i>
                  <small className="mt-1">Progress</small>
                </div>
              </button>
            </div>
            <div className="col">
              <button
                className={`btn w-100 py-3 border-0 ${activeTab === 'coach' ? 'text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('coach')}
              >
                <div className="d-flex flex-column align-items-center">
                  <i className={`bi bi-person${activeTab === 'coach' ? '-fill' : ''} fs-5`}></i>
                  <small className="mt-1">Coach</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};
                export default TraineeDashboard;
