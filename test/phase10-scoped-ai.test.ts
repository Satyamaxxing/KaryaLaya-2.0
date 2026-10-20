import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import { AiService } from "../src/server/ai/service";
import { aiRateLimiter } from "../src/server/ai/rate-limiter";
import { AuthenticatedUser } from "../src/server/auth";

describe("Phase 10: Scoped AI, Small and Trustworthy", () => {
  let orgId: string;
  let ownerUser: AuthenticatedUser;
  let managerUser: AuthenticatedUser;
  let memberUser: AuthenticatedUser;
  let clientUser: AuthenticatedUser;
  let clientId: string;
  let projectId: string;
  let deliverable1Id: string;
  let deliverable2Id: string;
  let task1Id: string;
  let task2Id: string;

  before(async () => {
    // 1. Setup agency organization
    const org = await prisma.organization.create({
      data: {
        name: `Apex Creative AI Lab ${Date.now()}`,
        slug: `apex-ai-${Date.now()}`,
      },
    });
    orgId = org.id;

    // 2. Setup Agency Owner
    const owner = await prisma.user.create({
      data: { name: "Tara Rao", email: `tara-${Date.now()}@apex.test` },
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
      organizationName: org.name,
    };

    // 3. Setup Agency Manager
    const mgr = await prisma.user.create({
      data: { name: "Kunal Mehra", email: `kunal-${Date.now()}@apex.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: mgr.id, role: "MANAGER" },
    });
    managerUser = {
      id: mgr.id,
      name: mgr.name,
      email: mgr.email,
      role: "MANAGER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 4. Setup Team Member
    const member = await prisma.user.create({
      data: { name: "Neha Gupta", email: `neha-${Date.now()}@apex.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: member.id, role: "MEMBER" },
    });
    memberUser = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: "MEMBER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 5. Setup Client and Client User
    const client = await prisma.client.create({
      data: {
        name: "Zenith Retail",
        companyName: "Zenith Retail Inc.",
        organizationId: orgId,
        portalAccessEnabled: true,
      },
    });
    clientId = client.id;

    const cUser = await prisma.user.create({
      data: { name: "Zara Zenith", email: `zara-${Date.now()}@zenith.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: cUser.id, role: "CLIENT" },
    });
    clientUser = {
      id: cUser.id,
      name: cUser.name,
      email: cUser.email,
      role: "CLIENT",
      organizationId: orgId,
      organizationName: org.name,
      clientId: client.id,
    };

    // 6. Setup Project
    const project = await prisma.project.create({
      data: {
        name: "E-Commerce Rebrand & Web Platform",
        description: "Full omnichannel redesign and headless storefront.",
        organizationId: orgId,
        clientId: client.id,
        ownerId: owner.id,
        status: "IN_PROGRESS",
      },
    });
    projectId = project.id;

    // 7. Setup Deliverables (Deliverable 1 completed, Deliverable 2 AT_RISK)
    const d1 = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        title: "Brand Style Guide & Visual Assets",
        description: "Core identity typography, color tokens, and vector kits.",
        serviceType: "DESIGN",
        status: "APPROVED",
        progressPercent: 100,
        weight: 1.0,
        projectId: project.id,
        ownerId: member.id,
      },
    });
    deliverable1Id = d1.id;

    const d2 = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        title: "Headless Storefront Checkout Flow",
        description: "Next.js checkout flow with Stripe Elements integration.",
        serviceType: "WEB_DEV",
        status: "IN_PROGRESS",
        progressPercent: 30,
        weight: 2.0,
        riskStatus: "AT_RISK",
        riskReason: "Payment gateway integration task is 4 days overdue, blocking client review window.",
        dueDate: new Date(Date.now() + 86400000 * 2), // due in 2 days
        projectId: project.id,
        ownerId: member.id,
      },
    });
    deliverable2Id = d2.id;

    // 8. Setup Tasks
    const t1 = await prisma.task.create({
      data: {
        organizationId: orgId,
        title: "Stripe Webhook Handlers & Idempotency",
        status: "TODO",
        priority: "HIGH",
        deliverableId: d2.id,
        projectId: project.id,
        assigneeId: member.id,
        dueDate: new Date(Date.now() - 86400000 * 4), // 4 days overdue
        estimateHours: 8,
      },
    });
    task1Id = t1.id;

    const t2 = await prisma.task.create({
      data: {
        organizationId: orgId,
        title: "Client Review Walkthrough Video",
        status: "TODO",
        priority: "MEDIUM",
        deliverableId: d2.id,
        projectId: project.id,
        assigneeId: member.id,
        estimateHours: 2,
      },
    });
    task2Id = t2.id;

    // 9. Setup Discussion Comments for Thread Summary
    await prisma.comment.create({
      data: {
        organizationId: orgId,
        authorName: owner.name,
        content: "Initial scoping meeting completed. Client requested dark mode theme support.",
        visibility: "CLIENT_VISIBLE",
        projectId: project.id,
        authorId: owner.id,
      },
    });
    await prisma.comment.create({
      data: {
        organizationId: orgId,
        authorName: member.name,
        content: "Agreed. We will support Tailwind dark mode classes across all deliverable components.",
        visibility: "INTERNAL",
        projectId: project.id,
        authorId: member.id,
      },
    });
    await prisma.comment.create({
      data: {
        organizationId: orgId,
        authorName: mgr.name,
        content: "Do we have the Figma tokens for the dark palette yet?",
        visibility: "INTERNAL",
        projectId: project.id,
        authorId: mgr.id,
      },
    });
  });

  // =========================================================================
  // TEST 1: Provider Fallback & Graceful Offline Behavior
  // =========================================================================
  test("Feature 0: AI works cleanly with deterministic offline fallback when AI is unconfigured/disabled", async () => {
    // Generate draft using memberUser
    const res = await AiService.generateClientUpdateDraft(memberUser, projectId);

    assert.strictEqual(res.isAiGenerated, true);
    assert.ok(res.outputId.length > 0);
    assert.ok(res.data.subject.length > 0);
    assert.ok(res.data.body.length > 0);
    assert.strictEqual(res.data.completedHighlights.length > 0, true);
    assert.strictEqual(res.model, "deterministic-engine");
  });

  // =========================================================================
  // TEST 2: Client Update Draft (Client-Visible Data ONLY & Human Edits)
  // =========================================================================
  test("Feature 1: Client update draft uses only client-visible data and is stored without auto-sending", async () => {
    const res = await AiService.generateClientUpdateDraft(ownerUser, projectId);

    // Verify stored in database
    const saved = await prisma.aiOutput.findUnique({
      where: { id: res.outputId },
    });
    assert.ok(saved);
    assert.strictEqual(saved.feature, "CLIENT_UPDATE_DRAFT");
    assert.strictEqual(saved.status, "GENERATED");
    assert.strictEqual(saved.requestedById, ownerUser.id);

    // Verify draft content references approved deliverable
    assert.ok(
      res.data.body.includes("Brand Style Guide") ||
      res.data.completedHighlights.some((h) => h.includes("Brand Style Guide"))
    );

    // Verify internal raw risks and internal task assignments are NOT leaked into the friendly client update
    assert.strictEqual(res.data.body.includes("Stripe Webhook Handlers & Idempotency"), false);
    assert.strictEqual(res.data.body.includes("4 days overdue"), false);
  });

  // =========================================================================
  // TEST 3: "Why is this at risk?" 3-Level Causality Explainer
  // =========================================================================
  test("Feature 2: 'Why is this at risk?' generates 3-level explanation (Summary, Cause chain, Real Evidence links)", async () => {
    const res = await AiService.explainRiskReason(memberUser, deliverable2Id);

    assert.ok(res.data);
    assert.strictEqual(res.data.deliverableId, deliverable2Id);

    // Level 1: Summary in plain language
    assert.ok(res.data.level1Summary.length > 0);
    assert.ok(
      res.data.level1Summary.includes("at risk") ||
      res.data.level1Summary.includes("overdue") ||
      res.data.level1Summary.includes("Checkout Flow")
    );

    // Level 2: Cause Chain (task -> dependency -> deliverable -> client review)
    assert.ok(Array.isArray(res.data.level2CauseChain));
    assert.ok(res.data.level2CauseChain.length >= 2);
    const types = res.data.level2CauseChain.map((c) => c.entityType);
    assert.ok(types.includes("TASK"));
    assert.ok(types.includes("DELIVERABLE") || types.includes("CLIENT_REVIEW"));

    // Level 3: Evidence with real database entity links
    assert.ok(Array.isArray(res.data.level3Evidence));
    assert.ok(res.data.level3Evidence.length > 0);
    const taskEvidence = res.data.level3Evidence.find((e) => e.entityType === "TASK");
    assert.ok(taskEvidence);
    assert.strictEqual(taskEvidence.entityId, task1Id);
    assert.ok(taskEvidence.title.includes("Stripe"));

    // Mitigations
    assert.ok(Array.isArray(res.data.mitigationSuggestions));
    assert.ok(res.data.mitigationSuggestions.length > 0);
  });

  // =========================================================================
  // TEST 4: Weekly Agency Summary (Owner / Manager Scoped)
  // =========================================================================
  test("Feature 3: Weekly agency summary is accessible to OWNER/MANAGER and rejects MEMBER", async () => {
    // 1. Rejects MEMBER role
    await assert.rejects(
      async () => {
        await AiService.generateWeeklyAgencySummary(memberUser);
      },
      /Access Denied/
    );

    // 2. Allows OWNER role
    const ownerRes = await AiService.generateWeeklyAgencySummary(ownerUser);
    assert.ok(ownerRes.data);
    assert.strictEqual(ownerRes.data.finishedThisWeek.length > 0, true);
    assert.strictEqual(ownerRes.data.stuckOrAtRisk.length > 0, true);
    assert.ok(ownerRes.data.stuckOrAtRisk.some((s) => s.title.includes("Headless Storefront")));

    // 3. Allows MANAGER role
    const mgrRes = await AiService.generateWeeklyAgencySummary(managerUser);
    assert.ok(mgrRes.data);
  });

  // =========================================================================
  // TEST 5: Task Breakdown Suggestions & Human Approval Gate
  // =========================================================================
  test("Feature 4: Task breakdown suggestions are NEVER created silently; only created on explicit human approval with audit log", async () => {
    // Count tasks before AI suggestion
    const countBefore = await prisma.task.count({
      where: { deliverableId: deliverable1Id },
    });

    // Generate AI task breakdown
    const suggestionRes = await AiService.suggestTaskBreakdown(memberUser, deliverable1Id);
    assert.ok(suggestionRes.data.suggestedTasks.length > 0);

    // Verify tasks were NOT created in database
    const countAfterSuggestion = await prisma.task.count({
      where: { deliverableId: deliverable1Id },
    });
    assert.strictEqual(countAfterSuggestion, countBefore, "AI suggestion must never create tasks silently!");

    // Human member (without CREATE_TASK permission) is rejected
    const approvedTasks = suggestionRes.data.suggestedTasks.slice(0, 2);
    await assert.rejects(
      async () => {
        await AiService.applyAiAction(
          memberUser,
          suggestionRes.outputId,
          {
            actionType: "CREATE_SUGGESTED_TASKS",
            deliverableId: deliverable1Id,
            tasks: approvedTasks,
          }
        );
      },
      /Access Denied/
    );

    // Human manager (with CREATE_TASK permission) approves first 2 suggestions
    const applyRes = await AiService.applyAiAction(
      managerUser,
      suggestionRes.outputId,
      {
        actionType: "CREATE_SUGGESTED_TASKS",
        deliverableId: deliverable1Id,
        tasks: approvedTasks,
      }
    );

    assert.strictEqual(applyRes.createdTasksCount, 2);

    // Verify tasks NOW exist in database
    const countAfterApproval = await prisma.task.count({
      where: { deliverableId: deliverable1Id },
    });
    assert.strictEqual(countAfterApproval, countBefore + 2);

    // Verify AiOutput state transitioned to APPLIED
    const updatedAiOutput = await prisma.aiOutput.findUnique({
      where: { id: suggestionRes.outputId },
    });
    assert.strictEqual(updatedAiOutput?.status, "APPLIED");
    assert.strictEqual(updatedAiOutput?.approvedById, managerUser.id);

    // Verify ActivityEvent was logged with actorType: "AI" and human approval metadata
    const auditEvent = await prisma.activityEvent.findFirst({
      where: {
        action: "AI_TASKS_APPROVED",
        actorType: "AI",
        organizationId: orgId,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(auditEvent);
    assert.ok(auditEvent.metadata?.includes(managerUser.id) || auditEvent.metadata?.includes(managerUser.name));
  });

  // =========================================================================
  // TEST 6: Thread Summary & Permission Scoping
  // =========================================================================
  test("Feature 5: Thread summary extracts key decisions, open questions, and action items respecting tenant isolation", async () => {
    // Internal user summary (includes internal + client comments = 3)
    const threadRes = await AiService.summarizeThread(managerUser, {
      entityType: "PROJECT",
      entityId: projectId,
    });
    assert.ok(threadRes.data);
    assert.strictEqual(threadRes.data.totalCommentsAnalyzed, 3);
    assert.ok(threadRes.data.discussionSummary.length > 0);
    assert.ok(threadRes.data.keyDecisions.length > 0 || threadRes.data.actionItems.length > 0);

    // Client user summary filters internal discussions (sees only CLIENT_VISIBLE = 1)
    const clientThreadRes = await AiService.summarizeThread(clientUser, {
      entityType: "PROJECT",
      entityId: projectId,
    });
    assert.ok(clientThreadRes.data);
    assert.strictEqual(clientThreadRes.data.totalCommentsAnalyzed, 1);
  });

  // =========================================================================
  // TEST 7: Sliding Window Rate Limiter
  // =========================================================================
  test("Safety: Rate limiter enforces limit and calculates retry time", () => {
    const testUserId = `rate-limit-test-${Date.now()}`;
    const limit = 25;

    // First 25 should pass
    for (let i = 0; i < limit; i++) {
      const check = aiRateLimiter.checkRateLimit(testUserId);
      assert.strictEqual(check.allowed, true);
    }

    // 26th should be blocked
    const blockedCheck = aiRateLimiter.checkRateLimit(testUserId);
    assert.strictEqual(blockedCheck.allowed, false);
    assert.ok(blockedCheck.retryAfterSec! > 0);
  });
});
