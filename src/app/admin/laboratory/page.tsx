// app/admin/laboratory/page.tsx
// SERVER COMPONENT - no "use client" here

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LaboratoryClient from "./LaboratoryClient";

export default async function LaboratoryPage() {
  const cookieStore = cookies();
  const token = (await cookieStore).get("adminToken")?.value; // matches your lib/auth.ts cookie name

  // No token → redirect to login (server-side, secure, no flash of content)
  if (!token) {
    redirect("/admin/login");
  }

  // Token exists → render client component
  return <LaboratoryClient />;
}