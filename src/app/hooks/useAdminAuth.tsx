// app/hooks/useAdminAuth.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "@/app/lib/cookies";

export function useAdminAuth(redirectTo = "/admin/login") {
  const router = useRouter();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace(redirectTo);
    }
  }, [router]);

  return isAdminAuthenticated();
}