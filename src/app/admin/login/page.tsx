"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Shield,
  Mail,
  Lock,
  ChevronLeft,
  Smartphone,
  ChevronDown,
} from "lucide-react";
import metadata from "libphonenumber-js/metadata.full.json";

// ─── Helpers ────────────────────────────────────────────────────────────────
function decodeJWT(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch {
    return null;
  }
}

function getFlagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function AdminAuthPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showNewPasswordScreen, setShowNewPasswordScreen] = useState(false);

  const mainBlue = "#325E8F";
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

  // ─── Country selector data ──────────────────────────────────────────────────
  const countryOptions = useMemo(() => {
    return Object.keys(metadata.countries)
      .map((iso2) => {
        const dialCode = "+" + metadata.countries[iso2][0];
        const name = new Intl.DisplayNames(["en"], { type: "region" }).of(iso2) || iso2;
        return { iso2, name, dial_code: dialCode };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [selectedDialCode, setSelectedDialCode] = useState("+94");

  // ─── LOGIN HANDLER ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError("");
    setSuccess("");
    if (!username.trim() || !password) return setError("Enter email/phone and password");

    let finalUsername = username.trim();
    if ((/^\d/.test(finalUsername) || finalUsername.startsWith("0")) && !finalUsername.includes("@")) {
      if (finalUsername.startsWith("0")) finalUsername = finalUsername.substring(1);
      if (!finalUsername.startsWith("+")) finalUsername = selectedDialCode + finalUsername;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: finalUsername, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`OTP sent to ${finalUsername}!`);
        setShowOtpInput(true);
      } else {
        const msg = data.message || "Invalid credentials";
        if (/deleted/i.test(msg)) {
          setError("Your account has been deleted. Contact support to restore access.");
        } else {
          setError(msg);
        }
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── VERIFY OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return setError("Enter 6-digit OTP");

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: username.trim(), otp }),
      });

      const data = await res.json();

      if (res.ok) {
        const token = data?.data || data?.token || data?.accessToken;
        if (!token) return setError("No token received");

        let role = "ADMIN";
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          role = (payload.role || "ADMIN").toUpperCase();
        } catch {}

        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `adminToken=${token}; Path=/; Expires=${expires}; SameSite=Strict`;
        document.cookie = `adminRole=${role}; Path=/; Expires=${expires}; SameSite=Strict`;
        document.cookie = `adminName=Admin; Path=/; Expires=${expires}; SameSite=Strict`;

        setSuccess("Login successful! Redirecting...");
        setTimeout(() => window.location.href = "/admin/dashboard", 800);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch {
      setError("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── FORGOT PASSWORD FLOW ──────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    if (!username.trim()) return setError("Please enter your email or phone number");

    let finalIdentifier = username.trim();
    // Logic to handle phone number formatting
    if ((/^\d/.test(finalIdentifier) || finalIdentifier.startsWith("0")) && !finalIdentifier.includes("@")) {
      if (finalIdentifier.startsWith("0")) finalIdentifier = finalIdentifier.substring(1);
      if (!finalIdentifier.startsWith("+")) finalIdentifier = selectedDialCode + finalIdentifier;
    }

    setIsLoading(true);
    try {
      // Get the region code from the dial code (e.g., "+94" -> "LK")
      const currentCountry = countryOptions.find(c => c.dial_code === selectedDialCode);
      const regionCode = currentCountry ? currentCountry.iso2 : "LK";

      const res = await fetch(
        `${API_BASE}/auth/password-reset/initiate?identifier=${encodeURIComponent(finalIdentifier)}&regionCode=${regionCode}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        setSuccess("Reset code sent!");
        setShowResetForm(true);
        setShowOtpInput(true);
      } else {
        setError(data.message || "Identifier not found");
      }
    } catch {
      setError("Cannot connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    if (otp.length !== 6) return setError("Enter 6-digit code");

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password-reset/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: username.trim(), otp }),
      });

      if (res.ok) {
        setSuccess("Code verified! Set your new password.");
        setOtp("");
        setShowOtpInput(false);
        setShowNewPasswordScreen(true);
      } else {
        const msg = await res.text();
        setError(msg || "Invalid code");
      }
    } catch {
      setError("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (newPassword !== confirmPassword) return setError("Passwords don't match");
    if (newPassword.length < 6) return setError("Password must be 6+ characters");

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password-reset/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: username.trim(), newPassword }),
      });

      if (res.ok) {
        setSuccess("Password changed successfully! You can now log in.");
        setTimeout(() => resetToLogin(), 2000);
      } else {
        setError("Failed to update password");
      }
    } catch {
      setError("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetToLogin = () => {
    setShowResetForm(false);
    setShowOtpInput(false);
    setShowNewPasswordScreen(false);
    setError("");
    setSuccess("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setPassword("");
    setUsername("");
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, #E8F1F8 0%, #f0f7ff 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          width: "100%",
          maxWidth: "440px",
          borderRadius: "28px",
          boxShadow: "0 25px 70px rgba(50,94,143,0.22)",
          overflow: "hidden",
          border: `2px solid ${mainBlue}20`,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: `linear-gradient(135deg, ${mainBlue}, #1e3a5f)`,
            color: "white",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "90px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "50%",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <Shield size={52} />
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0 0 8px 0" }}>
            {showResetForm ? "Reset Password" : "Admin Portal"}
          </h1>
          <p style={{ opacity: 0.9, fontSize: "16px", margin: 0 }}>
            {showResetForm ? "Recover your account" : "Secure Hospital Management System"}
          </p>
        </div>

        <div style={{ padding: "40px 36px" }}>
          {success && (
            <div
              style={{
                background: "#d1fae5",
                color: "#065f46",
                padding: "14px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {success}
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "14px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontWeight: "600",
              }}
            >
              {error}
            </div>
          )}

          {showResetForm ? (
            <>
              <button
                onClick={resetToLogin}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: mainBlue,
                  background: "none",
                  border: "none",
                  fontWeight: "600",
                  marginBottom: "20px",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={20} /> Back to Login
              </button>

              {!showOtpInput && !showNewPasswordScreen && (
                <>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>
                      <Smartphone size={18} style={{ display: "inline", marginRight: "6px", verticalAlign: "-3px" }} />
                      Email or Phone Number
                    </label>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        border: `2px solid ${mainBlue}30`,
                        borderRadius: "16px",
                        background: "white",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "140px",
                          height: "52px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRight: `1px solid ${mainBlue}20`,
                          background: "#f8fafc",
                          flexShrink: 0,
                        }}
                      >
                        <select
                          value={selectedDialCode}
                          onChange={(e) => setSelectedDialCode(e.target.value)}
                          style={{
                            width: "100%",
                            height: "100%",
                            padding: "0 32px 0 12px",
                            border: "none",
                            background: "transparent",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1e293b",
                            appearance: "none",
                            cursor: "pointer",
                          }}
                        >
                          {countryOptions.map((c) => (
                            <option key={c.iso2} value={c.dial_code}>
                              {c.dial_code} {c.iso2} {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          style={{
                            position: "absolute",
                            right: "8px",
                            pointerEvents: "none",
                            color: "#64748b",
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter phone or email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{
                          flex: 1,
                          height: "52px",
                          padding: "14px 16px",
                          border: "none",
                          fontSize: "16px",
                          outline: "none",
                          background: "transparent",
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: mainBlue,
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    {isLoading ? "Sending Code..." : "Send Reset Code"}
                  </button>
                </>
              )}

              {showOtpInput && !showNewPasswordScreen && (
                <>
                  <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        background: "#d1fae5",
                        borderRadius: "50%",
                        margin: "0 auto 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Lock size={40} style={{ color: "#065f46" }} />
                    </div>
                    <h3 style={{ color: mainBlue, fontWeight: "700" }}>Check Verification</h3>
                    <p style={{ color: "#666", fontSize: "15px" }}>
                      Code sent to <strong style={{ color: mainBlue }}>{username}</strong>
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    style={{
                      width: "100%",
                      padding: "20px",
                      borderRadius: "16px",
                      border: "3px solid #10b98140",
                      fontSize: "36px",
                      fontWeight: "bold",
                      textAlign: "center",
                      letterSpacing: "12px",
                      marginBottom: "24px",
                    }}
                  />
                  <button
                    onClick={handleVerifyResetOtp}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </button>
                </>
              )}

              {showNewPasswordScreen && (
                <>
                  <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        background: "#d1fae5",
                        borderRadius: "50%",
                        margin: "0 auto 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Lock size={40} style={{ color: "#065f46" }} />
                    </div>
                    <h3 style={{ color: mainBlue, fontWeight: "700" }}>Set New Password</h3>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>
                      New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: `2px solid ${mainBlue}25`,
                        fontSize: "16px",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: `2px solid ${mainBlue}25`,
                        fontSize: "16px",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSetNewPassword}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: mainBlue,
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    {isLoading ? "Updating..." : "Set New Password"}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {!showOtpInput ? (
                <>
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>
                      <Smartphone size={18} style={{ display: "inline", marginRight: "6px", verticalAlign: "-3px" }} />
                      Email or Phone Number
                    </label>

                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        border: `2px solid ${mainBlue}30`,
                        borderRadius: "16px",
                        background: "white",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "140px",
                          height: "52px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRight: `1px solid ${mainBlue}20`,
                          background: "#f8fafc",
                          flexShrink: 0,
                        }}
                      >
                        <select
                          value={selectedDialCode}
                          onChange={(e) => setSelectedDialCode(e.target.value)}
                          style={{
                            width: "100%",
                            height: "100%",
                            padding: "0 32px 0 12px",
                            border: "none",
                            background: "transparent",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1e293b",
                            appearance: "none",
                            cursor: "pointer",
                          }}
                        >
                          {countryOptions.map((c) => (
                            <option key={c.iso2} value={c.dial_code}>
                              {c.dial_code} {c.iso2} {c.name}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={14}
                          style={{
                            position: "absolute",
                            right: "8px",
                            pointerEvents: "none",
                            color: "#64748b",
                          }}
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Enter phone number or email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{
                          flex: 1,
                          height: "52px",
                          padding: "14px 16px",
                          border: "none",
                          fontSize: "16px",
                          outline: "none",
                          background: "transparent",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "24px", position: "relative" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>
                      <Lock size={18} style={{ display: "inline", marginRight: "6px", verticalAlign: "-3px" }} />
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px 48px 14px 16px",
                        borderRadius: "14px",
                        border: `2px solid ${mainBlue}25`,
                        fontSize: "16px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "42px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                      }}
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: mainBlue,
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "18px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <p
                    onClick={() => {
                        setShowResetForm(true);
                        setError("");
                        setSuccess("");
                    }}
                    style={{
                      textAlign: "center",
                      marginTop: "24px",
                      color: mainBlue,
                      fontWeight: "600",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Forgot Password?
                  </p>
                </>
              ) : (
                <>
                  <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        background: "#d1fae5",
                        borderRadius: "50%",
                        margin: "0 auto 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Lock size={40} style={{ color: "#065f46" }} />
                    </div>
                    <h3 style={{ color: mainBlue, fontWeight: "700" }}>Verify Login</h3>
                    <p style={{ color: "#666", fontSize: "15px" }}>
                      Code sent to <strong style={{ color: mainBlue }}>{username}</strong>
                    </p>
                  </div>

                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    style={{
                      width: "100%",
                      padding: "20px",
                      borderRadius: "16px",
                      border: "3px solid #10b98140",
                      fontSize: "36px",
                      fontWeight: "bold",
                      textAlign: "center",
                      letterSpacing: "12px",
                      marginBottom: "24px",
                    }}
                  />

                  <button
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    {isLoading ? "Verifying..." : "Verify OTP & Login"}
                  </button>

                  <button
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                      setError("");
                    }}
                    style={{
                      marginTop: "16px",
                      width: "100%",
                      padding: "12px",
                      background: "transparent",
                      color: mainBlue,
                      border: `2px solid ${mainBlue}30`,
                      borderRadius: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Back to Login
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}