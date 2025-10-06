/**
 * Component for handling password reset after receiving reset token
 * Validates token, manages password update form, and handles submission
 */
import { BACKEND_ROUTES_API } from "../../config/config";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function ChangePasswordAfterReset() {
  // Navigation and URL parameter handling
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // State management for messages and loading states
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Effect hook to validate reset token on component mount
   * Redirects to reset password page if token is invalid or expired
   */
  useEffect(() => {
    if (!token || !email) {
      navigate("/reset-password");
      return;
    }

    const checkToken = async () => {
      try {
        const response = await fetch(
          BACKEND_ROUTES_API +
            `VerifyResetPassToken.php?token=${token}&email=${encodeURIComponent(
              email
            )}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (!data.success) {
          //Show that token is invalid
          setSuccessMessage(
            "The password reset link has expired. Redirecting to request a new link..."
          );
          setTimeout(() => {
            navigate("/reset-password");
          }, 2500);
        } else {
          // If token is valid, set isLoading to false
          setIsLoading(false);
        }
      } catch (error) {
        navigate("/reset-password");
      }
    };

    checkToken();
  }, [token, email, navigate]);

  // Form state management
  const [formData, setFormData] = useState({
    password: "",
    confpassword: "",
  });

  // Form validation error state
  const [errors, setErrors] = useState({
    password: "",
    confpassword: "",
  });

  // State to handle password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);

  // Handle input changes and validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    //clear all the field errors
    setErrors((prev) => ({
      ...prev,
      confpassword: "",
      password: "",
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      password: "",
      confpassword: "",
    };

    const { password, confpassword } = formData;

    // Validate password strength
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/\d/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one special character";
    }

    // Validate confirmation
    if (!confpassword) {
      newErrors.confpassword = "Please confirm your password";
    } else if (confpassword !== password) {
      newErrors.confpassword = "Passwords do not match";
    }

    setErrors(newErrors);

    // Stop submission if any error exists
    if (newErrors.password || newErrors.confpassword) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        BACKEND_ROUTES_API + "ResetPasswordNewPassword.php",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          // Send email, token, and new password to server
          body: JSON.stringify({
            email: email,
            token: token,
            password: formData.password,
          }),
        }
      );
      // Handle server response
      const data = await response.json();
      if (data.success) {
        // Show success message and redirect to login page
        setSuccessMessage(
          "Password updated successfully! Redirecting to login page..."
        );
        setTimeout(() => navigate("/login"), 2000);
      } else {
        // Show error message if token is invalid
        setErrorMessage("The link has expired. Please request a new link.");
        setTimeout(() => navigate("/reset-password"), 2000);
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form
  if (isLoading) {
    return (
      // Show loading spinner while validating token
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        {successMessage && (
          <div className="alert alert-danger text-center mb-3">
            {successMessage}
          </div>
        )}
      </div>
    );
  } else {
    // Show password reset form
    return (
      <>
        <div
          className="container d-flex flex-column justify-content-center align-items-center"
          style={{ height: "75vh" }}
        >
          <form
            className="p-4 border rounded shadow"
            onSubmit={handleSubmit}
            style={{ width: "100%", maxWidth: "500px", minWidth: "200px" }}
          >
            <h3 className="text-center mb-4">New Password</h3>
            {/* Password input */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className={`form-control password-field ${
                    errors.password
                      ? "is-invalid"
                      : formData.password
                      ? "is-valid"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    zIndex: 5,
                    right: '10px',
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  <i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"} text-muted`}></i>
                </button>
              </div>
              {errors.password && (
                <div className="invalid-feedback d-block">{errors.password}</div>
              )}
            </div>
            {/* Confirm password input */}
            <div className="mb-3">
              <label htmlFor="confpassword" className="form-label">
                Confirm Password
              </label>
              <div className="position-relative">
                <input
                  type={showConfPassword ? "text" : "password"}
                  name="confpassword"
                  value={formData.confpassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className={`form-control password-field ${
                    errors.confpassword
                      ? "is-invalid"
                      : formData.confpassword
                      ? "is-valid"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
                  onClick={() => setShowConfPassword(!showConfPassword)}
                  style={{ 
                    zIndex: 5,
                    right: '10px',
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  <i className={`bi ${showConfPassword ? "bi-eye" : "bi-eye-slash"} text-muted`}></i>
                </button>
              </div>
              {errors.confpassword && (
                <div className="invalid-feedback d-block">{errors.confpassword}</div>
              )}
            </div>

            {successMessage && (
              <div className="alert alert-success text-center mb-3">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="alert alert-danger text-center mb-3">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-100 mt-1"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </>
    );
  }
}

export default ChangePasswordAfterReset;
