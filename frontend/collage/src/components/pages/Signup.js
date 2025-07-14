import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import "./styles/Signup.css";

function SignUp() {
  return (
    <div className="signup-container d-flex vh-100">
      {/* Left Side - Banner */}
      <div className="left-banner">
        <h1 className="banner-title">College Filtering</h1>
        <p className="author-text">Made by Shashank Reddy</p>
      </div>

      {/* Sign Up Form */}
      <div className="right-side">
        <div className="form-container">
          <form>
            <h3 className="text-center">Sign Up</h3>

            {/* Name Input */}
            <div className="mb-2">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                placeholder="Enter Name"
                className="form-control"
                id="name"
              />
            </div>

            {/* Email Input */}
            <div className="mb-2">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                placeholder="Enter Email"
                className="form-control"
                id="email"
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
              />
            </div>

            {/* Confirm Password Input */}
            <div className="mb-3">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm Password"
                className="form-control"
                id="confirmPassword"
              />
            </div>

            {/* Sign Up Button */}
            <div className="d-grid">
              <button type="submit" className="btn btn-primary">
                Sign Up
              </button>
            </div>

            {/* Login Link */}
            <p className="text-end mt-2">
              Already have an account?{" "}
              <Link to="/login" className="text-decoration-none">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
