import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from '../../components/LogoutButton';

const ManagerDashboard = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-secondary sidebar">
          <div className="position-sticky pt-3">
            <div className="text-center mb-4">
              <h4 className="text-white">CoachFlow</h4>
              <p className="text-white-50 small">Manager Panel</p>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link className="nav-link text-white" to="/manager/dashboard">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/manager/trainers">
                  <i className="bi bi-person-badge me-2"></i>
                  Manage Trainers
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/manager/programs">
                  <i className="bi bi-collection-play me-2"></i>
                  Program Oversight
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/manager/performance">
                  <i className="bi bi-graph-up me-2"></i>
                  Performance
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/manager/reports">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Reports
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/manager/profile">
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
            <h1 className="h2">Manager Dashboard</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <Link to="/manager/assign-trainer" className="btn btn-sm btn-secondary">
                  <i className="bi bi-person-plus me-1"></i>
                  Assign Trainer
                </Link>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4 text-white bg-secondary">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col">
                      <div className="text-xs font-weight-bold text-uppercase mb-1">
                        Managed Trainers
                      </div>
                      <div className="h5 mb-0 font-weight-bold">24</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-person-badge fs-2"></i>
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
                        Total Clients
                      </div>
                      <div className="h5 mb-0 font-weight-bold">387</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-people fs-2"></i>
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
                        Avg. Performance
                      </div>
                      <div className="h5 mb-0 font-weight-bold">87%</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-graph-up fs-2"></i>
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
                        Pending Reviews
                      </div>
                      <div className="h5 mb-0 font-weight-bold">12</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-clipboard-check fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trainer Performance & Recent Activity */}
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3 d-flex justify-content-between align-items-center">
                  <h6 className="m-0 font-weight-bold text-secondary">Top Performing Trainers</h6>
                  <Link to="/manager/trainers" className="btn btn-sm btn-outline-secondary">View All</Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Trainer</th>
                          <th>Clients</th>
                          <th>Revenue</th>
                          <th>Satisfaction</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
                                <small className="text-white fw-bold">SJ</small>
                              </div>
                              Sarah Johnson
                            </div>
                          </td>
                          <td>32</td>
                          <td>$4,280</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">95%</span>
                              <div className="progress flex-grow-1" style={{height: '6px'}}>
                                <div className="progress-bar bg-success" style={{width: '95%'}}></div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge bg-success">Active</span></td>
                        </tr>
                        <tr>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-info rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
                                <small className="text-white fw-bold">MW</small>
                              </div>
                              Mike Wilson
                            </div>
                          </td>
                          <td>28</td>
                          <td>$3,850</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">92%</span>
                              <div className="progress flex-grow-1" style={{height: '6px'}}>
                                <div className="progress-bar bg-success" style={{width: '92%'}}></div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge bg-success">Active</span></td>
                        </tr>
                        <tr>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
                                <small className="text-white fw-bold">ED</small>
                              </div>
                              Emma Davis
                            </div>
                          </td>
                          <td>25</td>
                          <td>$3,200</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">88%</span>
                              <div className="progress flex-grow-1" style={{height: '6px'}}>
                                <div className="progress-bar bg-warning" style={{width: '88%'}}></div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge bg-warning">Review Needed</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-secondary">Quick Actions</h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <Link to="/manager/assign-trainer" className="btn btn-secondary">
                      <i className="bi bi-person-plus me-2"></i>Assign Trainer
                    </Link>
                    <Link to="/manager/review-programs" className="btn btn-outline-secondary">
                      <i className="bi bi-check-circle me-2"></i>Review Programs
                    </Link>
                    <Link to="/manager/performance-reports" className="btn btn-outline-info">
                      <i className="bi bi-graph-up me-2"></i>Performance Reports
                    </Link>
                    <Link to="/manager/team-meeting" className="btn btn-outline-primary">
                      <i className="bi bi-calendar-event me-2"></i>Schedule Meeting
                    </Link>
                  </div>
                </div>
              </div>

              {/* Team Overview */}
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-secondary">Team Overview</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="small">Trainer Retention</span>
                    <span className="badge bg-success">92%</span>
                  </div>
                  <div className="progress mb-3" style={{height: '8px'}}>
                    <div className="progress-bar bg-success" style={{width: '92%'}}></div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="small">Client Satisfaction</span>
                    <span className="badge bg-info">89%</span>
                  </div>
                  <div className="progress mb-3" style={{height: '8px'}}>
                    <div className="progress-bar bg-info" style={{width: '89%'}}></div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Program Completion</span>
                    <span className="badge bg-warning">74%</span>
                  </div>
                  <div className="progress" style={{height: '8px'}}>
                    <div className="progress-bar bg-warning" style={{width: '74%'}}></div>
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

export default ManagerDashboard;
