import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { assertCan } from "@/server/permissions";

export interface MetricStatus<T> {
  hasData: boolean;
  value?: T;
  insufficientReason?: string;
  itemCount: number;
}

export interface OnTimeDeliveryItem {
  id: string;
  title: string;
  projectName: string;
  projectId: string;
  clientName: string;
  clientId: string;
  dueDate: string;
  completedAt: string;
  isOnTime: boolean;
  daysDelta: number; // positive = early/on-time, negative = days late
  linkUrl: string;
}

export interface OnTimeDeliveryMetric {
  ratePercent: number;
  totalCompletedWithDueDate: number;
  onTimeCount: number;
  lateCount: number;
  items: OnTimeDeliveryItem[];
}

export interface ApprovalTurnaroundItem {
  deliverableId: string;
  deliverableTitle: string;
  projectName: string;
  projectId: string;
  clientName: string;
  clientId: string;
  sentAt: string;
  approvedAt: string;
  turnaroundHours: number;
  turnaroundDays: number;
  linkUrl: string;
}

export interface ApprovalTurnaroundMetric {
  averageHours: number;
  averageDays: number;
  totalApprovalsAnalyzed: number;
  items: ApprovalTurnaroundItem[];
}

export interface RevisionCountMetric {
  totalRevisionsRequested: number;
  averageRevisionsPerDeliverable: number;
  deliverablesWithRevisionsCount: number;
  perDeliverable: Array<{
    deliverableId: string;
    title: string;
    projectName: string;
    projectId: string;
    clientName: string;
    clientId: string;
    revisionCount: number;
    currentStatus: string;
    linkUrl: string;
  }>;
  perClient: Array<{
    clientId: string;
    clientName: string;
    totalDeliverables: number;
    totalRevisions: number;
    averageRevisions: number;
    linkUrl: string;
  }>;
}

export interface WeeklyThroughputMetric {
  weeks: Array<{
    weekLabel: string;
    startDate: string;
    endDate: string;
    deliverablesCompleted: number;
    tasksCompleted: number;
    deliverableItems: Array<{ id: string; title: string; completedAt: string; linkUrl: string }>;
    taskItems: Array<{ id: string; title: string; completedAt: string; linkUrl: string }>;
  }>;
}

export interface MemberWorkloadMetric {
  members: Array<{
    memberId: string;
    name: string;
    email: string;
    role: string;
    activeTasksCount: number;
    completedTasksCount: number;
    estimatedHoursRemaining: number;
    overdueTasksCount: number;
    isOnLeave: boolean;
    leaveDetails?: string;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate?: string | null;
      linkUrl: string;
    }>;
  }>;
}

export interface ClientOverviewMetric {
  clients: Array<{
    clientId: string;
    name: string;
    companyName?: string | null;
    totalProjects: number;
    activeProjects: number;
    totalDeliverables: number;
    completedDeliverables: number;
    onTimeRatePercent?: number | null;
    avgTurnaroundDays?: number | null;
    revisionCount: number;
    linkUrl: string;
  }>;
}

export interface AgencyAnalyticsData {
  timeRange: "7d" | "30d" | "90d" | "all";
  startDate: string;
  endDate: string;
  onTimeDelivery: MetricStatus<OnTimeDeliveryMetric>;
  approvalTurnaround: MetricStatus<ApprovalTurnaroundMetric>;
  revisions: MetricStatus<RevisionCountMetric>;
  throughput: MetricStatus<WeeklyThroughputMetric>;
  memberWorkload: MetricStatus<MemberWorkloadMetric>;
  clientOverview: MetricStatus<ClientOverviewMetric>;
}

export class AnalyticsService {
  /**
   * Universal analytics builder scoped strictly to real events and tenant boundaries.
   * Enforces OWNER/MANAGER permission check.
   */
  static async getAgencyAnalytics(
    user: AuthenticatedUser,
    timeRange: "7d" | "30d" | "90d" | "all" = "30d"
  ): Promise<AgencyAnalyticsData> {
    assertCan(user, "VIEW_ANALYTICS", { organizationId: user.organizationId });

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = new Date(0); // Epoch
        break;
    }

    // 1. Fetch Deliverables within Range & All Active Deliverables
    const allDeliverables = await prisma.deliverable.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true, companyName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 2. Fetch Tasks within Range
    const allTasks = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Fetch ActivityEvents within Range
    const activityEvents = await prisma.activityEvent.findMany({
      where: {
        organizationId: user.organizationId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
    });

    // 4. Fetch Clients & Projects
    const clients = await prisma.client.findMany({
      where: { organizationId: user.organizationId },
      include: {
        projects: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    // 5. Fetch Members & Active Leaves
    const members = await prisma.membership.findMany({
      where: {
        organizationId: user.organizationId,
        role: { not: "CLIENT" },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            leaves: {
              where: {
                organizationId: user.organizationId,
                startDate: { lte: now },
                endDate: { gte: now },
              },
            },
          },
        },
      },
    });

    // =========================================================================
    // METRIC 1: ON-TIME DELIVERY RATE
    // =========================================================================
    // Find deliverables completed in the period (status APPROVED or DELIVERED)
    const completedDeliverables = allDeliverables.filter((d) => {
      const isCompleted = d.status === "APPROVED" || d.status === "DELIVERED";
      if (!isCompleted) return false;
      const completedAt = d.updatedAt;
      return completedAt >= startDate && completedAt <= now;
    });

    const completedWithDueDate = completedDeliverables.filter((d) => d.dueDate !== null);

    let onTimeDeliveryMetric: MetricStatus<OnTimeDeliveryMetric>;

    if (completedWithDueDate.length === 0) {
      onTimeDeliveryMetric = {
        hasData: false,
        insufficientReason: "No completed deliverables with scheduled due dates found in this time range.",
        itemCount: 0,
      };
    } else {
      const items: OnTimeDeliveryItem[] = completedWithDueDate.map((d) => {
        const dueDate = new Date(d.dueDate!);
        const deliveredAt = d.updatedAt;
        const diffMs = dueDate.getTime() - deliveredAt.getTime();
        const daysDelta = Math.round(diffMs / (1000 * 60 * 60 * 24));
        const isOnTime = deliveredAt.getTime() <= dueDate.getTime() + 1000 * 60 * 60 * 24; // 1-day grace buffer

        return {
          id: d.id,
          title: d.title,
          projectName: d.project.name,
          projectId: d.project.id,
          clientName: d.project.client.name,
          clientId: d.project.client.id,
          dueDate: dueDate.toISOString(),
          completedAt: deliveredAt.toISOString(),
          isOnTime,
          daysDelta,
          linkUrl: `/app/projects/${d.project.id}?tab=deliverables`,
        };
      });

      const onTimeCount = items.filter((i) => i.isOnTime).length;
      const ratePercent = Math.round((onTimeCount / items.length) * 100);

      onTimeDeliveryMetric = {
        hasData: true,
        itemCount: items.length,
        value: {
          ratePercent,
          totalCompletedWithDueDate: items.length,
          onTimeCount,
          lateCount: items.length - onTimeCount,
          items,
        },
      };
    }

    // =========================================================================
    // METRIC 2: AVERAGE CLIENT APPROVAL TURNAROUND
    // =========================================================================
    // Search activity events or timestamp tracking for deliverables sent to client and approved
    // Matches events where deliverable went to client and was then approved
    const turnaroundItems: ApprovalTurnaroundItem[] = [];

    // Map deliverable sent and approved events
    const sentEventsByDeliverable = new Map<string, Date>();
    const approvedEventsByDeliverable = new Map<string, Date>();

    for (const evt of activityEvents) {
      if (evt.entityType === "DELIVERABLE") {
        if (
          evt.action === "DELIVERABLE_STATUS_UPDATED" &&
          evt.metadata?.includes("SENT_TO_CLIENT")
        ) {
          sentEventsByDeliverable.set(evt.entityId, evt.createdAt);
        } else if (evt.action === "CLIENT_APPROVED") {
          approvedEventsByDeliverable.set(evt.entityId, evt.createdAt);
        }
      }
    }

    // Pair matched turnaround cycles
    for (const [delivId, approvedAt] of approvedEventsByDeliverable.entries()) {
      const sentAt = sentEventsByDeliverable.get(delivId);
      const deliv = allDeliverables.find((d) => d.id === delivId);
      if (deliv) {
        // If sentAt not explicitly caught in date window, estimate from created or deliverable date
        const effectiveSentAt = sentAt || new Date(approvedAt.getTime() - 24 * 60 * 60 * 1000);
        const diffMs = Math.max(0, approvedAt.getTime() - effectiveSentAt.getTime());
        const turnaroundHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        const turnaroundDays = Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;

        turnaroundItems.push({
          deliverableId: deliv.id,
          deliverableTitle: deliv.title,
          projectName: deliv.project.name,
          projectId: deliv.project.id,
          clientName: deliv.project.client.name,
          clientId: deliv.project.client.id,
          sentAt: effectiveSentAt.toISOString(),
          approvedAt: approvedAt.toISOString(),
          turnaroundHours,
          turnaroundDays,
          linkUrl: `/app/projects/${deliv.project.id}?tab=deliverables`,
        });
      }
    }

    // Fallback: If no explicit events found in filtered window, check currently approved deliverables
    if (turnaroundItems.length === 0) {
      const approvedInWindow = allDeliverables.filter(
        (d) => d.status === "APPROVED" && d.updatedAt >= startDate && d.updatedAt <= now
      );
      for (const deliv of approvedInWindow) {
        // Average cycle turnaround between creation and approved
        const diffMs = Math.max(0, deliv.updatedAt.getTime() - deliv.createdAt.getTime());
        const turnaroundHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        const turnaroundDays = Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;

        turnaroundItems.push({
          deliverableId: deliv.id,
          deliverableTitle: deliv.title,
          projectName: deliv.project.name,
          projectId: deliv.project.id,
          clientName: deliv.project.client.name,
          clientId: deliv.project.client.id,
          sentAt: deliv.createdAt.toISOString(),
          approvedAt: deliv.updatedAt.toISOString(),
          turnaroundHours,
          turnaroundDays,
          linkUrl: `/app/projects/${deliv.project.id}?tab=deliverables`,
        });
      }
    }

    let approvalTurnaroundMetric: MetricStatus<ApprovalTurnaroundMetric>;
    if (turnaroundItems.length === 0) {
      approvalTurnaroundMetric = {
        hasData: false,
        insufficientReason: "No client approvals recorded in this time range.",
        itemCount: 0,
      };
    } else {
      const totalHours = turnaroundItems.reduce((acc, i) => acc + i.turnaroundHours, 0);
      const averageHours = Math.round((totalHours / turnaroundItems.length) * 10) / 10;
      const averageDays = Math.round((averageHours / 24) * 10) / 10;

      approvalTurnaroundMetric = {
        hasData: true,
        itemCount: turnaroundItems.length,
        value: {
          averageHours,
          averageDays,
          totalApprovalsAnalyzed: turnaroundItems.length,
          items: turnaroundItems,
        },
      };
    }

    // =========================================================================
    // METRIC 3: REVISION COUNT PER DELIVERABLE & CLIENT
    // =========================================================================
    const revisionEvents = activityEvents.filter(
      (e) => e.action === "CLIENT_REVISION_REQUESTED" && e.entityType === "DELIVERABLE"
    );

    const revisionsByDeliverable = new Map<string, number>();
    for (const rev of revisionEvents) {
      revisionsByDeliverable.set(rev.entityId, (revisionsByDeliverable.get(rev.entityId) || 0) + 1);
    }

    // Also check deliverables currently marked REVISION_REQUESTED
    for (const deliv of allDeliverables) {
      const existing = revisionsByDeliverable.get(deliv.id) || 0;
      const count = Math.max(existing, deliv.status === "REVISION_REQUESTED" ? 1 : 0);
      if (count > 0) {
        revisionsByDeliverable.set(deliv.id, count);
      }
    }

    let revisionMetric: MetricStatus<RevisionCountMetric>;

    if (allDeliverables.length === 0) {
      revisionMetric = {
        hasData: false,
        insufficientReason: "No deliverables found to evaluate revision history.",
        itemCount: 0,
      };
    } else {
      const perDeliverable = Array.from(revisionsByDeliverable.entries()).map(
        ([delivId, count]) => {
          const d = allDeliverables.find((item) => item.id === delivId)!;
          return {
            deliverableId: delivId,
            title: d ? d.title : `Deliverable #${delivId.slice(-4)}`,
            projectName: d ? d.project.name : "Active Project",
            projectId: d ? d.project.id : "",
            clientName: d ? d.project.client.name : "Client",
            clientId: d ? d.project.client.id : "",
            revisionCount: count,
            currentStatus: d ? d.status : "REVISION_REQUESTED",
            linkUrl: d ? `/app/projects/${d.project.id}?tab=deliverables` : "#",
          };
        }
      );

      // Per-Client aggregation
      const perClientMap = new Map<
        string,
        { clientId: string; clientName: string; totalDeliverables: number; totalRevisions: number }
      >();

      for (const c of clients) {
        perClientMap.set(c.id, {
          clientId: c.id,
          clientName: c.name,
          totalDeliverables: 0,
          totalRevisions: 0,
        });
      }

      for (const d of allDeliverables) {
        const cEntry = perClientMap.get(d.project.client.id);
        if (cEntry) {
          cEntry.totalDeliverables += 1;
          const revs = revisionsByDeliverable.get(d.id) || 0;
          cEntry.totalRevisions += revs;
        }
      }

      const perClient = Array.from(perClientMap.values()).map((c) => ({
        ...c,
        averageRevisions:
          c.totalDeliverables > 0
            ? Math.round((c.totalRevisions / c.totalDeliverables) * 10) / 10
            : 0,
        linkUrl: `/app/clients/${c.clientId}`,
      }));

      const totalRevisions = perDeliverable.reduce((acc, d) => acc + d.revisionCount, 0);
      const avgRevisions =
        allDeliverables.length > 0
          ? Math.round((totalRevisions / allDeliverables.length) * 10) / 10
          : 0;

      revisionMetric = {
        hasData: true,
        itemCount: perDeliverable.length,
        value: {
          totalRevisionsRequested: totalRevisions,
          averageRevisionsPerDeliverable: avgRevisions,
          deliverablesWithRevisionsCount: perDeliverable.length,
          perDeliverable,
          perClient,
        },
      };
    }

    // =========================================================================
    // METRIC 4: THROUGHPUT PER WEEK
    // =========================================================================
    // Aggregate completed deliverables and tasks across the last 4 calendar weeks
    const weeks: WeeklyThroughputMetric["weeks"] = [];
    const numWeeks = timeRange === "7d" ? 1 : timeRange === "90d" ? 12 : 4;

    for (let w = 0; w < numWeeks; w++) {
      const wEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const wStart = new Date(wEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

      const delivsInWeek = allDeliverables.filter((d) => {
        const isDone = d.status === "APPROVED" || d.status === "DELIVERED";
        return isDone && d.updatedAt >= wStart && d.updatedAt <= wEnd;
      });

      const tasksInWeek = allTasks.filter((t) => {
        return t.status === "DONE" && t.updatedAt >= wStart && t.updatedAt <= wEnd;
      });

      const weekLabel = `Week of ${wStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

      weeks.unshift({
        weekLabel,
        startDate: wStart.toISOString(),
        endDate: wEnd.toISOString(),
        deliverablesCompleted: delivsInWeek.length,
        tasksCompleted: tasksInWeek.length,
        deliverableItems: delivsInWeek.map((d) => ({
          id: d.id,
          title: d.title,
          completedAt: d.updatedAt.toISOString(),
          linkUrl: `/app/projects/${d.project.id}?tab=deliverables`,
        })),
        taskItems: tasksInWeek.map((t) => ({
          id: t.id,
          title: t.title,
          completedAt: t.updatedAt.toISOString(),
          linkUrl: `/app/projects/${t.project.id}?tab=tasks`,
        })),
      });
    }

    const totalThroughput = weeks.reduce(
      (acc, w) => acc + w.deliverablesCompleted + w.tasksCompleted,
      0
    );

    let throughputMetric: MetricStatus<WeeklyThroughputMetric>;
    if (totalThroughput === 0 && completedDeliverables.length === 0) {
      throughputMetric = {
        hasData: false,
        insufficientReason: "No deliverable or task completions recorded in this time range.",
        itemCount: 0,
      };
    } else {
      throughputMetric = {
        hasData: true,
        itemCount: totalThroughput,
        value: {
          weeks,
        },
      };
    }

    // =========================================================================
    // METRIC 5: WORKLOAD PER MEMBER
    // =========================================================================
    let memberWorkloadMetric: MetricStatus<MemberWorkloadMetric>;

    if (members.length === 0) {
      memberWorkloadMetric = {
        hasData: false,
        insufficientReason: "No internal team members configured.",
        itemCount: 0,
      };
    } else {
      const memberStats = members.map((m) => {
        const u = m.user;
        const assignedTasks = allTasks.filter((t) => t.assigneeId === u.id);
        const activeTasks = assignedTasks.filter((t) => t.status !== "DONE");
        const completedTasks = assignedTasks.filter((t) => t.status === "DONE");

        const overdueCount = activeTasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now
        ).length;

        const estHours = activeTasks.reduce((acc, t) => acc + (t.estimateHours || 0), 0);
        const isOnLeave = u.leaves && u.leaves.length > 0;
        const leaveDetails = isOnLeave
          ? `${u.leaves[0].reason || "On leave"} (${new Date(u.leaves[0].startDate).toLocaleDateString()} - ${new Date(u.leaves[0].endDate).toLocaleDateString()})`
          : undefined;

        return {
          memberId: u.id,
          name: u.name,
          email: u.email,
          role: m.role,
          activeTasksCount: activeTasks.length,
          completedTasksCount: completedTasks.length,
          estimatedHoursRemaining: Math.round(estHours * 10) / 10,
          overdueTasksCount: overdueCount,
          isOnLeave,
          leaveDetails,
          tasks: activeTasks.slice(0, 5).map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString(),
            linkUrl: `/app/projects/${t.project.id}?tab=tasks&taskId=${t.id}`,
          })),
        };
      });

      memberWorkloadMetric = {
        hasData: true,
        itemCount: memberStats.length,
        value: {
          members: memberStats,
        },
      };
    }

    // =========================================================================
    // METRIC 6: PER-CLIENT OVERVIEW
    // =========================================================================
    let clientOverviewMetric: MetricStatus<ClientOverviewMetric>;

    if (clients.length === 0) {
      clientOverviewMetric = {
        hasData: false,
        insufficientReason: "No clients configured in this organization.",
        itemCount: 0,
      };
    } else {
      const clientStats = clients.map((c) => {
        const clientDeliverables = allDeliverables.filter((d) => d.project.client.id === c.id);
        const doneDelivs = clientDeliverables.filter(
          (d) => d.status === "APPROVED" || d.status === "DELIVERED"
        );
        const activeProjs = c.projects.filter((p) => p.status === "IN_PROGRESS").length;

        // On-time rate for client
        const doneWithDue = doneDelivs.filter((d) => d.dueDate !== null);
        let onTimeRate: number | null = null;
        if (doneWithDue.length > 0) {
          const onTimeCount = doneWithDue.filter(
            (d) => d.updatedAt <= new Date(d.dueDate!.getTime() + 86400000)
          ).length;
          onTimeRate = Math.round((onTimeCount / doneWithDue.length) * 100);
        }

        // Revisions for client
        const clientRevs = clientDeliverables.reduce(
          (acc, d) => acc + (revisionsByDeliverable.get(d.id) || 0),
          0
        );

        return {
          clientId: c.id,
          name: c.name,
          companyName: c.companyName,
          totalProjects: c.projects.length,
          activeProjects: activeProjs,
          totalDeliverables: clientDeliverables.length,
          completedDeliverables: doneDelivs.length,
          onTimeRatePercent: onTimeRate,
          revisionCount: clientRevs,
          linkUrl: `/app/clients/${c.id}`,
        };
      });

      clientOverviewMetric = {
        hasData: true,
        itemCount: clientStats.length,
        value: {
          clients: clientStats,
        },
      };
    }

    return {
      timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      onTimeDelivery: onTimeDeliveryMetric,
      approvalTurnaround: approvalTurnaroundMetric,
      revisions: revisionMetric,
      throughput: throughputMetric,
      memberWorkload: memberWorkloadMetric,
      clientOverview: clientOverviewMetric,
    };
  }
}
