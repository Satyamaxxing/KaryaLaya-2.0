import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/server/db";
import { SocialMediaService, ManualPublishingProvider } from "../src/server/services/social-media";
import { DashboardService } from "../src/server/services/dashboard";
import { AuthenticatedUser } from "../src/server/auth";

describe("Phase 8: Social Media Module for Agencies", () => {
  let orgId: string;
  let ownerUser: AuthenticatedUser;
  let memberUser: AuthenticatedUser;

  // Client A
  let clientAId: string;
  let contactAId: string;
  let clientAUser: AuthenticatedUser;

  // Client B (For multi-tenant & client isolation validation)
  let clientBId: string;
  let contactBId: string;
  let clientBUser: AuthenticatedUser;

  before(async () => {
    // 1. Setup agency organization
    const org = await prisma.organization.create({
      data: {
        name: `Velocity Agency ${Date.now()}`,
        slug: `velocity-${Date.now()}`,
      },
    });
    orgId = org.id;

    // 2. Setup Agency Owner
    const owner = await prisma.user.create({
      data: { name: "Aarav Agency Owner", email: `aarav-${Date.now()}@velocity.test` },
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

    // 3. Setup Team Member (Social Media Strategist)
    const member = await prisma.user.create({
      data: { name: "Diya Social Strategist", email: `diya-${Date.now()}@velocity.test` },
    });
    await prisma.membership.create({
      data: { organizationId: orgId, userId: member.id, role: "MEMBER", jobTitle: "Content Manager" },
    });
    memberUser = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: "MEMBER",
      organizationId: orgId,
      organizationName: org.name,
    };

    // 4. Setup Client A
    const clientA = await prisma.client.create({
      data: {
        organizationId: orgId,
        name: `Acme Brands ${Date.now()}`,
        portalAccessEnabled: true,
      },
    });
    clientAId = clientA.id;

    const contactA = await prisma.clientContact.create({
      data: {
        organizationId: orgId,
        clientId: clientAId,
        name: "Rohan Client Contact",
        email: `rohan-${Date.now()}@acme.test`,
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
      clientId: clientAId,
    };

    // 5. Setup Client B
    const clientB = await prisma.client.create({
      data: {
        organizationId: orgId,
        name: `Beta Corp ${Date.now()}`,
        portalAccessEnabled: true,
      },
    });
    clientBId = clientB.id;

    const contactB = await prisma.clientContact.create({
      data: {
        organizationId: orgId,
        clientId: clientBId,
        name: "Sanya Beta Contact",
        email: `sanya-${Date.now()}@beta.test`,
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
      clientId: clientBId,
    };
  });

  // =========================================================================
  // 1. SOCIAL ACCOUNTS
  // =========================================================================
  describe("Social Accounts Management", () => {
    test("Agency member connects social channels for Client A", async () => {
      const igAccount = await SocialMediaService.createAccount(memberUser, {
        clientId: clientAId,
        platform: "INSTAGRAM",
        handle: "@acme_official",
        profileUrl: "https://instagram.com/acme_official",
      });

      assert.ok(igAccount.id);
      assert.equal(igAccount.platform, "INSTAGRAM");
      assert.equal(igAccount.handle, "@acme_official");

      const liAccount = await SocialMediaService.createAccount(memberUser, {
        clientId: clientAId,
        platform: "LINKEDIN",
        handle: "acme-corporation",
      });
      assert.ok(liAccount.id);

      const accounts = await SocialMediaService.listAccounts(memberUser, clientAId);
      assert.equal(accounts.length, 2);
      assert.ok(accounts.some((a) => a.platform === "INSTAGRAM"));
      assert.ok(accounts.some((a) => a.platform === "LINKEDIN"));
    });

    test("Client contact cannot connect new social accounts", async () => {
      await assert.rejects(
        async () => {
          await SocialMediaService.createAccount(clientAUser, {
            clientId: clientAId,
            platform: "TWITTER",
            handle: "@acme_x",
          });
        },
        /Unauthorized/
      );
    });
  });

  // =========================================================================
  // 2. POST CREATION & STATUS PIPELINE
  // =========================================================================
  describe("Post Lifecycle & Pipeline", () => {
    let testPostId: string;

    test("Create post with caption, hashtags, platforms, and media", async () => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 3);

      const post = await SocialMediaService.createPost(memberUser, {
        clientId: clientAId,
        title: "Product Launch Announcement",
        caption: "We are thrilled to unveil our breakthrough product line! Link in bio.",
        hashtags: "#innovation #agency #productlaunch",
        platforms: ["INSTAGRAM", "TWITTER", "LINKEDIN"],
        mediaUrls: ["https://storage.agency.test/uploads/launch.png"],
        scheduledAt: scheduledDate.toISOString(),
        assigneeId: memberUser.id,
        status: "IDEA",
      });

      assert.ok(post.id);
      testPostId = post.id;
      assert.equal(post.status, "IDEA");
      assert.equal(post.platforms.length, 3);
      assert.ok(post.platforms.includes("INSTAGRAM"));
      assert.equal(post.mediaUrls.length, 1);
    });

    test("Transition post through pipeline: IDEA -> COPY -> DESIGN -> INTERNAL_REVIEW -> CLIENT_APPROVAL", async () => {
      let post = await SocialMediaService.updatePostStatus(memberUser, testPostId, "COPY");
      assert.equal(post.status, "COPY");

      post = await SocialMediaService.updatePostStatus(memberUser, testPostId, "DESIGN");
      assert.equal(post.status, "DESIGN");

      post = await SocialMediaService.updatePostStatus(memberUser, testPostId, "INTERNAL_REVIEW");
      assert.equal(post.status, "INTERNAL_REVIEW");

      post = await SocialMediaService.updatePostStatus(memberUser, testPostId, "CLIENT_APPROVAL");
      assert.equal(post.status, "CLIENT_APPROVAL");
    });

    test("Post comments: Client adds revision comment and agency replies", async () => {
      const comment1 = await SocialMediaService.addPostComment(clientAUser, testPostId, {
        content: "Can we please swap the hashtag #agency for #fintech?",
      });
      assert.ok(comment1.id);
      assert.equal(comment1.authorType, "CLIENT_CONTACT");

      const comment2 = await SocialMediaService.addPostComment(memberUser, testPostId, {
        content: "Updated! New creative mockup attached.",
      });
      assert.ok(comment2.id);
      assert.equal(comment2.authorType, "USER");

      const comments = await SocialMediaService.getPostComments(clientAUser, testPostId);
      assert.equal(comments.length, 2);
      assert.equal(comments[0].content, "Can we please swap the hashtag #agency for #fintech?");
      assert.equal(comments[1].content, "Updated! New creative mockup attached.");
    });
  });

  // =========================================================================
  // 3. BULK CREATE FOR A 30-POST MONTHLY PLAN
  // =========================================================================
  describe("Bulk Monthly Content Planner", () => {
    test("Bulk generate a 30-post plan across a month for Client A", async () => {
      const currentYear = new Date().getFullYear();
      const targetMonth = 11; // November

      const result = await SocialMediaService.bulkCreateMonthlyPlan(memberUser, {
        clientId: clientAId,
        year: currentYear,
        month: targetMonth,
        postCount: 30,
        defaultPlatforms: ["INSTAGRAM", "LINKEDIN"],
        themePrefix: "Q4 Growth Campaign",
        initialStatus: "CLIENT_APPROVAL",
        assigneeId: memberUser.id,
      });

      assert.equal(result.count, 30);
      assert.equal(result.posts.length, 30);

      // Verify each post has unique day scheduled in November
      const dates = result.posts.map((p) => new Date(p.scheduledAt!).getDate());
      assert.equal(dates.length, 30);
      assert.equal(dates[0], 1);
      assert.equal(dates[29], 30);

      // Verify initial status is CLIENT_APPROVAL
      assert.ok(result.posts.every((p) => p.status === "CLIENT_APPROVAL"));
    });

    test("Duplicate monthly plan to next month", async () => {
      const currentYear = new Date().getFullYear();
      const sourceMonth = 11; // November
      const targetMonth = 12; // December

      const duplicateResult = await SocialMediaService.duplicateToNextMonth(memberUser, {
        clientId: clientAId,
        sourceYear: currentYear,
        sourceMonth: sourceMonth,
        targetYear: currentYear,
        targetMonth: targetMonth,
      });

      assert.ok(duplicateResult.count >= 30);
      assert.equal(duplicateResult.posts.length, duplicateResult.count);

      // Verify duplicated posts reset to IDEA status and scheduled in December
      const sample = duplicateResult.posts[0];
      assert.equal(sample.status, "IDEA");
      const sched = new Date(sample.scheduledAt!);
      assert.equal(sched.getMonth() + 1, targetMonth);
      assert.equal(sched.getFullYear(), currentYear);
    });
  });

  // =========================================================================
  // 4. CLIENT PORTAL & BATCH APPROVAL
  // =========================================================================
  describe("Client Portal Scoping & Batch Approval", () => {
    test("Client A sees only their posts in portal calendar", async () => {
      const clientPosts = await SocialMediaService.listPosts(clientAUser, {
        clientId: clientAId,
      });

      assert.ok(clientPosts.length >= 30);
      assert.ok(clientPosts.every((p) => p.clientId === clientAId));
    });

    test("Client Isolation: Client B cannot see or batch-approve Client A's posts", async () => {
      // Client B querying with Client A's id should be scoped to Client B or throw
      const clientBPosts = await SocialMediaService.listPosts(clientBUser, {
        clientId: clientAId, // Attempting to inspect Client A
      });

      // Strict enforcement: Result is empty or contains only Client B's data
      assert.ok(clientBPosts.every((p) => p.clientId === clientBId));

      // Attempting to batch approve Client A's posts as Client B fails with security rejection
      const postsForApproval = await prisma.socialPost.findMany({
        where: { clientId: clientAId, status: "CLIENT_APPROVAL" },
        take: 5,
      });
      const ids = postsForApproval.map((p) => p.id);

      await assert.rejects(
        async () => {
          await SocialMediaService.clientBatchApprove(clientBUser, {
            clientId: clientAId,
            postIds: ids,
          });
        },
        /No matching posts found for approval/
      );
    });

    test("Client A approves entire monthly batch of 30 posts", async () => {
      const pendingPosts = await prisma.socialPost.findMany({
        where: { clientId: clientAId, status: "CLIENT_APPROVAL" },
      });
      assert.ok(pendingPosts.length > 0);

      const approvalResult = await SocialMediaService.clientBatchApprove(clientAUser, {
        clientId: clientAId,
        postIds: pendingPosts.map((p) => p.id),
      });

      assert.equal(approvalResult.approvedCount, pendingPosts.length);

      // Verify posts in DB transitioned to APPROVED
      const approvedPosts = await prisma.socialPost.findMany({
        where: {
          id: { in: pendingPosts.map((p) => p.id) },
        },
      });
      assert.ok(approvedPosts.every((p) => p.status === "APPROVED"));
    });
  });

  // =========================================================================
  // 5. MANUAL PUBLISHING ENGINE (Phase-1 Manual with Provider Interface)
  // =========================================================================
  describe("Publishing Engine & Manual Provider", () => {
    let postToPublishId: string;

    before(async () => {
      const post = await SocialMediaService.createPost(memberUser, {
        clientId: clientAId,
        title: "Manual Publish Test Post",
        caption: "Testing manual publication provider hook.",
        platforms: ["LINKEDIN"],
        status: "SCHEDULED",
        scheduledAt: new Date().toISOString(),
      });
      postToPublishId = post.id;
    });

    test("ManualPublishingProvider publishes post with live link", async () => {
      const provider = new ManualPublishingProvider();
      assert.equal(provider.name, "MANUAL");

      const post = await prisma.socialPost.findUniqueOrThrow({
        where: { id: postToPublishId },
      });

      const liveUrl = "https://linkedin.com/posts/acme-corp-live-update-12345";
      const result = await provider.publish(post, { publishedUrl: liveUrl });

      assert.equal(result.success, true);
      assert.equal(result.publishedUrl, liveUrl);
    });

    test("Agency member marks post as Published via SocialMediaService", async () => {
      const liveUrl = "https://instagram.com/p/Cxyz789Launch";
      const published = await SocialMediaService.markPublished(memberUser, postToPublishId, liveUrl);

      assert.equal(published.status, "PUBLISHED");
      assert.equal(published.publishedUrl, liveUrl);
      assert.ok(published.publishedAt);
    });
  });

  // =========================================================================
  // 6. DASHBOARD TELEMETRY: Scheduled This Week & Overdue Reminders
  // =========================================================================
  describe("Dashboard Social Telemetry & Overdue Reminders", () => {
    before(async () => {
      // 1. Create a post scheduled this week
      const now = new Date();
      const thisWeekDate = new Date(now);
      thisWeekDate.setDate(now.getDate() + 1);

      await SocialMediaService.createPost(memberUser, {
        clientId: clientAId,
        title: "Campaign Post Scheduled Tomorrow",
        caption: "Scheduled for this week's sprint.",
        platforms: ["INSTAGRAM", "TWITTER"],
        status: "SCHEDULED",
        scheduledAt: thisWeekDate.toISOString(),
      });

      // 2. Create an overdue post (scheduled in the past, status SCHEDULED)
      const pastDate = new Date(now);
      pastDate.setDate(now.getDate() - 2);

      await SocialMediaService.createPost(memberUser, {
        clientId: clientAId,
        title: "Overdue Flash Promo",
        caption: "Was scheduled 2 days ago but never marked published.",
        platforms: ["LINKEDIN"],
        status: "SCHEDULED",
        scheduledAt: pastDate.toISOString(),
      });
    });

    test("getDashboardSocialMetrics detects scheduled posts and overdue reminders", async () => {
      const metrics = await SocialMediaService.getDashboardSocialMetrics(ownerUser);

      assert.ok(metrics.scheduledThisWeekCount > 0);
      assert.ok(metrics.scheduledThisWeek.some((p) => p.title.includes("Campaign Post Scheduled Tomorrow")));

      assert.ok(metrics.overdueCount > 0);
      assert.ok(metrics.overduePosts.some((p) => p.title.includes("Overdue Flash Promo")));
    });

    test("DashboardService includes socialMetrics for OWNER and MEMBER dashboards", async () => {
      const ownerDashboard = await DashboardService.getDashboardData(ownerUser);
      assert.equal(ownerDashboard.role, "OWNER");
      assert.ok("socialMetrics" in ownerDashboard);
      assert.ok(ownerDashboard.socialMetrics.scheduledThisWeekCount > 0);
      assert.ok(ownerDashboard.socialMetrics.overdueCount > 0);

      const memberDashboard = await DashboardService.getDashboardData(memberUser);
      assert.equal(memberDashboard.role, "MEMBER");
      assert.ok("socialMetrics" in memberDashboard);
      assert.ok(memberDashboard.socialMetrics.scheduledThisWeekCount > 0);
      assert.ok(memberDashboard.socialMetrics.overdueCount > 0);
    });
  });
});
