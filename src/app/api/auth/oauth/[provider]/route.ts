import { NextResponse } from "next/server";
import {
  isGoogleOAuthConfigured,
  isGitHubOAuthConfigured,
  generateOAuthState,
  getGoogleOAuthUrl,
  getGitHubOAuthUrl,
  getBaseUrl,
} from "@/server/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/app";
  const baseUrl = getBaseUrl(request);

  if (provider === "google") {
    if (!isGoogleOAuthConfigured()) {
      // Check if client expects JSON
      if (request.headers.get("accept")?.includes("application/json")) {
        return NextResponse.json(
          {
            configured: false,
            error: "GOOGLE_NOT_CONFIGURED",
            message:
              "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.",
          },
          { status: 400 }
        );
      }
      return NextResponse.redirect(
        new URL(
          `/login?error=google_not_configured&next=${encodeURIComponent(next)}`,
          baseUrl
        )
      );
    }

    const state = generateOAuthState();
    const redirectUri = `${baseUrl}/api/auth/callback/google`;
    const authUrl = getGoogleOAuthUrl(state, redirectUri);

    if (request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ configured: true, url: authUrl });
    }

    const response = NextResponse.redirect(authUrl);
    response.cookies.set({
      name: "karyalaya_oauth_state_google",
      value: JSON.stringify({ state, next }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });
    return response;
  }

  if (provider === "github") {
    if (!isGitHubOAuthConfigured()) {
      if (request.headers.get("accept")?.includes("application/json")) {
        return NextResponse.json(
          {
            configured: false,
            error: "GITHUB_NOT_CONFIGURED",
            message:
              "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file.",
          },
          { status: 400 }
        );
      }
      return NextResponse.redirect(
        new URL(
          `/login?error=github_not_configured&next=${encodeURIComponent(next)}`,
          baseUrl
        )
      );
    }

    const state = generateOAuthState();
    const redirectUri = `${baseUrl}/api/auth/callback/github`;
    const authUrl = getGitHubOAuthUrl(state, redirectUri);

    if (request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ configured: true, url: authUrl });
    }

    const response = NextResponse.redirect(authUrl);
    response.cookies.set({
      name: "karyalaya_oauth_state_github",
      value: JSON.stringify({ state, next }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });
    return response;
  }

  return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
}
