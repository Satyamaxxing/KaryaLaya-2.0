import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import { DashboardService } from "../src/server/services/dashboard";
import { AgencyWorkService } from "../src/server/services/agency-work";
import { AuthenticatedUser } from "../src/server/auth";

describe("Phase 5: Role-Wise Dashboards & Attention Telemetry", () => {
  let orgId: string;
  let ownerUser: AuthenticatedUser;
  let memberUser: AuthenticatedUser;
  let testProject: any;
  let testDeliverable: any;

  before(async () => {
    // 1. Setup isolated test organization
    const org = await prisma.organization.create({
      data: {
        name: `Dashboard Test Agency ${Date.now()}`,
        slug: `dash-test-${Date.now()}`,
      },
    });
    orgId = org.id;

    // 2. Setup Owner
    const owner = await prisma.user.create({
      data: { name: "Meera Owner", email: `owner-${Date.now()}@dash.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: owner.id, role: "OWNER", jobTitle: "Founder & CEO" },
    });
    ownerUser = {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: "OWNER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 3. Setup Member
    const member = await prisma.user.create({
      data: { name: "Satyam Dev", email: `dev-${Date.now()}@dash.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: member.id, role: "MEMBER", jobTitle: "Lead Developer" },
    });
    memberUser = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: "MEMBER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 4. Setup Client & Project
    const client = await AgencyWorkService.createClient(ownerUser, {
      name: "Starlight Media",
      companyName: "Starlight Media Inc.",
    });

    testProject = await AgencyWorkService.createProject(ownerUser, {
      clientId: client.id,
      name: "Starlight Digital Campaign",
      description: "Q4 marketing and media push",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    // 5. Setup Deliverables
    testDeliverable = await AgencyWorkService.createDeliverable(ownerUser, {
      projectId: testProject.id,
      title: "Hero Brand Video Commercial",
      serviceType: "VIDEO",
      weight: 1.0,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    // Deliverable waiting on client approval
    const sentDeliverable = await AgencyWorkService.createDeliverable(ownerUser, {
      projectId: testProject.id,
      title: "Brand Style Guide Deck",
      serviceType: "BRANDING",
      weight: 1.0,
    });
    await AgencyWorkService.updateDeliverableStatus(ownerUser, sentDeliverable.id, "IN_PROGRESS");
    await AgencyWorkService.updateDeliverableStatus(ownerUser, sentDeliverable.id, "IN_REVIEW");
    await AgencyWorkService.updateDeliverableStatus(ownerUser, sentDeliverable.id, "SENT_TO_CLIENT");

    // 6. Setup Tasks for Member
    // Task due today
    const startOfToday = new Date();
    startOfToday.setHours(12, 0, 0, 0);

    await AgencyWorkService.createTask(ownerUser, {
      projectId: testProject.id,
      deliverableId: testDeliverable.id,
      title: "Color grade intro footage",
      assigneeId: memberUser.id,
      priority: "HIGH",
      dueDate: startOfToday,
      estimateHours: 4,
    });

    // Overdue task for Member
    const overdueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await AgencyWorkService.createTask(ownerUser, {
      projectId: testProject.id,
      deliverableId: testDeliverable.id,
      title: "Sync audio mastering stems",
      assigneeId: memberUser.id,
      priority: "URGENT",
      dueDate: overdueDate,
      estimateHours: 2,
    });

    // Task with Revision Requested
    const revisionTask = await AgencyWorkService.createTask(ownerUser, {
      projectId: testProject.id,
      deliverableId: testDeliverable.id,
      title: "Fix caption timing on 15s cut",
      assigneeId: memberUser.id,
      priority: "MEDIUM",
    });
    await prisma.task.update({
      where: { id: revisionTask.id },
      data: { isRevisionRequested: true },
    });

    // Task waiting in review
    const inReviewTask = await AgencyWorkService.createTask(ownerUser, {
      projectId: testProject.id,
      deliverableId: testDeliverable.id,
      title: "Submit 30s cut draft",
      assigneeId: memberUser.id,
      priority: "HIGH",
    });
    await AgencyWorkService.updateTask(ownerUser, inReviewTask.id, {
      status: "IN_REVIEW",
    });
  });

  test("OWNER dashboard accurately computes Needs Attention telemetry", async () => {
    const dashData: any = await DashboardService.getDashboardData(ownerUser);

    assert.equal(dashData.role, "OWNER");
    assert.ok(dashData.needsAttention);

    // 1. Client Approvals Pending: at least 1 (the Brand Style Guide Deck in SENT_TO_CLIENT)
    assert.ok(dashData.needsAttention.clientApprovalsPending.length >= 1);
    const pending = dashData.needsAttention.clientApprovalsPending.find(
      (d: any) => d.title === "Brand Style Guide Deck"
    );
    assert.ok(pending);
    assert.equal(pending.status, "SENT_TO_CLIENT");

    // 2. Overdue Tasks: at least 1 ("Sync audio mastering stems")
    assert.ok(dashData.needsAttention.overdueTasks.length >= 1);
    const overdue = dashData.needsAttention.overdueTasks.find(
      (t: any) => t.title === "Sync audio mastering stems"
    );
    assert.ok(overdue);

    // 3. Waiting Review Tasks: at least 1 ("Submit 30s cut draft")
    assert.ok(dashData.needsAttention.waitingReviewTasks.length >= 1);
    const review = dashData.needsAttention.waitingReviewTasks.find(
      (t: any) => t.title === "Submit 30s cut draft"
    );
    assert.ok(review);

    // 4. Active Projects: includes Starlight Digital Campaign
    assert.ok(dashData.activeProjects.length >= 1);
    const proj = dashData.activeProjects.find((p: any) => p.id === testProject.id);
    assert.ok(proj);
    assert.equal(proj.name, "Starlight Digital Campaign");

    // 5. Team Workload: Satyam Dev is active with open tasks and overdue count
    assert.ok(dashData.teamWorkload.length >= 2);
    const memberSummary = dashData.teamWorkload.find((m: any) => m.user.id === memberUser.id);
    assert.ok(memberSummary);
    assert.ok(memberSummary.openTasksCount >= 3);
    assert.ok(memberSummary.overdueCount >= 1);
    assert.equal(memberSummary.isIdle, false);

    // 6. Recent Activity: includes event records
    assert.ok(dashData.recentActivity.length >= 1);
  });

  test("MEMBER dashboard computes personalized action items and deadlines", async () => {
    const dashData: any = await DashboardService.getDashboardData(memberUser);

    assert.equal(dashData.role, "MEMBER");

    // 1. My tasks today
    assert.ok(dashData.myTasksToday.length >= 1);
    const todayTask = dashData.myTasksToday.find(
      (t: any) => t.title === "Color grade intro footage"
    );
    assert.ok(todayTask);

    // 2. Overdue tasks
    assert.ok(dashData.overdueTasks.length >= 1);
    const overdueTask = dashData.overdueTasks.find(
      (t: any) => t.title === "Sync audio mastering stems"
    );
    assert.ok(overdueTask);

    // 3. Revisions requested
    assert.ok(dashData.revisionsRequested.length >= 1);
    const revTask = dashData.revisionsRequested.find(
      (t: any) => t.title === "Fix caption timing on 15s cut"
    );
    assert.ok(revTask);
    assert.equal(revTask.isRevisionRequested, true);
  });
});
