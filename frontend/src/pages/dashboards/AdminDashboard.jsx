import React from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from '../../components/LogoutButton';

const AdminDashboard = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-3 col-lg-2 d-md-block bg-dark sidebar">
          <div className="position-sticky pt-3">
            <div className="text-center mb-4">
              <h4 className="text-white">CoachFlow</h4>
              <p className="text-muted small">Admin Panel</p>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link className="nav-link text-white" to="/admin/dashboard">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/admin/users">
                  <i className="bi bi-people me-2"></i>
                  User Management
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/admin/trainers">
                  <i className="bi bi-person-badge me-2"></i>
                  Trainers
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/admin/payments">
                  <i className="bi bi-credit-card me-2"></i>
                  Payments
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/admin/analytics">
                  <i className="bi bi-graph-up me-2"></i>
                  Analytics
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/admin/settings">
                  <i className="bi bi-gear me-2"></i>
                  Settings
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
            <h1 className="h2">Admin Dashboard</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <Link to="/admin/add-user" className="btn btn-sm btn-primary">
                  <i className="bi bi-person-plus me-1"></i>
                  Add User
                </Link>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-0 shadow rounded-4 text-white bg-primary">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col">
                      <div className="text-xs font-weight-bold text-uppercase mb-1">
                        Total Users
                      </div>
                      <div className="h5 mb-0 font-weight-bold">1,247</div>
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
                        Active Trainers
                      </div>
                      <div className="h5 mb-0 font-weight-bold">156</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-person-badge fs-2"></i>
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
                        Monthly Revenue
                      </div>
                      <div className="h5 mb-0 font-weight-bold">$45,280</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-currency-dollar fs-2"></i>
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
                        Support Tickets
                      </div>
                      <div className="h5 mb-0 font-weight-bold">23</div>
                    </div>
                    <div className="col-auto">
                      <i className="bi bi-exclamation-triangle fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & User Management */}
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3 d-flex justify-content-between align-items-center">
                  <h6 className="m-0 font-weight-bold text-primary">Recent User Activity</h6>
                  <Link to="/admin/users" className="btn btn-sm btn-outline-primary">View All</Link>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Action</th>
                          <th>Time</th>
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
                          <td><span className="badge bg-success">Trainer</span></td>
                          <td>New client added</td>
                          <td>2 hours ago</td>
                          <td><i className="bi bi-check-circle text-success"></i></td>
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
                          <td><span className="badge bg-primary">Trainee</span></td>
                          <td>Profile updated</td>
                          <td>4 hours ago</td>
                          <td><i className="bi bi-check-circle text-success"></i></td>
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
                          <td><span className="badge bg-primary">Trainee</span></td>
                          <td>Account created</td>
                          <td>1 day ago</td>
                          <td><i className="bi bi-clock text-warning"></i></td>
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
                  <h6 className="m-0 font-weight-bold text-primary">Quick Actions</h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <Link to="/admin/add-user" className="btn btn-primary">
                      <i className="bi bi-person-plus me-2"></i>Add New User
                    </Link>
                    <Link to="/admin/trainer-approval" className="btn btn-outline-primary">
                      <i className="bi bi-check-circle me-2"></i>Approve Trainers
                    </Link>
                    <Link to="/admin/system-settings" className="btn btn-outline-secondary">
                      <i className="bi bi-gear me-2"></i>System Settings
                    </Link>
                    <Link to="/admin/reports" className="btn btn-outline-info">
                      <i className="bi bi-file-earmark-text me-2"></i>Generate Reports
                    </Link>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="card shadow rounded-4 mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">System Health</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Server Performance</span>
                    <span className="badge bg-success">Excellent</span>
                  </div>
                  <div className="progress mb-3" style={{height: '8px'}}>
                    <div className="progress-bar bg-success" style={{width: '95%'}}></div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Database Status</span>
                    <span className="badge bg-success">Online</span>
                  </div>
                  <div className="progress mb-3" style={{height: '8px'}}>
                    <div className="progress-bar bg-success" style={{width: '100%'}}></div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">API Response Time</span>
                    <span className="badge bg-warning">120ms</span>
                  </div>
                  <div className="progress" style={{height: '8px'}}>
                    <div className="progress-bar bg-warning" style={{width: '80%'}}></div>
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

export default AdminDashboard;
