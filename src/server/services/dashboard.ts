import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { SocialMediaService } from "./social-media";

export interface DashboardSocialMetrics {
  scheduledThisWeekCount: number;
  scheduledThisWeek: Array<{
    id: string;
    title: string;
    clientName: string;
    scheduledAt: Date | null;
    platforms: string[];
    status: string;
  }>;
  overdueCount: number;
  overduePosts: Array<{
    id: string;
    title: string;
    clientName: string;
    scheduledAt: Date | null;
    assigneeName: string;
    status: string;
  }>;
  awaitingApprovalCount: number;
}

export interface AttentionDeliverable {
  id: string;
  title: string;
  serviceType: string;
  status: string;
  riskStatus: string;
  riskReason?: string | null;
  progressPercent: number;
  dueDate?: Date | null;
  sentToClientAt?: Date | null;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
}

export interface AttentionTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date | null;
  estimateHours?: number | null;
  loggedHours?: number;
  isRevisionRequested?: boolean;
  assignee?: { id: string; name: string; email: string } | null;
  projectId: string;
  projectName: string;
  deliverableId?: string | null;
  deliverableTitle?: string | null;
}

export interface ActiveProjectSummary {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  progressPercent: number;
  health: string;
  dueDate?: Date | null;
  client: { id: string; name: string };
  deliverablesCount: number;
  completedDeliverablesCount: number;
  tasksCount: number;
  completedTasksCount: number;
}

export interface MemberWorkloadSummary {
  user: { id: string; name: string; email: string };
  role: string;
  jobTitle?: string | null;
  openTasksCount: number;
  loggedHours: number;
  overdueCount: number;
  isIdle: boolean;
}

export interface OwnerDashboardData {
  role: "OWNER" | "MANAGER";
  user: { id: string; name: string; email: string; role: string };
  organizationName: string;
  needsAttention: {
    clientApprovalsPending: AttentionDeliverable[];
    deliverablesAtRisk: AttentionDeliverable[];
    overdueTasks: AttentionTask[];
    waitingReviewTasks: AttentionTask[];
    dueThisWeekTasks: AttentionTask[];
  };
  activeProjects: ActiveProjectSummary[];
  teamWorkload: MemberWorkloadSummary[];
  recentActivity: Array<{
    id: string;
    actorId: string;
    actorType: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: string | null;
    createdAt: Date;
  }>;
  socialMetrics: DashboardSocialMetrics;
}

export interface MemberDashboardData {
  role: "MEMBER";
  user: { id: string; name: string; email: string; role: string };
  organizationName: string;
  myTasksToday: AttentionTask[];
  overdueTasks: AttentionTask[];
  revisionsRequested: AttentionTask[];
  upcomingDeadlines: AttentionTask[];
  recentlyApproved: Array<{
    id: string;
    type: "TASK" | "DELIVERABLE";
    title: string;
    projectName: string;
    completedAt: Date;
  }>;
  socialMetrics: DashboardSocialMetrics;
}

export type DashboardResponseData = OwnerDashboardData | MemberDashboardData;

export class DashboardService {
  static async getDashboardData(user: AuthenticatedUser): Promise<DashboardResponseData> {
    if (user.role === "OWNER" || user.role === "MANAGER") {
      return this.getOwnerDashboardData(user);
    }
    return this.getMemberDashboardData(user);
  }

  private static async getOwnerDashboardData(user: AuthenticatedUser): Promise<OwnerDashboardData> {
    const now = new Date();

    // 1. Client Approvals Pending (deliverables sent to client)
    const approvalsPendingDb = await prisma.deliverable.findMany({
      where: {
        organizationId: user.organizationId,
        status: "SENT_TO_CLIENT",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const clientApprovalsPending: AttentionDeliverable[] = approvalsPendingDb.map((d) => ({
      id: d.id,
      title: d.title,
      serviceType: d.serviceType,
      status: d.status,
      riskStatus: d.riskStatus,
      riskReason: d.riskReason,
      progressPercent: d.progressPercent,
      dueDate: d.dueDate,
      sentToClientAt: d.sentToClientAt,
      projectId: d.project.id,
      projectName: d.project.name,
      clientId: d.project.client.id,
      clientName: d.project.client.name,
    }));

    // 2. Deliverables At Risk
    const deliverablesAtRiskDb = await prisma.deliverable.findMany({
      where: {
        organizationId: user.organizationId,
        riskStatus: "AT_RISK",
        status: { notIn: ["APPROVED", "DELIVERED"] },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const deliverablesAtRisk: AttentionDeliverable[] = deliverablesAtRiskDb.map((d) => ({
      id: d.id,
      title: d.title,
      serviceType: d.serviceType,
      status: d.status,
      riskStatus: d.riskStatus,
      riskReason: d.riskReason,
      progressPercent: d.progressPercent,
      dueDate: d.dueDate,
      sentToClientAt: d.sentToClientAt,
      projectId: d.project.id,
      projectName: d.project.name,
      clientId: d.project.client.id,
      clientName: d.project.client.name,
    }));

    // 3. Overdue Tasks
    const overdueTasksDb = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        status: { not: "DONE" },
        dueDate: { lt: now },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const overdueTasks: AttentionTask[] = overdueTasksDb.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      estimateHours: t.estimateHours,
      loggedHours: t.loggedHours,
      isRevisionRequested: Boolean(t.isRevisionRequested),
      assignee: t.assignee,
      projectId: t.project.id,
      projectName: t.project.name,
      deliverableId: t.deliverable?.id || null,
      deliverableTitle: t.deliverable?.title || null,
    }));

    // 4. Waiting Review Tasks
    const waitingReviewTasksDb = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        status: "IN_REVIEW",
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const waitingReviewTasks: AttentionTask[] = waitingReviewTasksDb.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      estimateHours: t.estimateHours,
      loggedHours: t.loggedHours,
      isRevisionRequested: Boolean(t.isRevisionRequested),
      assignee: t.assignee,
      projectId: t.project.id,
      projectName: t.project.name,
      deliverableId: t.deliverable?.id || null,
      deliverableTitle: t.deliverable?.title || null,
    }));

    // 4b. Due This Week Tasks (between now and now + 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueThisWeekTasksDb = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        status: { not: "DONE" },
        dueDate: { gte: now, lte: sevenDaysFromNow },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const dueThisWeekTasks: AttentionTask[] = dueThisWeekTasksDb.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      estimateHours: t.estimateHours,
      loggedHours: t.loggedHours,
      isRevisionRequested: Boolean(t.isRevisionRequested),
      assignee: t.assignee,
      projectId: t.project.id,
      projectName: t.project.name,
      deliverableId: t.deliverable?.id || null,
      deliverableTitle: t.deliverable?.title || null,
    }));

    // 5. Active Projects
    const activeProjectsDb = await prisma.project.findMany({
      where: {
        organizationId: user.organizationId,
        status: "ACTIVE",
      },
      include: {
        client: { select: { id: true, name: true } },
        deliverables: { select: { id: true, status: true } },
        tasks: { select: { id: true, status: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const activeProjects: ActiveProjectSummary[] = activeProjectsDb.map((p) => {
      const completedDeliverables = p.deliverables.filter(
        (d) => d.status === "APPROVED" || d.status === "DELIVERED"
      ).length;
      const completedTasks = p.tasks.filter((t) => t.status === "DONE").length;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        progressPercent: p.progressPercent,
        health: p.health,
        dueDate: p.dueDate,
        client: p.client,
        deliverablesCount: p.deliverables.length,
        completedDeliverablesCount: completedDeliverables,
        tasksCount: p.tasks.length,
        completedTasksCount: completedTasks,
      };
    });

    // 6. Team Workload
    const memberships = await prisma.membership.findMany({
      where: { organizationId: user.organizationId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { role: "asc" },
    });

    const allOrgTasks = await prisma.task.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        assigneeId: true,
        status: true,
        dueDate: true,
        loggedHours: true,
      },
    });

    const teamWorkload: MemberWorkloadSummary[] = memberships.map((m) => {
      const userTasks = allOrgTasks.filter((t) => t.assigneeId === m.userId);
      const openTasks = userTasks.filter((t) => t.status !== "DONE");
      const overdueTasksForMember = openTasks.filter((t) => t.dueDate && t.dueDate < now);
      const totalLoggedHours = userTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

      return {
        user: m.user,
        role: m.role,
        jobTitle: m.jobTitle,
        openTasksCount: openTasks.length,
        loggedHours: Math.round(totalLoggedHours * 10) / 10,
        overdueCount: overdueTasksForMember.length,
        isIdle: openTasks.length === 0,
      };
    });

    // 7. Recent Activity (last 20 events)
    const recentActivity = await prisma.activityEvent.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        actorId: true,
        actorType: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
    });

    return {
      role: user.role as "OWNER" | "MANAGER",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organizationName: user.organizationName,
      needsAttention: {
        clientApprovalsPending,
        deliverablesAtRisk,
        overdueTasks,
        waitingReviewTasks,
        dueThisWeekTasks,
      },
      activeProjects,
      teamWorkload,
      recentActivity,
      socialMetrics: await SocialMediaService.getDashboardSocialMetrics(user),
    };
  }

  private static async getMemberDashboardData(user: AuthenticatedUser): Promise<MemberDashboardData> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. My tasks today
    const myTasksTodayDb = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
        status: { not: "DONE" },
        dueDate: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true, serviceType: true } },
      },
      orderBy: { priority: "desc" },
    });

    const myTasksToday: AttentionTask[] = myTasksTodayDb.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      estimateHours: t.estimateHours,
      loggedHours: t.loggedHours,
      isRevisionRequested: Boolean(t.isRevisionRequested),
      projectId: t.project.id,
      projectName: t.project.name,
      deliverableId: t.deliverable?.id || null,
      deliverableTitle: t.deliverable?.title || null,
    }));

    // 2. Overdue tasks
    const overdueTasksDb = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
        status: { not: "DONE" },
        dueDate: { lt: startOfToday },
      },
      include: {
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true, serviceType: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const overdueTasks: AttentionTask[] = overdueTasksDb.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      estimateHours: t.estimateHours,
      loggedHours: t.loggedHours,
      isRevisionRequested: Boolean(t.isRevisionRequested),
      projectId: t.project.id,
      projectName: t.project.name,
      deliverableId: t.deliverable?.id || null,
      deliverableTitle: t.deliverable?.title || null,
    }));

    // 3. Revisions requested
    const revisionsRequestedDb = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
        status: { not: "DONE" },
        isRevisionRequested: true,
      },
      include: {
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true, serviceType: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const revisionsRequested: AttentionTask[] = revisionsRequestedDb.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      estimateHours: t.estimateHours,
      loggedHours: t.loggedHours,
      isRevisionRequested: true,
      projectId: t.project.id,
      projectName: t.project.name,
      deliverableId: t.deliverable?.id || null,
      deliverableTitle: t.deliverable?.title || null,
    }));

    // 4. Upcoming deadlines
    const upcomingDeadlinesDb = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
        status: { not: "DONE" },
        dueDate: { gt: endOfToday },
      },
      include: {
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true, serviceType: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    const upcomingDeadlines: AttentionTask[] = upcomingDeadlinesDb.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      estimateHours: t.estimateHours,
      loggedHours: t.loggedHours,
      isRevisionRequested: Boolean(t.isRevisionRequested),
      projectId: t.project.id,
      projectName: t.project.name,
      deliverableId: t.deliverable?.id || null,
      deliverableTitle: t.deliverable?.title || null,
    }));

    // 5. Recently approved work (Done tasks + Approved deliverables)
    const recentlyApprovedTasks = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
        status: "DONE",
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const recentlyApprovedDeliverables = await prisma.deliverable.findMany({
      where: {
        organizationId: user.organizationId,
        ownerId: user.id,
        status: { in: ["APPROVED", "DELIVERED"] },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const recentlyApproved: Array<{
      id: string;
      type: "TASK" | "DELIVERABLE";
      title: string;
      projectName: string;
      completedAt: Date;
    }> = [
      ...recentlyApprovedTasks.map((t) => ({
        id: t.id,
        type: "TASK" as const,
        title: t.title,
        projectName: t.project.name,
        completedAt: t.updatedAt,
      })),
      ...recentlyApprovedDeliverables.map((d) => ({
        id: d.id,
        type: "DELIVERABLE" as const,
        title: d.title,
        projectName: d.project.name,
        completedAt: d.updatedAt,
      })),
    ].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()).slice(0, 8);

    return {
      role: "MEMBER",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organizationName: user.organizationName,
      myTasksToday,
      overdueTasks,
      revisionsRequested,
      upcomingDeadlines,
      recentlyApproved,
      socialMetrics: await SocialMediaService.getDashboardSocialMetrics(user),
    };
  }
}
