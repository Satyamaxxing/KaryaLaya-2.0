import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { StorageService } from "@/server/storage";
import { NotificationService } from "./notification";

export interface UploadFileInput {
  projectId?: string | null;
  deliverableId?: string | null;
  taskId?: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  buffer?: Buffer;
  visibility?: "INTERNAL" | "CLIENT_VISIBLE";
}

export class FileService {
  /**
   * List files for a given target entity, filtering by visibility for client users
   */
  static async listFiles(
    user: AuthenticatedUser,
    filter: { projectId?: string; deliverableId?: string; taskId?: string }
  ) {
    const isClient = user.role === "CLIENT";

    const files = await prisma.fileAsset.findMany({
      where: {
        organizationId: user.organizationId,
        ...(filter.taskId && { taskId: filter.taskId }),
        ...(filter.deliverableId && { deliverableId: filter.deliverableId }),
        ...(filter.projectId && { projectId: filter.projectId }),
        ...(isClient && { visibility: "CLIENT_VISIBLE" }),
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    });

    // Attach signed URL tokens for secure access
    return files.map((file) => {
      const signedToken = StorageService.generateSignedToken(file.id, user.organizationId, 7200);
      return {
        ...file,
        signedDownloadUrl: `/api/files/${file.id}/download?token=${signedToken}`,
        signedPreviewUrl: `/api/files/${file.id}/download?token=${signedToken}&preview=true`,
      };
    });
  }

  /**
   * Get single file with permission and visibility checks
   */
  static async getFile(user: AuthenticatedUser, fileId: string) {
    const file = await prisma.fileAsset.findUnique({
      where: { id: fileId },
    });

    if (!file || file.organizationId !== user.organizationId) {
      throw new Error("File not found or access denied.");
    }

    if (user.role === "CLIENT" && file.visibility !== "CLIENT_VISIBLE") {
      throw new Error("Access denied: File is internal.");
    }

    const signedToken = StorageService.generateSignedToken(file.id, user.organizationId, 7200);
    return {
      ...file,
      signedDownloadUrl: `/api/files/${file.id}/download?token=${signedToken}`,
      signedPreviewUrl: `/api/files/${file.id}/download?token=${signedToken}&preview=true`,
    };
  }

  /**
   * Upload and register a new file asset
   * Automatically calculates versioning: new upload on same deliverable = new version (v+1)
   */
  static async uploadFile(user: AuthenticatedUser, input: UploadFileInput) {
    if (!input.fileName || !input.fileName.trim()) {
      throw new Error("File name is required.");
    }

    // Validate size and MIME
    StorageService.validateFile(input.fileSize, input.fileType);

    // Resolve deliverable and project context if uploaded to a task
    let resolvedDeliverableId = input.deliverableId || null;
    let resolvedProjectId = input.projectId || null;
    let targetTitle = input.fileName;

    if (input.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        include: { deliverable: true },
      });
      if (task) {
        resolvedProjectId = task.projectId;
        resolvedDeliverableId = task.deliverableId;
        targetTitle = `Task: ${task.title}`;
      }
    } else if (resolvedDeliverableId) {
      const deliv = await prisma.deliverable.findUnique({
        where: { id: resolvedDeliverableId },
      });
      if (deliv) {
        resolvedProjectId = deliv.projectId;
        targetTitle = `Deliverable: ${deliv.title}`;
      }
    }

    // Versioning logic: new upload on same deliverable = new version
    let version = 1;
    if (resolvedDeliverableId) {
      const maxVer = await prisma.fileAsset.aggregate({
        where: {
          deliverableId: resolvedDeliverableId,
          organizationId: user.organizationId,
        },
        _max: { version: true },
      });
      if (maxVer._max.version) {
        version = maxVer._max.version + 1;
      }
    }

    // Default visibility is INTERNAL unless explicitly set to CLIENT_VISIBLE
    const visibility = input.visibility === "CLIENT_VISIBLE" ? "CLIENT_VISIBLE" : "INTERNAL";

    // Save to physical/emulated storage
    const storageResult = await StorageService.saveFile({
      fileName: input.fileName,
      fileSize: input.fileSize,
      fileType: input.fileType,
      organizationId: user.organizationId,
      buffer: input.buffer,
    });

    const fileAsset = await prisma.fileAsset.create({
      data: {
        organizationId: user.organizationId,
        uploaderId: user.id,
        uploaderName: user.name,
        projectId: resolvedProjectId,
        deliverableId: resolvedDeliverableId,
        taskId: input.taskId || null,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileType: input.fileType,
        storageKey: storageResult.storageKey,
        storageUrl: storageResult.storageUrl,
        version,
        visibility,
        virusScanStatus: storageResult.virusScanStatus,
      },
    });

    // Record human-readable append-only activity log
    const actorType = user.role === "CLIENT" ? "CLIENT_CONTACT" : "USER";
    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType,
        action: "FILE_UPLOADED",
        entityType: "FILE",
        entityId: fileAsset.id,
        metadata: JSON.stringify({
          description: `Uploaded file "${input.fileName}" (v${version}, ${visibility}) to ${targetTitle} by ${user.name}`,
          actorName: user.name,
          fileName: input.fileName,
          version,
          fileSize: input.fileSize,
          fileType: input.fileType,
          visibility,
          taskId: input.taskId,
          deliverableId: resolvedDeliverableId,
          projectId: resolvedProjectId,
        }),
      },
    });

    // If uploaded on a task or deliverable by a member, notify project owner or assignee
    if (resolvedProjectId) {
      const project = await prisma.project.findUnique({
        where: { id: resolvedProjectId },
        select: { ownerId: true, name: true },
      });

      if (project && project.ownerId !== user.id) {
        await NotificationService.createNotification({
          organizationId: user.organizationId,
          recipientId: project.ownerId,
          actorId: user.id,
          actorName: user.name,
          type: "COMMENT", // General work item update
          title: `New file uploaded on ${project.name}`,
          message: `${user.name} uploaded ${input.fileName} (v${version})`,
          entityType: "FILE",
          entityId: fileAsset.id,
          link: `/app/projects/${resolvedProjectId}?tab=files`,
        });
      }
    }

    const signedToken = StorageService.generateSignedToken(fileAsset.id, user.organizationId, 7200);
    return {
      ...fileAsset,
      signedDownloadUrl: `/api/files/${fileAsset.id}/download?token=${signedToken}`,
      signedPreviewUrl: `/api/files/${fileAsset.id}/download?token=${signedToken}&preview=true`,
    };
  }

  /**
   * Update visibility of file (e.g. mark CLIENT_VISIBLE)
   * Explicit action required
   */
  static async updateVisibility(
    user: AuthenticatedUser,
    fileId: string,
    visibility: "INTERNAL" | "CLIENT_VISIBLE"
  ) {
    if (user.role === "CLIENT") {
      throw new Error("Clients cannot change file visibility.");
    }

    const file = await prisma.fileAsset.findUnique({
      where: { id: fileId },
    });

    if (!file || file.organizationId !== user.organizationId) {
      throw new Error("File not found or access denied.");
    }

    if (file.visibility === visibility) {
      return file;
    }

    const previousVisibility = file.visibility;
    const updated = await prisma.fileAsset.update({
      where: { id: fileId },
      data: { visibility },
    });

    // Append-only plain language activity log
    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "VISIBILITY_CHANGED",
        entityType: "FILE",
        entityId: file.id,
        metadata: JSON.stringify({
          description: `Visibility of "${file.fileName}" changed from ${previousVisibility} to ${visibility} by ${user.name}`,
          actorName: user.name,
          before: previousVisibility,
          after: visibility,
          fileId: file.id,
          fileName: file.fileName,
          projectId: file.projectId,
        }),
      },
    });

    return updated;
  }

  /**
   * Delete a file asset
   */
  static async deleteFile(user: AuthenticatedUser, fileId: string) {
    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      // Check if user is uploader
      const file = await prisma.fileAsset.findUnique({ where: { id: fileId } });
      if (!file || file.uploaderId !== user.id) {
        throw new Error("You do not have permission to delete this file.");
      }
    }

    const file = await prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!file || file.organizationId !== user.organizationId) {
      throw new Error("File not found or access denied.");
    }

    await prisma.fileAsset.delete({ where: { id: fileId } });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "FILE_DELETED",
        entityType: "FILE",
        entityId: fileId,
        metadata: JSON.stringify({
          description: `Deleted file "${file.fileName}" by ${user.name}`,
          actorName: user.name,
          projectId: file.projectId,
        }),
      },
    });

    return { success: true };
  }
}
