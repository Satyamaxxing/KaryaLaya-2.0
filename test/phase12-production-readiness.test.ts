import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { prisma } from "../src/server/db";
import { AuthenticatedUser } from "../src/server/auth";
import { AgencyWorkService } from "../src/server/services/agency-work";
import { ClientPortalService } from "../src/server/services/client-portal";
import { TeamService } from "../src/server/services/team";
import { GET as healthCheckRoute } from "../src/app/api/health/route";
import {
  loginSchema,
  createClientSchema,
  updateTaskSchema,
  clientApprovalSchema,
} from "../src/server/validation";

describe("PHASE 12 — Production Readiness Test Suite", () => {
  const orgAId = `p12-org-alpha-${Date.now()}`;
  const orgBId = `p12-org-beta-${Date.now()}`;

  let ownerA: AuthenticatedUser;
  let managerA: AuthenticatedUser;
  let memberA: AuthenticatedUser;
  let clientUserA: AuthenticatedUser;
  let ownerB: AuthenticatedUser;

  let clientAId: string;
  let clientBId: string;
  let projectAId: string;
  let deliverableAId: string;
  let taskAId: string;

  const testEmails = [
    `owner.a-${Date.now()}@p12.test`,
    `manager.a-${Date.now()}@p12.test`,
    `member.a-${Date.now()}@p12.test`,
    `owner.b-${Date.now()}@p12.test`,
    `temp.contractor-${Date.now()}@p12.test`,
  ];

  before(async () => {
    // Create Organizations
    await prisma.organization.createMany({
      data: [
        { id: orgAId, name: "Phase12 Org Alpha", slug: `p12-alpha-${Date.now()}` },
        { id: orgBId, name: "Phase12 Org Beta", slug: `p12-beta-${Date.now()}` },
      ],
    });

    // Create Users
    const uOwnerA = await prisma.user.create({
      data: {
        email: testEmails[0],
        name: "Owner A",
        passwordHash: "hash",
      },
    });
    await prisma.membership.create({
      data: { organizationId: orgAId, userId: uOwnerA.id, role: "OWNER" },
    });

    const uMgrA = await prisma.user.create({
      data: {
        email: testEmails[1],
        name: "Manager A",
        passwordHash: "hash",
      },
    });
    await prisma.membership.create({
      data: { organizationId: orgAId, userId: uMgrA.id, role: "MANAGER" },
    });

    const uMemA = await prisma.user.create({
      data: {
        email: testEmails[2],
        name: "Member A",
        passwordHash: "hash",
      },
    });
    await prisma.membership.create({
      data: { organizationId: orgAId, userId: uMemA.id, role: "MEMBER" },
    });

    const uOwnerB = await prisma.user.create({
      data: {
        email: testEmails[3],
        name: "Owner B",
        passwordHash: "hash",
      },
    });
    await prisma.membership.create({
      data: { organizationId: orgBId, userId: uOwnerB.id, role: "OWNER" },
    });

    ownerA = {
      id: uOwnerA.id,
      email: uOwnerA.email,
      name: uOwnerA.name,
      role: "OWNER",
      organizationId: orgAId,
      organizationName: "Phase12 Org Alpha",
    };
    managerA = {
      id: uMgrA.id,
      email: uMgrA.email,
      name: uMgrA.name,
      role: "MANAGER",
      organizationId: orgAId,
      organizationName: "Phase12 Org Alpha",
    };
    memberA = {
      id: uMemA.id,
      email: uMemA.email,
      name: uMemA.name,
      role: "MEMBER",
      organizationId: orgAId,
      organizationName: "Phase12 Org Alpha",
    };
    ownerB = {
      id: uOwnerB.id,
      email: uOwnerB.email,
      name: uOwnerB.name,
      role: "OWNER",
      organizationId: orgBId,
      organizationName: "Phase12 Org Beta",
    };

    // Create Client in Org A
    const clA = await AgencyWorkService.createClient(ownerA, {
      name: "Acme Corp Alpha",
      companyName: "Acme Corp Alpha",
      portalAccessEnabled: true,
    });
    clientAId = clA.id;

    // Create Contact for Client A
    const ctA = await AgencyWorkService.addClientContact(ownerA, clientAId, {
      name: "Sarah Client",
      email: `sarah-${Date.now()}@acme-alpha.test`,
      canApprove: true,
    });

    clientUserA = {
      id: ctA.id,
      email: ctA.email,
      name: ctA.name,
      role: "CLIENT",
      organizationId: orgAId,
      organizationName: "Phase12 Org Alpha",
      clientId: clientAId,
      canApprove: true,
    };

    // Create Client in Org B
    const clB = await AgencyWorkService.createClient(ownerB, {
      name: "Bravo Client Beta",
      companyName: "Bravo Client Beta",
      portalAccessEnabled: true,
    });
    clientBId = clB.id;

    // Create Project in Org A
    const projA = await AgencyWorkService.createProject(ownerA, {
      clientId: clientAId,
      name: "Alpha Web Overhaul",
      description: "Full revamp",
      ownerId: managerA.id,
    });
    projectAId = projA.id;

    // Create Deliverable in Org A
    const delivA = await AgencyWorkService.createDeliverable(ownerA, {
      projectId: projectAId,
      title: "Hero Wireframe",
      serviceType: "DESIGN",
      weight: 1.0,
      ownerId: managerA.id,
    });
    deliverableAId = delivA.id;

    // Create Task under Deliverable
    const taskA = await AgencyWorkService.createTask(ownerA, {
      projectId: projectAId,
      deliverableId: deliverableAId,
      title: "Design Figma Component",
      assigneeId: memberA.id,
      priority: "HIGH",
    });
    taskAId = taskA.id;
  });

  after(async () => {
    // Teardown
    await prisma.activityEvent.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.comment.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.task.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.deliverable.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.project.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.clientContact.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.client.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.membership.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.session.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgAId, orgBId] } },
    });
  });

  /* -------------------------------------------------------------------------
   * 1. OBSERVABILITY & HEALTH CHECK
   * ------------------------------------------------------------------------- */
  describe("1. Observability: /api/health", () => {
    it("returns 200 OK with database connection status and uptime", async () => {
      const response = await healthCheckRoute();
      assert.strictEqual(response.status, 200);

      const json = await response.json();
      assert.strictEqual(json.status, "ok");
      assert.strictEqual(json.database, "connected");
      assert.strictEqual(json.version, "2.0.0");
      assert.ok(typeof json.uptimeSeconds === "number");
    });
  });

  /* -------------------------------------------------------------------------
   * 2. INPUT VALIDATION (ZOD)
   * ------------------------------------------------------------------------- */
  describe("2. Security: Input Validation (Zod Schemas)", () => {
    it("rejects invalid login credentials", () => {
      const invalid = loginSchema.safeParse({ email: "invalid-email", password: "" });
      assert.strictEqual(invalid.success, false);

      const valid = loginSchema.safeParse({ email: "valid@test.com", password: "secretPassword" });
      assert.strictEqual(valid.success, true);
    });

    it("rejects invalid client creation payload", () => {
      const invalid = createClientSchema.safeParse({ name: "" });
      assert.strictEqual(invalid.success, false);

      const valid = createClientSchema.safeParse({ name: "Stripe", companyName: "Stripe Inc." });
      assert.strictEqual(valid.success, true);
    });

    it("validates task update with optional expectedVersion", () => {
      const valid = updateTaskSchema.safeParse({
        title: "Updated Task",
        status: "DONE",
        expectedVersion: 1,
      });
      assert.strictEqual(valid.success, true);
    });

    it("validates client approval note schema", () => {
      const valid = clientApprovalSchema.safeParse({ note: "Looks gorgeous!" });
      assert.strictEqual(valid.success, true);
    });
  });

  /* -------------------------------------------------------------------------
   * 3. CONCURRENCY: OPTIMISTIC LOCKING
   * ------------------------------------------------------------------------- */
  describe("3. Concurrency: Optimistic Locking & Conflicts", () => {
    it("successfully updates task and increments version when expectedVersion matches", async () => {
      const taskBefore = await prisma.task.findUniqueOrThrow({ where: { id: taskAId } });
      const currentVersion = taskBefore.version;

      const updated = await AgencyWorkService.updateTask(memberA, taskAId, {
        progressNote: "Halfway completed layout",
        expectedVersion: currentVersion,
      });

      assert.strictEqual(updated.version, currentVersion + 1);
    });

    it("throws friendly conflict error when expectedVersion is stale on task", async () => {
      const task = await prisma.task.findUniqueOrThrow({ where: { id: taskAId } });
      const staleVersion = task.version - 1;

      await assert.rejects(
        async () => {
          await AgencyWorkService.updateTask(memberA, taskAId, {
            progressNote: "Conflicting edit",
            expectedVersion: staleVersion,
          });
        },
        {
          name: "Error",
          message: "Someone else updated this. Refresh to see the latest.",
        }
      );
    });

    it("successfully updates deliverable and increments version when expectedVersion matches", async () => {
      const delivBefore = await prisma.deliverable.findUniqueOrThrow({ where: { id: deliverableAId } });
      const currentVersion = delivBefore.version;

      const updated = await AgencyWorkService.updateDeliverable(ownerA, deliverableAId, {
        description: "Updated deliverable scope",
        expectedVersion: currentVersion,
      });

      assert.strictEqual(updated.version, currentVersion + 1);
    });

    it("throws friendly conflict error when expectedVersion is stale on deliverable", async () => {
      const deliv = await prisma.deliverable.findUniqueOrThrow({ where: { id: deliverableAId } });
      const staleVersion = deliv.version - 1;

      await assert.rejects(
        async () => {
          await AgencyWorkService.updateDeliverable(ownerA, deliverableAId, {
            title: "Stale edit attempt",
            expectedVersion: staleVersion,
          });
        },
        {
          name: "Error",
          message: "Someone else updated this. Refresh to see the latest.",
        }
      );
    });
  });

  /* -------------------------------------------------------------------------
   * 4. SOFT DELETE / ARCHIVING
   * ------------------------------------------------------------------------- */
  describe("4. Data & Performance: Soft Delete / Archiving", () => {
    it("archives a project and hides it from default listProjects queries", async () => {
      // Archive project
      const archived = await AgencyWorkService.archiveProject(ownerA, projectAId);
      assert.strictEqual(archived.isArchived, true);
      assert.ok(archived.archivedAt instanceof Date);

      // Default listProjects should NOT return archived project
      const activeProjects = await AgencyWorkService.listProjects(ownerA);
      assert.strictEqual(activeProjects.some((p) => p.id === projectAId), false);

      // Including archived should return it
      const allProjects = await AgencyWorkService.listProjects(ownerA, { includeArchived: true });
      assert.strictEqual(allProjects.some((p) => p.id === projectAId), true);

      // Unarchive project
      const unarchived = await AgencyWorkService.unarchiveProject(ownerA, projectAId);
      assert.strictEqual(unarchived.isArchived, false);
      assert.strictEqual(unarchived.archivedAt, null);

      const restoredList = await AgencyWorkService.listProjects(ownerA);
      assert.strictEqual(restoredList.some((p) => p.id === projectAId), true);
    });

    it("archives a client and hides it from default listClients queries", async () => {
      const archived = await AgencyWorkService.archiveClient(ownerA, clientAId);
      assert.strictEqual(archived.isArchived, true);

      const activeClients = await AgencyWorkService.listClients(ownerA);
      assert.strictEqual(activeClients.some((c) => c.id === clientAId), false);

      const allClients = await AgencyWorkService.listClients(ownerA, { includeArchived: true });
      assert.strictEqual(allClients.some((c) => c.id === clientAId), true);

      await AgencyWorkService.unarchiveClient(ownerA, clientAId);
      const restored = await AgencyWorkService.listClients(ownerA);
      assert.strictEqual(restored.some((c) => c.id === clientAId), true);
    });
  });

  /* -------------------------------------------------------------------------
   * 5. USER REMOVAL WORKFLOW
   * ------------------------------------------------------------------------- */
  describe("5. User Removal: Task Reassignment/Flagging & Session Revocation", () => {
    it("reassigns or flags open tasks and revokes sessions on member removal", async () => {
      // Create temporary member with assigned task
      const tempUser = await prisma.user.create({
        data: {
          email: testEmails[4],
          name: "Temp Contractor",
          passwordHash: "hash",
        },
      });

      const tempMembership = await prisma.membership.create({
        data: {
          organizationId: orgAId,
          userId: tempUser.id,
          role: "MEMBER",
        },
      });

      // Create a session for temp user
      await prisma.session.create({
        data: {
          organizationId: orgAId,
          userId: tempUser.id,
          role: "MEMBER",
          sessionToken: `temp-token-${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      // Assign an open task to temp user
      const tempTask = await AgencyWorkService.createTask(ownerA, {
        projectId: projectAId,
        deliverableId: deliverableAId,
        title: "Deliver design icons",
        assigneeId: tempUser.id,
      });

      // Remove temp user with fallback unassign & flag
      const removeResult = await TeamService.removeMember(ownerA, tempUser.id, undefined);

      assert.strictEqual(removeResult.success, true);
      assert.strictEqual(removeResult.affectedTasksCount, 1);

      // Verify task assignee is null and progressNote was flagged
      const updatedTask = await prisma.task.findUniqueOrThrow({ where: { id: tempTask.id } });
      assert.strictEqual(updatedTask.assigneeId, null);
      assert.ok(updatedTask.progressNote?.includes("[FLAG: Assignee removed from team]"));

      // Verify sessions are 0
      const remainingSessions = await prisma.session.findMany({ where: { userId: tempUser.id } });
      assert.strictEqual(remainingSessions.length, 0);

      // Verify membership is removed
      const removedMembership = await prisma.membership.findUnique({ where: { id: tempMembership.id } });
      assert.strictEqual(removedMembership, null);
    });
  });

  /* -------------------------------------------------------------------------
   * 6. CORE LOOP END-TO-END FLOW
   * Member updates task -> Manager sends to client -> Client approves -> Progress updates
   * ------------------------------------------------------------------------- */
  describe("6. Core Loop E2E Flow", () => {
    it("completes the full life cycle with automated progress & activity sync", async () => {
      // 1. Member finishes task
      await AgencyWorkService.updateTask(memberA, taskAId, {
        status: "DONE",
        loggedHours: 6.0,
      });

      const taskAfter = await prisma.task.findUniqueOrThrow({ where: { id: taskAId } });
      assert.strictEqual(taskAfter.status, "DONE");

      // 2. Manager advances deliverable through workflow: IN_PROGRESS -> IN_REVIEW -> SENT_TO_CLIENT
      await AgencyWorkService.updateDeliverableStatus(managerA, deliverableAId, "IN_PROGRESS");
      await AgencyWorkService.updateDeliverableStatus(managerA, deliverableAId, "IN_REVIEW");
      const sentDeliv = await AgencyWorkService.updateDeliverableStatus(
        managerA,
        deliverableAId,
        "SENT_TO_CLIENT"
      );
      assert.strictEqual(sentDeliv.status, "SENT_TO_CLIENT");
      assert.ok(sentDeliv.sentToClientAt instanceof Date);

      // 3. Client approves deliverable via portal
      const approvalResult = await ClientPortalService.approveDeliverableAsClient(
        clientUserA,
        deliverableAId,
        { note: "Looks phenomenal, ready to ship!" }
      );

      assert.strictEqual(approvalResult.success, true);
      assert.strictEqual(approvalResult.status, "APPROVED");

      // 4. Verify progress calculation
      const approvedDeliv = await prisma.deliverable.findUniqueOrThrow({
        where: { id: deliverableAId },
      });
      assert.strictEqual(approvedDeliv.status, "APPROVED");
      assert.strictEqual(approvedDeliv.progressPercent, 100);

      const projectAfter = await prisma.project.findUniqueOrThrow({ where: { id: projectAId } });
      assert.strictEqual(projectAfter.progressPercent, 100);

      // 5. Verify Client-Visible comment was created
      const clientComments = await prisma.comment.findMany({
        where: { deliverableId: deliverableAId, visibility: "CLIENT_VISIBLE" },
      });
      assert.ok(clientComments.some((c) => c.content.includes("Looks phenomenal")));

      // 6. Test Idempotency: Duplicate approval does not throw or corrupt
      const duplicateApproval = await ClientPortalService.approveDeliverableAsClient(
        clientUserA,
        deliverableAId
      );
      assert.strictEqual(duplicateApproval.success, true);
      assert.strictEqual(duplicateApproval.alreadyApproved, true);
    });
  });

  /* -------------------------------------------------------------------------
   * 7. CLIENT PORTAL & TENANT ISOLATION
   * ------------------------------------------------------------------------- */
  describe("7. Security: Client Portal & Tenant Isolation", () => {
    it("prevents client from accessing project belonging to another client or organization", async () => {
      // Create project for Client B in Org B
      const projB = await AgencyWorkService.createProject(ownerB, {
        clientId: clientBId,
        name: "Beta Brand Guidelines",
        ownerId: ownerB.id,
      });

      // Client A attempts to access Project B
      await assert.rejects(
        async () => {
          await ClientPortalService.getClientProjectDetails(clientUserA, projB.id);
        },
        {
          name: "Error",
          message: "Access denied: You do not have permission to view this project.",
        }
      );
    });

    it("prevents client from approving deliverables of another client", async () => {
      // Deliverable in Org B
      const delivB = await AgencyWorkService.createDeliverable(ownerB, {
        projectId: (await prisma.project.findFirstOrThrow({ where: { organizationId: orgBId } })).id,
        title: "Confidential Strategy",
        serviceType: "OTHER",
      });

      await assert.rejects(
        async () => {
          await ClientPortalService.approveDeliverableAsClient(clientUserA, delivB.id);
        },
        {
          name: "Error",
          message: "Access denied: Organization mismatch.",
        }
      );
    });

    it("guarantees complete cross-tenant boundary between Org A and Org B", async () => {
      // Org A owner cannot see Org B's projects
      const orgAProjects = await AgencyWorkService.listProjects(ownerA);
      assert.strictEqual(orgAProjects.every((p) => p.organizationId === orgAId), true);

      // Org B owner cannot see Org A's clients
      const orgBClients = await AgencyWorkService.listClients(ownerB);
      assert.strictEqual(orgBClients.every((c) => c.organizationId === orgBId), true);
    });
  });
});
