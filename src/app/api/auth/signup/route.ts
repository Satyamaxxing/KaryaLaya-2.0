import { NextResponse } from "next/server";
import { signup, SESSION_COOKIE_NAME } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agencyName, name, email, password } = body;

    if (!agencyName || !name || !email || !password) {
      return NextResponse.json(
        { error: "Agency name, user name, email, and password are required." },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const { user, sessionToken } = await signup({ agencyName, name, email, password, ip });

    const response = NextResponse.json({ success: true, user });

    // Set secure httpOnly session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
