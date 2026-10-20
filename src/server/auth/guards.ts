import { getCurrentSession, AuthenticatedUser } from "./session";
import { can, Action, ResourceContext } from "../permissions";

/**
 * Ensures a valid session exists. Throws 401 if missing.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Session required");
  }
  return session;
}

/**
 * Ensures the authenticated user belongs to an internal agency role (OWNER, MANAGER, MEMBER).
 * Rejects external CLIENT portal users.
 */
export async function requireInternalUser(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.role === "CLIENT") {
    throw new Error("FORBIDDEN: Internal agency membership required");
  }
  return user;
}

/**
 * Ensures the session is an external ClientContact (or internal user acting as agency admin).
 */
export async function requireClientAccess(targetClientId?: string): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.role === "CLIENT") {
    if (targetClientId && user.clientId !== targetClientId) {
      throw new Error("FORBIDDEN: Scoped to a different client workspace");
    }
    return user;
  }
  // Internal OWNER or MANAGER can inspect client portal
  if (user.role === "OWNER" || user.role === "MANAGER") {
    return user;
  }
  throw new Error("FORBIDDEN: Client access required");
}

/**
 * Enforces action permissions with strict tenant boundaries.
 */
export async function enforcePermission(
  action: Action,
  resource?: ResourceContext
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!can(user, action, resource)) {
    throw new Error(
      `FORBIDDEN: Cannot execute [${action}] on organization [${resource?.organizationId || user.organizationId}]`
    );
  }
  return user;
}
