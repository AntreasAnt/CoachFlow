/* 
  React Login Component
  ---------------------
  This component provides a login form for users to authenticate with email and password.
  It includes:
  - Form validation for email and password fields.
  - API request to authenticate users.
  - UI feedback for validation errors and submission status.
  - LocalStorage Setup
*/

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BACKEND_ROUTES_API } from "../config/config";
import { readCookie } from "../utils/csrfread";


function Login() {
  // Hook for programmatic navigation after successful registration
  const navigate = useNavigate();

  // Initialize form state with empty values
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    body: "",
  });

  // Initialize error state for form validation
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  // State to handle form submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State to handle password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Handles input changes and updates formData state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear the error for the field being changed
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      body: "", // Clear general error when user types
    }));
  };
  // Handles form submission

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    const { password } = formData;
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!minLength) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!hasUpperCase) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!hasLowerCase) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!hasNumbers) {
      newErrors.password =
        "Password must contain at least one number";
    } else if (!hasSpecialChars) {
      newErrors.password =
        "Password must contain at least one special character";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({ email: "", password: "", body: "" });

    try {
      const res = await fetch(BACKEND_ROUTES_API + "Login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": decodeURIComponent(readCookie("XSRF-TOKEN")),
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        setErrors({ ...newErrors, body: data.message });
      }
    } catch (error) {
      setIsSubmitting(false);
      setErrors({ ...newErrors, body: "An error occurred during login" });
    }
  };

  // Component render
  return (
    // Main container with flexbox for centering content
    <>

      <div
        className="container d-flex flex-column justify-content-center align-items-center "
        style={{ height: "75vh" }}
      >
        {/* Sign up form with responsive width and styling */}
        <form
          className="p-4 border rounded shadow "
          onSubmit={handleSubmit}
          style={{ width: "100%", maxWidth: "500px", minWidth: "200px" }}
        >
          {/* Form heading */}
          <h3 className="text-center mb-4">Login</h3>

          {/* Email field with validation */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`form-control ${
                errors.email ? "is-invalid" : formData.email ? "is-valid" : ""
              }`}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          {/* Password fields */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            {/* Password input with validation and eye toggle */}
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
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

          {errors.body && (
            <div className="alert alert-danger" role="alert">
              {errors.body}
            </div>
          )}

          {/* Submit button with loading state */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-100 mt-1"
          >
            {/* Loading spinner during submission if submiting is clicked */}
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="d-flex pt-2">
          <Link to="/reset-password" className="text-decoration-none">
            Forgot your password?
          </Link>
          <span className="px-2">|</span>
          <Link to="/signup" className="text-decoration-none">
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}

export default Login;
