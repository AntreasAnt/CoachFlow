import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LogoutButton from '../../../components/LogoutButton';
import HomePage from './HomePage';
import Progress from './Progress';
import '../../../styles/trainee-dashboard.css';

const TraineeDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'progress':
        return <Progress />;
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
              <button 
                className="btn btn-outline-dark btn-sm" 
                onClick={() => navigate('/profile')}
              >
                <i className="bi bi-person-circle"></i>
              </button>
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
              <div className={activeTab === 'home' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    activeTab === 'home' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => setActiveTab('home')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-house${activeTab === 'home' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1 fw-${activeTab === 'home' ? 'bold' : 'normal'}">Home</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={activeTab === 'workouts' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    activeTab === 'workouts' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/workouts')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-lightning${activeTab === 'workouts' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1 fw-${activeTab === 'workouts' ? 'bold' : 'normal'}">Workouts</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={activeTab === 'meals' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    activeTab === 'meals' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/meals')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-cup-hot fs-5`}></i>
                    <small className="mt-1 fw-${activeTab === 'meals' ? 'bold' : 'normal'}">Meals</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={activeTab === 'progress' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    activeTab === 'progress' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => setActiveTab('progress')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-graph-up${activeTab === 'progress' ? '-arrow' : ''} fs-5`}></i>
                    <small className="mt-1 fw-${activeTab === 'progress' ? 'bold' : 'normal'}">Progress</small>
                  </div>
                </button>
              </div>
            </div>
            <div className="col">
              <div className={activeTab === 'coach' ? 'nav-item-active' : ''}>
                <button
                  className={`btn w-100 py-2 border-0 ${
                    activeTab === 'coach' 
                      ? 'text-primary nav-btn-active' 
                      : 'text-muted'
                  }`}
                  onClick={() => navigate('/coach')}
                >
                  <div className="d-flex flex-column align-items-center">
                    <i className={`bi bi-person-check${activeTab === 'coach' ? '-fill' : ''} fs-5`}></i>
                    <small className="mt-1 fw-${activeTab === 'coach' ? 'bold' : 'normal'}">Coach</small>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};
                export default TraineeDashboard;
