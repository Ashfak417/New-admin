"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  // Updated to use "loggedIn" key as per your provided code
  const logout = () => {
    localStorage.removeItem("loggedIn");
    router.replace("/admin/login");
  };

  const sidebarStyle: React.CSSProperties = {
    width: "250px",
    backgroundColor: "#2c3e50",
    color: "white",
    padding: "20px",
    minHeight: "100vh",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
    // CRITICAL: Make the sidebar fixed
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 20, // Ensure it stays above other content
    boxSizing: "border-box", // Include padding in the width calculation
  };

  const linkStyle: React.CSSProperties = {
    display: "block",
    padding: "10px 10px", // Added horizontal padding for better spacing
    color: "white",
    textDecoration: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "8px", // Space between links
    transition: "background-color 0.2s, padding-left 0.2s",
  };

  const linkHoverStyle: React.CSSProperties = {
    backgroundColor: "#34495e",
    paddingLeft: "15px", // Subtle hover effect
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 15px",
    background: "#e74c3c", // Red logout button
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    width: "100%", // Full width button
    textAlign: "center",
    marginTop: "30px",
    fontWeight: "600",
    transition: "background-color 0.2s",
  };

  return (
    <div style={sidebarStyle}>
      <h3
        style={{
          marginBottom: "30px",
          borderBottom: "2px solid #34495e",
          paddingBottom: "10px",
          textAlign: "center",
        }}
      >
        Admin Panel
      </h3>
      <nav>
        {/* Dashboard Link */}
        <Link
          href="/admin/dashboard"
          style={linkStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              linkHoverStyle.backgroundColor;
            e.currentTarget.style.paddingLeft = linkHoverStyle.paddingLeft;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "";
            e.currentTarget.style.paddingLeft = "10px";
          }}
        >
          Dashboard 🏠
        </Link>

        {/* Doctors Link */}
        <Link
          href="/admin/doctors"
          style={linkStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              linkHoverStyle.backgroundColor;
            e.currentTarget.style.paddingLeft = linkHoverStyle.paddingLeft;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "";
            e.currentTarget.style.paddingLeft = "10px";
          }}
        >
          Doctors 🧑‍⚕️
        </Link>

        {/* Settings Link */}
        <Link
          href="/admin/settings"
          style={linkStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              linkHoverStyle.backgroundColor;
            e.currentTarget.style.paddingLeft = linkHoverStyle.paddingLeft;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "";
            e.currentTarget.style.paddingLeft = "10px";
          }}
        >
          Settings ⚙️
        </Link>
      </nav>

      {/* Logout Button */}
      <button
        style={buttonStyle}
        onClick={logout}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#c0392b")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#e74c3c")
        }
      >
        Logout 🚪
      </button>
    </div>
  );
}
