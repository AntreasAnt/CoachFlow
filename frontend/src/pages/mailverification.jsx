/*
 * MailVerification Component
 *
 * This component handles email verification after user registration.
 * It allows users to:
 * - Enter a 5-digit verification code sent to their email
 * - Resend the verification code after a cooldown period
 * - Verify their email address to complete registration
 *
 * The component includes countdown timer for resend functionality
 * and form validation for the verification code.
 */
import { BACKEND_ROUTES_API } from "../config/config.js";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function MailVerification() {
  // Router hooks for navigation and accessing route state
  const location = useLocation();
  const navigate = useNavigate();
  const { email, username } = location.state || {};

  // State management
  const [successMessage, setSuccessMessage] = useState(""); // Stores success messages
  const [timeLeft, setTimeLeft] = useState(60); // Countdown timer for resend
  const [canResend, setCanResend] = useState(false); // Controls resend button state
  const [errors, setErrors] = useState(""); // Stores error messages
  const [isVerifying, SetisVerifying] = useState(false); // Loading state for verification
  const [isResending, SetisResending] = useState(false); // Loading state for resend

  // Form data state
  const [formData, setFormData] = useState({
    token: "",
  });

  // Redirect to signup if no email is present
  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

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

  // Handle input changes and validation
  const handleChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    // Clear any existing errors when user types
    if (errors) {
      setErrors("");
    }
  };

  // Handle form submission for code verification
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    if (!formData.token) {
      setErrors("Please enter the verification code");
      return;
    }

    if (formData.token.length !== 5) {
      setErrors("The code must be exactly 5 digits");
      return;
    }

    try {
      // Prepare data for API call
      const dataToSend = {
        email,
        token: formData.token,
      };

      SetisVerifying(true);

      // Make API call to verify token
      const response = await fetch(
        BACKEND_ROUTES_API + "TokenConfirmation.php",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(dataToSend),
        }
      );

      const data = await response.json();
      SetisVerifying(false);
      console.log(data);
      // Handle response
      if (data.success) {
        // Store user data in localStorage or context
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/login");
      } else if (data.success === false) {
        setErrors(data.message || "Verification failed");
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      setErrors("An error occurred during registration. Please try again.");
    }
  };

  // Handle resending verification code
  const handleResendCode = async () => {
    if (!canResend) return;
    SetisResending(true);

    try {
      // Make API call to resend verification code
      const response = await fetch(
        BACKEND_ROUTES_API + "ResendConfirmationToken.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: email,
            username: username,
          }),
        }
      );

      const data = await response.json();
      SetisResending(false);
      // Handle response
      if (data) {
        setTimeLeft(60);
        setCanResend(false);
        setSuccessMessage("The code was resent successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        setErrors(""); // Clear any existing errors
      } else {
        setErrors(data.message || "Failed to resend verification code");
        setSuccessMessage(""); // Clear any existing success message
      }
    } catch (error) {
      console.error("Resend error:", error);
      setErrors("An error occurred while resending the code");
      setSuccessMessage("");
    }
  };

  // Render component UI
  return (
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
        <h3 className="text-center mb-4" style={{ color: 'var(--brand-white)', fontWeight: '700', fontSize: '2rem' }}>Email Verification</h3>

        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Please enter the verification code that was sent to{" "}
          <span style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>{email}</span>
        </p>

        {/* Code input field */}
        <div className="mb-3">
          <label htmlFor="token" className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
            Verification Code
          </label>
          <input
            type="text"
            name="token"
            value={formData.token}
            onChange={handleChange}
            placeholder="Enter the code"
            className={`form-control ${
              errors ? "is-invalid" : formData.token ? "is-valid" : ""
            }`}
            style={{
              backgroundColor: 'rgba(247, 255, 247, 0.05)',
              border: '1px solid rgba(74, 74, 90, 0.3)',
              color: 'var(--brand-white)',
              padding: '0.75rem 1rem',
              borderRadius: '12px'
            }}
          />
          {/* Error message */}
          {errors && <div className="invalid-feedback">{errors}</div>}
          {successMessage && (
            <div className="valid-feedback d-block text-success">
              {successMessage}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isVerifying}
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
          {isVerifying ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </button>
      </form>
      {/* Resend button */}
      <button
        type="button"
        className="btn mt-3"
        disabled={!canResend || isResending}
        onClick={handleResendCode}
        style={{ 
          textDecoration: !canResend ? 'none' : 'underline',
          color: !canResend ? 'var(--text-secondary)' : 'var(--brand-primary)',
          backgroundColor: 'transparent',
          border: 'none',
          fontWeight: '500'
        }}
      >
        {/* Timer for resent availability*/}
        {!canResend ? (
          `Resend available in ${timeLeft}s`
        ) : isResending ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Resending...
          </>
        ) : (
          "Resend Code"
        )}
      </button>
    </div>
  );
}

export default MailVerification;
