import { z } from "zod";

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgSlug: z.string().trim().optional(),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  orgName: z.string().trim().min(2, "Organization name must be at least 2 characters").max(100),
});

export const inviteSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  role: z.enum(["OWNER", "MANAGER", "MEMBER"]),
  jobTitle: z.string().trim().max(100).optional(),
});

// =============================================================================
// CLIENT & PROJECT SCHEMAS
// =============================================================================

export const createClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(150),
  companyName: z.string().trim().max(150).optional(),
  industry: z.string().trim().max(100).optional(),
  portalAccessEnabled: z.boolean().default(true),
});

export const createProjectSchema = z.object({
  clientId: z.string().trim().min(1, "Client ID is required"),
  name: z.string().trim().min(1, "Project name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  isArchived: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

// =============================================================================
// WORK ENGINE SCHEMAS (DELIVERABLES & TASKS)
// =============================================================================

export const createDeliverableSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
  title: z.string().trim().min(1, "Deliverable title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  serviceType: z.enum(["WEB_DEV", "VIDEO", "SOCIAL", "BRANDING", "DESIGN", "OTHER"]),
  ownerId: z.string().trim().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  weight: z.number().min(0.1).max(100).default(1.0),
});

export const updateDeliverableSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z
    .enum([
      "NOT_STARTED",
      "IN_PROGRESS",
      "IN_REVIEW",
      "SENT_TO_CLIENT",
      "REVISION_REQUESTED",
      "APPROVED",
      "DELIVERED",
    ])
    .optional(),
  dueDate: z.string().datetime().optional().nullable(),
  ownerId: z.string().trim().optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const createTaskSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
  deliverableId: z.string().trim().optional().nullable(),
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().trim().max(3000).optional(),
  assigneeId: z.string().trim().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  estimateHours: z.number().min(0).max(1000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(3000).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().trim().optional().nullable(),
  estimateHours: z.number().min(0).max(1000).optional().nullable(),
  loggedHours: z.number().min(0).max(1000).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  expectedVersion: z.number().int().positive().optional(),
});

// =============================================================================
// CLIENT PORTAL SCHEMAS
// =============================================================================

export const clientApprovalSchema = z.object({
  note: z.string().trim().max(2000).optional(),
});

export const clientRevisionSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, "A comment detailing the requested revisions is required.")
    .max(3000),
});

export const clientCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment content cannot be empty.").max(3000),
  deliverableId: z.string().trim().optional(),
});

// =============================================================================
// COMMENTS SCHEMAS
// =============================================================================

export const createCommentSchema = z.object({
  projectId: z.string().trim().optional(),
  deliverableId: z.string().trim().optional(),
  taskId: z.string().trim().optional(),
  content: z.string().trim().min(1, "Comment cannot be empty.").max(5000),
  visibility: z.enum(["INTERNAL", "CLIENT_VISIBLE"]).default("INTERNAL"),
  mentions: z.array(z.string().trim()).optional(),
});

// =============================================================================
// AUTOMATION SCHEMAS
// =============================================================================

export const createAutomationRuleSchema = z.object({
  name: z.string().trim().min(2, "Rule name is required").max(150),
  description: z.string().trim().max(1000).optional(),
  triggerType: z.enum([
    "TASK_MOVED_TO_REVIEW",
    "DELIVERABLE_SENT_TO_CLIENT",
    "CLIENT_APPROVED",
    "CLIENT_REQUESTED_REVISION",
    "DUE_DATE_APPROACHING",
    "POST_APPROVED",
  ]),
  triggerConfig: z.record(z.string(), z.any()).optional(),
  actionType: z.enum([
    "NOTIFY_USER_OR_ROLE",
    "CREATE_TASK",
    "CHANGE_ASSIGNEE",
    "CHANGE_PRIORITY",
    "POST_COMMENT",
    "SEND_CLIENT_REMINDER",
  ]),
  actionConfig: z.record(z.string(), z.any()),
  requiresApproval: z.boolean().optional(),
});
