// src/app/api/auth/logout/route.ts
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("API LOGOUT: /api/auth/logout invoked by client");
  // In the "login each time" model without server-side session cookies,
  // the main logout action is clearing client-side state (e.g., in AuthContext).
  // This endpoint primarily acknowledges the client's logout.
  return NextResponse.json(
    { success: true, message: 'Logout acknowledged by server. Client handles session clear.' },
    { status: 200 }
  );
}

// Optional: Allow GET if some parts of your app trigger logout via GET
export async function GET(request: NextRequest) {
    return POST(request);
}