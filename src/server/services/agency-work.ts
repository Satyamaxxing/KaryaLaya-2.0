import { prisma } from "../db";
import { AuthenticatedUser } from "../auth/session";
import { assertCan } from "../permissions";
import {
  DeliverableStatus,
  ServiceType,
  assertValidDeliverableTransition,
} from "./deliverable-state-machine";
import { getProjectTemplate } from "./project-templates";
import { syncProjectAndDeliverableProgress } from "./progress";
import { AutomationService } from "./automations";

export interface CreateClientInput {
  name: string;
  companyName?: string;
  industry?: string;
  portalAccessEnabled?: boolean;
}

export interface UpdateClientInput {
  name?: string;
  companyName?: string;
  industry?: string;
  portalAccessEnabled?: boolean;
}

export interface CreateClientContactInput {
  name: string;
  email: string;
  title?: string;
  canApprove?: boolean;
}

export interface CreateProjectInput {
  clientId: string;
  name: string;
  description?: string;
  status?: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  startDate?: string | Date;
  dueDate?: string | Date;
  ownerId?: string;
  templateId?: string; // Optional template to generate deliverables and tasks
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  ownerId?: string;
}

export interface CreateDeliverableInput {
  projectId: string;
  title: string;
  description?: string;
  serviceType: ServiceType;
  ownerId?: string;
  dueDate?: string | Date;
  weight?: number;
}

export interface UpdateDeliverableInput {
  title?: string;
  description?: string;
  serviceType?: ServiceType;
  ownerId?: string;
  dueDate?: string | Date | null;
  weight?: number;
  progressPercent?: number;
  expectedVersion?: number;
}

export interface CreateTaskInput {
  projectId: string;
  deliverableId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate?: string | Date;
  dueDate?: string | Date;
  estimateHours?: number;
  order?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  estimateHours?: number | null;
  loggedHours?: number;
  order?: number;
  progressNote?: string | null;
  isRevisionRequested?: boolean;
  expectedVersion?: number;
}

export class AgencyWorkService {
  /* ========================================================================
   * 1. CLIENTS
   * ======================================================================== */

  static async listClients(user: AuthenticatedUser, options?: { includeArchived?: boolean }) {
    return prisma.client.findMany({
      where: {
        organizationId: user.organizationId,
        ...(options?.includeArchived ? {} : { isArchived: false }),
      },
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
            canApprove: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async archiveClient(user: AuthenticatedUser, clientId: string) {
    assertCan(user, "CREATE_CLIENT", { organizationId: user.organizationId });
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
    });
    if (!client) throw new Error("Client not found.");

    return prisma.client.update({
      where: { id: clientId },
      data: { isArchived: true, archivedAt: new Date() },
    });
  }

  static async unarchiveClient(user: AuthenticatedUser, clientId: string) {
    assertCan(user, "CREATE_CLIENT", { organizationId: user.organizationId });
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
    });
    if (!client) throw new Error("Client not found.");

    return prisma.client.update({
      where: { id: clientId },
      data: { isArchived: false, archivedAt: null },
    });
  }

  static async getClientById(user: AuthenticatedUser, clientId: string) {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: user.organizationId,
      },
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
            canApprove: true,
            createdAt: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            dueDate: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            deliverables: {
              select: {
                id: true,
                title: true,
                status: true,
                progressPercent: true,
                riskStatus: true,
                riskReason: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return client;
  }

  static async createClient(user: AuthenticatedUser, input: CreateClientInput) {
    assertCan(user, "CREATE_CLIENT", { organizationId: user.organizationId });

    if (!input.name || !input.name.trim()) {
      throw new Error("Client name is required.");
    }

    const client = await prisma.client.create({
      data: {
        organizationId: user.organizationId,
        name: input.name.trim(),
        companyName: input.companyName?.trim() || input.name.trim(),
        industry: input.industry?.trim() || null,
        portalAccessEnabled: input.portalAccessEnabled ?? true,
      },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "CLIENT_CREATED",
        entityType: "CLIENT",
        entityId: client.id,
        metadata: JSON.stringify({
          clientName: client.name,
          companyName: client.companyName,
          portalAccessEnabled: client.portalAccessEnabled,
        }),
      },
    });

    return client;
  }

  static async updateClient(user: AuthenticatedUser, clientId: string, input: UpdateClientInput) {
    assertCan(user, "UPDATE_CLIENT", { organizationId: user.organizationId });

    const existing = await prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
    });

    if (!existing) {
      throw new Error("Client not found.");
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.companyName !== undefined && { companyName: input.companyName.trim() }),
        ...(input.industry !== undefined && { industry: input.industry.trim() }),
        ...(input.portalAccessEnabled !== undefined && {
          portalAccessEnabled: input.portalAccessEnabled,
        }),
      },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "CLIENT_UPDATED",
        entityType: "CLIENT",
        entityId: updated.id,
        metadata: JSON.stringify({
          updatedFields: Object.keys(input),
          portalAccessEnabled: updated.portalAccessEnabled,
        }),
      },
    });

    return updated;
  }

  static async addClientContact(
    user: AuthenticatedUser,
    clientId: string,
    input: CreateClientContactInput
  ) {
    assertCan(user, "UPDATE_CLIENT", { organizationId: user.organizationId });

    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
    });
    if (!client) {
      throw new Error("Client not found.");
    }

    const contact = await prisma.clientContact.create({
      data: {
        organizationId: user.organizationId,
        clientId: client.id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        title: input.title?.trim() || null,
        canApprove: input.canApprove ?? true,
      },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "CLIENT_CONTACT_ADDED",
        entityType: "CLIENT",
        entityId: client.id,
        metadata: JSON.stringify({
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
        }),
      },
    });

    return contact;
  }

  /* ========================================================================
   * 2. PROJECTS
   * ======================================================================== */

  static async listProjects(
    user: AuthenticatedUser,
    filters?: { clientId?: string; status?: string; ownerId?: string; includeArchived?: boolean }
  ) {
    const where: any = {
      organizationId: user.organizationId,
      ...(filters?.includeArchived ? {} : { isArchived: false }),
    };

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }

    return prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deliverables: {
          select: {
            id: true,
            title: true,
            serviceType: true,
            status: true,
            progressPercent: true,
            weight: true,
            riskStatus: true,
            riskReason: true,
            dueDate: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getProjectById(user: AuthenticatedUser, projectId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId,
      },
      include: {
        client: {
          include: {
            contacts: {
              select: {
                id: true,
                name: true,
                email: true,
                title: true,
                canApprove: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deliverables: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tasks: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                subtasks: {
                  orderBy: { order: "asc" },
                },
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
          orderBy: { createdAt: "asc" },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            deliverable: {
              select: {
                id: true,
                title: true,
                serviceType: true,
              },
            },
            subtasks: {
              orderBy: { order: "asc" },
            },
            blockedBy: {
              include: {
                blockingTask: {
                  select: { id: true, title: true, status: true },
                },
              },
            },
            blocking: {
              include: {
                dependentTask: {
                  select: { id: true, title: true, status: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return project;
  }

  static async createProject(user: AuthenticatedUser, input: CreateProjectInput) {
    assertCan(user, "CREATE_PROJECT", { organizationId: user.organizationId });

    if (!input.name || !input.name.trim()) {
      throw new Error("Project name is required.");
    }
    if (!input.clientId) {
      throw new Error("Client selection is required.");
    }

    const client = await prisma.client.findFirst({
      where: { id: input.clientId, organizationId: user.organizationId },
    });
    if (!client) {
      throw new Error("Specified client does not exist in this organization.");
    }

    const projectOwnerId = input.ownerId || user.id;
    const template = input.templateId ? getProjectTemplate(input.templateId) : null;

    const project = await prisma.$transaction(async (tx) => {
      const newProj = await tx.project.create({
        data: {
          organizationId: user.organizationId,
          clientId: client.id,
          name: input.name.trim(),
          description: input.description?.trim() || template?.description || null,
          status: input.status || "ACTIVE",
          startDate: input.startDate ? new Date(input.startDate) : new Date(),
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          ownerId: projectOwnerId,
        },
      });

      if (template) {
        for (const delivTpl of template.deliverables) {
          const deliverable = await tx.deliverable.create({
            data: {
              organizationId: user.organizationId,
              projectId: newProj.id,
              title: delivTpl.title,
              description: delivTpl.description || null,
              serviceType: delivTpl.serviceType,
              ownerId: projectOwnerId,
              weight: delivTpl.weight,
              status: "NOT_STARTED",
              progressPercent: 0,
            },
          });

          for (const taskTpl of delivTpl.tasks) {
            await tx.task.create({
              data: {
                organizationId: user.organizationId,
                projectId: newProj.id,
                deliverableId: deliverable.id,
                title: taskTpl.title,
                status: "TODO",
                priority: taskTpl.priority || "MEDIUM",
                estimateHours: 4.0,
              },
            });
          }
        }
      }

      await syncProjectAndDeliverableProgress(tx, user.organizationId, newProj.id, null);

      await tx.activityEvent.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          actorType: "USER",
          action: "PROJECT_CREATED",
          entityType: "PROJECT",
          entityId: newProj.id,
          metadata: JSON.stringify({
            projectName: newProj.name,
            clientId: client.id,
            clientName: client.name,
            templateId: input.templateId || null,
            templateName: template?.name || null,
          }),
        },
      });

      return newProj;
    });

    return project;
  }

  static async updateProject(user: AuthenticatedUser, projectId: string, input: UpdateProjectInput) {
    assertCan(user, "UPDATE_PROJECT", { organizationId: user.organizationId });

    const existing = await prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
    });
    if (!existing) {
      throw new Error("Project not found.");
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.startDate !== undefined && {
          startDate: input.startDate ? new Date(input.startDate) : null,
        }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
        ...(input.ownerId !== undefined && { ownerId: input.ownerId }),
      },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "PROJECT_UPDATED",
        entityType: "PROJECT",
        entityId: updated.id,
        metadata: JSON.stringify({
          updatedFields: Object.keys(input),
          status: updated.status,
        }),
      },
    });

    return updated;
  }

  static async archiveProject(user: AuthenticatedUser, projectId: string) {
    assertCan(user, "UPDATE_PROJECT", { organizationId: user.organizationId });
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
    });
    if (!project) throw new Error("Project not found.");

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { isArchived: true, archivedAt: new Date() },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "PROJECT_ARCHIVED",
        entityType: "PROJECT",
        entityId: project.id,
        metadata: JSON.stringify({ projectName: project.name }),
      },
    });

    return updated;
  }

  static async unarchiveProject(user: AuthenticatedUser, projectId: string) {
    assertCan(user, "UPDATE_PROJECT", { organizationId: user.organizationId });
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
    });
    if (!project) throw new Error("Project not found.");

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { isArchived: false, archivedAt: null },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "PROJECT_UNARCHIVED",
        entityType: "PROJECT",
        entityId: project.id,
        metadata: JSON.stringify({ projectName: project.name }),
      },
    });

    return updated;
  }

  /* ========================================================================
   * 3. DELIVERABLES
   * ======================================================================== */

  static async createDeliverable(user: AuthenticatedUser, input: CreateDeliverableInput) {
    assertCan(user, "CREATE_DELIVERABLE", { organizationId: user.organizationId });

    if (!input.title || !input.title.trim()) {
      throw new Error("Deliverable title is required.");
    }
    if (!input.serviceType) {
      throw new Error("Service type is required.");
    }

    const project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId: user.organizationId },
    });
    if (!project) {
      throw new Error("Project not found.");
    }

    const deliverable = await prisma.$transaction(async (tx) => {
      const created = await tx.deliverable.create({
        data: {
          organizationId: user.organizationId,
          projectId: project.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          serviceType: input.serviceType,
          ownerId: input.ownerId || user.id,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          weight: input.weight ?? 1.0,
          status: "NOT_STARTED",
          progressPercent: 0,
        },
      });

      await syncProjectAndDeliverableProgress(tx, user.organizationId, project.id, created.id);

      await tx.activityEvent.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          actorType: "USER",
          action: "DELIVERABLE_CREATED",
          entityType: "DELIVERABLE",
          entityId: created.id,
          metadata: JSON.stringify({
            title: created.title,
            serviceType: created.serviceType,
            projectId: project.id,
            projectName: project.name,
          }),
        },
      });

      return created;
    });

    return deliverable;
  }

  static async updateDeliverableStatus(
    user: AuthenticatedUser,
    deliverableId: string,
    nextStatus: DeliverableStatus,
    options?: { expectedVersion?: number }
  ) {
    const existing = await prisma.deliverable.findFirst({
      where: { id: deliverableId, organizationId: user.organizationId },
      include: { project: true },
    });

    if (!existing) {
      throw new Error("Deliverable not found.");
    }

    if (options?.expectedVersion !== undefined && existing.version !== options.expectedVersion) {
      throw new Error("Someone else updated this. Refresh to see the latest.");
    }

    assertValidDeliverableTransition(existing.status as DeliverableStatus, nextStatus);

    if (user.role === "CLIENT") {
      if (nextStatus === "APPROVED") {
        assertCan(user, "APPROVE_AS_CLIENT", { organizationId: user.organizationId });
      } else if (nextStatus === "REVISION_REQUESTED") {
        assertCan(user, "REQUEST_REVISION", { organizationId: user.organizationId });
      } else {
        throw new Error("External clients cannot transition deliverables to this status.");
      }
    } else {
      assertCan(user, "UPDATE_DELIVERABLE", { organizationId: user.organizationId });
    }

    const deliverable = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: nextStatus,
        version: { increment: 1 },
        ...(nextStatus === "SENT_TO_CLIENT" && { sentToClientAt: new Date() }),
      };

      const updated = await tx.deliverable.update({
        where: { id: deliverableId },
        data: updateData,
      });

      await syncProjectAndDeliverableProgress(
        tx,
        user.organizationId,
        existing.projectId,
        deliverableId
      );

      await tx.activityEvent.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          actorType: user.role === "CLIENT" ? "CLIENT_CONTACT" : "USER",
          action: "DELIVERABLE_STATUS_UPDATED",
          entityType: "DELIVERABLE",
          entityId: updated.id,
          metadata: JSON.stringify({
            previousStatus: existing.status,
            nextStatus: updated.status,
            title: updated.title,
            projectId: existing.projectId,
          }),
        },
      });

      return updated;
    });

    if (nextStatus === "SENT_TO_CLIENT") {
      AutomationService.processTrigger(user.organizationId, "DELIVERABLE_SENT_TO_CLIENT", {
        entityId: deliverable.id,
        deliverableId: deliverable.id,
        projectId: deliverable.projectId,
        title: deliverable.title,
        ownerId: deliverable.ownerId || undefined,
      }).catch((err) => console.error("Automation error:", err));
    }

    return deliverable;
  }

  static async updateDeliverable(
    user: AuthenticatedUser,
    deliverableId: string,
    input: UpdateDeliverableInput
  ) {
    assertCan(user, "UPDATE_DELIVERABLE", { organizationId: user.organizationId });

    const existing = await prisma.deliverable.findFirst({
      where: { id: deliverableId, organizationId: user.organizationId },
    });
    if (!existing) {
      throw new Error("Deliverable not found.");
    }

    if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
      throw new Error("Someone else updated this. Refresh to see the latest.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.deliverable.update({
        where: { id: deliverableId },
        data: {
          ...(input.title !== undefined && { title: input.title.trim() }),
          ...(input.description !== undefined && {
            description: input.description?.trim() || null,
          }),
          ...(input.serviceType !== undefined && { serviceType: input.serviceType }),
          ...(input.ownerId !== undefined && { ownerId: input.ownerId }),
          ...(input.dueDate !== undefined && {
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
          }),
          ...(input.weight !== undefined && { weight: input.weight }),
          version: { increment: 1 },
        },
      });

      await syncProjectAndDeliverableProgress(
        tx,
        user.organizationId,
        existing.projectId,
        deliverableId
      );

      await tx.activityEvent.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          actorType: "USER",
          action: "DELIVERABLE_UPDATED",
          entityType: "DELIVERABLE",
          entityId: res.id,
          metadata: JSON.stringify({
            updatedFields: Object.keys(input),
            title: res.title,
          }),
        },
      });

      return res;
    });

    return updated;
  }

  /* ========================================================================
   * 4. TASKS & PROGRESS SYNC
   * ======================================================================== */

  static async createTask(user: AuthenticatedUser, input: CreateTaskInput) {
    assertCan(user, "CREATE_TASK", { organizationId: user.organizationId });

    if (!input.title || !input.title.trim()) {
      throw new Error("Task title is required.");
    }

    const project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId: user.organizationId },
    });
    if (!project) {
      throw new Error("Project not found.");
    }

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          organizationId: user.organizationId,
          projectId: project.id,
          deliverableId: input.deliverableId || null,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          assigneeId: input.assigneeId || null,
          priority: input.priority || "MEDIUM",
          status: "TODO",
          startDate: input.startDate ? new Date(input.startDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          estimateHours: input.estimateHours ?? null,
          order: input.order ?? 0,
        },
      });

      // Synchronize progress and risk deterministically
      await syncProjectAndDeliverableProgress(
        tx,
        user.organizationId,
        project.id,
        created.deliverableId
      );

      await tx.activityEvent.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          actorType: "USER",
          action: "TASK_CREATED",
          entityType: "TASK",
          entityId: created.id,
          metadata: JSON.stringify({
            title: created.title,
            projectId: project.id,
            deliverableId: created.deliverableId,
          }),
        },
      });

      return created;
    });

    return task;
  }

  static async updateTask(
    user: AuthenticatedUser,
    taskId: string,
    input: UpdateTaskInput
  ) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
    });
    if (!existing) {
      throw new Error("Task not found.");
    }

    if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion) {
      throw new Error("Someone else updated this. Refresh to see the latest.");
    }

    // Role rules: A MEMBER can only edit tasks assigned to them; MANAGER/OWNER can edit all.
    if (user.role === "MEMBER") {
      if (existing.assigneeId !== user.id) {
        throw new Error("Access Denied: Members can only edit tasks assigned to them.");
      }
    } else {
      assertCan(user, "UPDATE_TASK_STATUS", { organizationId: user.organizationId });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.task.update({
        where: { id: taskId },
        data: {
          ...(input.title !== undefined && { title: input.title.trim() }),
          ...(input.description !== undefined && { description: input.description?.trim() || null }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
          ...(input.startDate !== undefined && {
            startDate: input.startDate ? new Date(input.startDate) : null,
          }),
          ...(input.dueDate !== undefined && {
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
          }),
          ...(input.estimateHours !== undefined && { estimateHours: input.estimateHours }),
          ...(input.loggedHours !== undefined && { loggedHours: input.loggedHours }),
          ...(input.order !== undefined && { order: input.order }),
          ...(input.progressNote !== undefined && { progressNote: input.progressNote }),
          ...(input.isRevisionRequested !== undefined && {
            isRevisionRequested: input.isRevisionRequested,
          }),
          version: { increment: 1 },
        },
      });

      // Synchronize progress and risk within the same transaction
      await syncProjectAndDeliverableProgress(
        tx,
        user.organizationId,
        existing.projectId,
        existing.deliverableId
      );

      await tx.activityEvent.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          actorType: "USER",
          action: input.status && input.status !== existing.status ? "TASK_STATUS_UPDATED" : "TASK_UPDATED",
          entityType: "TASK",
          entityId: res.id,
          metadata: JSON.stringify({
            previousStatus: existing.status,
            nextStatus: res.status,
            title: res.title,
            loggedHours: res.loggedHours,
          }),
        },
      });

      return res;
    });

    if (input.status === "IN_REVIEW" && existing.status !== "IN_REVIEW") {
      AutomationService.processTrigger(user.organizationId, "TASK_MOVED_TO_REVIEW", {
        entityId: updated.id,
        taskId: updated.id,
        projectId: updated.projectId,
        deliverableId: updated.deliverableId || undefined,
        title: updated.title,
        assigneeId: updated.assigneeId || undefined,
      }).catch((err) => console.error("Automation error:", err));
    }

    return updated;
  }

  static async updateTaskStatus(
    user: AuthenticatedUser,
    taskId: string,
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
  ) {
    return this.updateTask(user, taskId, { status });
  }

  /* ========================================================================
   * 5. SUBTASKS / CHECKLIST ITEMS
   * ======================================================================== */

  static async createSubtask(
    user: AuthenticatedUser,
    taskId: string,
    title: string,
    order: number = 0
  ) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
    });
    if (!task) throw new Error("Task not found.");

    if (user.role === "MEMBER" && task.assigneeId !== user.id) {
      throw new Error("Access Denied: Members can only add subtasks to their assigned tasks.");
    }

    const subtask = await prisma.subtask.create({
      data: {
        organizationId: user.organizationId,
        taskId: task.id,
        title: title.trim(),
        order,
      },
    });

    return subtask;
  }

  static async toggleSubtask(user: AuthenticatedUser, subtaskId: string, isCompleted: boolean) {
    const subtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, organizationId: user.organizationId },
      include: { task: true },
    });
    if (!subtask) throw new Error("Subtask not found.");

    if (user.role === "MEMBER" && subtask.task.assigneeId !== user.id) {
      throw new Error("Access Denied: Members can only update subtasks of their assigned tasks.");
    }

    return prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted },
    });
  }

  static async deleteSubtask(user: AuthenticatedUser, subtaskId: string) {
    const subtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, organizationId: user.organizationId },
      include: { task: true },
    });
    if (!subtask) throw new Error("Subtask not found.");

    if (user.role === "MEMBER" && subtask.task.assigneeId !== user.id) {
      throw new Error("Access Denied.");
    }

    return prisma.subtask.delete({ where: { id: subtaskId } });
  }

  /* ========================================================================
   * 6. TASK DEPENDENCIES (Task blocks task)
   * ======================================================================== */

  static async addTaskDependency(
    user: AuthenticatedUser,
    blockingTaskId: string,
    dependentTaskId: string
  ) {
    if (blockingTaskId === dependentTaskId) {
      throw new Error("A task cannot depend on itself.");
    }

    const [blocking, dependent] = await Promise.all([
      prisma.task.findFirst({ where: { id: blockingTaskId, organizationId: user.organizationId } }),
      prisma.task.findFirst({ where: { id: dependentTaskId, organizationId: user.organizationId } }),
    ]);

    if (!blocking || !dependent) {
      throw new Error("Specified tasks not found in organization.");
    }

    // Check inverse dependency to prevent cycles
    const inverse = await prisma.taskDependency.findFirst({
      where: {
        organizationId: user.organizationId,
        blockingTaskId: dependentTaskId,
        dependentTaskId: blockingTaskId,
      },
    });
    if (inverse) {
      throw new Error("Circular dependency detected: dependent task already blocks the prerequisite task.");
    }

    const dependency = await prisma.$transaction(async (tx) => {
      const created = await tx.taskDependency.create({
        data: {
          organizationId: user.organizationId,
          blockingTaskId,
          dependentTaskId,
        },
      });

      // Re-evaluate risk for dependent task's deliverable
      await syncProjectAndDeliverableProgress(
        tx,
        user.organizationId,
        dependent.projectId,
        dependent.deliverableId
      );

      return created;
    });

    return dependency;
  }

  static async removeTaskDependency(user: AuthenticatedUser, dependencyId: string) {
    const dep = await prisma.taskDependency.findFirst({
      where: { id: dependencyId, organizationId: user.organizationId },
      include: { dependentTask: true },
    });
    if (!dep) throw new Error("Dependency not found.");

    await prisma.$transaction(async (tx) => {
      await tx.taskDependency.delete({ where: { id: dependencyId } });
      await syncProjectAndDeliverableProgress(
        tx,
        user.organizationId,
        dep.dependentTask.projectId,
        dep.dependentTask.deliverableId
      );
    });

    return { success: true };
  }

  /* ========================================================================
   * 7. MY WORK
   * Tasks assigned to current user grouped into Today / This week / Later / Waiting on review
   * ======================================================================== */

  static async listMyWork(user: AuthenticatedUser) {
    const tasks = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        assigneeId: user.id,
      },
      include: {
        project: {
          select: { id: true, name: true, client: { select: { id: true, name: true } } },
        },
        deliverable: {
          select: { id: true, title: true, serviceType: true, status: true },
        },
        subtasks: {
          orderBy: { order: "asc" },
        },
        blockedBy: {
          include: {
            blockingTask: { select: { id: true, title: true, status: true } },
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const today: typeof tasks = [];
    const thisWeek: typeof tasks = [];
    const later: typeof tasks = [];
    const waitingReview: typeof tasks = [];

    for (const t of tasks) {
      if (t.status === "IN_REVIEW") {
        waitingReview.push(t);
        continue;
      }

      if (!t.dueDate) {
        later.push(t);
        continue;
      }

      const due = new Date(t.dueDate);
      if (due <= todayEnd) {
        today.push(t);
      } else if (due <= weekEnd) {
        thisWeek.push(t);
      } else {
        later.push(t);
      }
    }

    return {
      all: tasks,
      groups: {
        today,
        thisWeek,
        later,
        waitingReview,
      },
      counts: {
        total: tasks.length,
        today: today.length,
        thisWeek: thisWeek.length,
        later: later.length,
        waitingReview: waitingReview.length,
      },
    };
  }

  /* ========================================================================
   * 8. ACTIVITY LOGS
   * ======================================================================== */

  static async listActivityEvents(
    user: AuthenticatedUser,
    filter?: {
      projectId?: string;
      entityId?: string;
      entityType?: string;
      actorType?: string;
      actorId?: string;
      limit?: number;
    }
  ) {
    const where: any = { organizationId: user.organizationId };

    // Role filtering: CLIENT can only see activities with client-relevant actions
    if (user.role === "CLIENT") {
      where.actorType = { in: ["CLIENT", "INTERNAL"] };
      // Further scoped to projects that client has access to
    }

    if (filter?.projectId) {
      where.projectId = filter.projectId;
    }
    if (filter?.entityId) {
      where.entityId = filter.entityId;
    }
    if (filter?.entityType) {
      where.entityType = filter.entityType;
    }
    if (filter?.actorType) {
      where.actorType = filter.actorType;
    }
    if (filter?.actorId) {
      where.actorId = filter.actorId;
    }

    return prisma.activityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filter?.limit || 100,
    });
  }
}
