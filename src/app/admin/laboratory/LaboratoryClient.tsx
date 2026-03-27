"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Microscope,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Save,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  Globe,
  Ban,
  CheckCircle,
  Eye,
  Loader2,
  AlertCircle,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth";

interface Laboratory {
  id: number;
  email: string;
  username?: string;
  address?: string;
  phoneNumber?: string;
  contactNo2?: string;
  hotline?: string;
  latitude?: number;
  longitude?: number;
  labRegistrationNumber?: string;
  brNumber?: string;
  brPhotoUrl?: string;
  profileImageUrl?: string;
  status?: "ACTIVE" | "DISABLED";
}

interface LabTest {
  id: number;
  testName: string;
  description?: string;
  price?: number;
  estimatedDuration?: string;
  prerequisites?: string;
  category?: string;
  [key: string]: any;
}

interface Booking {
  id: number;
  bookingReference?: string;
  testName?: string;
  testPrice?: number;
  bookingDate?: string;
  queueNumber?: number;
  patientName?: string;
  nic?: string;
  phoneNumber?: string;
  status?: string;
  [key: string]: any;
}

export default function LaboratoryClient() {
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [myProfile, setMyProfile] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Laboratory>>({});
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLabs, setTotalLabs] = useState(0);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const [viewLabOpen, setViewLabOpen] = useState(false);
  const [selectedLabDetails, setSelectedLabDetails] = useState<Laboratory | null>(null);
  const [loadingLabDetails, setLoadingLabDetails] = useState(false);
  const [labDetailsError, setLabDetailsError] = useState<string | null>(null);

  const [viewTestsInModal, setViewTestsInModal] = useState(false);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);

  // Bookings modal states
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [activeBookingFilter, setActiveBookingFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED">("ALL");
  const [bookingsPage, setBookingsPage] = useState(0);
  const [bookingsSize, setBookingsSize] = useState(10);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);

  // Beautiful Confirm Modal for Disable/Re-enable
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    labId: number | null;
    labName: string | null;
    targetStatus: "ACTIVE" | "DISABLED" | null;
  }>({
    isOpen: false,
    labId: null,
    labName: null,
    targetStatus: null,
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const showToast = (type: "success" | "error" | "warning", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = useCallback(
    async (isRefresh = false) => {
      const token = getAuthToken();
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }
      try {
        if (!isRefresh) setLoading(true);
        else setRefreshing(true);

        const listRes = await fetch(`${API_BASE}/auth/super/laboratories?page=${page}&size=${size}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!listRes.ok) {
          if (listRes.status === 401 || listRes.status === 403) {
            window.location.href = "/admin/login";
            return;
          }
          throw new Error(`Failed: ${listRes.status}`);
        }

        const listData = await listRes.json();
        const rawLabs = listData.content || listData.data?.content || [];
        const enrichedLabs = rawLabs.map((lab: any) => ({
          ...lab,
          profileImageUrl: lab.profileImageUrl || lab.brPhotoUrl || "",
        }));

        setLabs(enrichedLabs);
        setTotalPages(listData.totalPages || 1);
        setTotalLabs(listData.totalElements || listData.data?.totalElements || 0);

        const profileRes = await fetch(`${API_BASE}/laboratories/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setMyProfile({
            ...profileData,
            profileImageUrl: profileData.profileImageUrl || profileData.brPhotoUrl || "",
          });
        } else {
          setMyProfile(null);
        }
      } catch (err: unknown) {
        console.error("Laboratory fetch error:", err);
        const msg =
          err && typeof err === "object" && "message" in err
            ? (err as Error).message
            : "Failed to load laboratory data";
        showToast("error", msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, size, API_BASE]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => fetchData(true);

  const handleEdit = () => {
    if (!myProfile) return;
    setEditForm(myProfile);
    setEditing(true);
  };

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) {
      showToast("error", "Not authenticated");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/laboratories/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save profile");
      }
      const updated = await res.json();
      setMyProfile({
        ...updated,
        profileImageUrl: updated.profileImageUrl || updated.brPhotoUrl || "",
      });
      setEditing(false);
      showToast("success", "Laboratory profile updated successfully!");
      fetchData();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as Error).message
          : "Failed to save profile";
      showToast("error", msg);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({});
  };

  // Open beautiful confirmation modal
  const openStatusConfirm = (labId: number, labName: string, targetStatus: "ACTIVE" | "DISABLED") => {
    setConfirmModal({
      isOpen: true,
      labId,
      labName,
      targetStatus,
    });
  };

  const closeStatusConfirm = () => {
    setConfirmModal({
      isOpen: false,
      labId: null,
      labName: null,
      targetStatus: null,
    });
  };

  const confirmStatusChange = async () => {
    if (!confirmModal.labId || !confirmModal.targetStatus) return;

    const token = getAuthToken();
    if (!token) {
      showToast("error", "Not authenticated");
      closeStatusConfirm();
      return;
    }

    const actionWord = confirmModal.targetStatus === "DISABLED" ? "disable" : "re-enable";

    try {
      const url = `${API_BASE}/auth/super/users/${confirmModal.labId}/status?status=${confirmModal.targetStatus}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to ${actionWord} laboratory`);
      }

      showToast("success", `Laboratory ${actionWord}d successfully`);

      setLabs((prevLabs) =>
        prevLabs.map((lab) =>
          lab.id === confirmModal.labId ? { ...lab, status: confirmModal.targetStatus! } : lab
        )
      );

      if (myProfile?.id === confirmModal.labId) {
        setMyProfile((prev) => (prev ? { ...prev, status: confirmModal.targetStatus! } : null));
      }

      fetchData(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as Error).message
          : `Failed to ${confirmModal.targetStatus === "DISABLED" ? "disable" : "enable"} laboratory`;
      showToast("error", msg);
    } finally {
      closeStatusConfirm();
    }
  };

  const handleViewLab = async (lab: Laboratory) => {
    const token = getAuthToken();
    if (!token) {
      showToast("error", "Not authenticated");
      return;
    }
    setSelectedLabDetails(lab);
    setLabDetailsError(null);
    setLoadingLabDetails(true);
    setViewLabOpen(true);
    setViewTestsInModal(false);

    try {
      const url = `${API_BASE}/laboratories/by-auth-id/${lab.id}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to load lab details (${res.status})`);
      }
      const data = await res.json();
      setSelectedLabDetails({
        ...data,
        profileImageUrl: data.profileImageUrl || data.brPhotoUrl || "",
      });
    } catch (err: any) {
      console.error("Lab details fetch error:", err);
      setLabDetailsError(err.message || "Failed to load lab details");
      showToast("error", "Could not load lab details");
    } finally {
      setLoadingLabDetails(false);
    }
  };

  const fetchLabTests = async (labId: number) => {
    const token = getAuthToken();
    if (!token) return;
    setLoadingTests(true);
    setTestsError(null);
    try {
      const url = `${API_BASE}/laboratories/tests/by-lab-id/${labId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to load tests (${res.status})`);
      }
      const response = await res.json();
      const tests = response.data || response.content || response || [];
      setLabTests(Array.isArray(tests) ? tests : []);
    } catch (err: any) {
      console.error("Tests fetch error:", err);
      setTestsError(err.message || "Failed to load tests");
      showToast("error", "Could not load tests");
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchBookingsByTestId = async (testId: number) => {
    const token = getAuthToken();
    if (!token) {
      showToast("error", "Not authenticated");
      return;
    }
    setBookingsLoading(true);
    setBookingsError(null);
    setBookings([]);
    try {
      let url = `${API_BASE}/bookings/lab/by-test-id/${testId}?page=${bookingsPage}&size=${bookingsSize}`;
      if (activeBookingFilter !== "ALL") {
        url += `&status=${activeBookingFilter}`;
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed to load bookings (${res.status})`);
      }
      const response = await res.json();
      const pageData = response.data || response.content || response || {};
      const bookingList = Array.isArray(pageData) ? pageData : pageData.content || [];
      setBookings(bookingList);
      setBookingsTotalPages(pageData.totalPages || Math.ceil((pageData.totalElements || bookingList.length) / bookingsSize));
      setBookingsPage(pageData.number ?? bookingsPage);
    } catch (err: any) {
      console.error("Bookings fetch error:", err);
      setBookingsError(err.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (showBookingsModal && selectedTest) {
      fetchBookingsByTestId(selectedTest.id);
    }
  }, [showBookingsModal, selectedTest, activeBookingFilter, bookingsPage, bookingsSize]);

  const getFilteredBookings = () => {
    if (activeBookingFilter === "ALL") return bookings;
    return bookings.filter((b) => (b.status || "").trim().toUpperCase() === activeBookingFilter);
  };

  const getStatusBadge = (status?: string) => {
    const isDisabled = status === "DISABLED";
    return (
      <span
        style={{
          padding: "6px 14px",
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 700,
          backgroundColor: isDisabled ? "#fee2e2" : "#d1fae5",
          color: isDisabled ? "#991b1b" : "#065f46",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {isDisabled ? <Ban size={14} /> : <CheckCircle size={14} />}
        {isDisabled ? "Disabled" : "Active"}
      </span>
    );
  };

  const getInitialAvatar = (name?: string) => {
    if (!name || name.trim() === "") return "?";
    const cleaned = name.trim().replace(/\s+/g, " ");
    const parts = cleaned.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return cleaned[0].toUpperCase();
  };

  const getAvatarColor = (name?: string) => {
    if (!name || name.trim() === "") return "#cbd5e1";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const filteredLabs = labs.filter((l) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (l.username || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.address || "").toLowerCase().includes(q) ||
      (l.phoneNumber || "").includes(q) ||
      (l.labRegistrationNumber || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "32px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === "success" ? "#10b981" : toast.type === "warning" ? "#f59e0b" : "#ef4444",
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
          {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"}
          {toast.message}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "white" }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Beautiful Status Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.labName && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              width: "90%",
              maxWidth: "420px",
              padding: "32px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                background: confirmModal.targetStatus === "DISABLED" ? "#fee2e2" : "#fefce8",
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <AlertTriangle size={36} color={confirmModal.targetStatus === "DISABLED" ? "#ef4444" : "#f59e0b"} />
            </div>

            <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: "0 0 12px 0" }}>
              {confirmModal.targetStatus === "DISABLED" ? "Disable Laboratory?" : "Re-enable Laboratory?"}
            </h3>

            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.6", marginBottom: "28px" }}>
              Are you sure you want to{" "}
              <strong>{confirmModal.targetStatus === "DISABLED" ? "disable" : "re-enable"}</strong>{" "}
              <b>{confirmModal.labName}</b>?
              <br />
              {confirmModal.targetStatus === "DISABLED"
                ? "This will prevent the laboratory from accessing the system."
                : "This will restore full access for the laboratory."}
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={closeStatusConfirm}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1.5px solid #e2e8f0",
                  background: "white",
                  color: "#475569",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background: confirmModal.targetStatus === "DISABLED" ? "#ef4444" : "#16a34a",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Yes, {confirmModal.targetStatus === "DISABLED" ? "Disable" : "Re-enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginBottom: "28px" }}>
        <Link
          href="/admin/dashboard"
          style={{
            color: "#325E8F",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            fontSize: "16px",
          }}
        >
          <ChevronLeft size={22} />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: 0,
            }}
          >
            <Microscope size={36} style={{ color: "#325E8F" }} />
            Laboratory Management
          </h1>
          <p style={{ color: "#64748b", margin: "8px 0 0 0" }}>• Total: {totalLabs} laboratories</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: "12px 20px",
              background: "#325E8F",
              color: "white",
              border: "none",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {refreshing ? <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={18} />}
            Refresh
          </button>
          {myProfile && (
            <button
              onClick={handleEdit}
              style={{
                padding: "12px 20px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "700",
                boxShadow: "0 8px 20px rgba(16,185,129,0.18)",
              }}
            >
              <Edit3 size={16} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "100px", color: "#64748b" }}>
          <RefreshCw size={48} style={{ animation: "spin 1s linear infinite", marginBottom: "20px" }} />
          <p>Loading laboratory data...</p>
        </div>
      )}

      {/* My Profile Card */}
      {!loading && myProfile && !editing && (
        <div
          style={{
            background: myProfile.status === "DISABLED"
              ? "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
              : "white",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 12px 28px rgba(50, 94, 143, 0.1)",
            marginBottom: "40px",
            border: `1.5px solid ${myProfile.status === "DISABLED" ? "#fca5a5" : "#e5e7eb"}`,
            position: "relative",
            overflow: "hidden",
            opacity: myProfile.status === "DISABLED" ? 0.85 : 1,
          }}
        >
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {myProfile.profileImageUrl ? (
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "12px",
                      background: `url(${myProfile.profileImageUrl}) center/cover no-repeat`,
                      border: "3px solid #325E8F",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "12px",
                      background: getAvatarColor(myProfile.username),
                      color: "white",
                      fontSize: "24px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(50,94,143,0.3)",
                    }}
                  >
                    {getInitialAvatar(myProfile.username)}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1e293b" }}>
                    {myProfile.username || "Unnamed Laboratory"}
                  </h2>
                  <p style={{ margin: "4px 0 8px 0", color: "#325E8F", fontWeight: 600 }}>Your Laboratory</p>
                  {getStatusBadge(myProfile.status)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={handleEdit}
                  disabled={myProfile.status === "DISABLED"}
                  style={{
                    padding: "12px 24px",
                    background: myProfile.status === "DISABLED"
                      ? "#cbd5e1"
                      : "linear-gradient(135deg, #325E8F 0%, #1e40af 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 700,
                    cursor: myProfile.status === "DISABLED" ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: myProfile.status === "DISABLED" ? 0.6 : 1,
                  }}
                >
                  <Edit3 size={18} /> Edit Profile
                </button>

                <button
                  onClick={() =>
                    openStatusConfirm(
                      myProfile.id,
                      myProfile.username || "This Laboratory",
                      myProfile.status === "DISABLED" ? "ACTIVE" : "DISABLED"
                    )
                  }
                  style={{
                    padding: "12px 20px",
                    background: myProfile.status === "DISABLED"
                      ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)"
                      : "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(239,68,68,0.2)",
                  }}
                >
                  {myProfile.status === "DISABLED" ? (
                    <>
                      <RefreshCw size={16} /> Re-enable
                    </>
                  ) : (
                    <>
                      <Ban size={16} /> Disable Lab
                    </>
                  )}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              <InfoItem icon={<Mail size={18} />} label="Email" value={myProfile.email} color="#325E8F" small />
              {myProfile.address && <InfoItem icon={<MapPin size={18} />} label="Address" value={myProfile.address} color="#16a34a" small />}
              {myProfile.phoneNumber && (
                <InfoItem icon={<Phone size={18} />} label="Phone" value={myProfile.phoneNumber} color="#f59e0b" small />
              )}
              {myProfile.contactNo2 && <InfoItem icon={<Phone size={18} />} label="Secondary Contact" value={myProfile.contactNo2} color="#f59e0b" small />}
              {myProfile.hotline && <InfoItem icon={<Phone size={18} />} label="Hotline" value={myProfile.hotline} color="#9333ea" small />}
              {myProfile.labRegistrationNumber && (
                <InfoItem icon={<FileText size={18} />} label="Lab Reg. No" value={myProfile.labRegistrationNumber} color="#7c3aed" small />
              )}
              {myProfile.brNumber && (
                <InfoItem icon={<Building2 size={18} />} label="Business Reg. No" value={myProfile.brNumber} color="#ea580c" small />
              )}
              {(myProfile.latitude || myProfile.longitude) && (
                <InfoItem
                  icon={<Globe size={18} />}
                  label="Coordinates"
                  value={`${myProfile.latitude?.toFixed(6) || "—"}, ${myProfile.longitude?.toFixed(6) || "—"}`}
                  color="#0891b2"
                  small
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Form */}
      {editing && myProfile && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "28px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
            marginBottom: "40px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ margin: "0 0 24px 0", fontSize: 24, color: "#1e293b" }}>Edit Laboratory Profile</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            <Field label="Laboratory Name *" value={editForm.username || ""} onChange={(v) => setEditForm({ ...editForm, username: v })} required />
            <Field label="Email" value={editForm.email || ""} onChange={(v) => setEditForm({ ...editForm, email: v })} type="email" />
            <Field label="Address" value={editForm.address || ""} onChange={(v) => setEditForm({ ...editForm, address: v })} fullWidth />
            <Field label="Phone Number *" value={editForm.phoneNumber || ""} onChange={(v) => setEditForm({ ...editForm, phoneNumber: v })} required />
            <Field label="Secondary Contact" value={editForm.contactNo2 || ""} onChange={(v) => setEditForm({ ...editForm, contactNo2: v })} />
            <Field label="Hotline" value={editForm.hotline || ""} onChange={(v) => setEditForm({ ...editForm, hotline: v })} />
            <Field label="Lab Registration Number" value={editForm.labRegistrationNumber || ""} onChange={(v) => setEditForm({ ...editForm, labRegistrationNumber: v })} />
            <Field label="Business Registration Number" value={editForm.brNumber || ""} onChange={(v) => setEditForm({ ...editForm, brNumber: v })} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "16px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              <Save size={18} style={{ marginRight: 8 }} />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: "16px",
                background: "#f1f5f9",
                color: "#475569",
                border: "2px solid #cbd5e1",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              <X size={18} style={{ marginRight: 8 }} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* All Laboratories Section */}
      {!loading && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "32px 0 24px", flexWrap: "wrap", gap: 16 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#1e293b" }}>
              All Registered Laboratories <span style={{ color: "#64748b", fontSize: 20 }}>({totalLabs})</span>
            </h2>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, address, reg no..."
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "2px solid #e2e8f0",
                  minWidth: 280,
                  fontSize: 15,
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{ padding: "12px 16px", background: "#f1f5f9", borderRadius: "12px", border: "none", fontWeight: 600, cursor: "pointer" }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
            {filteredLabs.map((lab) => (
              <div
                key={lab.id}
                style={{
                  background: lab.status === "DISABLED"
                    ? "linear-gradient(135deg, #fee2e2 0%, #fecdd3 100%)"
                    : "white",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: lab.status === "DISABLED"
                    ? "0 8px 24px rgba(239,68,68,0.12)"
                    : "0 8px 24px rgba(0,0,0,0.07)",
                  border: lab.status === "DISABLED"
                    ? "2px solid #fca5a5"
                    : "1px solid #e5e7eb",
                  position: "relative",
                  transition: "all 0.25s ease",
                  opacity: lab.status === "DISABLED" ? 0.78 : 1,
                  cursor: "pointer",
                }}
                onClick={() => handleViewLab(lab)}
              >
                {lab.id === myProfile?.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 16,
                      background: "#325E8F",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    YOUR LAB
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {lab.profileImageUrl ? (
                      <div
                        style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "12px",
                          background: `url(${lab.profileImageUrl}) center/cover no-repeat`,
                          border: "3px solid #325E8F",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "12px",
                          background: getAvatarColor(lab.username),
                          color: "white",
                          fontSize: "24px",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 4px 12px rgba(50,94,143,0.3)",
                        }}
                      >
                        {getInitialAvatar(lab.username)}
                      </div>
                    )}
                    <h3 style={{ margin: "0 0 8px 0", fontSize: 21, fontWeight: 700, color: "#1e293b" }}>
                      {lab.username || "Unnamed Lab"}
                    </h3>
                  </div>
                  {getStatusBadge(lab.status)}
                </div>

                <div style={{ display: "grid", gap: "12px", fontSize: 15, color: "#475569" }}>
                  <InfoItem icon={<Mail size={18} />} label="Email" value={lab.email} color="#325E8F" small />
                  {lab.address && <InfoItem icon={<MapPin size={18} />} label="Address" value={lab.address} color="#16a34a" small />}
                  {lab.phoneNumber && (
                    <InfoItem icon={<Phone size={18} />} label="Phone" value={lab.phoneNumber} color="#f59e0b" small />
                  )}
                  {lab.contactNo2 && <InfoItem icon={<Phone size={18} />} label="Secondary Contact" value={lab.contactNo2} color="#f59e0b" small />}
                  {lab.hotline && <InfoItem icon={<Phone size={18} />} label="Hotline" value={lab.hotline} color="#9333ea" small />}
                  {lab.labRegistrationNumber && (
                    <InfoItem icon={<FileText size={18} />} label="Lab Reg." value={lab.labRegistrationNumber} color="#7c3aed" small />
                  )}
                  {lab.brNumber && (
                    <InfoItem icon={<Building2 size={18} />} label="BR No." value={lab.brNumber} color="#ea580c" small />
                  )}
                </div>

                <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewLab(lab);
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      border: "1.5px solid #7dd3fc",
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    <Eye size={16} /> View
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openStatusConfirm(
                        lab.id,
                        lab.username || "This Laboratory",
                        lab.status === "DISABLED" ? "ACTIVE" : "DISABLED"
                      );
                    }}
                    disabled={lab.id === myProfile?.id}
                    style={{
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      borderRadius: "10px",
                      border: "1.5px solid",
                      background: lab.status === "DISABLED" ? "#fefce8" : "#fee2e2",
                      color: lab.status === "DISABLED" ? "#854d0e" : "#991b1b",
                      borderColor: lab.status === "DISABLED" ? "#fef08a" : "#fca5a5",
                      cursor: lab.id === myProfile?.id ? "not-allowed" : "pointer",
                      opacity: lab.id === myProfile?.id ? 0.6 : 1,
                    }}
                  >
                    {lab.status === "DISABLED" ? "Re-enable" : "Disable"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredLabs.length === 0 && labs.length > 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <h3>No matching laboratories</h3>
              <p>Try different search terms or clear the filter.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, marginTop: "48px" }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: "12px 20px",
                  background: page === 0 ? "#e5e7eb" : "#325E8F",
                  color: page === 0 ? "#94a3b8" : "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: 700,
                  cursor: page === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <span style={{ fontWeight: 600, color: "#475569" }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={{
                  padding: "12px 20px",
                  background: page === totalPages - 1 ? "#e5e7eb" : "#325E8F",
                  color: page === totalPages - 1 ? "#94a3b8" : "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: 700,
                  cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
                }}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* View Lab Details Modal */}
      {viewLabOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => {
            setViewLabOpen(false);
            setViewTestsInModal(false);
            setShowBookingsModal(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              padding: "28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {selectedLabDetails?.profileImageUrl ? (
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "12px",
                      background: `url(${selectedLabDetails.profileImageUrl}) center/cover no-repeat`,
                      border: "3px solid #325E8F",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "12px",
                      background: getAvatarColor(selectedLabDetails?.username),
                      color: "white",
                      fontSize: "24px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(50,94,143,0.3)",
                    }}
                  >
                    {getInitialAvatar(selectedLabDetails?.username)}
                  </div>
                )}
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>
                  {selectedLabDetails?.username || "Lab Details"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setViewLabOpen(false);
                  setViewTestsInModal(false);
                  setShowBookingsModal(false);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={28} />
              </button>
            </div>

            {loadingLabDetails ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Loader2 size={48} style={{ color: "#325E8F", animation: "spin 1.2s linear infinite" }} />
                <p style={{ marginTop: 16, color: "#64748b" }}>Loading lab details...</p>
              </div>
            ) : labDetailsError ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444" }}>
                <AlertCircle size={48} style={{ marginBottom: 16 }} />
                <p>{labDetailsError}</p>
              </div>
            ) : !selectedLabDetails ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                <AlertCircle size={64} style={{ marginBottom: 16, opacity: 0.6 }} />
                <h3>No details available</h3>
              </div>
            ) : viewTestsInModal ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
                    Tests offered by {selectedLabDetails.username}
                  </h3>
                  <button
                    onClick={() => setViewTestsInModal(false)}
                    style={{
                      padding: "8px 16px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Back to Details
                  </button>
                </div>
                {loadingTests ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Loader2 size={48} style={{ color: "#325E8F", animation: "spin 1.2s linear infinite" }} />
                    <p>Loading tests...</p>
                  </div>
                ) : testsError ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444" }}>
                    <AlertCircle size={48} style={{ marginBottom: 16 }} />
                    <p>{testsError}</p>
                  </div>
                ) : labTests.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                    <FileText size={64} style={{ marginBottom: 16, opacity: 0.6 }} />
                    <h3>No tests available</h3>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {labTests.map((test) => (
                      <div
                        key={test.id}
                        style={{
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          background: "#f8fafc",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                          <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                            {test.testName || "Unnamed Test"}
                          </h4>
                          {test.price && (
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>
                              LKR {test.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {test.description && (
                          <p style={{ margin: "8px 0", color: "#475569", fontSize: 14 }}>
                            {test.description}
                          </p>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, fontSize: 13, color: "#64748b" }}>
                          {test.category && <div><strong>Category:</strong> {test.category}</div>}
                          {test.estimatedDuration && <div><strong>Duration:</strong> {test.estimatedDuration}</div>}
                          {test.prerequisites && <div><strong>Prerequisites:</strong> {test.prerequisites}</div>}
                        </div>
                        <div style={{ marginTop: 16, textAlign: "right" }}>
                          <button
                            onClick={() => {
                              setSelectedTest(test);
                              setShowBookingsModal(true);
                              setActiveBookingFilter("ALL");
                              setBookingsPage(0);
                              fetchBookingsByTestId(test.id);
                            }}
                            style={{
                              padding: "10px 20px",
                              background: "#7c3aed",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <BookOpen size={16} />
                            View Bookings
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <InfoItem icon={<Mail size={18} />} label="Email" value={selectedLabDetails.email} color="#325E8F" />
                  {selectedLabDetails.address && (
                    <InfoItem icon={<MapPin size={18} />} label="Address" value={selectedLabDetails.address} color="#16a34a" />
                  )}
                  {selectedLabDetails.phoneNumber && (
                    <InfoItem icon={<Phone size={18} />} label="Phone" value={selectedLabDetails.phoneNumber} color="#f59e0b" />
                  )}
                  {selectedLabDetails.contactNo2 && (
                    <InfoItem icon={<Phone size={18} />} label="Secondary Contact" value={selectedLabDetails.contactNo2} color="#f59e0b" />
                  )}
                  {selectedLabDetails.hotline && (
                    <InfoItem icon={<Phone size={18} />} label="Hotline" value={selectedLabDetails.hotline} color="#9333ea" />
                  )}
                  {selectedLabDetails.labRegistrationNumber && (
                    <InfoItem icon={<FileText size={18} />} label="Lab Reg. No" value={selectedLabDetails.labRegistrationNumber} color="#7c3aed" />
                  )}
                  {selectedLabDetails.brNumber && (
                    <InfoItem icon={<Building2 size={18} />} label="Business Reg. No" value={selectedLabDetails.brNumber} color="#ea580c" />
                  )}
                  {(selectedLabDetails.latitude || selectedLabDetails.longitude) && (
                    <InfoItem
                      icon={<Globe size={18} />}
                      label="Coordinates"
                      value={`${selectedLabDetails.latitude?.toFixed(6) || "—"}, ${selectedLabDetails.longitude?.toFixed(6) || "—"}`}
                      color="#0891b2"
                    />
                  )}
                </div>
                <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between" }}>
                  <button
                    onClick={() => {
                      setViewTestsInModal(true);
                      fetchLabTests(selectedLabDetails.id);
                    }}
                    style={{
                      padding: "12px 24px",
                      background: "#325E8F",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    View Tests
                  </button>
                  <button
                    onClick={() => setViewLabOpen(false)}
                    style={{
                      padding: "12px 28px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookings Modal */}
      {showBookingsModal && selectedTest && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 11000,
            padding: "20px",
          }}
          onClick={() => setShowBookingsModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                Bookings for: {selectedTest.testName || "Selected Test"}
              </h3>
              <button onClick={() => setShowBookingsModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={28} color="#475569" />
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
              {(["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "REJECTED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setBookingsPage(0);
                    setActiveBookingFilter(s);
                  }}
                  style={{
                    padding: "10px 20px",
                    background: activeBookingFilter === s ? (s === "ALL" ? "#6b7280" : s === "PENDING" ? "#f59e0b" : s === "CONFIRMED" ? "#16a34a" : s === "CANCELLED" ? "#ef4444" : s === "COMPLETED" ? "#3b82f6" : "#991b1b") : "#e5e7eb",
                    color: activeBookingFilter === s ? "white" : "#475569",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    minWidth: "120px",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {bookingsLoading ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Loader2 size={48} style={{ color: "#325E8F", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "#64748b" }}>Loading bookings...</p>
              </div>
            ) : bookingsError ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444" }}>
                <AlertCircle size={48} style={{ marginBottom: 16 }} />
                <p>{bookingsError}</p>
              </div>
            ) : getFilteredBookings().length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                <BookOpen size={64} style={{ opacity: 0.4, marginBottom: 16 }} />
                <h3 style={{ margin: "16px 0 8px", fontSize: "20px" }}>
                  {activeBookingFilter === "ALL" ? "No bookings found" : `No ${activeBookingFilter.toLowerCase()} bookings found`}
                </h3>
                <p>No bookings with status {activeBookingFilter === "ALL" ? "available" : activeBookingFilter.toLowerCase()} for this test.</p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: "16px" }}>
                  {getFilteredBookings().map((booking, index) => (
                    <div
                      key={booking.id || index}
                      style={{
                        padding: "18px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        background:
                          booking.status?.toUpperCase() === "CONFIRMED" ? "#f0fdf4" :
                          booking.status?.toUpperCase() === "CANCELLED" ? "#fee2e2" :
                          booking.status?.toUpperCase() === "COMPLETED" ? "#eff6ff" :
                          booking.status?.toUpperCase() === "REJECTED" ? "#fef2f2" :
                          booking.status?.toUpperCase() === "PENDING" ? "#fef3c7" :
                          "#f8fafc",
                      }}
                    >
                      <div style={{ fontSize: "17px", fontWeight: 700, marginBottom: "10px", color: "#1e293b" }}>
                        {booking.testName || "Lab Test Booking"}
                      </div>
                      <div style={{ display: "grid", gap: "6px", fontSize: "14px", color: "#475569" }}>
                        <div><strong>Booking Reference:</strong> {booking.bookingReference || "—"}</div>
                        <div><strong>Test Name:</strong> {booking.testName || "—"}</div>
                        <div><strong>Test Price:</strong> LKR {booking.testPrice?.toLocaleString() || "—"}</div>
                        <div><strong>Booking Date:</strong> {booking.bookingDate || "—"}</div>
                        <div><strong>Queue Number:</strong> {booking.queueNumber || "—"}</div>
                        <div><strong>Patient Name:</strong> {booking.patientName || "—"}</div>
                        <div><strong>NIC:</strong> {booking.nic || "—"}</div>
                        <div><strong>Phone Number:</strong> {booking.phoneNumber || "—"}</div>
                        <div>
                          <strong>Status:</strong>{" "}
                          <span style={{ fontWeight: 700, color: booking.status?.toUpperCase() === "CONFIRMED" ? "#15803d" : booking.status?.toUpperCase() === "CANCELLED" ? "#991b1b" : booking.status?.toUpperCase() === "COMPLETED" ? "#2563eb" : booking.status?.toUpperCase() === "REJECTED" ? "#991b1b" : booking.status?.toUpperCase() === "PENDING" ? "#f59e0b" : "#64748b" }}>
                            {booking.status || "UNKNOWN"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {bookingsTotalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", flexWrap: "wrap", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        onClick={() => setBookingsPage((p) => Math.max(0, p - 1))}
                        disabled={bookingsPage === 0}
                        style={{
                          padding: "10px 16px",
                          border: "none",
                          borderRadius: 8,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: bookingsPage === 0 ? "#f1f5f9" : "#325E8F",
                          color: bookingsPage === 0 ? "#94a3b8" : "white",
                          cursor: bookingsPage === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <span style={{ fontWeight: 700 }}>
                        Page {bookingsPage + 1} of {bookingsTotalPages || 1}
                      </span>
                      <button
                        onClick={() => setBookingsPage((p) => p + 1)}
                        disabled={bookingsPage >= bookingsTotalPages - 1}
                        style={{
                          padding: "10px 16px",
                          border: "none",
                          borderRadius: 8,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: bookingsPage >= bookingsTotalPages - 1 ? "#f1f5f9" : "#325E8F",
                          color: bookingsPage >= bookingsTotalPages - 1 ? "#94a3b8" : "white",
                          cursor: bookingsPage >= bookingsTotalPages - 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ textAlign: "right", marginTop: "28px" }}>
              <button
                onClick={() => setShowBookingsModal(false)}
                style={{
                  padding: "12px 32px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  color,
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: small ? "center" : "flex-start", gap: 12 }}>
      <div style={{ color, flexShrink: 0, marginTop: small ? 0 : 3 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: small ? 12 : 13, color: "#64748b", fontWeight: 500 }}>{label}</div>
        <div
          style={{
            fontWeight: 600,
            color: "#1e293b",
            fontSize: small ? 14 : 15,
            wordBreak: "break-word",
          }}
        >
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  fullWidth = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  required?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#334155" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: "10px",
          border: "2px solid #e2e8f0",
          fontSize: "15px",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#325E8F")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
    </div>
  );
}