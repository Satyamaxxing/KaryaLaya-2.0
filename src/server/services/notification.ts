import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";

export interface CreateNotificationOptions {
  organizationId: string;
  recipientId: string;
  actorId?: string;
  actorName?: string;
  type:
    | "ASSIGNMENT"
    | "MENTION"
    | "COMMENT"
    | "DUE_SOON"
    | "OVERDUE"
    | "REVISION_REQUESTED"
    | "CLIENT_APPROVED";
  title: string;
  message: string;
  entityType: "PROJECT" | "DELIVERABLE" | "TASK" | "COMMENT" | "FILE";
  entityId: string;
  link?: string;
  dedupeKey?: string;
}

export class NotificationService {
  /**
   * Parse @mentions from text and resolve to user IDs within the organization
   */
  static async parseMentions(text: string, organizationId: string): Promise<Array<{ id: string; name: string }>> {
    const members = await prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const mentionedUsers: Array<{ id: string; name: string }> = [];

    for (const member of members) {
      const fullName = member.user.name.trim();
      const firstName = fullName.split(" ")[0];

      // Match @FullName or @FirstName
      const fullRegex = new RegExp(`@${fullName}\\b`, "i");
      const firstRegex = new RegExp(`@${firstName}\\b`, "i");

      if (fullRegex.test(text) || firstRegex.test(text)) {
        if (!mentionedUsers.some((u) => u.id === member.user.id)) {
          mentionedUsers.push(member.user);
        }
      }
    }

    return mentionedUsers;
  }

  /**
   * Create an in-app notification with deduplication and email preference check
   */
  static async createNotification(options: CreateNotificationOptions) {
    // 1. Check user preferences
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId: options.recipientId },
    });

    if (pref) {
      if (options.type === "ASSIGNMENT" && !pref.assignmentNotify) return null;
      if (options.type === "MENTION" && !pref.mentionNotify) return null;
      if (options.type === "COMMENT" && !pref.commentNotify) return null;
      if ((options.type === "DUE_SOON" || options.type === "OVERDUE") && !pref.deadlineNotify) return null;
      if (options.type === "CLIENT_APPROVED" && !pref.clientApprovalNotify) return null;
    }

    // 2. Anti-spam Deduplication: Check for an unread notification with same dedupeKey
    const dedupeKey = options.dedupeKey || `${options.recipientId}:${options.type}:${options.entityId}`;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const existing = await prisma.notification.findFirst({
      where: {
        organizationId: options.organizationId,
        recipientId: options.recipientId,
        dedupeKey,
        isRead: false,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (existing) {
      // Suppress duplicate spam alert
      return null;
    }

    // 3. Create fresh notification
    const notification = await prisma.notification.create({
      data: {
        organizationId: options.organizationId,
        recipientId: options.recipientId,
        actorId: options.actorId || null,
        actorName: options.actorName || null,
        type: options.type,
        title: options.title,
        message: options.message,
        entityType: options.entityType,
        entityId: options.entityId,
        link: options.link || null,
        dedupeKey,
        isRead: false,
      },
    });

    // 4. Email delivery placeholder
    const recipientUser = await prisma.user.findUnique({
      where: { id: options.recipientId },
      select: { email: true, name: true },
    });

    if (recipientUser && (!pref || pref.emailNotifications)) {
      console.log(
        `📧 [EMAIL_DISPATCH] To: ${recipientUser.email} | Subject: [KaryaLaya] ${options.title} | Body: ${options.message}`
      );
    }

    return notification;
  }

  /**
   * List notifications for a user
   */
  static async listNotifications(
    userOrId: AuthenticatedUser | string,
    options: { unreadOnly?: boolean; limit?: number } = {}
  ) {
    const recipientId = typeof userOrId === "object" ? userOrId.id : userOrId;
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId,
        ...(options.unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId,
        isRead: false,
      },
    });

    return { notifications, unreadCount };
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(
    notificationIdOrUser: string | AuthenticatedUser,
    maybeUserIdOrNotificationId?: string
  ) {
    let notifId: string;
    let recipientId: string | undefined;

    if (typeof notificationIdOrUser === "object") {
      recipientId = notificationIdOrUser.id;
      notifId = maybeUserIdOrNotificationId!;
    } else {
      notifId = notificationIdOrUser;
      recipientId = maybeUserIdOrNotificationId;
    }

    return prisma.notification.updateMany({
      where: {
        id: notifId,
        ...(recipientId && { recipientId }),
      },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userOrId: AuthenticatedUser | string) {
    const recipientId = typeof userOrId === "object" ? userOrId.id : userOrId;
    return prisma.notification.updateMany({
      where: {
        recipientId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * Get or initialize notification preferences
   */
  static async getPreferences(userOrId: AuthenticatedUser | string) {
    const userId = typeof userOrId === "object" ? userOrId.id : userOrId;
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId,
          emailNotifications: true,
          assignmentNotify: true,
          mentionNotify: true,
          commentNotify: true,
          deadlineNotify: true,
          clientApprovalNotify: true,
        },
      });
    }
    return pref;
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    userOrId: AuthenticatedUser | string,
    data: Partial<{
      emailNotifications: boolean;
      assignmentNotify: boolean;
      mentionNotify: boolean;
      commentNotify: boolean;
      deadlineNotify: boolean;
      dueSoonNotify: boolean;
      clientApprovalNotify: boolean;
    }>
  ) {
    const userId = typeof userOrId === "object" ? userOrId.id : userOrId;
    const deadlineVal = data.deadlineNotify !== undefined ? data.deadlineNotify : data.dueSoonNotify;

    const payload: any = {};
    if (data.emailNotifications !== undefined) payload.emailNotifications = data.emailNotifications;
    if (data.assignmentNotify !== undefined) payload.assignmentNotify = data.assignmentNotify;
    if (data.mentionNotify !== undefined) payload.mentionNotify = data.mentionNotify;
    if (data.commentNotify !== undefined) payload.commentNotify = data.commentNotify;
    if (deadlineVal !== undefined) payload.deadlineNotify = deadlineVal;
    if (data.clientApprovalNotify !== undefined) payload.clientApprovalNotify = data.clientApprovalNotify;

    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        emailNotifications: payload.emailNotifications ?? true,
        assignmentNotify: payload.assignmentNotify ?? true,
        mentionNotify: payload.mentionNotify ?? true,
        commentNotify: payload.commentNotify ?? true,
        deadlineNotify: payload.deadlineNotify ?? true,
        clientApprovalNotify: payload.clientApprovalNotify ?? true,
      },
      update: payload,
    });
  }
}
