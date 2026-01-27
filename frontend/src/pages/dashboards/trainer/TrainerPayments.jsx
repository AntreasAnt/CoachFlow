import React, { useState, useEffect } from 'react';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const TrainerPayments = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    available: 0,
    thisMonth: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [sales, setSales] = useState([]);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState(null);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch earnings summary
      const earningsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerEarnings.php`);
      if (earningsResponse.success) {
        setEarnings(earningsResponse.earnings);
        setStripeConnected(earningsResponse.stripeConnected);
        setStripeAccountId(earningsResponse.stripeAccountId);
      }

      // Fetch transaction history
      const transactionsResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerTransactions.php`);
      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.transactions || []);
      }

      // Fetch sales/purchases
      const salesResponse = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerSales.php`);
      if (salesResponse.success) {
        setSales(salesResponse.sales || []);
      }

    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const response = await APIClient.post(`${BACKEND_ROUTES_API}CreateStripeConnectAccount.php`, {});
      
      if (response.success && response.accountLinkUrl) {
        // Redirect to Stripe Connect onboarding
        window.location.href = response.accountLinkUrl;
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      alert('Failed to connect Stripe account. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <TrainerDashboardLayout>
        <div className="container-fluid p-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div className="container p-4" style={{ minHeight: 'calc(100vh - 0px)' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-1">Payments & Earnings</h2>
          <p className="text-muted">Manage your earnings and payment settings</p>
        </div>

        {/* Stripe Connect Status */}
        {!stripeConnected && (
          <div className="alert alert-warning border-0 shadow-sm mb-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h5 className="alert-heading mb-2">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Connect Your Stripe Account
                </h5>
                <p className="mb-0">
                  You need to connect your Stripe account to receive payments from clients and program sales.
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleConnectStripe}>
                <i className="bi bi-stripe me-2"></i>
                Connect Stripe
              </button>
            </div>
          </div>
        )}

        {/* Earnings Summary Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Total Earnings</p>
                    <h3 className="mb-0">{formatCurrency(earnings.total)}</h3>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-currency-dollar text-primary fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">This Month</p>
                    <h3 className="mb-0">{formatCurrency(earnings.thisMonth)}</h3>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-graph-up-arrow text-success fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Available Balance</p>
                    <h3 className="mb-0">{formatCurrency(earnings.available)}</h3>
                  </div>
                  <div className="bg-info bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-wallet2 text-info fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Pending</p>
                    <h3 className="mb-0">{formatCurrency(earnings.pending)}</h3>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-clock-history text-warning fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-bar-chart me-2"></i>
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              <i className="bi bi-cart-check me-2"></i>
              Sales History
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <i className="bi bi-receipt me-2"></i>
              Transactions
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <i className="bi bi-gear me-2"></i>
              Settings
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="row">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0">Earnings Chart</h5>
                </div>
                <div className="card-body">
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-graph-up fs-1 mb-3 d-block"></i>
                    <p>Earnings chart will be displayed here</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0">Quick Stats</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Total Sales</span>
                      <strong>{sales.length}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Avg. Sale Value</span>
                      <strong>{formatCurrency(earnings.total / (sales.length || 1))}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Stripe Status</span>
                      <span className={`badge ${stripeConnected ? 'bg-success' : 'bg-warning'}`}>
                        {stripeConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">Program Sales</h5>
            </div>
            <div className="card-body">
              {sales.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-cart-x fs-1 mb-3 d-block"></i>
                  <p>No sales yet</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Program</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale, index) => (
                        <tr key={index}>
                          <td>{formatDate(sale.purchased_at)}</td>
                          <td>{sale.program_title}</td>
                          <td>{sale.trainee_name}</td>
                          <td>{formatCurrency(sale.amount)}</td>
                          <td>
                            <span className="badge bg-success">Completed</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">Transaction History</h5>
            </div>
            <div className="card-body">
              {transactions.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-receipt fs-1 mb-3 d-block"></i>
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <tr key={index}>
                          <td>{formatDate(transaction.date)}</td>
                          <td>
                            <span className="badge bg-info">{transaction.type}</span>
                          </td>
                          <td>{transaction.description}</td>
                          <td>{formatCurrency(transaction.amount)}</td>
                          <td>
                            <span className={`badge ${transaction.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">Payment Settings</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <h6 className="mb-3">Stripe Account</h6>
                  {stripeConnected ? (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle me-2"></i>
                      Your Stripe account is connected
                      {stripeAccountId && (
                        <div className="small mt-2">
                          Account ID: {stripeAccountId}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button className="btn btn-primary" onClick={handleConnectStripe}>
                      <i className="bi bi-stripe me-2"></i>
                      Connect Stripe Account
                    </button>
                  )}
                </div>

                <div className="col-md-6 mb-4">
                  <h6 className="mb-3">Payout Schedule</h6>
                  <select className="form-select" disabled={!stripeConnected}>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                  <small className="text-muted">Choose how often you receive payouts</small>
                </div>

                <div className="col-12">
                  <h6 className="mb-3">Payment Information</h6>
                  <p className="text-muted">
                    Payments are processed through Stripe. You'll receive earnings directly to your connected bank account
                    according to your payout schedule. Platform fee: 10% + Stripe fees (2.9% + $0.30).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerPayments;
