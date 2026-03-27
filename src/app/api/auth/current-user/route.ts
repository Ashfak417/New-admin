// // src/app/api/auth/current-user/route.ts
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";

// function decodeJWT(token: string) {
//   try {
//     const payload = token.split(".")[1];
//     const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
//     return decoded;
//   } catch {
//     return null;
//   }
// }

// export async function GET() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("auth_token")?.value;

//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
//   if (!API_BASE) {
//     return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
//   }

//   // Get role from backend if possible
//   let backendRole = "ADMIN";
//   try {
//     const roleRes = await fetch(`${API_BASE}/role`, {
//       headers: { Authorization: `Bearer ${token}` },
//       cache: "no-store",
//     });

//     if (roleRes.ok) {
//       const roleData = await roleRes.json();
//       if (roleData.role) backendRole = roleData.role.toUpperCase();
//     }
//   } catch {}

//   // Decode JWT – this contains phone & id (from your login JWT generation)
//   const payload = decodeJWT(token);

//   const name = payload?.name || payload?.fullName || payload?.email || payload?.sub || "Admin";
//   const roleFromJwt = payload?.role || payload?.userRole || payload?.type;
//   const finalRole = backendRole !== "ADMIN" ? backendRole : (roleFromJwt?.toUpperCase() || "ADMIN");

//   // Extract phone and user ID from JWT payload
//   // Adjust field names if your JWT uses different keys (check Postman login response)
//   const phone = payload?.phoneNumber || payload?.phone || payload?.mobile || payload?.contact || "";
//   const userId = payload?.id || payload?.userId || payload?.sub || payload?.user_id || "";

//   return NextResponse.json({
//     name,
//     role: finalRole,
//     phone,      // now included
//     userId      // now included
//   });
// }