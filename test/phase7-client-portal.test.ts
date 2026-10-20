import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import { ClientPortalService } from "../src/server/services/client-portal";
import { AgencyWorkService } from "../src/server/services/agency-work";
import { CommentService } from "../src/server/services/comments";
import { FileService } from "../src/server/services/files";
import { AuthenticatedUser } from "../src/server/auth";

describe("Phase 7: Client Portal Scoped Projection & Approval Engine", () => {
  let orgId: string;
  let ownerUser: AuthenticatedUser;
  let memberUser: AuthenticatedUser;

  // Client A
  let clientAId: string;
  let contactAId: string;
  let clientAUser: AuthenticatedUser;
  let projectA: any;
  let deliverableA: any;

  // Client B (Separate Client for isolation testing)
  let clientBId: string;
  let contactBId: string;
  let clientBUser: AuthenticatedUser;
  let projectB: any;

  before(async () => {
    // 1. Setup agency organization
    const org = await prisma.organization.create({
      data: {
        name: `Horizon Agency ${Date.now()}`,
        slug: `horizon-${Date.now()}`,
      },
    });
    orgId = org.id;

    // 2. Setup Owner
    const owner = await prisma.user.create({
      data: { name: "Vikram Owner", email: `vikram-${Date.now()}@horizon.test` },
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

    // 3. Setup Team Member (Creative Lead)
    const member = await prisma.user.create({
      data: { name: "Kavita Designer", email: `kavita-${Date.now()}@horizon.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: member.id, role: "MEMBER", jobTitle: "Brand Lead" },
    });
    memberUser = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: "MEMBER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 4. Setup Client A + Contact A
    const clientA = await prisma.client.create({
      data: {
        organizationId: orgId,
        name: "Acme Brands",
        companyName: "Acme Corporation",
        portalAccessEnabled: true,
      },
    });
    clientAId = clientA.id;

    const contactA = await prisma.clientContact.create({
      data: {
        organizationId: orgId,
        clientId: clientA.id,
        name: "Alice Cooper",
        email: `alice-${Date.now()}@acme.test`,
        canApprove: true,
      },
    });
    contactAId = contactA.id;

    clientAUser = {
      id: contactA.id,
      name: contactA.name,
      email: contactA.email,
      role: "CLIENT",
      organizationId: orgId,
      organizationName: org.name,
      clientId: clientA.id,
      canApprove: true,
    };

    // 5. Setup Client B + Contact B
    const clientB = await prisma.client.create({
      data: {
        organizationId: orgId,
        name: "Stark Labs",
        companyName: "Stark Enterprises",
        portalAccessEnabled: true,
      },
    });
    clientBId = clientB.id;

    const contactB = await prisma.clientContact.create({
      data: {
        organizationId: orgId,
        clientId: clientB.id,
        name: "Tony Client",
        email: `tony-${Date.now()}@stark.test`,
        canApprove: true,
      },
    });
    contactBId = contactB.id;

    clientBUser = {
      id: contactB.id,
      name: contactB.name,
      email: contactB.email,
      role: "CLIENT",
      organizationId: orgId,
      organizationName: org.name,
      clientId: clientB.id,
      canApprove: true,
    };

    // 6. Setup Project for Client A
    projectA = await prisma.project.create({
      data: {
        organizationId: orgId,
        clientId: clientAId,
        name: "Acme Brand Refresh 2026",
        description: "Full identity overhaul & campaign deliverables",
        status: "ACTIVE",
        ownerId: ownerUser.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Deliverable for Client A
    deliverableA = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        projectId: projectA.id,
        title: "Acme Visual Identity System",
        description: "Vector logo assets, brand guidelines, and color tokens",
        serviceType: "BRANDING",
        ownerId: memberUser.id,
        status: "SENT_TO_CLIENT",
        sentToClientAt: new Date(),
        weight: 2.0,
      },
    });

    // 7. Setup Project for Client B
    projectB = await prisma.project.create({
      data: {
        organizationId: orgId,
        clientId: clientBId,
        name: "Stark Quantum Platform",
        description: "Confidential R&D portal",
        status: "ACTIVE",
        ownerId: ownerUser.id,
      },
    });
  });

  /* -------------------------------------------------------------------------
   * 1. MAGIC LINK AUTHENTICATION FLOW
   * ----------------------------------------------------------------------- */
  test("1. Magic link generates secure passwordless token and verifies session", async () => {
    // Generate magic link
    const magicResult = await ClientPortalService.createMagicLink(
      clientAUser.email,
      "http://localhost:3000"
    );

    assert.equal(magicResult.success, true);
    assert.match(magicResult.magicLinkUrl, /verify\?token=[a-f0-9]{64}/);
    assert.equal(magicResult.name, "Alice Cooper");

    // Extract token from URL
    const token = magicResult.magicLinkUrl.split("token=")[1];

    // Verify token creates valid session with CLIENT role
    const verifyResult = await ClientPortalService.verifyMagicLink(token);
    assert.ok(verifyResult.sessionToken);
    assert.equal(verifyResult.contact.id, contactAId);
    assert.equal(verifyResult.contact.clientId, clientAId);
    assert.equal(verifyResult.contact.canApprove, true);

    // Replay attack prevention: token must be invalidated
    await assert.rejects(
      async () => {
        await ClientPortalService.verifyMagicLink(token);
      },
      /expired or is invalid/
    );
  });

  /* -------------------------------------------------------------------------
   * 2. DATA LEAK PREVENTION & CLIENT ISOLATION
   * ----------------------------------------------------------------------- */
  test("2. Client cannot view another client's project via direct URL/ID manipulation", async () => {
    // Client A attempts to directly access Client B's project
    await assert.rejects(
      async () => {
        await ClientPortalService.getClientProjectDetails(clientAUser, projectB.id);
      },
      /Access denied: You do not have permission to view this project/
    );

    // Client B attempts to directly access Client A's project
    await assert.rejects(
      async () => {
        await ClientPortalService.getClientProjectDetails(clientBUser, projectA.id);
      },
      /Access denied: You do not have permission to view this project/
    );
  });

  test("3. Scoped projection strictly hides internal comments, tasks, hours, risk reasoning", async () => {
    // Add internal task with hours and notes to projectA deliverable
    const internalTask = await prisma.task.create({
      data: {
        organizationId: orgId,
        projectId: projectA.id,
        deliverableId: deliverableA.id,
        title: "Internal Vector Cleaning & Math",
        description: "Internal note: tricky curves need manual bezier tweak",
        estimateHours: 8.5,
        loggedHours: 4.0,
        status: "IN_PROGRESS",
        priority: "HIGH",
      },
    });

    // Add internal comment
    await CommentService.createComment(memberUser, {
      projectId: projectA.id,
      deliverableId: deliverableA.id,
      content: "Internal note: Client might question the secondary color palette. Be prepared.",
      visibility: "INTERNAL",
    });

    // Add client-visible comment
    await CommentService.createComment(ownerUser, {
      projectId: projectA.id,
      deliverableId: deliverableA.id,
      content: "Hello Alice, please review the latest brand kit in the portal.",
      visibility: "CLIENT_VISIBLE",
    });

    // Add internal file
    await FileService.uploadFile(memberUser, {
      projectId: projectA.id,
      deliverableId: deliverableA.id,
      fileName: "internal_brief_costs.pdf",
      fileSize: 45000,
      fileType: "application/pdf",
      visibility: "INTERNAL",
    });

    // Add client-visible file
    await FileService.uploadFile(memberUser, {
      projectId: projectA.id,
      deliverableId: deliverableA.id,
      fileName: "Acme_Brand_Guidelines_v1.pdf",
      fileSize: 2500000,
      fileType: "application/pdf",
      visibility: "CLIENT_VISIBLE",
    });

    // Set internal risk reason on deliverable
    await prisma.deliverable.update({
      where: { id: deliverableA.id },
      data: {
        riskStatus: "AT_RISK",
        riskReason: "Internal risk: Senior designer is double-booked on Stark project",
      },
    });

    // Fetch projection as Client A
    const projection = await ClientPortalService.getClientProjectDetails(clientAUser, projectA.id);

    // Assert project metadata
    assert.equal(projection.id, projectA.id);
    assert.equal(projection.name, "Acme Brand Refresh 2026");
    assert.equal(projection.agency.name.includes("Horizon Agency"), true);
    assert.equal(projection.client.name, "Acme Brands");

    // CRITICAL SECURITY CHECKS:
    // 1. Internal comments: ONLY 1 comment visible (the CLIENT_VISIBLE one)
    assert.equal(projection.comments.length, 1);
    assert.equal(projection.comments[0].content.includes("Hello Alice"), true);
    assert.equal(
      projection.comments.some((c) => c.content.includes("Internal note")),
      false,
      "Data leak: Internal comment leaked to client!"
    );

    // 2. Internal files: ONLY 1 file visible (the CLIENT_VISIBLE one)
    const delivProj = projection.deliverables.find((d) => d.id === deliverableA.id);
    assert.ok(delivProj);
    assert.equal(delivProj.files.length, 1);
    assert.equal(delivProj.files[0].fileName, "Acme_Brand_Guidelines_v1.pdf");
    assert.equal(
      delivProj.files.some((f) => f.fileName.includes("internal_brief_costs")),
      false,
      "Data leak: Internal file leaked to client!"
    );

    // 3. Deliverable projection must NOT contain tasks, riskReason, or riskStatus!
    assert.equal((delivProj as any).tasks, undefined, "Data leak: tasks array leaked to client!");
    assert.equal((delivProj as any).riskReason, undefined, "Data leak: riskReason leaked to client!");
    assert.equal((delivProj as any).riskStatus, undefined, "Data leak: riskStatus leaked to client!");

    // 4. Plain-language status
    assert.equal(delivProj.plainStatus, "Ready For Your Review");
  });

  /* -------------------------------------------------------------------------
   * 3. DELIVERABLE APPROVAL ENGINE & PROGRESS RECALCULATION
   * ----------------------------------------------------------------------- */
  test("4. Client approval updates deliverable to APPROVED, recalculates progress, creates ActivityEvent, and notifies owners", async () => {
    // DeliverableA is currently SENT_TO_CLIENT
    const approveResult = await ClientPortalService.approveDeliverableAsClient(
      clientAUser,
      deliverableA.id,
      { note: "Looks phenomenal, ready to roll out!" }
    );

    assert.equal(approveResult.success, true);
    assert.equal(approveResult.status, "APPROVED");

    // Verify Deliverable in DB
    const updatedDeliv = await prisma.deliverable.findUnique({
      where: { id: deliverableA.id },
    });
    assert.equal(updatedDeliv?.status, "APPROVED");
    assert.equal(updatedDeliv?.progressPercent, 100);

    // Verify Project Progress recalculated in same transaction (deliverable APPROVED counts 100%)
    const updatedProj = await prisma.project.findUnique({
      where: { id: projectA.id },
    });
    assert.equal(updatedProj?.progressPercent, 100);

    // Verify ActivityEvent created with actorType: CLIENT
    const activityEvent = await prisma.activityEvent.findFirst({
      where: {
        organizationId: orgId,
        entityId: deliverableA.id,
        action: "CLIENT_APPROVED",
      },
    });
    assert.ok(activityEvent);
    assert.equal(activityEvent.actorType, "CLIENT");
    assert.equal(activityEvent.actorId, clientAUser.id);

    // Verify Notification created for deliverable owner (memberUser)
    const notification = await prisma.notification.findFirst({
      where: {
        organizationId: orgId,
        recipientId: memberUser.id,
        type: "CLIENT_APPROVED",
      },
    });
    assert.ok(notification);
    assert.equal(notification.title, "Deliverable Approved!");

    // Idempotency check: Re-approving already approved deliverable is safe
    const reApprove = await ClientPortalService.approveDeliverableAsClient(
      clientAUser,
      deliverableA.id
    );
    assert.equal(reApprove.success, true);
    assert.equal(reApprove.alreadyApproved, true);
  });

  /* -------------------------------------------------------------------------
   * 4. REVISION REQUEST & AUTO-TASK GENERATION
   * ----------------------------------------------------------------------- */
  test("5. Client revision request requires comment, sets REVISION_REQUESTED, and auto-creates revision task assigned to deliverable owner", async () => {
    // Create a new deliverable in SENT_TO_CLIENT status
    const reelDeliverable = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        projectId: projectA.id,
        title: "Product Reel Teaser (15s)",
        serviceType: "VIDEO",
        ownerId: memberUser.id,
        status: "SENT_TO_CLIENT",
        sentToClientAt: new Date(),
        weight: 1.0,
      },
    });

    // 1. Empty comment must be rejected
    await assert.rejects(
      async () => {
        await ClientPortalService.requestDeliverableRevisionAsClient(
          clientAUser,
          reelDeliverable.id,
          "   "
        );
      },
      /A comment detailing the requested revisions is required/
    );

    // 2. Submit valid revision request
    const feedbackText = "Please speed up the typography intro and change background to dark navy.";
    const revResult = await ClientPortalService.requestDeliverableRevisionAsClient(
      clientAUser,
      reelDeliverable.id,
      feedbackText
    );

    assert.equal(revResult.success, true);
    assert.equal(revResult.status, "REVISION_REQUESTED");
    assert.ok(revResult.revisionTaskId);

    // 3. Verify Deliverable status in DB
    const updatedReel = await prisma.deliverable.findUnique({
      where: { id: reelDeliverable.id },
    });
    assert.equal(updatedReel?.status, "REVISION_REQUESTED");

    // 4. Verify auto-created Revision Task assigned to deliverable owner (memberUser)
    const revisionTask = await prisma.task.findUnique({
      where: { id: revResult.revisionTaskId },
    });
    assert.ok(revisionTask);
    assert.equal(revisionTask.title, "Client Revision: Product Reel Teaser (15s)");
    assert.equal(revisionTask.assigneeId, memberUser.id);
    assert.equal(revisionTask.priority, "HIGH");
    assert.equal(revisionTask.status, "TODO");
    assert.equal(revisionTask.description?.includes(feedbackText), true);

    // 5. Verify ActivityEvent created with actorType: CLIENT
    const activityEvent = await prisma.activityEvent.findFirst({
      where: {
        organizationId: orgId,
        entityId: reelDeliverable.id,
        action: "CLIENT_REVISION_REQUESTED",
      },
    });
    assert.ok(activityEvent);
    assert.equal(activityEvent.actorType, "CLIENT");

    // 6. Verify notification sent to deliverable owner
    const revNotification = await prisma.notification.findFirst({
      where: {
        organizationId: orgId,
        recipientId: memberUser.id,
        type: "REVISION_REQUESTED",
      },
    });
    assert.ok(revNotification);
  });

  /* -------------------------------------------------------------------------
   * 5. SHARE LINK & CLIENT VIEW TRACKING
   * ----------------------------------------------------------------------- */
  test("6. Agency owner can generate, revoke share link, and track clientLastViewedAt", async () => {
    // Generate share link as Owner
    const shareRes = await ClientPortalService.generateProjectShareLink(
      ownerUser,
      projectA.id,
      "http://localhost:3000"
    );

    assert.ok(shareRes.shareToken);
    assert.match(shareRes.shareUrl, /\/client\/projects\/.*token=/);

    // Client views project via portal
    await ClientPortalService.recordClientView(projectA.id);

    // Verify clientLastViewedAt timestamp was set on project
    const viewedProject = await prisma.project.findUnique({
      where: { id: projectA.id },
    });
    assert.ok(viewedProject?.clientLastViewedAt);

    // Revoke share link
    const revokeRes = await ClientPortalService.revokeProjectShareLink(ownerUser, projectA.id);
    assert.equal(revokeRes.success, true);

    const unsharedProject = await prisma.project.findUnique({
      where: { id: projectA.id },
    });
    assert.equal(unsharedProject?.shareToken, null);
  });

  /* -------------------------------------------------------------------------
   * 6. END-TO-END CORE LOOP DEMO ACCEPTANCE
   * ----------------------------------------------------------------------- */
  test("7. End-to-end demo: Member finishes work -> Manager sends to client -> Client approves in portal -> Progress updates everywhere", async () => {
    // Step 1: Member creates/updates work in progress
    // Step 1: Deliverable created in IN_PROGRESS with an assigned member task
    const landingDeliverable = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        projectId: projectA.id,
        title: "Landing Page High-Fidelity Prototype",
        serviceType: "WEB_DEV",
        ownerId: memberUser.id,
        status: "IN_PROGRESS",
        weight: 1.0,
      },
    });

    const devTask = await prisma.task.create({
      data: {
        organizationId: orgId,
        projectId: projectA.id,
        deliverableId: landingDeliverable.id,
        title: "Build landing hero section & motion components",
        assigneeId: memberUser.id,
        status: "IN_PROGRESS",
        priority: "HIGH",
      },
    });

    // Step 2: Member finishes work by completing assigned task
    await AgencyWorkService.updateTaskStatus(
      memberUser,
      devTask.id,
      "DONE"
    );

    // Step 3: Manager reviews and sends to client (IN_REVIEW -> SENT_TO_CLIENT)
    await AgencyWorkService.updateDeliverableStatus(
      ownerUser,
      landingDeliverable.id,
      "IN_REVIEW"
    );
    await AgencyWorkService.updateDeliverableStatus(
      ownerUser,
      landingDeliverable.id,
      "SENT_TO_CLIENT"
    );

    const sentDeliv = await prisma.deliverable.findUnique({
      where: { id: landingDeliverable.id },
    });
    assert.equal(sentDeliv?.status, "SENT_TO_CLIENT");

    // Step 4: Client logs into portal, views deliverable in pending approvals
    const clientProjects = await ClientPortalService.getClientProjects(clientAUser);
    const projSummary = clientProjects.projects.find((p) => p.id === projectA.id);
    assert.ok(projSummary);
    assert.ok(projSummary.pendingApprovalsCount >= 1);

    // Step 5: Client approves deliverable in portal
    const approval = await ClientPortalService.approveDeliverableAsClient(
      clientAUser,
      landingDeliverable.id,
      { note: "Approved on staging! Deploy to production." }
    );
    assert.equal(approval.success, true);
    assert.equal(approval.status, "APPROVED");

    // Step 6: Verify deliverable and project progress updated everywhere
    const finalDeliv = await prisma.deliverable.findUnique({
      where: { id: landingDeliverable.id },
    });
    assert.equal(finalDeliv?.status, "APPROVED");
    assert.equal(finalDeliv?.progressPercent, 100);

    const finalProject = await prisma.project.findUnique({
      where: { id: projectA.id },
    });
    assert.ok(finalProject && finalProject.progressPercent > 0);
  });
});
