/**
 * KaryaLaya 2.0: Canonical Domain Model & Type Definitions
 * Location: src/types/work-os.ts
 * Based directly on the KaryaLaya 2.0 PRD (The Work Operating System)
 */

export type PrincipalRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "GUEST" | "CLIENT";

export type EntityAudience = "INTERNAL" | "CLIENT_VISIBLE";

export type ActorType = "HUMAN" | "AI" | "AUTOMATION" | "SYSTEM" | "INTEGRATION" | "CLIENT";

export type WorkstreamType =
  "WEB" | "VIDEO" | "SOCIAL" | "BRAND" | "STRATEGY" | "ENGINEERING" | "GENERAL";

export type HealthStatus = "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "UNKNOWN";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

export type DeliverableStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "INTERNAL_REVIEW"
  | "CLIENT_REVIEW"
  | "REVISION_REQUIRED"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED";

export type ClientDeliverableLabel =
  "Upcoming" | "In Progress" | "In Review" | "Action Required" | "Approved" | "Completed";

export type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "REVISION_REQUIRED"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED";

export type PriorityLevel = "P0" | "P1" | "P2" | "P3"; // P0: Urgent, P1: High, P2: Medium, P3: Low

export type DependencyKind = "HARD" | "SOFT";

export type ApprovalDecision = "PENDING" | "APPROVED" | "REVISION_REQUESTED" | "REJECTED";

export type RiskTier = "T0" | "T1" | "T2" | "T3" | "T4";

export type AIConfidence = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_CONTEXT";

export type AutomationStatus = "DRAFT" | "ENABLED" | "PAUSED" | "DISABLED" | "ERROR";

export type RunStatus =
  | "QUEUED"
  | "RUNNING"
  | "AWAITING_APPROVAL"
  | "SUCCEEDED"
  | "PARTIALLY_SUCCEEDED"
  | "FAILED"
  | "ROLLED_BACK"
  | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: PrincipalRole;
  jobTitle: string;
  teamId?: string;
  workstream?: WorkstreamType;
  colorTone?: number; // 0: emerald/blue, 1: purple/violet, 2: amber/orange, 3: cyan
  capacityWeeklyHours?: number;
  currentWorkloadHours?: number;
}

export interface ClientContact {
  id: string;
  name: string;
  email: string;
  company: string;
  roleTitle: string;
  avatarUrl?: string;
  portalAccess: boolean;
  canApprove: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: "STARTER" | "TEAM" | "BUSINESS" | "ENTERPRISE";
  ownerId: string;
}

export interface Workspace {
  id: string;
  orgId: string;
  name: string;
  description: string;
  activeProjectIds: string[];
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  assignedToId?: string;
}

export interface Dependency {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  kind: DependencyKind;
  reason?: string;
  impactDescription?: string;
}

export interface Task {
  id: string;
  projectId: string;
  deliverableId: string;
  title: string;
  description: string;
  ownerId: string; // Accountable member
  assigneeId: string;
  status: TaskStatus;
  priority: PriorityLevel;
  workstream: WorkstreamType;
  estimateHours: number;
  loggedHours?: number;
  startDate?: string;
  dueDate: string;
  isBlocked?: boolean;
  blockedReason?: string;
  audience: EntityAudience;
  subtasks: Subtask[];
  dependencyIds: string[]; // Tasks that block this task
  downstreamDependencyIds?: string[]; // Tasks blocked by this task
  tags: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DeliverableVersion {
  versionNumber: number;
  submittedAt: string;
  submittedById: string;
  assetUrl?: string;
  summary: string;
  status: DeliverableStatus;
}

export interface Deliverable {
  id: string;
  projectId: string;
  workstream: WorkstreamType;
  title: string;
  description: string;
  ownerId: string; // Accountable member
  status: DeliverableStatus;
  clientLabel: ClientDeliverableLabel;
  progressPercent: number; // 0 - 100
  weight: number; // For project progress calculation
  dueDate: string;
  revisionBudget: number; // e.g. 2 rounds
  revisionCount: number;
  clientVisible: boolean;
  approvalRequired: boolean;
  currentApprovalId?: string;
  taskIds: string[];
  versions: DeliverableVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string;
  isClientVisible: boolean;
  isAchieved: boolean;
  achievedAt?: string;
  requiredDeliverableIds: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  forecastDate?: string;
}

export interface Approval {
  id: string;
  projectId: string;
  deliverableId?: string;
  deliverableVersionNumber?: number;
  recommendationId?: string;
  title: string;
  requestedById: string;
  requestedAt: string;
  decision: ApprovalDecision;
  decidedById?: string;
  decidedAt?: string;
  decisionType: "INTERNAL" | "CLIENT" | "AI_ACTION_PLAN";
  feedback?: string;
  riskTier?: RiskTier;
}

export interface Comment {
  id: string;
  projectId: string;
  targetType: "TASK" | "DELIVERABLE" | "PROJECT" | "DOCUMENT";
  targetId: string;
  authorId: string;
  authorRole: PrincipalRole;
  text: string;
  audience: EntityAudience;
  createdAt: string;
  quotedText?: string;
  isClientModerated?: boolean;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  authorId: string;
  workstream?: WorkstreamType;
  clientVisible: boolean;
  version: number;
  publishedAt?: string;
  tags: string[];
  updatedAt: string;
}

export interface CalendarItem {
  id: string;
  projectId: string;
  title: string;
  kind:
    | "COMMITTED_DEADLINE"
    | "TARGET_DEADLINE"
    | "MILESTONE"
    | "REVIEW_WINDOW"
    | "PUBLISH_WINDOW"
    | "MEETING";
  startDate: string;
  endDate: string;
  ownerId?: string;
  deliverableId?: string;
  clientVisible: boolean;
  source: ActorType;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: {
    type: ActorType;
    id: string;
    name: string;
    role?: string;
  };
  initiatedBy?: string;
  approvedBy?: string;
  entity: {
    type: "PROJECT" | "DELIVERABLE" | "TASK" | "APPROVAL" | "COMMENT" | "AUTOMATION" | "AI_INSIGHT";
    id: string;
    title: string;
  };
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  source: "WEB" | "API" | "AUTOMATION" | "AI_RECOMMENDATION" | "CLIENT_PORTAL";
  reason?: string;
  visibility: EntityAudience;
  projectId?: string;
}

export interface AIProposedAction {
  id: string;
  actionType:
    "ASSIGN_TASK" | "SET_PRIORITY" | "RESERVE_CALENDAR_WINDOW" | "UPDATE_STATUS" | "NOTIFY_CLIENT";
  targetEntityId: string;
  targetEntityType: "TASK" | "DELIVERABLE" | "CALENDAR" | "PROJECT";
  label: string;
  payload: Record<string, unknown>;
  riskTier: RiskTier;
  isExecuted?: boolean;
}

export interface AIInsight {
  id: string;
  projectId: string;
  statement: string;
  resolvedStatement?: string;
  support: string;
  explanationLevel1: string; // One line
  explanationLevel2: string[]; // Causal chain
  evidence: Array<{ entityId: string; entityType: string; label: string; text: string }>;
  confidence: AIConfidence;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  status: "ACTIVE" | "RESOLVED" | "DISMISSED";
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  insightId: string;
  projectId: string;
  headline: string;
  rationale: string;
  confidence: AIConfidence;
  riskTier: RiskTier;
  proposedActions: AIProposedAction[];
  status: "PRESENTED" | "APPROVED" | "REJECTED" | "EXECUTING" | "EXECUTED" | "EXPIRED";
  createdAt: string;
  decisionBy?: string;
  decisionAt?: string;
  automationRunId?: string;
}

export interface AutomationStep {
  id: string;
  name: string;
  actionType: string;
  target: string;
  riskTier: RiskTier;
  requiresApprovalGate?: boolean;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
}

export interface Automation {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  ownerId: string;
  triggerEvent: string;
  triggerDescription: string;
  conditions: string[];
  steps: AutomationStep[];
  status: AutomationStatus;
  riskTier: RiskTier;
  lastRunAt?: string;
  runCount: number;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  automationName: string;
  projectId: string;
  triggeredAt: string;
  triggeredBy: ActorType;
  approvedById?: string;
  status: RunStatus;
  completedAt?: string;
  stepsExecuted: Array<{
    stepName: string;
    status: "SUCCEEDED" | "FAILED" | "SKIPPED";
    details: string;
    timestamp: string;
  }>;
  resultSummary: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  priority: "N1_URGENT" | "N2_UPDATE" | "N3_BACKGROUND";
  title: string;
  message: string;
  entityType: "TASK" | "DELIVERABLE" | "APPROVAL" | "AI_RECOMMENDATION" | "COMMENT";
  entityId: string;
  projectId?: string;
  createdAt: string;
  isRead: boolean;
  isActioned?: boolean;
  actionType?: "APPROVE" | "REVIEW" | "VIEW";
  source: ActorType;
}

export interface Project {
  id: string;
  orgId: string;
  workspaceId: string;
  clientId: string;
  clientName: string;
  name: string;
  objective: string;
  status: ProjectStatus;
  health: HealthStatus;
  healthReasons: string[];
  ownerId: string; // Accountable manager
  teamMemberIds: string[];
  workstreams: WorkstreamType[];
  deliverableIds: string[];
  milestoneIds: string[];
  progressPercent: number; // 78 -> 82 when approved
  baselineStartDate: string;
  targetFinishDate: string;
  forecastFinishDate: string;
  stateVersion: number;
  asOfTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProjection {
  projectId: string;
  projectName: string;
  clientName: string;
  progressPercent: number;
  healthSummary: string;
  deliverables: Array<{
    id: string;
    title: string;
    workstream: WorkstreamType;
    status: DeliverableStatus;
    clientLabel: ClientDeliverableLabel;
    progressPercent: number;
    dueDate: string;
    revisionRound: string;
    hasPendingApproval: boolean;
    approvalId?: string;
    latestVersionNumber: number;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    targetDate: string;
    isAchieved: boolean;
  }>;
  pendingApprovals: Array<{
    id: string;
    deliverableId: string;
    deliverableTitle: string;
    versionNumber: number;
    submittedAt: string;
    summary: string;
  }>;
  clientMessages: Array<{
    id: string;
    senderName: string;
    senderRole: string;
    text: string;
    createdAt: string;
  }>;
  publishedFiles: Array<{
    id: string;
    title: string;
    size: string;
    updatedAt: string;
    downloadUrl: string;
  }>;
  asOfTimestamp: string;
  projectionVersion: number;
}
