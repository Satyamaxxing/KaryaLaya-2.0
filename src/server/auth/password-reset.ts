import crypto from "crypto";
import { prisma } from "../db";
import { hashPassword } from "./password";
import { checkRateLimit } from "./rate-limit";

const RESET_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "karyalaya_secure_auth_password_reset_secret_default_key";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface ResetPayload {
  email: string;
  type: "user" | "client";
  expiresAt: number;
  nonce: string;
}

function signPayload(payload: ResetPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", RESET_SECRET).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

export function verifyResetToken(token: string): ResetPayload | null {
  try {
    const [data, hmac] = token.split(".");
    if (!data || !hmac) return null;

    const expectedHmac = crypto.createHmac("sha256", RESET_SECRET).update(data).digest("base64url");
    if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac)) === false) {
      return null;
    }

    const payload: ResetPayload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function requestPasswordReset(input: {
  email: string;
  ip?: string;
}): Promise<{ success: boolean; message: string; resetToken?: string }> {
  const email = input.email.trim().toLowerCase();
  const rateLimitKey = `pwreset:${email}:${input.ip || "local"}`;

  const { allowed } = await checkRateLimit({
    key: rateLimitKey,
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000,
  });

  if (!allowed) {
    throw new Error("Too many password reset requests. Please try again in 15 minutes.");
  }

  // Check 1: User
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    const payload: ResetPayload = {
      email,
      type: "user",
      expiresAt: Date.now() + TOKEN_EXPIRY_MS,
      nonce: crypto.randomBytes(8).toString("hex"),
    };
    const resetToken = signPayload(payload);

    return {
      success: true,
      message: `Password reset instructions generated for ${email}.`,
      resetToken,
    };
  }

  // Check 2: Client Contact
  const contact = await prisma.clientContact.findFirst({
    where: { email },
  });

  if (contact) {
    const payload: ResetPayload = {
      email,
      type: "client",
      expiresAt: Date.now() + TOKEN_EXPIRY_MS,
      nonce: crypto.randomBytes(8).toString("hex"),
    };
    const resetToken = signPayload(payload);

    return {
      success: true,
      message: `Password reset instructions generated for ${email}.`,
      resetToken,
    };
  }

  // Security: always return success message so as not to leak whether email is registered
  return {
    success: true,
    message: `If an account with ${email} exists, password reset instructions have been generated.`,
  };
}

export async function resetPasswordWithToken(input: {
  token: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  if (!input.newPassword || input.newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const payload = verifyResetToken(input.token);
  if (!payload) {
    throw new Error("The password reset link is invalid or has expired. Please request a new one.");
  }

  const passwordHash = await hashPassword(input.newPassword);

  if (payload.type === "user") {
    await prisma.user.update({
      where: { email: payload.email },
      data: { passwordHash },
    });
  } else {
    await prisma.clientContact.updateMany({
      where: { email: payload.email },
      data: { passwordHash },
    });
  }

  return {
    success: true,
    message: "Your password has been successfully reset. You can now log in.",
  };
}
