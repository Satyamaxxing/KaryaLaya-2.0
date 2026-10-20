import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { can } from "@/server/permissions";
import { NotificationService } from "./notification";

export const SOCIAL_PLATFORMS = [
  "INSTAGRAM",
  "LINKEDIN",
  "TWITTER",
  "YOUTUBE",
  "FACEBOOK",
  "TIKTOK",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_POST_STATUSES = [
  "IDEA",
  "COPY",
  "DESIGN",
  "INTERNAL_REVIEW",
  "CLIENT_APPROVAL",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
] as const;

export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number];

export const PLATFORM_LIMITS: Record<
  string,
  { charLimit: number; name: string; color: string; icon: string }
> = {
  TWITTER: { charLimit: 280, name: "X (Twitter)", color: "#1D9BF0", icon: "𝕏" },
  INSTAGRAM: { charLimit: 2200, name: "Instagram", color: "#E1306C", icon: "📸" },
  LINKEDIN: { charLimit: 3000, name: "LinkedIn", color: "#0A66C2", icon: "💼" },
  YOUTUBE: { charLimit: 5000, name: "YouTube", color: "#FF0000", icon: "▶" },
  FACEBOOK: { charLimit: 63206, name: "Facebook", color: "#1877F2", icon: "f" },
  TIKTOK: { charLimit: 2200, name: "TikTok", color: "#00F2FE", icon: "🎵" },
};

/**
 * Pluggable Publishing Provider Interface
 * Allows future Meta Graph API, LinkedIn Community API, or X API auto-publishers
 * to drop in without rewriting core scheduling & workflow logic.
 */
export interface PublishResult {
  success: boolean;
  publishedUrl?: string;
  publishedAt?: Date;
  error?: string;
  provider: string;
}

export interface PublishingProvider {
  name: string;
  publish(post: any, options?: { publishedUrl?: string }): Promise<PublishResult>;
}

export class ManualPublishingProvider implements PublishingProvider {
  name = "MANUAL";

  async publish(post: any, options?: { publishedUrl?: string }): Promise<PublishResult> {
    const defaultPlatform = Array.isArray(post.platforms)
      ? post.platforms[0]?.toLowerCase()
      : "social";

    const liveUrl =
      options?.publishedUrl ||
      post.publishedUrl ||
      `https://${defaultPlatform}.com/post/${post.id}`;

    return {
      success: true,
      publishedUrl: liveUrl,
      publishedAt: new Date(),
      provider: "MANUAL",
    };
  }
}

let activePublishingProvider: PublishingProvider = new ManualPublishingProvider();

export function setPublishingProvider(provider: PublishingProvider) {
  activePublishingProvider = provider;
}

export function getPublishingProvider(): PublishingProvider {
  return activePublishingProvider;
}

export interface CreateSocialAccountInput {
  clientId: string;
  platform: string;
  handle: string;
  profileUrl?: string;
}

export interface CreateSocialPostInput {
  clientId: string;
  projectId?: string;
  deliverableId?: string;
  title?: string;
  platforms: string[];
  caption: string;
  hashtags?: string;
  mediaUrls?: string[];
  scheduledAt?: string | Date;
  assigneeId?: string;
  status?: SocialPostStatus;
}

export interface UpdateSocialPostInput {
  title?: string;
  platforms?: string[];
  caption?: string;
  hashtags?: string;
  mediaUrls?: string[];
  scheduledAt?: string | Date | null;
  assigneeId?: string | null;
  status?: SocialPostStatus;
  publishedUrl?: string;
}

export interface ListPostsFilter {
  clientId?: string;
  platform?: string;
  status?: string;
  assigneeId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
}

export class SocialMediaService {
  /* =========================================================================
   * 1. SOCIAL ACCOUNTS
   * ========================================================================= */

  static async listAccounts(user: AuthenticatedUser, clientId?: string) {
    const targetClientId = user.role === "CLIENT" ? user.clientId : clientId;

    return prisma.socialAccount.findMany({
      where: {
        organizationId: user.organizationId,
        ...(targetClientId && { clientId: targetClientId }),
      },
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createAccount(user: AuthenticatedUser, input: CreateSocialAccountInput) {
    if (!can(user, "MANAGE_SOCIAL", { organizationId: user.organizationId })) {
      throw new Error("Unauthorized: Only agency team members can manage social channels.");
    }

    const client = await prisma.client.findFirst({
      where: { id: input.clientId, organizationId: user.organizationId },
    });
    if (!client) {
      throw new Error("Client not found.");
    }

    const cleanHandle = input.handle.trim().replace(/^@/, "");

    return prisma.socialAccount.create({
      data: {
        organizationId: user.organizationId,
        clientId: client.id,
        platform: input.platform.toUpperCase(),
        handle: `@${cleanHandle}`,
        profileUrl: input.profileUrl?.trim() || null,
      },
    });
  }

  static async deleteAccount(user: AuthenticatedUser, accountId: string) {
    if (!can(user, "MANAGE_SOCIAL", { organizationId: user.organizationId })) {
      throw new Error("Unauthorized.");
    }

    const existing = await prisma.socialAccount.findFirst({
      where: { id: accountId, organizationId: user.organizationId },
    });
    if (!existing) {
      throw new Error("Social account not found.");
    }

    await prisma.socialAccount.delete({ where: { id: accountId } });
    return { success: true };
  }

  /* =========================================================================
   * 2. SOCIAL POSTS QUERYING & CRUD
   * ========================================================================= */

  static async listPosts(user: AuthenticatedUser, filters: ListPostsFilter = {}) {
    const targetClientId = user.role === "CLIENT" ? user.clientId : filters.clientId;

    let dateQuery: any = undefined;
    if (filters.startDate || filters.endDate) {
      dateQuery = {};
      if (filters.startDate) dateQuery.gte = new Date(filters.startDate);
      if (filters.endDate) dateQuery.lte = new Date(filters.endDate);
    }

    const posts = await prisma.socialPost.findMany({
      where: {
        organizationId: user.organizationId,
        ...(targetClientId && { clientId: targetClientId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
        ...(dateQuery && { scheduledAt: dateQuery }),
        ...(filters.search && {
          OR: [
            { caption: { contains: filters.search } },
            { title: { contains: filters.search } },
            { hashtags: { contains: filters.search } },
          ],
        }),
      },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, email: true } },
        comments: {
          select: {
            id: true,
            authorName: true,
            authorType: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    });

    return posts
      .map((p) => {
        let parsedPlatforms: string[] = [];
        try {
          parsedPlatforms = JSON.parse(p.platforms);
        } catch {
          parsedPlatforms = [p.platforms];
        }

        let parsedMedia: string[] = [];
        try {
          parsedMedia = p.mediaUrls ? JSON.parse(p.mediaUrls) : [];
        } catch {
          parsedMedia = [];
        }

        return {
          ...p,
          platforms: parsedPlatforms,
          mediaUrls: parsedMedia,
        };
      })
      .filter((p) => {
        if (!filters.platform) return true;
        return p.platforms.includes(filters.platform.toUpperCase());
      });
  }

  static async getPost(user: AuthenticatedUser, postId: string) {
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        deliverable: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw new Error("Post not found.");
    }

    if (user.role === "CLIENT" && post.clientId !== user.clientId) {
      throw new Error("Access denied: You cannot view posts of another client.");
    }

    let parsedPlatforms: string[] = [];
    try {
      parsedPlatforms = JSON.parse(post.platforms);
    } catch {
      parsedPlatforms = [post.platforms];
    }

    let parsedMedia: string[] = [];
    try {
      parsedMedia = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
    } catch {
      parsedMedia = [];
    }

    return {
      ...post,
      platforms: parsedPlatforms,
      mediaUrls: parsedMedia,
    };
  }

  static async createPost(user: AuthenticatedUser, input: CreateSocialPostInput) {
    if (!can(user, "MANAGE_SOCIAL", { organizationId: user.organizationId })) {
      throw new Error("Unauthorized: Only agency team members can create posts.");
    }

    if (!input.caption || !input.caption.trim()) {
      throw new Error("Post caption is required.");
    }

    const client = await prisma.client.findFirst({
      where: { id: input.clientId, organizationId: user.organizationId },
    });
    if (!client) {
      throw new Error("Client not found.");
    }

    const platforms = input.platforms && input.platforms.length > 0
      ? input.platforms.map((p) => p.toUpperCase())
      : ["INSTAGRAM"];

    const post = await prisma.socialPost.create({
      data: {
        organizationId: user.organizationId,
        clientId: client.id,
        projectId: input.projectId || null,
        deliverableId: input.deliverableId || null,
        title: input.title?.trim() || null,
        platforms: JSON.stringify(platforms),
        caption: input.caption.trim(),
        hashtags: input.hashtags?.trim() || null,
        mediaUrls: input.mediaUrls ? JSON.stringify(input.mediaUrls) : null,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        assigneeId: input.assigneeId || user.id,
        status: input.status || "IDEA",
      },
      include: {
        client: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "SOCIAL_POST_CREATED",
        entityType: "SOCIAL_POST",
        entityId: post.id,
        metadata: JSON.stringify({
          title: post.title || post.caption.slice(0, 30),
          clientName: client.name,
          platforms,
          status: post.status,
        }),
      },
    });

    return {
      ...post,
      platforms,
      mediaUrls: input.mediaUrls || [],
    };
  }

  static async updatePost(user: AuthenticatedUser, postId: string, input: UpdateSocialPostInput) {
    const existing = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: { client: true },
    });

    if (!existing || existing.organizationId !== user.organizationId) {
      throw new Error("Post not found.");
    }

    if (user.role === "CLIENT") {
      throw new Error("Unauthorized: External clients can only review and approve posts.");
    }

    const data: any = {};
    if (input.title !== undefined) data.title = input.title?.trim() || null;
    if (input.caption !== undefined) data.caption = input.caption.trim();
    if (input.hashtags !== undefined) data.hashtags = input.hashtags?.trim() || null;
    if (input.platforms !== undefined) data.platforms = JSON.stringify(input.platforms.map((p) => p.toUpperCase()));
    if (input.mediaUrls !== undefined) data.mediaUrls = JSON.stringify(input.mediaUrls);
    if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
    if (input.status !== undefined) data.status = input.status;
    if (input.publishedUrl !== undefined) data.publishedUrl = input.publishedUrl;

    const updated = await prisma.socialPost.update({
      where: { id: postId },
      data,
      include: {
        client: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      ...updated,
      platforms: input.platforms || JSON.parse(updated.platforms),
      mediaUrls: input.mediaUrls || (updated.mediaUrls ? JSON.parse(updated.mediaUrls) : []),
    };
  }

  static async updatePostStatus(user: AuthenticatedUser, postId: string, nextStatus: SocialPostStatus) {
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: { client: true },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw new Error("Post not found.");
    }

    if (user.role === "CLIENT") {
      if (post.clientId !== user.clientId) {
        throw new Error("Access denied.");
      }
      if (nextStatus !== "APPROVED" && nextStatus !== "REJECTED") {
        throw new Error("Clients may only approve or reject social content.");
      }
    }

    const updated = await prisma.socialPost.update({
      where: { id: postId },
      data: { status: nextStatus },
      include: {
        client: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: user.role === "CLIENT" ? "CLIENT" : "USER",
        action: "SOCIAL_POST_STATUS_CHANGED",
        entityType: "SOCIAL_POST",
        entityId: post.id,
        metadata: JSON.stringify({
          previousStatus: post.status,
          nextStatus: updated.status,
          clientName: post.client.name,
        }),
      },
    });

    return updated;
  }

  static async deletePost(user: AuthenticatedUser, postId: string) {
    if (!can(user, "MANAGE_SOCIAL", { organizationId: user.organizationId })) {
      throw new Error("Unauthorized.");
    }

    const existing = await prisma.socialPost.findFirst({
      where: { id: postId, organizationId: user.organizationId },
    });
    if (!existing) {
      throw new Error("Post not found.");
    }

    await prisma.socialPost.delete({ where: { id: postId } });
    return { success: true };
  }

  /* =========================================================================
   * 3. PUBLISHING ENGINE (MANUAL + EXTENSIBLE PROVIDER)
   * ========================================================================= */

  static async markPostPublished(
    user: AuthenticatedUser,
    postId: string,
    options?: { publishedUrl?: string }
  ) {
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: { client: true, assignee: true },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw new Error("Post not found.");
    }

    const provider = getPublishingProvider();
    const result = await provider.publish(post, options);

    if (!result.success) {
      throw new Error(result.error || "Publishing provider failed.");
    }

    const updated = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: result.publishedAt || new Date(),
        publishedUrl: result.publishedUrl || null,
      },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "SOCIAL_POST_PUBLISHED",
        entityType: "SOCIAL_POST",
        entityId: post.id,
        metadata: JSON.stringify({
          title: post.title || post.caption.slice(0, 30),
          publishedUrl: updated.publishedUrl,
          provider: result.provider,
          clientName: post.client.name,
        }),
      },
    });

    return {
      success: true,
      post: updated,
      publishedUrl: updated.publishedUrl,
      provider: result.provider,
    };
  }

  static async markPublished(
    user: AuthenticatedUser,
    postId: string,
    publishedUrl?: string
  ) {
    const res = await this.markPostPublished(user, postId, { publishedUrl });
    return res.post;
  }

  /* =========================================================================
   * 4. BULK MONTHLY PLAN GENERATOR (e.g. 30 Posts)
   * ========================================================================= */

  static async bulkCreateMonthlyPlan(
    user: AuthenticatedUser,
    input: {
      clientId: string;
      year: number;
      month: number; // 1-12
      platforms?: string[];
      defaultPlatforms?: string[];
      count?: number; // default 30
      postCount?: number;
      theme?: string;
      themePrefix?: string;
      initialStatus?: SocialPostStatus;
      assigneeId?: string | null;
    }
  ) {
    if (!can(user, "MANAGE_SOCIAL", { organizationId: user.organizationId })) {
      throw new Error("Unauthorized: Only agency team members can generate monthly plans.");
    }

    const client = await prisma.client.findFirst({
      where: { id: input.clientId, organizationId: user.organizationId },
    });
    if (!client) {
      throw new Error("Client not found.");
    }

    const count = Math.min(60, Math.max(1, input.count || input.postCount || 30));
    const rawPlatforms = input.platforms || input.defaultPlatforms;
    const platforms =
      rawPlatforms && rawPlatforms.length > 0
        ? rawPlatforms.map((p) => p.toUpperCase())
        : ["INSTAGRAM", "LINKEDIN"];

    const platformsJson = JSON.stringify(platforms);
    const daysInMonth = new Date(input.year, input.month, 0).getDate();
    const themePrefix = input.theme || input.themePrefix || "";
    const initialStatus = input.initialStatus || "IDEA";
    const assigneeId = input.assigneeId !== undefined ? input.assigneeId : user.id;

    const sampleThemes = [
      "Industry Insight & Thought Leadership",
      "Product Feature Spotlight",
      "Behind the Scenes / Team Spotlight",
      "Client Transformation / Case Study",
      "Quick Tip & Actionable Advice",
      "Interactive Community Question / Poll",
    ];

    const createdPosts = [];

    for (let i = 1; i <= count; i++) {
      // Calculate spread date across the month
      const day = Math.min(daysInMonth, Math.max(1, Math.round((i / count) * daysInMonth)));
      const scheduledDate = new Date(input.year, input.month - 1, day, 10, 0, 0);

      const theme = sampleThemes[(i - 1) % sampleThemes.length];
      const title = `${themePrefix ? themePrefix + " · " : ""}Day ${i}: ${theme}`;
      const caption = `🚀 ${theme}\n\nHere's how modern teams elevate their brand performance with clean execution and measurable impact.\n\nSave this post for your weekly planning session!`;
      const hashtags = "#agencylife #brandstrategy #growth #workoperating";

      const post = await prisma.socialPost.create({
        data: {
          organizationId: user.organizationId,
          clientId: client.id,
          title,
          platforms: platformsJson,
          caption,
          hashtags,
          scheduledAt: scheduledDate,
          assigneeId,
          status: initialStatus,
          order: i,
        },
      });

      createdPosts.push(post);
    }

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: "USER",
        action: "SOCIAL_PLAN_BULK_CREATED",
        entityType: "CLIENT",
        entityId: client.id,
        metadata: JSON.stringify({
          clientName: client.name,
          month: input.month,
          year: input.year,
          postsGenerated: createdPosts.length,
        }),
      },
    });

    return {
      success: true,
      count: createdPosts.length,
      month: input.month,
      year: input.year,
      posts: createdPosts,
    };
  }

  /* =========================================================================
   * 5. DUPLICATE CONTENT PLAN TO NEXT MONTH
   * ========================================================================= */

  static async duplicateToNextMonth(
    user: AuthenticatedUser,
    input: {
      clientId: string;
      fromYear?: number;
      fromMonth?: number; // 1-12
      sourceYear?: number;
      sourceMonth?: number;
      targetYear?: number;
      targetMonth?: number;
      targetStatus?: SocialPostStatus;
    }
  ) {
    if (!can(user, "MANAGE_SOCIAL", { organizationId: user.organizationId })) {
      throw new Error("Unauthorized.");
    }

    const fromYear = Number(input.fromYear || input.sourceYear);
    const fromMonth = Number(input.fromMonth || input.sourceMonth);

    if (isNaN(fromYear) || isNaN(fromMonth)) {
      throw new Error("Invalid source month or year.");
    }

    const startDate = new Date(fromYear, fromMonth - 1, 1);
    const endDate = new Date(fromYear, fromMonth, 0, 23, 59, 59);

    const sourcePosts = await prisma.socialPost.findMany({
      where: {
        organizationId: user.organizationId,
        clientId: input.clientId,
        scheduledAt: { gte: startDate, lte: endDate },
      },
      orderBy: { scheduledAt: "asc" },
    });

    if (sourcePosts.length === 0) {
      throw new Error(`No posts found in ${fromMonth}/${fromYear} to duplicate.`);
    }

    // Determine target month and year
    let targetMonth = Number(input.targetMonth || fromMonth + 1);
    let targetYear = Number(input.targetYear || fromYear);
    if (!input.targetMonth && targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }

    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
    const duplicatedPosts = [];
    const statusToSet: SocialPostStatus = input.targetStatus || "IDEA";

    for (const post of sourcePosts) {
      let targetScheduled: Date | null = null;
      if (post.scheduledAt) {
        const day = Math.min(daysInTargetMonth, post.scheduledAt.getDate());
        targetScheduled = new Date(
          targetYear,
          targetMonth - 1,
          day,
          post.scheduledAt.getHours(),
          post.scheduledAt.getMinutes()
        );
      }

      const dup = await prisma.socialPost.create({
        data: {
          organizationId: user.organizationId,
          clientId: post.clientId,
          projectId: post.projectId,
          deliverableId: post.deliverableId,
          title: post.title ? `[Next Mo] ${post.title}` : null,
          platforms: post.platforms,
          caption: post.caption,
          hashtags: post.hashtags,
          mediaUrls: post.mediaUrls,
          scheduledAt: targetScheduled,
          assigneeId: post.assigneeId,
          status: statusToSet,
          order: post.order,
        },
      });

      duplicatedPosts.push(dup);
    }

    return {
      success: true,
      count: duplicatedPosts.length,
      duplicatedCount: duplicatedPosts.length,
      targetMonth,
      targetYear,
      posts: duplicatedPosts,
    };
  }

  /* =========================================================================
   * 6. CLIENT PORTAL BATCH APPROVAL & COMMENTS
   * ========================================================================= */

  static async clientBatchApprove(
    user: AuthenticatedUser,
    input: { postIds: string[]; clientId?: string }
  ) {
    if (user.role === "CLIENT" && user.canApprove === false) {
      throw new Error("Unauthorized: You do not have sign-off permission.");
    }

    const targetClientId = user.role === "CLIENT" ? user.clientId : input.clientId;
    if (!targetClientId) {
      throw new Error("Client ID required.");
    }

    const posts = await prisma.socialPost.findMany({
      where: {
        id: { in: input.postIds },
        organizationId: user.organizationId,
        clientId: targetClientId,
      },
    });

    if (posts.length === 0) {
      throw new Error("No matching posts found for approval.");
    }

    await prisma.socialPost.updateMany({
      where: { id: { in: posts.map((p) => p.id) } },
      data: { status: "APPROVED" },
    });

    await prisma.activityEvent.create({
      data: {
        organizationId: user.organizationId,
        actorId: user.id,
        actorType: user.role === "CLIENT" ? "CLIENT" : "USER",
        action: "SOCIAL_POSTS_BATCH_APPROVED",
        entityType: "CLIENT",
        entityId: targetClientId,
        metadata: JSON.stringify({
          clientName: user.name,
          approvedCount: posts.length,
          postIds: posts.map((p) => p.id),
        }),
      },
    });

    // Notify agency managers
    const managers = await prisma.membership.findMany({
      where: {
        organizationId: user.organizationId,
        role: { in: ["OWNER", "MANAGER"] },
      },
    });

    for (const mgr of managers) {
      await NotificationService.createNotification({
        organizationId: user.organizationId,
        recipientId: mgr.userId,
        actorId: user.id,
        actorName: user.name,
        type: "CLIENT_APPROVED",
        title: "Social Batch Approved!",
        message: `${user.name} approved a batch of ${posts.length} social media posts.`,
        entityType: "PROJECT",
        entityId: targetClientId,
        link: "/app/social",
      });
    }

    return {
      success: true,
      approvedCount: posts.length,
      postIds: posts.map((p) => p.id),
    };
  }

  static async addPostComment(
    user: AuthenticatedUser,
    postId: string,
    input: string | { content: string }
  ) {
    const rawContent = typeof input === "string" ? input : input?.content;
    if (!rawContent || !rawContent.trim()) {
      throw new Error("Comment text is required.");
    }
    const content = rawContent.trim();

    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      include: { client: true },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw new Error("Post not found.");
    }

    if (user.role === "CLIENT" && post.clientId !== user.clientId) {
      throw new Error("Access denied.");
    }

    const comment = await prisma.socialPostComment.create({
      data: {
        organizationId: user.organizationId,
        postId: post.id,
        authorId: user.id,
        authorType: user.role === "CLIENT" ? "CLIENT_CONTACT" : "USER",
        authorName: user.name,
        content,
      },
    });

    return comment;
  }

  static async getPostComments(user: AuthenticatedUser, postId: string) {
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw new Error("Post not found.");
    }

    if (user.role === "CLIENT" && post.clientId !== user.clientId) {
      throw new Error("Access denied.");
    }

    return prisma.socialPostComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
    });
  }

  /* =========================================================================
   * 7. DASHBOARD SOCIAL METRICS ("Scheduled this week" & Overdue Reminders)
   * ========================================================================= */

  static async getDashboardSocialMetrics(user: AuthenticatedUser) {
    const now = new Date();

    // Start and end of current week (Mon-Sun)
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const isClient = user.role === "CLIENT";
    const baseWhere = {
      organizationId: user.organizationId,
      ...(isClient && { clientId: user.clientId }),
    };

    // Scheduled this week
    const scheduledThisWeek = await prisma.socialPost.findMany({
      where: {
        ...baseWhere,
        scheduledAt: { gte: startOfWeek, lte: endOfWeek },
        status: { in: ["SCHEDULED", "APPROVED", "CLIENT_APPROVAL"] },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });

    // Overdue scheduled posts (scheduled in past but not yet published)
    const overduePosts = await prisma.socialPost.findMany({
      where: {
        ...baseWhere,
        scheduledAt: { lt: now },
        status: { in: ["SCHEDULED", "APPROVED"] },
      },
      include: {
        client: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });

    // Awaiting client approval count
    const awaitingApprovalCount = await prisma.socialPost.count({
      where: {
        ...baseWhere,
        status: "CLIENT_APPROVAL",
      },
    });

    return {
      scheduledThisWeekCount: scheduledThisWeek.length,
      scheduledThisWeek: scheduledThisWeek.map((p) => {
        let platforms = [];
        try {
          platforms = JSON.parse(p.platforms);
        } catch {
          platforms = [p.platforms];
        }
        return {
          id: p.id,
          title: p.title || p.caption.slice(0, 30),
          clientName: p.client.name,
          scheduledAt: p.scheduledAt,
          platforms,
          status: p.status,
        };
      }),
      overdueCount: overduePosts.length,
      overduePosts: overduePosts.map((p) => ({
        id: p.id,
        title: p.title || p.caption.slice(0, 30),
        clientName: p.client.name,
        scheduledAt: p.scheduledAt,
        assigneeName: p.assignee?.name || "Unassigned",
        status: p.status,
      })),
      awaitingApprovalCount,
    };
  }
}
