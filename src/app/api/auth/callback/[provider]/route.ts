import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeGoogleCode,
  exchangeGitHubCode,
  handleOAuthUser,
  SESSION_COOKIE_NAME,
  getBaseUrl,
} from "@/server/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const baseUrl = getBaseUrl(request);

  if (error) {
    const errorDescription =
      url.searchParams.get("error_description") || "OAuth authorization failed.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription)}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=missing_oauth_code_or_state", baseUrl)
    );
  }

  const cookieStore = await cookies();
  const stateCookieName = `karyalaya_oauth_state_${provider}`;
  const storedStateRaw = cookieStore.get(stateCookieName)?.value;

  if (!storedStateRaw) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_state_expired", baseUrl)
    );
  }

  let storedState: { state: string; next?: string };
  try {
    storedState = JSON.parse(storedStateRaw);
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=invalid_oauth_state", baseUrl)
    );
  }

  if (storedState.state !== state) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_state_mismatch", baseUrl)
    );
  }

  const destination =
    storedState.next && storedState.next.startsWith("/") && !storedState.next.startsWith("//")
      ? storedState.next
      : "/app/dashboard";

  try {
    let email: string;
    let name: string;

    if (provider === "google") {
      const redirectUri = `${baseUrl}/api/auth/callback/google`;
      const profile = await exchangeGoogleCode(code, redirectUri);
      email = profile.email;
      name = profile.name;
    } else if (provider === "github") {
      const redirectUri = `${baseUrl}/api/auth/callback/github`;
      const profile = await exchangeGitHubCode(code, redirectUri);
      email = profile.email;
      name = profile.name;
    } else {
      return NextResponse.redirect(
        new URL(`/login?error=unsupported_provider_${provider}`, baseUrl)
      );
    }

    const { sessionToken } = await handleOAuthUser({
      email,
      name,
      provider: provider as "google" | "github",
    });

    const response = NextResponse.redirect(new URL(destination, baseUrl));

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

    // Clear OAuth state cookie
    response.cookies.delete(stateCookieName);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OAuth authentication failed.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, baseUrl)
    );
  }
}
