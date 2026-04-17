import React, { useState, useEffect, useRef } from 'react';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const TrainerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    specializations: [],
    certifications: '',
    yearsOfExperience: '',
    profileImage: '',
    instagram: '',
    facebook: '',
    twitter: '',
    youtube: '',
    linkedin: '',
    website: ''
  });

  const [newSpecialization, setNewSpecialization] = useState('');

  useEffect(() => {
    fetchProfile(true);
  }, []);

  const fetchProfile = async (showPageLoader = false) => {
    try {
      if (showPageLoader) setLoading(true);
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerProfile.php`);
      
      if (response.success) {
        setProfile({
          username: response.profile.username || '',
          fullName: response.profile.full_name || response.profile.username || '',
          email: response.profile.email || '',
          phone: response.profile.phone || '',
          bio: response.profile.bio || '',
          specializations: JSON.parse(response.profile.specializations || '[]'),
          certifications: response.profile.certifications || '',
          yearsOfExperience: response.profile.years_of_experience || '',
          profileImage: response.profile.profile_image || '',
          instagram: response.profile.instagram || '',
          facebook: response.profile.facebook || '',
          twitter: response.profile.twitter || '',
          youtube: response.profile.youtube || '',
          linkedin: response.profile.linkedin || '',
          website: response.profile.website || ''
        });
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
      await fetchProfile(false);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const response = await APIClient.post(`${BACKEND_ROUTES_API}UpdateTrainerProfile.php`, {
        fullName: profile.fullName,
        phone: profile.phone,
        bio: profile.bio,
        specializations: JSON.stringify(profile.specializations),
        certifications: profile.certifications,
        yearsOfExperience: profile.yearsOfExperience,
        instagram: profile.instagram,
        facebook: profile.facebook,
        twitter: profile.twitter,
        youtube: profile.youtube,
        linkedin: profile.linkedin,
        website: profile.website
      });

      if (response.success) {
        setSuccessMessage('Profile updated successfully!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
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
        setSuccessMessage('Profile picture uploaded successfully!');
        setShowSuccessModal(true);
      } else {
        alert(result.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addSpecialization = () => {
    if (profile.specializations.length >= 3) {
      alert('You can only add a maximum of 3 specializations.');
      return;
    }
    if (newSpecialization.trim()) {
      setProfile({
        ...profile,
        specializations: [...profile.specializations, newSpecialization.trim()]
      });
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index) => {
    setProfile({
      ...profile,
      specializations: profile.specializations.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <TrainerDashboardLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
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
          <h2 className="mb-1 fw-bold" style={{ color: '#fff' }}>My Profile</h2>
          <p style={{ color: '#9ca3af' }}>Manage your professional profile and social media presence</p>
        </div>

        <div className="row">
          {/* Main Profile Form */}
          <div className="col-lg-9 order-2 order-lg-1">
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h5 className="mb-0 fw-semibold" style={{ color: '#fff' }}>
                  <i className="bi bi-person-circle me-2" style={{ color: '#10b981' }}></i>
                  Personal Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.username}
                      disabled
                      placeholder="Username"
                    />
                    <small className="text-muted">Username cannot be changed</small>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profile.email}
                      disabled
                      placeholder="your@email.com"
                    />
                    <small className="text-muted">Email cannot be changed</small>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Years of Experience</label>
                    <input
                      type="number"
                      className="form-control number-input-light-arrows"
                      value={profile.yearsOfExperience}
                      onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })}
                      placeholder="5"
                      min="0"
                    />
                    <style dangerouslySetInnerHTML={{__html: `
                      .number-input-light-arrows::-webkit-inner-spin-button,
                      .number-input-light-arrows::-webkit-outer-spin-button {
                        opacity: 1;
                        filter: invert(1);
                      }
                    `}} />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">Bio</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell clients about yourself, your training philosophy, and what makes you unique..."
                    ></textarea>
                    <small className="text-muted">{profile.bio.length}/500 characters</small>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">Certifications</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={profile.certifications}
                      onChange={(e) => setProfile({ ...profile, certifications: e.target.value })}
                      placeholder="E.g., NASM CPT, ACE, ISSA, etc."
                    ></textarea>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">Specializations</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                        placeholder="Add a specialization (e.g., Weight Loss, Bodybuilding)"
                      />
                      <button
                        className="btn btn-primary"
                        onClick={addSpecialization}
                        style={{ minWidth: '48px', height: '48px' }}
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {profile.specializations.map((spec, index) => (
                        <span key={index} className="badge bg-primary d-flex align-items-center gap-2">
                          {spec}
                          <i
                            className="bi bi-x-circle"
                            style={{ cursor: 'pointer' }}
                            onClick={() => removeSpecialization(index)}
                          ></i>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h5 className="mb-0 fw-semibold" style={{ color: '#fff' }}>
                  <i className="bi bi-share me-2" style={{ color: '#10b981' }}></i>
                  Social Media Links
                </h5>
                <small style={{ color: '#9ca3af' }}>Help clients find and connect with you on social media</small>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="bi bi-instagram text-danger me-2"></i>
                      Instagram
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.instagram}
                      onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="bi bi-facebook text-primary me-2"></i>
                      Facebook
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.facebook}
                      onChange={(e) => setProfile({ ...profile, facebook: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="bi bi-twitter text-info me-2"></i>
                      Twitter
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.twitter}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="bi bi-youtube text-danger me-2"></i>
                      YouTube
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.youtube}
                      onChange={(e) => setProfile({ ...profile, youtube: e.target.value })}
                      placeholder="https://youtube.com/yourchannel"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="bi bi-linkedin text-primary me-2"></i>
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.linkedin}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="bi bi-globe me-2"></i>
                      Website
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="d-flex justify-content-end gap-2 mb-4">
              <button
                className="btn"
                style={{ backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' }}
                onClick={handleResetProfile}
                disabled={saving || resetting}
              >
                {resetting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Reverting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Reset
                  </>
                )}
              </button>
              <button
                className="btn px-4"
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
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

          {/* Sidebar - Profile Preview */}
          <div className="col-lg-3 order-1 order-lg-2 mb-4 mb-lg-0">
            <div className="card border-0 shadow-sm position-sticky" style={{ top: '20px', borderRadius: '12px', backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="card-header border-bottom" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: '#2d2d2d', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h6 className="mb-0 fw-semibold" style={{ color: '#fff' }}>Profile Preview</h6>
              </div>
              <div className="card-body text-center">
                <div className="mb-3">
                  <div
                    onClick={handleProfileImageClick}
                    title="Click to upload profile image"
                    style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer', position: 'relative', width: '100px', margin: '0 auto' }}
                  >
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.fullName || 'Trainer'}
                        className="rounded-circle mx-auto d-block"
                        style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid rgba(16, 185, 129, 0.4)' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="rounded-circle mx-auto d-flex align-items-center justify-content-center text-white"
                        style={{ width: '100px', height: '100px', fontSize: '2.5rem', backgroundColor: '#10b981' }}
                      >
                        {profile.fullName.charAt(0) || 'T'}
                      </div>
                    )}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        position: 'absolute',
                        right: '2px',
                        bottom: '2px',
                        width: '28px',
                        height: '28px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.5)'
                      }}
                    >
                      <i className="bi bi-camera-fill" style={{ fontSize: '12px' }}></i>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    style={{ display: 'none' }}
                    onChange={handleProfileImageUpload}
                    disabled={uploadingImage}
                  />
                  <small className="text-muted d-block mt-2">
                    {uploadingImage ? 'Uploading image...' : 'Click image to upload'}
                  </small>
                </div>

                <h5 className="mb-1" style={{ color: '#fff' }}>{profile.fullName || 'Your Name'}</h5>
                <p className="small mb-3" style={{ color: '#9ca3af' }}>{profile.email}</p>

                {profile.yearsOfExperience && (
                  <p className="mb-2">
                    <span className="badge" style={{ backgroundColor: '#10b981', color: '#fff' }}>
                      {profile.yearsOfExperience} years experience
                    </span>
                  </p>
                )}

                {profile.specializations.length > 0 && (
                  <div className="mb-3">
                    {profile.specializations.map((spec, index) => (
                      <span key={index} className="badge bg-light me-1 mb-1" style={{ color: '#000' }}>
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {profile.bio && (
                  <p className="small mb-3" style={{ color: '#9ca3af' }}>{profile.bio.substring(0, 100)}...</p>
                )}

                {/* Social Media Icons */}
                {(profile.instagram || profile.facebook || profile.twitter || profile.youtube || profile.linkedin || profile.website) && (
                  <div className="d-flex justify-content-center gap-2 mt-3">
                    {profile.instagram && (
                      <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-danger">
                        <i className="bi bi-instagram"></i>
                      </a>
                    )}
                    {profile.facebook && (
                      <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-facebook"></i>
                      </a>
                    )}
                    {profile.twitter && (
                      <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                        <i className="bi bi-twitter"></i>
                      </a>
                    )}
                    {profile.youtube && (
                      <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-danger">
                        <i className="bi bi-youtube"></i>
                      </a>
                    )}
                    {profile.linkedin && (
                      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-linkedin"></i>
                      </a>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                        <i className="bi bi-globe"></i>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="modal-body text-center py-4">
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem', color: '#10b981' }}></i>
                </div>
                <h5 style={{ color: '#fff' }}>{successMessage}</h5>
                <button
                  className="btn mt-3"
                  style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                  onClick={() => setShowSuccessModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>    </TrainerDashboardLayout>
  );
};

export default TrainerProfile;
