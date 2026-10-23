import { prisma } from "../db";
import { createSession, AuthenticatedUser, PrincipalRole } from "./session";
import crypto from "crypto";

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function generateOAuthState(): string {
  return crypto.randomBytes(24).toString("hex");
}

export const PRODUCTION_APP_URL = "https://karyalaya20.vercel.app";

/**
 * Resolves the canonical base URL dynamically:
 * - In production (Vercel deployment or NODE_ENV === 'production'):
 *   1. Uses incoming request host if it is a live host (e.g. karyalaya20.vercel.app or custom domain)
 *   2. Uses NEXT_PUBLIC_APP_URL if explicitly set to a non-localhost URL
 *   3. Uses Vercel production system variables (VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL)
 *   4. Always falls back to https://karyalaya20.vercel.app (never localhost)
 * - In local development:
 *   Preserves http://localhost:3000 or the local request host.
 */
export function getBaseUrl(request?: Request): string {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const isProduction = process.env.NODE_ENV === "production" || isVercel;

  // 1. In Local Development: preserve localhost / 127.0.0.1
  if (!isProduction) {
    if (request) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const host = forwardedHost || request.headers.get("host");
      if (host) {
        const proto = request.headers.get("x-forwarded-proto") || "http";
        return `${proto}://${host}`.replace(/\/+$/, "");
      }
      try {
        const url = new URL(request.url);
        if (url.origin && url.origin !== "null") {
          return url.origin.replace(/\/+$/, "");
        }
      } catch {}
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, "");
    }

    return "http://localhost:3000";
  }

  // 2. In Production (Vercel / live deployment):
  // Inspect incoming request headers
  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost || request.headers.get("host");
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      const proto = request.headers.get("x-forwarded-proto") || "https";
      return `${proto}://${host}`.replace(/\/+$/, "");
    }

    try {
      const url = new URL(request.url);
      if (
        url.origin &&
        url.origin !== "null" &&
        !url.hostname.includes("localhost") &&
        !url.hostname.includes("127.0.0.1")
      ) {
        return url.origin.replace(/\/+$/, "");
      }
    } catch {}
  }

  // Check NEXT_PUBLIC_APP_URL if explicitly configured with a production domain
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, "");
    if (!envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
  }

  // Check Vercel system variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, "")}`;
  }
  if (process.env.VERCEL_URL && !process.env.VERCEL_URL.includes("localhost")) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }

  // Guaranteed fallback for production: never use localhost
  return PRODUCTION_APP_URL;
}

export function getGoogleOAuthUrl(state: string, redirectUri: string): string {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${rootUrl}?${params.toString()}`;
}

export function getGitHubOAuthUrl(state: string, redirectUri: string): string {
  const rootUrl = "https://github.com/login/oauth/authorize";
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || "",
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });
  return `${rootUrl}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{ email: string; name: string; picture?: string }> {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoRes.ok) {
    throw new Error("Failed to fetch Google user profile.");
  }

  const userInfo = await userinfoRes.json();
  if (!userInfo.email) {
    throw new Error("Google account did not return a valid email address.");
  }

  return {
    email: userInfo.email,
    name: userInfo.name || userInfo.email.split("@")[0],
    picture: userInfo.picture,
  };
}

export async function exchangeGitHubCode(
  code: string,
  redirectUri: string
): Promise<{ email: string; name: string; avatarUrl?: string }> {
  const tokenUrl = "https://github.com/login/oauth/access_token";
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      client_secret: process.env.GITHUB_CLIENT_SECRET || "",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("GitHub token exchange failed.");
  }

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    throw new Error(`GitHub token error: ${tokenData.error_description || tokenData.error}`);
  }

  const accessToken = tokenData.access_token;

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "KaryaLaya-Auth",
    },
  });

  if (!userRes.ok) {
    throw new Error("Failed to fetch GitHub user profile.");
  }

  const userData = await userRes.json();
  let email = userData.email;

  // If email is private in GitHub profile, fetch from /user/emails
  if (!email) {
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "KaryaLaya-Auth",
      },
    });

    if (emailRes.ok) {
      const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
        await emailRes.json();
      const primaryEmail = emails.find((e) => e.primary && e.verified) || emails[0];
      if (primaryEmail) {
        email = primaryEmail.email;
      }
    }
  }

  if (!email) {
    throw new Error("GitHub account does not have a verified public or primary email address.");
  }

  return {
    email,
    name: userData.name || userData.login || email.split("@")[0],
    avatarUrl: userData.avatar_url,
  };
}

export async function handleOAuthUser(input: {
  email: string;
  name?: string;
  provider: "google" | "github";
}): Promise<{ user: AuthenticatedUser; sessionToken: string }> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.name?.trim() || email.split("@")[0] || "Agency Member";

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!existingUser) {
    // Brand new user via OAuth: atomically create Org, User, Membership as OWNER
    const baseSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "agency";
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    const orgName = `${displayName}'s Agency`;

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: uniqueSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          name: displayName,
          email,
          passwordHash: null,
          emailVerified: new Date(),
        },
      });

      const membership = await tx.membership.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: "OWNER",
          jobTitle: "Founder & Head of Agency",
        },
      });

      await tx.activityEvent.create({
        data: {
          organizationId: org.id,
          actorId: user.id,
          actorType: "USER",
          action: "ORGANIZATION_CREATED",
          entityType: "ORGANIZATION",
          entityId: org.id,
          metadata: JSON.stringify({ agencyName: org.name, provider: input.provider }),
        },
      });

      return { org, user, membership };
    });

    const sessionToken = await createSession({
      organizationId: result.org.id,
      userId: result.user.id,
      role: "OWNER",
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: "OWNER",
        organizationId: result.org.id,
        organizationName: result.org.name,
        jobTitle: result.membership.jobTitle,
      },
      sessionToken,
    };
  }

  // User exists - find or link to primary membership
  let primaryMembership = existingUser.memberships[0];

  if (!primaryMembership) {
    const baseSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "agency";
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    const org = await prisma.organization.create({
      data: {
        name: `${displayName}'s Agency`,
        slug: uniqueSlug,
      },
    });

    primaryMembership = await prisma.membership.create({
      data: {
        organizationId: org.id,
        userId: existingUser.id,
        role: "OWNER",
        jobTitle: "Founder & Head of Agency",
      },
      include: {
        organization: true,
      },
    });
  }

  const sessionToken = await createSession({
    organizationId: primaryMembership.organizationId,
    userId: existingUser.id,
    role: primaryMembership.role as PrincipalRole,
  });

  return {
    user: {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: primaryMembership.role as PrincipalRole,
      organizationId: primaryMembership.organizationId,
      organizationName: primaryMembership.organization.name,
      jobTitle: primaryMembership.jobTitle,
    },
    sessionToken,
  };
}
