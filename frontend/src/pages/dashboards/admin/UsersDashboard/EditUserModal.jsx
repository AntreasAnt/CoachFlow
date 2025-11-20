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
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Επεξεργασία Χρήστη</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form
                onSubmit={handleUpdateUser}
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  minWidth: "200px",
                }}
              >
                {/* Username Field */}
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Όνομα Χρήστη
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
                        ? "border-success bg-success-subtle"
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
                        : isFieldModified("email")
                        ? "border-success bg-success-subtle"
                        : formData.email
                        ? "is-valid"
                        : ""
                    }`}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                {/* Role Field */}
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">
                    Ρόλος
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`form-select ${
                      errors.role
                        ? "is-invalid"
                        : isFieldModified("role")
                        ? "border-success bg-success-subtle"
                        : formData.role
                        ? "is-valid"
                        : ""
                    }`}
                  >
                    <option value="1">Επικεφαλής</option>
                    <option value="2" className="text-warning">
                    Διαχειριστής
                    </option>
                    <option value="3" className="text-success">
                      Χρήστης
                    </option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCloseModal}
              >
                Κλείσιμο
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleUpdateUser}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Ενημέρωση...
                  </>
                ) : (
                  "Ενημέρωση"
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