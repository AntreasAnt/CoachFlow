import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';
import TraineeDashboard from '../../../components/TraineeDashboard';
import ProgramFilters from '../../../components/ProgramFilters';


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

    const { error, paymentIntent } = await stripe.confirmPayment({
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
      // Payment successful - pass payment intent ID to parent
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h5 className="mb-3 text-white">Complete Your Purchase</h5>
        <div className="alert" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <strong className="text-white">{programTitle}</strong>
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
          className="btn btn-outline-light"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </button>
      </div>

      <p className="text-white-50 small mt-3 text-center">
        <i className="bi bi-shield-check me-1"></i>
        Secure payment powered by Stripe
      </p>
    </form>
  );
};

const ProgramMarketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [programs, setPrograms] = useState([]);
  const [purchasedPrograms, setPurchasedPrograms] = useState([]);
  const [hiddenPrograms, setHiddenPrograms] = useState([]);
  const [allPurchasedIds, setAllPurchasedIds] = useState([]); // For marketplace exclusion
  const [purchasedLoaded, setPurchasedLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const programsPerPage = 12;
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    difficulty_level: '',
    min_duration: '',
    max_duration: '',
    min_price: '',
    max_price: '',
    trainer_name: '',
    sort_by: 'popular'
  });

  useEffect(() => {
    initializeStripe();
    fetchAllPurchasedIds();
    
    // Check if there's a programId in URL params to show details
    const programId = searchParams.get('programId');
    if (programId) {
      fetchProgramDetails(programId);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      if (purchasedLoaded) {
        fetchPrograms();
      }
    } else if (activeTab === 'purchased') {
      if (purchasedLoaded) {
        fetchPurchasedProgramsFiltered();
      }
    }
  }, [filters, currentPage, activeTab, purchasedLoaded]);

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

  const fetchProgramDetails = async (programId) => {
    try {
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPrograms.php?type=single&programId=${programId}`);
      if (data.success && data.program) {
        setSelectedProgram(data.program);
      }
    } catch (error) {
      console.error('Error fetching program details:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * programsPerPage;
      
      const queryParams = new URLSearchParams({
        type: 'marketplace',
        limit: programsPerPage,
        offset: offset,
        ...filters
      });

      // Remove empty filter values
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          queryParams.delete(key);
        }
      });

      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPrograms.php?${queryParams.toString()}`);
      
      if (data.success) {
        // Filter out programs that are already purchased
        const filteredPrograms = (data.programs || []).filter(
          program => !allPurchasedIds.includes(program.id)
        );
        
        setPrograms(filteredPrograms);
        setTotalPrograms(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / programsPerPage));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setLoading(false);
    }
  };

  const fetchAllPurchasedIds = async () => {
    try {
      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPurchasedPrograms.php`);
      if (data.success) {
        setAllPurchasedIds((data.purchases || []).map(p => p.program_id) || []);
      }
    } catch (error) {
      console.error('Error fetching all purchased ids:', error);
    } finally {
      setPurchasedLoaded(true);
    }
  };

  const fetchPurchasedProgramsFiltered = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * programsPerPage;
      
      const queryParams = new URLSearchParams({
        limit: programsPerPage,
        page: currentPage,
        ...filters
      });

      // Remove empty filter values
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          queryParams.delete(key);
        }
      });

      const data = await APIClient.get(`${BACKEND_ROUTES_API}GetPurchasedPrograms.php?${queryParams.toString()}`);
      
      console.log('Purchased programs response:', data);
      
      if (data.success) {
        console.log('Setting purchased programs:', data.purchases);
        setPurchasedPrograms(data.purchases || []);
        setHiddenPrograms(data.hiddenPurchases || []);
        setTotalPrograms(data.purchasesPagination?.total || 0);
        setTotalPages(data.purchasesPagination?.total_pages || 1);
      } else {
        console.error('Failed to fetch purchased programs:', data.message);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchased programs:', error);
      setLoading(false);
    }
  };

  const handleRestoreProgram = async (programId) => {
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}RestorePurchase.php`, {
        programId: programId
      });

      if (response.success) {
        await fetchAllPurchasedIds();
        await fetchPurchasedProgramsFiltered();
      } else {
        alert('Error: ' + (response.message || 'Failed to restore program'));
      }
    } catch (error) {
      console.error('Error restoring program:', error);
      alert('Failed to restore program');
    }
  };

  const handleBuyProgram = async (program) => {
    try {
      setSelectedProgram(program);
      
      // Create payment intent
      const response = await APIClient.post(`${BACKEND_ROUTES_API}CreatePaymentIntent.php`, {
        programId: program.id
      });

      console.log('Payment Intent Response:', response);

      if (response.success) {
        setClientSecret(response.clientSecret);
        setShowCheckout(true);
      } else {
        alert('Error: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initiate purchase: ' + (error.message || 'Please try again'));
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      console.log('Completing purchase with payment intent:', paymentIntentId);
      
      // Complete the purchase in our database
      const response = await APIClient.post(`${BACKEND_ROUTES_API}CompletePurchase.php`, {
        paymentIntentId: paymentIntentId
      });

      console.log('Complete Purchase Response:', response);

      if (response.success) {
        setShowCheckout(false);
        setClientSecret('');
        setPaymentIntentId('');
        setShowSuccessModal(true);
        await fetchAllPurchasedIds();
        await fetchPurchasedProgramsFiltered();
      } else {
        alert('Payment succeeded but failed to complete purchase: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error completing purchase:', error);
      alert('Payment succeeded but failed to complete purchase: ' + (error.message || 'Please contact support.'));
    }
  };

  const handlePaymentCancel = () => {
    setShowCheckout(false);
    setClientSecret('');
    setSelectedProgram(null);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSelectedProgram(null);
    setActiveTab('purchased'); // Switch to My Programs tab
  };


  const getRatingStars = (rating) => {
    const numRating = parseFloat(rating) || 0;
    if (numRating === 0) return <span className="text-white-50 small">No reviews</span>;
    const stars = [];
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars.push(<i key={`full-${i}`} className="bi bi-star-fill text-warning me-1"></i>);
    }
    if (hasHalfStar) {
        stars.push(<i key="half" className="bi bi-star-half text-warning me-1"></i>);
    }
    for (let i = stars.length; i < 5; i++) {
        stars.push(<i key={`empty-${i}`} className="bi bi-star text-white-50 me-1"></i>);
    }
    return (
        <span className="text-nowrap d-inline-flex align-items-center">
            {stars}
            <span className="text-white ms-1">({numRating.toFixed(1)})</span>
        </span>
    );
  };

  const renderProgramCard =  (program, isPurchased = false) => (
    <div key={program.id || program.program_id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
      <div className="card border-0 shadow-sm h-100 dark-card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h6 className="card-title mb-0 text-white">{program.title}</h6>
          </div>
          
          <p className="text-white-50 small" style={{ minHeight: '60px' }}>
            {program.description?.substring(0, 80)}...
          </p>
          
          <div className="mb-3">
            <span className="badge bg-secondary me-1 mb-1" style={{ fontSize: '0.7rem' }}>
              {program.difficulty_level}
            </span>
            <span className="badge bg-secondary me-1 mb-1" style={{ fontSize: '0.7rem' }}>
              {program.duration_weeks}w
            </span>
            <span className="badge bg-secondary mb-1" style={{ fontSize: '0.7rem' }}>
              {program.category}
            </span>
          </div>

          {!isPurchased && (
            <div className="mb-2">
              <small className="text-white-50 d-block">By {program.trainer_name || 'Coach'}</small>
              <div className="d-flex flex-column text-white-50 small mt-1 gap-1">
                <span>{program.purchase_count || 0} purchases</span>
                <div>{getRatingStars(program.rating_average)}</div>
              </div>
            </div>
          )}

          {isPurchased ? (
            <div>
              <small className="text-white-50 d-block mb-2">
                Purchased: {new Date(program.purchased_at).toLocaleDateString()}
              </small>
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={() => navigate(`/trainee-dashboard/program/${program.program_id}`)}
              >
                <i className="bi bi-play-circle me-2"></i>
                Start Program
              </button>
            </div>
          ) : (
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-bold text-success">${parseFloat(program.price).toFixed(2)}</span>
              <button 
                className="btn btn-success btn-sm"
                onClick={() => handleBuyProgram(program)}
              >
                <i className="bi bi-cart me-1"></i>
                Buy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCheckoutModal = () => (
    <div className={`modal fade ${showCheckout ? 'show d-block' : ''}`} 
         style={{ backgroundColor: showCheckout ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content dark-modal">
          <div className="modal-header dark-modal-header">
            <h5 className="modal-title text-white">Checkout</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={handlePaymentCancel}
            ></button>
          </div>
          <div className="modal-body">
            {!clientSecret || !stripePromise ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-white-50">Loading payment form...</p>
              </div>
            ) : (
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

  const renderSuccessModal = () => (
    <div className={`modal fade ${showSuccessModal ? 'show d-block' : ''}`} 
         style={{ backgroundColor: showSuccessModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content dark-modal">
          <div className="modal-body text-center p-5">
            <div className="mb-4">
              <div className="rounded-circle bg-success d-inline-flex align-items-center justify-content-center" 
                   style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-check-lg text-white" style={{ fontSize: '3rem' }}></i>
              </div>
            </div>
            <h3 className="mb-3 text-white">Purchase Successful!</h3>
            <p className="text-white-50 mb-4">
              Congratulations! You now have access to <strong className="text-white">{selectedProgram?.title}</strong>
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button 
                className="btn btn-primary"
                onClick={handleCloseSuccessModal}
              >
                <i className="bi bi-play-circle me-2"></i>
                View My Programs
              </button>
              <button 
                className="btn btn-outline-light"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSelectedProgram(null);
                }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TraineeDashboard>
      <div className="container-fluid p-4" style={{ paddingBottom: '100px' }}>
        {/* Tabs */}
        <ul className="nav nav-tabs mb-4 border-secondary">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'marketplace' ? 'active' : ''}`}
              onClick={() => setActiveTab('marketplace')}
            >
              <i className="bi bi-shop me-2"></i>
              Browse All
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'purchased' ? 'active' : ''}`}
              onClick={() => setActiveTab('purchased')}
            >
              <i className="bi bi-bag-check me-2"></i>
              My Programs
            </button>
          </li>
        </ul>

        <div className="row">
            {/* Filters Sidebar */}
            <div className="col-lg-3 mb-4">
              <ProgramFilters 
                filters={filters}
                onFilterChange={(newFilters) => {
                  setFilters(newFilters);
                  setCurrentPage(1); // Reset to page 1 when filters change
                }}
                onClearFilters={() => {
                  setFilters({
                    search: '',
                    category: '',
                    difficulty_level: '',
                    min_duration: '',
                    max_duration: '',
                    min_price: '',
                    max_price: '',
                    trainer_name: '',
                    sort_by: 'popular'
                  });
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Programs Grid */}
            <div className="col-lg-9">
            {activeTab === 'marketplace' && (
              <>
              {/* Results Summary */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <small className="text-muted">
                    Showing {programs.length > 0 ? ((currentPage - 1) * programsPerPage + 1) : 0} - {Math.min(currentPage * programsPerPage, totalPrograms)} of {totalPrograms} programs
                  </small>
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
                  <i className="bi bi-inbox text-white-50" style={{ fontSize: '3rem' }}></i>
                  <p className="text-white-50 mt-3">No programs available matching your filters.</p>
                  <button 
                    className="btn btn-outline-light"
                    onClick={() => {
                      setFilters({
                        search: '',
                        category: '',
                        difficulty_level: '',
                        min_duration: '',
                        max_duration: '',
                        min_price: '',
                        max_price: '',
                        trainer_name: '',
                        sort_by: 'popular'
                      });
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="row">
                    {programs.map(program => renderProgramCard(program, false))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav className="mt-4">
                      <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          // Show first page, last page, current page, and 2 pages around current
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                          ) {
                            return (
                              <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                <button 
                                  className="page-link"
                                  onClick={() => setCurrentPage(pageNum)}
                                >
                                  {pageNum}
                                </button>
                              </li>
                            );
                          } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                            return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                          }
                          return null;
                        })}

                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </>
              )}
            </>
          )}

        {activeTab === 'purchased' && (
              loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : purchasedPrograms.length === 0 && hiddenPrograms.length === 0 && currentPage === 1 && !Object.values(filters).some(x => x !== '' && x !== 'popular') ? (
              <div className="text-center py-5">
                <i className="bi bi-bag-x text-white-50" style={{ fontSize: '3rem' }}></i>
                <p className="text-white-50 mt-3">
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
              <>
                {purchasedPrograms.length > 0 ? (
                  <div className="row">
                    {purchasedPrograms.map(program => renderProgramCard(program, true))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox text-white-50" style={{ fontSize: '3rem' }}></i>
                    <p className="text-white-50 mt-3">No purchased programs matching your filters.</p>
                  </div>
                )}

                {totalPages > 1 && (
                  <nav className="mt-4">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link bg-dark text-white border-secondary" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                          &laquo;
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                          <button 
                            className={`page-link ${currentPage === i + 1 ? 'bg-success border-success text-white' : 'bg-dark text-white border-secondary'}`}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link bg-dark text-white border-secondary" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}

                {hiddenPrograms.length > 0 && (
                  <div className="mt-5">
                    <h5 className="mb-3 text-white">
                      <i className="bi bi-archive me-2"></i>
                      Hidden Programs ({hiddenPrograms.length})
                    </h5>
                    <div className="row">
                      {hiddenPrograms.map(program => (
                        <div key={program.program_id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                          <div className="card border-0 shadow-sm h-100 dark-card" style={{ opacity: 0.7 }}>
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <h6 className="card-title mb-0 text-white">{program.title}</h6>
                              </div>
                              
                              <p className="text-white-50 small" style={{ minHeight: '60px' }}>
                                {program.description?.substring(0, 80)}...
                              </p>
                              
                              <div className="mb-3">
                                <span className="badge bg-secondary me-1 mb-1" style={{ fontSize: '0.7rem' }}>
                                  {program.difficulty_level}
                                </span>
                                <span className="badge bg-secondary me-1 mb-1" style={{ fontSize: '0.7rem' }}>
                                  {program.duration_weeks}w
                                </span>
                                <span className="badge bg-secondary mb-1" style={{ fontSize: '0.7rem' }}>
                                  {program.category}
                                </span>
                              </div>

                              <button 
                                className="btn btn-success btn-sm w-100"
                                onClick={() => handleRestoreProgram(program.program_id)}
                              >
                                <i className="bi bi-arrow-counterclockwise me-1"></i>
                                Restore
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          )}
          </div>
        </div>

        {renderCheckoutModal()}
        {renderSuccessModal()}
      </div>
    </TraineeDashboard>
  );
};

export default ProgramMarketplace;
