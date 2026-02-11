import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_ROUTES_API } from "../config/config";

// Import dashboard components
import AdminDashboard from "./dashboards/AdminDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import TrainerDashboard from "./dashboards/TrainerDashboard";
import TraineeDashboard from "./dashboards/trainee/Dashboard";

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
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: 'var(--brand-dark)' }}>
        <div className="text-center">
          <div className="spinner-border" role="status" style={{color: 'var(--brand-primary)', width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{color: 'var(--brand-primary)', fontSize: '1.2rem', fontWeight: '600'}}>Loading CoachFlow...</p>
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
    <div style={{backgroundColor: 'var(--brand-dark)', minHeight: '100vh'}}>
      {/* Hero Section */}
      <section className="hero py-5" style={{background: 'linear-gradient(135deg, #000502 0%, #0A0D0A 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center'}}>
        <div className="container text-center">
          <span className="badge px-4 py-3 mb-4 d-inline-block" style={{backgroundColor: 'rgba(32, 214, 87, 0.15)', color: 'var(--brand-primary)', fontSize: '1.1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '50px', border: '2px solid rgba(32, 214, 87, 0.3)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(32, 214, 87, 0.2)'}}>
            100% Free to Start
          </span>
          <h1 className="display-2 fw-bold mt-3" style={{color: 'var(--brand-white)', lineHeight: '1.2'}}>
            Train Smarter.<br/>
            <span style={{color: 'var(--brand-primary)', textShadow: '0 0 40px rgba(32, 214, 87, 0.7)'}}>Achieve More.</span>
          </h1>
          <p className="lead fs-3 mb-5 mt-4 mx-auto" style={{color: 'var(--text-secondary)', maxWidth: '850px', fontWeight: '400'}}>
            Train solo with powerful FREE tools, or connect with elite trainers.<br/>
            Build custom programs, track progress, and achieve your goals. All in one place.
          </p>
          
          <div className="row justify-content-center mb-5">
            <div className="col-md-4">
              <div className="p-3" style={{backgroundColor: 'rgba(32, 214, 87, 0.1)', borderRadius: '12px', border: '1px solid var(--brand-primary)'}}>
                <div className="display-6 fw-bold" style={{color: 'var(--brand-primary)'}}>100% FREE</div>
                <p className="mb-0 mt-2" style={{color: 'var(--text-primary)'}}>Create Programs</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3" style={{backgroundColor: 'rgba(32, 214, 87, 0.1)', borderRadius: '12px', border: '1px solid var(--brand-primary)'}}>
                <div className="display-6 fw-bold" style={{color: 'var(--brand-primary)'}}>100% FREE</div>
                <p className="mb-0 mt-2" style={{color: 'var(--text-primary)'}}>Log Workouts & Food</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3" style={{backgroundColor: 'rgba(32, 214, 87, 0.1)', borderRadius: '12px', border: '1px solid var(--brand-primary)'}}>
                <div className="display-6 fw-bold" style={{color: 'var(--brand-primary)'}}>100% FREE</div>
                <p className="mb-0 mt-2" style={{color: 'var(--text-primary)'}}>Track Analytics</p>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-4 mt-5">
            <Link
              to="/signup"
              className="btn btn-lg rounded-pill px-5 py-3 fw-bold"
              style={{backgroundColor: 'var(--brand-primary)', color: 'var(--brand-dark)', border: 'none', boxShadow: '0 8px 32px rgba(32, 214, 87, 0.4)', transition: 'all 0.3s', fontSize: '1.2rem'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(32, 214, 87, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(32, 214, 87, 0.4)';
              }}
            >
              <i className="bi bi-rocket-takeoff me-2"></i>
              Start Training Free
            </Link>
            <Link
              to="/login"
              className="btn btn-lg rounded-pill px-5 py-3 fw-semibold"
              style={{backgroundColor: 'transparent', color: 'var(--brand-white)', border: '2px solid var(--brand-primary)', fontSize: '1.2rem', transition: 'all 0.3s'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(32, 214, 87, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Sign In
            </Link>
          </div>
          <p className="mt-4" style={{color: 'var(--brand-light)', fontSize: '1rem'}}>
            <strong>✨ No credit card • No hidden fees • Cancel anytime</strong>
          </p>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-5" style={{backgroundColor: 'var(--bg-secondary)'}}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-4 fw-bold mb-4" style={{color: 'var(--brand-white)'}}>
              Why Choose <span style={{color: 'var(--brand-primary)'}}>CoachFlow</span>?
            </h2>
            <p className="lead fs-4" style={{color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto'}}>
              Whether you're crushing goals solo or seeking expert guidance, we've got everything you need—completely free.
            </p>
          </div>

          <div className="row g-4 mt-5">
            <div className="col-lg-6">
              <div className="card h-100 rounded-4 p-5" style={{backgroundColor: 'var(--bg-card)', border: '2px solid var(--brand-primary)', boxShadow: 'var(--shadow-xl)'}}>
                <div className="text-center mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '100px', height: '100px', backgroundColor: 'rgba(32, 214, 87, 0.2)', border: '3px solid var(--brand-primary)'}}>
                    <i className="bi bi-person-arms-up" style={{fontSize: '3rem', color: 'var(--brand-primary)'}}></i>
                  </div>
                  <h3 className="fw-bold mb-3" style={{color: 'var(--brand-white)', fontSize: '2rem'}}>For Athletes & Trainees</h3>
                  <p className="lead" style={{color: 'var(--text-secondary)'}}>Train smarter, not harder—with tools that actually work.</p>
                </div>
                <ul className="list-unstyled" style={{fontSize: '1.1rem'}}>
                  <li className="d-flex align-items-start mb-3">
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{color: 'var(--brand-primary)', fontSize: '1.5rem'}}></i>
                    <div>
                      <strong style={{color: 'var(--brand-white)'}}>Build Custom Workout Programs</strong>
                      <p className="mb-0 mt-1" style={{color: 'var(--text-secondary)'}}>Design programs that fit YOUR schedule and goals</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start mb-3">
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{color: 'var(--brand-primary)', fontSize: '1.5rem'}}></i>
                    <div>
                      <strong style={{color: 'var(--brand-white)'}}>Log Every Rep, Every Meal</strong>
                      <p className="mb-0 mt-1" style={{color: 'var(--text-secondary)'}}>Track workouts, nutrition, and progress photos effortlessly</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start mb-3">
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{color: 'var(--brand-primary)', fontSize: '1.5rem'}}></i>
                    <div>
                      <strong style={{color: 'var(--brand-white)'}}>Unlock Advanced Analytics</strong>
                      <p className="mb-0 mt-1" style={{color: 'var(--text-secondary)'}}>See your strength gains, volume trends, and performance stats</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start mb-3">
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{color: 'var(--brand-primary)', fontSize: '1.5rem'}}></i>
                    <div>
                      <strong style={{color: 'var(--brand-white)'}}>Hire Expert Trainers</strong>
                      <p className="mb-0 mt-1" style={{color: 'var(--text-secondary)'}}>Browse elite coaches, buy programs, or get 1-on-1 coaching</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-4 text-center">
                  <Link to="/signup" className="btn btn-lg rounded-pill px-5 py-3 fw-bold" 
                        style={{backgroundColor: 'var(--brand-primary)', color: 'var(--brand-dark)', border: 'none', width: '100%'}}>
                    Start Training Free <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card h-100 rounded-4 p-5" style={{backgroundColor: 'var(--bg-card)', border: '2px solid var(--brand-light)', boxShadow: 'var(--shadow-xl)'}}>
                <div className="text-center mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{width: '100px', height: '100px', backgroundColor: 'rgba(227, 255, 236, 0.2)', border: '3px solid var(--brand-light)'}}>
                    <i className="bi bi-award" style={{fontSize: '3rem', color: 'var(--brand-light)'}}></i>
                  </div>
                  <h3 className="fw-bold mb-3" style={{color: 'var(--brand-white)', fontSize: '2rem'}}>For Trainers & Coaches</h3>
                  <p className="lead" style={{color: 'var(--text-secondary)'}}>Turn your expertise into income—effortlessly.</p>
                </div>
                <ul className="list-unstyled" style={{fontSize: '1.1rem'}}>
                  <li className="d-flex align-items-start mb-3">
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{color: 'var(--brand-light)', fontSize: '1.5rem'}}></i>
                    <div>
                      <strong style={{color: 'var(--brand-white)'}}>Sell Your Programs</strong>
                      <p className="mb-0 mt-1" style={{color: 'var(--text-secondary)'}}>Create once, sell unlimited times—earn passive income</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start mb-3">
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{color: 'var(--brand-light)', fontSize: '1.5rem'}}></i>
                    <div>
                      <strong style={{color: 'var(--brand-white)'}}>Manage Clients Seamlessly</strong>
                      <p className="mb-0 mt-1" style={{color: 'var(--text-secondary)'}}>Track client progress, send messages, and adjust programs in real-time</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start mb-3">
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{color: 'var(--brand-light)', fontSize: '1.5rem'}}></i>
                    <div>
                      <strong style={{color: 'var(--brand-white)'}}>Get Paid Automatically</strong>
                      <p className="mb-0 mt-1" style={{color: 'var(--text-secondary)'}}>Secure payments, subscription billing, and instant payouts</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start mb-3">
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{color: 'var(--brand-light)', fontSize: '1.5rem'}}></i>
                    <div>
                      <strong style={{color: 'var(--brand-white)'}}>Built-in Marketing</strong>
                      <p className="mb-0 mt-1" style={{color: 'var(--text-secondary)'}}>Get discovered by thousands of motivated athletes</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-4 text-center">
                  <Link to="/signup" className="btn btn-lg rounded-pill px-5 py-3 fw-bold" 
                        style={{backgroundColor: 'var(--brand-light)', color: 'var(--brand-dark)', border: 'none', width: '100%'}}>
                    Start Coaching <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-5" style={{backgroundColor: 'var(--brand-dark)', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-4 fw-bold mb-4" style={{color: 'var(--brand-white)'}}>
              Getting Started Is <span style={{color: 'var(--brand-primary)'}}>Ridiculously Easy</span>
            </h2>
            <p className="lead fs-4" style={{color: 'var(--text-secondary)'}}>
              From zero to hero in 3 simple steps
            </p>
          </div>

          <div className="row g-5 mt-4">
            <div className="col-md-4">
              <div className="text-center">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
                     style={{width: '120px', height: '120px', backgroundColor: 'rgba(32, 214, 87, 0.15)', border: '3px solid var(--brand-primary)'}}>
                  <span className="display-3 fw-bold" style={{color: 'var(--brand-primary)'}}>1</span>
                </div>
                <h3 className="fw-bold mb-3" style={{color: 'var(--brand-white)', fontSize: '1.8rem'}}>Sign Up Free</h3>
                <p className="fs-5" style={{color: 'var(--text-secondary)'}}>
                  Create your account in 30 seconds. No payment info required—ever.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
                     style={{width: '120px', height: '120px', backgroundColor: 'rgba(32, 214, 87, 0.15)', border: '3px solid var(--brand-primary)'}}>
                  <span className="display-3 fw-bold" style={{color: 'var(--brand-primary)'}}>2</span>
                </div>
                <h3 className="fw-bold mb-3" style={{color: 'var(--brand-white)', fontSize: '1.8rem'}}>Create or Connect</h3>
                <p className="fs-5" style={{color: 'var(--text-secondary)'}}>
                  Build your own programs OR browse expert trainers to hire.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
                     style={{width: '120px', height: '120px', backgroundColor: 'rgba(32, 214, 87, 0.15)', border: '3px solid var(--brand-primary)'}}>
                  <span className="display-3 fw-bold" style={{color: 'var(--brand-primary)'}}>3</span>
                </div>
                <h3 className="fw-bold mb-3" style={{color: 'var(--brand-white)', fontSize: '1.8rem'}}>Start Winning</h3>
                <p className="fs-5" style={{color: 'var(--text-secondary)'}}>
                  Log workouts, track progress, smash goals. All your data, forever free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-5" style={{background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div className="container text-center">
          <h2 className="display-4 fw-bold mb-5" style={{color: 'var(--brand-white)'}}>
            Join Thousands Already <span style={{color: 'var(--brand-primary)'}}>Crushing Their Goals</span>
          </h2>
          
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="p-4 rounded-4" style={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--brand-primary)'}}>
                <div className="display-3 fw-bold mb-2" style={{color: 'var(--brand-primary)', textShadow: '0 0 20px rgba(32, 214, 87, 0.5)'}}>5,000+</div>
                <div className="fs-5" style={{color: 'var(--text-secondary)'}}>Active Users</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4 rounded-4" style={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--brand-primary)'}}>
                <div className="display-3 fw-bold mb-2" style={{color: 'var(--brand-primary)', textShadow: '0 0 20px rgba(32, 214, 87, 0.5)'}}>50k+</div>
                <div className="fs-5" style={{color: 'var(--text-secondary)'}}>Workouts Logged</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4 rounded-4" style={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--brand-primary)'}}>
                <div className="display-3 fw-bold mb-2" style={{color: 'var(--brand-primary)', textShadow: '0 0 20px rgba(32, 214, 87, 0.5)'}}>500+</div>
                <div className="fs-5" style={{color: 'var(--text-secondary)'}}>Expert Trainers</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4 rounded-4" style={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--brand-primary)'}}>
                <div className="display-3 fw-bold mb-2" style={{color: 'var(--brand-primary)', textShadow: '0 0 20px rgba(32, 214, 87, 0.5)'}}>$1M+</div>
                <div className="fs-5" style={{color: 'var(--text-secondary)'}}>Paid to Trainers</div>
              </div>
            </div>
          </div>

          <div className="row justify-content-center mt-5">
            <div className="col-lg-8">
              <div className="card rounded-4 p-5" style={{backgroundColor: 'var(--bg-card)', border: '2px solid var(--brand-primary)', boxShadow: 'var(--shadow-xl)'}}>
                <div className="mb-4">
                  <i className="bi bi-star-fill" style={{color: '#FFD700', fontSize: '2rem'}}></i>
                  <i className="bi bi-star-fill mx-1" style={{color: '#FFD700', fontSize: '2rem'}}></i>
                  <i className="bi bi-star-fill" style={{color: '#FFD700', fontSize: '2rem'}}></i>
                  <i className="bi bi-star-fill mx-1" style={{color: '#FFD700', fontSize: '2rem'}}></i>
                  <i className="bi bi-star-fill" style={{color: '#FFD700', fontSize: '2rem'}}></i>
                </div>
                <blockquote className="mb-0">
                  <p className="lead fs-3 mb-4" style={{color: 'var(--brand-white)', fontStyle: 'italic'}}>
                    "I was paying $300/month for scattered apps. CoachFlow gave me everything FREE, then I found the perfect trainer for $50/month. Game changer!"
                  </p>
                  <footer className="blockquote-footer fs-5" style={{color: 'var(--text-secondary)'}}>
                    <strong style={{color: 'var(--brand-light)'}}>Marcus Rivera</strong>, Competitive Powerlifter
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-5" style={{backgroundColor: 'var(--brand-dark)', paddingTop: '6rem', paddingBottom: '6rem'}}>
        <div className="container text-center">
          <h2 className="display-3 fw-bold mb-4" style={{color: 'var(--brand-white)'}}>
            Ready to Transform Your Fitness?
          </h2>
          <p className="lead fs-3 mb-5" style={{color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto'}}>
            Stop wasting money on apps you don't need. Start for FREE today.
          </p>
          <Link
            to="/signup"
            className="btn btn-lg rounded-pill px-5 py-4 fw-bold"
            style={{backgroundColor: 'var(--brand-primary)', color: 'var(--brand-dark)', border: 'none', boxShadow: '0 12px 40px rgba(32, 214, 87, 0.5)', transition: 'all 0.3s', fontSize: '1.5rem'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 16px 50px rgba(32, 214, 87, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(32, 214, 87, 0.5)';
            }}
          >
            <i className="bi bi-rocket-takeoff me-3"></i>
            Join Free—No Credit Card Needed
          </Link>
          <p className="mt-4" style={{color: 'var(--brand-light)', fontSize: '1.2rem'}}>
            <strong>Join 5,000+ athletes already training smarter</strong>
          </p>
        </div>
      </section>
    </div>
  );
}

export default MainPage;
