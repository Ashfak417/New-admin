"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Building2,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  X,
  Users,
  Calendar,
  BookOpen,
  Loader2,
  Eye,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

const MAIN_BLUE = "#325E8F";
const SECONDARY_BLUE = "#1e3a5f";

type HospitalData = {
  id: number;
  name: string | null;
  address?: string | null;
  contactNo?: string | null;
  contactNo2?: string | null;
  hotline?: string | null;
  email: string | null;
  hospitalRegistrationNumber?: string | null;
  brNumber?: string | null;
  brPhotoUrl?: string | null;
  profileImageUrl?: string | null;
  resignation?: string | null;
  registrarNic?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

type DoctorData = {
  id?: number;
  name?: string;
  email?: string;
  doctorName?: string;
};

type ScheduleItem = {
  id: number;
  doctorName?: string;
  centerId?: number;
  centerType?: string;
  scheduleDate?: string;
  startTime?: string;
  endTime?: string;
  maxPatients?: number;
  currentPatientCount?: number;
  consultationFee?: number;
  active?: boolean;
};

type BookingItem = {
  id: number;
  bookingReference?: string;
  queueNumber?: number;
  patientName?: string;
  status?: string;
  scheduleId?: number;
  scheduleDate?: string;
};

export default function HospitalsClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Doctors modal
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [selectedHospitalForDoctors, setSelectedHospitalForDoctors] = useState<HospitalData | null>(null);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  // Schedule & Bookings modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedHospitalForSchedule, setSelectedHospitalForSchedule] = useState<HospitalData | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // Viewing bookings for one specific schedule
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [bookingsForSchedule, setBookingsForSchedule] = useState<BookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Updated: Only these four statuses
  const [activeBookingFilter, setActiveBookingFilter] = useState<"CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED">("CONFIRMED");

  // Hospital Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedHospitalForProfile, setSelectedHospitalForProfile] = useState<HospitalData | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalHospitals, setTotalHospitals] = useState(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const fetchHospitals = useCallback(async (isRefresh = false) => {
    const token = getAuthToken();
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/hospitals/internal/all?page=${page}&size=${size}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(`Failed: ${res.status}`);
      }

      const data = await res.json();
      let list: HospitalData[] = data.content || data.data || data.hospitals || data || [];

      list = list.map((h: any) => ({
        id: h.id,
        name: h.name ?? "Unnamed Hospital",
        email: h.email ?? "No email provided",
        address: h.address,
        contactNo: h.contactNo,
        contactNo2: h.contactNo2,
        hotline: h.hotline,
        hospitalRegistrationNumber: h.hospitalRegistrationNumber,
        brNumber: h.brNumber,
        brPhotoUrl: h.brPhotoUrl,
        profileImageUrl: h.profileImageUrl || h.profileUrl || h.logoUrl || "",
        resignation: h.resignation,
        registrarNic: h.registrarNic,
        latitude: h.latitude,
        longitude: h.longitude,
      }));

      setHospitals(list);
      setTotalPages(data.totalPages || 1);
      setTotalHospitals(data.totalElements || list.length);
    } catch (err: any) {
      setError(err.message || "Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleRefresh = () => fetchHospitals(true);

  const fetchDoctors = async (hospital: HospitalData) => {
    const token = getAuthToken();
    if (!token) return;

    setSelectedHospitalForDoctors(hospital);
    setShowDoctorsModal(true);
    setDoctorsLoading(true);
    setDoctorError(null);
    setDoctors([]);

    try {
      const res = await fetch(`${API_BASE}/hospitals/doctors/for-guest/${hospital.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to load doctors");

      const data = await res.json();
      const list = data?.content || data?.data || data || [];

      if (!list || list.length === 0) {
        setDoctorError("Not Assigned");
      } else {
        setDoctors(list);
      }
    } catch {
      setDoctorError("Not Assigned");
    } finally {
      setDoctorsLoading(false);
    }
  };

  const fetchSchedule = async (hospitalId: number) => {
    const token = getAuthToken();
    if (!token) return;

    setSchedulesLoading(true);
    setSchedulesError(null);
    setSchedules([]);
    setSelectedScheduleId(null);
    setBookingsForSchedule([]);

    try {
      const res = await fetch(`${API_BASE}/schedules/doctor/${hospitalId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to load schedule");

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.content || data.data || []);

      if (list.length === 0) {
        setSchedulesError("No schedule available");
      } else {
        setSchedules(list);
      }
    } catch (err: any) {
      setSchedulesError(err.message || "Failed to load schedule");
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchBookingsForSchedule = async (scheduleId: number) => {
    const token = getAuthToken();
    if (!token) return;

    setBookingsLoading(true);
    setBookingsError(null);
    setBookingsForSchedule([]);

    try {
      const res = await fetch(`${API_BASE}/bookings/schedule/${scheduleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to load bookings");

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.content || data.data || []);

      setBookingsForSchedule(list);
    } catch (err: any) {
      setBookingsError(err.message || "Failed to load bookings");
    } finally {
      setBookingsLoading(false);
    }
  };

  const getFilteredBookings = () => {
    return bookingsForSchedule.filter((b) => {
      const status = (b.status || "").trim().toUpperCase();
      switch (activeBookingFilter) {
        case "CONFIRMED":
          return status === "CONFIRMED" || status.includes("CONFIRM");
        case "CANCELLED":
          return status === "CANCELLED" || status.includes("CANCEL");
        case "COMPLETED":
          return status === "COMPLETED";
        case "REJECTED":
          return status === "REJECTED" || status.includes("REJECT");
        default:
          return false;
      }
    });
  };

  const filteredHospitals = hospitals.filter((h) => {
    const term = searchTerm.toLowerCase();
    return (
      (h.name || "").toLowerCase().includes(term) ||
      (h.address || "").toLowerCase().includes(term) ||
      (h.email || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px 20px", color: "#64748b" }}>
        <RefreshCw size={64} style={{ animation: "spin 1.5s linear infinite", marginBottom: "24px" }} />
        <p style={{ fontSize: "20px", fontWeight: "600" }}>Loading Hospital Network...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Error Toast */}
      {error && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            background: "#ef4444",
            color: "white",
            padding: "16px 24px",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontWeight: 600,
          }}
        >
          <AlertCircle size={22} />
          {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "white" }}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginBottom: "32px" }}>
        <Link
          href="/admin/dashboard"
          style={{
            color: MAIN_BLUE,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            fontSize: "17px",
            transition: "color 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = SECONDARY_BLUE)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MAIN_BLUE)}
        >
          <ChevronLeft size={24} />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div
        style={{
          marginBottom: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: `linear-gradient(135deg, ${MAIN_BLUE}, ${SECONDARY_BLUE})`,
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 25px rgba(50,94,143,0.3)",
            }}
          >
            <Building2 size={36} color="white" />
          </div>
          <div>
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "800",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Hospital Network
            </h1>
            <p style={{ margin: "6px 0 0 0", fontSize: "17px" }}>
              Discover trusted hospitals •{" "}
              <span style={{ color: MAIN_BLUE, fontWeight: "700" }}>{totalHospitals}</span> total
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: "14px 28px",
            background: MAIN_BLUE,
            color: "white",
            border: "none",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "16px",
            boxShadow: "0 8px 25px rgba(50,94,143,0.3)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          {loading ? <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={20} />}
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "40px", maxWidth: "700px" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={22}
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "18px 20px 18px 60px",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              fontSize: "17px",
              backgroundColor: "white",
              outline: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = MAIN_BLUE;
              e.target.style.boxShadow = `0 0 0 4px ${MAIN_BLUE}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)";
            }}
          />
        </div>
      </div>

      {/* Hospitals Grid */}
      {filteredHospitals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "120px 20px", color: "#94a3b8" }}>
          <Building2 size={80} style={{ opacity: 0.25, marginBottom: "24px" }} />
          <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", marginBottom: "16px" }}>
            No Hospitals Found
          </h3>
          <p style={{ fontSize: "18px", maxWidth: "500px", margin: "0 auto 32px" }}>
            {searchTerm
              ? `No results for "${searchTerm}". Try different keywords.`
              : "There are currently no hospitals registered in the system."}
          </p>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                padding: "14px 32px",
                background: MAIN_BLUE,
                color: "white",
                border: "none",
                borderRadius: "16px",
                fontWeight: "700",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "32px" }}>
          {filteredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              style={{
                background: "white",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 12px 40px rgba(173, 206, 255, 0.08)",
                border: "1px solid #f1f5f9",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedHospitalForProfile(hospital);
                setShowProfileModal(true);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-12px)";
                e.currentTarget.style.boxShadow = "0 30px 60px rgba(50,94,143,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)";
              }}
            >
              <div style={{ height: "8px", background: `linear-gradient(90deg, ${MAIN_BLUE}, ${SECONDARY_BLUE})` }} />

              <div style={{ padding: "32px" }}>
                {/* Hospital Header with Profile Image */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  {hospital.profileImageUrl || hospital.brPhotoUrl ? (
                    <div
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "12px",
                        background: `url(${hospital.profileImageUrl || hospital.brPhotoUrl}) center/cover`,
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
                        background: `linear-gradient(135deg, ${MAIN_BLUE}, ${SECONDARY_BLUE})`,
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
                      {hospital.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}

                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: "800",
                      margin: 0,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hospital.name || "Unnamed Hospital"}
                  </h3>
                </div>

                <div style={{ display: "grid", gap: "16px", color: "#475569", fontSize: "16px" }}>
                  {hospital.address && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <MapPin size={22} style={{ color: MAIN_BLUE, marginTop: "4px" }} />
                      <span>{hospital.address}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Mail size={22} style={{ color: MAIN_BLUE }} />
                    <span>{hospital.email}</span>
                  </div>

                  {hospital.contactNo && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Phone size={22} style={{ color: MAIN_BLUE }} />
                      <span className="font-medium">{hospital.contactNo}</span>
                    </div>
                  )}

                  {hospital.hotline && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#dc2626", fontWeight: "700" }}>
                      <AlertCircle size={22} />
                      <span>Hotline: {hospital.hotline}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchDoctors(hospital);
                    }}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: MAIN_BLUE,
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      minWidth: "140px",
                    }}
                  >
                    <Users size={18} />
                    View Doctors
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHospitalForSchedule(hospital);
                      setShowScheduleModal(true);
                      setSelectedScheduleId(null);
                      setBookingsForSchedule([]);
                      fetchSchedule(hospital.id);
                    }}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: SECONDARY_BLUE,
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      minWidth: "140px",
                    }}
                  >
                    <Calendar size={18} />
                    View Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hospital Profile Modal */}
      {showProfileModal && selectedHospitalForProfile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => {
            setShowProfileModal(false);
            setSelectedHospitalForProfile(null);
          }}
        >
          <div
            style={{
              width: "480px",
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "0 20px 60px rgba(37, 64, 124, 0.8)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "24px", fontWeight: 800, color: MAIN_BLUE }}>
                {selectedHospitalForProfile.name || "Hospital Profile"}
              </h3>
              <X
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedHospitalForProfile(null);
                }}
              />
            </div>

            <div style={{ display: "grid", gap: "20px", color: "#475569", fontSize: "15px" }}>
              {selectedHospitalForProfile.address && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <MapPin size={22} style={{ color: MAIN_BLUE }} />
                  <div>
                    <strong>Address:</strong>
                    <p style={{ marginTop: "4px" }}>{selectedHospitalForProfile.address}</p>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Mail size={22} style={{ color: MAIN_BLUE }} />
                <div>
                  <strong>Email:</strong> {selectedHospitalForProfile.email}
                </div>
              </div>

              {selectedHospitalForProfile.contactNo && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Phone size={22} style={{ color: MAIN_BLUE }} />
                  <div>
                    <strong>Contact:</strong> {selectedHospitalForProfile.contactNo}
                  </div>
                </div>
              )}

              {selectedHospitalForProfile.contactNo2 && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Phone size={22} style={{ color: MAIN_BLUE }} />
                  <div>
                    <strong>Secondary Contact:</strong> {selectedHospitalForProfile.contactNo2}
                  </div>
                </div>
              )}

              {selectedHospitalForProfile.hotline && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#dc2626" }}>
                  <AlertCircle size={22} />
                  <div>
                    <strong>Hotline:</strong> {selectedHospitalForProfile.hotline}
                  </div>
                </div>
              )}

              {selectedHospitalForProfile.hospitalRegistrationNumber && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Building2 size={22} style={{ color: MAIN_BLUE }} />
                  <div>
                    <strong>Registration No:</strong> {selectedHospitalForProfile.hospitalRegistrationNumber}
                  </div>
                </div>
              )}

              {selectedHospitalForProfile.brNumber && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Building2 size={22} style={{ color: MAIN_BLUE }} />
                  <div>
                    <strong>Business Reg No:</strong> {selectedHospitalForProfile.brNumber}
                  </div>
                </div>
              )}

              {selectedHospitalForProfile.resignation && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Building2 size={22} style={{ color: MAIN_BLUE }} />
                  <div>
                    <strong>Type:</strong> {selectedHospitalForProfile.resignation}
                  </div>
                </div>
              )}

              {selectedHospitalForProfile.registrarNic && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Building2 size={22} style={{ color: MAIN_BLUE }} />
                  <div>
                    <strong>Registrar NIC:</strong> {selectedHospitalForProfile.registrarNic}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "32px", textAlign: "right" }}>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedHospitalForProfile(null);
                }}
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

      {/* Doctors Modal */}
      {showDoctorsModal && selectedHospitalForDoctors && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => {
            setShowDoctorsModal(false);
            setSelectedHospitalForDoctors(null);
          }}
        >
          <div
            style={{
              width: "420px",
              background: "white",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(37, 64, 124, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: 800 }}>
                Doctors at {selectedHospitalForDoctors.name}
              </h3>
              <X
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setShowDoctorsModal(false);
                  setSelectedHospitalForDoctors(null);
                }}
              />
            </div>

            {doctorsLoading && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Loader2 size={28} className="animate-spin text-[#325E8F] mx-auto" />
                <p style={{ marginTop: "12px" }}>Loading doctors...</p>
              </div>
            )}

            {doctorError && (
              <p style={{ color: "#dc2626", fontWeight: 700, textAlign: "center" }}>{doctorError}</p>
            )}

            {!doctorsLoading && !doctorError && doctors.length === 0 && (
              <p style={{ color: "#dc2626", fontWeight: 700, textAlign: "center" }}>Not Assigned</p>
            )}

            {!doctorsLoading &&
              !doctorError &&
              doctors.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: "12px 0",
                    borderTop: "1px solid #e0e7ff",
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  <p style={{ fontWeight: 700, color: "#1e293b" }}>
                    {doc.doctorName || doc.name || "Unnamed Doctor"}
                  </p>
                  {doc.email && <p style={{ color: "#475569" }}>{doc.email}</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Schedule & Bookings Modal */}
      {showScheduleModal && selectedHospitalForSchedule && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => {
            setShowScheduleModal(false);
            setSelectedHospitalForSchedule(null);
            setSelectedScheduleId(null);
            setBookingsForSchedule([]);
          }}
        >
          <div
            style={{
              width: "620px",
              background: "white",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(37, 64, 124, 0.8)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: 800 }}>
                {selectedScheduleId ? "Bookings for Schedule" : "Schedule"} - {selectedHospitalForSchedule.name}
              </h3>
              <X
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedHospitalForSchedule(null);
                  setSelectedScheduleId(null);
                  setBookingsForSchedule([]);
                }}
              />
            </div>

            {selectedScheduleId ? (
              // Viewing bookings for one schedule with updated filters
              <>
                {/* Status Filter Buttons - Removed PENDING */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setActiveBookingFilter("CONFIRMED")}
                    style={{
                      padding: "10px 20px",
                      background: activeBookingFilter === "CONFIRMED" ? "#16a34a" : "#e5e7eb",
                      color: activeBookingFilter === "CONFIRMED" ? "white" : "#475569",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      minWidth: "120px",
                    }}
                  >
                    CONFIRMED
                  </button>
                  <button
                    onClick={() => setActiveBookingFilter("CANCELLED")}
                    style={{
                      padding: "10px 20px",
                      background: activeBookingFilter === "CANCELLED" ? "#ef4444" : "#e5e7eb",
                      color: activeBookingFilter === "CANCELLED" ? "white" : "#475569",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      minWidth: "120px",
                    }}
                  >
                    CANCELLED
                  </button>
                  <button
                    onClick={() => setActiveBookingFilter("COMPLETED")}
                    style={{
                      padding: "10px 20px",
                      background: activeBookingFilter === "COMPLETED" ? "#3b82f6" : "#e5e7eb",
                      color: activeBookingFilter === "COMPLETED" ? "white" : "#475569",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      minWidth: "120px",
                    }}
                  >
                    COMPLETED
                  </button>
                  <button
                    onClick={() => setActiveBookingFilter("REJECTED")}
                    style={{
                      padding: "10px 20px",
                      background: activeBookingFilter === "REJECTED" ? "#991b1b" : "#e5e7eb",
                      color: activeBookingFilter === "REJECTED" ? "white" : "#475569",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      minWidth: "120px",
                    }}
                  >
                    REJECTED
                  </button>
                </div>

                {bookingsLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Loader2 size={32} className="animate-spin mx-auto mb-4 text-[#325E8F]" />
                    <p>Loading bookings...</p>
                  </div>
                ) : bookingsError ? (
                  <p style={{ color: "#dc2626", fontWeight: 700, textAlign: "center" }}>
                    {bookingsError}
                  </p>
                ) : getFilteredBookings().length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                    <BookOpen size={48} style={{ opacity: 0.4, marginBottom: "16px" }} />
                    <p style={{ fontSize: "18px", marginTop: "12px" }}>
                      No {activeBookingFilter.toLowerCase()} bookings found for this schedule.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "16px", marginBottom: "28px" }}>
                    {getFilteredBookings().map((booking, index) => (
                      <div
                        key={booking.id || index}
                        style={{
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          background:
                            (booking.status || "").toUpperCase() === "CONFIRMED" ? "#f0fdf4" :
                            (booking.status || "").toUpperCase() === "CANCELLED" ? "#fee2e2" :
                            (booking.status || "").toUpperCase() === "COMPLETED" ? "#eff6ff" :
                            (booking.status || "").toUpperCase() === "REJECTED" ? "#fef2f2" :
                            "#f8fafc",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                          {booking.patientName || "Patient"}
                        </div>
                        <div style={{ color: "#475569", fontSize: "14px", lineHeight: "1.5" }}>
                          <p><strong>Booking Ref:</strong> {booking.bookingReference || "—"}</p>
                          <p><strong>Queue No:</strong> {booking.queueNumber ?? "—"}</p>
                          <p><strong>Status:</strong> {booking.status || "—"}</p>
                          <p><strong>Date:</strong> {booking.scheduleDate || "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedScheduleId(null)}
                    style={{
                      padding: "12px 24px",
                      background: "#64748b",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      marginRight: "12px",
                    }}
                  >
                    Back to Schedule
                  </button>

                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedHospitalForSchedule(null);
                    }}
                    style={{
                      padding: "12px 24px",
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
              </>
            ) : (
              // Show list of schedules with "View Bookings" button per item
              <>
                {schedulesLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Loader2 size={32} className="animate-spin mx-auto mb-4 text-[#325E8F]" />
                    <p>Loading schedule...</p>
                  </div>
                ) : schedulesError ? (
                  <p style={{ color: "#dc2626", fontWeight: 700, textAlign: "center" }}>
                    {schedulesError}
                  </p>
                ) : schedules.length === 0 ? (
                  <p style={{ color: "#64748b", textAlign: "center", fontStyle: "italic" }}>
                    No schedule available for this hospital.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: "16px", marginBottom: "28px" }}>
                    {schedules.map((item, index) => (
                      <div
                        key={item.id || index}
                        style={{
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          background: "#f8fafc",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                            {item.doctorName || "Doctor"}
                          </div>
                          <div style={{ color: "#475569", fontSize: "14px" }}>
                            <p><strong>Date:</strong> {item.scheduleDate || "—"}</p>
                            <p><strong>Time:</strong> {item.startTime || "—"} – {item.endTime || "—"}</p>
                            <p><strong>Max Patients:</strong> {item.maxPatients ?? "—"}</p>
                            <p><strong>Current:</strong> {item.currentPatientCount ?? "—"}</p>
                            <p><strong>Fee:</strong> {item.consultationFee ?? "—"}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedScheduleId(item.id);
                            setActiveBookingFilter("CONFIRMED"); // reset to CONFIRMED when opening
                            fetchBookingsForSchedule(item.id);
                          }}
                          style={{
                            padding: "10px 18px",
                            background: MAIN_BLUE,
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            fontWeight: "700",
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Eye size={16} />
                          View Bookings
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedHospitalForSchedule(null);
                    }}
                    style={{
                      padding: "12px 24px",
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            marginTop: "48px",
            padding: "20px",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: "14px 20px",
              background: page === 0 ? "#e2e8f0" : MAIN_BLUE,
              color: page === 0 ? "#64748b" : "white",
              border: "none",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "700",
              cursor: page === 0 ? "not-allowed" : "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => page !== 0 && (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <ChevronLeft size={22} />
            Previous
          </button>

          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#1e293b",
              padding: "14px 24px",
              background: "#e0e7ff",
              borderRadius: "14px",
            }}
          >
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{
              padding: "14px 20px",
              background: page === totalPages - 1 ? "#e2e8f0" : MAIN_BLUE,
              color: page === totalPages - 1 ? "#64748b" : "white",
              border: "none",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "700",
              cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => page !== totalPages - 1 && (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Next
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
}