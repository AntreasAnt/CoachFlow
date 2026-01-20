import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from '../../components/LogoutButton';

const TrainerDashboard = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar">
          <div className="position-sticky pt-3">
            <div className="text-center mb-4">
              <h4 className="text-white">CoachFlow</h4>
              <p className="text-muted small">Trainer Dashboard</p>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link className="nav-link text-white" to="/trainer-dashboard">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Overview
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainer-dashboard/clients">
                  <i className="bi bi-people me-2"></i>
                  My Clients
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainer-dashboard/programs">
                  <i className="bi bi-grid me-2"></i>
                  My Programs
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainer-dashboard/payments">
                  <i className="bi bi-credit-card me-2"></i>
                  Payments
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainer-dashboard/messages">
                  <i className="bi bi-chat-dots me-2"></i>
                  Messages
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/trainer-dashboard/profile">
                  <i className="bi bi-person me-2"></i>
                  Profile
                </Link>
              </li>
              <li className="nav-item mt-3 pt-3 border-top">
                <LogoutButton className="btn btn-outline-light w-100" />
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Trainer Dashboard</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <Link to="/trainer/add-client" className="btn btn-sm btn-primary">
                  <i className="bi bi-person-plus me-1"></i>
                  Add Client
                </Link>
              </div>
              <LogoutButton className="btn btn-sm btn-outline-danger" />
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="row">
            {/* Stats Cards */}
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4 text-white bg-primary">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col">
                      <div className="text-xs font-weight-bold text-uppercase mb-1">
                        Total Clients
                      </div>
                      <div className="h5 mb-0 font-weight-bold">24</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-people fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4 text-white bg-success">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col">
                      <div className="text-xs font-weight-bold text-uppercase mb-1">
                        Monthly Revenue
                      </div>
                      <div className="h5 mb-0 font-weight-bold">$4,280</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-currency-dollar fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4 text-white bg-info">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col">
                      <div className="text-xs font-weight-bold text-uppercase mb-1">
                        Active Programs
                      </div>
                      <div className="h5 mb-0 font-weight-bold">12</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-collection-play fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4 text-white bg-warning">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col">
                      <div className="text-xs font-weight-bold text-uppercase mb-1">
                        This Week's Sessions
                      </div>
                      <div className="h5 mb-0 font-weight-bold">18</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-calendar-check fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3 d-flex justify-content-between align-items-center">
                  <h6 className="m-0 font-weight-bold text-primary">Recent Client Activity</h6>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Sarah Johnson completed Leg Day workout</h6>
                        <small className="text-muted">2 hours ago</small>
                      </div>
                      <span className="badge bg-success rounded-pill">Completed</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Mike Wilson uploaded progress photos</h6>
                        <small className="text-muted">4 hours ago</small>
                      </div>
                      <span className="badge bg-info rounded-pill">Progress</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">New client registration: Emma Davis</h6>
                        <small className="text-muted">1 day ago</small>
                      </div>
                      <span className="badge bg-primary rounded-pill">New</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Quick Actions</h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <Link to="/trainer/add-client" className="btn btn-primary">
                      <i className="bi bi-person-plus me-2"></i>Add New Client
                    </Link>
                    <Link to="/trainer-dashboard/programs" className="btn btn-outline-primary">
                      <i className="bi bi-plus-circle me-2"></i>Create Program
                    </Link>
                    <Link to="/trainer/view-payments" className="btn btn-outline-success">
                      <i className="bi bi-credit-card me-2"></i>View Payments
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrainerDashboard;
