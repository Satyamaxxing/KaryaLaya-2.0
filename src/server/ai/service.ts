import { prisma } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth";
import { can, assertCan } from "@/server/permissions";
import { aiRateLimiter } from "./rate-limiter";
import { executeAiSafe } from "./provider";
import {
  AiGenerationResult,
  ClientUpdateDraft,
  RiskReasoningExplainer,
  RiskCauseStep,
  RiskEvidenceItem,
  WeeklyAgencySummary,
  TaskBreakdownSuggestion,
  SuggestedTaskItem,
  ThreadSummary,
} from "./types";

export class AiService {
  /**
   * FEATURE 1: Client update draft
   * Generates a friendly, polished progress update for a project from real data.
   * Safety constraint: Built server-side ONLY from CLIENT_VISIBLE data.
   * Never auto-sent: Human reviews, edits, and sends manually.
   */
  static async generateClientUpdateDraft(
    user: AuthenticatedUser,
    projectId: string
  ): Promise<AiGenerationResult<ClientUpdateDraft>> {
    assertCan(user, "VIEW_PROJECTS", { organizationId: user.organizationId });

    const rateCheck = aiRateLimiter.checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      throw new Error(`AI rate limit exceeded. Please wait ${rateCheck.retryAfterSec}s before retrying.`);
    }

    // 1. Fetch project scoped strictly to organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
      include: {
        client: { select: { id: true, name: true, companyName: true } },
        deliverables: {
          orderBy: { dueDate: "asc" },
          select: {
            id: true,
            title: true,
            status: true,
            serviceType: true,
            dueDate: true,
            progressPercent: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    // Filter strictly to client-safe deliverables
    // Note: All approved/in-progress deliverables represent client milestones
    const completedDelivs = project.deliverables.filter(
      (d) => d.status === "APPROVED" || d.status === "DELIVERED"
    );
    const inProgressDelivs = project.deliverables.filter(
      (d) => d.status === "IN_PROGRESS" || d.status === "SENT_TO_CLIENT" || d.status === "READY_FOR_REVIEW"
    );
    const upcomingDelivs = project.deliverables.filter((d) => d.status === "NOT_STARTED");

    const clientName = project.client.name;
    const clientCompany = project.client.companyName || project.client.name;

    const completedHighlights = completedDelivs.map((d) => `${d.title} (${d.serviceType})`);
    const upcomingNext = inProgressDelivs.concat(upcomingDelivs.slice(0, 2)).map(
      (d) => `${d.title}${d.dueDate ? ` (Target: ${new Date(d.dueDate).toLocaleDateString()})` : ""}`
    );

    const nextMilestone =
      inProgressDelivs[0]?.title ||
      upcomingDelivs[0]?.title ||
      (project.dueDate ? `Final Handover by ${new Date(project.dueDate).toLocaleDateString()}` : "Next sprint kickoff");

    // 2. Deterministic generator for fallback & baseline
    const fallbackGenerator = (): ClientUpdateDraft => {
      const subject = `Update on ${project.name} — Progress Report & Next Steps`;
      const greeting = `Hi ${clientName} team,`;

      const completedText =
        completedHighlights.length > 0
          ? `We've made great headway on ${project.name}! Here is what has been completed:\n• ${completedHighlights.join("\n• ")}`
          : `Work on ${project.name} is progressing smoothly.`;

      const nextText =
        upcomingNext.length > 0
          ? `Our current focus is on:\n• ${upcomingNext.join("\n• ")}`
          : "We are finalizing upcoming deliverables for your review.";

      const body = `${greeting}\n\nHope you're having a wonderful week! Here is your latest progress update for ${project.name}.\n\n${completedText}\n\n${nextText}\n\nOur next key milestone is ${nextMilestone}. Please let us know if you have any questions or feedback.\n\nBest regards,\nThe Agency Team`;

      return {
        subject,
        greeting,
        body,
        completedHighlights,
        upcomingNext,
        nextMilestone,
        clientSafeNotice:
          "Generated server-side using ONLY client-visible deliverables and progress. Internal tasks, team hours, and private notes were excluded.",
      };
    };

    // 3. Execute with safe fallback
    const execution = await executeAiSafe<ClientUpdateDraft>(
      "Client update draft generation",
      async (provider) => {
        const prompt = `Write a friendly, executive progress update email from an agency to client "${clientCompany}".
Project: ${project.name}
Overall Progress: ${project.progressPercent || 0}%
Completed Milestones: ${completedHighlights.join(", ") || "None yet"}
In Progress: ${upcomingNext.join(", ") || "Active development"}
Next Milestone: ${nextMilestone}

Requirements:
- Professional, warm, and concise tone
- Focus strictly on outcomes, no internal technical jargon
- Return a JSON object with: { "subject": string, "greeting": string, "body": string }`;

        const raw = await provider.generateText(prompt, {
          systemPrompt:
            "You are a client success communications assistant for a creative agency. Output valid JSON only.",
        });

        try {
          const parsed = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
          return {
            subject: parsed.subject || `Progress Update: ${project.name}`,
            greeting: parsed.greeting || `Hi ${clientName} team,`,
            body: parsed.body || raw,
            completedHighlights,
            upcomingNext,
            nextMilestone,
            clientSafeNotice:
              "Generated server-side using ONLY client-visible deliverables and progress. Internal tasks, team hours, and private notes were excluded.",
          };
        } catch {
          return fallbackGenerator();
        }
      },
      fallbackGenerator
    );

    // 4. Store AI output record for audit reference
    const record = await prisma.aiOutput.create({
      data: {
        organizationId: user.organizationId,
        feature: "CLIENT_UPDATE_DRAFT",
        promptInputs: JSON.stringify({
          projectId,
          clientVisibleOnly: true,
          completedCount: completedHighlights.length,
          inProgressCount: upcomingNext.length,
        }),
        outputContent: JSON.stringify(execution.data),
        modelUsed: execution.modelUsed,
        isAiGenerated: true,
        requestedById: user.id,
        status: "GENERATED",
      },
    });

    return {
      feature: "CLIENT_UPDATE_DRAFT",
      outputId: record.id,
      data: execution.data,
      model: execution.modelUsed,
      isAiGenerated: true,
      inputsReference: { projectId, clientVisibleOnly: true },
      fallbackUsed: execution.fallbackUsed,
      notice: execution.notice,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * FEATURE 2: "Why is this at risk?"
   * Explains existing rule-based risk reason in plain language using the real causality chain.
   * Output: Three-level explanation:
   * Level 1: Plain-language summary
   * Level 2: Cause chain (task -> dependency -> deliverable -> client review)
   * Level 3: Evidence (links to actual tasks, dates, blockers)
   */
  static async explainRiskReason(
    user: AuthenticatedUser,
    deliverableId: string
  ): Promise<AiGenerationResult<RiskReasoningExplainer>> {
    assertCan(user, "VIEW_DELIVERABLE", { organizationId: user.organizationId });

    const rateCheck = aiRateLimiter.checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      throw new Error(`AI rate limit exceeded. Please wait ${rateCheck.retryAfterSec}s before retrying.`);
    }

    const deliverable = await prisma.deliverable.findFirst({
      where: { id: deliverableId, organizationId: user.organizationId },
      include: {
        project: { select: { id: true, name: true, client: { select: { name: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } },
            blockedBy: {
              include: {
                blockingTask: { select: { id: true, title: true, status: true, dueDate: true } },
              },
            },
          },
        },
      },
    });

    if (!deliverable) {
      throw new Error("Deliverable not found or access denied.");
    }

    const now = new Date();
    const delivDueDate = deliverable.dueDate ? new Date(deliverable.dueDate) : null;
    const isOverdue = delivDueDate ? delivDueDate < now && deliverable.status !== "APPROVED" : false;

    // Analyze tasks for blockers & delays
    const incompleteTasks = deliverable.tasks.filter((t) => t.status !== "DONE");
    const overdueTasks = incompleteTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);
    const blockedTasks = incompleteTasks.filter(
      (t) => t.blockedBy.length > 0 && t.blockedBy.some((b) => b.blockingTask.status !== "DONE")
    );

    // Build Level 3 Evidence
    const level3Evidence: RiskEvidenceItem[] = [];

    if (isOverdue && delivDueDate) {
      const delayDays = Math.ceil((now.getTime() - delivDueDate.getTime()) / (1000 * 60 * 60 * 24));
      level3Evidence.push({
        entityId: deliverable.id,
        entityType: "DELIVERABLE",
        title: deliverable.title,
        status: deliverable.status,
        dueDate: deliverable.dueDate?.toISOString(),
        delayDays,
        linkUrl: `/app/projects/${deliverable.projectId}?tab=deliverables`,
      });
    }

    for (const ot of overdueTasks) {
      const due = ot.dueDate ? new Date(ot.dueDate) : now;
      const delayDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      level3Evidence.push({
        entityId: ot.id,
        entityType: "TASK",
        title: ot.title,
        status: ot.status,
        dueDate: ot.dueDate?.toISOString(),
        delayDays,
        linkUrl: `/app/projects/${deliverable.projectId}?tab=tasks&taskId=${ot.id}`,
      });
    }

    for (const bt of blockedTasks) {
      const blocker = bt.blockedBy[0]?.blockingTask;
      level3Evidence.push({
        entityId: bt.id,
        entityType: "TASK",
        title: bt.title,
        status: bt.status,
        dueDate: bt.dueDate?.toISOString(),
        blockerTitle: blocker ? blocker.title : undefined,
        linkUrl: `/app/projects/${deliverable.projectId}?tab=tasks&taskId=${bt.id}`,
      });
    }

    // Build Level 2 Cause Chain
    const level2CauseChain: RiskCauseStep[] = [];
    let stepCount = 1;

    if (blockedTasks.length > 0) {
      const bt = blockedTasks[0];
      const blocker = bt.blockedBy[0]?.blockingTask;
      level2CauseChain.push({
        step: stepCount++,
        entityType: "DEPENDENCY",
        entityId: bt.id,
        title: `Task Blocked by Unfinished Dependency`,
        description: `Task '${bt.title}' cannot start because prerequisite '${blocker?.title || "Prerequisite"}' is currently ${blocker?.status || "IN_PROGRESS"}.`,
      });
    }

    if (overdueTasks.length > 0) {
      const ot = overdueTasks[0];
      level2CauseChain.push({
        step: stepCount++,
        entityType: "TASK",
        entityId: ot.id,
        title: `Internal Execution Delayed`,
        description: `Task '${ot.title}' missed its target date (${ot.dueDate ? new Date(ot.dueDate).toLocaleDateString() : "past due"}), postponing QA review.`,
      });
    }

    level2CauseChain.push({
      step: stepCount++,
      entityType: "DELIVERABLE",
      entityId: deliverable.id,
      title: `Deliverable Milestone Compressed`,
      description: `Pending work prevents deliverable from entering review state on schedule (${delivDueDate ? delivDueDate.toLocaleDateString() : "TBD"}).`,
    });

    if (deliverable.status === "REVISION_REQUESTED") {
      level2CauseChain.push({
        step: stepCount++,
        entityType: "CLIENT_REVIEW",
        entityId: deliverable.id,
        title: `Client Revision Cycle Open`,
        description: `Client requested modifications that require team turnaround before re-submission.`,
      });
    }

    // Level 1 Summary
    const fallbackSummary = (): string => {
      if (deliverable.riskReason) {
        return `Deliverable is flagged AT RISK: ${deliverable.riskReason}. This is caused by ${incompleteTasks.length} incomplete tasks, with ${overdueTasks.length} overdue task(s).`;
      }
      if (isOverdue) {
        return `Deliverable deadline was ${delivDueDate?.toLocaleDateString()} and is now overdue with ${incompleteTasks.length} incomplete tasks.`;
      }
      if (blockedTasks.length > 0) {
        return `Deliverable execution is impeded because key tasks are blocked by unfinished upstream dependencies.`;
      }
      return `Deliverable is running behind target pace due to delayed task progress.`;
    };

    const mitigations = [
      overdueTasks.length > 0 ? "Reassign or split overdue tasks to available team members." : null,
      blockedTasks.length > 0 ? "Fast-track completion of the blocking dependency." : null,
      "Request a client milestone extension before the review window compresses.",
    ].filter(Boolean) as string[];

    const fallbackGenerator = (): RiskReasoningExplainer => ({
      deliverableId: deliverable.id,
      deliverableTitle: deliverable.title,
      currentRiskStatus: deliverable.riskStatus || "AT_RISK",
      level1Summary: fallbackSummary(),
      level2CauseChain,
      level3Evidence,
      mitigationSuggestions: mitigations,
    });

    // Run with safe fallback
    const execution = await executeAiSafe<RiskReasoningExplainer>(
      "Risk reasoning explainer",
      async (provider) => {
        const prompt = `Explain why the following deliverable is at risk:
Deliverable: "${deliverable.title}"
Project: "${deliverable.project.name}"
Due Date: ${delivDueDate ? delivDueDate.toLocaleDateString() : "No deadline"}
Existing Risk Reason: "${deliverable.riskReason || "Delayed progress"}"
Incomplete Tasks: ${incompleteTasks.map((t) => t.title).join(", ")}
Overdue Tasks: ${overdueTasks.map((t) => t.title).join(", ") || "None"}
Blocked Tasks: ${blockedTasks.map((t) => t.title).join(", ") || "None"}

Write a crisp 2-sentence plain-language summary of the root cause. Return JSON: { "summary": string }`;

        const raw = await provider.generateText(prompt, {
          systemPrompt: "You are an agency delivery risk analyst. Return valid JSON only.",
        });

        try {
          const parsed = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
          return {
            deliverableId: deliverable.id,
            deliverableTitle: deliverable.title,
            currentRiskStatus: deliverable.riskStatus || "AT_RISK",
            level1Summary: parsed.summary || fallbackSummary(),
            level2CauseChain,
            level3Evidence,
            mitigationSuggestions: mitigations,
          };
        } catch {
          return fallbackGenerator();
        }
      },
      fallbackGenerator
    );

    // Save record
    const record = await prisma.aiOutput.create({
      data: {
        organizationId: user.organizationId,
        feature: "RISK_REASONING",
        promptInputs: JSON.stringify({
          deliverableId,
          evidenceCount: level3Evidence.length,
          causeChainSteps: level2CauseChain.length,
        }),
        outputContent: JSON.stringify(execution.data),
        modelUsed: execution.modelUsed,
        isAiGenerated: true,
        requestedById: user.id,
        status: "GENERATED",
      },
    });

    return {
      feature: "RISK_REASONING",
      outputId: record.id,
      data: execution.data,
      model: execution.modelUsed,
      isAiGenerated: true,
      inputsReference: { deliverableId, evidenceCount: level3Evidence.length },
      fallbackUsed: execution.fallbackUsed,
      notice: execution.notice,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * FEATURE 3: Weekly agency summary for owner
   * What finished, what is stuck, who is overloaded.
   * Safety rule: Only accessible by OWNER or MANAGER roles.
   */
  static async generateWeeklyAgencySummary(
    user: AuthenticatedUser
  ): Promise<AiGenerationResult<WeeklyAgencySummary>> {
    assertCan(user, "VIEW_AGENCY_SUMMARY", { organizationId: user.organizationId });

    const rateCheck = aiRateLimiter.checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      throw new Error(`AI rate limit exceeded. Please wait ${rateCheck.retryAfterSec}s before retrying.`);
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Query Finished This Week
    const finishedDeliverables = await prisma.deliverable.findMany({
      where: {
        organizationId: user.organizationId,
        status: { in: ["APPROVED", "DELIVERED"] },
        updatedAt: { gte: sevenDaysAgo },
      },
      include: {
        project: { select: { name: true, client: { select: { name: true } } } },
      },
    });

    const finishedTasks = await prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        status: "DONE",
        updatedAt: { gte: sevenDaysAgo },
      },
      include: { project: { select: { name: true } } },
      take: 10,
    });

    const finishedList = [
      ...finishedDeliverables.map((d) => ({
        id: d.id,
        type: "DELIVERABLE" as const,
        title: d.title,
        completedAt: d.updatedAt.toLocaleDateString(),
        clientName: d.project.client.name,
        projectName: d.project.name,
      })),
      ...finishedTasks.map((t) => ({
        id: t.id,
        type: "TASK" as const,
        title: t.title,
        completedAt: t.updatedAt.toLocaleDateString(),
        projectName: t.project.name,
      })),
    ];

    // 2. Query Stuck or At Risk
    const atRiskDeliverables = await prisma.deliverable.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [{ riskStatus: "AT_RISK" }, { status: "REVISION_REQUESTED" }],
      },
      include: {
        project: { select: { name: true, client: { select: { name: true } } } },
      },
    });

    const stuckList = atRiskDeliverables.map((d) => ({
      id: d.id,
      type: "DELIVERABLE" as const,
      title: d.title,
      riskReason: d.riskReason || (d.status === "REVISION_REQUESTED" ? "Client requested revision" : "At risk"),
      delayDays: d.dueDate && new Date(d.dueDate) < now ? Math.ceil((now.getTime() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      clientName: d.project.client.name,
      projectName: d.project.name,
    }));

    // 3. Query Overloaded Members
    const memberships = await prisma.membership.findMany({
      where: { organizationId: user.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            leaves: {
              where: { organizationId: user.organizationId, endDate: { gte: now } },
            },
            tasksAssigned: {
              where: { organizationId: user.organizationId, status: { not: "DONE" } },
              select: { id: true, loggedHours: true },
            },
          },
        },
      },
    });

    const overloadedMembers: WeeklyAgencySummary["overloadedMembers"] = [];

    for (const m of memberships) {
      const openTasksCount = m.user.tasksAssigned.length;
      const hoursThisWeek = m.user.tasksAssigned.reduce((acc, t) => acc + (t.loggedHours || 0), 0);
      const activeLeave = m.user.leaves.find((l) => new Date(l.startDate) <= now && new Date(l.endDate) >= now);

      let capacityRating: "AVAILABLE" | "HIGH_LOAD" | "ON_LEAVE" = "AVAILABLE";
      let warningReason: string | undefined;

      if (activeLeave) {
        capacityRating = "ON_LEAVE";
        warningReason = `On leave until ${new Date(activeLeave.endDate).toLocaleDateString()}`;
      } else if (openTasksCount > 5 || hoursThisWeek > 35) {
        capacityRating = "HIGH_LOAD";
        warningReason = `${openTasksCount} open tasks, ${hoursThisWeek}h logged this week`;
      }

      if (capacityRating !== "AVAILABLE") {
        overloadedMembers.push({
          memberId: m.user.id,
          name: m.user.name,
          role: m.role,
          openTasksCount,
          hoursThisWeek,
          capacityRating,
          warningReason,
        });
      }
    }

    const recommendations = [
      stuckList.length > 0 ? `Schedule review for ${stuckList.length} stalled deliverables.` : null,
      overloadedMembers.length > 0 ? `Rebalance workloads for ${overloadedMembers.map((m) => m.name).join(", ")}.` : null,
      "Celebrate completed deliverables with client partners.",
    ].filter(Boolean) as string[];

    const fallbackGenerator = (): WeeklyAgencySummary => ({
      period: `Week of ${now.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      finishedThisWeek: finishedList,
      stuckOrAtRisk: stuckList,
      overloadedMembers,
      actionRecommendations: recommendations,
    });

    const execution = await executeAiSafe<WeeklyAgencySummary>(
      "Weekly agency summary",
      async (provider) => {
        const prompt = `Generate executive recommendations for an agency leadership weekly briefing:
Finished items: ${finishedList.length}
Stuck/At-risk deliverables: ${stuckList.map((d) => `${d.title} (${d.riskReason})`).join(", ") || "None"}
High-load or on-leave team members: ${overloadedMembers.map((m) => `${m.name}: ${m.warningReason}`).join("; ") || "All clear"}

Provide 3 concrete, high-leverage action recommendations for agency leadership. Return JSON: { "recommendations": string[] }`;

        const raw = await provider.generateText(prompt, {
          systemPrompt: "You are an agency operations advisor. Return valid JSON only.",
        });

        try {
          const parsed = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
          return {
            ...fallbackGenerator(),
            actionRecommendations: parsed.recommendations || recommendations,
          };
        } catch {
          return fallbackGenerator();
        }
      },
      fallbackGenerator
    );

    const record = await prisma.aiOutput.create({
      data: {
        organizationId: user.organizationId,
        feature: "AGENCY_SUMMARY",
        promptInputs: JSON.stringify({
          finishedCount: finishedList.length,
          stuckCount: stuckList.length,
          overloadedCount: overloadedMembers.length,
        }),
        outputContent: JSON.stringify(execution.data),
        modelUsed: execution.modelUsed,
        isAiGenerated: true,
        requestedById: user.id,
        status: "GENERATED",
      },
    });

    return {
      feature: "AGENCY_SUMMARY",
      outputId: record.id,
      data: execution.data,
      model: execution.modelUsed,
      isAiGenerated: true,
      inputsReference: { period: execution.data.period },
      fallbackUsed: execution.fallbackUsed,
      notice: execution.notice,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * FEATURE 4: Task breakdown
   * Suggests subtasks / tasks for a deliverable from description and service type.
   * Safety rule: Suggestions are presented for approval, NEVER silently created.
   */
  static async suggestTaskBreakdown(
    user: AuthenticatedUser,
    deliverableId: string
  ): Promise<AiGenerationResult<TaskBreakdownSuggestion>> {
    assertCan(user, "VIEW_DELIVERABLE", { organizationId: user.organizationId });

    const rateCheck = aiRateLimiter.checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      throw new Error(`AI rate limit exceeded. Please wait ${rateCheck.retryAfterSec}s before retrying.`);
    }

    const deliverable = await prisma.deliverable.findFirst({
      where: { id: deliverableId, organizationId: user.organizationId },
      include: {
        tasks: { select: { title: true } },
      },
    });

    if (!deliverable) {
      throw new Error("Deliverable not found or access denied.");
    }

    // Default template-based task library for deterministic generation
    const getTemplateTasks = (serviceType: string, title: string): SuggestedTaskItem[] => {
      switch (serviceType) {
        case "WEB_DEV":
          return [
            { tempId: "t1", title: `Architecture & Schema setup for ${title}`, description: "Setup data models and API handlers", priority: "HIGH", estimateHours: 4 },
            { tempId: "t2", title: `Responsive UI Component implementation`, description: "Develop interactive screens with Tailwind/CSS", priority: "MEDIUM", estimateHours: 6 },
            { tempId: "t3", title: `Integration testing & error boundaries`, description: "Unit tests and responsive layout checks", priority: "MEDIUM", estimateHours: 3 },
            { tempId: "t4", title: `Production deployment & client staging check`, description: "Deploy preview environment for review", priority: "HIGH", estimateHours: 2 },
          ];
        case "DESIGN":
        case "BRANDING":
          return [
            { tempId: "t1", title: `Moodboard & Creative Direction research`, description: "Gather reference styles and color palettes", priority: "MEDIUM", estimateHours: 3 },
            { tempId: "t2", title: `Core Figma Token & Component drafting`, description: "Design primary layout tokens and typography", priority: "HIGH", estimateHours: 5 },
            { tempId: "t3", title: `Internal Design Critique & adjustments`, description: "Review visual consistency with art director", priority: "MEDIUM", estimateHours: 2 },
            { tempId: "t4", title: `Client Review deck & asset export`, description: "Export high-res PNG/SVG packages and documentation", priority: "HIGH", estimateHours: 3 },
          ];
        case "VIDEO":
          return [
            { tempId: "t1", title: `Storyboard & Script outline review`, description: "Review sequence timing and audio cues", priority: "HIGH", estimateHours: 3 },
            { tempId: "t2", title: `Assembly Rough Cut & audio synchronization`, description: "First pass assembly edit with placeholder music", priority: "HIGH", estimateHours: 6 },
            { tempId: "t3", title: `Color grading, VFX & sound mix`, description: "Final polish pass and audio leveling", priority: "MEDIUM", estimateHours: 4 },
            { tempId: "t4", title: `Export review draft for client approval`, description: "Generate 1080p preview link with timestamps", priority: "HIGH", estimateHours: 2 },
          ];
        case "SOCIAL":
          return [
            { tempId: "t1", title: `Content Strategy & Copywriting draft`, description: "Draft platform-optimized captions and hashtags", priority: "MEDIUM", estimateHours: 3 },
            { tempId: "t2", title: `Creative Asset production & sizing`, description: "Create 1:1 and 9:16 aspect ratio visuals", priority: "HIGH", estimateHours: 4 },
            { tempId: "t3", title: `Internal Copy & Compliance review`, description: "Verify client tone guidelines and links", priority: "MEDIUM", estimateHours: 1.5 },
            { tempId: "t4", title: `Scheduling & calendar placement`, description: "Schedule posts in portal for client sign-off", priority: "HIGH", estimateHours: 2 },
          ];
        default:
          return [
            { tempId: "t1", title: `Requirements Discovery & Scoping`, description: "Clarify milestones and acceptance criteria", priority: "HIGH", estimateHours: 3 },
            { tempId: "t2", title: `Core Implementation Sprint`, description: "Execute deliverable core requirements", priority: "HIGH", estimateHours: 6 },
            { tempId: "t3", title: `Quality Assurance & Polish pass`, description: "Review quality standards and edge cases", priority: "MEDIUM", estimateHours: 3 },
            { tempId: "t4", title: `Final Handover & Client Submission`, description: "Prepare deliverable for client approval", priority: "HIGH", estimateHours: 2 },
          ];
      }
    };

    const fallbackGenerator = (): TaskBreakdownSuggestion => ({
      deliverableId: deliverable.id,
      deliverableTitle: deliverable.title,
      serviceType: deliverable.serviceType,
      suggestedTasks: getTemplateTasks(deliverable.serviceType, deliverable.title),
      approvalNotice:
        "These are AI suggestions. No tasks have been created. Review and check the tasks you want to add to the deliverable.",
    });

    const execution = await executeAiSafe<TaskBreakdownSuggestion>(
      "Task breakdown suggestion",
      async (provider) => {
        const prompt = `Suggest 4-5 tactical tasks for an agency deliverable:
Title: "${deliverable.title}"
Service Type: ${deliverable.serviceType}
Description: "${deliverable.description || "Deliverable execution"}"
Existing Tasks: ${deliverable.tasks.map((t) => t.title).join(", ") || "None"}

Requirements:
- Action-oriented task titles
- Return JSON: { "tasks": Array<{ "title": string, "description": string, "priority": "LOW"|"MEDIUM"|"HIGH", "estimateHours": number }> }`;

        const raw = await provider.generateText(prompt, {
          systemPrompt: "You are an agency project manager. Output valid JSON only.",
        });

        try {
          const parsed = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
          const tasks: SuggestedTaskItem[] = (parsed.tasks || []).map((t: any, idx: number) => ({
            tempId: `t_${idx + 1}`,
            title: t.title || `Task ${idx + 1}`,
            description: t.description || "",
            priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(t.priority) ? t.priority : "MEDIUM",
            estimateHours: Number(t.estimateHours) || 3,
          }));

          return {
            deliverableId: deliverable.id,
            deliverableTitle: deliverable.title,
            serviceType: deliverable.serviceType,
            suggestedTasks: tasks.length > 0 ? tasks : getTemplateTasks(deliverable.serviceType, deliverable.title),
            approvalNotice:
              "These are AI suggestions. No tasks have been created. Review and check the tasks you want to add to the deliverable.",
          };
        } catch {
          return fallbackGenerator();
        }
      },
      fallbackGenerator
    );

    const record = await prisma.aiOutput.create({
      data: {
        organizationId: user.organizationId,
        feature: "TASK_BREAKDOWN",
        promptInputs: JSON.stringify({
          deliverableId,
          serviceType: deliverable.serviceType,
        }),
        outputContent: JSON.stringify(execution.data),
        modelUsed: execution.modelUsed,
        isAiGenerated: true,
        requestedById: user.id,
        status: "GENERATED",
      },
    });

    return {
      feature: "TASK_BREAKDOWN",
      outputId: record.id,
      data: execution.data,
      model: execution.modelUsed,
      isAiGenerated: true,
      inputsReference: { deliverableId },
      fallbackUsed: execution.fallbackUsed,
      notice: execution.notice,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * FEATURE 5: Thread summary for long discussions
   * Summarizes comment thread into key decisions, open questions, and action items.
   * Safety constraint: Respects permission boundaries (Clients see only CLIENT_VISIBLE).
   */
  static async summarizeThread(
    user: AuthenticatedUser,
    params: { entityType: "PROJECT" | "DELIVERABLE" | "TASK" | "SOCIAL_POST"; entityId: string }
  ): Promise<AiGenerationResult<ThreadSummary>> {
    const rateCheck = aiRateLimiter.checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      throw new Error(`AI rate limit exceeded. Please wait ${rateCheck.retryAfterSec}s before retrying.`);
    }

    // Permission check based on user role
    const isClient = user.role === "CLIENT";

    // Query comments scoped strictly to organization & audience permission
    const whereClause: any = {
      organizationId: user.organizationId,
    };

    if (params.entityType === "PROJECT") whereClause.projectId = params.entityId;
    else if (params.entityType === "DELIVERABLE") whereClause.deliverableId = params.entityId;
    else if (params.entityType === "TASK") whereClause.taskId = params.entityId;
    else if (params.entityType === "SOCIAL_POST") whereClause.socialPostId = params.entityId;

    if (isClient) {
      // Clients only see CLIENT_VISIBLE comments
      whereClause.visibility = "CLIENT_VISIBLE";
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    });

    if (comments.length === 0) {
      return {
        feature: "THREAD_SUMMARY",
        outputId: "empty",
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          totalCommentsAnalyzed: 0,
          discussionSummary: "No comments found in this discussion thread yet.",
          keyDecisions: [],
          openQuestions: [],
          actionItems: [],
        },
        model: "deterministic-engine",
        isAiGenerated: true,
        inputsReference: { entityType: params.entityType, entityId: params.entityId },
        fallbackUsed: true,
        createdAt: new Date().toISOString(),
      };
    }

    const commentSnippets = comments.map((c) => {
      const author = c.authorName || "Team Member";
      return `[${author}] (${c.visibility}): ${c.content}`;
    });

    const fallbackGenerator = (): ThreadSummary => {
      const keyDecisions: string[] = [];
      const openQuestions: string[] = [];
      const actionItems: string[] = [];

      for (const c of comments) {
        const text = c.content.toLowerCase();
        if (text.includes("approved") || text.includes("agreed") || text.includes("decided") || text.includes("confirmed")) {
          keyDecisions.push(c.content.slice(0, 100));
        } else if (text.includes("?") || text.includes("can we") || text.includes("should we")) {
          openQuestions.push(c.content.slice(0, 100));
        } else if (text.includes("will") || text.includes("todo") || text.includes("action") || text.includes("please update")) {
          actionItems.push(c.content.slice(0, 100));
        }
      }

      return {
        entityType: params.entityType,
        entityId: params.entityId,
        totalCommentsAnalyzed: comments.length,
        discussionSummary: `Discussion across ${comments.length} message(s) discussing requirements, feedback, and execution steps.`,
        keyDecisions: keyDecisions.length > 0 ? keyDecisions.slice(0, 3) : ["Scope alignment confirmed by team"],
        openQuestions: openQuestions.length > 0 ? openQuestions.slice(0, 3) : ["No unresolved blockers currently pending"],
        actionItems: actionItems.length > 0 ? actionItems.slice(0, 4) : ["Proceed with next deliverable review sprint"],
      };
    };

    const execution = await executeAiSafe<ThreadSummary>(
      "Discussion thread summary",
      async (provider) => {
        const prompt = `Analyze this project thread and summarize key points:
${commentSnippets.join("\n")}

Return JSON:
{
  "summary": string,
  "decisions": string[],
  "questions": string[],
  "actionItems": string[]
}`;

        const raw = await provider.generateText(prompt, {
          systemPrompt: "You are an executive meeting & thread summarizer. Output valid JSON only.",
        });

        try {
          const parsed = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
          return {
            entityType: params.entityType,
            entityId: params.entityId,
            totalCommentsAnalyzed: comments.length,
            discussionSummary: parsed.summary || fallbackGenerator().discussionSummary,
            keyDecisions: parsed.decisions || fallbackGenerator().keyDecisions,
            openQuestions: parsed.questions || fallbackGenerator().openQuestions,
            actionItems: parsed.actionItems || fallbackGenerator().actionItems,
          };
        } catch {
          return fallbackGenerator();
        }
      },
      fallbackGenerator
    );

    const record = await prisma.aiOutput.create({
      data: {
        organizationId: user.organizationId,
        feature: "THREAD_SUMMARY",
        promptInputs: JSON.stringify({
          entityType: params.entityType,
          entityId: params.entityId,
          commentsCount: comments.length,
          clientScoped: isClient,
        }),
        outputContent: JSON.stringify(execution.data),
        modelUsed: execution.modelUsed,
        isAiGenerated: true,
        requestedById: user.id,
        status: "GENERATED",
      },
    });

    return {
      feature: "THREAD_SUMMARY",
      outputId: record.id,
      data: execution.data,
      model: execution.modelUsed,
      isAiGenerated: true,
      inputsReference: { entityType: params.entityType, entityId: params.entityId },
      fallbackUsed: execution.fallbackUsed,
      notice: execution.notice,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * Apply approved AI action (e.g. creating accepted tasks from breakdown).
   * Logs an ActivityEvent with actorType: "AI" and records the approving human.
   */
  static async applyAiAction(
    user: AuthenticatedUser,
    aiOutputId: string,
    actionPayload: {
      actionType: "CREATE_SUGGESTED_TASKS" | "APPLY_CLIENT_UPDATE";
      tasks?: Array<{ title: string; description?: string; priority?: string; estimateHours?: number }>;
      projectId?: string;
      deliverableId?: string;
    }
  ) {
    const aiOutput = await prisma.aiOutput.findFirst({
      where: { id: aiOutputId, organizationId: user.organizationId },
    });

    if (!aiOutput) {
      throw new Error("AI output record not found.");
    }

    if (actionPayload.actionType === "CREATE_SUGGESTED_TASKS") {
      assertCan(user, "CREATE_TASK", { organizationId: user.organizationId });

      if (!actionPayload.deliverableId) {
        throw new Error("Deliverable ID is required to attach created tasks.");
      }

      const deliverable = await prisma.deliverable.findFirst({
        where: { id: actionPayload.deliverableId, organizationId: user.organizationId },
      });

      if (!deliverable) {
        throw new Error("Deliverable not found.");
      }

      const tasksToCreate = actionPayload.tasks || [];
      const createdTasks = [];

      for (const t of tasksToCreate) {
        const created = await prisma.task.create({
          data: {
            organizationId: user.organizationId,
            projectId: deliverable.projectId,
            deliverableId: deliverable.id,
            title: t.title.trim(),
            description: t.description?.trim() || null,
            priority: (t.priority as any) || "MEDIUM",
            estimateHours: t.estimateHours || 3,
            status: "TODO",
          },
        });
        createdTasks.push(created);
      }

      // Mark AI Output as APPLIED with human approver
      await prisma.aiOutput.update({
        where: { id: aiOutputId },
        data: {
          status: "APPLIED",
          approvedById: user.id,
          appliedAt: new Date(),
        },
      });

      // Audit Log with actorType AI and human approver
      await prisma.activityEvent.create({
        data: {
          organizationId: user.organizationId,
          actorId: user.id,
          actorType: "AI",
          action: "AI_TASKS_APPROVED",
          entityType: "DELIVERABLE",
          entityId: deliverable.id,
          metadata: JSON.stringify({
            approvedByUserId: user.id,
            approvedByName: user.name,
            tasksCreatedCount: createdTasks.length,
            aiOutputId,
          }),
        },
      });

      return {
        success: true,
        createdTasksCount: createdTasks.length,
        createdTasks,
      };
    }

    throw new Error(`Unsupported AI action type: ${actionPayload.actionType}`);
  }
}
