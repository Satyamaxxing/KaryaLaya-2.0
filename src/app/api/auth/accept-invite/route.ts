import { NextResponse } from "next/server";
import { acceptInvite, SESSION_COOKIE_NAME } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name) {
      return NextResponse.json({ error: "Token and name are required." }, { status: 400 });
    }

    const { user, sessionToken } = await acceptInvite({ token, name, password });

    const response = NextResponse.json({ success: true, user });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to accept invitation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
