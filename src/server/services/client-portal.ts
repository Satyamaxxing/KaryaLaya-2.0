import crypto from "crypto";
import { prisma } from "@/server/db";
import { AuthenticatedUser, createSession } from "@/server/auth";
import { can } from "@/server/permissions";
import { syncProjectAndDeliverableProgress } from "./progress";
import { NotificationService } from "./notification";
import { FileService } from "./files";
import { AutomationService } from "./automations";

/**
 * Maps deliverable machine status to plain-language, client-friendly status strings.
 */
export function mapDeliverablePlainStatus(status: string): string {
  switch (status) {
    case "NOT_STARTED":
      return "In Planning";
    case "IN_PROGRESS":
      return "In Production";
    case "IN_REVIEW":
      return "Internal Quality Review";
    case "SENT_TO_CLIENT":
      return "Ready For Your Review";
    case "REVISION_REQUESTED":
      return "Revisions In Progress";
    case "APPROVED":
      return "Approved";
    case "DELIVERED":
      return "Final Assets Delivered";
    default:
      return status;
  }
}

/**
 * Maps project machine status to plain-language, client-friendly status strings.
 */
export function mapProjectPlainStatus(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Active Campaign";
    case "ON_HOLD":
      return "Paused";
    case "COMPLETED":
      return "Completed";
    case "ARCHIVED":
      return "Archived";
    default:
      return status;
  }
}

export interface ClientFileView {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version: number;
  signedDownloadUrl: string;
  signedPreviewUrl: string;
  createdAt: Date;
}

export interface ClientDeliverableProjection {
  id: string;
  title: string;
  description: string | null;
  serviceType: string;
  dueDate: Date | null;
  status: string;
  plainStatus: string;
  progressPercent: number;
  files: ClientFileView[];
  sentToClientAt: Date | null;
}

export interface ClientCommentProjection {
  id: string;
  authorName: string;
  authorType: string;
  content: string;
  deliverableId: string | null;
  createdAt: Date;
}

export interface ClientActivityProjection {
  id: string;
  actorName: string;
  actorType: string;
  action: string;
  description: string;
  createdAt: Date;
}

export interface ClientProjectDetailProjection {
  id: string;
  name: string;
  description: string | null;
  status: string;
  plainStatus: string;
  progressPercent: number;
  dueDate: Date | null;
  startDate: Date | null;
  clientLastViewedAt: Date | null;
  agency: {
    name: string;
    slug: string;
  };
  client: {
    id: string;
    name: string;
    companyName: string | null;
  };
  deliverables: ClientDeliverableProjection[];
  pendingApprovals: ClientDeliverableProjection[];
  comments: ClientCommentProjection[];
  activity: ClientActivityProjection[];
}

export class ClientPortalService {
  /**
   * Generates a passwordless magic login link for a client contact.
   */
  static async createMagicLink(email: string, origin = ""): Promise<{
    success: boolean;
    magicLinkUrl: string;
    email: string;
    name: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();

    const contact = await prisma.clientContact.findFirst({
      where: { email: cleanEmail },
      include: { client: true, organization: true },
    });

    if (!contact) {
      throw new Error("No client contact found with this email address.");
    }

    if (!contact.client.portalAccessEnabled) {
      throw new Error("Portal access is currently disabled for your organization. Please reach out to your agency manager.");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity

    await prisma.clientContact.update({
      where: { id: contact.id },
      data: {
        magicLinkToken: token,
        magicLinkExpiresAt: expiresAt,
      },
    });

    const magicLinkUrl = `${origin}/api/client/auth/verify?token=${token}`;

    return {
      success: true,
      magicLinkUrl,
      email: contact.email,
      name: contact.name,
    };
  }

  /**
   * Verifies magic link token and produces a secure session cookie token.
   */
  static async verifyMagicLink(token: string): Promise<{
    sessionToken: string;
    contact: {
      id: string;
      email: string;
      name: string;
      organizationId: string;
      organizationName: string;
      clientId: string;
      canApprove: boolean;
    };
  }> {
    if (!token || !token.trim()) {
      throw new Error("Invalid or missing magic link token.");
    }

    const contact = await prisma.clientContact.findFirst({
      where: {
        magicLinkToken: token.trim(),
        magicLinkExpiresAt: { gt: new Date() },
      },
      include: {
        client: true,
        organization: true,
      },
    });

    if (!contact) {
      throw new Error("This magic link has expired or is invalid. Please request a new link.");
    }

    if (!contact.client.portalAccessEnabled) {
      throw new Error("Portal access is currently disabled for your organization.");
    }

    // Invalidate the token to prevent replay
    await prisma.clientContact.update({
      where: { id: contact.id },
      data: {
        magicLinkToken: null,
        magicLinkExpiresAt: null,
      },
    });

    const sessionToken = await createSession({
      organizationId: contact.organizationId,
      clientContactId: contact.id,
      role: "CLIENT",
    });

    return {
      sessionToken,
      contact: {
        id: contact.id,
        email: contact.email,
        name: contact.name,
        organizationId: contact.organizationId,
        organizationName: contact.organization.name,
        clientId: contact.clientId,
        canApprove: contact.canApprove,
      },
    };
  }

  /**
   * Agency Owner/Manager generates or retrieves a shareable portal link for a project.
   */
  static async generateProjectShareLink(
    user: AuthenticatedUser,
    projectId: string,
    origin = ""
  ): Promise<{
    shareToken: string;
    shareUrl: string;
    clientLastViewedAt: Date | null;
  }> {
    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      throw new Error("Unauthorized: Only agency owners and managers can manage project share links.");
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    let shareToken = project.shareToken;
    if (!shareToken) {
      shareToken = crypto.randomBytes(16).toString("hex");
      await prisma.project.update({
        where: { id: project.id },
        data: { shareToken },
      });
    }

    const shareUrl = `${origin}/client/projects/${project.id}?token=${shareToken}`;

    return {
      shareToken,
      shareUrl,
      clientLastViewedAt: project.clientLastViewedAt,
    };
  }

  /**
   * Agency Owner/Manager revokes a project share link.
   */
  static async revokeProjectShareLink(
    user: AuthenticatedUser,
    projectId: string
  ): Promise<{ success: boolean }> {
    if (user.role !== "OWNER" && user.role !== "MANAGER") {
      throw new Error("Unauthorized: Only agency owners and managers can revoke project share links.");
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { shareToken: null },
    });

    return { success: true };
  }

  /**
   * Records client access timestamp when a client views the project.
   */
  static async recordClientView(projectId: string): Promise<void> {
    try {
      await prisma.project.update({
        where: { id: projectId },
        data: { clientLastViewedAt: new Date() },
      });
    } catch {
      // Non-blocking timestamp update
    }
  }

  /**
   * Retrieves scoped list of projects accessible to the client contact.
   * Client NEVER sees projects of other clients or internal agency metrics.
   */
  static async getClientProjects(user: AuthenticatedUser): Promise<{
    agency: { name: string; slug: string };
    client: { id: string; name: string };
    projects: Array<{
      id: string;
      name: string;
      description: string | null;
      status: string;
      plainStatus: string;
      progressPercent: number;
      dueDate: Date | null;
      startDate: Date | null;
      clientLastViewedAt: Date | null;
      deliverableCount: number;
      pendingApprovalsCount: number;
    }>;
    pendingDeliverables: Array<{
      id: string;
      title: string;
      projectName: string;
      projectId: string;
      serviceType: string;
      dueDate: Date | null;
    }>;
    recentUpdates: Array<{
      id: string;
      action: string;
      description: string;
      createdAt: Date;
    }>;
  }> {
    if (user.role !== "CLIENT" && user.role !== "OWNER" && user.role !== "MANAGER") {
      throw new Error("Access denied: Not authorized to view client portal.");
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true, slug: true },
    });

    if (!org) {
      throw new Error("Agency organization not found.");
    }

    // Determine target client ID:
    let targetClientId = user.clientId;

    if (!targetClientId && (user.role === "OWNER" || user.role === "MANAGER")) {
      // In manager preview mode, fetch first client if none specified
      const firstClient = await prisma.client.findFirst({
        where: { organizationId: user.organizationId },
      });
      targetClientId = firstClient?.id;
    }

    if (!targetClientId) {
      return {
        agency: { name: org.name, slug: org.slug },
        client: { id: "", name: "Client" },
        projects: [],
        pendingDeliverables: [],
        recentUpdates: [],
      };
    }

    const clientRecord = await prisma.client.findUnique({
      where: { id: targetClientId },
      select: { id: true, name: true, portalAccessEnabled: true },
    });

    if (!clientRecord || (user.role === "CLIENT" && !clientRecord.portalAccessEnabled)) {
      throw new Error("Client account not found or portal access disabled.");
    }

    // Query projects strictly scoped to this client and organization:
    const projects = await prisma.project.findMany({
      where: {
        organizationId: user.organizationId,
        clientId: targetClientId,
        status: { not: "ARCHIVED" },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        progressPercent: true,
        dueDate: true,
        startDate: true,
        clientLastViewedAt: true,
        deliverables: {
          select: {
            id: true,
            title: true,
            status: true,
            serviceType: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingDeliverables: Array<{
      id: string;
      title: string;
      projectName: string;
      projectId: string;
      serviceType: string;
      dueDate: Date | null;
    }> = [];

    projects.forEach((p) => {
      p.deliverables.forEach((d) => {
        if (d.status === "SENT_TO_CLIENT") {
          pendingDeliverables.push({
            id: d.id,
            title: d.title,
            projectName: p.name,
            projectId: p.id,
            serviceType: d.serviceType,
            dueDate: d.dueDate,
          });
        }
      });
    });

    const projectIds = projects.map((p) => p.id);
    const recentEvents = await prisma.activityEvent.findMany({
      where: {
        organizationId: user.organizationId,
        action: {
          in: [
            "DELIVERABLE_SENT_TO_CLIENT",
            "CLIENT_APPROVED",
            "CLIENT_REVISION_REQUESTED",
            "DELIVERABLE_CREATED",
            "DELIVERABLE_STATUS_UPDATED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const recentUpdates = recentEvents
      .filter((ev) => {
        try {
          const meta = ev.metadata ? JSON.parse(ev.metadata) : {};
          return projectIds.includes(meta.projectId) || projectIds.includes(ev.entityId);
        } catch {
          return false;
        }
      })
      .slice(0, 5)
      .map((ev) => {
        let desc = "Project update";
        if (ev.action === "DELIVERABLE_SENT_TO_CLIENT") desc = "New deliverable ready for your review";
        else if (ev.action === "CLIENT_APPROVED") desc = "Deliverable approved";
        else if (ev.action === "CLIENT_REVISION_REQUESTED") desc = "Revisions requested";
        else if (ev.action === "DELIVERABLE_CREATED") desc = "New deliverable planned";
        return {
          id: ev.id,
          action: ev.action,
          description: desc,
          createdAt: ev.createdAt,
        };
      });

    return {
      agency: { name: org.name, slug: org.slug },
      client: { id: clientRecord.id, name: clientRecord.name },
      projects: projects.map((p) => {
        const pendingApprovalsCount = p.deliverables.filter(
          (d) => d.status === "SENT_TO_CLIENT"
        ).length;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          plainStatus: mapProjectPlainStatus(p.status),
          progressPercent: p.progressPercent,
          dueDate: p.dueDate,
          startDate: p.startDate,
          clientLastViewedAt: p.clientLastViewedAt,
          deliverableCount: p.deliverables.length,
          pendingApprovalsCount,
        };
      }),
      pendingDeliverables,
      recentUpdates,
    };
  }

  /**
   * Retrieves strictly scoped projection for a single project.
   *
   * SECURITY ENFORCEMENT:
   * Client NEVER sees:
   * - Internal comments (filtered to visibility === 'CLIENT_VISIBLE')
   * - Internal tasks, checklist items, task dependencies
   * - Team members' hours, workload, or estimateHours
   * - Assignee internal notes
   * - Risk reasoning ('riskReason' is completely omitted)
   * - AI insights or debug logs
   * - Other clients' projects (direct ID manipulation is strictly blocked)
   */
  static async getClientProjectDetails(
    user: AuthenticatedUser,
    projectId: string,
    shareToken?: string
  ): Promise<ClientProjectDetailProjection> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        client: { select: { id: true, name: true, companyName: true, portalAccessEnabled: true } },
        deliverables: {
          select: {
            id: true,
            title: true,
            description: true,
            serviceType: true,
            dueDate: true,
            status: true,
            progressPercent: true,
            sentToClientAt: true,
            // DO NOT SELECT: riskReason, riskStatus, ownerId, tasks
          },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    // 1. Mandatory Multi-Tenant & Client Isolation Check:
    if (user.role === "CLIENT") {
      if (project.organizationId !== user.organizationId) {
        throw new Error("Access denied: You do not have permission to view this project.");
      }
      if (project.clientId !== user.clientId) {
        throw new Error("Access denied: You do not have permission to view this project.");
      }
      if (!project.client.portalAccessEnabled) {
        throw new Error("Portal access is disabled for your client account.");
      }
    } else if (user.role === "OWNER" || user.role === "MANAGER") {
      if (project.organizationId !== user.organizationId) {
        throw new Error("Access denied: Organization mismatch.");
      }
    } else {
      // Check shareToken if guest
      if (!shareToken || project.shareToken !== shareToken) {
        throw new Error("Access denied: Invalid share token or session.");
      }
    }

    // 2. Record client view timestamp
    await this.recordClientView(project.id);

    // 3. Fetch Deliverable Files (ONLY CLIENT_VISIBLE)
    const deliverableProjections: ClientDeliverableProjection[] = [];

    for (const del of project.deliverables) {
      const clientFiles = await FileService.listFiles(user, { deliverableId: del.id });
      const fileViews: ClientFileView[] = clientFiles.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileSize: f.fileSize,
        fileType: f.fileType,
        version: f.version,
        signedDownloadUrl: f.signedDownloadUrl,
        signedPreviewUrl: f.signedPreviewUrl,
        createdAt: f.createdAt,
      }));

      deliverableProjections.push({
        id: del.id,
        title: del.title,
        description: del.description,
        serviceType: del.serviceType,
        dueDate: del.dueDate,
        status: del.status,
        plainStatus: mapDeliverablePlainStatus(del.status),
        progressPercent: del.progressPercent,
        files: fileViews,
        sentToClientAt: del.sentToClientAt,
      });
    }

    // 4. Fetch Client-Visible Comments (ONLY CLIENT_VISIBLE)
    const comments = await prisma.comment.findMany({
      where: {
        organizationId: project.organizationId,
        projectId: project.id,
        visibility: "CLIENT_VISIBLE",
      },
      select: {
        id: true,
        authorName: true,
        authorType: true,
        content: true,
        deliverableId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 5. Fetch Client-Safe Activity Timeline
    const activityEvents = await prisma.activityEvent.findMany({
      where: {
        organizationId: project.organizationId,
        action: {
          in: [
            "DELIVERABLE_SENT_TO_CLIENT",
            "CLIENT_APPROVED",
            "CLIENT_REVISION_REQUESTED",
            "DELIVERABLE_CREATED",
            "DELIVERABLE_STATUS_UPDATED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const clientActivity: ClientActivityProjection[] = activityEvents
      .filter((ev) => {
        try {
          const meta = ev.metadata ? JSON.parse(ev.metadata) : {};
          return meta.projectId === project.id || ev.entityId === project.id;
        } catch {
          return false;
        }
      })
      .map((ev) => {
        let description = "Project update";
        const meta = ev.metadata ? JSON.parse(ev.metadata) : {};

        if (ev.action === "CLIENT_APPROVED") {
          description = `Approved deliverable: ${meta.title || "Deliverable"}`;
        } else if (ev.action === "CLIENT_REVISION_REQUESTED") {
          description = `Revision requested on: ${meta.title || "Deliverable"}`;
        } else if (ev.action === "DELIVERABLE_SENT_TO_CLIENT") {
          description = `Ready for your review: ${meta.title || "Deliverable"}`;
        } else if (ev.action === "DELIVERABLE_STATUS_UPDATED") {
          description = `Status updated to ${mapDeliverablePlainStatus(meta.nextStatus || "")}`;
        } else if (ev.action === "DELIVERABLE_CREATED") {
          description = `New deliverable planned: ${meta.title || "Deliverable"}`;
        }

        return {
          id: ev.id,
          actorName: meta.clientName || (ev.actorType === "CLIENT" ? "You" : "Agency Team"),
          actorType: ev.actorType,
          action: ev.action,
          description,
          createdAt: ev.createdAt,
        };
      });

    const pendingApprovals = deliverableProjections.filter(
      (d) => d.status === "SENT_TO_CLIENT"
    );

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      plainStatus: mapProjectPlainStatus(project.status),
      progressPercent: project.progressPercent,
      dueDate: project.dueDate,
      startDate: project.startDate,
      clientLastViewedAt: project.clientLastViewedAt,
      agency: {
        name: project.organization.name,
        slug: project.organization.slug,
      },
      client: {
        id: project.client.id,
        name: project.client.name,
        companyName: project.client.companyName,
      },
      deliverables: deliverableProjections,
      pendingApprovals,
      comments,
      activity: clientActivity,
    };
  }

  /**
   * Action: Client Approves Deliverable
   * - deliverable -> APPROVED
   * - project progress recalculated in same transaction
   * - ActivityEvent with actorType: CLIENT
   * - notifications to deliverable owner and project owner
   * - Idempotent & concurrency-safe
   */
  static async approveDeliverableAsClient(
    user: AuthenticatedUser,
    deliverableId: string,
    options?: { note?: string }
  ): Promise<{
    success: boolean;
    alreadyApproved?: boolean;
    stale?: boolean;
    message: string;
    deliverableId: string;
    status: string;
    projectProgress?: number;
  }> {
    if (user.role === "CLIENT" && user.canApprove === false) {
      throw new Error("Unauthorized: Your contact account does not have sign-off permission.");
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        project: {
          include: {
            owner: true,
            client: true,
          },
        },
        owner: true,
      },
    });

    if (!deliverable) {
      throw new Error("Deliverable not found.");
    }

    // Tenant and client isolation check:
    if (user.role === "CLIENT") {
      if (deliverable.organizationId !== user.organizationId) {
        throw new Error("Access denied: Organization mismatch.");
      }
      if (deliverable.project.clientId !== user.clientId) {
        throw new Error("Access denied: You cannot approve deliverables for another client.");
      }
    }

    // 1. Idempotency: Double click / already approved
    if (deliverable.status === "APPROVED") {
      return {
        success: true,
        alreadyApproved: true,
        message: "This deliverable has already been approved.",
        deliverableId: deliverable.id,
        status: "APPROVED",
        projectProgress: deliverable.project.progressPercent,
      };
    }

    // 2. Concurrency Safety: If deliverable is in an incompatible status
    if (deliverable.status !== "SENT_TO_CLIENT" && deliverable.status !== "IN_REVIEW") {
      return {
        success: false,
        stale: true,
        message: `This deliverable is currently in '${mapDeliverablePlainStatus(deliverable.status)}' status and is not awaiting approval. Please refresh your page.`,
        deliverableId: deliverable.id,
        status: deliverable.status,
      };
    }

    // 3. Atomic Database Update & Progress Recalculation
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.deliverable.update({
        where: { id: deliverable.id },
        data: {
          status: "APPROVED",
        },
      });

      // Recalculate progress in the same transaction
      const syncResult = await syncProjectAndDeliverableProgress(
        tx,
        deliverable.organizationId,
        deliverable.projectId,
        deliverable.id
      );

      // Create ActivityEvent with actorType: CLIENT
      await tx.activityEvent.create({
        data: {
          organizationId: deliverable.organizationId,
          actorId: user.id,
          actorType: "CLIENT",
          action: "CLIENT_APPROVED",
          entityType: "DELIVERABLE",
          entityId: deliverable.id,
          metadata: JSON.stringify({
            title: deliverable.title,
            clientName: user.name,
            projectId: deliverable.projectId,
            note: options?.note || null,
          }),
        },
      });

      // If client left an approval note, record as CLIENT_VISIBLE comment
      if (options?.note?.trim()) {
        await tx.comment.create({
          data: {
            organizationId: deliverable.organizationId,
            projectId: deliverable.projectId,
            deliverableId: deliverable.id,
            authorId: user.id,
            authorType: "CLIENT_CONTACT",
            authorName: user.name,
            authorEmail: user.email,
            content: `Approved: ${options.note.trim()}`,
            visibility: "CLIENT_VISIBLE",
          },
        });
      }

      return { updated, syncResult };
    });

    // 4. Notifications to Deliverable Owner and Project Owner
    await NotificationService.createNotification({
      organizationId: deliverable.organizationId,
      recipientId: deliverable.ownerId,
      actorId: user.id,
      actorName: user.name,
      type: "CLIENT_APPROVED",
      title: "Deliverable Approved!",
      message: `${user.name} approved "${deliverable.title}".`,
      entityType: "DELIVERABLE",
      entityId: deliverable.id,
      link: `/app/projects/${deliverable.projectId}`,
    });

    if (deliverable.project.ownerId !== deliverable.ownerId) {
      await NotificationService.createNotification({
        organizationId: deliverable.organizationId,
        recipientId: deliverable.project.ownerId,
        actorId: user.id,
        actorName: user.name,
        type: "CLIENT_APPROVED",
        title: "Deliverable Approved!",
        message: `${user.name} approved "${deliverable.title}" for ${deliverable.project.name}.`,
        entityType: "DELIVERABLE",
        entityId: deliverable.id,
        link: `/app/projects/${deliverable.projectId}`,
      });
    }

    // 5. Fire governed automations (e.g. celebrate approval)
    await AutomationService.processTrigger(deliverable.organizationId, "CLIENT_APPROVED", {
      entityId: deliverable.id,
      deliverableId: deliverable.id,
      projectId: deliverable.projectId,
      title: deliverable.title,
      clientName: user.name,
      ownerId: deliverable.ownerId || undefined,
    }).catch((err) => console.error("Automation execution error:", err));

    return {
      success: true,
      message: `"${deliverable.title}" has been successfully approved.`,
      deliverableId: result.updated.id,
      status: "APPROVED",
      projectProgress: result.syncResult.projectProgress,
    };
  }

  /**
   * Action: Client Requests Revision
   * - comment is strictly required
   * - deliverable -> REVISION_REQUESTED
   * - auto-creates a revision task assigned to deliverable owner with comment attached
   * - ActivityEvent with actorType: CLIENT
   * - notification to deliverable owner and project owner
   */
  static async requestDeliverableRevisionAsClient(
    user: AuthenticatedUser,
    deliverableId: string,
    comment: string
  ): Promise<{
    success: boolean;
    message: string;
    deliverableId: string;
    status: string;
    revisionTaskId?: string;
  }> {
    if (!comment || !comment.trim()) {
      throw new Error("A comment detailing the requested revisions is required.");
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        project: {
          include: {
            owner: true,
            client: true,
          },
        },
        owner: true,
      },
    });

    if (!deliverable) {
      throw new Error("Deliverable not found.");
    }

    // Tenant and client isolation check:
    if (user.role === "CLIENT") {
      if (deliverable.organizationId !== user.organizationId) {
        throw new Error("Access denied: Organization mismatch.");
      }
      if (deliverable.project.clientId !== user.clientId) {
        throw new Error("Access denied: You cannot request revisions for another client's project.");
      }
    }

    // Idempotency: If already REVISION_REQUESTED
    if (deliverable.status === "REVISION_REQUESTED") {
      return {
        success: true,
        message: "Revision has already been requested for this deliverable.",
        deliverableId: deliverable.id,
        status: "REVISION_REQUESTED",
      };
    }

    const cleanComment = comment.trim();

    // Atomic Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update status
      const updated = await tx.deliverable.update({
        where: { id: deliverable.id },
        data: {
          status: "REVISION_REQUESTED",
        },
      });

      // 2. Auto-create revision task assigned to deliverable owner with comment attached
      const revisionTask = await tx.task.create({
        data: {
          organizationId: deliverable.organizationId,
          projectId: deliverable.projectId,
          deliverableId: deliverable.id,
          title: `Client Revision: ${deliverable.title}`,
          description: `Client Feedback:\n"${cleanComment}"`,
          assigneeId: deliverable.ownerId,
          priority: "HIGH",
          status: "TODO",
          order: 0,
        },
      });

      // 3. Recalculate progress and risk in same transaction
      await syncProjectAndDeliverableProgress(
        tx,
        deliverable.organizationId,
        deliverable.projectId,
        deliverable.id
      );

      // 4. Save comment as CLIENT_VISIBLE
      await tx.comment.create({
        data: {
          organizationId: deliverable.organizationId,
          projectId: deliverable.projectId,
          deliverableId: deliverable.id,
          taskId: revisionTask.id,
          authorId: user.id,
          authorType: "CLIENT_CONTACT",
          authorName: user.name,
          authorEmail: user.email,
          content: `Revision Requested: ${cleanComment}`,
          visibility: "CLIENT_VISIBLE",
        },
      });

      // 5. ActivityEvent with actorType: CLIENT
      await tx.activityEvent.create({
        data: {
          organizationId: deliverable.organizationId,
          actorId: user.id,
          actorType: "CLIENT",
          action: "CLIENT_REVISION_REQUESTED",
          entityType: "DELIVERABLE",
          entityId: deliverable.id,
          metadata: JSON.stringify({
            title: deliverable.title,
            clientName: user.name,
            comment: cleanComment,
            taskId: revisionTask.id,
            projectId: deliverable.projectId,
          }),
        },
      });

      return { updated, revisionTask };
    });

    // Notifications to Deliverable Owner and Project Owner
    await NotificationService.createNotification({
      organizationId: deliverable.organizationId,
      recipientId: deliverable.ownerId,
      actorId: user.id,
      actorName: user.name,
      type: "REVISION_REQUESTED",
      title: "Client Requested Revision",
      message: `${user.name} requested changes on "${deliverable.title}": "${cleanComment.slice(0, 80)}"`,
      entityType: "DELIVERABLE",
      entityId: deliverable.id,
      link: `/app/projects/${deliverable.projectId}`,
    });

    if (deliverable.project.ownerId !== deliverable.ownerId) {
      await NotificationService.createNotification({
        organizationId: deliverable.organizationId,
        recipientId: deliverable.project.ownerId,
        actorId: user.id,
        actorName: user.name,
        type: "REVISION_REQUESTED",
        title: "Client Requested Revision",
        message: `${user.name} requested changes on "${deliverable.title}".`,
        entityType: "DELIVERABLE",
        entityId: deliverable.id,
        link: `/app/projects/${deliverable.projectId}`,
      });
    }

    // 5. Fire governed automations (e.g. auto-create revision turnaround task)
    await AutomationService.processTrigger(deliverable.organizationId, "CLIENT_REQUESTED_REVISION", {
      entityId: deliverable.id,
      deliverableId: deliverable.id,
      projectId: deliverable.projectId,
      title: deliverable.title,
      comment: cleanComment,
      ownerId: deliverable.ownerId || undefined,
      clientName: user.name,
    }).catch((err) => console.error("Automation execution error:", err));

    return {
      success: true,
      message: `Revision request for "${deliverable.title}" has been sent to the delivery team.`,
      deliverableId: result.updated.id,
      status: "REVISION_REQUESTED",
      revisionTaskId: result.revisionTask.id,
    };
  }

  /**
   * Action: Client posts a reply message on the project discussion thread.
   */
  static async addClientComment(
    user: AuthenticatedUser,
    projectId: string,
    content: string,
    deliverableId?: string
  ) {
    if (!content || !content.trim()) {
      throw new Error("Message cannot be empty.");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    if (user.role === "CLIENT") {
      if (project.organizationId !== user.organizationId || project.clientId !== user.clientId) {
        throw new Error("Access denied: Cannot post to this project.");
      }
    }

    const comment = await prisma.comment.create({
      data: {
        organizationId: project.organizationId,
        projectId: project.id,
        deliverableId: deliverableId || null,
        authorId: user.id,
        authorType: "CLIENT_CONTACT",
        authorName: user.name,
        authorEmail: user.email,
        content: content.trim(),
        visibility: "CLIENT_VISIBLE",
      },
    });

    // Notify Project Owner
    await NotificationService.createNotification({
      organizationId: project.organizationId,
      recipientId: project.ownerId,
      actorId: user.id,
      actorName: user.name,
      type: "COMMENT",
      title: "New Client Message",
      message: `${user.name} replied in project "${project.name}": "${content.slice(0, 80)}"`,
      entityType: "PROJECT",
      entityId: project.id,
      link: `/app/projects/${project.id}`,
    });

    return comment;
  }
}
