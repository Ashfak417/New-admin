
// // Admin-panel22\src\app\api\auth\login\route.ts

// import { NextResponse } from "next/server";



// export async function POST(request: Request) {
//   const { username, password } = await request.json();

//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

//   if (!API_BASE) {
//     return NextResponse.json(
//       { message: "API base URL not configured" },
//       { status: 500 }
//     );
//   }

//   const res = await fetch(`${API_BASE}/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username, password }),
//   });

//   const text = await res.text();

//   let message = text;
//   try {
//     const json = JSON.parse(text);
//     message = json.message || text;
//   } catch {}

//   if (res.ok) {
//     return NextResponse.json({ success: true, message: "OTP sent" });
//   }

//   return NextResponse.json({ message }, { status: res.status });
// }
