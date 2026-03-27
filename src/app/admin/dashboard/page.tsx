"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Stethoscope,
  Microscope,
  ArrowRight,
  Building2,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

export default function DashboardPage() {
  const [data, setData] = useState({
    usersCount: 0,
    doctorsCount: 0,
    labsCount: 0,
    hospitalsCount: 0,
  });

  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    const fetchCounts = async () => {
      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const usersRes = await fetch(`${API_BASE}/auth/super/patients?page=0&size=1`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        let usersCount = 0;
        if (usersRes.ok) {
          const result = await usersRes.json();
          usersCount = result?.data?.totalElements ?? result?.totalElements ?? 0;
        }

        const doctorsRes = await fetch(`${API_BASE}/doctors/internal/all/doctors?page=0&size=1`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        let doctorsCount = 0;
        if (doctorsRes.ok) {
          const result = await doctorsRes.json();
          doctorsCount = result?.data?.totalElements ?? result?.totalElements ?? 0;
        }

        const labsRes = await fetch(`${API_BASE}/laboratories/all?page=0&size=1`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        let labsCount = 0;
        if (labsRes.ok) {
          const result = await labsRes.json();
          labsCount = result?.data?.totalElements ?? result?.totalElements ?? 0;
        }

        const hospitalsRes = await fetch(`${API_BASE}/hospitals/internal/all?page=0&size=1`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        let hospitalsCount = 0;
        if (hospitalsRes.ok) {
          const result = await hospitalsRes.json();
          hospitalsCount = result?.data?.totalElements ?? result?.totalElements ?? 0;
        }

        setData({ usersCount, doctorsCount, labsCount, hospitalsCount });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // ── Smooth animated counter ─────────────────────────────────────
  const AnimatedNumber = ({ value }: { value: number }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
      if (value === 0) return setDisplay(0);

      let start = 0;
      const duration = 1200;
      const increment = value / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setDisplay(value);
          clearInterval(timer);
        } else {
          setDisplay(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [value]);

    return <>{display}</>;
  };

  const stats = [
    {
      title: "Total Patients",
      value: data.usersCount,
      icon: Users,
      change: "+12% from last month.",
      color: "#325E8F",
      link: "/admin/users",
    },
    {
      title: "Available Doctors",
      value: data.doctorsCount,
      icon: Stethoscope,
      change: "3 on leave today..",
      color: "#325E8F",
      link: "/admin/doctors",
    },
    {
      title: "Laboratories",
      value: data.labsCount,
      subtitle: "Tests Today",
      icon: Microscope,
      change: "12 results pending.",
      color: "#325E8F",
      link: "/admin/laboratory",
    },
    {
      title: "Hospital Network",
      value: data.hospitalsCount,
      subtitle: "Trusted Branches",
      icon: Building2,
      change: "Active & Verified",
      color: "#325E8F",
      link: "/admin/hospitals",
    },
  ];


  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "17px" }}>
          Welcome back! Here's your overview for today.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "28px",
        }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "32px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
                border: "1px solid #f1f5f9",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-12px) scale(1.015)";
                e.currentTarget.style.boxShadow = "0 30px 60px rgba(50,94,143,0.18), 0 0 0 1px rgba(50,94,143,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)";
              }}
            >
              {/* Top accent bar - now matches stat color */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "6px",
                  background: stat.color,
                }}
              />

              {/* View All link */}
              <Link
                href={stat.link}
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  padding: "12px 20px",
                  background: "rgba(50, 94, 143, 0.1)",
                  color: "#325E8F",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                  transition: "all 0.35s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#325E8F";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(50, 94, 143, 0.1)";
                  e.currentTarget.style.color = "#325E8F";
                }}
              >
                View All <ArrowRight size={18} />
              </Link>

              <div style={{ paddingTop: "20px" }}>
                <p style={{ color: "#64748b", fontSize: "15px", fontWeight: 600, margin: "0 0 16px 0" }}>
                  {stat.title}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "48px", fontWeight: "800", color: "#1e293b" }}>
                      <AnimatedNumber value={stat.value} />
                    </div>
                    {stat.subtitle && (
                      <p style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "14px" }}>
                        {stat.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Icon with refined background */}
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      background: "rgba(50,94,143,0.06)",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(50,94,143,0.12)",
                    }}
                  >
                    <Icon size={40} style={{ color: "#325E8F" }} strokeWidth={2.1} />
                  </div>
                </div>

                <p style={{ color: stat.color, fontSize: "14px", fontWeight: "700", margin: 0 }}>
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}