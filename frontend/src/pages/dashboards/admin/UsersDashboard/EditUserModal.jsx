import React from "react";

export const EditUserModal = ({
  show,
  formData,
  errors,
  isSubmitting,
  isFieldModified,
  handleChange,
  handleUpdateUser,
  handleCloseModal,
}) => {
  if (!show) return null;

  return (
    <>
      <div
        className={`modal fade ${show ? "show" : ""}`}
        style={{ display: show ? "block" : "none" }}
        tabIndex="-1"
        role="dialog"
        aria-hidden={!show}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="modal-header dark-modal-header" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h5 className="modal-title" style={{ color: '#fff' }}>Edit User</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleCloseModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body" style={{ backgroundColor: '#2d2d2d' }}>
              <style>{`
                .modal-body input::placeholder,
                .modal-body input::-webkit-input-placeholder,
                .modal-body input::-moz-placeholder {
                  color: #6b7280 !important;
                  opacity: 1;
                }
              `}</style>
              <form
                onSubmit={handleUpdateUser}
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  minWidth: "200px",
                }}
              >
                {/* Name Field */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label" style={{ color: '#fff' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className={`form-control ${
                      errors.name ? 'is-invalid' : isFieldModified('name') ? 'border-success' : formData.name ? 'is-valid' : ''
                    }`}
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Username Field */}
                <div className="mb-3">
                  <label htmlFor="username" className="form-label" style={{ color: '#fff' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className={`form-control ${
                      errors.username
                        ? "is-invalid"
                        : isFieldModified("username")
                        ? "border-success"
                        : formData.username
                        ? "is-valid"
                        : ""
                    }`}
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username}</div>
                  )}
                </div>

                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label" style={{ color: '#fff' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className={`form-control ${
                      errors.email
                        ? "is-invalid"
                        : isFieldModified("email")
                        ? "border-success"
                        : formData.email
                        ? "is-valid"
                        : ""
                    }`}
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#fff' }}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                {/* Role Field */}
                <div className="mb-3">
                  <label htmlFor="role" className="form-label" style={{ color: '#fff' }}>
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`form-select ${
                      errors.role
                        ? "is-invalid"
                        : isFieldModified("role")
                        ? "border-success"
                        : formData.role
                        ? "is-valid"
                        : ""
                    }`}
                    style={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid rgba(16, 185, 129, 0.2)', 
                      color: '#fff',
                      backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3e%3cpath fill=\'none\' stroke=\'%2310b981\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m2 5 6 6 6-6\'/%3e%3c/svg%3e")'
                    }}
                  >
                    <option value="admin" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Admin</option>
                    <option value="manager" className="text-warning" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                    Manager
                    </option>
                    <option value="trainer" className="text-success" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                      Trainer
                    </option>
                    <option value="trainee" className="text-info" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                      Trainee
                    </option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none' }}
                onClick={handleCloseModal}
              >
                Close
              </button>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none' }}
                onClick={handleUpdateUser}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {show && <div className="modal-backdrop fade show"></div>}
    </>
  );
};