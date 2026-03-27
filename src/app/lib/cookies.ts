// // app/lib/cookies.ts
// "use client";

// import Cookies from "js-cookie";

// /**
//  * Get cookie value safely
//  */
// export const getCookie = (name: string): string | null => {
//   return Cookies.get(name) || null;
// };

// /**
//  * Check if admin is logged in using readable cookies
//  * (admin_role and admin_name are set with httpOnly: false in your verify-otp route)
//  */
// export const isAdminAuthenticated = (): boolean => {
//   const role = getCookie("admin_role");
//   const name = getCookie("admin_name");
//   return !!(role && name);
// };

// /**
//  * Get admin info (name, role, email)
//  */
// export const getAdminInfo = () => {
//   return {
//     role: getCookie("admin_role") || "",
//     name: getCookie("admin_name") || "Admin",
//     email: getCookie("admin_email") || "",
//   };
// };

// /**
//  * Logout: clear all admin cookies
//  */
// export const logoutAdmin = () => {
//   Cookies.remove("admin_token");
//   Cookies.remove("admin_role");
//   Cookies.remove("admin_name");
//   Cookies.remove("admin_email");
//   window.location.href = "/admin/login";
// };