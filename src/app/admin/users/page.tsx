"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Trash2,
  Mail,
  Phone,
  Save,
  CheckCircle,
  XCircle,
  Ban,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  Eye,
  IdCard,
  User,
  Calendar,
  Ruler,
  MapPin,
  Globe,
  Heart,
  Users,
  BookOpen,
} from "lucide-react";
import { getAuthToken, getAuthRole } from "@/lib/auth";
import ConfirmModal from "@/app/components/ConfirmModal";

const MAIN_BLUE = "#325E8F";

type Patient = {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  nic: string;
  status: "ACTIVE" | "INACTIVE" | "DISABLED" | "DELETED";
};

type DetailedPatient = {
  id?: number;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  nic?: string;
  passportNumber?: string;
  profileUrl?: string;
  nicFrontUrl?: string;
  nicBackUrl?: string;
  passportUrl?: string;
  birthCertificateFrontUrl?: string;
  birthCertificateBackUrl?: string;
  height?: string;
  address?: string;
  weight?: string;
  accType?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  authId?: string;
  guardianPhone?: string | null;
  relationshipToGuardian?: string | null;
  country?: string;
  emergencyContacts?: any[];
};

type GuestUser = {
  id: number;
  patientName?: string;
  email?: string;
  phoneNumber?: string;
  nic?: string;
  address?: string;
  status?: string;
  [key: string]: any;
};

type Booking = {
  id: number | string;
  bookingReference?: string;
  queueNumber?: number;
  patientName?: string;
  status?: string;
  scheduleId?: number;
  scheduleDate?: string;
  rejectReason?: string;
  consultationFee?: number | string;
  centerProfileUrl?: string;
  centerName?: string;
  startTime?: string;
  endTime?: string;
  centerType?: string;
  doctorName?: string;
  doctorProfileUrl?: string;
  [key: string]: any;
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [guestUsers, setGuestUsers] = useState<GuestUser[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<"patient" | "guest" | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState<DetailedPatient | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Registered Patient Bookings Modal States
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [patientBookings, setPatientBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [activeBookingFilter, setActiveBookingFilter] = useState<"CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED" | "ALL">("CONFIRMED");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [centerTypeFilter, setCenterTypeFilter] = useState<"ALL" | "HOSPITAL" | "DISPENSARY" | "HOSPITAL_OPD">("ALL");
  const [bookingsSearchTerm, setBookingsSearchTerm] = useState("");
  const [bookingsPage, setBookingsPage] = useState(0);
  const [bookingsSize] = useState(10);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);

  // Guest Bookings Modal States
  const [showGuestBookingsModal, setShowGuestBookingsModal] = useState(false);
  const [guestBookings, setGuestBookings] = useState<Booking[]>([]);
  const [loadingGuestBookings, setLoadingGuestBookings] = useState(false);
  const [guestBookingsError, setGuestBookingsError] = useState<string | null>(null);
  const [selectedGuestNic, setSelectedGuestNic] = useState<string | null>(null);
  const [guestCenterTypeFilter, setGuestCenterTypeFilter] = useState<"ALL" | "HOSPITAL" | "DISPENSARY" | "HOSPITAL_OPD">("ALL");
  const [guestBookingsSearchTerm, setGuestBookingsSearchTerm] = useState("");
  const [activeGuestBookingFilter, setActiveGuestBookingFilter] = useState<"CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED" | "ALL">("CONFIRMED");
  const [guestBookingsPage, setGuestBookingsPage] = useState(0);
  const [guestBookingsSize] = useState(10);
  const [guestBookingsTotalPages, setGuestBookingsTotalPages] = useState(0);
  const [selectedGuestName, setSelectedGuestName] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab] = useState<"registered" | "guest">("registered");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  // Auth check
  useEffect(() => {
    const token = getAuthToken();
    const role = getAuthRole();
    if (!token || role === "guest") {
      window.location.href = "/admin/login";
      return;
    }
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      window.location.href = "/admin/dashboard";
      return;
    }
    setCurrentRole(role);
    setLoadingAuth(false);
  }, []);

  // Fetch patients & guests
  useEffect(() => {
    if (loadingAuth || !currentRole) return;

    const fetchPatients = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoadingPatients(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/auth/super/patients?page=${page}&size=${size}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text() || `Failed (${res.status})`);

        const result = await res.json();
        const pageData = result.data || result;

        if (!pageData?.content) {
          setPatients([]);
          setTotalPages(0);
          setTotalElements(0);
          return;
        }

        const serverPatients = pageData.content
          .filter((u: any) => {
            const role = (u.role || u.userRole || "").toString().toUpperCase();
            return !["ADMIN", "SUPER_ADMIN", "HOSPITAL_ADMIN"].includes(role);
          })
          .map((u: any) => ({
            id: u.id || 0,
            username: u.username || u.name || "Unknown",
            email: u.email || "",
            phoneNumber: u.phoneNumber || u.phone || "N/A",
            nic: u.nic || "N/A",
            status: (u.status || "ACTIVE").toString().toUpperCase() as Patient["status"],
          }));

        setPatients(serverPatients);
        setTotalPages(pageData.totalPages || 0);
        setTotalElements(pageData.totalElements || pageData.total || 0);
      } catch (err: any) {
        console.error("Fetch patients error:", err);
        setError(err.message || "Failed to load patients");
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    };

    const fetchGuests = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoadingGuests(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/guest/all`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text() || `Failed (${res.status})`);

        const data = await res.json();
        const guests = data.content || data.data || data || [];
        setGuestUsers(
          guests.map((g: any) => ({
            id: g.id,
            patientName: g.patientName || g.username || "Unknown",
            email: g.email || "—",
            phoneNumber: g.phoneNumber || "—",
            nic: g.nic || "—",
            address: g.address || "—",
            status: g.status || "GUEST",
          }))
        );
      } catch (err: any) {
        console.error("Fetch guests error:", err);
        setError(err.message || "Failed to load guest users");
        setGuestUsers([]);
      } finally {
        setLoadingGuests(false);
      }
    };

    fetchPatients();
    fetchGuests();
  }, [loadingAuth, currentRole, page]);

  // View patient details
  const handleViewPatient = async (patient: Patient) => {
    setViewPatient(null);
    setViewOpen(true);
    setLoadingDetails(true);
    const token = getAuthToken();
    if (!token) {
      setLoadingDetails(false);
      setToast({ type: "error", message: "Not authenticated" });
      return;
    }

    try {
      const rawNic = (patient.nic || "").toString().trim();
      const useNicSearch = rawNic && rawNic !== "N/A" && rawNic !== "-";
      const detailsUrl = useNicSearch
        ? `${API_BASE}/patients/internal/search-nic?nic=${encodeURIComponent(rawNic)}`
        : `${API_BASE}/patients/internal/admins/${patient.id}`;

      const res = await fetch(detailsUrl, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }

      const response = await res.json();
      const data = response.data || response || {};

      const detailed: DetailedPatient = {
        id: data.id,
        fullName: data.fullName || "Not Provided",
        phoneNumber: data.phoneNumber || "—",
        email: data.email || "—",
        nic: data.nic || "—",
        passportNumber: data.passportNumber || "—",
        profileUrl: data.profileUrl,
        nicFrontUrl: data.nicFrontUrl,
        nicBackUrl: data.nicBackUrl,
        passportUrl: data.passportUrl,
        birthCertificateFrontUrl: data.birthCertificateFrontUrl,
        birthCertificateBackUrl: data.birthCertificateBackUrl,
        height: data.height || "—",
        address: data.address || "—",
        weight: data.weight || "—",
        accType: data.accType || "—",
        gender: data.gender || "—",
        dateOfBirth: data.dateOfBirth || "—",
        bloodGroup: data.bloodGroup || "—",
        authId: data.authId || patient.id.toString(),
        guardianPhone: data.guardianPhone || "—",
        relationshipToGuardian: data.relationshipToGuardian || "—",
        country: data.country || "—",
        emergencyContacts: data.emergencyContacts || [],
      };

      setViewPatient(detailed);
      if (detailed.id != null) {
        setSelectedPatientId(detailed.id);
      }
    } catch (err: any) {
      console.error("Fetch details error:", err);
      setToast({ type: "error", message: err.message || "Failed to load patient details" });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch patient bookings
  const fetchPatientBookings = async () => {
    const patientId = viewPatient?.id ?? selectedPatientId;
    if (!patientId) {
      setBookingsError("No patient selected");
      return;
    }

    setLoadingBookings(true);
    setBookingsError(null);
    setPatientBookings([]);
    const token = getAuthToken();
    if (!token) {
      setLoadingBookings(false);
      setBookingsError("Not authenticated");
      return;
    }

    try {
      let url = `${API_BASE}/bookings/patient/history/${patientId}?page=${bookingsPage}&size=${bookingsSize}`;
      if (centerTypeFilter !== "ALL") url += `&centerType=${centerTypeFilter}`;
      if (activeBookingFilter !== "ALL") url += `&status=${activeBookingFilter}`;
      if (selectedDate) url += `&date=${selectedDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }

      const data = await res.json();
      const pageData = data.content ? data : data.data ? data.data : data;
      const bookings = Array.isArray(pageData.content) ? pageData.content : Array.isArray(pageData) ? pageData : [];

      setPatientBookings(bookings);
      setBookingsTotalPages(pageData.totalPages || Math.ceil((pageData.totalElements || bookings.length) / bookingsSize));
    } catch (err: any) {
      console.error("Bookings fetch error:", err);
      setBookingsError(err.message || "Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (showBookingsModal && (viewPatient?.id || selectedPatientId)) {
      setBookingsPage(0);
      fetchPatientBookings();
    }
  }, [showBookingsModal, centerTypeFilter, activeBookingFilter, selectedDate, bookingsPage]);

  // Fetch guest bookings
  const fetchGuestBookings = async () => {
    if (!selectedGuestNic) {
      setGuestBookingsError("No guest NIC selected");
      return;
    }

    setLoadingGuestBookings(true);
    setGuestBookingsError(null);
    setGuestBookings([]);
    const token = getAuthToken();
    if (!token) {
      setLoadingGuestBookings(false);
      setGuestBookingsError("Not authenticated");
      return;
    }

    try {
      let url = `${API_BASE}/bookings/guest/history?nic=${encodeURIComponent(selectedGuestNic)}&page=${guestBookingsPage}&size=${guestBookingsSize}`;
      if (guestCenterTypeFilter !== "ALL") url += `&centerType=${guestCenterTypeFilter}`;
      if (activeGuestBookingFilter !== "ALL") url += `&status=${activeGuestBookingFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(await res.text() || `Failed (${res.status})`);

      const data = await res.json();
      const pageData = data.content ? data : data.data ? data.data : data;
      const bookings = Array.isArray(pageData.content) ? pageData.content : Array.isArray(pageData) ? pageData : [];

      setGuestBookings(bookings);
      setGuestBookingsTotalPages(pageData.totalPages || Math.ceil((pageData.totalElements || bookings.length) / guestBookingsSize));
    } catch (err: any) {
      setGuestBookingsError(err.message || "Failed to load guest bookings");
    } finally {
      setLoadingGuestBookings(false);
    }
  };

  useEffect(() => {
    if (showGuestBookingsModal && selectedGuestNic) {
      setGuestBookingsPage(0);
      fetchGuestBookings();
    }
  }, [showGuestBookingsModal, guestCenterTypeFilter, activeGuestBookingFilter, guestBookingsPage]);

  // ====================== DELETE FUNCTION ======================
  const handleConfirmDelete = async () => {
    if (!selectedItem || !deleteType) return;

    setConfirmLoading(true);
    const token = getAuthToken();
    if (!token) {
      setToast({ type: "error", message: "Not authenticated" });
      setConfirmLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/super/users/${selectedItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setToast({ type: "success", message: `${deleteType === "patient" ? "Patient" : "Guest"} deleted successfully` });

        if (deleteType === "patient") {
          setPatients((prev) => prev.filter((p) => p.id !== selectedItem.id));
        } else {
          setGuestUsers((prev) => prev.filter((g) => g.id !== selectedItem.id));
        }
      } else {
        const msg = await res.text();
        setToast({ type: "error", message: msg || "Delete failed" });
      }
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Delete error" });
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setSelectedItem(null);
      setDeleteType(null);
    }
  };

  // ====================== STATUS UPDATE FUNCTION ======================
  const handleStatusChange = async (patientId: number, newStatus: string) => {
    const token = getAuthToken();
    if (!token) {
      setToast({ type: "error", message: "Not authenticated" });
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/auth/admin/users/${patientId}/status?status=${newStatus.toUpperCase()}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        setToast({ type: "success", message: `Status updated to ${newStatus}` });

        // Update UI instantly
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patientId ? { ...p, status: newStatus.toUpperCase() as Patient["status"] } : p
          )
        );
      } else {
        const msg = await res.text();
        setToast({ type: "error", message: msg || "Failed to update status" });
      }
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Status update failed" });
    }
  };

  const promptDelete = (item: any, type: "patient" | "guest") => {
    setSelectedItem(item);
    setDeleteType(type);
    setConfirmOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const upper = (status || "GUEST").toUpperCase();
    const config: Record<string, any> = {
      ACTIVE: { bg: "#d1fae5", color: "#065f46", icon: CheckCircle },
      INACTIVE: { bg: "#fef3c7", color: "#92400e", icon: XCircle },
      DISABLED: { bg: "#fee2e2", color: "#991b1b", icon: Ban },
      DELETED: { bg: "#f3f4f6", color: "#6b7280", icon: UserX },
      GUEST: { bg: "#dbeafe", color: "#1e40af", icon: Users },
    };
    const { bg, color, icon: Icon } = config[upper] || config.GUEST;
    return (
      <span
        style={{
          padding: "6px 14px",
          borderRadius: "30px",
          fontSize: "12px",
          fontWeight: 700,
          backgroundColor: bg,
          color,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          width: "fit-content",
        }}
      >
        <Icon size={14} /> {upper}
      </span>
    );
  };

  const filteredRegisteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter((p) =>
      p.username.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.phoneNumber.toLowerCase().includes(term) ||
      p.nic.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  const filteredGuests = useMemo(() => {
    if (!searchTerm.trim()) return guestUsers;
    const term = searchTerm.toLowerCase();
    return guestUsers.filter((g) =>
      (g.patientName || "").toLowerCase().includes(term) ||
      (g.email || "").toLowerCase().includes(term) ||
      (g.phoneNumber || "").toLowerCase().includes(term) ||
      (g.nic || "").toLowerCase().includes(term)
    );
  }, [guestUsers, searchTerm]);

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === "CONFIRMED") return { bg: "#16a34a" };
    if (s === "CANCELLED") return { bg: "#ef4444" };
    if (s === "COMPLETED") return { bg: "#3b82f6" };
    if (s === "REJECTED") return { bg: "#991b1b" };
    return { bg: "#6b7280" };
  };

  const getBookingBackground = (status?: string) => {
    const s = (status || "").toUpperCase();
    if (s === "CONFIRMED") return "#f0fdf4";
    if (s === "CANCELLED") return "#fee2e2";
    if (s === "COMPLETED") return "#eff6ff";
    if (s === "REJECTED") return "#fef2f2";
    return "#f8fafc";
  };

  const getStatusStyle = (status?: string) => {
    const s = (status || "").toUpperCase();
    let color = "#6b7280";
    let bg = "#f1f5f9";
    if (s === "CONFIRMED") { color = "#166534"; bg = "#dcfce7"; }
    if (s === "CANCELLED") { color = "#991b1b"; bg = "#fee2e2"; }
    if (s === "COMPLETED") { color = "#1e40af"; bg = "#dbeafe"; }
    if (s === "REJECTED") { color = "#991b1b"; bg = "#fecaca"; }
    return { padding: "4px 10px", borderRadius: "6px", backgroundColor: bg, color, fontWeight: 600, fontSize: "13px" };
  };

  return (
    <div style={{ padding: "32px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Toast Notification */}
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
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "white" }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmOpen}
        title={`Delete ${deleteType === "patient" ? "Patient" : "Guest User"}`}
        message={`Are you sure you want to delete this ${deleteType === "patient" ? "patient" : "guest user"}? This action cannot be undone.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        confirmLoading={confirmLoading}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {/* Patient Details Modal */}
      {viewOpen && viewPatient && (
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
          onClick={() => setViewOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              padding: "28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>Patient Details</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={() => {
                    setBookingsPage(0);
                    setActiveBookingFilter("CONFIRMED");
                    setCenterTypeFilter("ALL");
                    setBookingsSearchTerm("");
                    setShowBookingsModal(true);
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <BookOpen size={18} />
                  View Bookings
                </button>
                <button onClick={() => setViewOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                  <X size={28} />
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Loader2 size={48} style={{ color: MAIN_BLUE, animation: "spin 1.2s linear infinite" }} />
                <p style={{ marginTop: 20, color: "#64748b", fontSize: "16px" }}>Loading complete patient information...</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "32px" }}>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      background: viewPatient.profileUrl ? `url(${viewPatient.profileUrl}) center/cover` : MAIN_BLUE,
                      borderRadius: "16px",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                      flexShrink: 0,
                    }}
                  >
                    {!viewPatient.profileUrl && (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "48px", fontWeight: 700 }}>
                        {viewPatient.fullName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "26px", fontWeight: 700 }}>
                      {viewPatient.fullName || "Name not provided"}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", color: "#475569" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <IdCard size={18} /> NIC: {viewPatient.nic || "—"}
                      </div>
                      {viewPatient.passportNumber && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <IdCard size={18} /> Passport: {viewPatient.passportNumber}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Calendar size={18} /> DOB: {viewPatient.dateOfBirth || "—"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <User size={18} /> Gender: {viewPatient.gender || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <DetailItem icon={<Mail size={18} />} label="Email" value={viewPatient.email} />
                  <DetailItem icon={<Phone size={18} />} label="Phone" value={viewPatient.phoneNumber} />
                  <DetailItem icon={<Ruler size={18} />} label="Height" value={viewPatient.height} />
                  <DetailItem icon={<Heart size={18} />} label="Weight" value={viewPatient.weight} />
                  <DetailItem icon={<MapPin size={18} />} label="Address" value={viewPatient.address} fullWidth />
                </div>

                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Documents</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    {viewPatient.profileUrl && <ImageCard label="Profile Photo" url={viewPatient.profileUrl} />}
                    {viewPatient.nicFrontUrl && <ImageCard label="NIC Front" url={viewPatient.nicFrontUrl} />}
                    {viewPatient.nicBackUrl && <ImageCard label="NIC Back" url={viewPatient.nicBackUrl} />}
                    {viewPatient.passportUrl && <ImageCard label="Passport" url={viewPatient.passportUrl} />}
                    {viewPatient.birthCertificateFrontUrl && <ImageCard label="Birth Cert Front" url={viewPatient.birthCertificateFrontUrl} />}
                    {viewPatient.birthCertificateBackUrl && <ImageCard label="Birth Cert Back" url={viewPatient.birthCertificateBackUrl} />}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <DetailItem icon={<Phone size={18} />} label="Guardian Phone" value={viewPatient.guardianPhone} />
                  <DetailItem icon={<User size={18} />} label="Relationship to Guardian" value={viewPatient.relationshipToGuardian} />
                  <DetailItem icon={<Globe size={18} />} label="Country" value={viewPatient.country} />
                </div>

                <div style={{ marginTop: 32, textAlign: "right" }}>
                  <button
                    onClick={() => setViewOpen(false)}
                    style={{
                      padding: "12px 28px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: "15px",
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

      {/* Bookings Modal - Registered Patients */}
      {showBookingsModal && (
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
              maxWidth: "1100px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                Bookings for {viewPatient?.fullName || "Patient"}
              </h3>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={fetchPatientBookings} style={{ padding: "8px 16px", background: "#f1f5f9", color: MAIN_BLUE, border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <RefreshCw size={16} /> Refresh
                </button>
                <button onClick={() => setShowBookingsModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <X size={28} color="#475569" />
                </button>
              </div>
            </div>

            {/* Center Type Filter */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>Center Type</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {["ALL", "HOSPITAL", "DISPENSARY", "HOSPITAL_OPD"].map((type) => (
                  <button
                    key={type}
                    onClick={() => { setBookingsPage(0); setCenterTypeFilter(type as any); }}
                    style={{
                      padding: "8px 18px",
                      background: centerTypeFilter === type ? MAIN_BLUE : "#e5e7eb",
                      color: centerTypeFilter === type ? "white" : "#475569",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: "24px", position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: MAIN_BLUE }} />
              <input
                type="text"
                placeholder="Search by doctor name or center name..."
                value={bookingsSearchTerm}
                onChange={(e) => setBookingsSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 44px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "14px",
                  backgroundColor: "#fff",
                  outline: "none",
                }}
              />
            </div>

            {/* Status Filters */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
              {(["ALL", "CONFIRMED", "CANCELLED", "COMPLETED", "REJECTED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setBookingsPage(0); setActiveBookingFilter(s); }}
                  style={{
                    padding: "8px 18px",
                    background: activeBookingFilter === s ? getStatusColor(s).bg : "#e5e7eb",
                    color: activeBookingFilter === s ? "white" : "#475569",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#0f172a" }}>Filter by Date</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <input
                  type="date"
                  value={selectedDate || ""}
                  onChange={(e) => { setSelectedDate(e.target.value || null); setBookingsPage(0); }}
                  style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", width: "200px", fontSize: "14px" }}
                />
                {selectedDate && (
                  <button onClick={() => { setSelectedDate(null); setBookingsPage(0); }} style={{ color: "#dc2626", fontWeight: 600, fontSize: "14px" }}>
                    Clear date
                  </button>
                )}
              </div>
            </div>

            {/* Bookings List */}
            {loadingBookings ? (
              <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Loader2 size={48} style={{ color: MAIN_BLUE, animation: "spin 1s linear infinite" }} />
                <p style={{ marginTop: 16, color: "#64748b" }}>Loading bookings...</p>
              </div>
            ) : bookingsError ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#ef4444" }}>
                <AlertCircle size={48} style={{ marginBottom: 16 }} />
                <p style={{ fontWeight: 600 }}>{bookingsError}</p>
              </div>
            ) : patientBookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "100px 0", color: "#94a3b8" }}>
                <BookOpen size={64} style={{ opacity: 0.4, marginBottom: 16 }} />
                <p>No bookings found</p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: "16px" }}>
                  {patientBookings
                    .filter((b) => {
                      const term = bookingsSearchTerm.toLowerCase().trim();
                      if (!term) return true;
                      return (
                        (b.doctorName || "").toLowerCase().includes(term) ||
                        (b.centerName || "").toLowerCase().includes(term)
                      );
                    })
                    .map((booking, index) => (
                      <div
                        key={`${booking.id ?? "booking"}-${index}`}
                        style={{
                          padding: "18px 22px",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          background: getBookingBackground(booking.status),
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                              {booking.bookingReference || "—"} {booking.queueNumber ? `• Queue #${booking.queueNumber}` : ""}
                            </div>
                            <div style={{ fontSize: "14px", color: "#475569", marginBottom: 6 }}>
                              <strong>Status:</strong> <span style={getStatusStyle(booking.status)}>{booking.status || "UNKNOWN"}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", minWidth: "180px" }}>
                            <div style={{ fontSize: "15px", fontWeight: 600, color: MAIN_BLUE }}>
                              {booking.startTime || "—"} – {booking.endTime || "—"}
                            </div>
                            <div style={{ fontSize: "14px", color: "#475569" }}>{booking.scheduleDate || "—"}</div>
                          </div>
                        </div>

                        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "14px" }}>
                          <div><strong>Patient:</strong> {booking.patientName || "—"}</div>
                          <div><strong>Doctor:</strong> {booking.doctorName || "—"}</div>
                          <div><strong>Center:</strong> {booking.centerName || "—"}</div>
                          <div><strong>Center Type:</strong> {booking.centerType || "—"}</div>
                          <div><strong>Schedule ID:</strong> {booking.scheduleId ?? "—"}</div>
                          <div><strong>Fee:</strong> {booking.consultationFee ?? "—"}</div>
                          {booking.rejectReason && (
                            <div style={{ gridColumn: "1 / -1", color: "#dc2626", fontWeight: 500 }}>
                              <strong>Reject Reason:</strong> {booking.rejectReason}
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {booking.centerProfileUrl && <img src={booking.centerProfileUrl} alt="Center" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0" }} onError={(e) => (e.currentTarget.style.display = "none")} />}
                          {booking.doctorProfileUrl && <img src={booking.doctorProfileUrl} alt="Doctor" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" }} onError={(e) => (e.currentTarget.style.display = "none")} />}
                        </div>
                      </div>
                    ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => setBookingsPage((p) => Math.max(0, p - 1))} disabled={bookingsPage === 0} style={{ padding: "10px 16px", background: bookingsPage === 0 ? "#f1f5f9" : MAIN_BLUE, color: bookingsPage === 0 ? "#94a3b8" : "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: bookingsPage === 0 ? "not-allowed" : "pointer" }}>
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontWeight: 700 }}>Page {bookingsPage + 1} of {bookingsTotalPages || 1}</span>
                    <button onClick={() => setBookingsPage((p) => p + 1)} disabled={bookingsPage >= bookingsTotalPages - 1} style={{ padding: "10px 16px", background: bookingsPage >= bookingsTotalPages - 1 ? "#f1f5f9" : MAIN_BLUE, color: bookingsPage >= bookingsTotalPages - 1 ? "#94a3b8" : "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: bookingsPage >= bookingsTotalPages - 1 ? "not-allowed" : "pointer" }}>
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                  <button onClick={() => setShowBookingsModal(false)} style={{ padding: "12px 32px", background: "#ef4444", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Guest Bookings Modal */}
      {showGuestBookingsModal && (
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
          onClick={() => setShowGuestBookingsModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "1100px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                Bookings for Guest: {selectedGuestName || selectedGuestNic}
              </h3>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={fetchGuestBookings} style={{ padding: "8px 16px", background: "#f1f5f9", color: MAIN_BLUE, border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <RefreshCw size={16} /> Refresh
                </button>
                <button onClick={() => setShowGuestBookingsModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <X size={28} color="#475569" />
                </button>
              </div>
            </div>

            {/* Center Type Filter for Guest */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>Center Type</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {["ALL", "HOSPITAL", "DISPENSARY", "HOSPITAL_OPD"].map((type) => (
                  <button
                    key={type}
                    onClick={() => { setGuestBookingsPage(0); setGuestCenterTypeFilter(type as any); }}
                    style={{
                      padding: "8px 18px",
                      background: guestCenterTypeFilter === type ? MAIN_BLUE : "#e5e7eb",
                      color: guestCenterTypeFilter === type ? "white" : "#475569",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Search */}
            <div style={{ marginBottom: "24px", position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: MAIN_BLUE }} />
              <input
                type="text"
                placeholder="Search by doctor name or center name..."
                value={guestBookingsSearchTerm}
                onChange={(e) => setGuestBookingsSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 44px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "14px",
                  backgroundColor: "#fff",
                  outline: "none",
                }}
              />
            </div>

            {/* Guest Status Filters */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
              {(["ALL", "CONFIRMED", "CANCELLED", "COMPLETED", "REJECTED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setGuestBookingsPage(0); setActiveGuestBookingFilter(s); }}
                  style={{
                    padding: "8px 18px",
                    background: activeGuestBookingFilter === s ? getStatusColor(s).bg : "#e5e7eb",
                    color: activeGuestBookingFilter === s ? "white" : "#475569",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Guest Bookings Content */}
            {loadingGuestBookings ? (
              <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Loader2 size={48} style={{ color: MAIN_BLUE, animation: "spin 1s linear infinite" }} />
                <p style={{ marginTop: 16, color: "#64748b" }}>Loading guest bookings...</p>
              </div>
            ) : guestBookingsError ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#ef4444" }}>
                <AlertCircle size={48} style={{ marginBottom: 16 }} />
                <p style={{ fontWeight: 600 }}>{guestBookingsError}</p>
              </div>
            ) : guestBookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "100px 0", color: "#94a3b8" }}>
                <BookOpen size={64} style={{ opacity: 0.4, marginBottom: 16 }} />
                <p>No bookings found for this guest</p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: "16px" }}>
                  {guestBookings
                    .filter((b) => {
                      const term = guestBookingsSearchTerm.toLowerCase().trim();
                      if (!term) return true;
                      return (
                        (b.doctorName || "").toLowerCase().includes(term) ||
                        (b.centerName || "").toLowerCase().includes(term)
                      );
                    })
                    .map((booking, index) => (
                      <div
                        key={`${booking.id ?? "guest-booking"}-${index}`}
                        style={{
                          padding: "18px 22px",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          background: getBookingBackground(booking.status),
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                              {booking.bookingReference || "—"} {booking.queueNumber ? `• Queue #${booking.queueNumber}` : ""}
                            </div>
                            <div style={{ fontSize: "14px", color: "#475569", marginBottom: 6 }}>
                              <strong>Status:</strong> <span style={getStatusStyle(booking.status)}>{booking.status || "UNKNOWN"}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", minWidth: "180px" }}>
                            <div style={{ fontSize: "15px", fontWeight: 600, color: MAIN_BLUE }}>
                              {booking.startTime || "—"} – {booking.endTime || "—"}
                            </div>
                            <div style={{ fontSize: "14px", color: "#475569" }}>{booking.scheduleDate || "—"}</div>
                          </div>
                        </div>

                        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "14px" }}>
                          <div><strong>Guest:</strong> {booking.patientName || selectedGuestName}</div>
                          <div><strong>Doctor:</strong> {booking.doctorName || "—"}</div>
                          <div><strong>Center:</strong> {booking.centerName || "—"}</div>
                          <div><strong>Center Type:</strong> {booking.centerType || "—"}</div>
                          <div><strong>Schedule ID:</strong> {booking.scheduleId ?? "—"}</div>
                          <div><strong>Fee:</strong> {booking.consultationFee ?? "—"}</div>
                          {booking.rejectReason && (
                            <div style={{ gridColumn: "1 / -1", color: "#dc2626", fontWeight: 500 }}>
                              <strong>Reject Reason:</strong> {booking.rejectReason}
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {booking.centerProfileUrl && <img src={booking.centerProfileUrl} alt="Center" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0" }} onError={(e) => (e.currentTarget.style.display = "none")} />}
                          {booking.doctorProfileUrl && <img src={booking.doctorProfileUrl} alt="Doctor" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" }} onError={(e) => (e.currentTarget.style.display = "none")} />}
                        </div>
                      </div>
                    ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => setGuestBookingsPage((p) => Math.max(0, p - 1))} disabled={guestBookingsPage === 0} style={{ padding: "10px 16px", background: guestBookingsPage === 0 ? "#f1f5f9" : MAIN_BLUE, color: guestBookingsPage === 0 ? "#94a3b8" : "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: guestBookingsPage === 0 ? "not-allowed" : "pointer" }}>
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontWeight: 700 }}>Page {guestBookingsPage + 1} of {guestBookingsTotalPages || 1}</span>
                    <button onClick={() => setGuestBookingsPage((p) => p + 1)} disabled={guestBookingsPage >= guestBookingsTotalPages - 1} style={{ padding: "10px 16px", background: guestBookingsPage >= guestBookingsTotalPages - 1 ? "#f1f5f9" : MAIN_BLUE, color: guestBookingsPage >= guestBookingsTotalPages - 1 ? "#94a3b8" : "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: guestBookingsPage >= guestBookingsTotalPages - 1 ? "not-allowed" : "pointer" }}>
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                  <button onClick={() => setShowGuestBookingsModal(false)} style={{ padding: "12px 32px", background: "#ef4444", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/dashboard" style={{ color: MAIN_BLUE, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <ChevronLeft size={22} /> Back to Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              {activeTab === "registered" ? "Patients Management" : "Guest Users"}
            </h1>
            <p style={{ color: "#64748b", marginTop: "8px", fontSize: "15px" }}>
              {activeTab === "registered" ? "View and manage all registered patients" : "View and manage guest users"}
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === "registered") {
                setPage(0);
              } else {
                setLoadingGuests(true);
                fetch(`${API_BASE}/guest/all`, {
                  headers: { Authorization: `Bearer ${getAuthToken() || ""}` },
                })
                  .then((res) => res.json())
                  .then((data) => setGuestUsers(data.content || data.data || data || []))
                  .catch(() => {})
                  .finally(() => setLoadingGuests(false));
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#f1f5f9",
              color: "#325E8F",
              borderRadius: "12px",
              border: "2px solid #cbd5e1",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("registered")} style={{ padding: "12px 24px", background: activeTab === "registered" ? MAIN_BLUE : "#f1f5f9", color: activeTab === "registered" ? "white" : MAIN_BLUE, border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: activeTab === "registered" ? "0 4px 12px rgba(50,94,143,0.3)" : "none" }}>
            Registered Patients
          </button>
          <button onClick={() => setActiveTab("guest")} style={{ padding: "12px 24px", background: activeTab === "guest" ? MAIN_BLUE : "#f1f5f9", color: activeTab === "guest" ? "white" : MAIN_BLUE, border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: activeTab === "guest" ? "0 4px 12px rgba(50,94,143,0.3)" : "none" }}>
            Guest Users
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ backgroundColor: "#f0f9ff", padding: "12px 20px", borderRadius: "12px", border: "1.5px solid #bae6fd", fontSize: "15px", color: "#0369a1", fontWeight: 600 }}>
            👥 <strong>Total {activeTab === "registered" ? "Patients" : "Guests"}:</strong> {activeTab === "registered" ? totalElements : guestUsers.length}
          </div>
          <div style={{ backgroundColor: "#fef3c7", padding: "12px 20px", borderRadius: "12px", border: "1.5px solid #fde68a", fontSize: "15px", color: "#92400e", fontWeight: 600 }}>
            👤 <strong>Your Role:</strong> {currentRole || "Loading..."}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "28px", position: "relative" }}>
        <Search size={22} style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: MAIN_BLUE }} />
        <input
          type="text"
          placeholder="Search by name, email, phone or NIC..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 20px 14px 56px",
            borderRadius: "14px",
            border: "2px solid #e2e8f0",
            fontSize: "15px",
            backgroundColor: "#fff",
            boxShadow: "0 4px 12px rgba(50,94,143,0.06)",
            outline: "none",
          }}
        />
      </div>

      {/* Main Table Area */}
      <div style={{ background: "white", borderRadius: "18px", overflow: "hidden", boxShadow: "0 12px 48px rgba(15,23,42,0.12)", border: "1px solid #e2e8f0" }}>
        {activeTab === "registered" ? (
          /* ==================== REGISTERED PATIENTS TABLE ==================== */
          <>
            {loadingPatients ? (
              <div style={{ padding: "80px 20px", textAlign: "center" }}>
                <Loader2 size={48} style={{ color: MAIN_BLUE, animation: "spin 1.5s linear infinite" }} />
                <p style={{ color: "#64748b", fontSize: "16px" }}>Loading patients...</p>
              </div>
            ) : error ? (
              <div style={{ padding: "80px 20px", textAlign: "center", color: "#ef4444" }}>
                <AlertCircle size={52} style={{ marginBottom: 16 }} />
                <p style={{ fontSize: "16px", fontWeight: 600 }}>{error}</p>
              </div>
            ) : filteredRegisteredPatients.length === 0 ? (
              <div style={{ padding: "80px 20px", textAlign: "center", color: "#94a3b8" }}>
                <UserX size={52} style={{ marginBottom: "16px", opacity: 0.5 }} />
                <p style={{ fontSize: "18px", fontWeight: 600 }}>No patients found</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: "1000px", width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "18px 24px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "14px" }}>PATIENT</th>
                        <th style={{ padding: "18px 24px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "14px" }}>CONTACT</th>
                        <th style={{ padding: "18px 24px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "14px" }}>NIC</th>
                        <th style={{ padding: "18px 24px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "14px" }}>STATUS</th>
                        <th style={{ padding: "18px 24px", textAlign: "center", color: "#475569", fontWeight: 700, fontSize: "14px" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegisteredPatients.map((patient, idx) => {
                        const isDeleted = patient.status === "DELETED";
                        return (
                          <tr
                            key={patient.id}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                            }}
                          >
                            <td style={{ padding: "20px 24px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div style={{ width: "50px", height: "50px", backgroundColor: MAIN_BLUE, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "18px" }}>
                                  {patient.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ fontWeight: 700, color: "#0f172a" }}>{patient.username}</div>
                              </div>
                            </td>
                            <td style={{ padding: "20px 24px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 6 }}>
                                <Mail size={16} color={MAIN_BLUE} /> {patient.email}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Phone size={16} color="#10b981" /> {patient.phoneNumber}
                              </div>
                            </td>
                            <td style={{ padding: "20px 24px" }}>{patient.nic}</td>
                            <td style={{ padding: "20px 24px" }}>{getStatusBadge(patient.status)}</td>
                            <td style={{ padding: "20px 24px", textAlign: "center" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                                <button
                                  onClick={() => handleViewPatient(patient)}
                                  style={{
                                    padding: "10px 14px",
                                    background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                                    color: "#0369a1",
                                    border: "1.5px solid #7dd3fc",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <Eye size={16} /> View
                                </button>

                                <select
                                  value={patient.status}
                                  onChange={(e) => handleStatusChange(patient.id, e.target.value)}
                                  disabled={isDeleted}
                                  style={{
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1.5px solid #cbd5e1",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    background: "#f9fafb",
                                    cursor: isDeleted ? "not-allowed" : "pointer",
                                  }}
                                >
                                  <option value="ACTIVE">Active</option>
                                  <option value="INACTIVE">Inactive</option>
                                  <option value="DISABLED">Disabled</option>
                                </select>

                                <button
                                  onClick={() => promptDelete(patient, "patient")}
                                  disabled={isDeleted}
                                  style={{
                                    padding: "10px 14px",
                                    background: isDeleted ? "#f1f5f9" : "linear-gradient(135deg, #fee2e2, #fecaca)",
                                    color: isDeleted ? "#94a3b8" : "#dc2626",
                                    border: `1.5px solid ${isDeleted ? "#cbd5e1" : "#fca5a5"}`,
                                    borderRadius: "10px",
                                    cursor: isDeleted ? "not-allowed" : "pointer",
                                    opacity: isDeleted ? 0.6 : 1,
                                    fontWeight: 600,
                                    fontSize: "13px",
                                  }}
                                >
                                  {isDeleted ? <CheckCircle size={16} /> : <Trash2 size={16} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {!searchTerm && totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, padding: "24px", background: "#f9fafb", borderTop: "1px solid #e2e8f0" }}>
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ padding: "12px 18px", background: page === 0 ? "#f1f5f9" : MAIN_BLUE, color: page === 0 ? "#94a3b8" : "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: page === 0 ? "not-allowed" : "pointer" }}>
                      <ChevronLeft size={18} /> Previous
                    </button>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>Page {page + 1} of {totalPages}</span>
                    <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} style={{ padding: "12px 18px", background: page === totalPages - 1 ? "#f1f5f9" : MAIN_BLUE, color: page === totalPages - 1 ? "#94a3b8" : "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: page === totalPages - 1 ? "not-allowed" : "pointer" }}>
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* ==================== GUEST USERS TABLE ==================== */
          <>
            {loadingGuests ? (
              <div style={{ padding: "80px 20px", textAlign: "center" }}>
                <Loader2 size={48} style={{ color: MAIN_BLUE, animation: "spin 1.5s linear infinite" }} />
                <p style={{ color: "#64748b", fontSize: "16px" }}>Loading guest users...</p>
              </div>
            ) : error ? (
              <div style={{ padding: "80px 20px", textAlign: "center", color: "#ef4444" }}>
                <AlertCircle size={52} style={{ marginBottom: 16 }} />
                <p style={{ fontSize: "16px", fontWeight: 600 }}>{error}</p>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div style={{ padding: "80px 20px", textAlign: "center", color: "#94a3b8" }}>
                <UserX size={52} style={{ marginBottom: "16px", opacity: 0.5 }} />
                <p style={{ fontSize: "18px", fontWeight: 600 }}>No guest users found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ minWidth: "1000px", width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "18px 24px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "14px" }}>PATIENT</th>
                      <th style={{ padding: "18px 24px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "14px" }}>CONTACT</th>
                      <th style={{ padding: "18px 24px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "14px" }}>NIC</th>
                      <th style={{ padding: "18px 24px", textAlign: "left", color: "#475569", fontWeight: 700, fontSize: "14px" }}>STATUS</th>
                      <th style={{ padding: "18px 24px", textAlign: "center", color: "#475569", fontWeight: 700, fontSize: "14px" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map((guest, idx) => {
                      const isDeleted = (guest.status || "").toUpperCase() === "DELETED";
                      return (
                        <tr
                          key={guest.id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                          }}
                        >
                          <td style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                              <div style={{ width: "50px", height: "50px", backgroundColor: MAIN_BLUE, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "18px" }}>
                                {(guest.patientName || "G")[0].toUpperCase()}
                              </div>
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>{guest.patientName || "Unknown Guest"}</div>
                            </div>
                          </td>
                          <td style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 6 }}>
                              <Mail size={16} color={MAIN_BLUE} /> {guest.email || "—"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Phone size={16} color="#10b981" /> {guest.phoneNumber || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "20px 24px" }}>{guest.nic || "—"}</td>
                          <td style={{ padding: "20px 24px" }}>{getStatusBadge(guest.status || "GUEST")}</td>
                          <td style={{ padding: "20px 24px", textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                              <button
                                onClick={() => {
                                  setGuestBookingsPage(0);
                                  setActiveGuestBookingFilter("CONFIRMED");
                                  setSelectedGuestNic(guest.nic || "");
                                  setSelectedGuestName(guest.patientName || "Guest");
                                  setShowGuestBookingsModal(true);
                                }}
                                disabled={!guest.nic}
                                style={{
                                  padding: "10px 14px",
                                  background: !guest.nic ? "#f1f5f9" : "linear-gradient(135deg, #3a73ed, #2141b6)",
                                  color: !guest.nic ? "#94a3b8" : "white",
                                  border: "none",
                                  borderRadius: "10px",
                                  cursor: !guest.nic ? "not-allowed" : "pointer",
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  opacity: !guest.nic ? 0.6 : 1,
                                }}
                              >
                                <BookOpen size={16} /> View Bookings
                              </button>

                              <button
                                onClick={() => promptDelete(guest, "guest")}
                                disabled={isDeleted}
                                style={{
                                  padding: "10px 14px",
                                  background: isDeleted ? "#f1f5f9" : "linear-gradient(135deg, #fee2e2, #fecaca)",
                                  color: isDeleted ? "#94a3b8" : "#dc2626",
                                  border: `1.5px solid ${isDeleted ? "#cbd5e1" : "#fca5a5"}`,
                                  borderRadius: "10px",
                                  cursor: isDeleted ? "not-allowed" : "pointer",
                                  opacity: isDeleted ? 0.6 : 1,
                                  fontWeight: 600,
                                  fontSize: "13px",
                                }}
                              >
                                {isDeleted ? <CheckCircle size={16} /> : <Trash2 size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper Components
function DetailItem({ icon, label, value, fullWidth = false }: { icon: React.ReactNode; label: string; value?: string | null; fullWidth?: boolean }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, fontWeight: 600, color: "#334155" }}>
        {icon}
        {label}:
      </div>
      <div style={{ color: "#475569", lineHeight: 1.5 }}>{value || "—"}</div>
    </div>
  );
}

function ImageCard({ label, url }: { label: string; url?: string }) {
  if (!url) return null;
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "10px 14px", background: "#f8fafc", fontSize: "14px", fontWeight: 600, color: "#475569" }}>
        {label}
      </div>
      <div style={{ height: 180, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={url}
          alt={label}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            e.currentTarget.parentElement!.innerHTML = '<div style="color:#94a3b8;font-size:14px;">Image unavailable</div>';
          }}
        />
      </div>
    </div>
  );
}