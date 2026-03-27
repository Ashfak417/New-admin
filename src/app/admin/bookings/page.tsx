// // app/admin/bookings/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import {
//   Calendar,
//   Clock,
//   Stethoscope,
//   Building2,
//   CheckCircle,
//   XCircle,
//   Loader2,
//   RefreshCw,
//   ChevronLeft,
//   ChevronRight,
//   Search,
//   AlertTriangle,
//   X,                      // ← FIXED: import X for toast close button
// } from "lucide-react";
// import { getAuthToken } from "@/lib/auth";

// const MAIN_BLUE = "#325E8F";

// interface Booking {
//   id: number;
//   patientName: string;
//   doctorName: string;
//   hospitalName: string;
//   date: string;
//   time: string;
//   status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
//   type: "OPD" | "Emergency" | "Follow-up";
//   createdAt: string;
// }

// export default function BookingsPage() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

//   const [page, setPage] = useState(0);
//   const [size] = useState(10);
//   const [totalPages, setTotalPages] = useState(1);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string>("");

//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

//   const showToast = (type: "success" | "error", message: string) => {
//     setToast({ type, message });
//     setTimeout(() => setToast(null), 5000);
//   };

//   const fetchBookings = async () => {
//     const token = getAuthToken();
//     if (!token) {
//       window.location.href = "/admin/login";
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       let url = `${API_BASE}/bookings?page=${page}&size=${size}`;
//       if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
//       if (statusFilter) url += `&status=${statusFilter}`;

//       const res = await fetch(url, {
//         headers: { Authorization: `Bearer ${token}` },
//         cache: "no-store",
//       });

//       if (!res.ok) {
//         if (res.status === 401 || res.status === 403) {
//           window.location.href = "/admin/login";
//           return;
//         }
//         // Instead of throwing → show nice empty state
//         setBookings([]);
//         setTotalPages(1);
//         setError(null);
//         return;
//       }

//       const data = await res.json();
//       const content = data.content || data.data?.content || [];
//       const totalPagesFromApi = data.totalPages || data.data?.totalPages || 1;

//       setBookings(content);
//       setTotalPages(totalPagesFromApi);
//     } catch (err: any) {
//       console.error("Bookings fetch error:", err);
//       // Show empty state instead of error page
//       setBookings([]);
//       setTotalPages(1);
//       setError(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBookings();
//   }, [page, searchQuery, statusFilter]);

//   const handleStatusChange = async (bookingId: number, newStatus: string) => {
//     if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

//     const token = getAuthToken();
//     if (!token) return;

//     try {
//       const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ status: newStatus }),
//       });

//       if (res.ok) {
//         showToast("success", `Booking status updated to ${newStatus}`);
//         fetchBookings();
//       } else {
//         const err = await res.text();
//         showToast("error", err || "Failed to update status");
//       }
//     } catch {
//       showToast("error", "Network error");
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     const styles: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
//       PENDING:    { bg: "#fefce8", text: "#854d0e", icon: <Clock size={14} /> },
//       CONFIRMED:  { bg: "#d1fae5", text: "#065f46", icon: <CheckCircle size={14} /> },
//       CANCELLED:  { bg: "#fee2e2", text: "#991b1b", icon: <XCircle size={14} /> },
//       COMPLETED:  { bg: "#dbeafe", text: "#1e40af", icon: <CheckCircle size={14} /> },
//     };

//     const style = styles[status] || { bg: "#e5e7eb", text: "#4b5563", icon: null };

//     return (
//       <span
//         style={{
//           padding: "6px 14px",
//           borderRadius: "999px",
//           backgroundColor: style.bg,
//           color: style.text,
//           fontSize: "13px",
//           fontWeight: 600,
//           display: "inline-flex",
//           alignItems: "center",
//           gap: "6px",
//         }}
//       >
//         {style.icon}
//         {status}
//       </span>
//     );
//   };

//   return (
//     <div style={{ padding: "32px 24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
//       {/* Toast */}
//       {toast && (
//         <div
//           style={{
//             position: "fixed",
//             top: 20,
//             right: 20,
//             zIndex: 9999,
//             background: toast.type === "success" ? "#10b981" : "#ef4444",
//             color: "white",
//             padding: "14px 20px",
//             borderRadius: 12,
//             boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
//             display: "flex",
//             alignItems: "center",
//             gap: 12,
//             fontWeight: 600,
//           }}
//         >
//           {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
//           {toast.message}
//           <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "white" }}>
//             <X size={18} />
//           </button>
//         </div>
//       )}

//       <div style={{ marginBottom: "32px" }}>
//         <Link
//           href="/admin/dashboard"
//           style={{
//             color: MAIN_BLUE,
//             fontWeight: 700,
//             display: "inline-flex",
//             alignItems: "center",
//             gap: 8,
//             textDecoration: "none",
//             fontSize: "16px",
//           }}
//         >
//           <ChevronLeft size={22} />
//           Back to Dashboard
//         </Link>
//       </div>

//       <div style={{ marginBottom: "40px" }}>
//         <h1 style={{
//           fontSize: "32px",
//           fontWeight: "bold",
//           color: "#1e293b",
//           margin: 0,
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//         }}>
//           <Calendar size={36} style={{ color: MAIN_BLUE }} />
//           Bookings Management
//         </h1>
//         <p style={{ color: "#64748b", marginTop: "8px" }}>
//           View and manage all appointments across the platform
//         </p>
//       </div>

//       {/* Filters & Search */}
//       <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: "32px", alignItems: "center" }}>
//         <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
//           <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
//           <input
//             type="text"
//             placeholder="Search by patient or doctor name..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             style={{
//               width: "100%",
//               padding: "12px 16px 12px 44px",
//               borderRadius: "12px",
//               border: "1px solid #e2e8f0",
//               fontSize: "15px",
//             }}
//           />
//         </div>

//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           style={{
//             padding: "12px 16px",
//             borderRadius: "12px",
//             border: "1px solid #e2e8f0",
//             background: "white",
//             fontSize: "15px",
//             minWidth: "180px",
//           }}
//         >
//           <option value="">All Statuses</option>
//           <option value="PENDING">Pending</option>
//           <option value="CONFIRMED">Confirmed</option>
//           <option value="CANCELLED">Cancelled</option>
//           <option value="COMPLETED">Completed</option>
//         </select>

//         <button
//           onClick={() => {
//             setSearchQuery("");
//             setStatusFilter("");
//             setPage(0);
//           }}
//           style={{
//             padding: "12px 20px",
//             background: "#f1f5f9",
//             color: "#475569",
//             border: "none",
//             borderRadius: "12px",
//             fontWeight: 600,
//             cursor: "pointer",
//           }}
//         >
//           Clear Filters
//         </button>

//         <button
//           onClick={fetchBookings}
//           disabled={loading}
//           style={{
//             padding: "12px 20px",
//             background: MAIN_BLUE,
//             color: "white",
//             border: "none",
//             borderRadius: "12px",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             cursor: "pointer",
//             fontWeight: 600,
//           }}
//         >
//           <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
//           Refresh
//         </button>
//       </div>

//       {/* Main Content */}
//       {loading ? (
//         <div style={{ textAlign: "center", padding: "120px 0" }}>
//           <Loader2 size={48} className="animate-spin mx-auto mb-6" style={{ color: MAIN_BLUE }} />
//           <p style={{ color: "#64748b", fontSize: "17px" }}>Loading bookings...</p>
//         </div>
//       ) : bookings.length === 0 ? (
//         <div style={{
//           textAlign: "center",
//           padding: "120px 24px",
//           background: "white",
//           borderRadius: "20px",
//           boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
//           border: "1px solid #e5e7eb",
//           maxWidth: "600px",
//           margin: "0 auto",
//         }}>
//           <Calendar 
//             size={80} 
//             style={{ color: "#cbd5e1", margin: "0 auto 24px" }} 
//             strokeWidth={1.2} 
//           />
//           <h2 style={{
//             fontSize: "26px",
//             fontWeight: "700",
//             color: "#1e293b",
//             marginBottom: "12px",
//           }}>
//             No bookings found
//           </h2>
//           <p style={{
//             color: "#64748b",
//             fontSize: "16px",
//             maxWidth: "420px",
//             margin: "0 auto 24px",
//             lineHeight: 1.6,
//           }}>
//             There are currently no appointments scheduled, or none match your current filters.
//           </p>
//           <p style={{
//             color: "#94a3b8",
//             fontSize: "15px",
//           }}>
//             New bookings will appear here once patients schedule them.
//           </p>
//         </div>
//       ) : (
//         <div style={{ display: "grid", gap: "20px" }}>
//           {bookings.map((booking) => (
//             <div
//               key={booking.id}
//               style={{
//                 background: "white",
//                 borderRadius: "16px",
//                 padding: "24px",
//                 boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
//                 border: "1px solid #e5e7eb",
//                 display: "grid",
//                 gridTemplateColumns: "1fr auto",
//                 gap: "16px",
//                 alignItems: "start",
//               }}
//             >
//               <div>
//                 <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
//                   <div style={{
//                     width: "48px",
//                     height: "48px",
//                     borderRadius: "12px",
//                     background: "rgba(50,94,143,0.1)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}>
//                     <Calendar size={24} style={{ color: MAIN_BLUE }} />
//                   </div>
//                   <div>
//                     <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>
//                       {booking.patientName}
//                     </h3>
//                     <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
//                       {booking.type} • {booking.date} at {booking.time}
//                     </p>
//                   </div>
//                 </div>

//                 <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
//                   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                     <Stethoscope size={16} style={{ color: "#64748b" }} />
//                     <span style={{ fontSize: "14px" }}>{booking.doctorName}</span>
//                   </div>
//                   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                     <Building2 size={16} style={{ color: "#64748b" }} />
//                     <span style={{ fontSize: "14px" }}>{booking.hospitalName}</span>
//                   </div>
//                 </div>
//               </div>

//               <div style={{ textAlign: "right" }}>
//                 {getStatusBadge(booking.status)}

//                 <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
//                   {booking.status === "PENDING" && (
//                     <>
//                       <button
//                         onClick={() => handleStatusChange(booking.id, "CONFIRMED")}
//                         style={{
//                           padding: "8px 16px",
//                           background: "#10b981",
//                           color: "white",
//                           border: "none",
//                           borderRadius: "10px",
//                           fontSize: "13px",
//                           fontWeight: 600,
//                           cursor: "pointer",
//                         }}
//                       >
//                         Confirm
//                       </button>
//                       <button
//                         onClick={() => handleStatusChange(booking.id, "CANCELLED")}
//                         style={{
//                           padding: "8px 16px",
//                           background: "#ef4444",
//                           color: "white",
//                           border: "none",
//                           borderRadius: "10px",
//                           fontSize: "13px",
//                           fontWeight: 600,
//                           cursor: "pointer",
//                         }}
//                       >
//                         Cancel
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", marginTop: "40px" }}>
//           <button
//             onClick={() => setPage((p) => Math.max(0, p - 1))}
//             disabled={page === 0}
//             style={{
//               padding: "10px 18px",
//               background: page === 0 ? "#e5e7eb" : MAIN_BLUE,
//               color: page === 0 ? "#94a3b8" : "white",
//               border: "none",
//               borderRadius: "12px",
//               display: "flex",
//               alignItems: "center",
//               gap: 8,
//               cursor: page === 0 ? "not-allowed" : "pointer",
//             }}
//           >
//             <ChevronLeft size={18} />
//             Previous
//           </button>

//           <span style={{ fontWeight: 600, color: "#475569" }}>
//             Page {page + 1} of {totalPages}
//           </span>

//           <button
//             onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
//             disabled={page === totalPages - 1}
//             style={{
//               padding: "10px 18px",
//               background: page === totalPages - 1 ? "#e5e7eb" : MAIN_BLUE,
//               color: page === totalPages - 1 ? "#94a3b8" : "white",
//               border: "none",
//               borderRadius: "12px",
//               display: "flex",
//               alignItems: "center",
//               gap: 8,
//               cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
//             }}
//           >
//             Next
//             <ChevronRight size={18} />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }