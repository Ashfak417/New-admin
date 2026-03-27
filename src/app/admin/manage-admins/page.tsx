"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import {
  Mail,
  Lock,
  User,
  IdCard,
  Shield,
  X,
  Loader2,
  Search,
  Plus,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Trash2,
  AlertTriangle
} from "lucide-react";

import { getAuthToken, getAuthRole } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function ManageAdminsPage() {
  const router = useRouter();

  // --- FORM STATES ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nic, setNic] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");

  // --- UI STATES ---
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // --- DELETE CONFIRMATION STATES ---
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; adminId: string | null; adminName: string | null }>({
    isOpen: false,
    adminId: null,
    adminName: null
  });

  // --- AUTH CHECK ---
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return router.replace("/admin/login");
    if (getAuthRole() !== "SUPER_ADMIN") router.replace("/admin/dashboard");
  }, []);

  // --- FETCH DATA ---
  const fetchAdmins = async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoadingAdmins(true);
    try {
      const res = await fetch(`${API_BASE}/auth/super/admins?page=0&size=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const data = json.data || json;
      // Map data to ensure status is handled locally
      const adminsWithStatus = (data.content || []).map((admin: any) => ({
        ...admin,
        status: admin.status || "ACTIVE"
      }));
      setAdmins(adminsWithStatus);
    } catch {
      setToast({ type: "error", message: "Failed to load admins" });
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  // --- DELETE LOGIC ---
  const confirmDelete = async () => {
    if (!deleteConfirm.adminId) return;
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_BASE}/auth/super/users/${deleteConfirm.adminId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAdmins(prev => prev.map(admin => 
          admin.id === deleteConfirm.adminId ? { ...admin, status: "DELETED" } : admin
        ));
        setToast({ type: "success", message: "Admin deleted successfully" });
      } else {
        setToast({ type: "error", message: "Failed to delete" });
      }
    } catch {
      setToast({ type: "error", message: "Network error" });
    } finally {
      setDeleteConfirm({ isOpen: false, adminId: null, adminName: null });
    }
  };

  // --- LOGIC (FROM YOUR WORKING CODE) ---
  const sendOtp = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/register/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email, password, username, phoneNumber, nic,
          role: "ADMIN", emergencyContact,
        }),
      });
      if (res.ok) {
        setToast({ type: "success", message: "OTP sent to your phone" });
        setStep("otp");
      } else {
        const msg = await res.text();
        setToast({ type: "error", message: msg || "Failed to send OTP" });
      }
    } catch {
      setToast({ type: "error", message: "Error sending OTP" });
    }
  };

  const verifyOtp = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/register/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ identifier: phoneNumber, otp }),
      });
      if (res.ok) {
        setToast({ type: "success", message: "Admin created successfully!" });
        setShowModal(false);
        setStep("form");
        fetchAdmins();
      } else {
        setToast({ type: "error", message: "Invalid OTP code" });
      }
    } catch {
      setToast({ type: "error", message: "Verification failed" });
    }
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) =>
      `${a.username} ${a.email} ${a.phoneNumber}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [admins, searchQuery]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 20px", fontFamily: "sans-serif" }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 99999, background: toast.type === "success" ? "#10b981" : "#ef4444", color: "white", padding: "14px 24px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}>
          {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {toast.message}
          <X size={18} style={{ cursor: "pointer", marginLeft: 10 }} onClick={() => setToast(null)} />
        </div>
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Manage Admins</h1>
            <p style={{ color: "#64748b", marginTop: 5 }}>Control and monitor administrative access</p>
          </div>
          <button 
            onClick={() => { setShowModal(true); setStep("form"); }}
            style={{ background: "#3b6795", color: "white", border: "none", padding: "14px 28px", borderRadius: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 103, 149, 0.3)" }}
          >
            <Plus size={20} /> Add New Admin
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "30px" }}>
          <Search style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
          <input 
            placeholder="Search by name, email or phone..."
            style={{ width: "100%", padding: "16px 16px 16px 55px", borderRadius: "16px", border: "1px solid #e2e8f0", outline: "none", fontSize: "16px", background: "white" }}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Admin Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {loadingAdmins ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "100px" }}><Loader2 size={40} className="animate-spin" style={{ color: "#3b6795", margin: "0 auto" }} /></div>
          ) : filteredAdmins.length > 0 ? (
            filteredAdmins.map((admin) => (
              <div key={admin.id} style={{ background: "white", padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", opacity: admin.status === "DELETED" ? 0.6 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "50px", height: "50px", background: admin.status === "DELETED" ? "#f1f5f9" : "#eff6ff", color: "#3b6795", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "20px" }}>
                    {admin.username?.[0].toUpperCase()}
                  </div>
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ margin: 0, fontSize: "17px", color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{admin.username}</h3>
                      {admin.status === "DELETED" && (
                        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "#fee2e2", color: "#ef4444", fontWeight: "700" }}>DELETED</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{admin.phoneNumber}</p>
                  </div>
                </div>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f1f5f9", color: "#64748b", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={14} /> {admin.email}</div>
                   
                   {/* Delete Button */}
                   {admin.status !== "DELETED" && (
                     <button 
                        onClick={() => setDeleteConfirm({ isOpen: true, adminId: admin.id, adminName: admin.username })}
                        style={{ background: "#fef2f2", border: "none", color: "#ef4444", padding: "8px", borderRadius: "10px", cursor: "pointer" }}
                      >
                        <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "#94a3b8" }}>No administrators found.</div>
          )}
        </div>
      </div>

      {/* --- BEAUTIFUL DELETE CONFIRMATION MODAL --- */}
      {deleteConfirm.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000 }}>
          <div style={{ background: "white", borderRadius: "24px", width: "90%", maxWidth: "400px", padding: "32px", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ background: "#fee2e2", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <AlertTriangle size={30} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 10px 0" }}>Delete Administrator?</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", marginBottom: "24px" }}>
              Are you sure you want to delete <b>{deleteConfirm.adminName}</b>? This action will disable their access to the system.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, adminId: null, adminName: null })}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#ef4444", color: "white", fontWeight: "600", cursor: "pointer" }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BEAUTIFUL MODAL --- */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "white", borderRadius: "28px", width: "100%", maxWidth: "450px", padding: "40px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", position: "relative", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "#f1f5f9", border: "none", borderRadius: "50%", padding: 5, cursor: "pointer", color: "#64748b" }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#243b61", marginBottom: "32px", marginTop: "0" }}>
              {step === "form" ? "Add New Admin" : "Verify OTP"}
            </h2>

            {step === "form" ? (
              <div style={{ display: "grid", gap: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "4px 12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <Mail size={20} color="#3b6795" />
                  <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, padding: "12px 4px", background: "transparent", border: "none", outline: "none", fontSize: "15px" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "4px 12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <Lock size={20} color="#3b6795" />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ flex: 1, padding: "12px 4px", background: "transparent", border: "none", outline: "none", fontSize: "15px" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "4px 12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <User size={20} color="#3b6795" />
                  <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ flex: 1, padding: "12px 4px", background: "transparent", border: "none", outline: "none", fontSize: "15px" }} />
                </div>
                
                {/* Phone Input with working logic */}
                <label style={{ fontSize: "13px", color: "#64748b", marginBottom: -10 }}>Phone Number</label>
                <PhoneInput
                  country={"lk"}
                  value={phoneNumber.replace("+", "")}
                  onChange={(val) => setPhoneNumber("+" + val)}
                  containerStyle={{ width: "100%" }}
                  inputStyle={{ width: "100%", height: "48px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "15px" }}
                  buttonStyle={{ borderRadius: "12px 0 0 12px", border: "1px solid #e2e8f0", background: "#f8fafc" }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "4px 12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <IdCard size={20} color="#3b6795" />
                  <input placeholder="NIC" value={nic} onChange={(e) => setNic(e.target.value)} style={{ flex: 1, padding: "12px 4px", background: "transparent", border: "none", outline: "none", fontSize: "15px" }} />
                </div>

                <label style={{ fontSize: "13px", color: "#64748b", marginBottom: -10 }}>Emergency Contact</label>
                <PhoneInput
                  country={"lk"}
                  value={emergencyContact.replace("+", "")}
                  onChange={(val) => setEmergencyContact("+" + val)}
                  containerStyle={{ width: "100%" }}
                  inputStyle={{ width: "100%", height: "48px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "15px" }}
                  buttonStyle={{ borderRadius: "12px 0 0 12px", border: "1px solid #e2e8f0", background: "#f8fafc" }}
                />

                <button 
                  onClick={sendOtp}
                  style={{ marginTop: "10px", padding: "16px", background: "#3b6795", color: "white", border: "none", borderRadius: "16px", fontWeight: "700", fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 103, 149, 0.2)" }}
                >
                  Send OTP Code
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ background: "#f0fdf4", width: "70px", height: "70px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <Smartphone size={32} color="#10b981" />
                </div>
                <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>Enter Verification Code</h3>
                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>We've sent a 6-digit code to <br/><b>{phoneNumber}</b></p>
                
                <input 
                  maxLength={6} 
                  placeholder="000000" 
                  onChange={(e) => setOtp(e.target.value)} 
                  style={{ width: "100%", padding: "16px", fontSize: "28px", textAlign: "center", letterSpacing: "10px", borderRadius: "16px", border: "2px solid #3b6795", outline: "none", marginBottom: "24px", color: "#3b6795", fontWeight: "bold" }} 
                />
                
                <button onClick={verifyOtp} style={{ width: "100%", padding: "16px", background: "#10b981", color: "white", border: "none", borderRadius: "16px", fontWeight: "700", fontSize: "16px", cursor: "pointer" }}>Verify & Create Account</button>
                <button onClick={() => setStep("form")} style={{ background: "none", border: "none", color: "#64748b", marginTop: "20px", cursor: "pointer", fontSize: "14px" }}>Back to Edit Details</button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}