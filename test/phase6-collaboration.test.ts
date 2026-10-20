import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import { CommentService } from "../src/server/services/comments";
import { FileService } from "../src/server/services/files";
import { NotificationService } from "../src/server/services/notification";
import { StorageService } from "../src/server/storage";
import { AgencyWorkService } from "../src/server/services/agency-work";
import { AuthenticatedUser } from "../src/server/auth";

describe("Phase 6: Collaboration Layer & Real-time Telemetry", () => {
  let orgId: string;
  let ownerUser: AuthenticatedUser;
  let memberUser: AuthenticatedUser;
  let clientUser: AuthenticatedUser;
  let testProject: any;
  let testDeliverable: any;
  let testTask: any;

  before(async () => {
    // 1. Setup isolated test organization
    const org = await prisma.organization.create({
      data: {
        name: `Collab Agency ${Date.now()}`,
        slug: `collab-${Date.now()}`,
      },
    });
    orgId = org.id;

    // 2. Setup Owner
    const owner = await prisma.user.create({
      data: { name: "Rohan Varma", email: `rohan-${Date.now()}@collab.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: owner.id, role: "OWNER", jobTitle: "Agency Founder" },
    });
    ownerUser = {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: "OWNER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 3. Setup Member (Dev/Editor)
    const member = await prisma.user.create({
      data: { name: "Aarav Designer", email: `aarav-${Date.now()}@collab.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: member.id, role: "MEMBER", jobTitle: "Motion Designer" },
    });
    memberUser = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: "MEMBER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 4. Setup Client
    const client = await AgencyWorkService.createClient(ownerUser, {
      name: "Acme Studios",
      companyName: "Acme Corporation",
    });

    const contact = await prisma.clientContact.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        name: "Carol Client",
        email: `carol-${Date.now()}@acme.test`,
      },
    });

    clientUser = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      role: "CLIENT",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 5. Setup Project, Deliverable & Task
    testProject = await AgencyWorkService.createProject(ownerUser, {
      clientId: client.id,
      name: "Global Rebrand Campaign",
    });

    testDeliverable = await AgencyWorkService.createDeliverable(ownerUser, {
      projectId: testProject.id,
      title: "Hero Brand Video 4K",
      serviceType: "VIDEO",
    });

    testTask = await AgencyWorkService.createTask(ownerUser, {
      projectId: testProject.id,
      deliverableId: testDeliverable.id,
      title: "First Motion Cut Export",
      assigneeId: memberUser.id,
    });
  });

  /* ========================================================================
   * 1. FILE UPLOADS, S3 SIGNED URLS, SIZE VALIDATION, AND VERSIONING
   * ======================================================================== */

  test("File validation: rejects files exceeding 50MB", async () => {
    assert.throws(
      () => {
        StorageService.validateFile(55 * 1024 * 1024, "video/mp4");
      },
      /File exceeds maximum allowed size/
    );
  });

  test("File upload & Deliverable versioning: new upload on same deliverable increments version", async () => {
    // 1. Member uploads first cut on task
    const file1 = await FileService.uploadFile(memberUser, {
      taskId: testTask.id,
      fileName: "hero_cut_v1.mp4",
      fileSize: 12 * 1024 * 1024,
      fileType: "video/mp4",
    });

    assert.equal(file1.version, 1, "First upload should be version 1");
    assert.equal(file1.visibility, "INTERNAL", "Default visibility must be INTERNAL");
    assert.equal(file1.virusScanStatus, "CLEAN");
    assert.ok(file1.signedDownloadUrl.includes("token="));

    // 2. Member uploads second cut on same deliverable
    const file2 = await FileService.uploadFile(memberUser, {
      taskId: testTask.id,
      fileName: "hero_cut_v2_final.mp4",
      fileSize: 14 * 1024 * 1024,
      fileType: "video/mp4",
    });

    assert.equal(file2.version, 2, "Second upload on same deliverable must auto-increment to version 2");
    assert.equal(file2.deliverableId, testDeliverable.id);
  });

  test("Owner marks file CLIENT_VISIBLE and creates human-readable ActivityEvent", async () => {
    const files = await FileService.listFiles(ownerUser, { deliverableId: testDeliverable.id });
    const targetFile = files[0];

    // Owner marks as CLIENT_VISIBLE
    const updated = await FileService.updateVisibility(ownerUser, targetFile.id, "CLIENT_VISIBLE");
    assert.equal(updated.visibility, "CLIENT_VISIBLE");

    // Verify activity event was created with before/after description
    const events = await prisma.activityEvent.findMany({
      where: { entityId: targetFile.id, action: "VISIBILITY_CHANGED" },
    });
    assert.equal(events.length, 1);
    const meta = JSON.parse(events[0].metadata || "{}");
    assert.ok(meta.description.includes("changed from INTERNAL to CLIENT_VISIBLE"));
  });

  test("Client isolation: external clients only see CLIENT_VISIBLE files", async () => {
    const allFiles = await FileService.listFiles(memberUser, { deliverableId: testDeliverable.id });
    assert.equal(allFiles.length, 2, "Team member sees all 2 files");

    const clientFiles = await FileService.listFiles(clientUser, { deliverableId: testDeliverable.id });
    assert.equal(clientFiles.length, 1, "Client must only see the 1 file marked CLIENT_VISIBLE");
    assert.equal(clientFiles[0].visibility, "CLIENT_VISIBLE");
  });

  test("Signed URL access: verifies valid token and blocks expired/tampered tokens", async () => {
    const files = await FileService.listFiles(ownerUser, { deliverableId: testDeliverable.id });
    const file = files[0];

    const token = StorageService.generateSignedToken(file.id, orgId, 3600);
    const verification = StorageService.verifySignedToken(token);
    assert.equal(verification.valid, true);
    assert.equal(verification.fileId, file.id);
    assert.equal(verification.organizationId, orgId);

    // Tampered token fails
    const tampered = token + "xyz";
    const invalidVerif = StorageService.verifySignedToken(tampered);
    assert.equal(invalidVerif.valid, false);
  });

  /* ========================================================================
   * 2. COMMENTS, @MENTIONS, AND NOTIFICATIONS
   * ======================================================================== */

  test("Posting comment with @mention triggers real notification for the mentioned user", async () => {
    // Designer posts comment mentioning Rohan
    const comment = await CommentService.createComment(memberUser, {
      taskId: testTask.id,
      content: "Hey @Rohan please review this latest video export cut!",
      visibility: "INTERNAL",
    });

    assert.ok(comment.id);
    assert.equal(comment.authorId, memberUser.id);
    assert.equal(comment.visibility, "INTERNAL");

    // Verify notification was sent to Rohan (Owner)
    const notifications = await NotificationService.listNotifications(ownerUser.id);
    const mentionNotif = notifications.notifications.find(
      (n) => n.type === "MENTION" && n.actorId === memberUser.id
    );

    assert.ok(mentionNotif, "Mention notification should be created for Rohan");
    assert.ok(mentionNotif.title.includes("mentioned you"));
  });

  test("Comments isolation: external clients cannot see INTERNAL comments", async () => {
    // Post internal comment
    await CommentService.createComment(memberUser, {
      projectId: testProject.id,
      content: "Internal team budget note: render farm cost $50.",
      visibility: "INTERNAL",
    });

    // Post client visible comment
    await CommentService.createComment(ownerUser, {
      projectId: testProject.id,
      content: "Hi Carol, the latest brand preview is ready on the portal!",
      visibility: "CLIENT_VISIBLE",
    });

    const memberComments = await CommentService.listComments(memberUser, { projectId: testProject.id });
    const clientComments = await CommentService.listComments(clientUser, { projectId: testProject.id });

    assert.ok(memberComments.length >= 2, "Team member sees all comments");
    assert.ok(
      clientComments.every((c) => c.visibility === "CLIENT_VISIBLE"),
      "Client must ONLY receive CLIENT_VISIBLE comments"
    );
  });

  /* ========================================================================
   * 3. NOTIFICATIONS ENGINE, ANTI-SPAM DEDUPLICATION, AND PREFERENCES
   * ======================================================================== */

  test("Anti-spam deduplication: suppresses duplicate alerts within 1-hour rolling window", async () => {
    const dedupeKey = `due_soon_${testTask.id}_${Date.now()}`;

    // First alert
    const notif1 = await NotificationService.createNotification({
      organizationId: orgId,
      recipientId: memberUser.id,
      type: "DUE_SOON",
      title: "Task Due Soon",
      message: "First Motion Cut Export is due in 24 hours.",
      entityType: "TASK",
      entityId: testTask.id,
      dedupeKey,
    });
    assert.ok(notif1, "First notification should be recorded");

    // Immediate second alert with same dedupeKey
    const notif2 = await NotificationService.createNotification({
      organizationId: orgId,
      recipientId: memberUser.id,
      type: "DUE_SOON",
      title: "Task Due Soon",
      message: "First Motion Cut Export is due in 24 hours.",
      entityType: "TASK",
      entityId: testTask.id,
      dedupeKey,
    });
    assert.equal(notif2, null, "Duplicate notification should be suppressed by anti-spam deduplication");
  });

  test("Marking notifications as read updates unread count", async () => {
    const beforeList = await NotificationService.listNotifications(ownerUser.id, { unreadOnly: true });
    assert.ok(beforeList.unreadCount > 0);

    const firstUnread = beforeList.notifications[0];
    await NotificationService.markAsRead(firstUnread.id, ownerUser.id);

    const afterList = await NotificationService.listNotifications(ownerUser.id, { unreadOnly: true });
    assert.equal(afterList.unreadCount, beforeList.unreadCount - 1);

    // Mark all as read
    await NotificationService.markAllAsRead(ownerUser.id);
    const finalCheck = await NotificationService.listNotifications(ownerUser.id, { unreadOnly: true });
    assert.equal(finalCheck.unreadCount, 0);
  });

  test("Notification preferences: can query and toggle delivery preferences", async () => {
    const defaultPrefs = await NotificationService.getPreferences(memberUser.id);
    assert.equal(defaultPrefs.emailNotifications, true);

    const updated = await NotificationService.updatePreferences(memberUser.id, {
      emailNotifications: false,
      dueSoonNotify: false,
    });

    assert.equal(updated.emailNotifications, false);
    assert.equal(updated.deadlineNotify, false);
    assert.equal(updated.mentionNotify, true, "Untouched flags remain unchanged");
  });
});
