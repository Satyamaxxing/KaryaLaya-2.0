import { AuthenticatedUser, PrincipalRole } from "../auth/session";

export type Action =
  // Agency Administration
  | "MANAGE_ORGANIZATION"
  | "VIEW_FINANCIALS"
  | "INVITE_MEMBERS"
  | "REMOVE_MEMBERS"
  | "UPDATE_MEMBER_ROLES"
  | "VIEW_AUDIT_LOGS"

  // Client Management
  | "CREATE_CLIENT"
  | "VIEW_CLIENTS"
  | "UPDATE_CLIENT"
  | "DELETE_CLIENT"

  // Projects
  | "CREATE_PROJECT"
  | "VIEW_PROJECTS"
  | "UPDATE_PROJECT"
  | "ARCHIVE_PROJECT"

  // Deliverables
  | "CREATE_DELIVERABLE"
  | "VIEW_DELIVERABLE"
  | "UPDATE_DELIVERABLE"
  | "DELETE_DELIVERABLE"
  | "APPROVE_DELIVERABLE"
  | "REQUEST_REVISION"

  // Tasks
  | "CREATE_TASK"
  | "ASSIGN_TASK"
  | "VIEW_TASKS"
  | "UPDATE_TASK_STATUS"
  | "DELETE_TASK"

  // Client Portal & Reviews
  | "VIEW_CLIENT_PORTAL"
  | "APPROVE_AS_CLIENT"
  | "SUBMIT_CLIENT_FEEDBACK"

  // Social Media Management
  | "MANAGE_SOCIAL"
  | "VIEW_SOCIAL"
  | "APPROVE_SOCIAL"

  // Calendar & Team Workload
  | "VIEW_CALENDAR"
  | "VIEW_TEAM"
  | "MANAGE_LEAVE"

  // Scoped AI Operations
  | "USE_AI"
  | "VIEW_AGENCY_SUMMARY"

  // Analytics & Automations
  | "VIEW_ANALYTICS"
  | "MANAGE_AUTOMATIONS"
  | "VIEW_AUTOMATIONS";

export interface ResourceContext {
  organizationId?: string;
  clientId?: string;
  assigneeId?: string;
  isClientVisible?: boolean;
}

/**
 * Canonical Role Permission Matrix
 * OWNER: Full administrative control over agency, finances, team, clients, and projects.
 * MANAGER: Full delivery oversight: deliverables, tasks, client collaboration.
 * MEMBER: Internal creative/technical specialist: scoped to assigned work & agency deliverables.
 * CLIENT: External partner: scoped exclusively to their organization's client-visible deliverables.
 */
type PermissionCheck = boolean | ((user: AuthenticatedUser, resource?: ResourceContext) => boolean);

const PERMISSION_MATRIX: Record<PrincipalRole, Record<Action, PermissionCheck>> = {
  OWNER: {
    MANAGE_ORGANIZATION: true,
    VIEW_FINANCIALS: true,
    INVITE_MEMBERS: true,
    REMOVE_MEMBERS: true,
    UPDATE_MEMBER_ROLES: true,
    VIEW_AUDIT_LOGS: true,

    CREATE_CLIENT: true,
    VIEW_CLIENTS: true,
    UPDATE_CLIENT: true,
    DELETE_CLIENT: true,

    CREATE_PROJECT: true,
    VIEW_PROJECTS: true,
    UPDATE_PROJECT: true,
    ARCHIVE_PROJECT: true,

    CREATE_DELIVERABLE: true,
    VIEW_DELIVERABLE: true,
    UPDATE_DELIVERABLE: true,
    DELETE_DELIVERABLE: true,
    APPROVE_DELIVERABLE: true,
    REQUEST_REVISION: true,

    CREATE_TASK: true,
    ASSIGN_TASK: true,
    VIEW_TASKS: true,
    UPDATE_TASK_STATUS: true,
    DELETE_TASK: true,

    VIEW_CLIENT_PORTAL: true,
    APPROVE_AS_CLIENT: true,
    SUBMIT_CLIENT_FEEDBACK: true,

    MANAGE_SOCIAL: true,
    VIEW_SOCIAL: true,
    APPROVE_SOCIAL: true,

    VIEW_CALENDAR: true,
    VIEW_TEAM: true,
    MANAGE_LEAVE: true,

    USE_AI: true,
    VIEW_AGENCY_SUMMARY: true,

    VIEW_ANALYTICS: true,
    MANAGE_AUTOMATIONS: true,
    VIEW_AUTOMATIONS: true,
  },

  MANAGER: {
    MANAGE_ORGANIZATION: false,
    VIEW_FINANCIALS: false,
    INVITE_MEMBERS: true,
    REMOVE_MEMBERS: false,
    UPDATE_MEMBER_ROLES: false,
    VIEW_AUDIT_LOGS: true,

    CREATE_CLIENT: true,
    VIEW_CLIENTS: true,
    UPDATE_CLIENT: true,
    DELETE_CLIENT: false,

    CREATE_PROJECT: true,
    VIEW_PROJECTS: true,
    UPDATE_PROJECT: true,
    ARCHIVE_PROJECT: true,

    CREATE_DELIVERABLE: true,
    VIEW_DELIVERABLE: true,
    UPDATE_DELIVERABLE: true,
    DELETE_DELIVERABLE: true,
    APPROVE_DELIVERABLE: true,
    REQUEST_REVISION: true,

    CREATE_TASK: true,
    ASSIGN_TASK: true,
    VIEW_TASKS: true,
    UPDATE_TASK_STATUS: true,
    DELETE_TASK: true,

    VIEW_CLIENT_PORTAL: true,
    APPROVE_AS_CLIENT: false,
    SUBMIT_CLIENT_FEEDBACK: true,

    MANAGE_SOCIAL: true,
    VIEW_SOCIAL: true,
    APPROVE_SOCIAL: true,

    VIEW_CALENDAR: true,
    VIEW_TEAM: true,
    MANAGE_LEAVE: true,

    USE_AI: true,
    VIEW_AGENCY_SUMMARY: true,

    VIEW_ANALYTICS: true,
    MANAGE_AUTOMATIONS: true,
    VIEW_AUTOMATIONS: true,
  },

  MEMBER: {
    MANAGE_ORGANIZATION: false,
    VIEW_FINANCIALS: false,
    INVITE_MEMBERS: false,
    REMOVE_MEMBERS: false,
    UPDATE_MEMBER_ROLES: false,
    VIEW_AUDIT_LOGS: false,

    CREATE_CLIENT: false,
    VIEW_CLIENTS: true,
    UPDATE_CLIENT: false,
    DELETE_CLIENT: false,

    CREATE_PROJECT: false,
    VIEW_PROJECTS: true,
    UPDATE_PROJECT: false,
    ARCHIVE_PROJECT: false,

    CREATE_DELIVERABLE: false,
    VIEW_DELIVERABLE: true,
    UPDATE_DELIVERABLE: false,
    DELETE_DELIVERABLE: false,
    APPROVE_DELIVERABLE: false,
    REQUEST_REVISION: false,

    CREATE_TASK: false,
    ASSIGN_TASK: false,
    VIEW_TASKS: true,
    // Members can update task status only if assigned or general internal tasks
    UPDATE_TASK_STATUS: (user, resource) => {
      if (!resource?.assigneeId) return true;
      return resource.assigneeId === user.id;
    },
    DELETE_TASK: false,

    VIEW_CLIENT_PORTAL: false,
    APPROVE_AS_CLIENT: false,
    SUBMIT_CLIENT_FEEDBACK: false,

    MANAGE_SOCIAL: true,
    VIEW_SOCIAL: true,
    APPROVE_SOCIAL: false,

    VIEW_CALENDAR: true,
    VIEW_TEAM: true,
    MANAGE_LEAVE: (user, resource) => {
      if (!resource?.assigneeId) return true;
      return resource.assigneeId === user.id;
    },

    USE_AI: true,
    VIEW_AGENCY_SUMMARY: false,

    VIEW_ANALYTICS: false,
    MANAGE_AUTOMATIONS: false,
    VIEW_AUTOMATIONS: true,
  },

  CLIENT: {
    MANAGE_ORGANIZATION: false,
    VIEW_FINANCIALS: false,
    INVITE_MEMBERS: false,
    REMOVE_MEMBERS: false,
    UPDATE_MEMBER_ROLES: false,
    VIEW_AUDIT_LOGS: false,

    CREATE_CLIENT: false,
    VIEW_CLIENTS: false,
    UPDATE_CLIENT: false,
    DELETE_CLIENT: false,

    CREATE_PROJECT: false,
    VIEW_PROJECTS: false,
    UPDATE_PROJECT: false,
    ARCHIVE_PROJECT: false,

    CREATE_DELIVERABLE: false,
    // Clients can view deliverables only if flagged client-visible
    VIEW_DELIVERABLE: (_, resource) => resource?.isClientVisible !== false,
    UPDATE_DELIVERABLE: false,
    DELETE_DELIVERABLE: false,
    APPROVE_DELIVERABLE: false,
    REQUEST_REVISION: true,

    CREATE_TASK: false,
    ASSIGN_TASK: false,
    VIEW_TASKS: false,
    UPDATE_TASK_STATUS: false,
    DELETE_TASK: false,

    VIEW_CLIENT_PORTAL: (user, resource) => {
      if (!resource?.clientId) return true;
      return user.clientId === resource.clientId;
    },
    APPROVE_AS_CLIENT: (user) => Boolean(user.canApprove),
    SUBMIT_CLIENT_FEEDBACK: true,

    MANAGE_SOCIAL: false,
    VIEW_SOCIAL: (user, resource) => {
      if (!resource?.clientId) return true;
      return user.clientId === resource.clientId;
    },
    APPROVE_SOCIAL: (user) => Boolean(user.canApprove),

    VIEW_CALENDAR: false,
    VIEW_TEAM: false,
    MANAGE_LEAVE: false,

    USE_AI: false,
    VIEW_AGENCY_SUMMARY: false,

    VIEW_ANALYTICS: false,
    MANAGE_AUTOMATIONS: false,
    VIEW_AUTOMATIONS: false,
  },
};

/**
 * Universal Permission & Multi-Tenant Enforcement Check
 * Used by all API routes, server actions, and query services.
 */
export function can(
  user: AuthenticatedUser | null | undefined,
  action: Action,
  resource?: ResourceContext
): boolean {
  if (!user) {
    return false;
  }

  // 1. Mandatory Tenant Isolation Boundary:
  // If a resource specifies an organizationId, it MUST match the user's active organizationId.
  if (resource?.organizationId && resource.organizationId !== user.organizationId) {
    return false;
  }

  // 2. Client Boundary:
  // If the user is an external client, verify their scoped clientId matches.
  if (user.role === "CLIENT") {
    if (resource?.clientId && user.clientId && resource.clientId !== user.clientId) {
      return false;
    }
  }

  // 3. Evaluate Action in Permission Matrix
  const rolePermissions = PERMISSION_MATRIX[user.role];
  if (!rolePermissions) {
    return false;
  }

  const check = rolePermissions[action];
  if (typeof check === "function") {
    return check(user, resource);
  }

  return Boolean(check);
}

/**
 * Assertion helper that throws if unauthorized
 */
export function assertCan(
  user: AuthenticatedUser | null | undefined,
  action: Action,
  resource?: ResourceContext
): asserts user is AuthenticatedUser {
  if (!can(user, action, resource)) {
    throw new Error(
      `Access Denied: Role [${user?.role || "ANONYMOUS"}] cannot perform [${action}] on target resource.`
    );
  }
}
