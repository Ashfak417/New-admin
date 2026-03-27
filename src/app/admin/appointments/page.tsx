// // app/admin/appointments/page.tsx
// "use client";

// import { useState } from "react";
// import {
//   Search,
//   Plus,
//   Clock,
//   User,
//   Stethoscope,
//   Calendar,
//   Phone,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";

// const MAIN_BLUE = "#325E8F";

// export default function AppointmentsPage() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const [selectedDate, setSelectedDate] = useState(new Date());

//   const appointments = [
//     {
//       id: 1,
//       patientName: "Nimal Perera",
//       doctor: "Dr. Sarah Johnson",
//       time: "09:30",
//       date: new Date(2026, 1, 31),
//       status: "Confirmed",
//       type: "Checkup",
//       phone: "+94 77 123 4567",
//     },
//     {
//       id: 2,
//       patientName: "Kumari Fernando",
//       doctor: "Dr. Michael Chen",
//       time: "10:15",
//       date: new Date(2026, 1, 3),
//       status: "Pending",
//       type: "Follow-up",
//       phone: "+94 71 987 6543",
//     },
//     {
//       id: 3,
//       patientName: "Ahmed Rizwan",
//       doctor: "Dr. Lisa Anderson",
//       time: "11:00",
//       date: new Date(2025, 11, 15),
//       status: "Confirmed",
//       type: "Emergency",
//       phone: "+94 76 555 1122",
//     },
//     {
//       id: 4,
//       patientName: "Priya Silva",
//       doctor: "Dr. Sarah Johnson",
//       time: "14:30",
//       date: new Date(2025, 11, 15),
//       status: "Completed",
//       type: "Consultation",
//       phone: "+94 70 888 2233",
//     },
//     {
//       id: 5,
//       patientName: "Ravi Kumar",
//       doctor: "Dr. David Miller",
//       time: "15:45",
//       date: new Date(2025, 11, 15),
//       status: "Cancelled",
//       type: "Surgery",
//       phone: "+94 75 444 5566",
//     },
//     {
//       id: 6,
//       patientName: "Saman Silva",
//       doctor: "Dr. Michael Chen",
//       time: "16:00",
//       date: new Date(2026, 12, 18),
//       status: "Confirmed",
//       type: "Checkup",
//       phone: "+94 78 999 8877",
//     },
//   ];

//   // Simple date helpers (no date-fns needed!)
//   const getDaysInMonth = (date: Date) => {
//     const year = date.getFullYear();
//     const month = date.getMonth();
//     const days = [];
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const startDate = new Date(firstDay);
//     startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

//     for (
//       let d = new Date(startDate);
//       d <= lastDay;
//       d.setDate(d.getDate() + 1)
//     ) {
//       days.push(new Date(d));
//     }
//     while (days.length < 42) {
//       const next = new Date(days[days.length - 1]);
//       next.setDate(next.getDate() + 1);
//       days.push(next);
//     }
//     return days;
//   };

//   const formatDate = (date: Date, formatStr: string) => {
//     const options: Intl.DateTimeFormatOptions = {
//       weekday: formatStr.includes("EEEE") ? "long" : undefined,
//       year: formatStr.includes("yyyy") ? "numeric" : undefined,
//       month: formatStr.includes("MMMM")
//         ? "long"
//         : formatStr.includes("MMM")
//         ? "short"
//         : undefined,
//       day: formatStr.includes("d") ? "numeric" : undefined,
//     };
//     return date.toLocaleDateString("en-US", options);
//   };

//   const monthDays = getDaysInMonth(currentMonth);
//   const getAppointmentsForDate = (date: Date) =>
//     appointments.filter(
//       (appt) =>
//         appt.date.getDate() === date.getDate() &&
//         appt.date.getMonth() === date.getMonth() &&
//         appt.date.getFullYear() === date.getFullYear()
//     );

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "Confirmed":
//         return "#065f46";
//       case "Pending":
//         return "#92400e";
//       case "Completed":
//         return "#1d4ed8";
//       case "Cancelled":
//         return "#991b1b";
//       default:
//         return "#4b5563";
//     }
//   };

//   return (
//     <div
//       style={{
//         padding: "32px",
//         backgroundColor: "#f8fafc",
//         minHeight: "100vh",
//       }}
//     >
//       <div style={{ marginBottom: "32px" }}>
//         <h1
//           style={{
//             fontSize: "30px",
//             fontWeight: "700",
//             color: "#1e293b",
//             margin: 0,
//             display: "flex",
//             alignItems: "center",
//             gap: "14px",
//           }}
//         >
//           <Calendar size={38} style={{ color: MAIN_BLUE }} />
//           Appointments Calendar
//         </h1>
//         <p style={{ color: "#64748b", margin: "8px 0 0", fontSize: "15px" }}>
//           View and manage all appointments by date
//         </p>
//       </div>

//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 380px",
//           gap: "32px",
//         }}
//       >
//         {/* Calendar */}
//         <div
//           style={{
//             background: "white",
//             borderRadius: "20px",
//             padding: "28px",
//             boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: "24px",
//             }}
//           >
//             <h2
//               style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}
//             >
//               {currentMonth.toLocaleDateString("en-US", {
//                 month: "long",
//                 year: "numeric",
//               })}
//             </h2>
//             <div style={{ display: "flex", gap: "12px" }}>
//               <button
//                 onClick={() =>
//                   setCurrentMonth(
//                     new Date(
//                       currentMonth.getFullYear(),
//                       currentMonth.getMonth() - 1
//                     )
//                   )
//                 }
//                 style={{
//                   padding: "10px",
//                   background: "#f1f5f9",
//                   borderRadius: "12px",
//                   border: "none",
//                   cursor: "pointer",
//                 }}
//               >
//                 <ChevronLeft size={20} />
//               </button>
//               <button
//                 onClick={() =>
//                   setCurrentMonth(
//                     new Date(
//                       currentMonth.getFullYear(),
//                       currentMonth.getMonth() + 1
//                     )
//                   )
//                 }
//                 style={{
//                   padding: "10px",
//                   background: "#f1f5f9",
//                   borderRadius: "12px",
//                   border: "none",
//                   cursor: "pointer",
//                 }}
//               >
//                 <ChevronRight size={20} />
//               </button>
//             </div>
//           </div>

//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(7, 1fr)",
//               gap: "12px",
//               textAlign: "center",
//               fontWeight: "600",
//               color: "#64748b",
//               marginBottom: "12px",
//             }}
//           >
//             {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
//               <div key={day}>{day}</div>
//             ))}
//           </div>

//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(7, 1fr)",
//               gap: "12px",
//             }}
//           >
//             {monthDays.map((day, idx) => {
//               const dayAppointments = getAppointmentsForDate(day);
//               const isToday = day.toDateString() === new Date().toDateString();
//               const isSelected =
//                 day.toDateString() === selectedDate.toDateString();
//               const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

//               return (
//                 <div
//                   key={idx}
//                   onClick={() => isCurrentMonth && setSelectedDate(day)}
//                   style={{
//                     minHeight: "90px",
//                     padding: "12px 8px",
//                     borderRadius: "16px",
//                     background: isToday
//                       ? MAIN_BLUE
//                       : isSelected
//                       ? "#e0e7ff"
//                       : "transparent",
//                     color: isToday
//                       ? "white"
//                       : isCurrentMonth
//                       ? "#1e293b"
//                       : "#94a3b8",
//                     cursor: isCurrentMonth ? "pointer" : "default",
//                     border: isSelected
//                       ? `2px solid ${MAIN_BLUE}`
//                       : "2px solid transparent",
//                     opacity: isCurrentMonth ? 1 : 0.4,
//                     transition: "all 0.3s",
//                   }}
//                 >
//                   <div
//                     style={{
//                       fontWeight: isToday || isSelected ? "700" : "600",
//                       fontSize: "15px",
//                     }}
//                   >
//                     {day.getDate()}
//                   </div>
//                   {dayAppointments.length > 0 && (
//                     <div
//                       style={{
//                         marginTop: "8px",
//                         display: "flex",
//                         flexWrap: "wrap",
//                         gap: "4px",
//                         justifyContent: "center",
//                       }}
//                     >
//                       {dayAppointments.slice(0, 3).map((appt, i) => (
//                         <div
//                           key={i}
//                           style={{
//                             width: "8px",
//                             height: "8px",
//                             borderRadius: "50%",
//                             background: getStatusColor(appt.status),
//                           }}
//                         />
//                       ))}
//                       {dayAppointments.length > 3 && (
//                         <span
//                           style={{
//                             fontSize: "10px",
//                             color: isToday ? "white" : "#64748b",
//                           }}
//                         >
//                           +{dayAppointments.length - 3}
//                         </span>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Selected Date Panel */}
//         <div>
//           <div
//             style={{
//               background: "white",
//               borderRadius: "20px",
//               padding: "28px",
//               boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
//               marginBottom: "20px",
//             }}
//           >
//             <h3
//               style={{
//                 fontSize: "20px",
//                 fontWeight: "700",
//                 color: "#1e293b",
//                 margin: "0 0 20px 0",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "10px",
//               }}
//             >
//               <Calendar size={24} style={{ color: MAIN_BLUE }} />
//               {selectedDate.toLocaleDateString("en-US", {
//                 weekday: "long",
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//               })}
//             </h3>

//             <div style={{ display: "grid", gap: "16px" }}>
//               {getAppointmentsForDate(selectedDate).length === 0 ? (
//                 <p
//                   style={{
//                     textAlign: "center",
//                     color: "#94a3b8",
//                     fontStyle: "italic",
//                     padding: "40px 0",
//                   }}
//                 >
//                   No appointments scheduled
//                 </p>
//               ) : (
//                 getAppointmentsForDate(selectedDate).map((appt) => (
//                   <div
//                     key={appt.id}
//                     style={{
//                       background: "#f8fafc",
//                       borderRadius: "16px",
//                       padding: "20px",
//                       borderLeft: `5px solid ${getStatusColor(appt.status)}`,
//                     }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         marginBottom: "8px",
//                       }}
//                     >
//                       <h4
//                         style={{
//                           margin: 0,
//                           fontWeight: "700",
//                           color: "#1e293b",
//                         }}
//                       >
//                         {appt.patientName}
//                       </h4>
//                       <span
//                         style={{
//                           fontSize: "18px",
//                           fontWeight: "800",
//                           color: MAIN_BLUE,
//                         }}
//                       >
//                         {appt.time}
//                       </span>
//                     </div>
//                     <div
//                       style={{
//                         color: "#475569",
//                         fontSize: "14px",
//                         lineHeight: "1.6",
//                       }}
//                     >
//                       <div>
//                         <Stethoscope
//                           size={14}
//                           style={{ display: "inline", marginRight: "6px" }}
//                         />
//                         {appt.doctor}
//                       </div>
//                       <div>
//                         <Phone
//                           size={14}
//                           style={{ display: "inline", marginRight: "6px" }}
//                         />
//                         {appt.phone}
//                       </div>
//                       <div
//                         style={{
//                           marginTop: "8px",
//                           padding: "4px 10px",
//                           borderRadius: "12px",
//                           background: "#e0e7ff",
//                           color: MAIN_BLUE,
//                           display: "inline-block",
//                           fontSize: "12px",
//                         }}
//                       >
//                         {appt.type}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>

//           <button
//             style={{
//               width: "100%",
//               padding: "16px",
//               background: `linear-gradient(135deg, ${MAIN_BLUE}, #1e3a5f)`,
//               color: "white",
//               border: "none",
//               borderRadius: "16px",
//               fontSize: "17px",
//               fontWeight: "700",
//               cursor: "pointer",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               gap: "12px",
//               boxShadow: "0 10px 30px rgba(50,94,143,0.4)",
//             }}
//           >
//             <Plus size={24} />
//             Schedule New Appointment
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
