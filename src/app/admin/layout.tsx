// app/admin/layout.tsx
"use client";

import { ReactNode } from "react";
import Sidebar from "../components/Sidebar";   // ← adjust path if needed
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // No sidebar/layout wrapper on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="admin-layout-wrapper">
      <Sidebar />

      <main className="admin-main-content">
        <div className="admin-content-container">
          {children}
        </div>
      </main>

      {/* ─── Global responsive styles ─── */}
      <style jsx global>{`
        .admin-layout-wrapper {
          min-height: 100vh;
          display: flex;
          background: #f8fafc;
        }
          .admin-main-content {
  transition: margin-left 0.35s ease, padding-top 0.35s ease;
}
  @media (max-width: 767px) {
  .admin-main-content {
    padding-top: 90px;   /* a bit more breathing room for hamburger */
  }
}

.mobile-hamburger {
  transition: background 0.25s;
}

.mobile-hamburger svg {
  transition: color 0.25s;
}

.mobile-hamburger[aria-expanded="true"] {
  background: #325E8F;
}

.mobile-hamburger[aria-expanded="true"] svg {
  color: white !important;
}

        .admin-main-content {
          flex: 1;
          padding: 24px 20px;
          padding-top: 80px;           /* space for mobile hamburger */
          box-sizing: border-box;
        }

        .admin-content-container {
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }

        /* ─── Desktop ─── */
        @media (min-width: 768px) {
          .admin-main-content {
            margin-left: 280px;
            padding-top: 32px;
            padding-left: 32px;
            padding-right: 32px;
          }
        }

        /* ─── Very small phones ─── */
        @media (max-width: 480px) {
          .admin-main-content {
            padding: 24px 16px;
            padding-top: 80px;
          }
        }
      `}</style>
    </div>
  );
}