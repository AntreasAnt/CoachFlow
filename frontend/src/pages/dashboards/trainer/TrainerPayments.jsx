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
      currency: 'EUR'
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
        <div className="text-center py-5" style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
          <div className="spinner-border" style={{ color: '#10b981' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#fff' }}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-1 fw-bold" style={{ color: '#fff' }}>Payments & Earnings</h2>
          <p style={{ color: '#9ca3af' }}>Manage your earnings and payment settings</p>
        </div>

        {/* Stripe Connect Status */}
        {!stripeConnected && (
          <div className="alert border-0 shadow-sm mb-4" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h5 className="mb-2" style={{ color: '#fbbf24' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Connect Your Stripe Account
                </h5>
                <p className="mb-0" style={{ color: '#d1d5db' }}>
                  You need to connect your Stripe account to receive payments from clients and program sales.
                </p>
              </div>
              <button className="btn" style={{ backgroundColor: '#fbbf24', color: '#1a1a1a', border: 'none' }} onClick={handleConnectStripe}>
                <i className="bi bi-stripe me-2"></i>
                Connect Stripe
              </button>
            </div>
          </div>
        )}

        {/* Earnings Summary Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Total Earnings</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{formatCurrency(earnings.total)}</h3>
                  </div>
                  <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <i className="bi bi-currency-dollar fs-4" style={{ color: '#10b981' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>This Month</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{formatCurrency(earnings.thisMonth)}</h3>
                  </div>
                  <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <i className="bi bi-graph-up-arrow fs-4" style={{ color: '#10b981' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Available Balance</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{formatCurrency(earnings.available)}</h3>
                  </div>
                  <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                    <i className="bi bi-wallet2 fs-4" style={{ color: '#3b82f6' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-1 small" style={{ color: '#9ca3af' }}>Pending</p>
                    <h3 className="mb-0" style={{ color: '#fff' }}>{formatCurrency(earnings.pending)}</h3>
                  </div>
                  <div className="rounded-circle d-flex justify-content-center align-items-center" style={{ width: '48px', height: '48px', backgroundColor: 'rgba(251, 191, 36, 0.2)' }}>
                    <i className="bi bi-clock-history fs-4" style={{ color: '#fbbf24' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <style>
          {`
            .payment-tab {
              transition: all 0.3s ease;
              padding: 12px 20px;
              margin-right: 4px;
              border-radius: 8px 8px 0 0;
            }
            .payment-tab:hover {
              background-color: rgba(16, 185, 129, 0.1) !important;
              color: #10b981 !important;
            }
          `}
        </style>
        <ul className="nav nav-tabs mb-4" style={{ borderBottom: '2px solid rgba(16, 185, 129, 0.2)' }}>
          <li className="nav-item">
            <button
              className="payment-tab"
              onClick={() => setActiveTab('overview')}
              style={{
                color: activeTab === 'overview' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'overview' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'overview' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'overview' ? '600' : '400'
              }}
            >
              <i className="bi bi-bar-chart me-2"></i>
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className="payment-tab"
              onClick={() => setActiveTab('sales')}
              style={{
                color: activeTab === 'sales' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'sales' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'sales' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'sales' ? '600' : '400'
              }}
            >
              <i className="bi bi-cart-check me-2"></i>
              Sales History
            </button>
          </li>
          <li className="nav-item">
            <button
              className="payment-tab"
              onClick={() => setActiveTab('transactions')}
              style={{
                color: activeTab === 'transactions' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'transactions' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'transactions' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'transactions' ? '600' : '400'
              }}
            >
              <i className="bi bi-receipt me-2"></i>
              Transactions
            </button>
          </li>
          <li className="nav-item">
            <button
              className="payment-tab"
              onClick={() => setActiveTab('settings')}
              style={{
                color: activeTab === 'settings' ? '#fff' : '#9ca3af',
                backgroundColor: activeTab === 'settings' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'settings' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'settings' ? '600' : '400'
              }}
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
              <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Earnings Chart</h5>
                </div>
                <div className="card-body">
                  <div className="text-center py-5" style={{ color: '#9ca3af' }}>
                    <i className="bi bi-graph-up fs-1 mb-3 d-block" style={{ color: '#10b981' }}></i>
                    <p style={{ color: '#9ca3af' }}>Earnings chart will be displayed here</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Quick Stats</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span style={{ color: '#9ca3af' }}>Total Sales</span>
                      <strong style={{ color: '#fff' }}>{sales.length}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span style={{ color: '#9ca3af' }}>Avg. Sale Value</span>
                      <strong style={{ color: '#fff' }}>{formatCurrency(earnings.total / (sales.length || 1))}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ color: '#9ca3af' }}>Stripe Status</span>
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
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <h5 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Program Sales</h5>
            </div>
            <div className="card-body">
              {sales.length === 0 ? (
                <div className="text-center py-5" style={{ color: '#9ca3af' }}>
                  <i className="bi bi-cart-x fs-1 mb-3 d-block" style={{ color: '#6b7280' }}></i>
                  <p style={{ color: '#9ca3af' }}>No sales yet</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <style>
                    {`
                      .payment-table tbody tr {
                        transition: all 0.2s ease;
                      }
                      .payment-table tbody tr:hover {
                        background-color: rgba(16, 185, 129, 0.05);
                        transform: scale(1.01);
                      }
                    `}
                  </style>
                  <table className="table payment-table" style={{ color: '#fff', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Date</th>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Program</th>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Customer</th>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Amount</th>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale, index) => (
                        <tr key={index}>
                          <td style={{ color: '#fff', padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none', borderRadius: index === 0 ? '8px 0 0 8px' : '0' }}>{formatDate(sale.purchased_at)}</td>
                          <td style={{ color: '#fff', padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none' }}>{sale.program_title}</td>
                          <td style={{ color: '#fff', padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none' }}>{sale.trainee_name}</td>
                          <td style={{ color: '#fff', padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none' }}>{formatCurrency(sale.amount)}</td>
                          <td style={{ padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none', borderRadius: index === 0 ? '0 8px 8px 0' : '0' }}>
                            <span className="badge" style={{ backgroundColor: '#10b981', padding: '6px 12px' }}>COMPLETED</span>
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
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <h5 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Transaction History</h5>
            </div>
            <div className="card-body">
              {transactions.length === 0 ? (
                <div className="text-center py-5" style={{ color: '#9ca3af' }}>
                  <i className="bi bi-receipt fs-1 mb-3 d-block" style={{ color: '#6b7280' }}></i>
                  <p style={{ color: '#9ca3af' }}>No transactions yet</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <style>
                    {`
                      .payment-table tbody tr {
                        transition: all 0.2s ease;
                      }
                      .payment-table tbody tr:hover {
                        background-color: rgba(16, 185, 129, 0.05);
                        transform: scale(1.01);
                      }
                    `}
                  </style>
                  <table className="table payment-table" style={{ color: '#fff', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Date</th>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Type</th>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Description</th>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Amount</th>
                        <th style={{ color: '#9ca3af', backgroundColor: '#1a1a1a', padding: '12px', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', border: 'none' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <tr key={index}>
                          <td style={{ color: '#fff', padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none', borderRadius: index === 0 ? '8px 0 0 8px' : '0' }}>{formatDate(transaction.date)}</td>
                          <td style={{ padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none' }}>
                            <span className="badge" style={{ backgroundColor: '#3b82f6', padding: '6px 12px' }}>{transaction.type.toUpperCase()}</span>
                          </td>
                          <td style={{ color: '#fff', padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none' }}>{transaction.description}</td>
                          <td style={{ color: '#fff', padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none' }}>{formatCurrency(transaction.amount)}</td>
                          <td style={{ padding: '16px 12px', backgroundColor: '#1a1a1a', border: 'none', borderRadius: index === 0 ? '0 8px 8px 0' : '0' }}>
                            <span className="badge" style={{ backgroundColor: transaction.status === 'completed' ? '#10b981' : '#fbbf24', padding: '6px 12px' }}>
                              {transaction.status.toUpperCase()}
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
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: 'transparent', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <h5 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Payment Settings</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <h6 className="mb-3" style={{ color: '#fff' }}>Stripe Account</h6>
                  {stripeConnected ? (
                    <div className="alert" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }}>
                      <i className="bi bi-check-circle me-2"></i>
                      Your Stripe account is connected
                      {stripeAccountId && (
                        <div className="small mt-2" style={{ color: '#9ca3af' }}>
                          Account ID: {stripeAccountId}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button className="btn" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }} onClick={handleConnectStripe}>
                      <i className="bi bi-stripe me-2"></i>
                      Connect Stripe Account
                    </button>
                  )}
                </div>

                <div className="col-md-6 mb-4">
                  <h6 className="mb-3" style={{ color: '#fff' }}>Payout Schedule</h6>
                  <select 
                    className="form-select" 
                    style={{
                      backgroundColor: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <option style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Daily</option>
                    <option style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Weekly</option>
                    <option style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Monthly</option>
                  </select>
                  <small style={{ color: '#9ca3af' }}>Choose how often you receive payouts</small>
                </div>

                <div className="col-12">
                  <h6 className="mb-3" style={{ color: '#fff' }}>Payment Information</h6>
                  <p style={{ color: '#9ca3af' }}>
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
