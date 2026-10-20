import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import { CalendarService } from "../src/server/services/calendar";
import { TeamService } from "../src/server/services/team";
import { AgencyWorkService } from "../src/server/services/agency-work";
import { SocialMediaService } from "../src/server/services/social-media";
import { AuthenticatedUser } from "../src/server/auth";

describe("Phase 9: Work-aware Calendar and Team View", () => {
  let orgId: string;
  let ownerUser: AuthenticatedUser;
  let member1User: AuthenticatedUser;
  let member2User: AuthenticatedUser;
  let clientId: string;
  let projectId: string;
  let deliverable1Id: string;
  let deliverable2Id: string;

  before(async () => {
    // 1. Setup agency organization
    const org = await prisma.organization.create({
      data: {
        name: `Horizon Studio ${Date.now()}`,
        slug: `horizon-${Date.now()}`,
      },
    });
    orgId = org.id;

    // 2. Setup Agency Owner
    const owner = await prisma.user.create({
      data: { name: "Ananya Roy", email: `ananya-${Date.now()}@horizon.test` },
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

    // 3. Setup Team Member 1 (Lead Designer)
    const m1 = await prisma.user.create({
      data: { name: "Vikram Sen", email: `vikram-${Date.now()}@horizon.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: m1.id, role: "MEMBER", jobTitle: "UI/UX Designer" },
    });
    member1User = {
      id: m1.id,
      name: m1.name,
      email: m1.email,
      role: "MEMBER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 4. Setup Team Member 2 (Developer)
    const m2 = await prisma.user.create({
      data: { name: "Kavita Rao", email: `kavita-${Date.now()}@horizon.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: m2.id, role: "MEMBER", jobTitle: "Fullstack Dev" },
    });
    member2User = {
      id: m2.id,
      name: m2.name,
      email: m2.email,
      role: "MEMBER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 5. Setup Client and Project
    const client = await prisma.client.create({
      data: {
        organizationId: orgId,
        name: "Acme Global",
        companyName: "Acme Corporation",
      },
    });
    clientId = client.id;

    const project = await prisma.project.create({
      data: {
        organizationId: orgId,
        clientId: client.id,
        name: "Acme Brand Refresh & Portal",
        ownerId: owner.id,
        startDate: new Date("2026-10-01T00:00:00Z"),
        dueDate: new Date("2026-10-31T00:00:00Z"),
      },
    });
    projectId = project.id;

    // 6. Setup Deliverables
    const d1 = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        projectId: project.id,
        ownerId: member1User.id,
        title: "Design System & Components",
        serviceType: "DESIGN",
        status: "IN_PROGRESS",
        dueDate: new Date("2026-10-15T00:00:00Z"),
        weight: 1.0,
      },
    });
    deliverable1Id = d1.id;

    const d2 = await prisma.deliverable.create({
      data: {
        organizationId: orgId,
        projectId: project.id,
        ownerId: member2User.id,
        title: "Client Portal Frontend Implementation",
        serviceType: "WEB_DEV",
        status: "READY_FOR_REVIEW",
        dueDate: new Date("2026-10-25T00:00:00Z"),
        weight: 1.5,
      },
    });
    deliverable2Id = d2.id;
  });

  describe("1. Unified Calendar Feed Aggregation", () => {
    let task1Id: string;
    let task2Id: string;
    let socialPostId: string;

    before(async () => {
      // Create Tasks
      const t1 = await prisma.task.create({
        data: {
          organizationId: orgId,
          projectId,
          deliverableId: deliverable1Id,
          assigneeId: member1User.id,
          title: "Export Figma Token Specs",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date("2026-10-12T00:00:00Z"),
          loggedHours: 4.5,
        },
      });
      task1Id = t1.id;

      const t2 = await prisma.task.create({
        data: {
          organizationId: orgId,
          projectId,
          deliverableId: deliverable2Id,
          assigneeId: member2User.id,
          title: "Implement Navigation Sidebar",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: new Date("2026-10-18T00:00:00Z"),
          loggedHours: 2.0,
        },
      });
      task2Id = t2.id;

      // Create Social Post
      const sp = await prisma.socialPost.create({
        data: {
          organizationId: orgId,
          clientId,
          projectId,
          caption: "Announcing the new design system launch! #DesignSystem #WebDevelopment",
          platforms: JSON.stringify(["LINKEDIN", "X"]),
          status: "SCHEDULED",
          scheduledAt: new Date("2026-10-20T14:00:00Z"),
          assigneeId: member1User.id,
        },
      });
      socialPostId = sp.id;
    });

    test("aggregates all entity types: TASK, DELIVERABLE, MILESTONE, CLIENT_REVIEW, and SOCIAL_POST", async () => {
      const feed = await CalendarService.getUnifiedCalendar(ownerUser, {
        mode: "TEAM",
        startDate: new Date("2026-10-01T00:00:00Z"),
        endDate: new Date("2026-10-31T23:59:59Z"),
      });

      assert.ok(feed.events.length >= 4, "Should contain multiple events across entities");

      const eventTypes = new Set(feed.events.map((e) => e.type));
      assert.ok(eventTypes.has("TASK"), "Should contain TASK events");
      assert.ok(eventTypes.has("DELIVERABLE"), "Should contain DELIVERABLE events");
      assert.ok(eventTypes.has("CLIENT_REVIEW"), "Should contain CLIENT_REVIEW for deliverable ready for review");
      assert.ok(eventTypes.has("SOCIAL_POST"), "Should contain SOCIAL_POST events");

      // Verify specific task matches real data
      const t1Event = feed.events.find((e) => e.entityId === task1Id);
      assert.ok(t1Event, "Task 1 event should exist");
      assert.equal(t1Event?.title, "Export Figma Token Specs");
      assert.equal(t1Event?.assignee?.id, member1User.id);

      // Verify social post
      const spEvent = feed.events.find((e) => e.entityId === socialPostId);
      assert.ok(spEvent, "Social post event should exist");
      assert.equal(spEvent?.type, "SOCIAL_POST");
    });

    test("filters events by member, project, and type", async () => {
      // Filter by member 1
      const member1Feed = await CalendarService.getUnifiedCalendar(ownerUser, {
        memberId: member1User.id,
      });
      const allBelongToMember1 = member1Feed.events.every(
        (e) => !e.assignee || e.assignee.id === member1User.id
      );
      assert.ok(allBelongToMember1, "Filtered events must be associated with member 1");

      // Filter by type: only TASKS
      const taskOnlyFeed = await CalendarService.getUnifiedCalendar(ownerUser, {
        type: "TASK",
      });
      assert.ok(taskOnlyFeed.events.length > 0);
      assert.ok(
        taskOnlyFeed.events.every((e) => e.type === "TASK"),
        "All events must be TASK type"
      );
    });

    test("personal vs team toggle filters for current user's assignments", async () => {
      const personalFeed = await CalendarService.getUnifiedCalendar(member1User, {
        mode: "PERSONAL",
      });

      assert.ok(personalFeed.events.length > 0);
      assert.ok(
        personalFeed.events.every(
          (e) => e.assignee?.id === member1User.id || (e.type === "CLIENT_REVIEW" && !e.assignee)
        ),
        "Personal mode should only show items assigned to or owned by the member"
      );
    });
  });

  describe("2. Deterministic Conflict Hints (Plain Rules)", () => {
    test("Rule 1: Overload warning when a member has >3 tasks due on the exact same date", async () => {
      const overloadDate = new Date("2026-10-14T00:00:00Z");

      // Create 4 tasks for member 1 on the exact same date
      for (let i = 1; i <= 4; i++) {
        await prisma.task.create({
          data: {
            organizationId: orgId,
            projectId,
            assigneeId: member1User.id,
            title: `Crunch Task ${i}`,
            status: "TODO",
            priority: "HIGH",
            dueDate: overloadDate,
          },
        });
      }

      const conflicts = await CalendarService.detectConflicts(ownerUser);
      const overloadConflict = conflicts.find(
        (c) => c.type === "MEMBER_OVERLOAD" && c.title.includes("Member Overload Bottleneck")
      );

      assert.ok(overloadConflict, "Should detect MEMBER_OVERLOAD conflict");
      assert.equal(overloadConflict.severity, "WARNING");
      assert.ok(
        overloadConflict.reason.includes("Vikram Sen has 4 tasks due on"),
        "Conflict reason must explain the overload with exact task count and assignee name"
      );
    });

    test("Rule 2: Dependency order inversion warning when deliverable is due before child task or task dependency is inverted", async () => {
      // Create deliverable with due date Oct 10
      const earlyDeliv = await prisma.deliverable.create({
        data: {
          organizationId: orgId,
          projectId,
          ownerId: member1User.id,
          title: "Early Delivery Deliverable",
          serviceType: "DESIGN",
          status: "IN_PROGRESS",
          dueDate: new Date("2026-10-10T00:00:00Z"),
          weight: 1.0,
        },
      });

      // Create child task with due date Oct 16 (after deliverable deadline!)
      const lateChildTask = await prisma.task.create({
        data: {
          organizationId: orgId,
          projectId,
          deliverableId: earlyDeliv.id,
          title: "Late Finishing Task",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date("2026-10-16T00:00:00Z"),
        },
      });

      // Also create two dependent tasks with inverted dates
      const blockerTask = await prisma.task.create({
        data: {
          organizationId: orgId,
          projectId,
          title: "Foundational Database Migration",
          status: "IN_PROGRESS",
          dueDate: new Date("2026-10-22T00:00:00Z"),
        },
      });

      const dependentTask = await prisma.task.create({
        data: {
          organizationId: orgId,
          projectId,
          title: "Run Data Sync Job",
          status: "TODO",
          dueDate: new Date("2026-10-20T00:00:00Z"), // Due before blocker!
        },
      });

      await prisma.taskDependency.create({
        data: {
          organizationId: orgId,
          blockingTaskId: blockerTask.id,
          dependentTaskId: dependentTask.id,
        },
      });

      const conflicts = await CalendarService.detectConflicts(ownerUser);

      // Check deliverable child task order conflict
      const delivOrderConflict = conflicts.find(
        (c) => c.type === "DEPENDENCY_ORDER" && c.entityId === earlyDeliv.id
      );
      assert.ok(delivOrderConflict, "Should detect Deliverable due before child task conflict");
      assert.ok(
        delivOrderConflict.reason.includes("deadline is"),
        "Reason must state that deliverable deadline is earlier than child task"
      );

      // Check task dependency sequence conflict
      const taskDepConflict = conflicts.find(
        (c) => c.type === "DEPENDENCY_ORDER" && c.entityId === dependentTask.id
      );
      assert.ok(taskDepConflict, "Should detect Task Dependency sequence inversion");
      assert.ok(
        taskDepConflict.reason.includes("depends on 'Foundational Database Migration'"),
        "Reason must mention dependency sequence inversion"
      );
    });

    test("Rule 3: Publishing date scheduled before approval warning", async () => {
      // Social post scheduled in the next 12 hours but still in DRAFT/IDEA state
      const unapprovedPost = await prisma.socialPost.create({
        data: {
          organizationId: orgId,
          clientId,
          projectId,
          caption: "Urgent announcement scheduled without client review",
          platforms: JSON.stringify(["INSTAGRAM"]),
          status: "IDEA",
          scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
          assigneeId: member2User.id,
        },
      });

      const conflicts = await CalendarService.detectConflicts(ownerUser);
      const postConflict = conflicts.find(
        (c) => c.type === "UNAPPROVED_PUBLISHING" && c.entityId === unapprovedPost.id
      );

      assert.ok(postConflict, "Should flag post scheduled before approval");
      assert.equal(postConflict.severity, "CRITICAL");
      assert.ok(
        postConflict.reason.includes("scheduled to publish in"),
        "Reason must warn that post is scheduled to publish before approval"
      );
    });
  });

  describe("3. RFC 5545 iCalendar Feed Export", () => {
    test("generates and retrieves user calendarToken", async () => {
      const token = await CalendarService.ensureCalendarToken(ownerUser.id);
      assert.ok(token, "Token must be a non-empty string");
      assert.ok(token.length >= 32, "Token should be secure hex length");

      // Calling again should return the same token
      const token2 = await CalendarService.ensureCalendarToken(ownerUser.id);
      assert.equal(token2, token);
    });

    test("produces standard RFC 5545 format with VCALENDAR and VEVENT entries", async () => {
      const token = await CalendarService.ensureCalendarToken(ownerUser.id);
      const ics = await CalendarService.generateIcsFeed(token);

      assert.ok(ics.startsWith("BEGIN:VCALENDAR"), "Must start with BEGIN:VCALENDAR");
      assert.ok(ics.includes("VERSION:2.0"), "Must declare VERSION:2.0");
      assert.ok(ics.includes("PRODID:-//KaryaLaya Agency OS//Calendar//EN"), "Must declare PRODID");
      assert.ok(ics.includes("BEGIN:VEVENT"), "Must contain VEVENT items");
      assert.ok(ics.includes("END:VEVENT"), "Must contain END:VEVENT items");
      assert.ok(ics.endsWith("END:VCALENDAR\r\n"), "Must end with END:VCALENDAR CRLF");

      // Verify CRLF compliance
      assert.ok(ics.includes("\r\n"), "Lines must end with CRLF \\r\\n");
    });
  });

  describe("4. Team View & Leave Capacity Reduction", () => {
    test("calculates team member stats (open tasks, hours this week, overdue tasks)", async () => {
      const roster = await TeamService.getTeamRoster(ownerUser);

      assert.ok(roster.length >= 3, "Roster should list owner and members");
      const m1Stats = roster.find((m) => m.id === member1User.id);
      assert.ok(m1Stats, "Member 1 must be present");
      assert.ok(m1Stats.openTasksCount > 0, "Member 1 should have open tasks");
      assert.ok(m1Stats.hoursThisWeek >= 4.5, "Member 1 should have logged hours");
    });

    test("records leave, reduces capacity, and triggers assignment warnings", async () => {
      const today = new Date();
      const leaveStart = new Date(today.getTime() - 24 * 60 * 60 * 1000); // yesterday
      const leaveEnd = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

      // 1. Record leave for Member 2
      const leave = await TeamService.recordLeave(ownerUser, {
        userId: member2User.id,
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: "Attending Design & Code Conference",
      });

      assert.ok(leave.id, "Leave record must be created");
      assert.equal(leave.userId, member2User.id);

      // 2. Check team roster capacity reflection
      const updatedRoster = await TeamService.getTeamRoster(ownerUser);
      const m2Roster = updatedRoster.find((m) => m.id === member2User.id);
      assert.ok(m2Roster);
      assert.equal(m2Roster.isCurrentlyOnLeave, true, "Member 2 must be flagged isCurrentlyOnLeave");
      assert.equal(m2Roster.capacityRating, "ON_LEAVE", "Capacity rating must be ON_LEAVE");

      // 3. Assignment Helper evaluation
      const workloadDuringLeave = await TeamService.getMemberWorkload(
        ownerUser,
        member2User.id,
        today // Target task due date is during leave
      );

      assert.equal(workloadDuringLeave.capacityRating, "ON_LEAVE");
      assert.equal(workloadDuringLeave.isOnLeaveOnTargetDate, true);
      assert.ok(
        workloadDuringLeave.warningMessage?.includes("on leave"),
        "Warning message must state that member is on leave"
      );

      // 4. Cancel/Delete leave
      await TeamService.deleteLeave(ownerUser, leave.id);
      const rosterAfterDelete = await TeamService.getTeamRoster(ownerUser);
      const m2RosterRestored = rosterAfterDelete.find((m) => m.id === member2User.id);
      assert.equal(m2RosterRestored?.isCurrentlyOnLeave, false, "Leave flag should be cleared");
    });
  });
});
