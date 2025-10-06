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
    isTrainer: false, // required checkbox
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confpassword: "",
    isTrainer: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // State to handle password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfPassword, setShowConfPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      setErrors((prev) => ({
        ...prev,
        [name]: "", // clear trainer error if user checks it
      }));
      return;
    }

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
    const { username, email, password, confpassword, isTrainer } = formData;
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

    // Trainer checkbox validation
    if (!isTrainer) {
      newErrors.isTrainer = "You must confirm that you are a Trainer";
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
        role: "trainer", // always trainer since required
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
        style={{ height: "85vh" }}
      >
        <form
          className="p-4 border rounded shadow"
          onSubmit={handleSubmit}
          style={{ width: "100%", maxWidth: "500px", minWidth: "200px" }}
        >
          <h3 className="text-center mb-4">Sign Up</h3>

          {/* Username */}
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
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
            />
            {errors.username && <div className="invalid-feedback">{errors.username}</div>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
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
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
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
            <label htmlFor="confpassword" className="form-label">
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

          {/* Trainer confirmation checkbox */}
          <div className="form-check mb-3">
            <input
              className={`form-check-input ${errors.isTrainer ? "is-invalid" : ""}`}
              type="checkbox"
              name="isTrainer"
              id="isTrainer"
              checked={formData.isTrainer}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="isTrainer">
              Confirm that I am a Trainer <span className="text-danger">*</span>
            </label>
            {errors.isTrainer && <div className="invalid-feedback">{errors.isTrainer}</div>}
          </div>

          {generalError && (
            <div className="alert alert-danger" role="alert">
              {generalError}
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
                Signing up...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <Link to="/login" className="pt-2">
          Already have an account?
        </Link>
      </div>
    </>
  );
}

export default SignUp;
