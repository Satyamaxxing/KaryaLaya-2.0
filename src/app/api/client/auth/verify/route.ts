import { NextRequest, NextResponse } from "next/server";
import { ClientPortalService } from "@/server/services/client-portal";
import { SESSION_COOKIE_NAME } from "@/server/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/client/login?error=missing_token", request.url));
    }

    const { sessionToken } = await ClientPortalService.verifyMagicLink(token);

    const redirectUrl = new URL("/client", request.url);
    const response = NextResponse.redirect(redirectUrl);

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
    const message = err instanceof Error ? encodeURIComponent(err.message) : "invalid_token";
    return NextResponse.redirect(new URL(`/client/login?error=${message}`, request.url));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Magic link token is required." }, { status: 400 });
    }

    const { sessionToken, contact } = await ClientPortalService.verifyMagicLink(token);

    const response = NextResponse.json({
      success: true,
      contact,
      message: "Client authenticated successfully.",
    });

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
    const message = err instanceof Error ? err.message : "Authentication failed.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
