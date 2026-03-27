// src/lib/config.ts
const apiBase = process.env.NEXT_PUBLIC_API_BASE;

if (!apiBase) {
  console.warn("⚠️ NEXT_PUBLIC_API_BASE not found in .env.local — using fallback URL");
}

export const API_BASE = apiBase || "http://localhost:8080";