import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import {
  calculateDeliverableProgress,
  calculateProjectProgress,
  evaluateDeliverableRisk,
  AgencyWorkService,
} from "../src/server/services";
import { AuthenticatedUser } from "../src/server/auth/session";

describe("Phase 4: Progress Engine & Deterministic Risk Rules", () => {
  /* ========================================================================
   * 1. Pure Unit Tests: Deliverable Progress
   * ======================================================================== */
  describe("Deliverable Progress Calculation", () => {
    test("calculates completed task weight / total task weight with estimateHours", () => {
      // Task 1: 2h DONE, Task 2: 6h TODO -> 2 / 8 = 25%
      const tasks = [
        { status: "DONE", estimateHours: 2.0 },
        { status: "TODO", estimateHours: 6.0 },
      ];
      assert.equal(calculateDeliverableProgress("IN_PROGRESS", tasks), 25);
    });

    test("defaults task weight to 1.0 when estimateHours is missing or zero", () => {
      // 3 tasks without estimateHours: 1 DONE, 2 TODO -> 1 / 3 = 33%
      const tasks = [
        { status: "DONE" },
        { status: "TODO" },
        { status: "IN_PROGRESS" },
      ];
      assert.equal(calculateDeliverableProgress("IN_PROGRESS", tasks), 33);
    });

    test("APPROVED or DELIVERED status always equals 100% regardless of tasks", () => {
      const incompleteTasks = [
        { status: "TODO", estimateHours: 10 },
        { status: "TODO", estimateHours: 10 },
      ];
      assert.equal(calculateDeliverableProgress("APPROVED", incompleteTasks), 100);
      assert.equal(calculateDeliverableProgress("DELIVERED", incompleteTasks), 100);
    });

    test("handles empty tasks using lifecycle status baseline heuristics", () => {
      assert.equal(calculateDeliverableProgress("NOT_STARTED", []), 0);
      assert.equal(calculateDeliverableProgress("IN_PROGRESS", []), 25);
      assert.equal(calculateDeliverableProgress("IN_REVIEW", []), 75);
      assert.equal(calculateDeliverableProgress("SENT_TO_CLIENT", []), 85);
      assert.equal(calculateDeliverableProgress("APPROVED", []), 100);
      assert.equal(calculateDeliverableProgress("DELIVERED", []), 100);
    });
  });

  /* ========================================================================
   * 2. Pure Unit Tests: Project Progress
   * ======================================================================== */
  describe("Project Progress Calculation", () => {
    test("calculates weighted average of deliverables using deliverable.weight", () => {
      // Deliv A: weight 1.0, 50%
      // Deliv B: weight 3.0, 100%
      // Sum = (50*1 + 100*3) / 4 = 350 / 4 = 87.5 -> 88%
      const deliverables = [
        { status: "IN_PROGRESS", weight: 1.0, progressPercent: 50 },
        { status: "APPROVED", weight: 3.0, progressPercent: 100 },
      ];
      assert.equal(calculateProjectProgress(deliverables), 88);
    });

    test("counts APPROVED and DELIVERED deliverables as 100% even if progressPercent is stale", () => {
      const deliverables = [
        { status: "APPROVED", weight: 1.0, progressPercent: 40 }, // should be treated as 100%
        { status: "IN_PROGRESS", weight: 1.0, progressPercent: 0 },
      ];
      assert.equal(calculateProjectProgress(deliverables), 50);
    });

    test("returns 0 for empty deliverables", () => {
      assert.equal(calculateProjectProgress([]), 0);
    });
  });

  /* ========================================================================
   * 3. Pure Unit Tests: Risk Logic (Plain Rules, No AI)
   * ======================================================================== */
  describe("Risk Evaluation Rules", () => {
    const fixedNow = new Date("2026-10-10T12:00:00Z");

    test("flags overdue deliverable as AT_RISK with human-readable reason", () => {
      const deliverable = {
        title: "Logo Suite",
        dueDate: new Date("2026-10-08T12:00:00Z"), // 2 days ago
        status: "IN_PROGRESS",
        progressPercent: 40,
      };

      const risk = evaluateDeliverableRisk(deliverable, [], { now: fixedNow });
      assert.equal(risk.riskStatus, "AT_RISK");
      assert.match(risk.riskReason || "", /Logo Suite is overdue by 2 day\(s\) \(40% complete\)/);
    });

    test("flags deliverable due in <= 3 days with < 70% progress as AT_RISK", () => {
      const deliverable = {
        title: "Commercial Cut",
        dueDate: new Date("2026-10-12T12:00:00Z"), // 2 days in future
        status: "IN_PROGRESS",
        progressPercent: 30,
      };
      const tasks = [
        { status: "DONE" },
        { status: "TODO" },
        { status: "IN_PROGRESS" },
      ];

      const risk = evaluateDeliverableRisk(deliverable, tasks, { now: fixedNow });
      assert.equal(risk.riskStatus, "AT_RISK");
      assert.match(risk.riskReason || "", /Commercial Cut is at risk: 2 task\(s\) incomplete and due in 2 day\(s\)/);
    });

    test("considers deliverable due in 2 days ON_TRACK if progress >= 70%", () => {
      const deliverable = {
        title: "Website QA",
        dueDate: new Date("2026-10-12T12:00:00Z"),
        status: "IN_REVIEW",
        progressPercent: 85,
      };

      const risk = evaluateDeliverableRisk(deliverable, [], { now: fixedNow });
      assert.equal(risk.riskStatus, "ON_TRACK");
      assert.equal(risk.riskReason, null);
    });

    test("flags deliverable as AT_RISK if any task is blocked by an incomplete dependency", () => {
      const deliverable = {
        title: "Frontend Build",
        dueDate: new Date("2026-10-25T12:00:00Z"),
        status: "IN_PROGRESS",
        progressPercent: 50,
      };
      const tasks = [
        {
          title: "Setup Next.js Routes",
          status: "TODO",
          blockedBy: [
            {
              blockingTask: {
                title: "Figma Wireframes Signoff",
                status: "IN_PROGRESS", // not done!
              },
            },
          ],
        },
      ];

      const risk = evaluateDeliverableRisk(deliverable, tasks, { now: fixedNow });
      assert.equal(risk.riskStatus, "AT_RISK");
      assert.match(
        risk.riskReason || "",
        /Frontend Build is at risk: blocked by incomplete dependency 'Figma Wireframes Signoff'/
      );
    });

    test("flags deliverable as AT_RISK if waiting on client approval beyond 3 days", () => {
      const deliverable = {
        title: "Brand Strategy PDF",
        dueDate: new Date("2026-10-20T12:00:00Z"),
        status: "SENT_TO_CLIENT",
        progressPercent: 85,
        sentToClientAt: new Date("2026-10-06T12:00:00Z"), // 4 days ago
      };

      const risk = evaluateDeliverableRisk(deliverable, [], { now: fixedNow });
      assert.equal(risk.riskStatus, "AT_RISK");
      assert.match(
        risk.riskReason || "",
        /Brand Strategy PDF is at risk: waiting on client approval for 4 days/
      );
    });

    test("APPROVED or DELIVERED deliverables are never at risk", () => {
      const deliverable = {
        title: "Hero 3D Vortex",
        dueDate: new Date("2026-09-01T12:00:00Z"), // way past
        status: "APPROVED",
        progressPercent: 100,
      };

      const risk = evaluateDeliverableRisk(deliverable, [], { now: fixedNow });
      assert.equal(risk.riskStatus, "ON_TRACK");
      assert.equal(risk.riskReason, null);
    });
  });

  /* ========================================================================
   * 4. Integration: Database Progress Engine & Role Editing Rules
   * ======================================================================== */
  describe("Transactional Progress Engine & Role Rules", () => {
    let orgId: string;
    let ownerUser: AuthenticatedUser;
    let managerUser: AuthenticatedUser;
    let devMember: AuthenticatedUser;
    let designerMember: AuthenticatedUser;
    let testProject: any;
    let testDeliverable: any;
    let taskA: any;
    let taskB: any;

    test("setup agency team, client, project, deliverable, and tasks", async () => {
      const org = await prisma.organization.create({
        data: { name: "Engine Agency", slug: `engine-${Date.now()}` },
      });
      orgId = org.id;

      const owner = await prisma.user.create({
        data: { name: "Meera Owner", email: `owner-${Date.now()}@engine.agency` },
      });
      await prisma.membership.create({
        data: { organizationId: orgId, userId: owner.id, role: "OWNER" },
      });
      ownerUser = {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: "OWNER",
        organizationId: orgId,
        organizationName: "Engine Agency",
      };

      const manager = await prisma.user.create({
        data: { name: "Rohan Manager", email: `manager-${Date.now()}@engine.agency` },
      });
      await prisma.membership.create({
        data: { organizationId: orgId, userId: manager.id, role: "MANAGER" },
      });
      managerUser = {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: "MANAGER",
        organizationId: orgId,
        organizationName: "Engine Agency",
      };

      const dev = await prisma.user.create({
        data: { name: "Satyam Dev", email: `dev-${Date.now()}@engine.agency` },
      });
      await prisma.membership.create({
        data: { organizationId: orgId, userId: dev.id, role: "MEMBER" },
      });
      devMember = {
        id: dev.id,
        name: dev.name,
        email: dev.email,
        role: "MEMBER",
        organizationId: orgId,
        organizationName: "Engine Agency",
      };

      const designer = await prisma.user.create({
        data: { name: "Arjun Designer", email: `designer-${Date.now()}@engine.agency` },
      });
      await prisma.membership.create({
        data: { organizationId: orgId, userId: designer.id, role: "MEMBER" },
      });
      designerMember = {
        id: designer.id,
        name: designer.name,
        email: designer.email,
        role: "MEMBER",
        organizationId: orgId,
        organizationName: "Engine Agency",
      };

      const client = await AgencyWorkService.createClient(ownerUser, {
        name: "Acme Tech",
      });

      testProject = await AgencyWorkService.createProject(managerUser, {
        clientId: client.id,
        name: "Acme Web & Video",
        ownerId: managerUser.id,
      });

      testDeliverable = await AgencyWorkService.createDeliverable(managerUser, {
        projectId: testProject.id,
        title: "Frontend Engineering",
        serviceType: "WEB_DEV",
        weight: 1.0,
      });

      // Create Task A (Assigned to Dev, 2 hours)
      taskA = await AgencyWorkService.createTask(managerUser, {
        projectId: testProject.id,
        deliverableId: testDeliverable.id,
        title: "Build Navigation Bar",
        assigneeId: devMember.id,
        estimateHours: 2.0,
      });

      // Create Task B (Assigned to Designer, 6 hours)
      taskB = await AgencyWorkService.createTask(managerUser, {
        projectId: testProject.id,
        deliverableId: testDeliverable.id,
        title: "Figma Component Specs",
        assigneeId: designerMember.id,
        estimateHours: 6.0,
      });
    });

    test("Initial state: 0% deliverable and 0% project progress", async () => {
      const deliv = await prisma.deliverable.findUnique({ where: { id: testDeliverable.id } });
      const proj = await prisma.project.findUnique({ where: { id: testProject.id } });

      assert.equal(deliv?.progressPercent, 0);
      assert.equal(proj?.progressPercent, 0);
    });

    test("Role enforcement: MEMBER cannot edit task assigned to another teammate", async () => {
      // devMember tries to edit taskB (assigned to designerMember)
      await assert.rejects(
        () => AgencyWorkService.updateTask(devMember, taskB.id, { status: "DONE" }),
        /Access Denied: Members can only edit tasks assigned to them/
      );
    });

    test("MEMBER updates their assigned task -> deliverable & project progress update automatically in same tx", async () => {
      // devMember completes taskA (2 hours out of 8 total hours = 25%)
      const updatedTaskA = await AgencyWorkService.updateTask(devMember, taskA.id, {
        status: "DONE",
        loggedHours: 2.5,
        progressNote: "Nav bar component built with responsive mobile drawer.",
      });

      assert.equal(updatedTaskA.status, "DONE");
      assert.equal(updatedTaskA.loggedHours, 2.5);

      // Verify deliverable progress updated to 25% in DB
      const deliv = await prisma.deliverable.findUnique({ where: { id: testDeliverable.id } });
      assert.equal(deliv?.progressPercent, 25);

      // Verify project progress updated to 25% in DB
      const proj = await prisma.project.findUnique({ where: { id: testProject.id } });
      assert.equal(proj?.progressPercent, 25);
    });

    test("MANAGER can edit any task -> Completing remaining task moves progress to 100%", async () => {
      // Manager completes taskB (6 hours)
      await AgencyWorkService.updateTask(managerUser, taskB.id, {
        status: "DONE",
        loggedHours: 6.0,
      });

      const deliv = await prisma.deliverable.findUnique({ where: { id: testDeliverable.id } });
      assert.equal(deliv?.progressPercent, 100);

      const proj = await prisma.project.findUnique({ where: { id: testProject.id } });
      assert.equal(proj?.progressPercent, 100);
    });

    test("Adding an incomplete task dependency dynamically marks deliverable as AT_RISK", async () => {
      // Create a new task that is TODO
      const blockerTask = await AgencyWorkService.createTask(managerUser, {
        projectId: testProject.id,
        deliverableId: testDeliverable.id,
        title: "Backend API Auth Token Hook",
      });

      // Add dependency: blockerTask blocks taskA
      const dep = await AgencyWorkService.addTaskDependency(
        managerUser,
        blockerTask.id,
        taskA.id
      );
      assert.ok(dep.id);

      // Verify deliverable risk status became AT_RISK in DB
      const deliv = await prisma.deliverable.findUnique({ where: { id: testDeliverable.id } });
      assert.equal(deliv?.riskStatus, "AT_RISK");
      assert.match(deliv?.riskReason || "", /blocked by incomplete dependency/);

      // Completing the blocker resolves the risk
      await AgencyWorkService.updateTask(managerUser, blockerTask.id, { status: "DONE" });
      const delivResolved = await prisma.deliverable.findUnique({ where: { id: testDeliverable.id } });
      assert.equal(delivResolved?.riskStatus, "ON_TRACK");
    });

    test("Subtasks can be created, toggled, and scoped to assigned member", async () => {
      const subtask = await AgencyWorkService.createSubtask(
        devMember,
        taskA.id,
        "Write unit tests for navbar"
      );
      assert.ok(subtask.id);
      assert.equal(subtask.isCompleted, false);

      const toggled = await AgencyWorkService.toggleSubtask(devMember, subtask.id, true);
      assert.equal(toggled.isCompleted, true);
    });
  });
});
