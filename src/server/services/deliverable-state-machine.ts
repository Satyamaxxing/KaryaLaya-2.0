/**
 * KaryaLaya 2.0 — Deliverable Lifecycle State Machine
 *
 * Defines canonical deliverable status transitions for agency workflows:
 * NOT_STARTED -> IN_PROGRESS -> IN_REVIEW (internal) -> SENT_TO_CLIENT ->
 * [APPROVED -> DELIVERED] or [REVISION_REQUESTED -> IN_PROGRESS]
 *
 * Enforced in one place across all backend services and API routes.
 */

export const DELIVERABLE_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "SENT_TO_CLIENT",
  "REVISION_REQUESTED",
  "APPROVED",
  "DELIVERED",
] as const;

export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const SERVICE_TYPES = [
  "WEB_DEV",
  "VIDEO",
  "SOCIAL",
  "BRANDING",
  "DESIGN",
  "OTHER",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

/**
 * Allowed status transition map.
 * Current Status -> List of Allowed Next Statuses
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<DeliverableStatus, DeliverableStatus[]> = {
  NOT_STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["IN_REVIEW"],
  IN_REVIEW: ["SENT_TO_CLIENT", "IN_PROGRESS"],
  SENT_TO_CLIENT: ["APPROVED", "REVISION_REQUESTED"],
  REVISION_REQUESTED: ["IN_PROGRESS"],
  APPROVED: ["DELIVERED", "IN_PROGRESS"],
  DELIVERED: [], // Terminal delivered outcome
};

/**
 * Validates whether a state transition is legal according to agency workflow rules.
 */
export function canTransitionDeliverable(
  currentStatus: DeliverableStatus,
  nextStatus: DeliverableStatus
): boolean {
  if (currentStatus === nextStatus) return true; // Idempotent no-op
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Throws an explicit descriptive error if a transition is rejected.
 */
export function assertValidDeliverableTransition(
  currentStatus: DeliverableStatus,
  nextStatus: DeliverableStatus
): void {
  if (!canTransitionDeliverable(currentStatus, nextStatus)) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    throw new Error(
      `Invalid Deliverable Transition: Cannot move from '${currentStatus}' to '${nextStatus}'. ` +
        `Allowed transitions: [${allowed.join(", ") || "None (Terminal Status)"}].`
    );
  }
}

/**
 * Returns permissible next statuses for a deliverable, useful for UI dropdowns.
 */
export function getAllowedNextStatuses(currentStatus: DeliverableStatus): DeliverableStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
}
