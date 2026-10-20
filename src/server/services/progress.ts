/**
 * KaryaLaya 2.0 — Progress & Risk Engine
 * Location: src/server/services/progress.ts
 *
 * Pure, authoritative business logic for calculating deliverable and project progress,
 * evaluating plain-rule risk criteria (overdue, due soon with low progress, dependency
 * blockers, prolonged client review), and maintaining transactional data integrity.
 */

export interface ProgressTaskInput {
  status: string; // "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
  estimateHours?: number | null;
  title?: string;
  blockedBy?: Array<{
    blockingTask: {
      id?: string;
      title: string;
      status: string;
    };
  }>;
}

export interface ProgressDeliverableInput {
  id?: string;
  title: string;
  status: string; // "NOT_STARTED" | "IN_PROGRESS" | "IN_REVIEW" | "SENT_TO_CLIENT" | "REVISION_REQUESTED" | "APPROVED" | "DELIVERED"
  weight: number;
  progressPercent: number;
  dueDate?: Date | string | null;
  sentToClientAt?: Date | string | null;
  tasks?: ProgressTaskInput[];
}

export interface RiskEvaluationResult {
  riskStatus: "ON_TRACK" | "AT_RISK";
  riskReason: string | null;
}

/**
 * 1. Deliverable progress = completed task weight / total task weight (weight = estimateHours or 1).
 * If a deliverable status is APPROVED or DELIVERED, it counts as 100%.
 */
export function calculateDeliverableProgress(
  deliverableStatus: string,
  tasks: ProgressTaskInput[] = []
): number {
  if (deliverableStatus === "APPROVED" || deliverableStatus === "DELIVERED") {
    return 100;
  }

  if (tasks.length === 0) {
    // Status-based baseline when no granular tasks are defined
    switch (deliverableStatus) {
      case "SENT_TO_CLIENT":
        return 85;
      case "IN_REVIEW":
        return 75;
      case "IN_PROGRESS":
        return 25;
      case "REVISION_REQUESTED":
        return 50;
      case "NOT_STARTED":
      default:
        return 0;
    }
  }

  let totalWeight = 0;
  let completedWeight = 0;

  for (const task of tasks) {
    const taskWeight =
      typeof task.estimateHours === "number" && task.estimateHours > 0
        ? task.estimateHours
        : 1.0;

    totalWeight += taskWeight;
    if (task.status === "DONE") {
      completedWeight += taskWeight;
    }
  }

  if (totalWeight <= 0) return 0;

  const pct = Math.round((completedWeight / totalWeight) * 100);
  return Math.min(100, Math.max(0, pct));
}

/**
 * 2. Project progress = weighted average of deliverable progress using deliverable.weight.
 * Deliverables with APPROVED or DELIVERED count 100%.
 */
export function calculateProjectProgress(
  deliverables: Array<{
    status: string;
    weight: number;
    progressPercent: number;
  }>
): number {
  if (!deliverables || deliverables.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  let weightedProgressSum = 0;

  for (const deliv of deliverables) {
    const delivWeight = typeof deliv.weight === "number" && deliv.weight > 0 ? deliv.weight : 1.0;
    const effectiveProgress =
      deliv.status === "APPROVED" || deliv.status === "DELIVERED"
        ? 100
        : Math.min(100, Math.max(0, deliv.progressPercent));

    totalWeight += delivWeight;
    weightedProgressSum += effectiveProgress * delivWeight;
  }

  if (totalWeight <= 0) return 0;

  return Math.round(weightedProgressSum / totalWeight);
}

/**
 * 3. Risk Logic (Deterministic plain rules, no AI):
 * A deliverable is AT_RISK if:
 * - Overdue: dueDate < now and progress < 100%
 * - Due in <= 3 days with < 70% progress
 * - Blocked by an incomplete dependency
 * - Waiting on client approval beyond N days (default 3 days)
 */
export function evaluateDeliverableRisk(
  deliverable: {
    title: string;
    dueDate?: Date | string | null;
    status: string;
    progressPercent: number;
    sentToClientAt?: Date | string | null;
  },
  tasks: ProgressTaskInput[] = [],
  options: { now?: Date; maxClientReviewDays?: number } = {}
): RiskEvaluationResult {
  // If deliverable is already approved or delivered, it cannot be at risk
  if (deliverable.status === "APPROVED" || deliverable.status === "DELIVERED") {
    return { riskStatus: "ON_TRACK", riskReason: null };
  }

  const now = options.now || new Date();
  const maxClientReviewDays = options.maxClientReviewDays ?? 3;

  // Rule A: Overdue
  if (deliverable.dueDate) {
    const dueDate = new Date(deliverable.dueDate);
    if (dueDate.getTime() < now.getTime() && deliverable.progressPercent < 100) {
      const diffMs = now.getTime() - dueDate.getTime();
      const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return {
        riskStatus: "AT_RISK",
        riskReason: `${deliverable.title} is overdue by ${daysOverdue} day(s) (${deliverable.progressPercent}% complete)`,
      };
    }
  }

  // Rule B: Due in <= 3 days with < 70% progress
  if (deliverable.dueDate) {
    const dueDate = new Date(deliverable.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining >= 0 && daysRemaining <= 3 && deliverable.progressPercent < 70) {
      const incompleteCount = tasks.filter((t) => t.status !== "DONE").length;
      return {
        riskStatus: "AT_RISK",
        riskReason: `${deliverable.title} is at risk: ${
          incompleteCount > 0 ? `${incompleteCount} task(s) incomplete and ` : ""
        }due in ${daysRemaining} day(s)`,
      };
    }
  }

  // Rule C: Blocked by an incomplete dependency
  for (const task of tasks) {
    if (task.blockedBy && task.blockedBy.length > 0) {
      for (const dep of task.blockedBy) {
        if (dep.blockingTask && dep.blockingTask.status !== "DONE") {
          return {
            riskStatus: "AT_RISK",
            riskReason: `${deliverable.title} is at risk: blocked by incomplete dependency '${dep.blockingTask.title}'`,
          };
        }
      }
    }
  }

  // Rule D: Waiting on client approval beyond N days
  if (deliverable.status === "SENT_TO_CLIENT" && deliverable.sentToClientAt) {
    const sentDate = new Date(deliverable.sentToClientAt);
    const diffMs = now.getTime() - sentDate.getTime();
    const daysWaiting = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysWaiting >= maxClientReviewDays) {
      return {
        riskStatus: "AT_RISK",
        riskReason: `${deliverable.title} is at risk: waiting on client approval for ${daysWaiting} days`,
      };
    }
  }

  // Rule E: Revision Requested (attention required)
  if (deliverable.status === "REVISION_REQUESTED") {
    return {
      riskStatus: "AT_RISK",
      riskReason: `${deliverable.title} has client revisions requested requiring team rework`,
    };
  }

  return { riskStatus: "ON_TRACK", riskReason: null };
}

/**
 * 4. Transactional Database Recalculator
 * Recalculates deliverable progress, deliverable risk, project progress, and project health
 * inside a database transaction to prevent any number drift.
 */
export async function syncProjectAndDeliverableProgress(
  tx: any,
  organizationId: string,
  projectId: string,
  deliverableId?: string | null
): Promise<{
  projectProgress: number;
  projectHealth: string;
  deliverableProgress?: number;
  deliverableRisk?: RiskEvaluationResult;
}> {
  let updatedDelivProgress: number | undefined;
  let updatedDelivRisk: RiskEvaluationResult | undefined;

  // 1. If deliverableId is given, recalculate its progress and risk from its tasks
  if (deliverableId) {
    const deliverable = await tx.deliverable.findFirst({
      where: { id: deliverableId, organizationId },
      include: {
        tasks: {
          include: {
            blockedBy: {
              include: {
                blockingTask: {
                  select: { id: true, title: true, status: true },
                },
              },
            },
          },
        },
      },
    });

    if (deliverable) {
      const calculatedProgress = calculateDeliverableProgress(
        deliverable.status,
        deliverable.tasks
      );
      const risk = evaluateDeliverableRisk(
        {
          title: deliverable.title,
          dueDate: deliverable.dueDate,
          status: deliverable.status,
          progressPercent: calculatedProgress,
          sentToClientAt: deliverable.sentToClientAt,
        },
        deliverable.tasks
      );

      await tx.deliverable.update({
        where: { id: deliverable.id },
        data: {
          progressPercent: calculatedProgress,
          riskStatus: risk.riskStatus,
          riskReason: risk.riskReason,
        },
      });

      updatedDelivProgress = calculatedProgress;
      updatedDelivRisk = risk;
    }
  }

  // 2. Fetch all deliverables for the project and recalculate project-level progress & health
  const allDeliverables = await tx.deliverable.findMany({
    where: { projectId, organizationId },
    select: {
      id: true,
      status: true,
      weight: true,
      progressPercent: true,
      riskStatus: true,
    },
  });

  const projectProgress = calculateProjectProgress(allDeliverables);
  const hasAtRiskDeliverable = allDeliverables.some((d: any) => d.riskStatus === "AT_RISK");
  const projectHealth = hasAtRiskDeliverable ? "AT_RISK" : "ON_TRACK";

  await tx.project.update({
    where: { id: projectId },
    data: {
      progressPercent: projectProgress,
      health: projectHealth,
    },
  });

  return {
    projectProgress,
    projectHealth,
    deliverableProgress: updatedDelivProgress,
    deliverableRisk: updatedDelivRisk,
  };
}
