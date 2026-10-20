import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { can, assertCan } from "@/server/permissions";

export interface TeamMemberRosterItem {
  id: string; // userId
  membershipId: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  openTasksCount: number;
  hoursThisWeek: number;
  overdueTasksCount: number;
  isCurrentlyOnLeave: boolean;
  currentLeave?: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  } | null;
  upcomingLeaves: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  }>;
  capacityRating: "AVAILABLE" | "HIGH_LOAD" | "ON_LEAVE";
}

export interface RecordLeaveInput {
  userId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
}

export interface AssigneeWorkloadEvaluation {
  userId: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  openTasksCount: number;
  hoursThisWeek: number;
  overdueTasksCount: number;
  isOnLeaveOnTargetDate: boolean;
  activeLeave?: {
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  } | null;
  capacityRating: "AVAILABLE" | "HIGH_LOAD" | "ON_LEAVE";
  warningMessage?: string | null;
}

export class TeamService {
  /**
   * Get complete team roster with workload, capacity, and active/upcoming leave.
   */
  static async getTeamRoster(user: AuthenticatedUser): Promise<TeamMemberRosterItem[]> {
    if (!can(user, "VIEW_TEAM", { organizationId: user.organizationId })) {
      throw new Error("Unauthorized to access team roster.");
    }

    const now = new Date();

    // Start and end of current week (Mon-Sun)
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 1. Memberships
    const memberships = await prisma.membership.findMany({
      where: { organizationId: user.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            leaves: {
              where: {
                organizationId: user.organizationId,
                endDate: { gte: now },
              },
              orderBy: { startDate: "asc" },
            },
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    // 2. Organization tasks
    const allTasks = await prisma.task.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        assigneeId: true,
        status: true,
        dueDate: true,
        loggedHours: true,
        updatedAt: true,
      },
    });

    return memberships.map((m) => {
      const u = m.user;
      const userTasks = allTasks.filter((t) => t.assigneeId === u.id);
      const openTasks = userTasks.filter((t) => t.status !== "DONE");
      const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < now);

      // Hours this week
      const weeklyTasks = userTasks.filter((t) => t.updatedAt >= startOfWeek && t.updatedAt <= endOfWeek);
      const weeklyHours = weeklyTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

      // Leaves
      const currentLeave = u.leaves.find((l) => l.startDate <= now && l.endDate >= now);
      const isCurrentlyOnLeave = Boolean(currentLeave);
      const upcomingLeaves = u.leaves.filter((l) => l.startDate > now).map((l) => ({
        id: l.id,
        startDate: l.startDate,
        endDate: l.endDate,
        reason: l.reason,
      }));

      // Capacity rating
      let capacityRating: "AVAILABLE" | "HIGH_LOAD" | "ON_LEAVE" = "AVAILABLE";
      if (isCurrentlyOnLeave) {
        capacityRating = "ON_LEAVE";
      } else if (openTasks.length >= 5 || weeklyHours >= 30) {
        capacityRating = "HIGH_LOAD";
      }

      return {
        id: u.id,
        membershipId: m.id,
        name: u.name,
        email: u.email,
        role: m.role,
        jobTitle: m.jobTitle,
        openTasksCount: openTasks.length,
        hoursThisWeek: Math.round(weeklyHours * 10) / 10,
        overdueTasksCount: overdueTasks.length,
        isCurrentlyOnLeave,
        currentLeave: currentLeave
          ? {
              id: currentLeave.id,
              startDate: currentLeave.startDate,
              endDate: currentLeave.endDate,
              reason: currentLeave.reason,
            }
          : null,
        upcomingLeaves,
        capacityRating,
      };
    });
  }

  /**
   * Record a member's leave range.
   */
  static async recordLeave(user: AuthenticatedUser, input: RecordLeaveInput) {
    if (!can(user, "MANAGE_LEAVE", { organizationId: user.organizationId, assigneeId: input.userId })) {
      throw new Error("Unauthorized to manage leave for this member.");
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid start or end date.");
    }

    if (startDate > endDate) {
      throw new Error("Leave start date cannot be after end date.");
    }

    // Verify member exists in organization
    const membership = await prisma.membership.findFirst({
      where: { organizationId: user.organizationId, userId: input.userId },
      include: { user: true },
    });

    if (!membership) {
      throw new Error("Member not found in organization.");
    }

    const leave = await prisma.memberLeave.create({
      data: {
        organizationId: user.organizationId,
        userId: input.userId,
        startDate,
        endDate,
        reason: input.reason?.trim() || "Annual Leave",
        status: "APPROVED",
      },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "MEMBER_LEAVE_RECORDED",
        entityType: "USER",
        entityId: input.userId,
        metadata: JSON.stringify({
          memberName: membership.user.name,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: leave.reason,
        }),
      },
    });

    return leave;
  }

  /**
   * Cancel or remove a leave record.
   */
  static async deleteLeave(user: AuthenticatedUser, leaveId: string) {
    const leave = await prisma.memberLeave.findUnique({
      where: { id: leaveId },
    });

    if (!leave || leave.organizationId !== user.organizationId) {
      throw new Error("Leave record not found.");
    }

    if (!can(user, "MANAGE_LEAVE", { organizationId: user.organizationId, assigneeId: leave.userId })) {
      throw new Error("Unauthorized.");
    }

    await prisma.memberLeave.delete({
      where: { id: leaveId },
    });

    return { success: true };
  }

  /**
   * Assignment Helper: Evaluate a candidate member's workload and availability
   * relative to a target task due date.
   */
  static async getMemberWorkload(
    user: AuthenticatedUser,
    memberId: string,
    targetDueDate?: string | Date
  ): Promise<AssigneeWorkloadEvaluation> {
    const membership = await prisma.membership.findFirst({
      where: { organizationId: user.organizationId, userId: memberId },
      include: { user: true },
    });

    if (!membership) {
      throw new Error("Member not found in organization.");
    }

    const now = new Date();
    const targetDate = targetDueDate ? new Date(targetDueDate) : now;

    // Open & overdue tasks
    const tasks = await prisma.task.findMany({
      where: { organizationId: user.organizationId, assigneeId: memberId },
      select: { id: true, status: true, dueDate: true, loggedHours: true },
    });

    const openTasks = tasks.filter((t) => t.status !== "DONE");
    const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < now);
    const hoursThisWeek = tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

    // Check leave covering targetDate
    const overlappingLeave = await prisma.memberLeave.findFirst({
      where: {
        organizationId: user.organizationId,
        userId: memberId,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    const isOnLeaveOnTargetDate = Boolean(overlappingLeave);

    let capacityRating: "AVAILABLE" | "HIGH_LOAD" | "ON_LEAVE" = "AVAILABLE";
    let warningMessage: string | null = null;

    if (isOnLeaveOnTargetDate) {
      capacityRating = "ON_LEAVE";
      const startStr = overlappingLeave!.startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const endStr = overlappingLeave!.endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      warningMessage = `⚠️ ${membership.user.name} is on leave from ${startStr} to ${endStr} (${overlappingLeave!.reason || "Leave"}).`;
    } else if (openTasks.length >= 5) {
      capacityRating = "HIGH_LOAD";
      warningMessage = `⚠️ High workload: ${openTasks.length} open tasks currently assigned.`;
    }

    return {
      userId: memberId,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role,
      jobTitle: membership.jobTitle,
      openTasksCount: openTasks.length,
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      overdueTasksCount: overdueTasks.length,
      isOnLeaveOnTargetDate,
      activeLeave: overlappingLeave
        ? {
            startDate: overlappingLeave.startDate,
            endDate: overlappingLeave.endDate,
            reason: overlappingLeave.reason,
          }
        : null,
      capacityRating,
      warningMessage,
    };
  }

  /**
   * Remove a member from the organization:
   * 1. Reassign their open tasks to a replacement user, or unassign and flag as UNASSIGNED.
   * 2. Reassign their deliverables if replacement provided.
   * 3. Revoke all active sessions for the user in this organization.
   * 4. Delete their membership in this organization.
   * 5. Record ActivityEvent for audit.
   */
  static async removeMember(
    actor: AuthenticatedUser,
    targetUserId: string,
    reassignToUserId?: string
  ) {
    assertCan(actor, "REMOVE_MEMBERS", { organizationId: actor.organizationId });

    if (actor.id === targetUserId) {
      throw new Error("Cannot remove yourself from the organization.");
    }

    const membership = await prisma.membership.findFirst({
      where: { organizationId: actor.organizationId, userId: targetUserId },
      include: { user: true },
    });

    if (!membership) {
      throw new Error("Member not found in this organization.");
    }

    if (membership.role === "OWNER" && actor.role !== "OWNER") {
      throw new Error("Only an Owner can remove another Owner.");
    }

    // 1. Find open tasks
    const openTasks = await prisma.task.findMany({
      where: {
        organizationId: actor.organizationId,
        assigneeId: targetUserId,
        status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
      },
    });

    if (reassignToUserId) {
      await prisma.task.updateMany({
        where: {
          organizationId: actor.organizationId,
          assigneeId: targetUserId,
          status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
        },
        data: {
          assigneeId: reassignToUserId,
          version: { increment: 1 },
        },
      });

      await prisma.deliverable.updateMany({
        where: {
          organizationId: actor.organizationId,
          ownerId: targetUserId,
        },
        data: {
          ownerId: reassignToUserId,
          version: { increment: 1 },
        },
      });
    } else {
      // Unassign open tasks and flag in progressNote
      for (const t of openTasks) {
        await prisma.task.update({
          where: { id: t.id },
          data: {
            assigneeId: null,
            progressNote: `[FLAG: Assignee removed from team] ${t.progressNote || ""}`.trim(),
            version: { increment: 1 },
          },
        });
      }
    }

    // 2. Revoke all active sessions for this user in this organization
    await prisma.session.deleteMany({
      where: {
        organizationId: actor.organizationId,
        userId: targetUserId,
      },
    });

    // 3. Remove membership
    await prisma.membership.delete({
      where: { id: membership.id },
    });

    // 4. Record ActivityEvent for audit
    await prisma.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        actorType: "USER",
        action: "MEMBER_REMOVED",
        entityType: "MEMBERSHIP",
        entityId: membership.id,
        metadata: JSON.stringify({
          removedUserId: targetUserId,
          removedUserName: membership.user.name,
          removedUserEmail: membership.user.email,
          reassignedToUserId: reassignToUserId || null,
          affectedTasksCount: openTasks.length,
        }),
      },
    });

    return {
      success: true,
      removedUserId: targetUserId,
      affectedTasksCount: openTasks.length,
      reassignedToUserId: reassignToUserId || null,
    };
  }
}
