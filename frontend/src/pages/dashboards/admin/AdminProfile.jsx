import React, { useState, useEffect, useRef } from 'react';
import AdminDashboardLayout from '../../../components/AdminDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    profileImage: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile(true);
  }, []);

  const fetchProfile = async (showPageLoader = false) => {
    try {
      if (showPageLoader) setLoading(true);
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetAdminProfile.php`);
      
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          username: response.profile.username || '',
          fullName: response.profile.full_name || response.profile.username || '',
          email: response.profile.email || '',
          phone: response.profile.phone || '',
          profileImage: response.profile.profile_image || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      if (showPageLoader) setLoading(false);
    }
  };

  const handleResetProfile = async () => {
    try {
      setResetting(true);
      setErrorMsg('');
      setProfile(prev => ({...prev, password: '', confirmPassword: ''}));
      await fetchProfile(false);
    } finally {
      setResetting(false);
    }
  };

    const handleSaveProfile = async () => {
      setErrorMsg('');
      if (profile.password && profile.password !== profile.confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }

      try {
        setSaving(true);

        const response = await fetch(`${BACKEND_ROUTES_API}UpdateAdminProfile.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: profile.fullName,
            username: profile.username,
            email: profile.email,
            phone: profile.phone,
            password: profile.password
          }),
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
          setSuccessMessage('Profile updated successfully!');
          setShowSuccessModal(true);
          setProfile(prev => ({...prev, password: '', confirmPassword: ''}));
        } else {
          setErrorMsg(result.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        setErrorMsg('Failed to save profile. Please check your connection and try again.');
      } finally {
        setSaving(false);
    }
  };

  const handleProfileImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await APIClient.fetch(`${BACKEND_ROUTES_API}UploadProfilePicture.php`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setProfile(prev => ({ ...prev, profileImage: result.imageUrl || prev.profileImage }));
        setSuccessMessage('Profile image updated successfully!');
        setShowSuccessModal(true);
      } else {
        alert(result.message || 'Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload image. Please check your connection and try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <AdminDashboardLayout title="Profile">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border" style={{ color: '#10b981' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout title="Admin Profile">
      <div className="container-fluid py-4">
        
        {errorMsg && (
          <div className="alert alert-danger" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="row g-4">
          {/* Profile Image & Quick Info Card */}
          <div className="col-12 col-lg-4">
            <div className="card h-100 border-0" style={{ backgroundColor: '#212121' }}>
              <div className="card-body text-center p-4">
                <div className="mb-4 position-relative">
                  <div 
                    className="rounded-circle overflow-hidden mx-auto"
                    onClick={handleProfileImageClick}
                    title="Click to upload profile image"
                    style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer', width: '150px', height: '150px', border: '3px solid #10b981' }}
                  >
                    {profile.profileImage ? (
                      <img 
                        src={profile.profileImage}
                        alt="Profile" 
                        className="w-100 h-100 placeholder-glow"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary">
                        <i className="bi bi-person text-white" style={{ fontSize: '4rem' }}></i>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <span className="spinner-border text-light" role="status"></span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="d-none"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleProfileImageUpload}
                    disabled={uploadingImage}
                  />
                  <small className="text-muted d-block mt-3">
                    {uploadingImage ? 'Uploading image...' : 'Click image to upload new picture'}
                  </small>
                </div>

                <h5 className="mb-1 text-white">{profile.fullName || 'Admin'}</h5>
                <p className="small mb-3 text-muted">{profile.email}</p>
                <div className="badge bg-success">Administrator</div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form Card */}
          <div className="col-12 col-lg-8">
            <div className="card border-0" style={{ backgroundColor: '#212121' }}>
              <div className="card-header border-bottom border-secondary bg-transparent p-4">
                <h5 className="card-title mb-0 text-white"><i className="bi bi-person-lines-fill me-2"></i>Edit Profile Details</h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  {/* Basic Info */}
                  <div className="col-md-6">
                    <label className="form-label text-white">Username</label>
                    <input 
                      type="text" 
                      className="form-control bg-dark border-secondary text-white"
                      value={profile.username}
                      name="username"
                      onChange={handleInputChange}
                      
                    />
                    <small className="text-muted">This is used for logging in</small>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-white">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control bg-dark border-secondary text-white"
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white">Email</label>
                    <input 
                      type="email" 
                      className="form-control bg-dark border-secondary text-white"
                      name="email"
                      value={profile.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white">Phone</label>
                    <input 
                      type="tel" 
                      className="form-control bg-dark border-secondary text-white"
                      name="phone"
                      value={profile.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12 mt-5">
                    <h6 className="text-white border-bottom border-secondary pb-2 mb-3">Change Password</h6>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white">New Password</label>
                    <input 
                      type="password" 
                      className="form-control bg-dark border-secondary text-white"
                      name="password"
                      placeholder="Leave blank to keep current password"
                      value={profile.password}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="form-control bg-dark border-secondary text-white"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={profile.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>

                </div>

                {/* Form Actions */}
                <div className="d-flex justify-content-end gap-3 mt-5">
                  <button 
                    className="btn btn-outline-secondary px-4 px-5"
                    onClick={handleResetProfile}
                    disabled={saving || resetting}
                  >
                    {resetting ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : 'Reset Changes'}
                  </button>
                  <button 
                    className="btn px-5 text-white"
                    style={{ backgroundColor: '#10b981' }}
                    onClick={handleSaveProfile}
                    disabled={saving || resetting}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0" style={{ backgroundColor: '#212121' }}>
                <div className="modal-body text-center p-5">
                  <div className="mb-4">
                    <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="text-white mb-3">Changes Saved!</h4>
                  <p className="text-muted mb-4">{successMessage}</p>
                  <button 
                    className="btn w-100 text-white" 
                    style={{ backgroundColor: '#10b981' }}
                    onClick={() => setShowSuccessModal(false)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminProfile;
