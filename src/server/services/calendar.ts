import crypto from "node:crypto";
import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { can } from "@/server/permissions";

export type CalendarEventType =
  | "TASK"
  | "DELIVERABLE"
  | "MILESTONE"
  | "CLIENT_REVIEW"
  | "SOCIAL_POST";

export interface CalendarEvent {
  id: string;
  entityId?: string;
  type: CalendarEventType;
  title: string;
  date: Date;
  endDate?: Date | null;
  status: string;
  priority?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  isCompleted: boolean;
  metadata?: Record<string, any>;
}

export type ConflictType =
  | "MEMBER_OVERLOAD"
  | "DEPENDENCY_ORDER"
  | "UNAPPROVED_PUBLISHING";

export interface CalendarConflictHint {
  id: string;
  type: ConflictType;
  severity: "CRITICAL" | "WARNING";
  title: string;
  reason: string;
  date: Date;
  entityId: string;
  entityType: "TASK" | "DELIVERABLE" | "SOCIAL_POST" | "USER";
  involvedMemberName?: string;
}

export interface CalendarFilters {
  scope?: "PERSONAL" | "TEAM";
  mode?: "PERSONAL" | "TEAM";
  clientId?: string;
  projectId?: string;
  memberId?: string;
  type?: CalendarEventType | "ALL";
  startDate?: string | Date;
  endDate?: string | Date;
}

export class CalendarService {
  /**
   * Fetch unified calendar items across tasks, deliverables, reviews, milestones, and social posts.
   */
  static async getCalendarEvents(
    user: AuthenticatedUser,
    filters: CalendarFilters = {}
  ): Promise<{ events: CalendarEvent[]; conflicts: CalendarConflictHint[] }> {
    if (!can(user, "VIEW_CALENDAR", { organizationId: user.organizationId })) {
      throw new Error("Unauthorized to access calendar.");
    }

    const scope = filters.scope || filters.mode || "TEAM";
    const isPersonal = scope === "PERSONAL";

    // Date range boundaries if specified
    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    const end = filters.endDate ? new Date(filters.endDate) : undefined;

    const events: CalendarEvent[] = [];

    // -----------------------------------------------------------------------
    // 1. TASKS (with due dates)
    // -----------------------------------------------------------------------
    if (!filters.type || filters.type === "ALL" || filters.type === "TASK") {
      const taskWhere: any = {
        organizationId: user.organizationId,
        dueDate: { not: null },
      };

      if (isPersonal) {
        taskWhere.assigneeId = user.id;
      } else if (filters.memberId) {
        taskWhere.assigneeId = filters.memberId;
      }

      if (filters.projectId) {
        taskWhere.projectId = filters.projectId;
      }

      if (filters.clientId) {
        taskWhere.project = { clientId: filters.clientId };
      }

      if (start || end) {
        taskWhere.dueDate = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      }

      const tasks = await prisma.task.findMany({
        where: taskWhere,
        include: {
          project: {
            select: { id: true, name: true, client: { select: { id: true, name: true } } },
          },
          assignee: { select: { id: true, name: true, email: true } },
          deliverable: { select: { id: true, title: true } },
        },
        orderBy: { dueDate: "asc" },
      });

      for (const t of tasks) {
        if (!t.dueDate) continue;
        events.push({
          id: t.id,
          entityId: t.id,
          type: "TASK",
          title: t.title,
          date: t.dueDate,
          status: t.status,
          priority: t.priority,
          projectId: t.projectId,
          projectName: t.project.name,
          clientId: t.project.client.id,
          clientName: t.project.client.name,
          assignee: t.assignee,
          isCompleted: t.status === "DONE",
          metadata: {
            estimateHours: t.estimateHours,
            loggedHours: t.loggedHours,
            deliverableId: t.deliverableId,
            deliverableTitle: t.deliverable?.title,
          },
        });
      }
    }

    // -----------------------------------------------------------------------
    // 2. DELIVERABLES (Deadlines) & CLIENT REVIEW WINDOWS
    // -----------------------------------------------------------------------
    const includeDeliverables = !filters.type || filters.type === "ALL" || filters.type === "DELIVERABLE" || filters.type === "CLIENT_REVIEW";
    if (includeDeliverables) {
      const delivWhere: any = {
        organizationId: user.organizationId,
        dueDate: { not: null },
      };

      if (isPersonal) {
        delivWhere.ownerId = user.id;
      } else if (filters.memberId) {
        delivWhere.ownerId = filters.memberId;
      }

      if (filters.projectId) {
        delivWhere.projectId = filters.projectId;
      }

      if (filters.clientId) {
        delivWhere.project = { clientId: filters.clientId };
      }

      if (start || end) {
        delivWhere.dueDate = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      }

      const deliverables = await prisma.deliverable.findMany({
        where: delivWhere,
        include: {
          project: {
            select: { id: true, name: true, client: { select: { id: true, name: true } } },
          },
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueDate: "asc" },
      });

      for (const d of deliverables) {
        if (!d.dueDate) continue;
        const isClientReview = d.status === "SENT_TO_CLIENT" || d.status === "READY_FOR_REVIEW";

        if (
          !filters.type ||
          filters.type === "ALL" ||
          (filters.type === "CLIENT_REVIEW" && isClientReview) ||
          (filters.type === "DELIVERABLE" && !isClientReview)
        ) {
          events.push({
            id: d.id,
            entityId: d.id,
            type: isClientReview ? "CLIENT_REVIEW" : "DELIVERABLE",
            title: isClientReview ? `[Review Window] ${d.title}` : `[Deliverable] ${d.title}`,
            date: d.dueDate,
            status: d.status,
            projectId: d.projectId,
            projectName: d.project.name,
            clientId: d.project.client.id,
            clientName: d.project.client.name,
            assignee: d.owner,
            isCompleted: d.status === "APPROVED" || d.status === "DELIVERED",
            metadata: {
              serviceType: d.serviceType,
              progressPercent: d.progressPercent,
              riskStatus: d.riskStatus,
              riskReason: d.riskReason,
              isClientReview,
            },
          });
        }
      }
    }

    // -----------------------------------------------------------------------
    // 3. PROJECT MILESTONES (Project target due dates)
    // -----------------------------------------------------------------------
    if (!filters.type || filters.type === "ALL" || filters.type === "MILESTONE") {
      const projWhere: any = {
        organizationId: user.organizationId,
        dueDate: { not: null },
      };

      if (isPersonal) {
        projWhere.ownerId = user.id;
      } else if (filters.memberId) {
        projWhere.ownerId = filters.memberId;
      }

      if (filters.projectId) {
        projWhere.id = filters.projectId;
      }

      if (filters.clientId) {
        projWhere.clientId = filters.clientId;
      }

      if (start || end) {
        projWhere.dueDate = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      }

      const projects = await prisma.project.findMany({
        where: projWhere,
        include: {
          client: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueDate: "asc" },
      });

      for (const p of projects) {
        if (!p.dueDate) continue;
        events.push({
          id: p.id,
          entityId: p.id,
          type: "MILESTONE",
          title: `🏁 Project Milestone: ${p.name}`,
          date: p.dueDate,
          status: p.status,
          projectId: p.id,
          projectName: p.name,
          clientId: p.client.id,
          clientName: p.client.name,
          assignee: p.owner,
          isCompleted: p.status === "COMPLETED",
          metadata: {
            progressPercent: p.progressPercent,
            health: p.health,
          },
        });
      }
    }

    // -----------------------------------------------------------------------
    // 4. SOCIAL POSTS (Scheduled publications)
    // -----------------------------------------------------------------------
    if (!filters.type || filters.type === "ALL" || filters.type === "SOCIAL_POST") {
      const socialWhere: any = {
        organizationId: user.organizationId,
        scheduledAt: { not: null },
      };

      if (isPersonal) {
        socialWhere.assigneeId = user.id;
      } else if (filters.memberId) {
        socialWhere.assigneeId = filters.memberId;
      }

      if (filters.clientId) {
        socialWhere.clientId = filters.clientId;
      }

      if (filters.projectId) {
        socialWhere.projectId = filters.projectId;
      }

      if (start || end) {
        socialWhere.scheduledAt = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      }

      const socialPosts = await prisma.socialPost.findMany({
        where: socialWhere,
        include: {
          client: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: "asc" },
      });

      for (const sp of socialPosts) {
        if (!sp.scheduledAt) continue;
        let platforms = [];
        try {
          platforms = JSON.parse(sp.platforms);
        } catch {
          platforms = [sp.platforms];
        }

        events.push({
          id: sp.id,
          entityId: sp.id,
          type: "SOCIAL_POST",
          title: `📱 ${sp.title || sp.caption.slice(0, 35)}`,
          date: sp.scheduledAt,
          status: sp.status,
          projectId: sp.projectId,
          projectName: sp.project?.name,
          clientId: sp.clientId,
          clientName: sp.client.name,
          assignee: sp.assignee,
          isCompleted: sp.status === "PUBLISHED",
          metadata: {
            platforms,
            caption: sp.caption,
            publishedUrl: sp.publishedUrl,
            publishedAt: sp.publishedAt,
          },
        });
      }
    }

    // Sort all events chronologically
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // -----------------------------------------------------------------------
    // 5. CONFLICT HINTS CALCULATION (Deterministic plain rules)
    // -----------------------------------------------------------------------
    const conflicts = await this.detectConflicts(user, events);

    return { events, conflicts };
  }

  /**
   * Alias for getCalendarEvents for unified calendar queries.
   */
  static async getUnifiedCalendar(
    user: AuthenticatedUser,
    filters: CalendarFilters = {}
  ): Promise<{ events: CalendarEvent[]; conflicts: CalendarConflictHint[] }> {
    return this.getCalendarEvents(user, filters);
  }

  /**
   * Deterministic plain-rule conflict engine:
   * Rule 1: Member with > N tasks due the same day (capacity bottleneck).
   * Rule 2: Deliverable due before its dependency or uncompleted dependent tasks due after deliverable.
   * Rule 3: Social post scheduled date before client/lead approval.
   */
  static async detectConflicts(
    user: AuthenticatedUser,
    activeEvents?: CalendarEvent[]
  ): Promise<CalendarConflictHint[]> {
    const conflicts: CalendarConflictHint[] = [];
    const now = new Date();

    // -------------------------------------------------------------------------
    // Rule 1: Member Overload (> 3 tasks due same day for same member)
    // -------------------------------------------------------------------------
    const tasksDue = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        status: { not: "DONE" },
        dueDate: { not: null },
        assigneeId: { not: null },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Map: `${assigneeId}:${YYYY-MM-DD}` -> Task[]
    const memberDayBuckets = new Map<string, { member: any; date: Date; tasks: any[] }>();

    for (const t of tasksDue) {
      if (!t.dueDate || !t.assigneeId || !t.assignee) continue;
      const d = new Date(t.dueDate);
      const dayKey = `${t.assigneeId}:${d.toISOString().slice(0, 10)}`;

      if (!memberDayBuckets.has(dayKey)) {
        memberDayBuckets.set(dayKey, { member: t.assignee, date: d, tasks: [] });
      }
      memberDayBuckets.get(dayKey)!.tasks.push(t);
    }

    const CAPACITY_LIMIT = 3;
    for (const [, bucket] of memberDayBuckets.entries()) {
      if (bucket.tasks.length > CAPACITY_LIMIT) {
        const dateFormatted = bucket.date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        conflicts.push({
          id: `conflict-overload-${bucket.member.id}-${bucket.date.toISOString().slice(0, 10)}`,
          type: "MEMBER_OVERLOAD",
          severity: "WARNING",
          title: `Member Overload Bottleneck: ${bucket.member.name}`,
          reason: `${bucket.member.name} has ${bucket.tasks.length} tasks due on ${dateFormatted} (threshold: >${CAPACITY_LIMIT} per day).`,
          date: bucket.date,
          entityId: bucket.member.id,
          entityType: "USER",
          involvedMemberName: bucket.member.name,
        });
      }
    }

    // -------------------------------------------------------------------------
    // Rule 2: Deliverable due before its dependency / blocker task
    // -------------------------------------------------------------------------
    // A. Check deliverables with tasks due after the deliverable due date
    const deliverables = await prisma.deliverable.findMany({
      where: {
        organizationId: user.organizationId,
        status: { notIn: ["APPROVED", "DELIVERED"] },
        dueDate: { not: null },
      },
      include: {
        tasks: {
          where: { status: { not: "DONE" }, dueDate: { not: null } },
          select: { id: true, title: true, dueDate: true, status: true },
        },
      },
    });

    for (const d of deliverables) {
      if (!d.dueDate) continue;
      const delivDueDate = new Date(d.dueDate);

      for (const t of d.tasks) {
        if (!t.dueDate) continue;
        const taskDueDate = new Date(t.dueDate);

        if (taskDueDate > delivDueDate) {
          conflicts.push({
            id: `conflict-dep-${d.id}-${t.id}`,
            type: "DEPENDENCY_ORDER",
            severity: "CRITICAL",
            title: `Deliverable Due Before Child Task`,
            reason: `Deliverable '${d.title}' deadline is ${delivDueDate.toLocaleDateString()}, but its child task '${t.title}' is due later on ${taskDueDate.toLocaleDateString()}.`,
            date: delivDueDate,
            entityId: d.id,
            entityType: "DELIVERABLE",
          });
        }
      }
    }

    // B. Check TaskDependency records (Task blocks Task)
    const taskDependencies = await prisma.taskDependency.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        blockingTask: { select: { id: true, title: true, dueDate: true, status: true } },
        dependentTask: { select: { id: true, title: true, dueDate: true, status: true } },
      },
    });

    for (const dep of taskDependencies) {
      const { blockingTask, dependentTask } = dep;
      if (
        blockingTask.dueDate &&
        dependentTask.dueDate &&
        dependentTask.status !== "DONE"
      ) {
        const blockerDue = new Date(blockingTask.dueDate);
        const dependentDue = new Date(dependentTask.dueDate);

        if (dependentDue < blockerDue && blockingTask.status !== "DONE") {
          conflicts.push({
            id: `conflict-dep-task-${dep.id}`,
            type: "DEPENDENCY_ORDER",
            severity: "CRITICAL",
            title: `Dependency Sequence Inversion`,
            reason: `Task '${dependentTask.title}' (due ${dependentDue.toLocaleDateString()}) depends on '${blockingTask.title}' (due ${blockerDue.toLocaleDateString()}), but is scheduled to finish earlier while blocker is incomplete.`,
            date: dependentDue,
            entityId: dependentTask.id,
            entityType: "TASK",
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // Rule 3: Social Post scheduled date before approval
    // -------------------------------------------------------------------------
    const socialPosts = await prisma.socialPost.findMany({
      where: {
        organizationId: user.organizationId,
        scheduledAt: { not: null },
        status: { in: ["IDEA", "COPY", "DESIGN", "INTERNAL_REVIEW", "CLIENT_APPROVAL"] },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    for (const post of socialPosts) {
      if (!post.scheduledAt) continue;
      const scheduledDate = new Date(post.scheduledAt);

      // Conflict if scheduled within the next 48 hours or already in past without approval
      const hoursUntilScheduled = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilScheduled <= 48) {
        const postTitle = post.title || post.caption.slice(0, 30);
        conflicts.push({
          id: `conflict-unapproved-post-${post.id}`,
          type: "UNAPPROVED_PUBLISHING",
          severity: "CRITICAL",
          title: `Publishing Date Before Approval`,
          reason: `Social post '${postTitle}' for ${post.client.name} is scheduled to publish in ${Math.round(hoursUntilScheduled)}h (${scheduledDate.toLocaleDateString()}), but is still in '${post.status}' and lacks client approval.`,
          date: scheduledDate,
          entityId: post.id,
          entityType: "SOCIAL_POST",
        });
      }
    }

    // Sort conflicts by severity (CRITICAL first) then date
    conflicts.sort((a, b) => {
      if (a.severity === "CRITICAL" && b.severity !== "CRITICAL") return -1;
      if (a.severity !== "CRITICAL" && b.severity === "CRITICAL") return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return conflicts;
  }

  /**
   * Ensure user has a persistent calendar token for ICS feed subscription.
   */
  static async ensureCalendarToken(userOrId: AuthenticatedUser | string): Promise<string> {
    const userId = typeof userOrId === "string" ? userOrId : userOrId.id;
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { calendarToken: true },
    });

    if (existing?.calendarToken) {
      return existing.calendarToken;
    }

    // Generate secure random token (at least 32 characters)
    const token = `cal_${userId.slice(-6)}_${Date.now().toString(36)}_${crypto.randomBytes(16).toString("hex")}`;
    await prisma.user.update({
      where: { id: userId },
      data: { calendarToken: token },
    });

    return token;
  }

  /**
   * Generate RFC 5545 standard iCalendar (.ics) string for user's personal feed.
   */
  static async generateIcsFeed(userOrToken: AuthenticatedUser | string): Promise<string> {
    let authUser: AuthenticatedUser;

    if (typeof userOrToken === "string") {
      // Find user by calendarToken or id
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [{ calendarToken: userOrToken }, { id: userOrToken }],
        },
        include: {
          memberships: {
            include: { organization: true },
            take: 1,
          },
        },
      });

      if (!dbUser || dbUser.memberships.length === 0) {
        throw new Error("Invalid calendar token or user not in an organization.");
      }

      const m = dbUser.memberships[0];
      authUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: m.role as any,
        organizationId: m.organizationId,
        organizationName: m.organization.name,
      };
    } else {
      authUser = userOrToken;
    }

    const { events } = await this.getCalendarEvents(authUser, { scope: "PERSONAL" });

    const formatIcsDate = (date: Date): string => {
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const d = new Date(date);
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//KaryaLaya Agency OS//Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:KaryaLaya - ${authUser.name}`,
      "X-WR-TIMEZONE:UTC",
    ];

    for (const evt of events) {
      const dtStart = formatIcsDate(evt.date);
      const dtEnd = evt.endDate ? formatIcsDate(evt.endDate) : formatIcsDate(new Date(evt.date.getTime() + 60 * 60 * 1000));
      const summary = escapeIcsText(evt.title);
      const description = escapeIcsText(
        `Type: ${evt.type}\nStatus: ${evt.status}\nProject: ${evt.projectName || "N/A"}\nClient: ${evt.clientName || "N/A"}`
      );

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:karyalaya-${evt.type.toLowerCase()}-${evt.id}@karyalaya.agency`);
      lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push(`STATUS:${evt.isCompleted ? "COMPLETED" : "CONFIRMED"}`);
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    return lines.join("\r\n") + "\r\n";
  }
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
