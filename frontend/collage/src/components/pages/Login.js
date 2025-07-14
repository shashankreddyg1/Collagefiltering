import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await axios.post("http://127.0.0.1:5000/login", { email, password });

      // Store the JWT token in localStorage
      localStorage.setItem("token", response.data.token);
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-container d-flex vh-100">
      {/* Left Side - Banner */}
      <div className="left-banner d-flex flex-column align-items-center justify-content-center">
        <h1 className="banner-title">College Filtering</h1>
        <p className="author-text">Made by Shashank Reddy</p>
      </div>

      {/* Login Form */}
      <div className="right-side">
        <div className="form-container">
          <form onSubmit={handleLogin}>
            <h3 className="text-center">Sign In</h3>

            {/* Error Message */}
            {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

            {/* Email Input */}
            <div className="mb-2">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                placeholder="Enter Email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Input */}
            <div className="mb-2">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                placeholder="Enter Password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="mb-3 form-check">
              <input type="checkbox" className="form-check-input" id="rememberMe" />
              <label htmlFor="rememberMe" className="form-check-label ms-2">
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <div className="d-grid">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="text-end mt-2">
              Don't have an account?{" "}
              <Link to="/signup" className="text-decoration-none">
                Sign Up
              </Link>
            </p>

            {/* Forget Password Link */}
            <p className="text-end-forget">
              <Link to="/forget-password" className="text-decoration-none">
                Forget Password
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
