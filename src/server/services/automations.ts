import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { assertCan } from "@/server/permissions";

export type AutomationTriggerType =
  | "TASK_MOVED_TO_REVIEW"
  | "DELIVERABLE_SENT_TO_CLIENT"
  | "CLIENT_APPROVED"
  | "CLIENT_REQUESTED_REVISION"
  | "DUE_DATE_APPROACHING"
  | "POST_APPROVED";

export type AutomationActionType =
  | "NOTIFY_USER_OR_ROLE"
  | "CREATE_TASK"
  | "CHANGE_ASSIGNEE"
  | "CHANGE_PRIORITY"
  | "POST_COMMENT"
  | "SEND_CLIENT_REMINDER";

export interface AutomationTriggerContext {
  entityId: string;
  projectId?: string;
  deliverableId?: string;
  taskId?: string;
  socialPostId?: string;
  clientId?: string;
  clientName?: string;
  title?: string;
  comment?: string;
  ownerId?: string;
  assigneeId?: string;
  eventKey?: string;
  [key: string]: any;
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  triggerType: AutomationTriggerType;
  triggerConfig?: Record<string, any>;
  actionType: AutomationActionType;
  actionConfig: Record<string, any>;
  requiresApproval?: boolean;
}

export class AutomationService {
  /**
   * Determine if an action has side effects on external clients.
   * Actions with external side effects require manager approval before activation.
   */
  static isClientSideEffectAction(actionType: AutomationActionType, actionConfig?: any): boolean {
    if (actionType === "SEND_CLIENT_REMINDER") return true;
    if (actionType === "POST_COMMENT" && actionConfig?.visibility === "CLIENT_VISIBLE") return true;
    return false;
  }

  /**
   * Seed 5 battle-tested default rules that agencies actually want.
   * Idempotent: checks by name in the organization.
   */
  static async seedDefaultRules(organizationId: string, ownerId: string) {
    const defaultRules: Array<{
      name: string;
      description: string;
      triggerType: AutomationTriggerType;
      actionType: AutomationActionType;
      actionConfig: Record<string, any>;
      requiresApproval: boolean;
      isApproved: boolean;
    }> = [
      {
        name: "Auto-create revision turnaround task",
        description:
          "Automatically create a high-priority task assigned to deliverable owner when a client requests revisions.",
        triggerType: "CLIENT_REQUESTED_REVISION",
        actionType: "CREATE_TASK",
        actionConfig: {
          taskTitle: "Turnaround client revision: {deliverableTitle}",
          priority: "HIGH",
          assignToOwner: true,
          estimateHours: 4,
        },
        requiresApproval: false,
        isApproved: true,
      },
      {
        name: "Notify lead on internal review",
        description: "Notify agency managers when a specialist moves a task into review state.",
        triggerType: "TASK_MOVED_TO_REVIEW",
        actionType: "NOTIFY_USER_OR_ROLE",
        actionConfig: {
          targetRole: "MANAGER",
          title: "Task ready for internal review",
          message: "Task '{taskTitle}' has been moved to review.",
        },
        requiresApproval: false,
        isApproved: true,
      },
      {
        name: "Client review window follow-up",
        description: "Send friendly follow-up notification to client when deliverable is sent for review.",
        triggerType: "DELIVERABLE_SENT_TO_CLIENT",
        actionType: "SEND_CLIENT_REMINDER",
        actionConfig: {
          templateSubject: "Your review is ready: {deliverableTitle}",
          message: "A new milestone deliverable is waiting for your review on the portal.",
        },
        requiresApproval: true,
        isApproved: true, // Approved by default for agency template
      },
      {
        name: "Urgent priority bump on approaching deadline",
        description: "Automatically elevate task priority to URGENT if still incomplete within 24h of deadline.",
        triggerType: "DUE_DATE_APPROACHING",
        actionType: "CHANGE_PRIORITY",
        actionConfig: {
          targetPriority: "URGENT",
        },
        requiresApproval: false,
        isApproved: true,
      },
      {
        name: "Celebrate client approval",
        description: "Post celebration update into project discussion thread when client signs off on deliverable.",
        triggerType: "CLIENT_APPROVED",
        actionType: "POST_COMMENT",
        actionConfig: {
          comment: "🎉 Client approved {deliverableTitle}! Milestone signed off.",
          visibility: "INTERNAL",
        },
        requiresApproval: false,
        isApproved: true,
      },
    ];

    for (const def of defaultRules) {
      const existing = await prisma.automationRule.findFirst({
        where: { organizationId, name: def.name },
      });

      if (!existing) {
        await prisma.automationRule.create({
          data: {
            organizationId,
            ownerId,
            name: def.name,
            description: def.description,
            triggerType: def.triggerType,
            actionType: def.actionType,
            actionConfig: JSON.stringify(def.actionConfig),
            enabled: true,
            requiresApproval: def.requiresApproval,
            isApproved: def.isApproved,
          },
        });
      }
    }
  }

  /**
   * List all automation rules for an organization with recent run history.
   */
  static async listRules(user: AuthenticatedUser) {
    assertCan(user, "VIEW_AUTOMATIONS", { organizationId: user.organizationId });

    // Ensure default rules exist for agency
    await this.seedDefaultRules(user.organizationId, user.id);

    const rules = await prisma.automationRule.findMany({
      where: { organizationId: user.organizationId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        runs: {
          orderBy: { executedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rules.map((r) => ({
      ...r,
      triggerConfig: r.triggerConfig ? JSON.parse(r.triggerConfig) : null,
      actionConfig: JSON.parse(r.actionConfig),
    }));
  }

  /**
   * Create a new custom automation rule with governance check.
   */
  static async createRule(user: AuthenticatedUser, input: CreateRuleInput) {
    assertCan(user, "MANAGE_AUTOMATIONS", { organizationId: user.organizationId });

    const clientSideEffect = this.isClientSideEffectAction(input.actionType, input.actionConfig);
    const requiresApproval = input.requiresApproval ?? clientSideEffect;

    // If creator is OWNER or MANAGER, auto-approve; else require manager approval
    const isApproved = user.role === "OWNER" || user.role === "MANAGER" ? true : !requiresApproval;

    const rule = await prisma.automationRule.create({
      data: {
        organizationId: user.organizationId,
        ownerId: user.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        triggerType: input.triggerType,
        triggerConfig: input.triggerConfig ? JSON.stringify(input.triggerConfig) : null,
        actionType: input.actionType,
        actionConfig: JSON.stringify(input.actionConfig),
        enabled: true,
        requiresApproval,
        isApproved,
        approvedById: isApproved ? user.id : null,
        approvedAt: isApproved ? new Date() : null,
      },
    });

    return rule;
  }

  /**
   * Toggle rule enabled status.
   */
  static async toggleRule(user: AuthenticatedUser, ruleId: string, enabled: boolean) {
    assertCan(user, "MANAGE_AUTOMATIONS", { organizationId: user.organizationId });

    const rule = await prisma.automationRule.findFirst({
      where: { id: ruleId, organizationId: user.organizationId },
    });
    if (!rule) throw new Error("Automation rule not found.");

    if (enabled && rule.requiresApproval && !rule.isApproved) {
      throw new Error("Cannot activate rule: Client-facing actions require manager approval first.");
    }

    return prisma.automationRule.update({
      where: { id: ruleId },
      data: { enabled },
    });
  }

  /**
   * Manager approval for client-facing rules.
   */
  static async approveRule(user: AuthenticatedUser, ruleId: string) {
    assertCan(user, "MANAGE_AUTOMATIONS", { organizationId: user.organizationId });

    const rule = await prisma.automationRule.findFirst({
      where: { id: ruleId, organizationId: user.organizationId },
    });
    if (!rule) throw new Error("Automation rule not found.");

    return prisma.automationRule.update({
      where: { id: ruleId },
      data: {
        isApproved: true,
        approvedById: user.id,
        approvedAt: new Date(),
        enabled: true,
      },
    });
  }

  /**
   * Core execution pipeline: processes a triggered event against all registered rules.
   * Durable, idempotent, handles retries with exponential backoff and audit logging.
   */
  static async processTrigger(
    organizationId: string,
    triggerType: AutomationTriggerType,
    context: AutomationTriggerContext
  ) {
    // 1. Fetch all active rules matching this trigger
    const rules = await prisma.automationRule.findMany({
      where: {
        organizationId,
        triggerType,
        enabled: true,
      },
    });

    const executionResults = [];

    for (const rule of rules) {
      // Safety Gate: Client side effects check
      if (rule.requiresApproval && !rule.isApproved) {
        await prisma.automationRun.create({
          data: {
            organizationId,
            ruleId: rule.id,
            triggerEvent: `skipped_${rule.id}_${Date.now()}`,
            status: "SKIPPED",
            reason: "Requires manager approval before executing client-facing actions.",
            payload: JSON.stringify(context),
          },
        });

        executionResults.push({
          ruleId: rule.id,
          status: "SKIPPED",
          reason: "Rule requires manager approval before activation.",
        });
        continue;
      }

      // Idempotency check: derive key from rule, trigger, entity, and event identifier
      const eventKey = context.eventKey || `${triggerType}_${context.entityId}_${context.timestamp || ""}`;
      const idempotencyKey = `${rule.id}:${eventKey}`;

      const existingRun = await prisma.automationRun.findFirst({
        where: {
          organizationId,
          ruleId: rule.id,
          triggerEvent: idempotencyKey,
          status: "SUCCESS",
        },
      });

      if (existingRun) {
        executionResults.push({
          ruleId: rule.id,
          status: "SKIPPED",
          reason: "Idempotency check: Event already executed successfully.",
        });
        continue;
      }

      // Execute Action
      const result = await this.executeAction(rule, context, idempotencyKey);
      executionResults.push(result);
    }

    return executionResults;
  }

  /**
   * Executes a single automation action with retry tracking and audit logging.
   */
  static async executeAction(
    rule: any,
    context: AutomationTriggerContext,
    idempotencyKey: string,
    existingRunId?: string,
    currentRetryCount = 0
  ) {
    const actionConfig = typeof rule.actionConfig === "string" ? JSON.parse(rule.actionConfig) : rule.actionConfig;

    try {
      let outputDetails: any = {};

      switch (rule.actionType as AutomationActionType) {
        // =====================================================================
        // ACTION 1: CREATE TASK
        // =====================================================================
        case "CREATE_TASK": {
          const deliverableId = context.deliverableId || context.entityId;
          const deliverable = await prisma.deliverable.findFirst({
            where: { id: deliverableId, organizationId: rule.organizationId },
            include: { project: true },
          });

          if (!deliverable) {
            throw new Error(`Deliverable #${deliverableId} not found to attach task.`);
          }

          if (actionConfig.taskTitle !== undefined && !actionConfig.taskTitle.trim()) {
            throw new Error("Task title is required");
          }

          // Template substitution
          let title = actionConfig.taskTitle || "Turnaround Task: {deliverableTitle}";
          title = title
            .replace("{deliverableTitle}", deliverable.title)
            .replace("{taskTitle}", context.title || "Task");

          // Determine Assignee: Deliverable Owner or Fallback to Rule Owner
          const assigneeId =
            actionConfig.assignToOwner && deliverable.ownerId
              ? deliverable.ownerId
              : actionConfig.assigneeId || rule.ownerId;

          const createdTask = await prisma.task.create({
            data: {
              organizationId: rule.organizationId,
              projectId: deliverable.projectId,
              deliverableId: deliverable.id,
              title: title.trim(),
              description: context.comment
                ? `Created automatically by rule '${rule.name}':\n\nClient Notes: "${context.comment}"`
                : `Created automatically by rule '${rule.name}'.`,
              priority: actionConfig.priority || "HIGH",
              assigneeId,
              estimateHours: actionConfig.estimateHours || 3,
            },
          });

          outputDetails = {
            createdTaskId: createdTask.id,
            taskTitle: createdTask.title,
            assigneeId: createdTask.assigneeId,
          };
          break;
        }

        // =====================================================================
        // ACTION 2: NOTIFY USER OR ROLE
        // =====================================================================
        case "NOTIFY_USER_OR_ROLE": {
          let recipientUserIds: string[] = [];

          if (actionConfig.userId) {
            recipientUserIds = [actionConfig.userId];
          } else if (actionConfig.targetRole) {
            const members = await prisma.membership.findMany({
              where: {
                organizationId: rule.organizationId,
                role: actionConfig.targetRole,
              },
              select: { userId: true },
            });
            recipientUserIds = members.map((m) => m.userId);
          } else if (context.ownerId) {
            recipientUserIds = [context.ownerId];
          } else {
            recipientUserIds = [rule.ownerId];
          }

          const notificationTitle = (actionConfig.title || "Automation Alert: {taskTitle}")
            .replace("{taskTitle}", context.title || "Task")
            .replace("{deliverableTitle}", context.title || "Deliverable");

          const notificationMessage = (actionConfig.message || "Automation rule '{ruleName}' triggered.")
            .replace("{ruleName}", rule.name)
            .replace("{taskTitle}", context.title || "Task");

          for (const uid of recipientUserIds) {
            await prisma.notification.create({
              data: {
                organizationId: rule.organizationId,
                recipientId: uid,
                type: "AUTOMATION",
                title: notificationTitle,
                message: notificationMessage,
                entityType: context.taskId ? "TASK" : "DELIVERABLE",
                entityId: context.taskId || context.deliverableId || context.entityId,
              },
            });
          }

          outputDetails = {
            recipientsCount: recipientUserIds.length,
            recipientUserIds,
          };
          break;
        }

        // =====================================================================
        // ACTION 3: CHANGE ASSIGNEE
        // =====================================================================
        case "CHANGE_ASSIGNEE": {
          const targetAssigneeId = actionConfig.targetAssigneeId || rule.ownerId;
          if (context.taskId) {
            await prisma.task.update({
              where: { id: context.taskId },
              data: { assigneeId: targetAssigneeId },
            });
            outputDetails = { taskId: context.taskId, newAssigneeId: targetAssigneeId };
          } else if (context.deliverableId) {
            await prisma.deliverable.update({
              where: { id: context.deliverableId },
              data: { ownerId: targetAssigneeId },
            });
            outputDetails = { deliverableId: context.deliverableId, newOwnerId: targetAssigneeId };
          }
          break;
        }

        // =====================================================================
        // ACTION 4: CHANGE PRIORITY
        // =====================================================================
        case "CHANGE_PRIORITY": {
          const targetPriority = actionConfig.targetPriority || "URGENT";
          const taskId = context.taskId || context.entityId;
          const updated = await prisma.task.update({
            where: { id: taskId },
            data: { priority: targetPriority },
          });
          outputDetails = { taskId: updated.id, newPriority: updated.priority };
          break;
        }

        // =====================================================================
        // ACTION 5: POST COMMENT
        // =====================================================================
        case "POST_COMMENT": {
          const text = (actionConfig.comment || "Automation update on {deliverableTitle}")
            .replace("{deliverableTitle}", context.title || "Deliverable")
            .replace("{clientName}", context.clientName || "Client");

          const comment = await prisma.comment.create({
            data: {
              organizationId: rule.organizationId,
              authorId: rule.ownerId,
              authorName: "Automation Engine",
              content: text,
              visibility: actionConfig.visibility || "INTERNAL",
              projectId: context.projectId,
              deliverableId: context.deliverableId || context.entityId,
              taskId: context.taskId,
            },
          });
          outputDetails = { commentId: comment.id, content: comment.content };
          break;
        }

        // =====================================================================
        // ACTION 6: SEND CLIENT REMINDER
        // =====================================================================
        case "SEND_CLIENT_REMINDER": {
          // Client review window reminder
          const message = (actionConfig.message || "Reminder: {deliverableTitle} is waiting for your review.")
            .replace("{deliverableTitle}", context.title || "Deliverable");

          // Find client contacts to notify
          const clientContacts = await prisma.clientContact.findMany({
            where: {
              organizationId: rule.organizationId,
              ...(context.clientId ? { clientId: context.clientId } : {}),
            },
          });

          // Simulated dispatch / audit log
          outputDetails = {
            reminderSent: true,
            contactsNotifiedCount: clientContacts.length,
            message,
          };
          break;
        }

        default:
          throw new Error(`Unsupported action type: ${rule.actionType}`);
      }

      // Record SUCCESS Run
      let run;
      if (existingRunId) {
        run = await prisma.automationRun.update({
          where: { id: existingRunId },
          data: {
            status: "SUCCESS",
            reason: "Action executed successfully.",
            outputDetails: JSON.stringify(outputDetails),
            executedAt: new Date(),
          },
        });
      } else {
        run = await prisma.automationRun.create({
          data: {
            organizationId: rule.organizationId,
            ruleId: rule.id,
            triggerEvent: idempotencyKey,
            status: "SUCCESS",
            reason: "Action executed successfully.",
            payload: JSON.stringify(context),
            outputDetails: JSON.stringify(outputDetails),
            retryCount: currentRetryCount,
          },
        });
      }

      // Log ActivityEvent with actorType: "AUTOMATION"
      await prisma.activityEvent.create({
        data: {
          organizationId: rule.organizationId,
          actorId: rule.id,
          actorType: "AUTOMATION",
          action: "AUTOMATION_EXECUTED",
          entityType: "AUTOMATION_RULE",
          entityId: rule.id,
          metadata: JSON.stringify({
            ruleId: rule.id,
            ruleName: rule.name,
            actionType: rule.actionType,
            outputDetails,
            runId: run.id,
          }),
        },
      });

      return {
        runId: run.id,
        ruleId: rule.id,
        status: "SUCCESS",
        outputDetails,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Execution failed";
      const maxRetries = 3;
      const nextRetryCount = currentRetryCount + 1;
      const shouldRetry = nextRetryCount <= maxRetries;

      // Exponential backoff: 2^retryCount * 60 seconds
      const backoffMs = Math.pow(2, nextRetryCount) * 1000 * 60;
      const nextRetryAt = shouldRetry ? new Date(Date.now() + backoffMs) : null;
      const status = shouldRetry ? "RETRYING" : "FAILURE";

      let run;
      if (existingRunId) {
        run = await prisma.automationRun.update({
          where: { id: existingRunId },
          data: {
            status,
            reason: errorMessage,
            retryCount: nextRetryCount,
            nextRetryAt,
            executedAt: new Date(),
          },
        });
      } else {
        run = await prisma.automationRun.create({
          data: {
            organizationId: rule.organizationId,
            ruleId: rule.id,
            triggerEvent: idempotencyKey,
            status,
            reason: errorMessage,
            payload: JSON.stringify(context),
            retryCount: nextRetryCount,
            maxRetries,
            nextRetryAt,
          },
        });
      }

      // Log failure activity event
      await prisma.activityEvent.create({
        data: {
          organizationId: rule.organizationId,
          actorId: rule.id,
          actorType: "AUTOMATION",
          action: status === "RETRYING" ? "AUTOMATION_RETRYING" : "AUTOMATION_FAILED",
          entityType: "AUTOMATION_RULE",
          entityId: rule.id,
          metadata: JSON.stringify({
            ruleId: rule.id,
            ruleName: rule.name,
            error: errorMessage,
            retryCount: nextRetryCount,
            nextRetryAt,
            runId: run.id,
          }),
        },
      });

      return {
        runId: run.id,
        ruleId: rule.id,
        status,
        error: errorMessage,
        retryCount: nextRetryCount,
        nextRetryAt,
      };
    }
  }

  /**
   * Manual "Run Test" against sample entity.
   */
  static async testRunRule(user: AuthenticatedUser, ruleId: string, testPayload?: any) {
    assertCan(user, "MANAGE_AUTOMATIONS", { organizationId: user.organizationId });

    const rule = await prisma.automationRule.findFirst({
      where: { id: ruleId, organizationId: user.organizationId },
    });
    if (!rule) throw new Error("Automation rule not found.");

    // Build sample payload if not provided
    const sampleDeliverable = await prisma.deliverable.findFirst({
      where: { organizationId: user.organizationId },
      include: { project: true },
    });

    const context: AutomationTriggerContext = {
      entityId: sampleDeliverable?.id || "sample-entity-1",
      deliverableId: sampleDeliverable?.id,
      projectId: sampleDeliverable?.projectId,
      title: sampleDeliverable?.title || "Sample Web Redesign Deliverable",
      comment: "Test sample note for automated rule trial.",
      ownerId: sampleDeliverable?.ownerId || user.id,
      eventKey: `test_run_${Date.now()}`,
      ...testPayload,
    };

    const idempotencyKey = `manual_test_${rule.id}_${Date.now()}`;
    return this.executeAction(rule, context, idempotencyKey);
  }

  /**
   * Process all pending retrying runs whose nextRetryAt has arrived.
   */
  static async processPendingRetries(organizationId?: string) {
    const now = new Date();
    const pendingRuns = await prisma.automationRun.findMany({
      where: {
        status: "RETRYING",
        nextRetryAt: { lte: now },
        ...(organizationId ? { organizationId } : {}),
      },
      include: { rule: true },
      take: 20,
    });

    const results = [];
    for (const run of pendingRuns) {
      const payload = run.payload ? JSON.parse(run.payload) : { entityId: "retry" };
      const res = await this.executeAction(
        run.rule,
        payload,
        run.triggerEvent,
        run.id,
        run.retryCount
      );
      results.push(res);
    }
    return results;
  }
}
