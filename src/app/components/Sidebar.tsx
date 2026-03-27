// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  CircleUser,
  LogOut,
  Stethoscope,
  Building2,
  Menu,
  X,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAuthName, getAuthRole, logout } from "@/lib/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState<string>("Admin");
  const [adminRole, setAdminRole] = useState<string>("ADMIN");
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const name = getAuthName();
    const role = getAuthRole();

    if (name && role && role !== "guest") {
      setAdminName(name);
      setAdminRole(role);
    } else {
      window.location.href = "/admin/login";
    }
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const menu = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(adminRole === "SUPER_ADMIN"
      ? [{ href: "/admin/manage-admins", icon: Users, label: "Manage Admins" }]
      : []),
    { href: "/admin/users", icon: Users, label: "Patients" },
    { href: "/admin/doctors", icon: Stethoscope, label: "Doctors" },
    { href: "/admin/hospitals", icon: Building2, label: "Hospitals" },
    { href: "/admin/laboratory", icon: FileText, label: "Laboratory" },
    { href: "/admin/profile", icon: CircleUser, label: "Profile" },
  ];

  const sidebarInner = (
    <>
      {/* ── User Profile Section ────────────────────────────────────── */}
      <div className="user-profile-section">
        <div className="avatar-container">
          <div className="avatar">
            <User size={36} />
          </div>
        </div>

        <div className="user-info">
          <div className="user-name">{adminName}</div>
          <div className="user-role-badge">
            <span className="status-dot" />
            {adminRole === "SUPER_ADMIN" ? "Super Admin" : adminRole}
          </div>
        </div>
      </div>

      {/* Admin Panel title (optional - can be removed if you prefer only profile) */}
      <div style={{ textAlign: "center", margin: "24px 0 32px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "bold", margin: 0 }}>Admin Panel</h2>
      </div>

      <nav style={{ flex: 1 }}>
        {menu.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`sidebar-link ${active ? "active" : ""}`}>
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingBottom: "24px" }}>
        <button onClick={() => setShowLogoutModal(true)} className="logout-btn">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="mobile-hamburger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        style={{
          background: isOpen ? "#325E8F" : "white",
          color: isOpen ? "white" : "#325E8F",
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">{sidebarInner}</aside>

      {/* Mobile Sidebar */}
      <aside className={`mobile-sidebar ${isOpen ? "open" : ""}`}>{sidebarInner}</aside>

      {/* Mobile Overlay */}
      {isOpen && <div className="mobile-overlay" onClick={() => setIsOpen(false)} />}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-backdrop" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Log out?</h3>
            <p>You will be signed out of your account.</p>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() => {
                  logout();
                  setShowLogoutModal(false);
                }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx global>{`
        .user-profile-section {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }

        .avatar-container {
          flex-shrink: 0;
        }

        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.25);
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 17px;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #d1fae5;
          margin-top: 4px;
        }

        .status-dot {
          width: 9px;
          height: 9px;
          background: #16a34a;
          border-radius: 50%;
          box-shadow: 0 0 8px #16a34a80;
          animation: pulse 2s infinite;
        }

        .mobile-hamburger {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 10002;
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 12px;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.25s, color 0.25s;
        }

        .desktop-sidebar {
          width: 280px;
          background: linear-gradient(135deg, #325e8f 0%, #1e3a5f 100%);
          color: white;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          padding: 32px 20px;
          box-shadow: 4px 0 25px rgba(0, 0, 0, 0.25);
          display: none;
          flex-direction: column;
        }

        .mobile-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: linear-gradient(135deg, #325e8f 0%, #1e3a5f 100%);
          color: white;
          z-index: 10001;
          padding: 32px 20px;
          box-shadow: 6px 0 30px rgba(0, 0, 0, 0.4);
          transform: translateX(-100%);
          transition: transform 0.32s ease-out;
          display: flex;
          flex-direction: column;
        }

        .mobile-sidebar.open {
          transform: translateX(0);
        }

        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 10000;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 20px;
          margin: 4px 0;
          border-radius: 10px;
          color: white;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .sidebar-link.active {
          background: rgba(255, 255, 255, 0.3);
          font-weight: 600;
        }

        .logout-btn {
          width: 100%;
          padding: 12px 20px;
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.35);
        }

        .logout-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
        }

        .logout-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 400px;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 28px;
        }

        .cancel-btn,
        .confirm-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn {
          background: #f1f5f9;
          color: #475569;
        }

        .confirm-btn {
          background: #ef4444;
          color: white;
        }

        @media (max-width: 767px) {
          .mobile-hamburger {
            display: flex;
          }
          .desktop-sidebar {
            display: none;
          }
          .mobile-sidebar {
            display: flex;
          }
        }

        @media (min-width: 768px) {
          .mobile-hamburger {
            display: none;
          }
          .desktop-sidebar {
            display: flex;
          }
          .mobile-sidebar,
          .mobile-overlay {
            display: none !important;
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.6);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(22, 163, 74, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
          }
        }
      `}</style>
    </>
  );
}