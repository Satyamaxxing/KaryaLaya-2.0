import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "../db";

export const SESSION_COOKIE_NAME = "karyalaya_session";
const SESSION_DURATION_DAYS = 30;

export type PrincipalRole = "OWNER" | "MANAGER" | "MEMBER" | "CLIENT";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: PrincipalRole;
  organizationId: string;
  organizationName: string;
  jobTitle?: string | null;
  clientId?: string; // Set only if role === 'CLIENT'
  canApprove?: boolean;
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export async function createSession(params: {
  organizationId: string;
  userId?: string;
  clientContactId?: string;
  role: PrincipalRole;
}): Promise<string> {
  const sessionToken = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      organizationId: params.organizationId,
      userId: params.userId,
      clientContactId: params.clientContactId,
      role: params.role,
      expiresAt,
    },
  });

  return sessionToken;
}

export async function getSessionByToken(sessionToken: string): Promise<AuthenticatedUser | null> {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      organization: true,
      user: {
        include: {
          memberships: {
            where: {
              organizationId: undefined, // updated below
            },
          },
        },
      },
      clientContact: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  // Case 1: Internal User (OWNER, MANAGER, MEMBER)
  if (session.userId && session.user) {
    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.organizationId,
          userId: session.userId,
        },
      },
    });

    if (!membership) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: membership.role as PrincipalRole,
      organizationId: session.organizationId,
      organizationName: session.organization.name,
      jobTitle: membership.jobTitle,
    };
  }

  // Case 2: External Client Contact (CLIENT)
  if (session.clientContactId && session.clientContact) {
    return {
      id: session.clientContact.id,
      email: session.clientContact.email,
      name: session.clientContact.name,
      role: "CLIENT",
      organizationId: session.organizationId,
      organizationName: session.organization.name,
      clientId: session.clientContact.clientId,
      canApprove: session.clientContact.canApprove,
      jobTitle: session.clientContact.title,
    };
  }

  return null;
}

export async function getCurrentSession(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  return getSessionByToken(sessionToken);
}

export async function destroySession(sessionToken: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { sessionToken },
  });
}
