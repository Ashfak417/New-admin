"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Path corrected for your structure:
import "../../styles/login.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Test credentials
  const ADMIN_USERNAME = "admin";
  const ADMIN_EMAIL = "admin@gmail.com";
  const ADMIN_PASSWORD = "1234";

  function handleLogin() {
    if (
      (identifier === ADMIN_USERNAME || identifier === ADMIN_EMAIL) &&
      password === ADMIN_PASSWORD
    ) {
      setError("");
      // Set the authentication flag
      localStorage.setItem("adminLoggedIn", "true"); 
      // Use router.replace to navigate to the dashboard (prevents back button return to login)
      router.replace("/admin/dashboard");
    } else {
      setError("Incorrect username/email or password!");
    }
  }
  
  const handleForgotPassword = () => {
    // Replaced alert() with a console log and a simple UI message placeholder
    setError("Please contact system administrator to reset your password.");
    console.log("Forgot Password clicked. Showing message in error area.");
  };

  const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.012 12C3.21 7.7 7.01 5 12 5c4.99 0 8.79 2.7 9.988 7-1.198 4.3-4.998 7-9.988 7-4.99 0-8.79-2.7-9.988-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-4.99 0-8.79-2.7-9.988-7.001C3.21 7.7 7.01 5 12 5c1.88 0 3.66.52 5.25 1.43M5.94 5.94A15.42 15.42 0 0 1 12 3c4.99 0 8.79 2.7 9.988 7-1.077 3.86-3.834 6.78-7.398 8.44M1 1l22 22" />
      <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2M12 7.8c1.78 0 3.2 1.42 3.2 3.2" />
    </svg>
  );

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Panel Login</h2>

        <div className="input-group">
          <input
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setIdentifier(e.target.value)
            }
            className="input-field"
          />
        </div>

        {/* 🔑 Password Input with Embedded Toggle Icon */}
        <div className="input-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            className="input-field"
          />
          <span
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <  EyeIcon style={{ width: '100%', height: '100%' }} />
            ) : (
              < EyeOffIcon style={{ width: '100%', height: '100%' }} />
            )} 
          </span>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button className="login-button" onClick={handleLogin}>
          Log In securely
        </button>

        <div
          className="forgot-password"
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </div>
      </div>
    </div>
  );
}