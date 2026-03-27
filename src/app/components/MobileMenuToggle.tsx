// // src/app/components/MobileMenuToggle.tsx
// "use client";

// import { useState } from "react";

// interface MobileMenuToggleProps {
//   children: React.ReactNode;
// }

// export default function MobileMenuToggle({ children }: MobileMenuToggleProps) {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <>
//       {/* Hamburger Button - Only on small screens (< lg) */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="fixed top-6 left-6 z-[10001] lg:hidden bg-white/20 backdrop-blur-md p-3 rounded-xl shadow-lg hover:bg-white/30 transition-all"
//         aria-label="Toggle sidebar menu"
//       >
//         <div className="w-7 h-7 relative">
//           <span
//             className={`absolute block w-full h-1 bg-white rounded-full transition-all duration-300 top-2 ${
//               isOpen ? "top-3.5 rotate-45" : ""
//             }`}
//           />
//           <span
//             className={`absolute block w-full h-1 bg-white rounded-full transition-all duration-300 top-3.5 ${
//               isOpen ? "opacity-0" : "opacity-100"
//             }`}
//           />
//           <span
//             className={`absolute block w-full h-1 bg-white rounded-full transition-all duration-300 top-5 ${
//               isOpen ? "top-3.5 -rotate-45" : ""
//             }`}
//           />
//         </div>
//       </button>

//       {/* Dark overlay when open on mobile */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-black/70 z-[9998] lg:hidden"
//           onClick={() => setIsOpen(false)}
//         />
//       )}

//       {/* Sidebar Container - Slides in on mobile, always visible on large screens */}
//       <div
//         className={`fixed top-0 left-0 h-full w-[280px] z-[9999] transition-transform duration-500 ease-in-out ${
//           isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
//         }`}
//       >
//         {children}
//       </div>
//     </>
//   );
// }