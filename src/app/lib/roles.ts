// app/lib/roles.ts
export const normalizeRole = (role?: string | null) => {
  if (!role) return null;
  const r = String(role).toUpperCase().trim();
  // Map common variants and detect substrings
  if (r.includes("SUPER")) return "SUPER_ADMIN";
  if (r.includes("ADMIN")) return "ADMIN";
  return null;
};

export const isAdminRole = (role?: string | null) => {
  const norm = normalizeRole(role);
  return norm === "ADMIN" || norm === "SUPER_ADMIN";
};
