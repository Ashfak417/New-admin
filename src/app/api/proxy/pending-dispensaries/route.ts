// // src/app/api/proxy/pending-dispensaries/route.ts
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";

// export async function GET() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("auth_token")?.value;

//   if (!token) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
//   if (!API_BASE) {
//     return NextResponse.json({ error: "API not configured" }, { status: 500 });
//   }

//   const url = `${API_BASE}/doctors/dispensaries/admin/pending`;

//   try {
//     const res = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "X-Auth-Role": "SUPER_ADMIN", // or "ADMIN" — your backend might need it
//       },
//       cache: "no-store",
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       return NextResponse.json(data, { status: res.status });
//     }

//     return NextResponse.json(data);
//   } catch (err) {
//     return NextResponse.json({ error: "Failed to fetch pending dispensaries" }, { status: 500 });
//   }
// }