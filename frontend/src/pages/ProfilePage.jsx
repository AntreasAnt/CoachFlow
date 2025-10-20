import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BACKEND_ROUTES_API } from '../config/config';
import LogoutButton from '../components/LogoutButton';
import '../styles/ProfilePage.css';
import '../styles/trainee-dashboard.css';

const ProfilePage = () => {
  const { username: profileUsername } = useParams();
  const navigate = useNavigate();
  
  // All hooks must be declared at the top level
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [editData, setEditData] = useState(profileData);

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !profileUsername || (currentUser && profileUsername === currentUser.username);
  const displayUsername = profileUsername || (currentUser ? currentUser.username : 'unknown');

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
    setEditData(profileData);
  }, [profileData]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center profile-loading">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3 loading-pulse" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading profile...</h5>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
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
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
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
        // Update local state with the saved data
        setProfileData(editData);
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

  return (
    <div className="min-vh-100 profile-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-bottom sticky-top">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-outline-secondary me-3 rounded-pill"
                onClick={() => navigate(-1)}
              >
                <i className="bi bi-arrow-left me-2"></i>Back
              </button>
              <div>
                <h1 className="h4 mb-0 fw-bold text-dark">
                  {isOwnProfile ? 'My Profile' : `${profileData.full_name}'s Profile`}
                </h1>
                <p className="small text-muted mb-0">
                  {isOwnProfile ? 'Manage your account settings' : 'View profile information'}
                </p>
              </div>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              {isOwnProfile && (
                <>
                  {isEditing ? (
                    <>
                      <button 
                        className="btn btn-success rounded-pill"
                        onClick={handleSaveProfile}
                      >
                        <i className="bi bi-check-lg me-2"></i>Save Changes
                      </button>
                      <button 
                        className="btn btn-outline-secondary rounded-pill"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData(profileData);
                        }}
                      >
                        <i className="bi bi-x-lg me-2"></i>Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn btn-primary rounded-pill"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="bi bi-pencil me-2"></i>Edit Profile
                    </button>
                  )}
                </>
              )}
              
              <div className="dropdown">
                <button className="btn btn-outline-dark dropdown-toggle rounded-pill" type="button" data-bs-toggle="dropdown">
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow">
                  {isOwnProfile && (
                    <>
                      <li><a className="dropdown-item" href="#"><i className="bi bi-gear me-2"></i>Settings</a></li>
                      <li><a className="dropdown-item" href="#"><i className="bi bi-shield-check me-2"></i>Privacy</a></li>
                      <li><a className="dropdown-item" href="#"><i className="bi bi-bell me-2"></i>Notifications</a></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><LogoutButton className="dropdown-item text-danger" /></li>
                    </>
                  )}
                  {!isOwnProfile && (
                    <>
                      <li><a className="dropdown-item" href="#"><i className="bi bi-chat-dots me-2"></i>Send Message</a></li>
                      <li><a className="dropdown-item" href="#"><i className="bi bi-share me-2"></i>Share Profile</a></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><a className="dropdown-item text-danger" href="#"><i className="bi bi-flag me-2"></i>Report</a></li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-fluid px-4 py-4">
        {/* Profile Header Card */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="profile-card border-0 rounded-4 overflow-hidden">
              <div className="position-relative">
                {/* Cover Photo */}
                <div 
                  className="profile-header-gradient position-relative"
                  style={{height: '200px'}}
                >
                  <div className="position-absolute bottom-0 start-0 w-100 h-100 d-flex align-items-end p-4" style={{zIndex: 2}}>
                    <div className="d-flex align-items-end w-100">
                      {/* Profile Photo */}
                      <div className="profile-photo-container me-4">
                        <img
                          src={profileData.profile_photo}
                          alt={profileData.full_name}
                          className="rounded-circle border border-4 border-white shadow-lg"
                          style={{width: '120px', height: '120px', objectFit: 'cover'}}
                        />
                        {isOwnProfile && isEditing && (
                          <button className="profile-photo-edit-btn">
                            <i className="bi bi-camera-fill"></i>
                          </button>
                        )}
                      </div>
                      
                      {/* Basic Info */}
                      <div className="text-white flex-grow-1">
                        <h2 className="h3 mb-1 fw-bold">{profileData.full_name}</h2>
                        <p className="mb-2 opacity-75">@{profileData.username}</p>
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

        {/* Profile Content */}
        <div className="row g-4">
          {/* Main Content */}
          <div className="col-lg-8">
            {/* Personal Information */}
            <div className="profile-card border-0 rounded-4 mb-4">
              <div className="card-header bg-white border-0 p-4">
                <h5 className="card-title mb-0 fw-semibold">
                  <i className="bi bi-person me-2 text-primary"></i>Personal Information
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-muted small">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control modern-input"
                        value={editData.full_name || ''}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                      />
                    ) : (
                      <p className="mb-0 text-dark fw-medium">{profileData.full_name || 'Not set'}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-muted small">Email</label>
                    <p className="mb-0 text-dark fw-medium">{profileData.email}</p>
                    {isOwnProfile && <small className="text-muted">Contact admin to change email</small>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-muted small">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="form-control modern-input"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="mb-0 text-dark fw-medium">{profileData.phone || 'Not set'}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-muted small">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="form-control modern-input"
                        value={editData.date_of_birth || ''}
                        onChange={(e) => setEditData({...editData, date_of_birth: e.target.value})}
                      />
                    ) : (
                      <p className="mb-0 text-dark fw-medium">{formatDate(profileData.date_of_birth)}</p>
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
                      <label className="form-label fw-medium text-muted small">Specialization</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control modern-input"
                          value={editData.specialization || ''}
                          onChange={(e) => setEditData({...editData, specialization: e.target.value})}
                          placeholder="e.g., Weight Training, Cardio, Yoga"
                        />
                      ) : (
                        <p className="mb-0 text-dark fw-medium">{profileData.specialization || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-muted small">Experience (Years)</label>
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
                        <p className="mb-0 text-dark fw-medium">{profileData.experience_years ? `${profileData.experience_years} years` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium text-muted small">Certifications</label>
                      {isEditing ? (
                        <textarea
                          className="form-control modern-input"
                          rows="3"
                          value={editData.certifications || ''}
                          onChange={(e) => setEditData({...editData, certifications: e.target.value})}
                          placeholder="List your certifications (e.g., NASM-CPT, ACE-CPT, etc.)"
                        />
                      ) : (
                        <p className="mb-0 text-dark fw-medium">{profileData.certifications || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium text-muted small">Bio</label>
                      {isEditing ? (
                        <textarea
                          className="form-control modern-input"
                          rows="4"
                          value={editData.bio || ''}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          placeholder="Tell us about yourself and your training philosophy..."
                        />
                      ) : (
                        <p className="mb-0 text-dark fw-medium">{profileData.bio || 'Not set'}</p>
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
                    <i className="bi bi-heart-pulse me-2 text-danger"></i>Fitness Profile
                  </h5>
                </div>
                <div className="card-body p-4">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-muted small">Height (cm)</label>
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
                        <p className="mb-0 text-dark fw-medium">{profileData.height ? `${profileData.height} cm` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-muted small">Weight (kg)</label>
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
                        <p className="mb-0 text-dark fw-medium">{profileData.weight ? `${profileData.weight} kg` : 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-muted small">Fitness Goals</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control modern-input"
                          value={editData.fitness_goals || ''}
                          onChange={(e) => setEditData({...editData, fitness_goals: e.target.value})}
                          placeholder="e.g., Weight Loss, Muscle Gain, Endurance"
                        />
                      ) : (
                        <p className="mb-0 text-dark fw-medium">{profileData.fitness_goals || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium text-muted small">Experience Level</label>
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
                        <p className="mb-0 text-dark fw-medium">{profileData.experience_level || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium text-muted small">Medical Notes & Considerations</label>
                      {isEditing ? (
                        <textarea
                          className="form-control modern-input"
                          rows="3"
                          value={editData.medical_notes || ''}
                          onChange={(e) => setEditData({...editData, medical_notes: e.target.value})}
                          placeholder="Any injuries, limitations, or medical considerations..."
                        />
                      ) : (
                        <p className="mb-0 text-dark fw-medium">{profileData.medical_notes || 'None specified'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Quick Actions */}
            {!isOwnProfile && (
              <div className="profile-card border-0 rounded-4 mb-4">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">
                    <i className="bi bi-lightning me-2 text-warning"></i>Quick Actions
                  </h6>
                  <div className="d-grid gap-2">
                    <button className="btn btn-primary rounded-pill">
                      <i className="bi bi-chat-dots me-2"></i>Send Message
                    </button>
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
                      <small className="text-muted">Personal Trainer</small>
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
                        <span className="text-dark fw-medium">{client.name}</span>
                        <i className="bi bi-chevron-right ms-auto text-muted"></i>
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

            {/* Quick Stats */}
            <div className="profile-card border-0 rounded-4">
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3">
                  <i className="bi bi-graph-up me-2 text-success"></i>Quick Stats
                </h6>
                {currentUser?.role === 'trainee' ? (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded-3 bg-light">
                      <span className="text-muted small">Total Workouts:</span>
                      <span className="fw-bold text-primary">{profileData.workouts_completed}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded-3 bg-light">
                      <span className="text-muted small">Total Time:</span>
                      <span className="fw-bold text-primary">{formatWorkoutTime(profileData.total_workout_time)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light">
                      <span className="text-muted small">This Month:</span>
                      <span className="fw-bold text-success">12 Workouts</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded-3 bg-light">
                      <span className="text-muted small">Active Clients:</span>
                      <span className="fw-bold text-primary">{profileData.clients?.length || 0}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded-3 bg-light">
                      <span className="text-muted small">Experience:</span>
                      <span className="fw-bold text-primary">{profileData.experience_years || 0} Years</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light">
                      <span className="text-muted small">Member Since:</span>
                      <span className="fw-bold text-success">{new Date(profileData.member_since).getFullYear()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
