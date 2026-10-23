import { prisma } from "../db";
import { hashPassword, verifyPassword } from "./password";
import {
  createSession,
  destroySession,
  getCurrentSession,
  AuthenticatedUser,
  PrincipalRole,
} from "./session";
import { checkRateLimit, resetRateLimit } from "./rate-limit";
import { getBaseUrl } from "./oauth";

export * from "./password";
export * from "./session";
export * from "./rate-limit";
export * from "./oauth";
export * from "./password-reset";

/**
 * Checks whether an email is already registered in the system (User or ClientContact)
 */
export async function checkEmailExists(
  email: string
): Promise<{ exists: boolean; isClient: boolean; name?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true },
  });

  if (user) {
    return { exists: true, isClient: false, name: user.name };
  }

  const contact = await prisma.clientContact.findFirst({
    where: { email: normalizedEmail },
    select: { id: true, name: true },
  });

  if (contact) {
    return { exists: true, isClient: true, name: contact.name };
  }

  return { exists: false, isClient: false };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Flow 1: Signup
 * Creates Organization + User + Membership (role: OWNER) atomically
 */
export async function signup(input: {
  agencyName: string;
  name: string;
  email: string;
  password?: string;
  ip?: string;
}): Promise<{ user: AuthenticatedUser; sessionToken: string }> {
  const email = input.email.trim().toLowerCase();
  const rateLimitKey = `signup:${input.ip || email}`;

  const { allowed } = await checkRateLimit({
    key: rateLimitKey,
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!allowed) {
    throw new Error("Too many registration attempts. Please try again in 15 minutes.");
  }

  // Check existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = input.password ? await hashPassword(input.password) : null;
  const baseSlug = slugify(input.agencyName) || "agency";
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

  // Atomic creation of Org, User, Membership, and Audit
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.agencyName.trim(),
        slug: uniqueSlug,
      },
    });

    const user = await tx.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        emailVerified: new Date(), // placeholder: verified on direct password signup
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
        metadata: JSON.stringify({ agencyName: org.name, founder: user.name }),
      },
    });

    return { org, user, membership };
  });

  const sessionToken = await createSession({
    organizationId: result.org.id,
    userId: result.user.id,
    role: "OWNER",
  });

  const authUser: AuthenticatedUser = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: "OWNER",
    organizationId: result.org.id,
    organizationName: result.org.name,
    jobTitle: result.membership.jobTitle,
  };

  return { user: authUser, sessionToken };
}

/**
 * Flow 2: Login
 * Authenticates email + password for either internal users or external client contacts
 */
export async function login(input: {
  email: string;
  password?: string;
  ip?: string;
}): Promise<{ user: AuthenticatedUser; sessionToken: string }> {
  const email = input.email.trim().toLowerCase();
  const rateLimitKey = `login:${email}:${input.ip || "local"}`;

  const { allowed } = await checkRateLimit({
    key: rateLimitKey,
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!allowed) {
    throw new Error("Too many login attempts. Please try again in 15 minutes.");
  }

  // Check 1: Internal User
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (user && user.passwordHash && input.password) {
    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    await resetRateLimit(rateLimitKey);

    const primaryMembership = user.memberships[0];
    if (!primaryMembership) {
      throw new Error("No active agency membership found for this user.");
    }

    const sessionToken = await createSession({
      organizationId: primaryMembership.organizationId,
      userId: user.id,
      role: primaryMembership.role as PrincipalRole,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: primaryMembership.role as PrincipalRole,
        organizationId: primaryMembership.organizationId,
        organizationName: primaryMembership.organization.name,
        jobTitle: primaryMembership.jobTitle,
      },
      sessionToken,
    };
  }

  // Check 2: External Client Contact
  const contact = await prisma.clientContact.findFirst({
    where: { email },
    include: {
      organization: true,
      client: true,
    },
  });

  if (contact && contact.passwordHash && input.password) {
    const isValid = await verifyPassword(input.password, contact.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    await resetRateLimit(rateLimitKey);

    const sessionToken = await createSession({
      organizationId: contact.organizationId,
      clientContactId: contact.id,
      role: "CLIENT",
    });

    return {
      user: {
        id: contact.id,
        email: contact.email,
        name: contact.name,
        role: "CLIENT",
        organizationId: contact.organizationId,
        organizationName: contact.organization.name,
        clientId: contact.clientId,
        canApprove: contact.canApprove,
        jobTitle: contact.title,
      },
      sessionToken,
    };
  }

  throw new Error("Invalid email or password.");
}

/**
 * Flow 3: Logout
 */
export async function logout(sessionToken: string): Promise<void> {
  await destroySession(sessionToken);
}

/**
 * Flow 4: Invite Team Member
 * Generates an Invitation record with a secure token link
 */
export async function inviteTeamMember(input: {
  invitedBy: AuthenticatedUser;
  email: string;
  role: "OWNER" | "MANAGER" | "MEMBER";
  jobTitle?: string;
}): Promise<{ invitationId: string; inviteUrl: string; token: string }> {
  // Authorization: Only OWNER or MANAGER can invite team members
  if (input.invitedBy.role !== "OWNER" && input.invitedBy.role !== "MANAGER") {
    throw new Error("Unauthorized: Only Owners and Managers can invite team members.");
  }

  const email = input.email.trim().toLowerCase();

  // Check if already a member of this organization
  const existingMember = await prisma.membership.findFirst({
    where: {
      organizationId: input.invitedBy.organizationId,
      user: { email },
    },
  });

  if (existingMember) {
    throw new Error("This user is already a member of your agency.");
  }

  const cryptoToken = (await import("crypto")).randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: input.invitedBy.organizationId,
      email,
      role: input.role,
      jobTitle: input.jobTitle || null,
      token: cryptoToken,
      expiresAt,
      invitedById: input.invitedBy.id,
    },
  });

  await prisma.activityEvent.create({
    data: {
      organizationId: input.invitedBy.organizationId,
      actorId: input.invitedBy.id,
      actorType: "USER",
      action: "TEAM_MEMBER_INVITED",
      entityType: "INVITATION",
      entityId: invitation.id,
      metadata: JSON.stringify({ email, role: input.role }),
    },
  });

  const baseUrl = getBaseUrl();
  const inviteUrl = `${baseUrl}/invite/${cryptoToken}`;

  return {
    invitationId: invitation.id,
    inviteUrl,
    token: cryptoToken,
  };
}

/**
 * Flow 5: Accept Invitation
 * Redeems token, creates/updates User + Membership, and returns an authenticated session
 */
export async function acceptInvite(input: {
  token: string;
  name: string;
  password?: string;
}): Promise<{ user: AuthenticatedUser; sessionToken: string }> {
  const invitation = await prisma.invitation.findUnique({
    where: { token: input.token },
    include: { organization: true },
  });

  if (!invitation) {
    throw new Error("Invitation not found or invalid.");
  }

  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    throw new Error("Invitation has expired or was already used.");
  }

  const passwordHash = input.password ? await hashPassword(input.password) : null;

  const result = await prisma.$transaction(async (tx) => {
    // Find or create user by invitation email
    let user = await tx.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          email: invitation.email,
          name: input.name.trim(),
          passwordHash,
          emailVerified: new Date(),
        },
      });
    }

    // Create Membership in inviting organization
    const membership = await tx.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: user.id,
        },
      },
      create: {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
        jobTitle: invitation.jobTitle,
      },
      update: {
        role: invitation.role,
        jobTitle: invitation.jobTitle,
      },
    });

    // Mark invitation accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    await tx.activityEvent.create({
      data: {
        organizationId: invitation.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "INVITATION_ACCEPTED",
        entityType: "MEMBERSHIP",
        entityId: membership.id,
        metadata: JSON.stringify({ email: user.email, role: invitation.role }),
      },
    });

    return { user, membership, org: invitation.organization };
  });

  const sessionToken = await createSession({
    organizationId: result.org.id,
    userId: result.user.id,
    role: result.membership.role as PrincipalRole,
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.membership.role as PrincipalRole,
      organizationId: result.org.id,
      organizationName: result.org.name,
      jobTitle: result.membership.jobTitle,
    },
    sessionToken,
  };
}
