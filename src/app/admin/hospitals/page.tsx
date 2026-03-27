// app/admin/hospitals/page.tsx
// This is a SERVER COMPONENT — NO "use client" here!

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HospitalsClient from "./HospitalsClient";

export default async function HospitalsPage() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("adminToken")?.value; // ← matches your lib/auth.ts cookie name

  // If no valid token → instantly redirect to login (secure, no flash)
  if (!token) {
    redirect("/admin/login");
  }

  // If authenticated → render the client-side UI & logic
  return <HospitalsClient />;
}