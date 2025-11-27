// app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const PUBLIC_LOGIN_ROUTE = "/admin/login";

export default function AdminLayout({ children }: LayoutWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const isLoginPage = pathname === PUBLIC_LOGIN_ROUTE;

  useEffect(() => {
    if (!isAuthReady) {
      const loggedIn = localStorage.getItem("loggedIn") === "true";
      setIsAuthenticated(loggedIn);
      setIsAuthReady(true);
    }

    if (isAuthReady) {
      const isProtectedRoute = !isLoginPage;

      if (isProtectedRoute && !isAuthenticated) {
        console.log("Redirecting to login: Not Authenticated");
        router.replace(PUBLIC_LOGIN_ROUTE);
        return;
      }

      if (isLoginPage && isAuthenticated) {
        console.log("Redirecting to dashboard: Already Logged In");
        router.replace("/admin/dashboard");
      }
    }
  }, [pathname, router, isAuthReady, isAuthenticated, isLoginPage]);

  if (!isAuthReady) {
    return (
      <div style={{ padding: "20px", textAlign: "center", marginTop: "50px" }}>
        Loading...
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main
          style={{ flexGrow: 1, padding: "20px", backgroundColor: "#ecf0f1" }}
        >
          {children}
        </main>
      </div>
    );
  }

  return null;
}
