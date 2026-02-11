import { BACKEND_ROUTES_API } from "../config/config.js";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function SignUp() {
  const navigate = useNavigate();

  const [generalError, setGeneralError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  confpassword: "",
  role: "trainee",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
  confpassword: "",
  role: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // State to handle password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear errors when typing
    if (name === "password" || name === "confpassword") {
      setErrors((prev) => ({ ...prev, password: "", confpassword: "" }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confpassword } = formData;
    const newErrors = {};

    // Username validation
    if (!username) {
      newErrors.username = "Username is required";
    } else if (username.length < 3 || username.length > 50) {
      newErrors.username = "Username must be between 3 and 50 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else {
      if (password.length < 8) {
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
    }

    // Confirm password validation
    if (confpassword !== password) {
      newErrors.confpassword = "Passwords do not match";
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select whether you are a trainer or a trainee';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date();
      const registrationDate =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

      const dataToSend = {
        username,
        email,
        password,
        registrationDate,
        role: formData.role || 'trainee',
      };

      const response = await fetch(BACKEND_ROUTES_API + "SignUp.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      setIsSubmitting(false);
      const data = await response.json();

      if (data.success === true) {
        navigate("/mailverification", { state: { email, username } });
      } else if (data.success === false) {
        setGeneralError(data.message);
        setTimeout(() => setGeneralError(""), 5000);
      } else if (typeof data === "object") {
        setErrors((prev) => ({ ...prev, ...data }));
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Unexpected error occurred:", error);
      setGeneralError("An unexpected error occurred. Please try again later.");
      setTimeout(() => setGeneralError(""), 5000);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="container d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh", backgroundColor: 'var(--brand-dark)', paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <form
          className="p-5 rounded-4"
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
          <h3 className="text-center mb-4" style={{ color: 'var(--brand-white)', fontWeight: '700', fontSize: '2rem' }}>Sign Up</h3>

          {/* Username */}
          <div className="mb-3">
            <label htmlFor="username" className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              Username <span className="text-danger">*</span>
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
              style={{
                backgroundColor: 'rgba(247, 255, 247, 0.05)',
                border: '1px solid rgba(74, 74, 90, 0.3)',
                color: 'var(--brand-white)',
                padding: '0.75rem 1rem',
                borderRadius: '12px'
              }}
            />
            {errors.username && <div className="invalid-feedback">{errors.username}</div>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              Email <span className="text-danger">*</span>
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
              style={{
                backgroundColor: 'rgba(247, 255, 247, 0.05)',
                border: '1px solid rgba(74, 74, 90, 0.3)',
                color: 'var(--brand-white)',
                padding: '0.75rem 1rem',
                borderRadius: '12px'
              }}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              Password <span className="text-danger">*</span>
            </label>
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
                style={{
                  backgroundColor: 'rgba(247, 255, 247, 0.05)',
                  border: '1px solid rgba(74, 74, 90, 0.3)',
                  color: 'var(--brand-white)',
                  padding: '0.75rem 1rem',
                  paddingRight: '3rem',
                  borderRadius: '12px'
                }}
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
            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label htmlFor="confpassword" className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              Confirm Password <span className="text-danger">*</span>
            </label>
            <div className="position-relative">
              <input
                type={showConfPassword ? "text" : "password"}
                name="confpassword"
                value={formData.confpassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={`form-control password-field ${
                  errors.confpassword
                    ? "is-invalid"
                    : formData.confpassword
                    ? "is-valid"
                    : ""
                }`}
                style={{
                  backgroundColor: 'rgba(247, 255, 247, 0.05)',
                  border: '1px solid rgba(74, 74, 90, 0.3)',
                  color: 'var(--brand-white)',
                  padding: '0.75rem 1rem',
                  paddingRight: '3rem',
                  borderRadius: '12px'
                }}
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
            {errors.confpassword && <div className="invalid-feedback d-block">{errors.confpassword}</div>}
          </div>

          {generalError && (
            <div className="alert alert-danger" role="alert">
              {generalError}
            </div>
          )}

          {/* Role selection */}
          <div className="mb-4">
        
            <div className="form-check form-check-inline">
              <input 
                className="form-check-input" 
                type="radio" 
                name="role" 
                id="roleTrainee" 
                value="trainee"
                checked={formData.role === 'trainee'}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                style={{ 
                  borderColor: 'var(--brand-primary)',
                  backgroundColor: formData.role === 'trainee' ? 'var(--brand-primary)' : 'transparent'
                }}
              />
              <label className="form-check-label" htmlFor="roleTrainee" style={{ color: 'var(--text-primary)', marginLeft: '0.5rem' }}>Trainee</label>
            </div>
            <div className="form-check form-check-inline">
              <input 
                className="form-check-input" 
                type="radio" 
                name="role" 
                id="roleTrainer" 
                value="trainer"
                checked={formData.role === 'trainer'}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                style={{ 
                  borderColor: 'var(--brand-primary)',
                  backgroundColor: formData.role === 'trainer' ? 'var(--brand-primary)' : 'transparent'
                }}
              />
              <label className="form-check-label" htmlFor="roleTrainer" style={{ color: 'var(--text-primary)', marginLeft: '0.5rem' }}>Trainer</label>
            </div>
            {errors.role && <div className="text-danger small mt-1">{errors.role}</div>}
          </div>

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
                Signing up...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <Link to="/login" className="pt-3" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: '500' }}>
          Already have an account?
        </Link>
      </div>
    </>
  );
}

export default SignUp;
