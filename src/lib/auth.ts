import { NextResponse } from "next/server";

/**
 * Validates the admin token from the Authorization header.
 * Returns null if valid, or a 401 NextResponse if invalid.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return NextResponse.json(
      { error: "Server not configured: ADMIN_TOKEN missing" },
      { status: 500 }
    );
  }

  if (!token || token !== adminToken) {
    return NextResponse.json(
      { error: "Unauthorized: invalid admin token" },
      { status: 401 }
    );
  }

  return null; // authorized
}
