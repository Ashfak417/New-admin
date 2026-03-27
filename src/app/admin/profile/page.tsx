// app/admin/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CircleUser as ProfileIcon,
  Mail,
  Phone,
  Key,
  LogOut,
  ChevronLeft,
  Save,
  X,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const MAIN_BLUE = "#325E8F";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Password change flow state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordStep, setPasswordStep] = useState<"initial" | "otp" | "newpass">("initial");
  const [passwordData, setPasswordData] = useState({
    current: "",
    newPass: "",
    confirm: "",
    otp: "",
  });

  const [formData, setFormData] = useState({
    name: "Loading...",
    email: "Loading...",
    phone: "Loading...",
  });

  const [displayRole, setDisplayRole] = useState("Loading...");
  const [lastActive, setLastActive] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  useEffect(() => {
    setLastActive(new Date().toLocaleString("en-GB", { timeZone: "Asia/Colombo" }));

    const token = getAuthToken();

    if (!token) {
      setError("No authentication token found. Please log in again.");
      setFormData({ name: "Guest", email: "not-logged-in@example.com", phone: "" });
      setDisplayRole("Session Not Found");
      setLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      setFormData({
        name: payload.name || payload.fullName || payload.username || "Admin",
        email: payload.email || payload.sub || "admin@hospital.lk",
        phone: payload.phone || payload.phoneNumber || "No phone",
      });

      const role = (payload.role || "ADMIN").toUpperCase();
      setDisplayRole(role.includes("SUPER") ? "Super Administrator" : "Administrator");

      setLoading(false);
    } catch (err) {
      console.error("Token decode error:", err);
      setError("Invalid session token. Please log in again.");
      setFormData({ name: "Error", email: "Error", phone: "" });
      setDisplayRole("Session Error");
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveDetails = () => {
    showToast("success", "Profile details saved (simulation)");
    setIsEditingDetails(false);
  };

  const openPasswordForm = () => {
    setShowPasswordForm(true);
    setPasswordStep("initial");
    setPasswordData({ current: "", newPass: "", confirm: "", otp: "" });
  };

  const requestPasswordChangeOtp = async () => {
    if (!passwordData.current) return showToast("error", "Please enter current password");
    if (!passwordData.newPass || !passwordData.confirm) return showToast("error", "Please enter and confirm new password");
    if (passwordData.newPass !== passwordData.confirm) return showToast("error", "New passwords do not match");
    if (passwordData.newPass.length < 6) return showToast("error", "New password must be at least 6 characters");

    const token = getAuthToken();
    if (!token) return showToast("error", "Session expired");

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/auth/password-reset/initiate?identifier=${encodeURIComponent(formData.email.trim())}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        showToast("success", "Verification code sent to your email!");
        setPasswordStep("otp");
      } else {
        const msg = await res.text();
        showToast("error", msg || "Failed to send code");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (passwordData.otp.length !== 6) return showToast("error", "Enter 6-digit code");

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/password-reset/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          identifier: formData.email.trim(),
          otp: passwordData.otp,
        }),
      });

      if (res.ok) {
        showToast("success", "Code verified! Now set your new password.");
        setPasswordStep("newpass");
      } else {
        const msg = await res.text();
        showToast("error", msg || "Invalid code");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  const finalizePasswordChange = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/password-reset/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          identifier: formData.email.trim(),
          newPassword: passwordData.newPass.trim(),
        }),
      });

      if (res.ok) {
        showToast("success", "Password updated successfully! Logging you out...");
        setShowPasswordForm(false);
        setPasswordStep("initial");
        setPasswordData({ current: "", newPass: "", confirm: "", otp: "" });

        setTimeout(() => {
          document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          window.location.href = "/admin/login";
        }, 2000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast("error", errorData.message || "Failed to update password");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      window.location.href = "/admin/login";
    }
  };

  if (loading && !showPasswordForm) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={48} className="animate-spin text-[#325E8F]" />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 32px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "white",
            padding: "14px 20px",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontWeight: 600,
          }}
        >
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "white" }}>
            <X size={18} />
          </button>
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          href="/admin/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: MAIN_BLUE,
            fontWeight: "700",
            fontSize: "17px",
            textDecoration: "none",
            marginBottom: "40px",
          }} 
        >
          <ChevronLeft size={24} />
          Back to Dashboard
        </Link>

        <div style={{ marginBottom: "48px" }}>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "800",
            color: "#1e293b",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}>
            <ProfileIcon size={40} style={{ color: MAIN_BLUE }} />
            My Profile
          </h1>
          <p style={{ color: "#64748b", marginTop: "12px", fontSize: "17px" }}>
            Manage your personal information and account security.
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #f1f5f9",
        }}>
          {/* Profile Info */}
          <div style={{ padding: "36px" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "24px",
              marginBottom: "32px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "18px",
                  background: `linear-gradient(135deg, ${MAIN_BLUE}, #1e3a5f)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "40px",
                  fontWeight: "bold",
                  boxShadow: "0 8px 24px rgba(50,94,143,0.3)",
                }}>
                  {formData.name.charAt(0) || "?"}
                </div>

                <div>
                  <h2 style={{ fontSize: "30px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                    {formData.name}
                  </h2>
                  <p style={{
                    color: MAIN_BLUE,
                    fontWeight: "700",
                    margin: "8px 0 6px 0",
                    fontSize: "18px",
                  }}>
                    {displayRole}
                  </p>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "16px" }}>
                    {formData.email}
                  </p>
                </div>
              </div>

              {!isEditingDetails && (
                <button
                  onClick={() => setIsEditingDetails(true)}
                  style={{
                    padding: "12px 28px",
                    background: MAIN_BLUE,
                    color: "white",
                    border: "none",
                    borderRadius: "14px",
                    fontWeight: "700",
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Edit3 size={18} />
                  Edit Profile
                </button>
              )}
            </div>

            {isEditingDetails && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                marginTop: "24px",
              }}>
                <div>
                  <label style={{ fontWeight: "600", color: "#475569", fontSize: "15px", marginBottom: "8px", display: "block" }}>
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: "600", color: "#475569", fontSize: "15px", marginBottom: "8px", display: "block" }}>
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "16px", marginTop: "20px" }}>
                  <button
                    onClick={handleSaveDetails}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "15px",
                      cursor: "pointer",
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditingDetails(false)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "15px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Section */}
          <div style={{ padding: "36px", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
              <Key size={32} style={{ color: MAIN_BLUE }} />
              <div>
                <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                  Change Password
                </h3>
                <p style={{ color: "#64748b", marginTop: "8px", fontSize: "15px" }}>
                  Update your password to keep your account secure.
                </p>
              </div>
            </div>

            {!showPasswordForm ? (
              <button
                onClick={openPasswordForm}
                style={{
                  padding: "12px 28px",
                  background: MAIN_BLUE,
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  fontWeight: "700",
                  fontSize: "15px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Key size={18} />
                Change Password
              </button>
            ) : passwordStep === "initial" ? (
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                  <div>
                    <label style={{ fontWeight: "600", color: "#475569", fontSize: "15px", marginBottom: "8px", display: "block" }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={handlePasswordInputChange}
                      name="current"
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "15px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: "600", color: "#475569", fontSize: "15px", marginBottom: "8px", display: "block" }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPass}
                      onChange={handlePasswordInputChange}
                      name="newPass"
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "15px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: "600", color: "#475569", fontSize: "15px", marginBottom: "8px", display: "block" }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={handlePasswordInputChange}
                      name="confirm"
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "15px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                  <button
                    onClick={requestPasswordChangeOtp}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: loading ? "#6ee7b7" : "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "15px",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Sending Code..." : "Send Verification Code"}
                  </button>

                  <button
                    onClick={() => setShowPasswordForm(false)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "15px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Logout */}
          <div style={{ padding: "36px", textAlign: "center", borderTop: "1px solid #e5e7eb" }}>
            <button
              onClick={handleLogout}
              style={{
                padding: "14px 48px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontWeight: "700",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{
          marginTop: "48px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "15px",
        }}>
          <p>Last active: {lastActive}</p>
        </div>
      </div>

      {/* ── Separate OTP / New Password Overlay ── */}
      {(showPasswordForm && (passwordStep === "otp" || passwordStep === "newpass")) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => {
            setShowPasswordForm(false);
            setPasswordStep("initial");
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              padding: "40px 32px",
              boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowPasswordForm(false);
                setPasswordStep("initial");
              }}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={28} color="#64748b" />
            </button>

            {passwordStep === "otp" ? (
              <>
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: MAIN_BLUE, marginBottom: "16px", textAlign: "center" }}>
                  Enter Verification Code
                </h3>
                <p style={{ color: "#64748b", textAlign: "center", marginBottom: "32px" }}>
                  We sent a 6-digit code to <strong>{formData.email}</strong>
                </p>

                <input
                  type="text"
                  value={passwordData.otp}
                  onChange={(e) => setPasswordData({ ...passwordData, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  maxLength={6}
                  placeholder="000000"
                  style={{
                    width: "100%",
                    padding: "20px",
                    fontSize: "32px",
                    textAlign: "center",
                    letterSpacing: "12px",
                    borderRadius: "16px",
                    border: "3px solid #10b98140",
                    marginBottom: "32px",
                  }}
                />

                <div style={{ display: "flex", gap: "16px" }}>
                  <button
                    onClick={verifyOtp}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "16px",
                      background: loading ? "#6ee7b7" : "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "14px",
                      fontWeight: "700",
                      fontSize: "16px",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordStep("initial");
                    }}
                    style={{
                      flex: 1,
                      padding: "16px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "14px",
                      fontWeight: "700",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: MAIN_BLUE, marginBottom: "16px", textAlign: "center" }}>
                  Set New Password
                </h3>
                <p style={{ color: "#64748b", textAlign: "center", marginBottom: "32px" }}>
                  Choose a strong password for your account
                </p>

                <div style={{ display: "grid", gap: "20px", marginBottom: "32px" }}>
                  <div>
                    <label style={{ fontWeight: "600", color: "#475569", marginBottom: "8px", display: "block" }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPass}
                      onChange={handlePasswordInputChange}
                      name="newPass"
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "16px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: "600", color: "#475569", marginBottom: "8px", display: "block" }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={handlePasswordInputChange}
                      name="confirm"
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "16px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <button
                    onClick={finalizePasswordChange}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "16px",
                      background: loading ? "#6ee7b7" : "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "14px",
                      fontWeight: "700",
                      fontSize: "16px",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordStep("initial");
                    }}
                    style={{
                      flex: 1,
                      padding: "16px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "14px",
                      fontWeight: "700",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 