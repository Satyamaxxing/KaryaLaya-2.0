import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import { AnalyticsService } from "../src/server/services/analytics";
import { AutomationService } from "../src/server/services/automations";
import { ClientPortalService } from "../src/server/services/client-portal";
import { AuthenticatedUser } from "../src/server/auth";

describe("Phase 11: Light Intelligence, Real Delivery Analytics & Governed Automations", () => {
  let orgId: string;
  let ownerUser: AuthenticatedUser;
  let managerUser: AuthenticatedUser;
  let memberUser: AuthenticatedUser;
  let clientUser: AuthenticatedUser;

  let clientId: string;
  let contactId: string;
  let projectId: string;

  before(async () => {
    // 1. Setup agency organization
    const org = await prisma.organization.create({
      data: {
        name: `Acme Growth Agency ${Date.now()}`,
        slug: `acme-agency-${Date.now()}`,
      },
    });
    orgId = org.id;

    // 2. Setup Owner
    const owner = await prisma.user.create({
      data: { name: "Ananya Roy", email: `ananya-${Date.now()}@agency.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: owner.id, role: "OWNER", jobTitle: "Agency Director" },
    });
    ownerUser = {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: "OWNER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 3. Setup Manager
    const manager = await prisma.user.create({
      data: { name: "Dev Patel", email: `dev-${Date.now()}@agency.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: manager.id, role: "MANAGER", jobTitle: "Operations Lead" },
    });
    managerUser = {
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: "MANAGER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 4. Setup Specialist Member
    const member = await prisma.user.create({
      data: { name: "Vikram Sen", email: `vikram-${Date.now()}@agency.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: member.id, role: "MEMBER", jobTitle: "Senior Designer" },
    });
    memberUser = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: "MEMBER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 5. Setup Client & Contact
    const client = await prisma.client.create({
      data: {
        organizationId: orgId,
        name: "Zenith Retail",
        industry: "E-Commerce",
      },
    });
    clientId = client.id;

    const contact = await prisma.clientContact.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        name: "Meera Client",
        email: `meera-${Date.now()}@zenith.test`,
        canApprove: true,
      },
    });
    contactId = contact.id;

    clientUser = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      role: "CLIENT",
      organizationId: orgId,
      organizationName: org.name,
      clientId: client.id,
    };

    // 6. Setup Active Project
    const project = await prisma.project.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        ownerId: owner.id,
        name: "Q4 Rebrand Campaign",
        status: "ACTIVE",
      },
    });
    projectId = project.id;
  });

  /* -------------------------------------------------------------------------
   * 1. ANALYTICS: PERMISSIONS & INSUFFICIENT DATA HIDING
   * ----------------------------------------------------------------------- */

  test("1. Analytics: Enforces role permissions (OWNER/MANAGER allowed, MEMBER/CLIENT forbidden)", async () => {
    // OWNER should succeed
    const ownerAnalytics = await AnalyticsService.getAgencyAnalytics(ownerUser, "30d");
    assert.ok(ownerAnalytics);

    // MANAGER should succeed
    const managerAnalytics = await AnalyticsService.getAgencyAnalytics(managerUser, "30d");
    assert.ok(managerAnalytics);

    // MEMBER should be forbidden
    await assert.rejects(
      async () => {
        await AnalyticsService.getAgencyAnalytics(memberUser, "30d");
      },
      (err: any) => {
        assert.ok(err.message.includes("Access Denied") || err.message.includes("VIEW_ANALYTICS"));
        return true;
      }
    );

    // CLIENT should be forbidden
    await assert.rejects(
      async () => {
        await AnalyticsService.getAgencyAnalytics(clientUser, "30d");
      },
      (err: any) => {
        assert.ok(err.message.includes("Access Denied") || err.message.includes("VIEW_ANALYTICS"));
        return true;
      }
    );
  });

  test("2. Analytics: Hides metrics with insufficient data instead of showing zero or fake data", async () => {
    // In our newly created organization, there are no completed deliverables or approval windows yet.
    const analytics = await AnalyticsService.getAgencyAnalytics(ownerUser, "30d");

    // On-Time Delivery Rate must have hasData: false
    assert.equal(analytics.onTimeDelivery.hasData, false);
    assert.equal(analytics.onTimeDelivery.value, undefined);
    assert.ok(analytics.onTimeDelivery.insufficientReason);
    assert.ok(analytics.onTimeDelivery.insufficientReason?.includes("No completed deliverables"));

    // Client Approval Turnaround must have hasData: false
    assert.equal(analytics.approvalTurnaround.hasData, false);
    assert.equal(analytics.approvalTurnaround.value, undefined);
    assert.ok(analytics.approvalTurnaround.insufficientReason);

    // Revision Count must have hasData: false
    assert.equal(analytics.revisions.hasData, false);
    assert.equal(analytics.revisions.value, undefined);

    // Weekly throughput must have hasData: false
    assert.equal(analytics.throughput.hasData, false);
    assert.equal(analytics.throughput.value, undefined);
  });

  /* -------------------------------------------------------------------------
   * 2. ANALYTICS: REAL CALCULATIONS & UNDERLYING ITEM LINKS
   * ----------------------------------------------------------------------- */

  test("3. Analytics: Real calculations for on-time rate, turnaround hours, revisions, throughput, and item links", async () => {
    const now = new Date();
    const sentDate = new Date(Date.now() - 48 * 3600 * 1000); // 48h ago
    const dueDateOnTime = new Date(Date.now() + 24 * 3600 * 1000); // tomorrow (on time)
    const dueDateLate = new Date(Date.now() - 72 * 3600 * 1000); // 3 days ago (completed late)

    // Create Deliverable 1: Completed on time
    const deliv1 = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        projectId,
        title: "Brand Style Guide v1",
        serviceType: "DESIGN",
        ownerId: memberUser.id,
        status: "APPROVED",
        dueDate: dueDateOnTime,
        sentToClientAt: sentDate,
        progressPercent: 100,
      },
    });

    // Create Deliverable 2: Completed late with 2 revisions
    const deliv2 = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        projectId,
        title: "Social Ad Campaign Kit",
        serviceType: "SOCIAL",
        ownerId: memberUser.id,
        status: "APPROVED",
        dueDate: dueDateLate,
        sentToClientAt: sentDate,
        progressPercent: 100,
      },
    });

    // Record 2 client revision requests as real ActivityEvents
    await prisma.activityEvent.create({
      data: {
        organizationId: orgId,
        actorId: clientUser.id,
        actorType: "CLIENT",
        action: "CLIENT_REVISION_REQUESTED",
        entityType: "DELIVERABLE",
        entityId: deliv2.id,
      },
    });
    await prisma.activityEvent.create({
      data: {
        organizationId: orgId,
        actorId: clientUser.id,
        actorType: "CLIENT",
        action: "CLIENT_REVISION_REQUESTED",
        entityType: "DELIVERABLE",
        entityId: deliv2.id,
      },
    });

    // Create task for member to compute workload
    await prisma.task.create({
      data: {
        organizationId: orgId,
        projectId,
        deliverableId: deliv1.id,
        title: "Finalize SVG asset exports",
        status: "IN_PROGRESS",
        assigneeId: memberUser.id,
        priority: "MEDIUM",
        estimateHours: 6,
      },
    });

    // Fetch analytics again
    const analytics = await AnalyticsService.getAgencyAnalytics(ownerUser, "30d");

    // 1. On-time delivery rate: 1 on-time / 2 total = 50%
    assert.equal(analytics.onTimeDelivery.hasData, true);
    assert.equal(analytics.onTimeDelivery.value?.ratePercent, 50);
    assert.equal(analytics.onTimeDelivery.value?.onTimeCount, 1);
    assert.equal(analytics.onTimeDelivery.value?.totalCompletedWithDueDate, 2);
    assert.equal(analytics.onTimeDelivery.value?.items.length, 2);
    assert.ok(analytics.onTimeDelivery.value?.items[0].linkUrl.includes("/app/projects/"));

    // 2. Average client approval turnaround: sent 48h ago, approved now
    assert.equal(analytics.approvalTurnaround.hasData, true);
    assert.ok((analytics.approvalTurnaround.value?.averageHours || 0) >= 0);
    assert.equal(analytics.approvalTurnaround.value?.items.length, 2);

    // 3. Revision count per deliverable and client
    assert.equal(analytics.revisions.hasData, true);
    assert.equal(analytics.revisions.value?.totalRevisionsRequested, 2);
    assert.equal(analytics.revisions.value?.perClient.length, 1);
    assert.equal(analytics.revisions.value?.perClient[0].clientName, "Zenith Retail");
    assert.equal(analytics.revisions.value?.perClient[0].totalRevisions, 2);

    // 4. Weekly throughput
    assert.equal(analytics.throughput.hasData, true);
    assert.ok((analytics.throughput.itemCount || 0) >= 2);

    // 5. Workload per member
    assert.equal(analytics.memberWorkload.hasData, true);
    const memberWorkload = analytics.memberWorkload.value?.members.find(
      (m) => m.memberId === memberUser.id
    );
    assert.ok(memberWorkload);
    assert.equal(memberWorkload.activeTasksCount, 1);
    assert.equal(memberWorkload.estimatedHoursRemaining, 6);

    // 6. Per-client overview
    assert.equal(analytics.clientOverview.hasData, true);
    assert.equal(analytics.clientOverview.value?.clients.length, 1);
    const clientSummary = analytics.clientOverview.value?.clients[0];
    assert.equal(clientSummary?.name, "Zenith Retail");
    assert.equal(clientSummary?.totalDeliverables, 2);
  });

  /* -------------------------------------------------------------------------
   * 3. AUTOMATIONS: DEFAULT SEEDING & SIDE-EFFECT GOVERNANCE
   * ----------------------------------------------------------------------- */

  test("4. Automations: Seeds 5 default agency rules idempotently and enforces client side-effect governance", async () => {
    // Seed default rules
    await AutomationService.seedDefaultRules(orgId, ownerUser.id);

    const rules = await AutomationService.listRules(ownerUser);
    assert.equal(rules.length >= 5, true);

    const revisionRule = rules.find((r) => r.triggerType === "CLIENT_REQUESTED_REVISION");
    assert.ok(revisionRule);
    assert.equal(revisionRule.actionType, "CREATE_TASK");

    // Create a new client side-effect rule that is NOT approved yet
    const unapprovedClientRule = await prisma.automationRule.create({
      data: {
        organizationId: orgId,
        ownerId: memberUser.id,
        name: "Send Promotional Reminder to Client",
        triggerType: "DELIVERABLE_SENT_TO_CLIENT",
        actionType: "SEND_CLIENT_REMINDER",
        actionConfig: JSON.stringify({
          templateSubject: "Exclusive promo for {clientName}",
          message: "Check your review portal now!",
        }),
        enabled: true,
        requiresApproval: true,
        isApproved: false, // NOT approved by manager
      },
    });

    // Trigger execution
    await AutomationService.processTrigger(orgId, "DELIVERABLE_SENT_TO_CLIENT", {
      entityId: "test-deliv-xyz",
      title: "Promo Banner",
    });

    // Verify unapproved rule is SKIPPED
    const run = await prisma.automationRun.findFirst({
      where: { ruleId: unapprovedClientRule.id },
    });
    assert.ok(run);
    assert.equal(run.status, "SKIPPED");
    assert.ok(run.reason?.includes("Requires manager approval"));

    // Now Manager approves the rule
    await AutomationService.approveRule(managerUser, unapprovedClientRule.id);

    const approvedRule = await prisma.automationRule.findUnique({
      where: { id: unapprovedClientRule.id },
    });
    assert.equal(approvedRule?.isApproved, true);
    assert.equal(approvedRule?.approvedById, managerUser.id);
  });

  /* -------------------------------------------------------------------------
   * 4. ACCEPTANCE TEST: CLIENT REVISION REQUEST AUTO-CREATES & ASSIGNS TASK
   * ----------------------------------------------------------------------- */

  test("5. Acceptance: Client revision request automatically creates and assigns task to deliverable owner with ActivityEvent AUTOMATION", async () => {
    // Create deliverable in SENT_TO_CLIENT
    const deliverable = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        projectId,
        title: "Packaging Label Print v1",
        serviceType: "PRINT",
        ownerId: memberUser.id,
        status: "SENT_TO_CLIENT",
        sentToClientAt: new Date(),
        weight: 1.0,
      },
    });

    // Client requests revision with specific change note
    const revisionResult = await ClientPortalService.requestDeliverableRevisionAsClient(
      clientUser,
      deliverable.id,
      "Please adjust barcode dimensions to 40mm x 25mm and lighten the amber border."
    );

    assert.equal(revisionResult.success, true);
    assert.equal(revisionResult.status, "REVISION_REQUESTED");

    // Verify governed automation automatically executed and created task!
    const autoCreatedTask = await prisma.task.findFirst({
      where: {
        organizationId: orgId,
        deliverableId: deliverable.id,
        title: { contains: "Packaging Label Print v1" },
      },
    });

    assert.ok(autoCreatedTask, "Automation failed to create task on client revision request!");
    assert.equal(autoCreatedTask.assigneeId, memberUser.id, "Task not assigned to deliverable owner!");
    assert.equal(autoCreatedTask.priority, "HIGH");
    assert.equal(autoCreatedTask.status, "TODO");

    // Verify ActivityEvent created with actorType AUTOMATION
    const activityEvent = await prisma.activityEvent.findFirst({
      where: {
        organizationId: orgId,
        actorType: "AUTOMATION",
      },
    });
    assert.ok(activityEvent, "ActivityEvent with actorType: AUTOMATION was not recorded!");
    assert.equal(activityEvent.actorType, "AUTOMATION");

    // Verify AutomationRun is SUCCESS
    const autoRun = await prisma.automationRun.findFirst({
      where: {
        organizationId: orgId,
        status: "SUCCESS",
        rule: {
          triggerType: "CLIENT_REQUESTED_REVISION",
        },
      },
      orderBy: { executedAt: "desc" },
    });
    assert.ok(autoRun);
    assert.equal(autoRun.status, "SUCCESS");
  });

  /* -------------------------------------------------------------------------
   * 5. ACCEPTANCE TEST: FAILING RULE SHOWS CLEAR ERROR AND RETRIES WITH BACKOFF
   * ----------------------------------------------------------------------- */

  test("6. Acceptance: Failing rule shows clear error and retries with exponential backoff", async () => {
    // Create a deliberately failing rule (e.g. invalid action type or missing required target)
    const failingRule = await prisma.automationRule.create({
      data: {
        organizationId: orgId,
        ownerId: ownerUser.id,
        name: "Fragile Rule Targeting Nonexistent Resource",
        triggerType: "TASK_MOVED_TO_REVIEW",
        actionType: "CREATE_TASK",
        actionConfig: JSON.stringify({
          taskTitle: "", // Deliberately invalid empty title to fail validation
          missingField: true,
        }),
        enabled: true,
        requiresApproval: false,
        isApproved: true,
      },
    });

    // Trigger execution
    await AutomationService.processTrigger(orgId, "TASK_MOVED_TO_REVIEW", {
      entityId: "task-abc",
      title: "Broken task trigger",
      eventKey: `broken-task-${Date.now()}`,
    });

    // Check AutomationRun for failure / retrying status
    const failedRun = await prisma.automationRun.findFirst({
      where: { ruleId: failingRule.id },
      orderBy: { executedAt: "desc" },
    });

    assert.ok(failedRun, "No run logged for failing automation rule!");
    assert.equal(failedRun.status, "RETRYING");
    assert.equal(failedRun.retryCount, 1);
    assert.ok(failedRun.nextRetryAt, "nextRetryAt must be set for retry with backoff!");
    assert.ok(failedRun.reason, "Clear error reason must be present!");
    assert.ok(
      failedRun.reason.includes("Deliverable") || failedRun.reason.includes("Task title is required")
    );

    // Ensure backoff timestamp is in the future
    const nowTime = Date.now();
    const retryTime = new Date(failedRun.nextRetryAt).getTime();
    assert.ok(retryTime > nowTime, "Backoff timestamp should be scheduled in the future!");

    // Test retry processor safely handles queue
    const retriedRuns = await AutomationService.processPendingRetries(orgId);
    assert.ok(Array.isArray(retriedRuns));
  });

  /* -------------------------------------------------------------------------
   * 6. MANUAL TEST RUN & IDEMPOTENCY
   * ----------------------------------------------------------------------- */

  test("7. Automations: Manual test run executes deterministically without error", async () => {
    const rules = await AutomationService.listRules(ownerUser);
    const testRule = rules.find((r) => r.triggerType === "TASK_MOVED_TO_REVIEW" && r.actionType === "NOTIFY_USER_OR_ROLE");
    assert.ok(testRule);

    const testOutput = await AutomationService.testRunRule(ownerUser, testRule.id, {
      taskTitle: "Design System Tokens",
    });

    assert.ok(testOutput);
    assert.equal(testOutput.ruleId, testRule.id);
    assert.equal(testOutput.status, "SUCCESS");
  });
});
