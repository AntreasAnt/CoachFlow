import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

// Initialize Stripe (will be set after fetching publishable key)
let stripePromise = null;

const CheckoutForm = ({ clientSecret, onSuccess, onCancel, programTitle, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/trainee-dashboard/my-programs?payment=success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setMessage(error.message);
      setIsProcessing(false);
    } else {
      // Payment successful
      setMessage('Payment successful! Redirecting...');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h5 className="mb-3">Complete Your Purchase</h5>
        <div className="alert alert-info">
          <strong>{programTitle}</strong>
          <br />
          <span className="h4 text-success">${amount}</span>
        </div>
      </div>

      <PaymentElement />

      {message && (
        <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-danger'} mt-3`}>
          {message}
        </div>
      )}

      <div className="d-flex gap-2 mt-4">
        <button 
          type="submit" 
          className="btn btn-success flex-fill"
          disabled={isProcessing || !stripe || !elements}
        >
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            <>
              <i className="bi bi-lock-fill me-2"></i>
              Pay ${amount}
            </>
          )}
        </button>
        <button 
          type="button" 
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </button>
      </div>

      <p className="text-muted small mt-3 text-center">
        <i className="bi bi-shield-check me-1"></i>
        Secure payment powered by Stripe
      </p>
    </form>
  );
};

const ProgramMarketplace = () => {
  const [programs, setPrograms] = useState([]);
  const [purchasedPrograms, setPurchasedPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace'); // marketplace, purchased
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    difficulty_level: '',
    sort_by: 'popular'
  });

  const categories = ['Strength', 'Cardio', 'Hybrid', 'Weight Loss', 'Muscle Building', 'Endurance', 'Flexibility', 'General Fitness'];

  useEffect(() => {
    initializeStripe();
    fetchPrograms();
    fetchPurchasedPrograms();
  }, []);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      fetchPrograms();
    }
  }, [filters]);

  const initializeStripe = async () => {
    try {
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetStripePublishableKey.php`);
      if (response.success && response.publishableKey) {
        stripePromise = loadStripe(response.publishableKey);
      }
    } catch (error) {
      console.error('Error initializing Stripe:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        type: 'marketplace',
        ...filters
      }).toString();

      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPrograms.php?${queryParams}`);
      
      if (data.success) {
        setPrograms(data.programs || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setLoading(false);
    }
  };

  const fetchPurchasedPrograms = async () => {
    try {
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPurchasedPrograms.php`);
      
      if (data.success) {
        setPurchasedPrograms(data.purchases || []);
      }
    } catch (error) {
      console.error('Error fetching purchased programs:', error);
    }
  };

  const handleBuyProgram = async (program) => {
    try {
      setSelectedProgram(program);
      
      // Create payment intent
      const response = await APIClient.post(`${BACKEND_ROUTES_API}CreatePaymentIntent.php`, {
        programId: program.id
      });

      if (response.success) {
        setClientSecret(response.clientSecret);
        setShowCheckout(true);
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initiate purchase');
    }
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    setClientSecret('');
    setSelectedProgram(null);
    alert('Purchase successful! You can now access this program in "My Programs" tab.');
    fetchPurchasedPrograms();
  };

  const handlePaymentCancel = () => {
    setShowCheckout(false);
    setClientSecret('');
    setSelectedProgram(null);
  };

  const renderProgramCard = (program, isPurchased = false) => (
    <div key={program.id || program.program_id} className="col-lg-4 col-md-6 mb-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h5 className="card-title mb-0">{program.title}</h5>
            {!isPurchased && (
              <span className="badge bg-success">${parseFloat(program.price).toFixed(2)}</span>
            )}
          </div>
          
          <p className="text-muted small">{program.description}</p>
          
          <div className="mb-3">
            <span className="badge bg-light text-dark me-2">
              <i className="bi bi-bar-chart me-1"></i>
              {program.difficulty_level}
            </span>
            <span className="badge bg-light text-dark me-2">
              <i className="bi bi-calendar me-1"></i>
              {program.duration_weeks} weeks
            </span>
            <span className="badge bg-light text-dark">
              <i className="bi bi-tag me-1"></i>
              {program.category}
            </span>
          </div>

          {!isPurchased && (
            <div className="mb-3">
              <small className="text-muted">
                By {program.trainer_first_name} {program.trainer_last_name}
              </small>
              <br />
              <small className="text-muted">
                {program.purchase_count || 0} purchases • 
                {program.rating_average > 0 ? (
                  <span className="ms-1">
                    <i className="bi bi-star-fill text-warning"></i> {program.rating_average}
                  </span>
                ) : (
                  <span className="ms-1">No ratings yet</span>
                )}
              </small>
            </div>
          )}

          {isPurchased ? (
            <div>
              <small className="text-muted d-block mb-2">
                Purchased: {new Date(program.purchased_at).toLocaleDateString()}
              </small>
              <button className="btn btn-primary w-100">
                <i className="bi bi-play-circle me-2"></i>
                Start Program
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-success w-100"
              onClick={() => handleBuyProgram(program)}
            >
              <i className="bi bi-cart me-2"></i>
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderCheckoutModal = () => (
    <div className={`modal fade ${showCheckout ? 'show d-block' : ''}`} 
         style={{ backgroundColor: showCheckout ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Checkout</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handlePaymentCancel}
            ></button>
          </div>
          <div className="modal-body">
            {clientSecret && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm 
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                  programTitle={selectedProgram?.title}
                  amount={parseFloat(selectedProgram?.price).toFixed(2)}
                />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Program Marketplace</h4>
        
        <ul className="nav nav-pills">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'marketplace' ? 'active' : ''}`}
              onClick={() => setActiveTab('marketplace')}
            >
              <i className="bi bi-shop me-2"></i>
              Marketplace
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'purchased' ? 'active' : ''}`}
              onClick={() => setActiveTab('purchased')}
            >
              <i className="bi bi-bag-check me-2"></i>
              My Programs ({purchasedPrograms.length})
            </button>
          </li>
        </ul>
      </div>

      {activeTab === 'marketplace' && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-3 mb-3 mb-md-0">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 mb-3 mb-md-0">
                  <label className="form-label">Difficulty</label>
                  <select 
                    className="form-select"
                    value={filters.difficulty_level}
                    onChange={(e) => setFilters(prev => ({ ...prev, difficulty_level: e.target.value }))}
                  >
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="col-md-3 mb-3 mb-md-0">
                  <label className="form-label">Sort By</label>
                  <select 
                    className="form-select"
                    value={filters.sort_by}
                    onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
                  >
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setFilters({ category: '', difficulty_level: '', sort_by: 'popular' })}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">No programs available matching your filters.</p>
            </div>
          ) : (
            <div className="row">
              {programs.map(program => renderProgramCard(program, false))}
            </div>
          )}
        </>
      )}

      {activeTab === 'purchased' && (
        <>
          {purchasedPrograms.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bag-x text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">
                You haven't purchased any programs yet.
                <br />
                Browse the marketplace to find the perfect program for you!
              </p>
              <button 
                className="btn btn-primary mt-3"
                onClick={() => setActiveTab('marketplace')}
              >
                <i className="bi bi-shop me-2"></i>
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="row">
              {purchasedPrograms.map(program => renderProgramCard(program, true))}
            </div>
          )}
        </>
      )}

      {renderCheckoutModal()}
    </div>
  );
};

export default ProgramMarketplace;
