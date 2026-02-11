/**
 * PasswordReset Component
 * Handles the password reset flow by sending a reset token to user's email
 * Includes resend functionality with cooldown timer
 */
import { BACKEND_ROUTES_API } from "../../config/config";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function PasswordReset() {
  // Form and validation states
  const [formData, setFormData] = useState({ email: "" });
  const [errors, setErrors] = useState({ email: "" });
  // Loading and success message states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // Resend functionality states
  const [canResend, setCanResend] = useState(false); // Controls resend button state
  const [timeLeft, setTimeLeft] = useState(60); // Countdown timer for resend
  const [isResending, SetisResending] = useState(false); // Loading state for resend
  const [showResend, setShowResend] = useState(false); // Controls resend button visibility

  // Handle countdown timer for resend functionality
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error message when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      validationErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      validationErrors.email = "Please enter a valid email";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(BACKEND_ROUTES_API + "ResetPassword.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          "Please check your email for password reset instructions."
        );
        setShowResend(true);
        setTimeLeft(60);
        setCanResend(false);

        setTimeout(() => {
          setSuccessMessage("");
          setCanResend(true);
        }, 60000);
      } else {
        setSuccessMessage(
          "Please check your email for password reset instructions."
        );
        setShowResend(true);
        setTimeLeft(60);
        setCanResend(false);

        setTimeout(() => {
          setSuccessMessage("");
          setCanResend(true);
        }, 60000);
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        email: "An error occurred. Please try again.",
      }));

      setTimeout(() => {
        setErrors((prev) => ({
          ...prev,
          email: "",
        }));
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (!canResend) return;
    SetisResending(true);

    try {
      const response = await fetch(BACKEND_ROUTES_API + "ResetPassword.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(
          "The reset link has been sent! Please check your email."
        );
        setTimeLeft(60);
        setCanResend(false);

        setTimeout(() => {
          setSuccessMessage("");
          setCanResend(true);
        }, 60000);
      } else {
        setErrors((prev) => ({
          ...prev,
          email: data.message || "Failed to resend link",
        }));
      }
    } catch (error) {
      console.error("Error occurred:", error);
      setErrors((prev) => ({
        ...prev,
        email: "An error occurred. Please try again.",
      }));
    } finally {
      SetisResending(false);
    }
  };

  return (
    <>
      <div
        className="container d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh", backgroundColor: 'var(--brand-dark)', paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <form
          className="p-4 p-md-5 rounded-4"
          onSubmit={handleSubmit}
          style={{ 
            width: "100%", 
            maxWidth: "550px", 
            backgroundColor: 'rgba(15, 20, 15, 0.6)',
            border: '1px solid rgba(32, 214, 87, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h3 className="text-center mb-4" style={{ color: 'var(--brand-white)', fontWeight: '700', fontSize: '2rem' }}>Password Reset</h3>
          <p className="text-center small" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
            Having trouble logging in?
          </p>
          <p className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
            Enter your email and we'll send you instructions to reset your password.
          </p>

          {/* Display success message or email input */}
          {successMessage ? (
            <div
              className="alert alert-success text-center mb-3"
              role="alert"
            >
              {successMessage}
            </div>
          ) : (
            <div className="mb-3">
              <label htmlFor="email" className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
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
                style={{
                  backgroundColor: 'rgba(247, 255, 247, 0.05)',
                  border: '1px solid rgba(74, 74, 90, 0.3)',
                  color: 'var(--brand-white)',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px'
                }}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>
          )}

          {/* Submit button */}
          {!successMessage && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn w-100 mt-2"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--brand-dark)',
                border: 'none',
                padding: '0.875rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '1.05rem',
                boxShadow: '0 4px 16px rgba(32, 214, 87, 0.3)'
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          )}

          {/* Resend button */}
          {showResend && (
            <button
              type="button"
              className="btn text-center w-100 mt-3"
              disabled={!canResend || isResending}
              onClick={handleResendCode}
              style={{ 
                textDecoration: !canResend ? 'none' : 'underline',
                color: !canResend ? 'var(--text-secondary)' : 'var(--brand-primary)',
                backgroundColor: 'transparent',
                border: 'none'
              }}
            >
              {!canResend
                ? `Resend available in ${timeLeft}s`
                : isResending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Resending...
                    </>
                  ) : 'Resend Reset Link'}
            </button>
          )}
        </form>

        {/* Login and Sign Up links */}
        <div className="d-flex flex-column flex-sm-row align-items-center pt-3" style={{ gap: '0.5rem' }}>
          <Link to="/login" className="text-decoration-none" style={{ color: 'var(--brand-primary)', fontWeight: '500' }}>
            Login
          </Link>
          <span className="d-none d-sm-inline px-2" style={{ color: 'var(--text-secondary)' }}>|</span>
          <Link to="/signup" className="text-decoration-none" style={{ color: 'var(--brand-primary)', fontWeight: '500' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}

export default PasswordReset;
