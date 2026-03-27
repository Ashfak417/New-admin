"use client";
import Link from "next/link";
import {
  ChevronLeft,
  X,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  Users,
  Building2,
  Pill,
  Eye,
  Loader2,
  BookOpen,
  AlertCircle,
  Calendar,
  Search,
  Stethoscope,
  Phone,
  Mail,
  Star,
  User,
  IdCard,
  Home,
} 
from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAuthToken, getAuthRole } from "@/lib/auth";

interface BasicDoctor {
  id?: number;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  specializations?: any;
  hospitalName?: string;
  nic?: string;
  address?: string;
  medicalLicenseNumber?: string;
  averageRating?: number;
  totalReviews?: number;
  profileFirebaseUrl?: string;
  [key: string]: unknown;
}

interface Doctor {
  id: number;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  specializations: any;
  hospitalName?: string;
  nic?: string;
  address?: string;
  medicalLicenseNumber?: string;
  averageRating?: number;
  totalReviews?: number;
  profileFirebaseUrl?: string;
  assignedHospitals?: Array<Record<string, unknown>>;
  isActive?: boolean;
}

interface Specialization {
  id: number;
  specializations: string;
  description?: string | null;
  local?: boolean;
}

interface Dispensary {
  id: number;
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  licenseNumber?: string;
  ownerName?: string;
  isActive: boolean;
  registrationDate?: string;
  latitude?: number;
  longitude?: number;
  profileUrl?: string;
  status?: string;
}

interface StaffMember {
  staffName: string;
  phoneNumber: string;
  nic: string;
}

interface PageData {
  content: BasicDoctor[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface BookingItem {
  id: number;
  bookingReference?: string;
  queueNumber?: number;
  patientName?: string;
  status?: string;
  scheduleId?: number;
  scheduleDate?: string;
}

interface ScheduleItem {
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
  [key: string]: any;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showSpecializations, setShowSpecializations] = useState(false);
  const [specLoading, setSpecLoading] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Specialization | null>(null);
  const [newSpecName, setNewSpecName] = useState("");
  const [newSpecDesc, setNewSpecDesc] = useState("");

  const [showHospitalsModal, setShowHospitalsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [assignedHospitals, setAssignedHospitals] = useState<any[]>([]);
  const [hospitalLoading, setHospitalLoading] = useState(false);

  const [showDispensariesModal, setShowDispensariesModal] = useState(false);
  const [assignedDispensaries, setAssignedDispensaries] = useState<Dispensary[]>([]);
  const [dispensaryLoading, setDispensaryLoading] = useState(false);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [showDoctorBookingsModal, setShowDoctorBookingsModal] = useState(false);
  const [selectedDoctorForBookings, setSelectedDoctorForBookings] = useState<Doctor | null>(null);
  const [hospitalBookings, setHospitalBookings] = useState<BookingItem[]>([]);
  const [dispensaryBookings, setDispensaryBookings] = useState<BookingItem[]>([]);
  const [hospitalBookingsLoading, setHospitalBookingsLoading] = useState(false);
  const [dispensaryBookingsLoading, setDispensaryBookingsLoading] = useState(false);
  const [hospitalBookingsError, setHospitalBookingsError] = useState<string | null>(null);
  const [dispensaryBookingsError, setDispensaryBookingsError] = useState<string | null>(null);
  const [hospitalCenterTypeFilter, setHospitalCenterTypeFilter] = useState<"HOSPITAL" | "DISPENSARY" | "OPD" | "ALL">("ALL");
  const [dispensaryCenterTypeFilter, setDispensaryCenterTypeFilter] = useState<"HOSPITAL" | "DISPENSARY" | "OPD" | "ALL">("ALL");
  const [activeBookingsTab, setActiveBookingsTab] = useState<"hospital" | "dispensary">("hospital");
  const [activeBookingFilter, setActiveBookingFilter] = useState<"CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED">("CONFIRMED");

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDoctorForSchedule, setSelectedDoctorForSchedule] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  const [activeScheduleTab, setActiveScheduleTab] = useState<"hospital" | "dispensary">("hospital");
  const [hospitalPage, setHospitalPage] = useState(0);
  const [dispensaryPage, setDispensaryPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 10;

  const [showScheduleBookingsModal, setShowScheduleBookingsModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleBookings, setScheduleBookings] = useState<BookingItem[]>([]);
  const [scheduleBookingsLoading, setScheduleBookingsLoading] = useState(false);
  const [scheduleBookingsError, setScheduleBookingsError] = useState<string | null>(null);
  const [scheduleBookingFilter, setScheduleBookingFilter] = useState<"CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED">("CONFIRMED");

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [currentRole, setCurrentRole] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(false);
  const [disablingId, setDisablingId] = useState<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };
  
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
    setAuthLoading(false);
  }, []);

  const enrichDoctorsWithProfiles = useCallback(
    async (basicDoctors: BasicDoctor[]) => {
      return basicDoctors.map((doc) => {
        let specs = doc.specializations;
        if (!specs) {
          specs = [];
        } else if (typeof specs === "string" && specs.trim()) {
          specs = specs;
        } else if (Array.isArray(specs)) {
          specs = specs;
        }

        return {
          id: doc.id || 0,
          fullName: doc.fullName || "Unnamed Doctor",
          email: doc.email || "",
          phoneNumber: doc.phoneNumber || "No phone",
          specializations: specs,
          hospitalName: doc.hospitalName || "",
          nic: doc.nic || "No NIC",
          address: doc.address || "No address",
          medicalLicenseNumber: doc.medicalLicenseNumber || "N/A",
          averageRating: doc.averageRating || 0,
          totalReviews: doc.totalReviews || 0,
          profileFirebaseUrl: doc.profileFirebaseUrl || "",
        } as Doctor;
      });
    },
    []
  );

  const fetchAssignedHospitals = async (doctor: Doctor) => {
    const token = getAuthToken();
    if (!token) return;
    setSelectedDoctor(doctor);
    setShowHospitalsModal(true);
    setHospitalLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/hospitals/doctors/by-doctor/${doctor.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      if (!res.ok) {
        showToast("error", "Failed to load assigned hospitals");
        setAssignedHospitals([]);
        return;
      }
      const response = await res.json();
      setAssignedHospitals(response?.data || response || []);
    } catch (err) {
      console.error("Hospital fetch error:", err);
      setAssignedHospitals([]);
      showToast("error", "Failed to load assigned hospitals");
    } finally {
      setHospitalLoading(false);
    }
  };

  const fetchDoctorDispensaries = async (doctor: Doctor) => {
    const token = getAuthToken();
    if (!token) return;
    setSelectedDoctor(doctor);
    setShowDispensariesModal(true);
    setDispensaryLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/doctors/dispensaries/by-doctor?doctorId=${doctor.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      if (!res.ok) {
        showToast("error", "Failed to load dispensaries");
        setAssignedDispensaries([]);
        return;
      }
      const response = await res.json();
      const dispensaryArray = response?.data || [];
      const mapped: Dispensary[] = dispensaryArray.map((item: any) => ({
        id: item.id || null,
        name: item.dispensaryName || "Unnamed Dispensary",
        address: item.address || "Not provided",
        phoneNumber: item.phoneNumber || item.contactNumber || "Not provided",
        email: item.email || "Not provided",
        licenseNumber: item.registerNumber || "Not provided",
        ownerName: item.doctorName || "Not provided",
        isActive: item.status === "ACTIVE",
        registrationDate: item.createdAt || item.registeredDate || "",
        latitude: item.latitude,
        longitude: item.longitude,
        profileUrl: item.profileUrl,
        status: item.status || "UNKNOWN",
      }));
      setAssignedDispensaries(mapped);
    } catch (err) {
      console.error("Dispensaries fetch error:", err);
      setAssignedDispensaries([]);
      showToast("error", "Failed to load dispensaries");
    } finally {
      setDispensaryLoading(false);
    }
  };

  const fetchDoctorStaff = async (doctor: Doctor) => {
    const token = getAuthToken();
    if (!token) return;
    setSelectedDoctor(doctor);
    setShowStaffModal(true);
    setStaffLoading(true);
    setStaffError(null);
    setAssignedStaff([]);
    try {
      const res = await fetch(
        `${API_BASE}/doctors/internal/profile/login-staff/by-doctor-id/${doctor.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      if (!res.ok) {
        throw new Error("Failed to load staff");
      }
      const response = await res.json();
      const staffList = response?.data || response?.content || response || [];
      setAssignedStaff(staffList);
    } catch (err: any) {
      console.error("Staff fetch error:", err);
      setStaffError(err.message || "Failed to load staff");
      setAssignedStaff([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchHospitalBookings = async (doctorId: number) => {
    const token = getAuthToken();
    if (!token) return;
    setHospitalBookingsLoading(true);
    setHospitalBookingsError(null);
    try {
      const url = `${API_BASE}/bookings/by-doctor/${doctorId}?type=hospital&centerType=${hospitalCenterTypeFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setHospitalBookings(data?.content || data?.data || data || []);
    } catch (err: any) {
      setHospitalBookingsError(err.message || "Failed to load hospital bookings");
    } finally {
      setHospitalBookingsLoading(false);
    }
  };

  const fetchDispensaryBookings = async (doctorId: number) => {
    const token = getAuthToken();
    if (!token) return;
    setDispensaryBookingsLoading(true);
    setDispensaryBookingsError(null);
    try {
      const res = await fetch(`${API_BASE}/bookings/by-doctor/${doctorId}?type=dispensary`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDispensaryBookings(data?.content || data?.data || data || []);
    } catch (err: any) {
      setDispensaryBookingsError(err.message || "Failed to load dispensary bookings");
    } finally {
      setDispensaryBookingsLoading(false);
    }
  };

  const fetchDoctorSchedules = async (doctorId: number) => {
    const token = getAuthToken();
    if (!token) return;
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      const res = await fetch(`${API_BASE}/schedules/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.content || data.data || data || [];
      setSchedules(list);
    } catch (err: any) {
      setSchedulesError(err.message || "Failed to load schedules");
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchScheduleBookings = async (scheduleId: number) => {
    const token = getAuthToken();
    if (!token) return;
    setScheduleBookingsLoading(true);
    setScheduleBookingsError(null);
    try {
      const res = await fetch(`${API_BASE}/bookings/schedule/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.content || data.data || data || [];
      setScheduleBookings(list);
    } catch (err: any) {
      setScheduleBookingsError(err.message || "Failed to load schedule bookings");
      setScheduleBookings([]);
    } finally {
      setScheduleBookingsLoading(false);
    }
  };

  const openScheduleModal = (doctor: Doctor) => {
    setSelectedDoctorForSchedule(doctor);
    setShowScheduleModal(true);
    setSchedulesError(null);
    setSchedules([]);
    setHospitalPage(0);
    setDispensaryPage(0);
    setActiveScheduleTab("hospital");
    fetchDoctorSchedules(doctor.id);
  };

  const openScheduleBookingsModal = (schedule: ScheduleItem) => {
    setSelectedSchedule(schedule);
    setShowScheduleBookingsModal(true);
    setScheduleBookingFilter("CONFIRMED");
    setScheduleBookingsError(null);
    setScheduleBookings([]);
    fetchScheduleBookings(schedule.id);
  };

  const openDoctorBookingsModal = (doctor: Doctor) => {
    setSelectedDoctorForBookings(doctor);
    setShowDoctorBookingsModal(true);
    setActiveBookingsTab("hospital");
    setActiveBookingFilter("CONFIRMED");
    fetchHospitalBookings(doctor.id);
    fetchDispensaryBookings(doctor.id);
  };

  const getFilteredBookings = (bookings: BookingItem[], filter: string = activeBookingFilter) => {
    return bookings.filter((booking) => {
      const status = (booking.status || "").toUpperCase().trim();
      switch (filter) {
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

  const fetchDoctors = useCallback(
    async (isRefresh = false) => {
      const token = getAuthToken();
      if (!token) return;
      try {
        if (!isRefresh) setLoading(true);
        else setRefreshing(true);
        const res = await fetch(`${API_BASE}/doctors/internal/all/doctors?page=${page}&size=${size}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });
        if (!res.ok) {
          showToast("error", "Failed to load doctors");
          return;
        }
        const response = await res.json();
        const pageData: PageData = response.data || response;
        const basicDoctors = pageData.content || [];
        const enrichedDoctors = await enrichDoctorsWithProfiles(basicDoctors);
        setDoctors(enrichedDoctors);
        setTotalPages(pageData.totalPages || 1);
        setTotalElements(pageData.totalElements || 0);
      } catch (err) {
        console.error("fetchDoctors error:", err);
        showToast("error", "Failed to load doctor data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, enrichDoctorsWithProfiles]
  );

  const fetchSpecializations = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setSpecLoading(true);
    try {
      const res = await fetch(`${API_BASE}/doctors/specializations/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!res.ok) {
        setSpecializations([]);
        return;
      }
      const response = await res.json();
      const rawList = response?.content || response?.data?.content || response || [];
      const normalized: Specialization[] = rawList.map((item: any, idx: number) => {
        let name = item?.name || item?.specializations || "Unnamed";
        const desc = item?.description || null;
        if (typeof name === "string") {
          name = name.replace(/[_\-]+/g, " ").toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase());
        }
        return {
          id: item?.id || idx + Date.now(),
          specializations: String(name),
          description: desc,
        } as Specialization;
      }).filter((s) => s.specializations.trim().length > 0);
      setSpecializations(normalized);
    } catch (err) {
      console.error("Failed to load specializations:", err);
      setSpecializations([]);
    } finally {
      setSpecLoading(false);
    }
  }, []);

  const createSpecialization = async () => {
    const token = getAuthToken();
    if (!token) {
      showToast("error", "Not authenticated");
      return;
    }
    if (!newSpecName.trim()) {
      showToast("error", "Name required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/doctors/specializations/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newSpecName.trim(),
          description: newSpecDesc.trim() || null,
        }),
      });
      if (!res.ok) {
        showToast("error", "Failed to add specialization");
        return;
      }
      setNewSpecName("");
      setNewSpecDesc("");
      showToast("success", "Specialization added!");
      await fetchSpecializations();
    } catch {
      showToast("error", "Failed to add specialization");
    }
  };

  const updateSpecialization = async () => {
    const token = getAuthToken();
    if (!token || !editingSpec) return;
    try {
      const res = await fetch(`${API_BASE}/doctors/specializations/${editingSpec.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingSpec.specializations.trim(),
          description: editingSpec.description?.trim() || null,
        }),
      });
      if (!res.ok) {
        showToast("error", "Update failed");
        return;
      }
      await fetchSpecializations();
      setEditingSpec(null);
      showToast("success", "Updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      showToast("error", "Update failed");
    }
  };

  const deleteSpecialization = async (id: number) => {
    const token = getAuthToken();
    if (!token) return;
    if (!confirm("Are you sure you want to delete this specialization?")) return;
    try {
      const res = await fetch(`${API_BASE}/doctors/specializations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        showToast("error", "Delete failed");
        return;
      }
      await fetchSpecializations();
      showToast("success", "Deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", "Delete failed");
    }
  };

  const toggleDoctorStatus = async (doctorId: number, isCurrentlyActive: boolean) => {
    const token = getAuthToken();
    if (!token) return;
    const action = isCurrentlyActive ? "disable" : "enable";
    if (!confirm(`Are you sure you want to ${action} this doctor?`)) return;
    setDisablingId(doctorId);
    try {
      const res = await fetch(`${API_BASE}/doctors/${doctorId}/${action}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        showToast("error", `Failed to ${action} doctor`);
        return;
      }
      setDoctors((prevDoctors) =>
        prevDoctors.map((doc) =>
          doc.id === doctorId ? { ...doc, isActive: !isCurrentlyActive } : doc
        )
      );
      showToast("success", `Doctor ${action}d successfully!`);
    } catch (err) {
      console.error(`Toggle ${action} error:`, err);
      showToast("error", `Failed to ${action} doctor`);
    } finally {
      setDisablingId(null);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    fetchDoctors(true);
  };

  const filteredDoctors = doctors.filter((doc) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const fullName = doc.fullName?.toLowerCase() || "";
    const email = doc.email?.toLowerCase() || "";
    const phone = doc.phoneNumber || "";
    const nic = doc.nic?.toLowerCase() || "";
    const license = doc.medicalLicenseNumber?.toLowerCase() || "";
    const specs = String(doc.specializations || "").toLowerCase();
    return (
      fullName.includes(term) ||
      email.includes(term) ||
      phone.includes(term) ||
      nic.includes(term) ||
      license.includes(term) ||
      specs.includes(term)
    );
  });

  useEffect(() => {
    if (!authLoading && currentRole) {
      fetchDoctors();
    }
  }, [currentRole, authLoading, page, fetchDoctors]);

  useEffect(() => {
    if (showSpecializations) fetchSpecializations();
  }, [showSpecializations, fetchSpecializations]);

  // Schedule modal helpers
  const hospitalSchedules = schedules.filter(
    (s) => (s.centerType || "").toUpperCase() === "HOSPITAL"
  );

  const dispensarySchedules = schedules.filter(
    (s) => (s.centerType || "").toUpperCase() === "DISPENSARY"
  );

  const currentSchedules =
    activeScheduleTab === "hospital" ? hospitalSchedules : dispensarySchedules;

  const currentPage = activeScheduleTab === "hospital" ? hospitalPage : dispensaryPage;

  const displayedSchedules = currentSchedules.slice(0, (currentPage + 1) * pageSize);

  const hasMore = currentSchedules.length > displayedSchedules.length;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    if (activeScheduleTab === "hospital") {
      setHospitalPage((prev) => prev + 1);
    } else {
      setDispensaryPage((prev) => prev + 1);
    }

    setTimeout(() => setLoadingMore(false), 600);
  }, [loadingMore, hasMore, activeScheduleTab]);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showScheduleModal || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [showScheduleModal, hasMore, loadingMore, loadMore]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ fontSize: "18px", color: "#64748b" }}>Loading session...</div>
      </div>
    );
  }

  return (
    <main className="content-area">
      <div style={{ padding: "32px", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
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
            {toast.type === "success" ? "✓" : "⚠"}
            {toast.message}
            <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "white" }}>
              <X size={18} />
            </button>
          </div>
        )}

        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <Link
              href="/admin/dashboard"
              style={{
                color: "#325E8F",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
              }}
            >
              <ChevronLeft size={22} /> Back to Dashboard
            </Link>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowSpecializations(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  background: !showSpecializations ? "#325E8F" : "transparent",
                  color: !showSpecializations ? "white" : "#64748b",
                  border: "1px solid #e2e8f0",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Doctors List
              </button>
              <button
                onClick={() => setShowSpecializations(true)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  background: showSpecializations ? "#325E8F" : "transparent",
                  color: showSpecializations ? "white" : "#64748b",
                  border: "1px solid #e2e8f0",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Specializations
              </button>
            </div>
          </div>
        </div>

        {showSpecializations ? (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "12px" }}>
                <Stethoscope size={36} style={{ color: "#325E8F" }} />
                Doctor Specializations ({specializations.length})
              </h1>
              <p style={{ color: "#64748b", marginTop: "6px" }}>
                Manage all available medical specializations
              </p>
            </div>

            <div
              style={{
                background: "white",
                padding: "28px",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                marginBottom: "40px",
              }}
            >
              <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 600 }}>
                Add New Specialization
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "16px", alignItems: "end" }}>
                <input
                  type="text"
                  placeholder="Name (e.g., Cardiology)"
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    fontSize: "15px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newSpecDesc}
                  onChange={(e) => setNewSpecDesc(e.target.value)}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    fontSize: "15px",
                  }}
                />
                <button
                  onClick={createSpecialization}
                  style={{
                    padding: "16px 32px",
                    background: "#325E8F",
                    color: "white",
                    border: "none",
                    borderRadius: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <Plus size={20} /> Add
                </button>
              </div>
            </div>

            {specLoading ? (
              <div style={{ textAlign: "center", padding: "100px", color: "#64748b" }}>
                <RefreshCw size={48} style={{ animation: "spin 1.5s linear infinite", marginBottom: "16px" }} />
                <p>Loading specializations...</p>
              </div>
            ) : specializations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "100px", color: "#94a3b8" }}>
                <Stethoscope size={64} style={{ opacity: 0.3, marginBottom: "20px" }} />
                <h3>No specializations found</h3>
                <p>Add your first specialization using the form above.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {specializations.map((spec) => (
                  <div
                    key={spec.id}
                    style={{
                      background: "white",
                      padding: "16px",
                      borderRadius: "14px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      border: "1px solid #e2e8f0",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {editingSpec?.id === spec.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input
                          value={editingSpec.specializations}
                          onChange={(e) => setEditingSpec({ ...editingSpec, specializations: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "15px",
                          }}
                        />
                        <input
                          value={editingSpec.description || ""}
                          onChange={(e) => setEditingSpec({ ...editingSpec, description: e.target.value })}
                          placeholder="Description (optional)"
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "14px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={updateSpecialization}
                            style={{
                              flex: 1,
                              padding: "10px 16px",
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSpec(null)}
                            style={{
                              flex: 1,
                              padding: "10px 16px",
                              background: "#6b7280",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1, marginBottom: "12px" }}>
                          <h4 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "700", color: "#325E8F" }}>
                            {spec.specializations}
                            {spec.local && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                                (local)
                              </span>
                            )}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              color: spec.description ? "#64748b" : "#94a3b8",
                              fontStyle: spec.description ? "normal" : "italic",
                              fontSize: "13px",
                              lineHeight: "1.4",
                            }}
                          >
                            {spec.description
                              ? spec.description.slice(0, 50) + (spec.description.length > 50 ? "..." : "")
                              : "No description"}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => setEditingSpec(spec)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              background: "#eef2ff",
                              color: "#325E8F",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button
                            onClick={() => deleteSpecialization(spec.id)}
                            style={{
                              flex: 1,
                              padding: "8px",
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
                <Stethoscope size={36} style={{ color: "#325E8F" }} />
                All Doctors ({totalElements})
              </h1>
              <p style={{ color: "#64748b", marginTop: "6px" }}>
                Showing page {page + 1} of {totalPages || 1}
              </p>
            </div>

            <div style={{ marginBottom: "32px", maxWidth: "600px" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={20}
                  style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, NIC, license, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 20px 16px 52px",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    fontSize: "16px",
                    backgroundColor: "white",
                    outline: "none",
                    transition: "border 0.3s ease",
                  }}
                  onFocus={(e) => (e.target.style.border = "1px solid #325E8F")}
                  onBlur={(e) => (e.target.style.border = "1px solid #e2e8f0")}
                />
              </div>
            </div>

            {!loading && filteredDoctors.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "18px" }}>
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    style={{
                      borderRadius: "16px",
                      padding: "18px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                      {doctor.profileFirebaseUrl ? (
                        <div
                          style={{
                            width: "54px",
                            height: "54px",
                            borderRadius: "12px",
                            background: `url(${doctor.profileFirebaseUrl}) center/cover`,
                            border: "3px solid #365472",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "54px",
                            height: "54px",
                            borderRadius: "12px",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            fontWeight: "bold",
                            flexShrink: 0,
                            boxShadow: "0 4px 12px rgba(50, 94, 143, 0.3)",
                          }}
                        >
                          {doctor.fullName?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <h3
                          style={{
                            fontSize: "19px",
                            margin: "0 0 3px 0",
                            fontWeight: "800",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {doctor.fullName || "Unnamed"}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            color: "#325E8F",
                            fontSize: "14px",
                            fontWeight: "700",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(() => {
                            const spec = doctor.specializations;
                            if (!spec || (Array.isArray(spec) && spec.length === 0)) {
                              return "Not Specified";
                            }
                            if (typeof spec === "string" && spec.trim()) {
                              return spec;
                            }
                            if (Array.isArray(spec) && spec.length > 0) {
                              if (typeof spec[0] === "object" && spec[0] !== null && "name" in spec[0]) {
                                return spec.map((s: any) => s.name || s.specializations || "—").join(", ");
                              }
                              if (typeof spec[0] === "string") {
                                return spec.join(", ");
                              }
                              return spec.toString();
                            }
                            if (typeof spec === "object" && spec !== null && "name" in spec) {
                              return spec.name || spec.specializations || "Unknown";
                            }
                            return "Not Specified";
                          })()}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: "8px", fontSize: "17px", marginBottom: "12px" }}>
                      {doctor.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                          <Mail size={16} style={{ flexShrink: 0, color: "#2b5e8ed9" }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                            {doctor.email}
                          </span>
                        </div>
                      )}
                      {doctor.phoneNumber && (
                        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                          <Phone size={16} style={{ flexShrink: 0, color: "#2b5e8ed9" }} />
                          <span style={{ fontWeight: 500 }}>{doctor.phoneNumber}</span>
                        </div>
                      )}
                      {doctor.nic && (
                        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                          <IdCard size={16} style={{ flexShrink: 0, color: "#2b5e8ed9" }} />
                          <span style={{ fontWeight: 500 }}>{doctor.nic}</span>
                        </div>
                      )}
                      {(doctor.averageRating || doctor.totalReviews) && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                            background: "#fef3c7",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            width: "fit-content",
                          }}
                        >
                          <Star size={16} style={{ color: "#f59e0b", fill: "#f59e0b", flexShrink: 0 }} />
                          <span style={{ fontWeight: "700", color: "#d97706" }}>
                            <strong>{doctor.averageRating?.toFixed(1) || "0.0"}</strong> ({doctor.totalReviews || 0})
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ paddingTop: "10px", borderTop: "2px solid", fontSize: "14px", color: "#64748b", marginBottom: "12px" }}>
                      {doctor.hospitalName && (
                        <p style={{ margin: "8px 0 0 0", fontWeight: 600, color: "#0f172a" }}>
                          🏥 {doctor.hospitalName.slice(0, 25)}
                          {doctor.hospitalName.length > 25 ? "..." : ""}
                        </p>
                      )}
                      {doctor.medicalLicenseNumber && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                          📋 License: {doctor.medicalLicenseNumber.slice(0, 15)}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", paddingTop: "10px", borderTop: "2px solid #e0e7ff", flexWrap: "wrap" }}>
                      <button
                        onClick={() => fetchDoctorStaff(doctor)}
                        style={{
                          flex: 1,
                          minWidth: 140,
                          padding: "10px 12px",
                          background: "#f3e8ff",
                          color: "#6b21a8",
                          border: "1.5px solid #d8b4fe",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Users size={14} /> View Staff
                      </button>
                      <button
                        onClick={() => fetchAssignedHospitals(doctor)}
                        style={{
                          flex: 1,
                          minWidth: 140,
                          padding: "10px 12px",
                          background: "#eef2ff",
                          color: "#325E8F",
                          border: "1.5px solid #c7d2fe",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Eye size={14} /> View Hospitals
                      </button>
                      <button
                        onClick={() => fetchDoctorDispensaries(doctor)}
                        style={{
                          flex: 1,
                          minWidth: 160,
                          padding: "10px 12px",
                          background: "#e8f0ff",
                          color: "#4d6ec2",
                          border: "1.5px solid #8dacde",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Building2 size={14} /> View Dispensaries
                      </button>
                      <button
                        onClick={() => openScheduleModal(doctor)}
                        style={{
                          flex: 1,
                          minWidth: 140,
                          padding: "10px 12px",
                          background: "#d1fae5",
                          color: "#065f46",
                          border: "1.5px solid #6ee7b7",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <BookOpen size={14} /> View Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hospitals Modal */}
            {showHospitalsModal && selectedDoctor && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  padding: "20px",
                }}
                onClick={() => setShowHospitalsModal(false)}
              >
                <div
                  style={{
                    width: "900px",
                    maxHeight: "85vh",
                    overflowY: "auto",
                    background: "white",
                    borderRadius: "22px",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(17, 54, 110, 0.75)",
                    position: "relative",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowHospitalsModal(false)}
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      border: "none",
                      borderRadius: "10px",
                      padding: 6,
                      cursor: "pointer",
                    }}
                  >
                    <X size={20} />
                  </button>

                  <div style={{ display: "flex", gap: "18px", marginBottom: "26px" }}>
                    {selectedDoctor.profileFirebaseUrl ? (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 16,
                          background: `url(${selectedDoctor.profileFirebaseUrl}) center/cover`,
                          border: "3px solid #325E8F",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 16,
                          background: "linear-gradient(135deg, #325E8F, #4b658d)",
                          color: "white",
                          fontSize: 30,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selectedDoctor.fullName?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <h2 style={{ margin: 0, fontSize: 26 }}>
                        {selectedDoctor.fullName}
                      </h2>
                      <p style={{ margin: 0, color: "#325E8F", fontWeight: 600 }}>
                        {(() => {
                          const spec = selectedDoctor.specializations;
                          if (typeof spec === "string") return spec;
                          if (Array.isArray(spec)) return spec.join(", ") || "None";
                          if (spec && typeof spec === "object" && "name" in spec) return (spec as any).name || "—";
                          return "Not Specified";
                        })()}
                      </p>
                      <p style={{ marginTop: 4, color: "#64748b" }}>
                        {selectedDoctor.email}
                      </p>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>
                    Assigned Hospitals
                  </h3>

                  {hospitalLoading ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <Loader2 size={40} className="animate-spin mx-auto text-[#325E8F]" />
                      <p style={{ marginTop: 12, color: "#64748b" }}>Loading hospitals...</p>
                    </div>
                  ) : assignedHospitals.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>
                      No hospitals assigned to this doctor.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                      {assignedHospitals.map((hospital, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "18px",
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 14px rgba(6, 42, 79, 0.1)",
                            background: "#f8fafc",
                          }}
                        >
                          <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                            {hospital.name || "Unnamed Hospital"}
                          </h4>
                          {hospital.address && (
                            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#475569" }}>
                              📍 {hospital.address}
                            </p>
                          )}
                          {hospital.phone && (
                            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#475569" }}>
                              📞 {hospital.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ textAlign: "right", marginTop: "32px" }}>
                    <button
                      onClick={() => setShowHospitalsModal(false)}
                      style={{
                        padding: "14px 40px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dispensaries Modal */}
            {showDispensariesModal && selectedDoctor && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  padding: "20px",
                }}
                onClick={() => setShowDispensariesModal(false)}
              >
                <div
                  style={{
                    width: "900px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    background: "white",
                    borderRadius: "22px",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(17, 54, 110, 0.75)",
                    position: "relative",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowDispensariesModal(false)}
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      border: "none",
                      borderRadius: "10px",
                      padding: 6,
                      cursor: "pointer",
                    }}
                  >
                    <X size={20} />
                  </button>

                  <div style={{ display: "flex", gap: "18px", marginBottom: "26px" }}>
                    {selectedDoctor.profileFirebaseUrl ? (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 16,
                          background: `url(${selectedDoctor.profileFirebaseUrl}) center/cover`,
                          border: "3px solid #325E8F",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 16,
                          background: "linear-gradient(135deg, #325E8F, #4b658d)",
                          color: "white",
                          fontSize: 30,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selectedDoctor.fullName?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <h2 style={{ margin: 0, fontSize: 26 }}>
                        Dispensaries of {selectedDoctor.fullName}
                      </h2>
                      <p style={{ margin: 0, color: "#325E8F", fontWeight: 600 }}>
                        {(() => {
                          const spec = selectedDoctor.specializations;
                          if (typeof spec === "string") return spec;
                          if (Array.isArray(spec)) return spec.join(", ") || "None";
                          if (spec && typeof spec === "object" && "name" in spec) return (spec as any).name || "—";
                          return "Not Specified";
                        })()}
                      </p>
                      <p style={{ marginTop: 4, color: "#64748b" }}>
                        {selectedDoctor.email}
                      </p>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
                    Registered Dispensaries ({assignedDispensaries.length})
                  </h3>

                  {dispensaryLoading ? (
                    <div style={{ textAlign: "center", padding: "60px" }}>
                      <Loader2 size={48} className="animate-spin mx-auto text-[#325E8F]" />
                      <p style={{ marginTop: 16, color: "#64748b" }}>Loading dispensaries...</p>
                    </div>
                  ) : assignedDispensaries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                      <Building2 size={64} style={{ opacity: 0.4 }} />
                      <p style={{ marginTop: 16, fontSize: "18px" }}>
                        This doctor has not registered any dispensaries yet.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                      {assignedDispensaries.map((d) => (
                        <div
                          key={d.id}
                          style={{
                            padding: "20px",
                            borderRadius: "16px",
                            background: d.isActive ? "#f0fdf4" : "#fee2e2",
                            border: `1px solid ${d.isActive ? "#86efac" : "#fecaca"}`,
                            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                            {d.profileUrl ? (
                              <div
                                style={{
                                  width: "64px",
                                  height: "64px",
                                  borderRadius: "12px",
                                  background: `url(${d.profileUrl}) center/cover`,
                                  border: "2px solid #cbd5e1",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "64px",
                                  height: "64px",
                                  borderRadius: "12px",
                                  background: "linear-gradient(135deg, #64748b, #475569)",
                                  color: "white",
                                  fontSize: "28px",
                                  fontWeight: "bold",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {d.name?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                            <h4 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
                              {d.name}
                            </h4>
                          </div>
                          <div style={{ display: "grid", gap: 10, fontSize: 14, color: "#475569" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <Home size={18} style={{ color: "#64748b", flexShrink: 0, marginTop: 2 }} />
                              <div><strong>Address:</strong> {d.address || "—"}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <IdCard size={18} style={{ color: "#8b5cf6" }} />
                              <div><strong>Register No:</strong> {d.licenseNumber || "—"}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <User size={18} style={{ color: "#ec4899" }} />
                              <div><strong>Doctor:</strong> {d.ownerName || "—"}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Building2 size={18} style={{ color: "#64748b" }} />
                              <div>
                                <strong>Status:</strong>{" "}
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color:
                                      d.status === "ACTIVE" ? "#166534" :
                                      d.status === "PENDING" ? "#d97706" :
                                      "#991b1b",
                                  }}
                                >
                                  {d.status || "Unknown"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ textAlign: "right", marginTop: "32px" }}>
                    <button
                      onClick={() => setShowDispensariesModal(false)}
                      style={{
                        padding: "14px 40px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Modal */}
            {showStaffModal && selectedDoctor && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  padding: "20px",
                }}
                onClick={() => setShowStaffModal(false)}
              >
                <div
                  style={{
                    width: "600px",
                    maxHeight: "85vh",
                    overflowY: "auto",
                    background: "white",
                    borderRadius: "22px",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(17, 54, 110, 0.75)",
                    position: "relative",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowStaffModal(false)}
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      border: "none",
                      borderRadius: "10px",
                      padding: 6,
                      cursor: "pointer",
                    }}
                  >
                    <X size={20} />
                  </button>

                  <div style={{ display: "flex", gap: "18px", marginBottom: "26px", alignItems: "center" }}>
                    {selectedDoctor.profileFirebaseUrl ? (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 16,
                          background: `url(${selectedDoctor.profileFirebaseUrl}) center/cover`,
                          border: "3px solid #325E8F",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 16,
                          background: "linear-gradient(135deg, #325E8F, #4b658d)",
                          color: "white",
                          fontSize: 30,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selectedDoctor.fullName?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <h2 style={{ margin: 0, fontSize: 26 }}>
                        Staff of {selectedDoctor.fullName}
                      </h2>
                      <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                        {selectedDoctor.email}
                      </p>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                    Login Staff Members ({assignedStaff.length})
                  </h3>

                  {staffLoading ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <Loader2 size={48} className="animate-spin mx-auto mb-4 text-[#325E8F]" />
                      <p style={{ marginTop: 16, color: "#64748b" }}>Loading staff...</p>
                    </div>
                  ) : staffError ? (
                    <p style={{ color: "#dc2626", fontWeight: 700, textAlign: "center", padding: "60px 0" }}>
                      {staffError}
                    </p>
                  ) : assignedStaff.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                      <Users size={64} style={{ opacity: 0.4, marginBottom: "16px" }} />
                      <p style={{ marginTop: 16, fontSize: "18px" }}>
                        No staff members created yet for this doctor.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                      {assignedStaff.map((staff, index) => (
                        <div
                          key={index}
                          style={{
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                          }}
                        >
                          <h4 style={{ margin: "0 0 8px 0", fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                            {staff.staffName || "Unnamed Staff"}
                          </h4>
                          <div style={{ fontSize: 14, color: "#475569", lineHeight: "1.6" }}>
                            <p><strong>Phone:</strong> {staff.phoneNumber || "—"}</p>
                            <p><strong>NIC:</strong> {staff.nic || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ textAlign: "right", marginTop: "24px" }}>
                    <button
                      onClick={() => setShowStaffModal(false)}
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

            {/* Doctor Bookings Modal */}
            {showDoctorBookingsModal && selectedDoctorForBookings && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  padding: "20px",
                }}
                onClick={() => setShowDoctorBookingsModal(false)}
              >
                <div
                  style={{
                    width: "900px",
                    maxHeight: "85vh",
                    overflowY: "auto",
                    background: "white",
                    borderRadius: "22px",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(17, 54, 110, 0.75)",
                    position: "relative",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowDoctorBookingsModal(false)}
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      border: "none",
                      borderRadius: "10px",
                      padding: 6,
                      cursor: "pointer",
                    }}
                  >
                    <X size={20} />
                  </button>

                  <h2 style={{ margin: "0 0 24px 0", fontSize: 26, fontWeight: 800, color: "#1e293b" }}>
                    Bookings — {selectedDoctorForBookings.fullName}
                  </h2>

                  <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => setActiveBookingsTab("hospital")}
                      style={{
                        padding: "12px 24px",
                        background: activeBookingsTab === "hospital" ? "#325E8F" : "transparent",
                        color: activeBookingsTab === "hospital" ? "white" : "#64748b",
                        border: activeBookingsTab === "hospital" ? "none" : "1px solid #cbd5e1",
                        borderRadius: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Hospital Bookings
                    </button>
                    <button
                      onClick={() => setActiveBookingsTab("dispensary")}
                      style={{
                        padding: "12px 24px",
                        background: activeBookingsTab === "dispensary" ? "#0891b2" : "transparent",
                        color: activeBookingsTab === "dispensary" ? "white" : "#64748b",
                        border: activeBookingsTab === "dispensary" ? "none" : "1px solid #cbd5e1",
                        borderRadius: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Dispensary Bookings
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                    {["CONFIRMED", "CANCELLED", "COMPLETED", "REJECTED"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveBookingFilter(f as any)}
                        style={{
                          padding: "10px 20px",
                          background: activeBookingFilter === f ? 
                            (f === "CONFIRMED" ? "#16a34a" : 
                             f === "CANCELLED" ? "#ef4444" : 
                             f === "COMPLETED" ? "#3b82f6" : "#991b1b") 
                            : "#e5e7eb",
                          color: activeBookingFilter === f ? "white" : "#475569",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {activeBookingsTab === "hospital" ? (
                    hospitalBookingsLoading ? (
                      <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <Loader2 size={48} className="animate-spin mx-auto" color="#325E8F" />
                        <p style={{ marginTop: 16, color: "#64748b" }}>Loading hospital bookings...</p>
                      </div>
                    ) : hospitalBookingsError ? (
                      <p style={{ color: "#ef4444", textAlign: "center", padding: "80px 0" }}>
                        {hospitalBookingsError}
                      </p>
                    ) : getFilteredBookings(hospitalBookings, activeBookingFilter).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                        <BookOpen size={64} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: 16, fontSize: 18 }}>
                          No {activeBookingFilter.toLowerCase()} hospital bookings found.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "16px" }}>
                        {getFilteredBookings(hospitalBookings, activeBookingFilter).map((b) => (
                          <div
                            key={b.id}
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              background: "#f8fafc",
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                              {b.patientName || "Patient"}
                            </div>
                            <div style={{ color: "#475569", fontSize: 14 }}>
                              <p><strong>Ref:</strong> {b.bookingReference || "—"}</p>
                              <p><strong>Queue:</strong> {b.queueNumber ?? "—"}</p>
                              <p><strong>Status:</strong> {b.status || "—"}</p>
                              <p><strong>Date:</strong> {b.scheduleDate || "—"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    dispensaryBookingsLoading ? (
                      <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <Loader2 size={48} className="animate-spin mx-auto" color="#0891b2" />
                        <p style={{ marginTop: 16, color: "#64748b" }}>Loading dispensary bookings...</p>
                      </div>
                    ) : dispensaryBookingsError ? (
                      <p style={{ color: "#ef4444", textAlign: "center", padding: "80px 0" }}>
                        {dispensaryBookingsError}
                      </p>
                    ) : getFilteredBookings(dispensaryBookings, activeBookingFilter).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                        <BookOpen size={64} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: 16, fontSize: 18 }}>
                          No {activeBookingFilter.toLowerCase()} dispensary bookings found.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "16px" }}>
                        {getFilteredBookings(dispensaryBookings, activeBookingFilter).map((b) => (
                          <div
                            key={b.id}
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              background: "#f8fafc",
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                              {b.patientName || "Patient"}
                            </div>
                            <div style={{ color: "#475569", fontSize: 14 }}>
                              <p><strong>Ref:</strong> {b.bookingReference || "—"}</p>
                              <p><strong>Queue:</strong> {b.queueNumber ?? "—"}</p>
                              <p><strong>Status:</strong> {b.status || "—"}</p>
                              <p><strong>Date:</strong> {b.scheduleDate || "—"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  <div style={{ textAlign: "right", marginTop: "32px" }}>
                    <button
                      onClick={() => setShowDoctorBookingsModal(false)}
                      style={{
                        padding: "14px 40px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && selectedDoctorForSchedule && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  padding: "20px",
                }}
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedDoctorForSchedule(null);
                  setSchedules([]);
                  setHospitalPage(0);
                  setDispensaryPage(0);
                }}
              >
                <div
                  style={{
                    width: "940px",
                    maxHeight: "88vh",
                    overflowY: "auto",
                    background: "white",
                    borderRadius: "22px",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(17, 54, 110, 0.75)",
                    position: "relative",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedDoctorForSchedule(null);
                      setSchedules([]);
                    }}
                    style={{
                      position: "absolute",
                      top: 20,
                      right: 24,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <X size={28} color="#475569" />
                  </button>

                  <h2 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 800, color: "#1e293b" }}>
                    Schedules — {selectedDoctorForSchedule.fullName}
                  </h2>

                  <div style={{ marginBottom: "28px" }}>
                    <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0" }}>
                      <button
                        onClick={() => {
                          setActiveScheduleTab("hospital");
                          setHospitalPage(0);
                        }}
                        style={{
                          padding: "12px 24px",
                          fontSize: "15px",
                          fontWeight: 700,
                          background: "none",
                          border: "none",
                          borderBottom: activeScheduleTab === "hospital" ? "3px solid #325E8F" : "none",
                          color: activeScheduleTab === "hospital" ? "#325E8F" : "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        Hospital Schedules
                      </button>
                      <button
                        onClick={() => {
                          setActiveScheduleTab("dispensary");
                          setDispensaryPage(0);
                        }}
                        style={{
                          padding: "12px 24px",
                          fontSize: "15px",
                          fontWeight: 700,
                          background: "none",
                          border: "none",
                          borderBottom: activeScheduleTab === "dispensary" ? "3px solid #0891b2" : "none",
                          color: activeScheduleTab === "dispensary" ? "#0891b2" : "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        Dispensary Schedules
                      </button>
                    </div>
                  </div>

                  {schedulesLoading ? (
                    <div style={{ textAlign: "center", padding: "120px 0" }}>
                      <Loader2 size={48} style={{ animation: "spin 1.2s linear infinite", color: "#325E8F" }} />
                      <p style={{ marginTop: 20, color: "#64748b" }}>Loading schedules...</p>
                    </div>
                  ) : schedulesError ? (
                    <div style={{ textAlign: "center", padding: "100px 0", color: "#ef4444" }}>
                      <AlertCircle size={48} style={{ marginBottom: 16 }} />
                      <p>{schedulesError}</p>
                    </div>
                  ) : currentSchedules.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "120px 0", color: "#94a3b8" }}>
                      <Calendar size={64} style={{ opacity: 0.35, marginBottom: 20 }} />
                      <p style={{ fontSize: 18 }}>
                        No {activeScheduleTab} schedules found for this doctor.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gap: "16px", marginBottom: "40px" }}>
                        {displayedSchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            style={{
                              padding: "18px 22px",
                              border: "1px solid #e2e8f0",
                              borderRadius: "14px",
                              background: "#f8fafc",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "20px",
                              transition: "all 0.2s",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 17, color: "#1e293b", marginBottom: 10 }}>
                                {schedule.scheduleDate || "——"}
                              </div>
                              <div style={{ color: "#475569", fontSize: 14.5, display: "grid", gap: "6px" }}>
                                <div>
                                  <strong>Time:</strong> {schedule.startTime || "—"} – {schedule.endTime || "—"}
                                </div>
                                <div>
                                  <strong>Max Patients:</strong> {schedule.maxPatients ?? "—"}
                                </div>
                                <div>
                                  <strong>Booked:</strong> {schedule.currentPatientCount ?? 0}
                                </div>
                                <div>
                                  <strong>Fee:</strong> {schedule.consultationFee ? `Rs. ${schedule.consultationFee}` : "—"}
                                </div>
                                <div>
                                  <strong>Center:</strong>{" "}
                                  <span
                                    style={{
                                      color: schedule.centerType === "HOSPITAL" ? "#325E8F" : "#0891b2",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {schedule.centerType || "—"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => openScheduleBookingsModal(schedule)}
                              style={{
                                padding: "12px 24px",
                                background: schedule.centerType === "HOSPITAL" ? "#325E8F" : "#0891b2",
                                color: "white",
                                border: "none",
                                borderRadius: "10px",
                                fontWeight: 700,
                                fontSize: "14px",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Eye size={16} />
                              View Bookings
                            </button>
                          </div>
                        ))}
                      </div>

                      {loadingMore && (
                        <div style={{ textAlign: "center", padding: "32px 0 48px" }}>
                          <Loader2 size={40} className="animate-spin mx-auto mb-4" color="#325E8F" />
                          <p style={{ color: "#64748b" }}>Loading more schedules...</p>
                        </div>
                      )}

                      {hasMore && <div ref={observerTarget} style={{ height: "80px" }} />}

                      {!hasMore && displayedSchedules.length > 0 && (
                        <p style={{ textAlign: "center", color: "#64748b", fontSize: 15, padding: "32px 0" }}>
                          All {activeScheduleTab} schedules loaded.
                        </p>
                      )}
                    </>
                  )}

                  <div style={{ textAlign: "right", marginTop: "32px" }}>
                    <button
                      onClick={() => {
                        setShowScheduleModal(false);
                        setSelectedDoctorForSchedule(null);
                        setSchedules([]);
                      }}
                      style={{
                        padding: "14px 40px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Bookings Sub-Modal */}
            {showScheduleBookingsModal && selectedSchedule && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10000,
                  padding: "20px",
                }}
                onClick={() => {
                  setShowScheduleBookingsModal(false);
                  setSelectedSchedule(null);
                  setScheduleBookings([]);
                }}
              >
                <div
                  style={{
                    width: "800px",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    background: "white",
                    borderRadius: "22px",
                    padding: "32px",
                    boxShadow: "0 25px 60px rgba(17, 54, 110, 0.75)",
                    position: "relative",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setShowScheduleBookingsModal(false);
                      setSelectedSchedule(null);
                      setScheduleBookings([]);
                    }}
                    style={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      border: "none",
                      borderRadius: "10px",
                      padding: 6,
                      cursor: "pointer",
                      background: "none",
                    }}
                  >
                    <X size={24} />
                  </button>

                  <h3 style={{ margin: 0, fontSize: 24, marginBottom: 16, color: "#1e293b" }}>
                    Bookings for {selectedSchedule.scheduleDate || "Schedule"}
                  </h3>

                  <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: "14px" }}>
                    {selectedSchedule.startTime} - {selectedSchedule.endTime}
                  </p>

                  <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                    {["CONFIRMED", "CANCELLED", "COMPLETED", "REJECTED"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setScheduleBookingFilter(filter as any)}
                        style={{
                          padding: "10px 18px",
                          background:
                            scheduleBookingFilter === filter
                              ? filter === "CONFIRMED"
                                ? "#16a34a"
                                : filter === "CANCELLED"
                                ? "#ef4444"
                                : filter === "COMPLETED"
                                ? "#3b82f6"
                                : "#991b1b"
                              : "#e5e7eb",
                          color: scheduleBookingFilter === filter ? "white" : "#475569",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: 700,
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {scheduleBookingsLoading ? (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                      <Loader2 size={48} style={{ animation: "spin 1.5s linear infinite", color: "#325E8F", marginBottom: "16px" }} />
                      <p style={{ color: "#64748b" }}>Loading bookings...</p>
                    </div>
                  ) : scheduleBookingsError ? (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#ef4444" }}>
                      <AlertCircle size={48} style={{ marginBottom: "16px" }} />
                      <p>{scheduleBookingsError}</p>
                    </div>
                  ) : getFilteredBookings(scheduleBookings, scheduleBookingFilter).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
                      <BookOpen size={64} style={{ opacity: 0.3, marginBottom: "16px" }} />
                      <p style={{ fontSize: "16px" }}>No {scheduleBookingFilter.toLowerCase()} bookings found.</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                      {getFilteredBookings(scheduleBookings, scheduleBookingFilter).map((booking) => (
                        <div
                          key={booking.id}
                          style={{
                            padding: "18px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            background:
                              (booking.status || "").toUpperCase() === "CONFIRMED"
                                ? "#f0fdf4"
                                : (booking.status || "").toUpperCase() === "CANCELLED"
                                ? "#fee2e2"
                                : (booking.status || "").toUpperCase() === "COMPLETED"
                                ? "#eff6ff"
                                : (booking.status || "").toUpperCase() === "REJECTED"
                                ? "#fef2f2"
                                : "#f8fafc",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: "16px", color: "#1e293b", marginBottom: "8px" }}>
                            {booking.patientName || "Patient"}
                          </div>
                          <div style={{ color: "#475569", fontSize: "14px", display: "grid", gap: "4px" }}>
                            <p style={{ margin: 0 }}>
                              <strong>Reference:</strong> {booking.bookingReference || "—"}
                            </p>
                            <p style={{ margin: 0 }}>
                              <strong>Queue No:</strong> {booking.queueNumber ?? "—"}
                            </p>
                            <p style={{ margin: 0 }}>
                              <strong>Status:</strong> {booking.status || "—"}
                            </p>
                            <p style={{ margin: 0 }}>
                              <strong>Date:</strong> {booking.scheduleDate || "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ textAlign: "right", marginTop: "32px" }}>
                    <button
                      onClick={() => {
                        setShowScheduleBookingsModal(false);
                        setSelectedSchedule(null);
                        setScheduleBookings([]);
                      }}
                      style={{
                        padding: "12px 32px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "700",
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && filteredDoctors.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
                <Stethoscope size={64} style={{ opacity: 0.3, marginBottom: "16px" }} />
                <h3>No doctors found</h3>
                {searchTerm.trim() ? (
                  <p>No doctors match "<strong>{searchTerm}</strong>"</p>
                ) : (
                  <p>There are currently no registered doctors.</p>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 40,
                }}
              >
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  style={{
                    padding: "10px 16px",
                    background: page === 0 ? "#e2e8f0" : "#325E8F",
                    color: page === 0 ? "#64748b" : "white",
                    border: "none",
                    borderRadius: 10,
                    cursor: page === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  style={{
                    padding: "10px 16px",
                    background: page === totalPages - 1 ? "#e2e8f0" : "#325E8F",
                    color: page === totalPages - 1 ? "#64748b" : "white",
                    border: "none",
                    borderRadius: 10,
                    cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: "center", padding: "100px 20px", color: "#64748b" }}>
                <RefreshCw size={48} style={{ animation: "spin 1.5s linear infinite", marginBottom: "16px" }} />
                <p style={{ fontSize: "18px" }}>Loading doctors...</p>
              </div>
            )}
          </>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </main>
  );
}