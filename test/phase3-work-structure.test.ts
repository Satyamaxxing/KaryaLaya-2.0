import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import {
  canTransitionDeliverable,
  assertValidDeliverableTransition,
  getAllowedNextStatuses,
  DeliverableStatus,
  PROJECT_TEMPLATES,
  getProjectTemplate,
  AgencyWorkService,
} from "../src/server/services";
import { AuthenticatedUser } from "../src/server/auth/session";

describe("Phase 3: Work Structure, State Machine & Role Enforcement", () => {
  /* ========================================================================
   * 1. State Machine Unit Tests
   * ======================================================================== */
  describe("Deliverable State Machine Transition Rules", () => {
    test("allows legal forward lifecycle transitions", () => {
      assert.equal(canTransitionDeliverable("NOT_STARTED", "IN_PROGRESS"), true);
      assert.equal(canTransitionDeliverable("IN_PROGRESS", "IN_REVIEW"), true);
      assert.equal(canTransitionDeliverable("IN_REVIEW", "SENT_TO_CLIENT"), true);
      assert.equal(canTransitionDeliverable("SENT_TO_CLIENT", "APPROVED"), true);
      assert.equal(canTransitionDeliverable("APPROVED", "DELIVERED"), true);
    });

    test("allows legal revision loop transitions", () => {
      // Client requests revision from SENT_TO_CLIENT
      assert.equal(canTransitionDeliverable("SENT_TO_CLIENT", "REVISION_REQUESTED"), true);
      // Team moves REVISION_REQUESTED back to IN_PROGRESS
      assert.equal(canTransitionDeliverable("REVISION_REQUESTED", "IN_PROGRESS"), true);
      // Internal review can move back to IN_PROGRESS
      assert.equal(canTransitionDeliverable("IN_REVIEW", "IN_PROGRESS"), true);
    });

    test("strictly rejects illegal and skipping transitions", () => {
      // Cannot skip directly from NOT_STARTED to DELIVERED
      assert.equal(canTransitionDeliverable("NOT_STARTED", "DELIVERED"), false);
      assert.throws(
        () => assertValidDeliverableTransition("NOT_STARTED", "DELIVERED"),
        /Invalid Deliverable Transition/
      );

      // Cannot skip directly from NOT_STARTED to SENT_TO_CLIENT
      assert.equal(canTransitionDeliverable("NOT_STARTED", "SENT_TO_CLIENT"), false);

      // Cannot move from DELIVERED backwards to IN_REVIEW
      assert.equal(canTransitionDeliverable("DELIVERED", "IN_REVIEW"), false);

      // Cannot move from REVISION_REQUESTED directly to APPROVED without rework
      assert.equal(canTransitionDeliverable("REVISION_REQUESTED", "APPROVED"), false);
    });

    test("getAllowedNextStatuses returns accurate options for each state", () => {
      assert.deepEqual(getAllowedNextStatuses("NOT_STARTED"), ["IN_PROGRESS"]);
      assert.deepEqual(getAllowedNextStatuses("IN_PROGRESS"), ["IN_REVIEW"]);
      assert.deepEqual(getAllowedNextStatuses("IN_REVIEW"), ["SENT_TO_CLIENT", "IN_PROGRESS"]);
      assert.deepEqual(getAllowedNextStatuses("SENT_TO_CLIENT"), [
        "APPROVED",
        "REVISION_REQUESTED",
      ]);
      assert.deepEqual(getAllowedNextStatuses("REVISION_REQUESTED"), ["IN_PROGRESS"]);
      assert.deepEqual(getAllowedNextStatuses("DELIVERED"), []);
    });
  });

  /* ========================================================================
   * 2. Project Templates
   * ======================================================================== */
  describe("Project Templates", () => {
    test("defines all 4 required minimal templates with deliverables and tasks", () => {
      const templates = ["website-launch", "social-media-monthly", "video-production", "brand-identity"];

      for (const tplId of templates) {
        const tpl = getProjectTemplate(tplId);
        assert.ok(tpl, `Template ${tplId} should exist`);
        assert.ok(tpl.deliverables.length >= 3, `Template ${tplId} should have at least 3 deliverables`);

        for (const deliv of tpl.deliverables) {
          assert.ok(deliv.title, "Deliverable must have title");
          assert.ok(deliv.serviceType, "Deliverable must have serviceType");
          assert.ok(deliv.weight > 0, "Deliverable must have positive weight");
          assert.ok(deliv.tasks.length > 0, "Deliverable must generate starter tasks");
        }
      }
    });
  });

  /* ========================================================================
   * 3. End-to-End Core Loop with Role Rules & Activity Logging
   * ======================================================================== */
  describe("End-to-End Service Execution & Activity Logging", () => {
    let testOrgId: string;
    let ownerUser: AuthenticatedUser;
    let managerUser: AuthenticatedUser;
    let memberUser: AuthenticatedUser;

    test("setup isolated test organization and users", async () => {
      const org = await prisma.organization.create({
        data: {
          name: "Test Sprint Agency",
          slug: `test-sprint-${Date.now()}`,
        },
      });
      testOrgId = org.id;

      const owner = await prisma.user.create({
        data: { name: "Test Owner", email: `owner-${Date.now()}@test.agency` },
      });
      await prisma.membership.create({
        data: { organizationId: testOrgId, userId: owner.id, role: "OWNER" },
      });
      ownerUser = {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        role: "OWNER",
        organizationId: testOrgId,
        organizationName: org.name,
      };

      const manager = await prisma.user.create({
        data: { name: "Test Manager", email: `manager-${Date.now()}@test.agency` },
      });
      await prisma.membership.create({
        data: { organizationId: testOrgId, userId: manager.id, role: "MANAGER" },
      });
      managerUser = {
        id: manager.id,
        email: manager.email,
        name: manager.name,
        role: "MANAGER",
        organizationId: testOrgId,
        organizationName: org.name,
      };

      const member = await prisma.user.create({
        data: { name: "Test Member", email: `member-${Date.now()}@test.agency` },
      });
      await prisma.membership.create({
        data: { organizationId: testOrgId, userId: member.id, role: "MEMBER" },
      });
      memberUser = {
        id: member.id,
        email: member.email,
        name: member.name,
        role: "MEMBER",
        organizationId: testOrgId,
        organizationName: org.name,
      };
    });

    test("Role enforcement: MEMBER cannot create client or project", async () => {
      await assert.rejects(
        () => AgencyWorkService.createClient(memberUser, { name: "Forbidden Client" }),
        /Access Denied/
      );

      await assert.rejects(
        () =>
          AgencyWorkService.createProject(memberUser, {
            clientId: "dummy-id",
            name: "Forbidden Project",
          }),
        /Access Denied/
      );
    });

    test("OWNER/MANAGER can create client and writes ActivityEvent", async () => {
      const client = await AgencyWorkService.createClient(ownerUser, {
        name: "Acme Therapeutics",
        companyName: "Acme Therapeutics Corp",
        industry: "Biotech",
        portalAccessEnabled: true,
      });

      assert.ok(client.id);
      assert.equal(client.name, "Acme Therapeutics");
      assert.equal(client.portalAccessEnabled, true);

      // Verify ActivityEvent was logged
      const events = await prisma.activityEvent.findMany({
        where: { organizationId: testOrgId, entityId: client.id },
      });
      assert.equal(events.length, 1);
      assert.equal(events[0].action, "CLIENT_CREATED");
      assert.equal(events[0].actorId, ownerUser.id);
    });

    test("MANAGER creates project from Website Launch template -> generates deliverables & starter tasks", async () => {
      const clients = await AgencyWorkService.listClients(managerUser);
      const client = clients[0];
      assert.ok(client);

      const project = await AgencyWorkService.createProject(managerUser, {
        clientId: client.id,
        name: "Acme Web Platform Relaunch",
        templateId: "website-launch",
        ownerId: managerUser.id,
      });

      assert.ok(project.id);
      assert.equal(project.name, "Acme Web Platform Relaunch");

      // Verify Project detail contains deliverables and tasks
      const detailed = await AgencyWorkService.getProjectById(managerUser, project.id);
      assert.ok(detailed);
      assert.equal(detailed.deliverables.length, 5); // Website Launch has 5 deliverables
      assert.ok(detailed.tasks.length >= 10, "Should generate starter tasks for deliverables");

      // Verify deliverable service types
      const types = detailed.deliverables.map((d) => d.serviceType);
      assert.ok(types.includes("WEB_DEV"));
      assert.ok(types.includes("DESIGN"));

      // Verify PROJECT_CREATED ActivityEvent was logged
      const projectEvents = await prisma.activityEvent.findMany({
        where: { organizationId: testOrgId, entityId: project.id },
      });
      assert.ok(projectEvents.some((e) => e.action === "PROJECT_CREATED"));
    });

    test("Transitioning deliverable updates status, progress and writes ActivityEvent", async () => {
      const projects = await AgencyWorkService.listProjects(ownerUser);
      const project = projects[0];
      const deliverable = project.deliverables[0];

      assert.equal(deliverable.status, "NOT_STARTED");

      // Transition to IN_PROGRESS
      const inProgress = await AgencyWorkService.updateDeliverableStatus(
        ownerUser,
        deliverable.id,
        "IN_PROGRESS"
      );
      assert.equal(inProgress.status, "IN_PROGRESS");

      // Transition to IN_REVIEW
      const inReview = await AgencyWorkService.updateDeliverableStatus(
        ownerUser,
        deliverable.id,
        "IN_REVIEW"
      );
      assert.equal(inReview.status, "IN_REVIEW");

      // Transition to SENT_TO_CLIENT
      const sentToClient = await AgencyWorkService.updateDeliverableStatus(
        ownerUser,
        deliverable.id,
        "SENT_TO_CLIENT"
      );
      assert.equal(sentToClient.status, "SENT_TO_CLIENT");

      // Verify ActivityEvents logged for status transitions
      const events = await prisma.activityEvent.findMany({
        where: {
          organizationId: testOrgId,
          entityId: deliverable.id,
          action: "DELIVERABLE_STATUS_UPDATED",
        },
      });
      assert.equal(events.length, 3);
    });

    test("Reject invalid transition attempt in service", async () => {
      const projects = await AgencyWorkService.listProjects(ownerUser);
      const project = projects[0];
      const deliverable = project.deliverables[1]; // status is NOT_STARTED

      await assert.rejects(
        () => AgencyWorkService.updateDeliverableStatus(ownerUser, deliverable.id, "DELIVERED"),
        /Invalid Deliverable Transition/
      );
    });

    test("Client detail allows portal access toggle and contact addition", async () => {
      const clients = await AgencyWorkService.listClients(ownerUser);
      const client = clients[0];

      // Add Contact
      const contact = await AgencyWorkService.addClientContact(ownerUser, client.id, {
        name: "Dr. Gregory House",
        email: `drhouse-${Date.now()}@acme.com`,
        title: "Head of Research",
        canApprove: true,
      });
      assert.ok(contact.id);
      assert.equal(contact.name, "Dr. Gregory House");

      // Toggle portal access off then on
      const toggledOff = await AgencyWorkService.updateClient(ownerUser, client.id, {
        portalAccessEnabled: false,
      });
      assert.equal(toggledOff.portalAccessEnabled, false);

      const toggledOn = await AgencyWorkService.updateClient(ownerUser, client.id, {
        portalAccessEnabled: true,
      });
      assert.equal(toggledOn.portalAccessEnabled, true);
    });
  });
});
