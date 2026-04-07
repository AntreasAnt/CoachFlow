import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '../../../components/AdminDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import { DataGrid } from '@mui/x-data-grid';

const EmailMarketing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  
  // New Campaign Form
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    fromName: '',
    replyTo: '',
    audience: '',
    content: '',
    template: 'blank'
  });
  
  // View/Edit Campaign
  const [showViewCampaignModal, setShowViewCampaignModal] = useState(false);
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [editCampaignForm, setEditCampaignForm] = useState({
    id: '',
    subject: '',
    fromName: '',
    replyTo: '',
    content: ''
  });
  
  // Add Subscriber Form
  const [showAddSubscriberModal, setShowAddSubscriberModal] = useState(false);
  const [subscriberForm, setSubscriberForm] = useState({
    userId: '',
    audienceId: ''
  });

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const [selectedUserForSubscriber, setSelectedUserForSubscriber] = useState(null);
  
  // Create Audience Form
  const [showCreateAudienceModal, setShowCreateAudienceModal] = useState(false);
  const [audienceForm, setAudienceForm] = useState({
    name: '',
    fromName: '',
    fromEmail: '',
    companyName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  });
  
  // Campaign Filters and Pagination
  const [campaignFilter, setCampaignFilter] = useState('all'); // all, save, sent
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignsPerPage] = useState(12);
  
  // Email Templates
  const emailTemplates = [
    {
      id: 'blank',
      name: 'Blank Template',
      preview: 'Start from scratch',
      html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <p>Your content here...</p>\n</div>'
    },
    {
      id: 'welcome',
      name: 'Welcome Email',
      preview: 'Welcome new subscribers',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 32px;">Welcome! 🎉</h1>
  </div>
  <div style="padding: 40px 30px;">
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">Hi there,</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">Thank you for joining our community! We're excited to have you on board.</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">Here's what you can expect from us:</p>
    <ul style="font-size: 16px; line-height: 1.8; color: #333333;">
      <li>Regular updates and tips</li>
      <li>Exclusive offers and content</li>
      <li>Community support</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #10b981; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Get Started</a>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 30px;">Best regards,<br>The Team</p>
  </div>
  <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
    <p>© 2026 CoachFlow. All rights reserved.</p>
  </div>
</div>`
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      preview: 'Regular updates and news',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="padding: 20px; text-align: center; border-bottom: 3px solid #10b981;">
    <h2 style="color: #1a1a1a; margin: 0;">Monthly Newsletter</h2>
    <p style="color: #666666; font-size: 14px; margin: 5px 0 0 0;">Your monthly dose of insights</p>
  </div>
  <div style="padding: 30px;">
    <h3 style="color: #10b981; font-size: 20px;">What's New This Month</h3>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="color: #1a1a1a; margin-top: 0;">Featured Article</h4>
      <p style="font-size: 15px; line-height: 1.6; color: #555555;">Check out our latest insights on training and nutrition.</p>
      <a href="#" style="color: #10b981; text-decoration: none; font-weight: bold;">Read More →</a>
    </div>
    
    <h3 style="color: #10b981; font-size: 20px; margin-top: 30px;">Quick Tips</h3>
    <ul style="font-size: 15px; line-height: 1.8; color: #333333;">
      <li>Stay hydrated throughout the day</li>
      <li>Get 7-9 hours of quality sleep</li>
      <li>Move your body for 30 minutes daily</li>
    </ul>
  </div>
  <div style="background: #1a1a1a; padding: 20px; text-align: center; color: #ffffff;">
    <p style="margin: 0; font-size: 12px;">© 2026 CoachFlow | <a href="#" style="color: #10b981; text-decoration: none;">Unsubscribe</a></p>
  </div>
</div>`
    },
    {
      id: 'announcement',
      name: 'Announcement',
      preview: 'Important updates',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #10b981; border-radius: 8px; overflow: hidden;">
  <div style="background: #10b981; padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📢 Important Announcement</h1>
  </div>
  <div style="padding: 40px 30px;">
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">Hello,</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">We have some exciting news to share with you!</p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0;">
      <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0;"><strong>Main announcement content goes here.</strong> Add all the important details your subscribers need to know.</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: #333333;">This change will take effect immediately and will help us serve you better.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #10b981; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Learn More</a>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 30px;">Questions? Feel free to reach out!</p>
  </div>
  <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666666;">
    <p>© 2026 CoachFlow. All rights reserved.</p>
  </div>
</div>`
    }
  ];

  useEffect(() => {
    fetchCampaigns();
    fetchAudiences();
  }, []);

  useEffect(() => {
    if (!showAddSubscriberModal) return;

    let isCancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsUserSearchLoading(true);
      try {
        const response = await fetch(
          BACKEND_ROUTES_API + `SearchUsers.php?q=${encodeURIComponent(userSearchQuery.trim())}&limit=10`,
          { credentials: 'include', signal: controller.signal }
        );
        const data = await response.json();
        if (!isCancelled) {
          setUserSearchResults(data.success ? (data.users || []) : []);
        }
      } catch (error) {
        if (!isCancelled && error?.name !== 'AbortError') {
          setUserSearchResults([]);
        }
      } finally {
        if (!isCancelled) setIsUserSearchLoading(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [showAddSubscriberModal, userSearchQuery]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(BACKEND_ROUTES_API + 'GetMailchimpCampaigns.php', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
    setIsLoading(false);
  };

  const fetchAudiences = async () => {
    try {
      const response = await fetch(BACKEND_ROUTES_API + 'GetMailchimpAudiences.php', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setAudiences(data.audiences || []);
      }
    } catch (error) {
      console.error('Error fetching audiences:', error);
    }
  };

  const createCampaign = async () => {
    // Clear previous errors
    setError(null);
    
    // Validate required fields
    const missingFields = [];
    if (!campaignForm.subject) missingFields.push('Subject');
    if (!campaignForm.fromName) missingFields.push('From Name');
    if (!campaignForm.replyTo) missingFields.push('Reply To Email');
    if (!campaignForm.audience) missingFields.push('Audience');
    if (!campaignForm.content) missingFields.push('Email Content');
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(campaignForm.replyTo)) {
      setError('Please enter a valid Reply To email address');
      return;
    }

    setIsLoading(true);
    setSuccess(null);
    
    try {
      // Map frontend field names to backend expected field names
      const payload = {
        subject: campaignForm.subject,
        fromName: campaignForm.fromName,
        replyTo: campaignForm.replyTo,
        audienceId: campaignForm.audience, // Map 'audience' to 'audienceId'
        htmlContent: campaignForm.content  // Map 'content' to 'htmlContent'
      };
      
      const response = await fetch(BACKEND_ROUTES_API + 'CreateMailchimpCampaign.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Campaign created successfully!');
        handleCloseCampaignModal();
        fetchCampaigns();
      } else {
        setError(data.message || 'Failed to create campaign');
      }
    } catch (error) {
      setError('Error creating campaign: ' + error.message);
    }
    setIsLoading(false);
  };

  const sendCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this campaign?')) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(BACKEND_ROUTES_API + 'SendMailchimpCampaign.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Campaign sent successfully!');
        await fetchCampaigns(); // Wait for campaigns to refresh
      } else {
        setError(data.message || 'Failed to send campaign');
      }
    } catch (error) {
      setError('Error sending campaign');
    }
    setIsLoading(false);
  };

  const viewCampaignDetails = async (campaignId) => {
    setIsLoading(true);
    try {
      const response = await fetch(BACKEND_ROUTES_API + `GetMailchimpCampaignDetails.php?campaignId=${campaignId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedCampaign(data.campaign);
        setShowViewCampaignModal(true);
      } else {
        setError(data.message || 'Failed to fetch campaign details');
      }
    } catch (error) {
      setError('Error fetching campaign details');
    }
    setIsLoading(false);
  };

  const openEditCampaign = async (campaignId) => {
    setIsLoading(true);
    try {
      const response = await fetch(BACKEND_ROUTES_API + `GetMailchimpCampaignDetails.php?campaignId=${campaignId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const campaign = data.campaign;
        setEditCampaignForm({
          id: campaign.id,
          subject: campaign.subject,
          fromName: campaign.fromName,
          replyTo: campaign.replyTo,
          content: campaign.htmlContent
        });
        setShowEditCampaignModal(true);
      } else {
        setError(data.message || 'Failed to fetch campaign details');
      }
    } catch (error) {
      setError('Error fetching campaign details');
    }
    setIsLoading(false);
  };

  const updateCampaign = async () => {
    if (!editCampaignForm.subject || !editCampaignForm.fromName || !editCampaignForm.replyTo || !editCampaignForm.content) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const payload = {
        campaignId: editCampaignForm.id,
        subject: editCampaignForm.subject,
        fromName: editCampaignForm.fromName,
        replyTo: editCampaignForm.replyTo,
        htmlContent: editCampaignForm.content
      };
      
      const response = await fetch(BACKEND_ROUTES_API + 'UpdateMailchimpCampaign.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Campaign updated successfully!');
        setShowEditCampaignModal(false);
        await fetchCampaigns();
      } else {
        setError(data.message || 'Failed to update campaign');
      }
    } catch (error) {
      setError('Error updating campaign: ' + error.message);
    }
    setIsLoading(false);
  };

  const deleteCampaign = async (campaignId, campaignName) => {
    if (!window.confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(BACKEND_ROUTES_API + 'DeleteMailchimpCampaign.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Campaign deleted successfully!');
        await fetchCampaigns();
      } else {
        setError(data.message || 'Failed to delete campaign');
      }
    } catch (error) {
      setError('Error deleting campaign');
    }
    setIsLoading(false);
  };

  const replicateCampaign = async (campaignId, campaignName) => {
    if (!window.confirm(`Create a copy of "${campaignName}"?`)) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(BACKEND_ROUTES_API + 'ReplicateMailchimpCampaign.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Campaign replicated successfully! You can now edit and send the copy.');
        await fetchCampaigns();
      } else {
        setError(data.message || 'Failed to replicate campaign');
      }
    } catch (error) {
      setError('Error replicating campaign');
    }
    setIsLoading(false);
  };

  const viewSubscribers = async (audience) => {
    setSelectedAudience(audience);
    setShowSubscribersModal(true);
    setIsLoading(true);
    
    try {
      const response = await fetch(BACKEND_ROUTES_API + `GetMailchimpMembers.php?audienceId=${audience.id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setSubscribers(data.members || []);
      } else {
        setError(data.message || 'Failed to fetch subscribers');
        setSubscribers([]);
      }
    } catch (error) {
      setError('Error fetching subscribers');
      setSubscribers([]);
    }
    setIsLoading(false);
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!subscriberForm.audienceId || !subscriberForm.userId) {
      setError('Please select an audience and a user');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(BACKEND_ROUTES_API + 'AddMailchimpSubscriber.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriberForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Subscriber added successfully!');
        setShowAddSubscriberModal(false);
        setSubscriberForm({ userId: '', audienceId: '' });
        setSelectedUserForSubscriber(null);
        setUserSearchQuery('');
        setUserSearchResults([]);
        // Refresh audiences to update member count
        fetchAudiences();
      } else {
        setError(data.message || 'Failed to add subscriber');
      }
    } catch (error) {
      setError('Error adding subscriber: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleCreateAudience = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(BACKEND_ROUTES_API + 'CreateMailchimpAudience.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(audienceForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Audience created successfully!');
        setShowCreateAudienceModal(false);
        setAudienceForm({
          name: '',
          fromName: '',
          fromEmail: '',
          companyName: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          zip: '',
          country: 'US',
          phone: ''
        });
        // Refresh audiences list
        fetchAudiences();
      } else {
        setError(data.message || 'Failed to create audience');
      }
    } catch (error) {
      setError('Error creating audience: ' + error.message);
    }
    setIsLoading(false);
  };

  const handleCloseCampaignModal = () => {
    setShowCampaignModal(false);
    setCampaignForm({ subject: '', fromName: '', replyTo: '', audience: '', content: '', template: 'blank' });
  };

  return (
    <AdminDashboardLayout>
      <div className="admin-page">
        {/* Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-page-title">Email Marketing</h2>
            <p className="admin-page-subtitle">Manage campaigns and audiences</p>
          </div>
          <div className="admin-page-header-actions">
            <button 
              className="btn btn-sm d-inline-flex align-items-center"
              style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 0.75rem' }}
              onClick={() => setShowCampaignModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              New Campaign
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert mb-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444' }}>
            {error}
            <button type="button" className="btn-close btn-close-white float-end" onClick={() => setError(null)}></button>
          </div>
        )}
        {success && (
          <div className="alert mb-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981' }}>
            {success}
            <button type="button" className="btn-close btn-close-white float-end" onClick={() => setSuccess(null)}></button>
          </div>
        )}

        {/* Tabs */}
        <style>
          {`
            .email-tab {
              transition: all 0.3s ease;
              padding: 12px 20px;
              margin-right: 4px;
              border-radius: 8px 8px 0 0;
            }
            .email-tab:hover {
              background-color: rgba(16, 185, 129, 0.1) !important;
              color: #10b981 !important;
            }
          `}
        </style>
        <ul className="nav nav-tabs mb-4" style={{ borderBottom: '2px solid rgba(16, 185, 129, 0.2)' }}>
          <li className="nav-item">
            <button
              className="email-tab"
              onClick={() => setActiveTab('campaigns')}
              style={{ 
                border: 'none',
                backgroundColor: activeTab === 'campaigns' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: activeTab === 'campaigns' ? '#fff' : '#9ca3af',
                borderBottom: activeTab === 'campaigns' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'campaigns' ? '600' : '400'
              }}
            >
              <i className="bi bi-envelope me-2"></i>Campaigns
            </button>
          </li>
          <li className="nav-item">
            <button
              className="email-tab"
              onClick={() => setActiveTab('audiences')}
              style={{ 
                border: 'none',
                backgroundColor: activeTab === 'audiences' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: activeTab === 'audiences' ? '#fff' : '#9ca3af',
                borderBottom: activeTab === 'audiences' ? '3px solid #10b981' : 'none',
                fontWeight: activeTab === 'audiences' ? '600' : '400'
              }}
            >
              <i className="bi bi-people me-2"></i>Audiences
            </button>
          </li>
        </ul>

        {/* Content */}
        {activeTab === 'campaigns' && (
          <div>
            {/* Campaign Status Filter Tabs */}
            <div className="mb-4">
              <ul className="nav nav-pills" style={{ borderBottom: '2px solid rgba(16, 185, 129, 0.2)' }}>
                <li className="nav-item me-2">
                  <button
                    className="email-tab"
                    onClick={() => {
                      setCampaignFilter('all');
                      setCampaignPage(1);
                    }}
                    style={{ 
                      border: 'none',
                      backgroundColor: campaignFilter === 'all' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: campaignFilter === 'all' ? '#fff' : '#9ca3af',
                      borderBottom: campaignFilter === 'all' ? '3px solid #10b981' : 'none',
                      fontWeight: campaignFilter === 'all' ? '600' : '400',
                      padding: '8px 20px',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <i className="bi bi-inbox me-2"></i>All ({campaigns.length})
                  </button>
                </li>
                <li className="nav-item me-2">
                  <button
                    className="email-tab"
                    onClick={() => {
                      setCampaignFilter('save');
                      setCampaignPage(1);
                    }}
                    style={{ 
                      border: 'none',
                      backgroundColor: campaignFilter === 'save' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: campaignFilter === 'save' ? '#fff' : '#9ca3af',
                      borderBottom: campaignFilter === 'save' ? '3px solid #10b981' : 'none',
                      fontWeight: campaignFilter === 'save' ? '600' : '400',
                      padding: '8px 20px',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <i className="bi bi-file-earmark me-2"></i>Drafts ({campaigns.filter(c => c.status === 'save').length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className="email-tab"
                    onClick={() => {
                      setCampaignFilter('sent');
                      setCampaignPage(1);
                    }}
                    style={{ 
                      border: 'none',
                      backgroundColor: campaignFilter === 'sent' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: campaignFilter === 'sent' ? '#fff' : '#9ca3af',
                      borderBottom: campaignFilter === 'sent' ? '3px solid #10b981' : 'none',
                      fontWeight: campaignFilter === 'sent' ? '600' : '400',
                      padding: '8px 20px',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <i className="bi bi-send-check me-2"></i>Sent ({campaigns.filter(c => c.status === 'sent').length})
                  </button>
                </li>
              </ul>
            </div>
            
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: '#10b981' }}></div>
              </div>
            ) : (() => {
              // Filter campaigns based on selected filter
              const filteredCampaigns = campaignFilter === 'all' 
                ? campaigns 
                : campaigns.filter(c => c.status === campaignFilter);
              
              // Pagination
              const indexOfLastCampaign = campaignPage * campaignsPerPage;
              const indexOfFirstCampaign = indexOfLastCampaign - campaignsPerPage;
              const currentCampaigns = filteredCampaigns.slice(indexOfFirstCampaign, indexOfLastCampaign);
              const totalPages = Math.ceil(filteredCampaigns.length / campaignsPerPage);
              
              return filteredCampaigns.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 mb-3" style={{ color: '#9ca3af' }}></i>
                  <p style={{ color: '#9ca3af' }}>
                    {campaignFilter === 'all' ? 'No campaigns yet. Create your first campaign!' :
                     campaignFilter === 'save' ? 'No draft campaigns.' :
                     'No sent campaigns yet.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="row">
                    {currentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title mb-2" style={{ color: '#fff' }}>{campaign.subject || campaign.name || 'Untitled'}</h5>
                        <p className="card-text mb-3" style={{ color: '#9ca3af', fontSize: '14px' }}>
                          <span className={`badge ${campaign.status === 'sent' ? 'bg-success' : campaign.status === 'sending' ? 'bg-info' : 'bg-warning'}`}>
                            {campaign.status === 'save' ? 'Draft' : campaign.status}
                          </span>
                          {campaign.status === 'sent' && campaign.emails_sent && (
                            <span className="ms-2" style={{ fontSize: '12px' }}>
                              <i className="bi bi-send me-1"></i>{campaign.emails_sent} sent
                            </span>
                          )}
                        </p>
                        
                        <div className="mt-auto">
                          <div className="d-grid gap-2">
                            {/* View Button */}
                            <button
                              className="btn btn-sm"
                              onClick={() => viewCampaignDetails(campaign.id)}
                              style={{ backgroundColor: '#374151', color: '#fff', border: 'none' }}
                            >
                              <i className="bi bi-eye me-2"></i>View Details
                            </button>
                            
                            {/* Edit Button - Only for drafts */}
                            {campaign.status === 'save' && (
                              <button
                                className="btn btn-sm"
                                onClick={() => openEditCampaign(campaign.id)}
                                style={{ backgroundColor: '#2d2d2d', color: '#10b981', border: '1px solid #10b981' }}
                              >
                                <i className="bi bi-pencil me-2"></i>Edit Campaign
                              </button>
                            )}
                            
                            {/* Send Button - Only for drafts */}
                            {campaign.status === 'save' && (
                              <button
                                className="btn btn-sm"
                                onClick={() => sendCampaign(campaign.id)}
                                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                              >
                                <i className="bi bi-send me-2"></i>Send Campaign
                              </button>
                            )}
                            
                            {/* Resend/Replicate Button - For sent campaigns */}
                            {campaign.status === 'sent' && (
                              <button
                                className="btn btn-sm"
                                onClick={() => replicateCampaign(campaign.id, campaign.subject || 'campaign')}
                                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                              >
                                <i className="bi bi-arrow-repeat me-2"></i>Resend (Copy)
                              </button>
                            )}
                            
                            {/* Delete Button - Available for all campaigns */}
                            <button
                              className="btn btn-sm"
                              onClick={() => deleteCampaign(campaign.id, campaign.subject || 'campaign')}
                              style={{ backgroundColor: '#2d2d2d', color: '#ef4444', border: '1px solid #ef4444' }}
                            >
                              <i className="bi bi-trash me-2"></i>Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center mt-4" style={{ gap: '10px' }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => setCampaignPage(prev => Math.max(1, prev - 1))}
                        disabled={campaignPage === 1}
                        style={{ 
                          backgroundColor: campaignPage === 1 ? '#374151' : '#2d2d2d',
                          color: campaignPage === 1 ? '#6b7280' : '#fff',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          cursor: campaignPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <i className="bi bi-chevron-left"></i> Previous
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          className="btn btn-sm"
                          onClick={() => setCampaignPage(pageNum)}
                          style={{ 
                            backgroundColor: campaignPage === pageNum ? '#10b981' : '#2d2d2d',
                            color: '#fff',
                            border: `1px solid ${campaignPage === pageNum ? '#10b981' : 'rgba(16, 185, 129, 0.2)'}`,
                            minWidth: '40px',
                            fontWeight: campaignPage === pageNum ? '600' : '400'
                          }}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      <button
                        className="btn btn-sm"
                        onClick={() => setCampaignPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={campaignPage === totalPages}
                        style={{ 
                          backgroundColor: campaignPage === totalPages ? '#374151' : '#2d2d2d',
                          color: campaignPage === totalPages ? '#6b7280' : '#fff',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          cursor: campaignPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Next <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'audiences' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ color: '#fff', marginBottom: 0 }}>
                <i className="bi bi-people me-2"></i>Your Audiences
              </h5>
              <button 
                className="btn"
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                onClick={() => setShowCreateAudienceModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>Create Audience
              </button>
            </div>
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: '#10b981' }}></div>
              </div>
            ) : audiences.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-people fs-1 mb-3" style={{ color: '#9ca3af' }}></i>
                <p style={{ color: '#9ca3af' }}>No audiences found. Create one in Mailchimp!</p>
              </div>
            ) : (
              <div className="row">
                {audiences.map((audience) => (
                  <div key={audience.id} className="col-md-6 mb-3">
                    <div className="card" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <h5 className="card-title" style={{ color: '#fff' }}>{audience.name}</h5>
                          {audience.is_default ? (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                fontWeight: 700,
                              }}
                              title="Default audience (locked)"
                            >
                              <i className="bi bi-lock-fill me-1"></i>
                              Default
                            </span>
                          ) : null}
                        </div>
                        <p className="card-text mb-3" style={{ color: '#9ca3af' }}>
                          <i className="bi bi-people me-2"></i>{audience.member_count || 0} subscribers
                        </p>
                        <div className="small mb-2" style={{ color: '#6b7280' }}>
                          Audience ID: <span style={{ color: '#9ca3af' }}>{audience.id}</span>
                        </div>
                        <div className="d-grid gap-2">
                          <button 
                            className="btn btn-sm"
                            onClick={() => viewSubscribers(audience)}
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                          >
                            <i className="bi bi-eye me-2"></i>View Subscribers
                          </button>
                          <button 
                            className="btn btn-sm"
                            onClick={() => {
                              setSubscriberForm({ userId: '', audienceId: audience.id });
                              setSelectedUserForSubscriber(null);
                              setUserSearchQuery('');
                              setUserSearchResults([]);
                              setShowAddSubscriberModal(true);
                            }}
                            style={{ backgroundColor: '#2d2d2d', color: '#10b981', border: '1px solid #10b981' }}
                          >
                            <i className="bi bi-person-plus me-2"></i>Add Subscriber
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCampaignModal && (
          <>
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.7)' }} onClick={handleCloseCampaignModal}>
              <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div className="modal-header dark-modal-header" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h5 className="modal-title" style={{ color: '#fff' }}>Create Campaign</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseCampaignModal}></button>
                  </div>
                  <div className="modal-body" style={{ backgroundColor: '#2d2d2d' }}>
                    {/* Error Alert in Modal */}
                    {error && (
                      <div className="alert mb-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>{error}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>Subject Line <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={campaignForm.subject}
                        onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                        placeholder="Enter your email subject"
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>From Name <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={campaignForm.fromName}
                        onChange={(e) => setCampaignForm({ ...campaignForm, fromName: e.target.value })}
                        placeholder="Your Name or Company"
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>Reply To Email <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        value={campaignForm.replyTo}
                        onChange={(e) => setCampaignForm({ ...campaignForm, replyTo: e.target.value })}
                        placeholder="reply@example.com"
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>Audience *</label>
                      <select
                        className="form-select"
                        value={campaignForm.audience}
                        onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                        style={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid rgba(16, 185, 129, 0.2)', 
                          color: '#fff',
                          backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3e%3cpath fill=\'none\' stroke=\'%2310b981\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m2 5 6 6 6-6\'/%3e%3c/svg%3e")'
                        }}
                      >
                        <option value="">Select audience</option>
                        {audiences.map((aud) => (
                          <option key={aud.id} value={aud.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                            {aud.name} ({aud.member_count || 0} subscribers)
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Template Selector */}
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>Email Template</label>
                      <div className="row g-2">
                        {emailTemplates.map((template) => (
                          <div key={template.id} className="col-6 col-md-3">
                            <button
                              type="button"
                              className={`btn w-100 ${campaignForm.template === template.id ? 'border-2' : ''}`}
                              onClick={() => {
                                setCampaignForm({ 
                                  ...campaignForm, 
                                  template: template.id,
                                  content: template.html 
                                });
                              }}
                              style={{
                                backgroundColor: campaignForm.template === template.id ? 'rgba(16, 185, 129, 0.2)' : '#1a1a1a',
                                border: campaignForm.template === template.id ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.2)',
                                color: '#fff',
                                padding: '15px 10px',
                                height: '80px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                                {template.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                {template.preview}
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label mb-0" style={{ color: '#fff' }}>Email Content (HTML) <span style={{ color: '#ef4444' }}>*</span></label>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            const preview = window.open('', '_blank');
                            preview.document.write(campaignForm.content);
                            preview.document.close();
                          }}
                          style={{ backgroundColor: '#374151', color: '#fff', border: 'none', fontSize: '12px' }}
                        >
                          <i className="bi bi-eye me-1"></i>Preview
                        </button>
                      </div>
                      <textarea
                        className="form-control"
                        rows="12"
                        value={campaignForm.content}
                        onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                        placeholder="Write your email HTML content here..."
                        style={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid rgba(16, 185, 129, 0.2)', 
                          color: '#fff',
                          fontFamily: 'monospace',
                          fontSize: '13px'
                        }}
                      />
                      <small style={{ color: '#9ca3af' }}>
                        💡 Tip: Select a template above to get started, then customize the HTML
                      </small>
                    </div>
                  </div>
                  <div className="modal-footer" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                      onClick={handleCloseCampaignModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', minHeight: '38px', minWidth: '140px' }}
                      onClick={createCampaign}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Creating...
                        </>
                      ) : (
                        'Create Campaign'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}

        {/* View Campaign Details Modal */}
        {showViewCampaignModal && selectedCampaign && (
          <>
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div className="modal-header dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: '#1a1a1a' }}>
                    <h5 className="modal-title" style={{ color: '#fff' }}>
                      <i className="bi bi-envelope me-2"></i>Campaign Details
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={() => {
                        setShowViewCampaignModal(false);
                        setSelectedCampaign(null);
                      }}
                    ></button>
                  </div>
                  <div className="modal-body" style={{ padding: '20px' }}>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#10b981', fontWeight: '600' }}>Subject Line</label>
                      <p style={{ color: '#fff', backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '8px' }}>
                        {selectedCampaign.subject}
                      </p>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#10b981', fontWeight: '600' }}>From Name</label>
                        <p style={{ color: '#fff', backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '8px' }}>
                          {selectedCampaign.fromName}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ color: '#10b981', fontWeight: '600' }}>Reply To</label>
                        <p style={{ color: '#fff', backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '8px' }}>
                          {selectedCampaign.replyTo}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#10b981', fontWeight: '600' }}>Audience</label>
                      <p style={{ color: '#fff', backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '8px' }}>
                        {selectedCampaign.audienceName || selectedCampaign.audienceId}
                      </p>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#10b981', fontWeight: '600' }}>Status</label>
                      <p>
                        <span className={`badge ${selectedCampaign.status === 'sent' ? 'bg-success' : 'bg-warning'}`}>
                          {selectedCampaign.status === 'save' ? 'Draft' : selectedCampaign.status}
                        </span>
                        {selectedCampaign.emailsSent > 0 && (
                          <span className="ms-2" style={{ color: '#9ca3af' }}>
                            <i className="bi bi-send me-1"></i>{selectedCampaign.emailsSent} emails sent
                          </span>
                        )}
                      </p>
                    </div>
                    
                    {selectedCampaign.htmlContent && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label mb-0" style={{ color: '#10b981', fontWeight: '600' }}>Email Content</label>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => {
                              const preview = window.open('', '_blank');
                              preview.document.write(selectedCampaign.htmlContent);
                              preview.document.close();
                            }}
                            style={{ backgroundColor: '#374151', color: '#fff', border: 'none', fontSize: '12px' }}
                          >
                            <i className="bi bi-eye me-1"></i>Preview in New Tab
                          </button>
                        </div>
                        <div style={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid rgba(16, 185, 129, 0.2)', 
                          borderRadius: '8px',
                          padding: '15px',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          color: '#9ca3af',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          {selectedCampaign.htmlContent}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                      onClick={() => {
                        setShowViewCampaignModal(false);
                        setSelectedCampaign(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}

        {/* Edit Campaign Modal */}
        {showEditCampaignModal && (
          <>
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div className="modal-header dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: '#1a1a1a' }}>
                    <h5 className="modal-title" style={{ color: '#fff' }}>
                      <i className="bi bi-pencil me-2"></i>Edit Campaign
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={() => setShowEditCampaignModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body" style={{ padding: '20px' }}>
                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#fff' }}>
                        Subject Line <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editCampaignForm.subject}
                        onChange={(e) => setEditCampaignForm({ ...editCampaignForm, subject: e.target.value })}
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                      />
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>
                          From Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editCampaignForm.fromName}
                          onChange={(e) => setEditCampaignForm({ ...editCampaignForm, fromName: e.target.value })}
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>
                          Reply To Email <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          value={editCampaignForm.replyTo}
                          onChange={(e) => setEditCampaignForm({ ...editCampaignForm, replyTo: e.target.value })}
                          style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label mb-0" style={{ color: '#fff' }}>
                          Email Content (HTML) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            const preview = window.open('', '_blank');
                            preview.document.write(editCampaignForm.content);
                            preview.document.close();
                          }}
                          style={{ backgroundColor: '#374151', color: '#fff', border: 'none', fontSize: '12px' }}
                        >
                          <i className="bi bi-eye me-1"></i>Preview
                        </button>
                      </div>
                      <textarea
                        className="form-control"
                        rows="15"
                        value={editCampaignForm.content}
                        onChange={(e) => setEditCampaignForm({ ...editCampaignForm, content: e.target.value })}
                        style={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid rgba(16, 185, 129, 0.2)', 
                          color: '#fff',
                          fontFamily: 'monospace',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>
                  <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                      onClick={() => setShowEditCampaignModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                      onClick={updateCampaign}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Updating...' : 'Update Campaign'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}

        {/* Subscribers Modal */}
        {showSubscribersModal && (
          <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
              <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div className="modal-header dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: '#1a1a1a' }}>
                    <h5 className="modal-title" style={{ color: '#fff' }}>
                      <i className="bi bi-people me-2"></i>
                      {selectedAudience?.name} - Subscribers ({subscribers.length})
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={() => {
                        setShowSubscribersModal(false);
                        setSubscribers([]);
                        setSelectedAudience(null);
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {isLoading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border" style={{ color: '#10b981' }}></div>
                        <p className="mt-3" style={{ color: '#9ca3af' }}>Loading subscribers...</p>
                      </div>
                    ) : subscribers.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="bi bi-inbox fs-1 mb-3" style={{ color: '#9ca3af' }}></i>
                        <p style={{ color: '#9ca3af' }}>No subscribers found in this audience.</p>
                      </div>
                    ) : (
                      <div style={{ height: 500, width: '100%' }}>
                        <DataGrid
                          rows={subscribers.map((sub, idx) => ({
                            id: sub.id || idx,
                            email: sub.email_address,
                            firstName: sub.merge_fields?.FNAME || '',
                            lastName: sub.merge_fields?.LNAME || '',
                            fullName: `${sub.merge_fields?.FNAME || ''} ${sub.merge_fields?.LNAME || ''}`.trim() || 'N/A',
                            status: sub.status,
                            subscribed: sub.timestamp_opt ? new Date(sub.timestamp_opt).toLocaleDateString() : 'N/A',
                            timestamp: sub.timestamp_opt ? new Date(sub.timestamp_opt).getTime() : 0
                          }))}
                          columns={[
                            { 
                              field: 'email', 
                              headerName: 'Email', 
                              flex: 1,
                              minWidth: 200
                            },
                            { 
                              field: 'fullName', 
                              headerName: 'Name', 
                              flex: 0.7,
                              minWidth: 150
                            },
                            { 
                              field: 'status', 
                              headerName: 'Status', 
                              width: 130,
                              renderCell: (params) => (
                                <span className={`badge ${
                                  params.value === 'subscribed' ? 'bg-success' : 
                                  params.value === 'unsubscribed' ? 'bg-danger' : 
                                  params.value === 'pending' ? 'bg-warning' :
                                  'bg-secondary'
                                }`} style={{ fontSize: '11px', padding: '5px 10px' }}>
                                  {params.value}
                                </span>
                              )
                            },
                            { 
                              field: 'subscribed', 
                              headerName: 'Subscribed Date', 
                              width: 150,
                              type: 'string'
                            }
                          ]}
                          initialState={{
                            pagination: {
                              paginationModel: { page: 0, pageSize: 10 },
                            },
                            sorting: {
                              sortModel: [{ field: 'timestamp', sort: 'desc' }],
                            },
                          }}
                          pageSizeOptions={[10, 25, 50, 100]}
                          disableRowSelectionOnClick
                          sx={{
                            border: 0,
                            height: "100%",
                            backgroundColor: "#2d2d2d !important",
                            color: "#fff",
                            "--DataGrid-rowBorderColor": "rgba(16, 185, 129, 0.1) !important",
                            ".MuiDataGrid-main": {
                              maxHeight: "none !important",
                            },
                            ".MuiDataGrid-cell": {
                              borderColor: "rgba(16, 185, 129, 0.1)",
                              color: "#fff",
                            },
                            ".MuiDataGrid-columnHeaders": {
                              backgroundColor: "#1a1a1a !important",
                              color: "#fff !important",
                              borderColor: "rgba(16, 185, 129, 0.2) !important",
                              borderBottom: "1px solid rgba(16, 185, 129, 0.2) !important",
                            },
                            ".MuiDataGrid-columnHeader": {
                              backgroundColor: "#1a1a1a !important",
                              color: "#fff !important",
                              borderBottom: "none !important",
                            },
                            ".MuiDataGrid-columnHeadersInner": {
                              backgroundColor: "#1a1a1a !important",
                            },
                            ".MuiDataGrid-columnHeaderTitle": {
                              color: "#fff !important",
                              fontWeight: 600,
                            },
                            ".MuiDataGrid-columnHeaderTitleContainer": {
                              color: "#fff !important",
                            },
                            ".MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader": {
                              borderBottom: "none !important",
                            },
                            ".MuiDataGrid-row--borderBottom .MuiDataGrid-filler": {
                              borderBottom: "none !important",
                              backgroundColor: "#1a1a1a !important",
                            },
                            ".MuiDataGrid-row--borderBottom .MuiDataGrid-scrollbarFiller": {
                              borderBottom: "none !important",
                              backgroundColor: "#1a1a1a !important",
                            },
                            ".MuiDataGrid-row": {
                              backgroundColor: "#2d2d2d",
                              borderTop: "none !important",
                              "&:hover": {
                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                              },
                              "&:first-of-type": {
                                borderTop: "none !important",
                              },
                            },
                            ".MuiDataGrid-footerContainer": {
                              backgroundColor: "#1a1a1a",
                              borderColor: "rgba(16, 185, 129, 0.2)",
                              color: "#fff",
                            },
                            ".MuiTablePagination-root": {
                              color: "#fff",
                            },
                            ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                              color: "#9ca3af",
                            },
                            ".MuiTablePagination-select": {
                              color: "#fff",
                            },
                            ".MuiTablePagination-selectIcon": {
                              color: "#10b981",
                            },
                            ".MuiIconButton-root": {
                              color: "#10b981",
                            },
                            ".MuiDataGrid-columnSeparator": {
                              color: "rgba(16, 185, 129, 0.1)",
                            },
                            ".MuiCircularProgress-root": {
                              color: "#10b981",
                            },
                            ".MuiDataGrid-filler": {
                              backgroundColor: "#1a1a1a !important",
                            },
                            ".MuiDataGrid-scrollbar": {
                              backgroundColor: "#2d2d2d !important",
                            },
                            ".MuiDataGrid-scrollbarFiller": {
                              backgroundColor: "#1a1a1a !important",
                            },
                            ".MuiDataGrid-virtualScroller": {
                              backgroundColor: "#2d2d2d !important",
                            },
                            ".MuiDataGrid-virtualScrollerContent": {
                              backgroundColor: "#2d2d2d !important",
                            },
                            ".MuiDataGrid-virtualScrollerRenderZone": {
                              backgroundColor: "#2d2d2d !important",
                            },
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="modal-footer" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                      onClick={() => {
                        setShowSubscribersModal(false);
                        setSubscribers([]);
                        setSelectedAudience(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}

        {/* Add Subscriber Modal */}
        {showAddSubscriberModal && (
          <>
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div className="modal-header dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: '#1a1a1a' }}>
                    <h5 className="modal-title" style={{ color: '#fff' }}>
                      <i className="bi bi-person-plus me-2"></i>Add Subscriber
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={() => {
                        setShowAddSubscriberModal(false);
                        setSubscriberForm({ userId: '', audienceId: '' });
                        setSelectedUserForSubscriber(null);
                        setUserSearchQuery('');
                        setUserSearchResults([]);
                      }}
                    ></button>
                  </div>
                  <div className="modal-body" style={{ padding: '20px' }}>
                    <form onSubmit={handleAddSubscriber}>
                      
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>
                          Audience <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          className="form-select"
                          value={subscriberForm.audienceId}
                          onChange={(e) => setSubscriberForm({ ...subscriberForm, audienceId: e.target.value })}
                          required
                          style={{ 
                            backgroundColor: '#1a1a1a', 
                            border: '1px solid rgba(16, 185, 129, 0.2)', 
                            color: '#fff',
                            backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3e%3cpath fill=\'none\' stroke=\'%2310b981\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m2 5 6 6 6-6\'/%3e%3c/svg%3e")'
                          }}
                        >
                          <option value="">Select audience</option>
                          {audiences.map((aud) => (
                            <option key={aud.id} value={aud.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                              {aud.name} ({aud.member_count || 0} subscribers)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>
                          Search Users <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: '#fff'
                          }}
                          placeholder="Search by name, username, or email"
                        />
                        <div
                          className="mt-2"
                          style={{
                            maxHeight: 220,
                            overflowY: 'auto',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: 8,
                            backgroundColor: '#1a1a1a'
                          }}
                        >
                          {isUserSearchLoading ? (
                            <div
                              style={{
                                backgroundColor: '#1a1a1a',
                                color: '#9ca3af',
                                padding: '10px 12px',
                                borderBottom: '1px solid rgba(16, 185, 129, 0.12)'
                              }}
                            >
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Searching...
                            </div>
                          ) : userSearchResults.length === 0 ? (
                            <div
                              style={{
                                backgroundColor: '#1a1a1a',
                                color: '#9ca3af',
                                padding: '10px 12px'
                              }}
                            >
                              No users found
                            </div>
                          ) : (
                            userSearchResults.map((u) => {
                              const isSelected = selectedUserForSubscriber?.id === u.id;
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedUserForSubscriber(u);
                                    setSubscriberForm({ ...subscriberForm, userId: u.id });
                                  }}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : '#1a1a1a',
                                    color: '#fff',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(16, 185, 129, 0.12)',
                                    padding: '10px 12px'
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div style={{ fontWeight: 600 }}>
                                      {u.full_name || u.username || 'User'}
                                    </div>
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor: 'rgba(156, 163, 175, 0.15)',
                                        color: '#9ca3af',
                                        border: '1px solid rgba(156, 163, 175, 0.25)'
                                      }}
                                    >
                                      {u.role || 'user'}
                                    </span>
                                  </div>
                                  <div className="small" style={{ color: '#9ca3af' }}>{u.email || 'No email'}</div>
                                </button>
                              );
                            })
                          )}
                        </div>

                        {selectedUserForSubscriber ? (
                          <div className="small mt-2" style={{ color: '#9ca3af' }}>
                            Selected: <span style={{ color: '#fff' }}>{selectedUserForSubscriber.email}</span>
                          </div>
                        ) : null}
                      </div>
                      
                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setShowAddSubscriberModal(false);
                            setSubscriberForm({ userId: '', audienceId: '' });
                            setSelectedUserForSubscriber(null);
                            setUserSearchQuery('');
                            setUserSearchResults([]);
                          }}
                          style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn"
                          disabled={isLoading || !subscriberForm.audienceId || !subscriberForm.userId}
                          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                        >
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Adding...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>Add Subscriber
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}

        {/* Create Audience Modal */}
        {showCreateAudienceModal && (
          <>
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
              <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div className="modal-header dark-modal-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: '#1a1a1a' }}>
                    <h5 className="modal-title" style={{ color: '#fff' }}>
                      <i className="bi bi-people me-2"></i>Create New Audience
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={() => {
                        setShowCreateAudienceModal(false);
                        setAudienceForm({
                          name: '',
                          fromName: '',
                          fromEmail: '',
                          companyName: '',
                          address1: '',
                          address2: '',
                          city: '',
                          state: '',
                          zip: '',
                          country: 'US',
                          phone: ''
                        });
                      }}
                    ></button>
                  </div>
                  <div className="modal-body" style={{ padding: '20px' }}>
                    <form onSubmit={handleCreateAudience}>
                      <h6 style={{ color: '#10b981', marginBottom: '15px' }}>Audience Details</h6>
                      
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>
                          Audience Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={audienceForm.name}
                          onChange={(e) => setAudienceForm({ ...audienceForm, name: e.target.value })}
                          required
                          style={{ 
                            backgroundColor: '#1a1a1a', 
                            border: '1px solid rgba(16, 185, 129, 0.2)', 
                            color: '#fff' 
                          }}
                          placeholder="My Subscribers"
                        />
                      </div>
                      
                      <h6 style={{ color: '#10b981', marginTop: '25px', marginBottom: '15px' }}>Campaign Defaults</h6>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#fff' }}>
                            From Name <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={audienceForm.fromName}
                            onChange={(e) => setAudienceForm({ ...audienceForm, fromName: e.target.value })}
                            required
                            style={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid rgba(16, 185, 129, 0.2)', 
                              color: '#fff' 
                            }}
                            placeholder="Your Name"
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#fff' }}>
                            From Email <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            value={audienceForm.fromEmail}
                            onChange={(e) => setAudienceForm({ ...audienceForm, fromEmail: e.target.value })}
                            required
                            style={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid rgba(16, 185, 129, 0.2)', 
                              color: '#fff' 
                            }}
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                      
                      <h6 style={{ color: '#10b981', marginTop: '25px', marginBottom: '15px' }}>Contact Information</h6>
                      
                      {/* Legal Requirement Notice */}
                      <div className="alert mb-3" style={{ 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                        border: '1px solid rgba(59, 130, 246, 0.3)', 
                        color: '#60a5fa',
                        fontSize: '14px'
                      }}>
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Why is this needed?</strong> Email laws (CAN-SPAM) require a physical mailing address in all commercial emails. This information will appear in your email footers.
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>
                          Company Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={audienceForm.companyName}
                          onChange={(e) => setAudienceForm({ ...audienceForm, companyName: e.target.value })}
                          required
                          style={{ 
                            backgroundColor: '#1a1a1a', 
                            border: '1px solid rgba(16, 185, 129, 0.2)', 
                            color: '#fff' 
                          }}
                          placeholder="Your Company"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>
                          Address 1 <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={audienceForm.address1}
                          onChange={(e) => setAudienceForm({ ...audienceForm, address1: e.target.value })}
                          required
                          style={{ 
                            backgroundColor: '#1a1a1a', 
                            border: '1px solid rgba(16, 185, 129, 0.2)', 
                            color: '#fff' 
                          }}
                          placeholder="123 Main St"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>Address 2</label>
                        <input
                          type="text"
                          className="form-control"
                          value={audienceForm.address2}
                          onChange={(e) => setAudienceForm({ ...audienceForm, address2: e.target.value })}
                          style={{ 
                            backgroundColor: '#1a1a1a', 
                            border: '1px solid rgba(16, 185, 129, 0.2)', 
                            color: '#fff' 
                          }}
                          placeholder="Suite 100"
                        />
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#fff' }}>
                            City <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={audienceForm.city}
                            onChange={(e) => setAudienceForm({ ...audienceForm, city: e.target.value })}
                            required
                            style={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid rgba(16, 185, 129, 0.2)', 
                              color: '#fff' 
                            }}
                            placeholder="New York"
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#fff' }}>
                            State/Province <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={audienceForm.state}
                            onChange={(e) => setAudienceForm({ ...audienceForm, state: e.target.value })}
                            required
                            style={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid rgba(16, 185, 129, 0.2)', 
                              color: '#fff' 
                            }}
                            placeholder="NY"
                          />
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#fff' }}>
                            Postal Code <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={audienceForm.zip}
                            onChange={(e) => setAudienceForm({ ...audienceForm, zip: e.target.value })}
                            required
                            style={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid rgba(16, 185, 129, 0.2)', 
                              color: '#fff' 
                            }}
                            placeholder="10001"
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ color: '#fff' }}>
                            Country <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            className="form-select"
                            value={audienceForm.country}
                            onChange={(e) => setAudienceForm({ ...audienceForm, country: e.target.value })}
                            required
                            style={{ 
                              backgroundColor: '#1a1a1a', 
                              border: '1px solid rgba(16, 185, 129, 0.2)', 
                              color: '#fff',
                              backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3e%3cpath fill=\'none\' stroke=\'%2310b981\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m2 5 6 6 6-6\'/%3e%3c/svg%3e")'
                            }}
                          >
                            <option value="US" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>United States</option>
                            <option value="CA" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Canada</option>
                            <option value="GB" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>United Kingdom</option>
                            <option value="AU" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Australia</option>
                            <option value="DE" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Germany</option>
                            <option value="FR" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>France</option>
                            <option value="ES" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Spain</option>
                            <option value="IT" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Italy</option>
                            <option value="NL" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Netherlands</option>
                            <option value="SE" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Sweden</option>
                            <option value="NO" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Norway</option>
                            <option value="DK" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Denmark</option>
                            <option value="FI" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Finland</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label" style={{ color: '#fff' }}>Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={audienceForm.phone}
                          onChange={(e) => setAudienceForm({ ...audienceForm, phone: e.target.value })}
                          style={{ 
                            backgroundColor: '#1a1a1a', 
                            border: '1px solid rgba(16, 185, 129, 0.2)', 
                            color: '#fff' 
                          }}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      
                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setShowCreateAudienceModal(false);
                            setAudienceForm({
                              name: '',
                              fromName: '',
                              fromEmail: '',
                              companyName: '',
                              address1: '',
                              address2: '',
                              city: '',
                              state: '',
                              zip: '',
                              country: 'US',
                              phone: ''
                            });
                          }}
                          style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn"
                          disabled={isLoading}
                          style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                        >
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Creating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>Create Audience
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default EmailMarketing;
