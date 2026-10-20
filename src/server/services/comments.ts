import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { NotificationService } from "./notification";

export interface CreateCommentInput {
  projectId?: string | null;
  deliverableId?: string | null;
  taskId?: string | null;
  content: string;
  visibility?: "INTERNAL" | "CLIENT_VISIBLE";
}

export class CommentService {
  /**
   * List comments for a given target entity (project, deliverable, or task)
   */
  static async listComments(
    user: AuthenticatedUser,
    filter: { projectId?: string; deliverableId?: string; taskId?: string }
  ) {
    const isClient = user.role === "CLIENT";

    const comments = await prisma.comment.findMany({
      where: {
        organizationId: user.organizationId,
        ...(filter.taskId && { taskId: filter.taskId }),
        ...(filter.deliverableId && { deliverableId: filter.deliverableId }),
        ...(filter.projectId && { projectId: filter.projectId }),
        ...(isClient && { visibility: "CLIENT_VISIBLE" }),
      },
      orderBy: { createdAt: "asc" },
    });

    return comments;
  }

  /**
   * Post a new comment with @mentions parsing, notifications, and activity logging
   */
  static async createComment(user: AuthenticatedUser, input: CreateCommentInput) {
    if (!input.content || !input.content.trim()) {
      throw new Error("Comment content cannot be empty.");
    }

    if (!input.projectId && !input.deliverableId && !input.taskId) {
      throw new Error("Comment must target a project, deliverable, or task.");
    }

    const visibility = input.visibility === "CLIENT_VISIBLE" ? "CLIENT_VISIBLE" : "INTERNAL";

    // Parse @mentions
    const mentionedUsers = await NotificationService.parseMentions(input.content, user.organizationId);
    const mentionsJson = mentionedUsers.length > 0 ? JSON.stringify(mentionedUsers.map((u) => u.id)) : null;

    // Resolve context for notification link & title
    let targetTitle = "Work Item";
    let targetProjectId = input.projectId || "";
    let targetLink = "/app/dashboard";

    if (input.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: input.taskId, organizationId: user.organizationId },
        include: { project: true },
      });
      if (task) {
        targetTitle = `Task: ${task.title}`;
        targetProjectId = task.projectId;
        targetLink = `/app/projects/${task.projectId}`;

        // Notify task assignee if not the commenter
        if (task.assigneeId && task.assigneeId !== user.id) {
          await NotificationService.createNotification({
            organizationId: user.organizationId,
            recipientId: task.assigneeId,
            actorId: user.id,
            actorName: user.name,
            type: "COMMENT",
            title: `New comment on ${task.title}`,
            message: `${user.name} commented: "${input.content.slice(0, 100)}"`,
            entityType: "TASK",
            entityId: task.id,
            link: targetLink,
          });
        }
      }
    } else if (input.deliverableId) {
      const deliv = await prisma.deliverable.findFirst({
        where: { id: input.deliverableId, organizationId: user.organizationId },
        include: { project: true },
      });
      if (deliv) {
        targetTitle = `Deliverable: ${deliv.title}`;
        targetProjectId = deliv.projectId;
        targetLink = `/app/projects/${deliv.projectId}`;

        // Notify deliverable owner if not the commenter
        if (deliv.ownerId && deliv.ownerId !== user.id) {
          await NotificationService.createNotification({
            organizationId: user.organizationId,
            recipientId: deliv.ownerId,
            actorId: user.id,
            actorName: user.name,
            type: "COMMENT",
            title: `New comment on ${deliv.title}`,
            message: `${user.name} commented: "${input.content.slice(0, 100)}"`,
            entityType: "DELIVERABLE",
            entityId: deliv.id,
            link: targetLink,
          });
        }
      }
    } else if (input.projectId) {
      const proj = await prisma.project.findFirst({
        where: { id: input.projectId, organizationId: user.organizationId },
      });
      if (proj) {
        targetTitle = `Project: ${proj.name}`;
        targetProjectId = proj.id;
        targetLink = `/app/projects/${proj.id}`;

        // Notify project owner if not the commenter
        if (proj.ownerId && proj.ownerId !== user.id) {
          await NotificationService.createNotification({
            organizationId: user.organizationId,
            recipientId: proj.ownerId,
            actorId: user.id,
            actorName: user.name,
            type: "COMMENT",
            title: `New comment on ${proj.name}`,
            message: `${user.name} commented: "${input.content.slice(0, 100)}"`,
            entityType: "PROJECT",
            entityId: proj.id,
            link: targetLink,
          });
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        organizationId: user.organizationId,
        authorId: user.id,
        authorType: user.role === "CLIENT" ? "CLIENT_CONTACT" : "USER",
        authorName: user.name,
        authorEmail: user.email,
        projectId: targetProjectId || null,
        deliverableId: input.deliverableId || null,
        taskId: input.taskId || null,
        content: input.content.trim(),
        visibility,
        mentions: mentionsJson,
      },
    });

    // Notify all mentioned users
    for (const mentioned of mentionedUsers) {
      if (mentioned.id !== user.id) {
        await NotificationService.createNotification({
          organizationId: user.organizationId,
          recipientId: mentioned.id,
          actorId: user.id,
          actorName: user.name,
          type: "MENTION",
          title: `${user.name} mentioned you in ${targetTitle}`,
          message: input.content.slice(0, 150),
          entityType: "COMMENT",
          entityId: comment.id,
          link: targetLink,
        });
      }
    }

    // Write Activity Event
    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: user.role === "CLIENT" ? "CLIENT_CONTACT" : "USER",
        action: "COMMENT_ADDED",
        entityType: input.taskId ? "TASK" : input.deliverableId ? "DELIVERABLE" : "PROJECT",
        entityId: input.taskId || input.deliverableId || input.projectId || comment.id,
        metadata: JSON.stringify({
          commentId: comment.id,
          visibility: comment.visibility,
          authorName: user.name,
          preview: input.content.slice(0, 80),
          description: `${user.name} commented (${visibility}) on ${targetTitle}`,
        }),
      },
    });

    return comment;
  }
}
