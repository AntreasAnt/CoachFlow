export const AddUserModal = ({
  show,
  formData,
  errors,
  isSubmitting,
  handleChange, 
  handleSaveUser,
  handleCloseModal,
}) => {
  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex="-1"
        role="dialog"
        aria-hidden="false"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New User</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form
                onSubmit={handleSaveUser}
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  minWidth: "200px",
                }}
              >
                {/* Username Field */}
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
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
                        : formData.username
                        ? "is-valid"
                        : ""
                    }`}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username}</div>
                  )}
                </div>
                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
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
                        : formData.email
                        ? "is-valid"
                        : ""
                    }`}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>
                {/* Password Fields */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`form-control ${
                      errors.password
                        ? "is-invalid"
                        : formData.password
                        ? "is-valid"
                        : ""
                    }`}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="confpassword" className="form-label">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confpassword"
                    value={formData.confpassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className={`form-control ${
                      errors.confpassword
                        ? "is-invalid"
                        : formData.confpassword
                        ? "is-valid"
                        : ""
                    }`}
                  />
                  {errors.confpassword && (
                    <div className="invalid-feedback">{errors.confpassword}</div>
                  )}
                </div>
                {/* Role Field */}
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`form-select ${
                      errors.role
                        ? "is-invalid"
                        : formData.role
                        ? "is-valid"
                        : ""
                    }`}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="trainer">Trainer</option>
                    <option value="trainee">Trainee</option>
                  </select>
                  {errors.role && (
                    <div className="invalid-feedback">{errors.role}</div>
                  )}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSaveUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};