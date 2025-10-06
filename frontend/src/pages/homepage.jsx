import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_ROUTES_API } from "../config/config";

// Import dashboard components
import AdminDashboard from "./dashboards/AdminDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import TrainerDashboard from "./dashboards/TrainerDashboard";
import TraineeDashboard from "./dashboards/TraineeDashboard";

function MainPage() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(
          BACKEND_ROUTES_API + "VerifyPrivilage.php",
          {
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        const data = await response.json();
        
        if (data.privileges && data.privileges !== 'loggedout') {
          setUserRole(data.privileges);
        } else {
          setUserRole('loggedout');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUserRole('loggedout');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is logged in, show their dashboard
  if (userRole && userRole !== 'loggedout') {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'trainer':
        return <TrainerDashboard />;
      case 'trainee':
        return <TraineeDashboard />;
      default:
        return <TraineeDashboard />; // Default fallback
    }
  }

  // If user is not logged in, show marketing homepage
  return (
    <div className="text-dark">
      {/* Hero Section */}
      <section className="hero bg-primary bg-gradient text-white py-5">
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center">
            <div className="col-lg-12 text-center mb-4 mb-lg-0">
              <span className="badge bg-white text-primary px-3 py-2 rounded-pill mb-3">
                🏋️ Professional Coaching Platform
              </span>
            </div>
          </div>
        </div>
        <div className="container text-center">
          <h1 className="display-3 fw-bold text-light mt-0 pt-3">
            Build Your Coaching Empire
          </h1>
          <p className="lead text-light fs-4 mb-4">
            The all-in-one platform for fitness trainers to manage clients, create custom programs,<br/>
            track progress, and get paid automatically.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-4 mt-5">
            <Link
              to="/signup"
              className="btn btn-light btn-lg rounded-pill shadow px-5 py-3 d-flex align-items-center fw-semibold"
            >
              <i className="bi bi-rocket me-2"></i>
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="btn btn-outline-light btn-lg rounded-pill shadow px-5 py-3 d-flex align-items-center"
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Login
            </Link>
          </div>
          <p className="text-light mt-3">
            <small>✨ No credit card required • 14-day free trial • Cancel anytime</small>
          </p>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="fw-bold mb-4">Stop Juggling Multiple Apps</h2>
              <p className="lead text-muted mb-4">
                Tired of switching between spreadsheets, payment apps, and messaging platforms? 
                CoachFlow brings everything together in one powerful platform.
              </p>
              <ul className="list-unstyled">
                <li className="d-flex align-items-center mb-3">
                  <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                  <span>Custom exercise libraries with videos & instructions</span>
                </li>
                <li className="d-flex align-items-center mb-3">
                  <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                  <span>Automated client billing & payment processing</span>
                </li>
                <li className="d-flex align-items-center mb-3">
                  <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                  <span>Real-time progress tracking & analytics</span>
                </li>
                <li className="d-flex align-items-center mb-3">
                  <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                  <span>Built-in chat & progress photos</span>
                </li>
              </ul>
            </div>
            <div className="col-lg-6 text-center">
              <div className="bg-white rounded-4 shadow-lg p-4">
                <div className="row g-3">
                  <div className="col-4">
                    <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                      <i className="bi bi-people-fill text-primary fs-1"></i>
                      <div className="mt-2">
                        <small className="text-muted">Clients</small>
                        <div className="fw-bold">247</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="bg-success bg-opacity-10 rounded-3 p-3">
                      <i className="bi bi-currency-dollar text-success fs-1"></i>
                      <div className="mt-2">
                        <small className="text-muted">Revenue</small>
                        <div className="fw-bold">$12.5k</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="bg-info bg-opacity-10 rounded-3 p-3">
                      <i className="bi bi-graph-up text-info fs-1"></i>
                      <div className="mt-2">
                        <small className="text-muted">Progress</small>
                        <div className="fw-bold">94%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Everything You Need to Scale Your Business</h2>
            <p className="lead text-muted">From onboarding to payment collection, we've got you covered.</p>
          </div>
          <div className="row g-4">
            {[
              {
                icon: "bi bi-collection-play",
                title: "Custom Exercise Library",
                description: "Build your signature workout programs with videos, instructions, and progression tracking.",
                color: "primary"
              },
              {
                icon: "bi bi-people",
                title: "Client Management",
                description: "Onboard clients seamlessly, track their goals, and manage all relationships in one place.",
                color: "success"
              },
              {
                icon: "bi bi-credit-card",
                title: "Automated Payments",
                description: "Set up subscription plans, process payments automatically, and focus on coaching, not chasing invoices.",
                color: "warning"
              },
              {
                icon: "bi bi-bar-chart-line",
                title: "Progress Analytics",
                description: "Track client adherence, view progress photos, and get insights to improve retention.",
                color: "info"
              },
              {
                icon: "bi bi-chat-dots",
                title: "Built-in Messaging",
                description: "Stay connected with clients through secure in-app chat with file sharing capabilities.",
                color: "purple"
              },
              {
                icon: "bi bi-phone",
                title: "Mobile Optimized",
                description: "Your clients can log workouts and upload progress photos from any device, anywhere.",
                color: "danger"
              }
            ].map((feature, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 hover-lift">
                  <div className="card-body text-center">
                    <div className={`bg-${feature.color} bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4`} 
                         style={{width: '80px', height: '80px'}}>
                      <i className={`${feature.icon} fs-1 text-${feature.color}`}></i>
                    </div>
                    <h4 className="fw-semibold mb-3">{feature.title}</h4>
                    <p className="text-muted">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-5 bg-dark text-white">
        <div className="container text-center">
          <h2 className="fw-bold mb-4 ">Join 500+ Successful Trainers</h2>
          <p className="lead mb-5">Coaches worldwide are growing their businesses with CoachFlow</p>
          
          <div className="row g-4 mb-5 text-white">
            <div className="col-md-4">
              <div className="display-4 fw-bold text-white mb-2">500+</div>
              <div className="text-light">Active Trainers</div>
            </div>
            <div className="col-md-4">
              <div className="display-4 fw-bold text-white mb-2">10k+</div>
              <div className="text-light">Client Workouts Logged</div>
            </div>
            <div className="col-md-4">
              <div className="display-4 fw-bold text-white mb-2">$2M+</div>
              <div className="text-light">Payments Processed</div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card bg-white bg-opacity-10 border-0 rounded-4 p-4">
                <blockquote className="mb-0">
                  <p className="text-white lead mb-3">"CoachFlow transformed my business. I went from 20 clients to 150+ in just 6 months. The automated billing alone saves me 10 hours per week!"</p>
                  <footer className="blockquote-footer text-light">
                    <strong>Sarah Mitchell</strong>, Certified Personal Trainer
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-4">Choose Your Perfect Plan</h2>
            <p className="lead text-muted mb-5">Scale your coaching business with the right package for your needs</p>
          </div>
          
          <div className="row g-4 justify-content-center">
            {/* Starter Plan */}
            <div className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4 text-center">
                  <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '60px', height: '60px'}}>
                    <i className="bi bi-person text-info fs-3"></i>
                  </div>
                  <h3 className="fw-bold mb-3">Starter</h3>
                  <div className="display-5 fw-bold text-dark mb-2">
                    $29<small className="fs-6 text-muted">/month</small>
                  </div>
                  <p className="text-muted mb-4">Perfect for new trainers getting started</p>
                  
                  <div className="bg-info bg-opacity-10 rounded-pill py-2 px-3 mb-4">
                    <strong className="text-info">Up to 15 trainees</strong>
                  </div>
                  
                  <ul className="list-unstyled text-start mb-4">
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Custom workout programs
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Progress tracking
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Basic messaging
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Payment processing
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Email support
                    </li>
                  </ul>
                  
                  <Link
                    to="/signup"
                    className="btn btn-outline-info btn-lg rounded-pill px-4 py-3 fw-semibold w-100"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="col-lg-4 col-md-6">
              <div className="card border-primary shadow-lg rounded-4 h-100 position-relative">
                <div className="badge bg-primary text-white px-3 py-2 rounded-pill position-absolute top-0 start-50 translate-middle">
                  Most Popular
                </div>
                <div className="card-body p-4 text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 mt-3" 
                       style={{width: '60px', height: '60px'}}>
                    <i className="bi bi-people text-primary fs-3"></i>
                  </div>
                  <h3 className="fw-bold mb-3">Professional</h3>
                  <div className="display-5 fw-bold text-primary mb-2">
                    $59<small className="fs-6 text-muted">/month</small>
                  </div>
                  <p className="text-muted mb-4">Ideal for growing coaching businesses</p>
                  
                  <div className="bg-primary bg-opacity-10 rounded-pill py-2 px-3 mb-4">
                    <strong className="text-primary">Up to 50 trainees</strong>
                  </div>
                  
                  <ul className="list-unstyled text-start mb-4">
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Everything in Starter
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Advanced analytics
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Video messaging
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Progress photos
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Priority support
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Custom branding
                    </li>
                  </ul>
                  
                  <Link
                    to="/signup"
                    className="btn btn-primary btn-lg rounded-pill px-4 py-3 fw-semibold w-100"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="col-lg-4 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-4 text-center">
                  <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '60px', height: '60px'}}>
                    <i className="bi bi-building text-warning fs-3"></i>
                  </div>
                  <h3 className="fw-bold mb-3">Enterprise</h3>
                  <div className="display-5 fw-bold text-dark mb-2">
                    $99<small className="fs-6 text-muted">/month</small>
                  </div>
                  <p className="text-muted mb-4">For established coaching businesses</p>
                  
                  <div className="bg-warning bg-opacity-10 rounded-pill py-2 px-3 mb-4">
                    <strong className="text-warning">Unlimited trainees</strong>
                  </div>
                  
                  <ul className="list-unstyled text-start mb-4">
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Everything in Professional
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Team collaboration tools
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      API access
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Advanced reporting
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      Dedicated support
                    </li>
                    <li className="d-flex align-items-center mb-2">
                      <i className="bi bi-check text-success me-2"></i>
                      White-label options
                    </li>
                  </ul>
                  
                  <Link
                    to="/signup"
                    className="btn btn-outline-warning btn-lg rounded-pill px-4 py-3 fw-semibold w-100"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-5">
            <p className="text-muted mb-3">
              <small>✨ All plans include 14-day free trial • No setup fees • Cancel anytime</small>
            </p>
            <p className="text-muted">
              <small>Need a custom solution? <a href="#" className="text-primary text-decoration-none">Contact our sales team</a></small>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MainPage;
