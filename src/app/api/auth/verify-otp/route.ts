// // app/api/auth/verify-otp/route.ts
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";

// export async function POST(request: Request) {
//   const body = await request.json();
//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

//   if (!API_BASE) {
//     return NextResponse.json(
//       { message: "API base URL not configured" },
//       { status: 500 }
//     );
//   }

//   const res = await fetch(`${API_BASE}/auth/verify-otp`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });

//   const data = await res.json();

//   if (!res.ok) {
//     return NextResponse.json(data, { status: res.status });
//   }

//   // Adjust this based on your actual backend response structure
//   const token = data?.data || data?.token || data?.accessToken;

//   if (!token) {
//     return NextResponse.json(
//       { message: "No authentication token received from backend" },
//       { status: 401 }
//     );
//   }

//   // Set secure HttpOnly cookie
//   (await
//     // Set secure HttpOnly cookie
//     cookies()).set({
//     name: "auth_token",
//     value: token,
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "strict",
//     path: "/",
//     maxAge: 60 * 60 * 24 * 7, // 7 days — adjust to match your token expiry
//   });

//   return NextResponse.json({
//     success: true,
//     message: "Login successful",
//   });
// }