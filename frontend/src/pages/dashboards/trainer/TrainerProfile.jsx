import React, { useState, useEffect } from 'react';
import TrainerDashboardLayout from '../../../components/TrainerDashboardLayout';
import { BACKEND_ROUTES_API } from '../../../config/config';
import APIClient from '../../../utils/APIClient';

const TrainerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    specializations: [],
    certifications: '',
    yearsOfExperience: '',
    profileImage: '',
    // Social Media
    instagram: '',
    facebook: '',
    twitter: '',
    youtube: '',
    linkedin: '',
    website: ''
  });

  const [newSpecialization, setNewSpecialization] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await APIClient.get(`${BACKEND_ROUTES_API}GetTrainerProfile.php`);
      
      if (response.success) {
        setProfile({
          fullName: response.profile.full_name || '',
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
      setLoading(false);
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

  const addSpecialization = () => {
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
          <h2 className="mb-1">My Profile</h2>
          <p className="text-muted">Manage your professional profile and social media presence</p>
        </div>

        <div className="row">
          {/* Main Profile Form */}
          <div className="col-lg-10">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="bi bi-person-circle me-2 text-primary"></i>
                  Personal Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
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
                      className="form-control"
                      value={profile.yearsOfExperience}
                      onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })}
                      placeholder="5"
                      min="0"
                    />
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
                    <div className="input-group mb-2">
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
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="bi bi-share me-2 text-primary"></i>
                  Social Media Links
                </h5>
                <small className="text-muted">Help clients find and connect with you on social media</small>
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
                className="btn btn-outline-secondary"
                onClick={fetchProfile}
                disabled={saving}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset
              </button>
              <button
                className="btn btn-primary px-4"
                onClick={handleSaveProfile}
                disabled={saving}
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
          <div className="col-lg-2">
            <div className="card border-0 shadow-sm position-sticky" style={{ top: '20px' }}>
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0">Profile Preview</h6>
              </div>
              <div className="card-body text-center">
                <div className="mb-3">
                  <div
                    className="rounded-circle mx-auto bg-primary d-flex align-items-center justify-content-center text-white"
                    style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}
                  >
                    {profile.fullName.charAt(0) || 'T'}
                  </div>
                </div>

                <h5 className="mb-1">{profile.fullName || 'Your Name'}</h5>
                <p className="text-muted small mb-3">{profile.email}</p>

                {profile.yearsOfExperience && (
                  <p className="mb-2">
                    <span className="badge bg-success">
                      {profile.yearsOfExperience} years experience
                    </span>
                  </p>
                )}

                {profile.specializations.length > 0 && (
                  <div className="mb-3">
                    {profile.specializations.map((spec, index) => (
                      <span key={index} className="badge bg-light text-dark me-1 mb-1">
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {profile.bio && (
                  <p className="small text-muted mb-3">{profile.bio.substring(0, 100)}...</p>
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
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-4">
                <div className="mb-3">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h5>{successMessage}</h5>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TrainerDashboardLayout>
  );
};

export default TrainerProfile;
