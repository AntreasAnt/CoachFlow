import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../../../config/config';
import LogoutButton from '../../../components/LogoutButton';
import TraineeDashboard from '../../../components/TraineeDashboard';
import '../../../styles/ProfilePage.css';
import '../../../styles/trainee-dashboard.css';

const ProfilePage = () => {
  const { username: profileUsername } = useParams();
  const navigate = useNavigate();
  
  // All hooks must be declared at the top level
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // Default to home tab
  const [profileData, setProfileData] = useState({
    // Basic Info
    username: 'Loading...',
    email: 'Loading...',
    full_name: 'Loading...',
    phone: '',
    date_of_birth: '',
    profile_photo: '/src/assets/images/default-avatar.png',
    
    // Physical Info
    height: '',
    weight: '',
    body_fat: '',
    muscle_mass: '',
    chest: '',
    waist: '',
    hips: '',
    age: '',
    sex: '',
    
    // Professional Info (for trainers)
    specialization: '',
    experience_years: '',
    certifications: '',
    bio: '',
    
    // Fitness Info (for trainees)
    fitness_goals: '',
    experience_level: '',
    medical_notes: '',
    
    // Stats
    member_since: '2024-01-01',
    workouts_completed: 0,
    total_workout_time: 0,
    
    // Relationships
    assigned_trainer: null,
    current_program: '',
    clients: []
  });
  
  const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...profileData, password: '', confirmPassword: '' });

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !profileUsername || (currentUser && profileUsername === currentUser.username);
  const displayUsername = profileUsername || (currentUser ? currentUser.username : 'unknown');

  const showCompletionWidget = !!isOwnProfile;

  const getProfileCompletionInfo = () => {
    const fields = [];

    const addField = (key, label, value) => {
      const isFilled = !(value === null || value === undefined || String(value).trim() === '');
      fields.push({ key, label, isFilled });
    };

    addField('full_name', 'Full name', profileData.full_name);
    addField('phone', 'Phone', profileData.phone);
    addField('date_of_birth', 'Date of birth', profileData.date_of_birth);
    addField('age', 'Age', profileData.age);
    addField('sex', 'Sex', profileData.sex);

    if (currentUser?.role === 'trainee') {
      addField('height', 'Height', profileData.height);
      addField('weight', 'Weight', profileData.weight);
      addField('body_fat', 'Body Fat %', profileData.body_fat);
      addField('muscle_mass', 'Muscle Mass (kg)', profileData.muscle_mass);
      addField('chest', 'Chest (cm)', profileData.chest);
      addField('waist', 'Waist (cm)', profileData.waist);
      addField('hips', 'Hips (cm)', profileData.hips);
      addField('fitness_goals', 'Fitness goals', profileData.fitness_goals);
      addField('experience_level', 'Experience level', profileData.experience_level);
    }

    if (currentUser?.role === 'trainer') {
      addField('specialization', 'Specialization', profileData.specialization);
      addField('experience_years', 'Experience (years)', profileData.experience_years);
      addField('certifications', 'Certifications', profileData.certifications);
      addField('bio', 'Bio', profileData.bio);
    }

    const total = fields.length;
    const completed = fields.filter((f) => f.isFilled).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const missing = fields.filter((f) => !f.isFilled).map((f) => f.label);

    return { percent, missing };
  };

  const completionInfo = showCompletionWidget ? getProfileCompletionInfo() : { percent: 0, missing: [] };
  const completionPercent = completionInfo.percent;
  const missingFields = completionInfo.missing;

  const hasOtherSidebarContent =
    !isOwnProfile ||
    (currentUser?.role === 'trainee' && !!profileData.assigned_trainer) ||
    (currentUser?.role === 'trainee' && !!profileData.current_program) ||
    (currentUser?.role === 'trainer' && (profileData.clients?.length || 0) > 0);

  const hasSidebarContent = hasOtherSidebarContent || (showCompletionWidget && completionPercent < 100) || (showCompletionWidget && completionPercent >= 100);
  const sidebarOnlyCompletion = showCompletionWidget && !hasOtherSidebarContent;

  const renderCompletionCard = () => {
    if (!showCompletionWidget) return null;

    const isComplete = completionPercent >= 100;

    return (
      <div className="profile-card border-0 rounded-4">
        <div className="card-body p-4">
          {isComplete ? (
            <>
              <h6 className="fw-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <i className="bi bi-check-circle-fill me-2 text-success"></i>Profile complete
              </h6>
              <p className="small mb-3" style={{ color: '#9ca3af' }}>
                You’re all set. Here are a few quick links.
              </p>
              {currentUser?.role === 'trainee' ? (
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => navigate('/trainee-dashboard/my-plans')}
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <i className="bi bi-journal-text me-2"></i>My Plans
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => navigate('/trainee-dashboard/marketplace')}
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <i className="bi bi-shop me-2"></i>Marketplace
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => navigate('/trainee-dashboard/my-coach')}
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <i className="bi bi-person-badge me-2"></i>My Coach
                  </button>
                </div>
              ) : (
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => navigate('/trainer-dashboard/clients')}
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <i className="bi bi-people me-2"></i>Client Management
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-semibold mb-0" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Profile completion
                </h6>
                <span className="fw-bold" style={{ color: '#10b981' }}>{completionPercent}%</span>
              </div>
              <div className="progress" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${completionPercent}%`, backgroundColor: '#10b981' }}
                  aria-valuenow={completionPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              {missingFields.length > 0 && (
                <div className="mt-3">
                  <div className="small mb-2" style={{ color: '#9ca3af' }}>Missing</div>
                  <div className="small" style={{ color: '#d1d5db', lineHeight: 1.4 }}>
                    {missingFields.slice(0, 4).join(' • ')}
                    {missingFields.length > 4 ? ` • +${missingFields.length - 4} more` : ''}
                  </div>
                </div>
              )}

              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-sm w-100 mt-3"
                  onClick={() => setIsEditing(true)}
                  style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                >
                  <i className="bi bi-pencil me-2"></i>Complete profile
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Fetch profile data from backend
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // First verify current user authentication
        const authResponse = await fetch(BACKEND_ROUTES_API + "VerifyPrivilage.php", {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        const authData = await authResponse.json();
        
        if (authData.success && authData.privileges && authData.privileges !== 'loggedout') {
          const currentUserData = {
            username: authData.username || 'user',
            role: authData.privileges || 'trainee',
            user_id: authData.user_id || 1
          };
          setCurrentUser(currentUserData);
          
          // Fetch profile data (either current user or specific user)
          let profileUrl = BACKEND_ROUTES_API + "GetUserProfile.php";
          if (profileUsername) {
            profileUrl += `?username=${encodeURIComponent(profileUsername)}`;
          }
          
          const profileResponse = await fetch(profileUrl, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (profileResponse.status === 403 || profileResponse.status === 401) {
            console.error('Authentication failed, redirecting to login');
            navigate('/login');
            return;
          }
          
          const profileData = await profileResponse.json();
          
          if (profileData.success) {
            const user = profileData.user;
            
            // Set profile data from database
            setProfileData({
              // Basic Info
              username: user.username || 'Unknown',
              email: user.email || '',
              full_name: user.full_name || user.username || 'Unknown User',
              phone: user.phone || '',
              date_of_birth: user.date_of_birth || '',
              profile_photo: user.profilePicture || '/src/assets/images/default-avatar.png',
              
              // Physical Info
              height: user.height || '',
              weight: user.weight || '',
              body_fat: user.body_fat || '',
              muscle_mass: user.muscle_mass || '',
              chest: user.chest || '',
              waist: user.waist || '',
              hips: user.hips || '',
              age: user.age || '',
              sex: user.sex || '',
              
              // Professional Info (for trainers)
              specialization: user.specialization || '',
              experience_years: user.experience_years || '',
              certifications: user.certifications || '',
              bio: user.bio || '',
              
              // Fitness Info (for trainees)
              fitness_goals: user.fitness_goals || '',
              experience_level: user.experience_level || '',
              medical_notes: user.medical_notes || '',
              
              // Stats from database
              member_since: user.member_since || '2024-01-01',
              workouts_completed: 0, // TODO: fetch from workout logs
              total_workout_time: 0, // TODO: fetch from workout logs
              
              // Relationships (placeholder - would come from other tables)
              assigned_trainer: null, // TODO: fetch trainer relationship
              current_program: '', // TODO: fetch current program
              clients: [] // TODO: fetch clients for trainers
            });
          } else {
            console.error('Failed to fetch profile:', profileData.message);
          }
        } else {
          console.error('Authentication failed:', authData.message || 'User not logged in');
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        if (error.message && (error.message.includes('403') || error.message.includes('401'))) {
          navigate('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profileUsername, navigate]);

  // Update editData when profileData changes
  useEffect(() => {
    setEditData({ ...profileData, password: '', confirmPassword: '' });
  }, [profileData]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center profile-loading">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3 loading-pulse" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-white-50">Loading profile...</h5>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-secondary bg-opacity-25">
        <div className="text-center">
          <h5 className="text-danger">Unable to load user data</h5>
          <p>Please try refreshing the page or log in again.</p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancelEdit = () => {
    setEditData({ ...profileData, password: '', confirmPassword: '' });
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
      if (editData.password && editData.password !== editData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

    try {
      const response = await fetch(BACKEND_ROUTES_API + "UpdateUserProfile.php", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(editData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state with the data returned from server
        if (result.user) {
          // Merge the updated user data with current profile data
          setProfileData(prevData => ({
            ...prevData,
            ...result.user
          }));
          // Update localStorage with new name for header display
          if (result.user.full_name) {
            localStorage.setItem('traineeUserName', result.user.full_name);
          } else if (result.user.username) {
            localStorage.setItem('traineeUserName', result.user.username);
          }
        } else {
          // Fallback to using editData if server doesn't return user data
          setProfileData(editData);
          if (editData.full_name) {
            localStorage.setItem('traineeUserName', editData.full_name);
          }
        }
        // Dispatch custom event to update header
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { name: result.user?.full_name || editData.full_name } 
        }));
        setIsEditing(false);
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = '<i class="bi bi-check-circle me-2"></i>Profile updated successfully!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } else {
        console.error('Save failed:', result.message);
        
        // Show error message
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.innerHTML = '<i class="bi bi-exclamation-circle me-2"></i>' + (result.message || 'Failed to update profile. Please try again.');
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Show error message
      const toast = document.createElement('div');
      toast.className = 'toast-notification error';
      toast.innerHTML = '<i class="bi bi-exclamation-circle me-2"></i>Failed to update profile. Please try again.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatWorkoutTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await fetch(BACKEND_ROUTES_API + "UploadProfilePicture.php", {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const result = await response.json();
      if (result.success && result.imageUrl) {
        setProfileData(prev => ({ ...prev, profile_photo: result.imageUrl }));
        setEditData(prev => ({ ...prev, profile_photo: result.imageUrl }));
        
        // Custom event to update header profile picture
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { 
          detail: { photoUrl: result.imageUrl } 
        }));

        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = '<i class="bi bi-check-circle me-2"></i>Profile photo updated!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } else {
        throw new Error(result.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      const toast = document.createElement('div');
      toast.className = 'toast-notification error';
      toast.innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>${error.message || 'Failed to upload photo'}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <TraineeDashboard>
      <div className="profile-page">
      {/* Main Content */}
      <main className="container-fluid px-4 py-4 pb-5" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {/* Profile Header Card */}
        <div className="row mb-4 position-relative" style={{ zIndex: 10 }}>
          <div className="col-12">
            <div className="profile-card border-0 rounded-4">
              <div className="position-relative">
                {/* Profile Actions - Top Right */}
                {isOwnProfile && (
                  <div className="position-absolute top-0 end-0 p-3" style={{zIndex: 100}}>
                    
                    {/* Desktop Actions */}
                    <div className="profile-actions-top d-none d-md-flex gap-2">
                      {isEditing ? (
                        <>
                          <button 
                            className="btn rounded-pill px-4"
                            onClick={handleSaveProfile}
                            style={{
                              backgroundColor: 'var(--brand-primary)',
                              color: 'var(--brand-dark)',
                              border: 'none',
                              fontWeight: '600'
                            }}
                          >
                            <i className="bi bi-check-lg me-1"></i>Save
                          </button>
                          <button 
                            className="btn btn-outline-light rounded-pill px-4"
                            onClick={() => {
                              setIsEditing(false);
                              setEditData({ ...profileData, password: '', confirmPassword: '' });
                            }}
                          >
                            <i className="bi bi-x-lg me-1"></i>Cancel
                          </button>
                        </>
                      ) : (
                        <button 
                          className="btn btn-primary btn-sm rounded-pill"
                          onClick={() => setIsEditing(true)}
                        >
                          <i className="bi bi-pencil me-1"></i>Edit
                        </button>
                      )}
                      <LogoutButton className="btn btn-outline-danger btn-sm rounded-pill" />
                    </div>

                    {/* Mobile Kebab Menu */}
                    <div className="mobile-actions-container d-md-none position-relative">
                      <button 
                        className="mobile-dots-btn"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                      >
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      
                      {showMobileMenu && (
                        <div className="mobile-dropdown-menu shadow-lg">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => { handleSaveProfile(); setShowMobileMenu(false); }}
                              >
                                <i className="bi bi-check-lg me-2 text-primary"></i>Save
                              </button>
                              <button 
                                onClick={() => { handleCancelEdit(); setShowMobileMenu(false); }}
                              >
                                <i className="bi bi-x-lg me-2 text-light"></i>Cancel
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => { setIsEditing(true); setShowMobileMenu(false); }}
                            >
                              <i className="bi bi-pencil me-2 text-primary"></i>Edit
                            </button>
                          )}
                          <div className="mobile-logout-btn" onClick={() => setShowMobileMenu(false)}>
                            <LogoutButton className="btn btn-outline-danger btn-sm w-100 rounded-pill" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cover Photo */}
                <div 
                  className="profile-header-gradient position-relative rounded-4"
                  style={{height: '200px'}}
                >
                  <div className="position-absolute bottom-0 start-0 w-100 h-100 d-flex align-items-end p-4" style={{zIndex: 2}}>
                    <div className="d-flex align-items-end w-100">
                      {/* Profile Photo */}
                      <div className="profile-photo-container me-4 position-relative">
                        <img
                          src={profileData.profile_photo}
                          alt={profileData.full_name}
                          className="rounded-circle border border-4 border-white shadow-lg"
                          style={{width: '120px', height: '120px', objectFit: 'cover'}}
                        />
                        {isOwnProfile && isEditing && (
                          <>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handlePhotoUpload} 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                            />
                            <button 
                              className="profile-photo-edit-btn position-absolute bottom-0 end-0 rounded-circle btn btn-primary d-flex align-items-center justify-content-center p-0"
                              style={{ width: '32px', height: '32px', transform: 'translate(10%, -10%)' }}
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingPhoto}
                            >
                              {isUploadingPhoto ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <i className="bi bi-camera-fill"></i>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Basic Info */}
                      <div className="text-white flex-grow-1">
                        <h2 className="h3 text-light mb-1 fw-bold">{profileData.full_name}</h2>
                        <p className="mb-2 text-light opacity-50">@{profileData.username}</p>
                        <div className="d-flex flex-wrap gap-3 profile-stats">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person-badge me-1"></i>
                            <small className="text-capitalize">{currentUser?.role}</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-calendar3 me-1"></i>
                            <small>Member since {formatDate(profileData.member_since)}</small>
                          </div>
                          {currentUser?.role === 'trainee' && (
                            <>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-lightning-fill me-1"></i>
                                <small>{profileData.workouts_completed} workouts</small>
                              </div>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-clock-fill me-1"></i>
                                <small>{formatWorkoutTime(profileData.total_workout_time)} total</small>
                              </div>
                            </>
                          )}
                          {currentUser?.role === 'trainer' && (
                            <div className="d-flex align-items-center">
                              <i className="bi bi-people-fill me-1"></i>
                              <small>{profileData.clients?.length || 0} active clients</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Completion (mobile: on top) */}
        {showCompletionWidget && (
          <div className="d-lg-none mb-4">
            {renderCompletionCard()}
          </div>
        )}

        {/* Profile Content */}
        <div className="row g-4">
          {/* Main Content */}
          <div className={hasSidebarContent ? 'col-lg-8' : 'col-12'}>
            {/* Personal Information */}
            <div className="profile-card border-0 rounded-4 mb-4">
              <div className="card-header bg-white border-0 p-4">
                <h5 className="card-title mb-0 fw-semibold">
                  Personal Information
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-white-50 small">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control modern-input"
                        value={editData.full_name || ''}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                      />
                    ) : (
                      <p className="mb-0 text-white fw-medium">{profileData.full_name || 'Not set'}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-white-50 small">Email</label>
                    <p className="mb-0 text-white fw-medium">{profileData.email}</p>
                    {isOwnProfile && <small className="text-white-50">Contact admin to change email</small>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-white-50 small">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="form-control modern-input"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="mb-0 text-white fw-medium">{profileData.phone || 'Not set'}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-white-50 small">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control modern-input"
                        value={editData.date_of_birth || ''}
                        onChange={(e) => setEditData({...editData, date_of_birth: e.target.value})}
                      />
                    ) : (
                      <p className="mb-0 text-white fw-medium">{formatDate(profileData.date_of_birth)}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-white-50 small">Age</label>
                    {isEditing ? (
                      <input
                        type="number"
                        className="form-control modern-input"
                        value={editData.age || ''}
                        onChange={(e) => setEditData({...editData, age: e.target.value})}
                        placeholder="Enter your age"
                        min="13"
                        max="120"
                      />
                    ) : (
                      <p className="mb-0 text-white fw-medium">{profileData.age ? `${profileData.age} years old` : 'Not set'}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-white-50 small">Sex</label>
                    {isEditing ? (
                      <select
                        className="form-select modern-input"
                        value={editData.sex || ''}
                        onChange={(e) => setEditData({...editData, sex: e.target.value})}
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    ) : (
                      <p className="mb-0 text-white fw-medium">{
                        profileData.sex ? 
                        (profileData.sex === 'prefer_not_to_say' ? 'Prefer not to say' : 
                         profileData.sex.charAt(0).toUpperCase() + profileData.sex.slice(1)) : 
                        'Not set'
                      }</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Role-specific Information */}
            {currentUser?.role === 'trainer' && (
              <div className="profile-card border-0 rounded-4 mb-4">
                <div className="card-header bg-white border-0 p-4">
                  <h5 className="card-title mb-0 fw-semibold">
                    <i className="bi bi-award me-2 text-success"></i>Professional Information
                  </h5>
                </div>
                <div className="card-body p-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-white-50 small">Specialization</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control modern-input"
                          value={editData.specialization || ''}
                          onChange={(e) => setEditData({...editData, specialization: e.target.value})}
                          placeholder="e.g., Weight Training, Cardio, Yoga"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.specialization || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-white-50 small">Experience (Years)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control modern-input"
                          value={editData.experience_years || ''}
                          onChange={(e) => setEditData({...editData, experience_years: e.target.value})}
                          min="0"
                          max="50"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.experience_years ? `${profileData.experience_years} years` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium text-white-50 small">Certifications</label>
                      {isEditing ? (
                        <textarea
                          className="form-control modern-input"
                          rows="3"
                          value={editData.certifications || ''}
                          onChange={(e) => setEditData({...editData, certifications: e.target.value})}
                          placeholder="List your certifications (e.g., NASM-CPT, ACE-CPT, etc.)"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.certifications || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium text-white-50 small">Bio</label>
                      {isEditing ? (
                        <textarea
                          className="form-control modern-input"
                          rows="4"
                          value={editData.bio || ''}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          placeholder="Tell us about yourself and your training philosophy..."
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.bio || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentUser?.role === 'trainee' && (
              <div className="profile-card border-0 rounded-4 mb-4">
                <div className="card-header bg-white border-0 p-4">
                  <h5 className="card-title mb-0 fw-semibold">
                    Fitness Profile
                  </h5>
                </div>
                <div className="card-body p-4">
                  <div className="row g-4">
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small">Height (cm)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control modern-input"
                          value={editData.height || ''}
                          onChange={(e) => setEditData({...editData, height: e.target.value})}
                          placeholder="170"
                          min="100"
                          max="250"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.height ? `${profileData.height} cm` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small">Weight (kg)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control modern-input"
                          value={editData.weight || ''}
                          onChange={(e) => setEditData({...editData, weight: e.target.value})}
                          placeholder="70"
                          min="30"
                          max="300"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.weight ? `${profileData.weight} kg` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small">Body Fat %</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control modern-input"
                          value={editData.body_fat || ''}
                          onChange={(e) => setEditData({...editData, body_fat: e.target.value})}
                          placeholder="15"
                          min="1"
                          max="80"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.body_fat ? `${profileData.body_fat}%` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small">Muscle Mass (kg)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control modern-input"
                          value={editData.muscle_mass || ''}
                          onChange={(e) => setEditData({...editData, muscle_mass: e.target.value})}
                          placeholder="35"
                          min="1"
                          max="150"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.muscle_mass ? `${profileData.muscle_mass} kg` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small d-flex align-items-center">
                        Chest (cm)
                        <i className="bi bi-exclamation-circle ms-1" style={{ cursor: 'help' }} title="Measure around the fullest part of your chest, keeping the tape horizontal."></i>
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control modern-input"
                          value={editData.chest || ''}
                          onChange={(e) => setEditData({...editData, chest: e.target.value})}
                          placeholder="100"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.chest ? `${profileData.chest} cm` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small d-flex align-items-center">
                        Waist (cm)
                        <i className="bi bi-exclamation-circle ms-1" style={{ cursor: 'help' }} title="Measure around your natural waistline, typically just above your belly button."></i>
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control modern-input"
                          value={editData.waist || ''}
                          onChange={(e) => setEditData({...editData, waist: e.target.value})}
                          placeholder="85"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.waist ? `${profileData.waist} cm` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small d-flex align-items-center">
                        Hips (cm)
                        <i className="bi bi-exclamation-circle ms-1" style={{ cursor: 'help' }} title="Measure around the fullest part of your hips and buttocks."></i>
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control modern-input"
                          value={editData.hips || ''}
                          onChange={(e) => setEditData({...editData, hips: e.target.value})}
                          placeholder="95"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.hips ? `${profileData.hips} cm` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small">Fitness Goals</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control modern-input"
                          value={editData.fitness_goals || ''}
                          onChange={(e) => setEditData({...editData, fitness_goals: e.target.value})}
                          placeholder="e.g., Weight Loss, Muscle Gain, Endurance"
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.fitness_goals || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium text-white-50 small">Experience Level</label>
                      {isEditing ? (
                        <select
                          className="form-select modern-input"
                          value={editData.experience_level || ''}
                          onChange={(e) => setEditData({...editData, experience_level: e.target.value})}
                        >
                          <option value="">Select level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.experience_level || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium text-white-50 small">Medical Notes & Considerations</label>
                      {isEditing ? (
                        <textarea
                          className="form-control modern-input"
                          rows="3"
                          value={editData.medical_notes || ''}
                          onChange={(e) => setEditData({...editData, medical_notes: e.target.value})}
                          placeholder="Any injuries, limitations, or medical considerations..."
                        />
                      ) : (
                        <p className="mb-0 text-white fw-medium">{profileData.medical_notes || 'None specified'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Change Password (Visible during Edit) */}
            {isOwnProfile && isEditing && (
              <div className="profile-card border-0 rounded-4 mb-4">
                <div className="card-header bg-white border-0 p-4">
                  <h5 className="card-title mb-0 fw-semibold">
                    <i className="bi bi-key-fill me-2 text-primary"></i>Change Password
                  </h5>
                </div>
                <div className="card-body p-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-white-50 small">New Password</label>
                      <input
                        type="password"
                        className="form-control modern-input"
                        value={editData.password || ''}
                        onChange={(e) => setEditData({...editData, password: e.target.value})}
                        placeholder="Leave blank to keep password"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-white-50 small">Confirm Password</label>
                      <input
                        type="password"
                        className="form-control modern-input"
                        value={editData.confirmPassword || ''}
                        onChange={(e) => setEditData({...editData, confirmPassword: e.target.value})}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          {hasSidebarContent && (
          <div className={sidebarOnlyCompletion ? 'col-lg-4 d-none d-lg-block' : 'col-lg-4'}>
            {/* Completion (desktop: right sidebar) */}
            {showCompletionWidget && (
              <div className="d-none d-lg-block mb-4">
                {renderCompletionCard()}
              </div>
            )}
            {/* Quick Actions */}
            {!isOwnProfile && (
              <div className="profile-card border-0 rounded-4 mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">
                    <i className="bi bi-lightning me-2 text-warning"></i>Quick Actions
                  </h6>
                  <div className="d-grid gap-2">
                    {currentUser?.role === 'trainee' && (
                      <>
                        <button className="btn btn-outline-secondary rounded-pill">
                          <i className="bi bi-calendar-check me-2"></i>View Program
                        </button>
                        <button className="btn btn-outline-secondary rounded-pill">
                          <i className="bi bi-graph-up me-2"></i>View Progress
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trainer Info (for trainees) */}
            {currentUser?.role === 'trainee' && profileData.assigned_trainer && (
              <div className="profile-card border-0 rounded-4 mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">
                    <i className="bi bi-person-badge me-2 text-primary"></i>Your Trainer
                  </h6>
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src="/src/assets/images/default-avatar.png"
                      alt={profileData.assigned_trainer.name}
                      className="rounded-circle me-3"
                      style={{width: '48px', height: '48px', objectFit: 'cover'}}
                    />
                    <div>
                      <p className="fw-medium mb-0">{profileData.assigned_trainer.name}</p>
                      <small className="text-white-50">Personal Trainer</small>
                    </div>
                  </div>
                  <Link 
                    to={`/user/${profileData.assigned_trainer.username}`}
                    className="btn btn-outline-primary btn-sm w-100 rounded-pill"
                  >
                    <i className="bi bi-person me-2"></i>View Trainer Profile
                  </Link>
                </div>
              </div>
            )}

            {/* Client List (for trainers) */}
            {currentUser?.role === 'trainer' && profileData.clients && profileData.clients.length > 0 && (
              <div className="profile-card border-0 rounded-4 mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">
                    <i className="bi bi-people me-2 text-success"></i>My Clients ({profileData.clients.length})
                  </h6>
                  <div className="d-flex flex-column gap-2">
                    {profileData.clients.slice(0, 5).map((client, index) => (
                      <Link
                        key={index}
                        to={`/user/${client.username}`}
                        className="d-flex align-items-center text-decoration-none p-2 rounded-3 client-hover-item"
                      >
                        <img
                          src="/src/assets/images/default-avatar.png"
                          alt={client.name}
                          className="rounded-circle me-3"
                          style={{width: '32px', height: '32px', objectFit: 'cover'}}
                        />
                        <span className="text-white fw-medium">{client.name}</span>
                        <i className="bi bi-chevron-right ms-auto text-white-50"></i>
                      </Link>
                    ))}
                    {profileData.clients.length > 5 && (
                      <button className="btn btn-outline-secondary btn-sm rounded-pill mt-2">
                        View All {profileData.clients.length} Clients
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Current Program (for trainees) */}
            {currentUser?.role === 'trainee' && profileData.current_program && (
              <div className="profile-card border-0 rounded-4 mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-2">
                    <i className="bi bi-clipboard-data me-2 text-info"></i>Current Program
                  </h6>
                  <p className="mb-3 fw-medium">{profileData.current_program}</p>
                  <button className="btn btn-info btn-sm w-100 rounded-pill">
                    <i className="bi bi-eye me-2"></i>View Program Details
                  </button>
                </div>
              </div>
            )}

          </div>
          )}
        </div>

        {/* Bottom Action Buttons (Visible during Edit) */}
        {isOwnProfile && isEditing && (
          <div className="row mt-4 mb-2">
            <div className="col-12">
              <div className="d-flex justify-content-end gap-3">
                <button 
                  className="btn rounded-pill px-4"
                  style={{ backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' }}
                  onClick={() => {
                    handleCancelEdit();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <i className="bi bi-x-lg me-2"></i>Cancel
                </button>
                <button 
                  className="btn rounded-pill px-4"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--brand-dark)',
                    border: 'none',
                    fontWeight: '600'
                  }}
                  onClick={handleSaveProfile}
                >
                  <i className="bi bi-check-lg me-2"></i>Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation provided by TraineeDashboard */}
      </div>
    </TraineeDashboard>
  );
};

export default ProfilePage;
