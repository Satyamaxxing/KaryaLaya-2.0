"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  Project,
  Deliverable,
  Task,
  Dependency,
  Milestone,
  Approval,
  Comment,
  Document,
  CalendarItem,
  ActivityEvent,
  AIInsight,
  AIRecommendation,
  Automation,
  AutomationRun,
  NotificationItem,
  User,
  ClientContact,
  PrincipalRole,
  ClientProjection,
  TaskStatus,
  EntityAudience,
} from "@/types/work-os";
import {
  INITIAL_PROJECT,
  INITIAL_DELIVERABLES,
  INITIAL_TASKS,
  INITIAL_DEPENDENCIES,
  INITIAL_MILESTONES,
  INITIAL_APPROVALS,
  INITIAL_COMMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_CALENDAR_ITEMS,
  INITIAL_AI_INSIGHT,
  INITIAL_AI_RECOMMENDATION,
  INITIAL_AUTOMATIONS,
  INITIAL_AUTOMATION_RUNS,
  INITIAL_ACTIVITY_EVENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USERS,
  INITIAL_CLIENT,
} from "@/lib/data/initial-state";

interface WorkStateContextType {
  // Current user & context
  currentUser: User;
  clientContact: ClientContact;
  currentRole: PrincipalRole;
  setCurrentRole: (role: PrincipalRole) => void;
  setCurrentUserId: (userId: string) => void;

  // Authoritative State
  project: Project;
  deliverables: Record<string, Deliverable>;
  tasks: Record<string, Task>;
  dependencies: Dependency[];
  milestones: Record<string, Milestone>;
  approvals: Record<string, Approval>;
  comments: Comment[];
  documents: Document[];
  calendarItems: CalendarItem[];
  aiInsight: AIInsight;
  aiRecommendation: AIRecommendation;
  automations: Automation[];
  automationRuns: AutomationRun[];
  activityEvents: ActivityEvent[];
  notifications: NotificationItem[];
  users: Record<string, User>;

  // Derived Client Projection (Server/domain generated)
  clientProjection: ClientProjection;

  // Operations (One Work State Mutations)
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  createTask: (taskData: Partial<Task>) => Task;
  addComment: (
    targetType: Comment["targetType"],
    targetId: string,
    text: string,
    audience: EntityAudience
  ) => void;
  approveDeliverableAsClient: (deliverableId: string, feedback?: string) => void;
  requestDeliverableRevision: (deliverableId: string, feedback: string) => void;
  approveAIRecommendation: () => void;
  rejectAIRecommendation: (reason: string) => void;
  triggerAutomation: (automationId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markNotificationActioned: (notificationId: string) => void;
  resetToInitialDemo: () => void;
}

const WorkStateContext = createContext<WorkStateContextType | undefined>(undefined);

export function WorkStateProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: {
    id: string;
    email: string;
    name: string;
    role: PrincipalRole;
    jobTitle?: string | null;
  };
}) {
  // Active User / Persona (defaults to initialUser if provided, else Rohan - Manager)
  const [currentUserId, setCurrentUserId] = useState<string>(
    initialUser?.id || "user-rohan"
  );
  const [currentRole, setCurrentRole] = useState<PrincipalRole>(
    initialUser?.role || "MANAGER"
  );

  // Domain Entities
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [deliverables, setDeliverables] =
    useState<Record<string, Deliverable>>(INITIAL_DELIVERABLES);
  const [tasks, setTasks] = useState<Record<string, Task>>(INITIAL_TASKS);
  const [dependencies] = useState<Dependency[]>(INITIAL_DEPENDENCIES);
  const [milestones, setMilestones] = useState<Record<string, Milestone>>(INITIAL_MILESTONES);
  const [approvals, setApprovals] = useState<Record<string, Approval>>(INITIAL_APPROVALS);
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(INITIAL_CALENDAR_ITEMS);
  const [aiInsight, setAiInsight] = useState<AIInsight>(INITIAL_AI_INSIGHT);
  const [aiRecommendation, setAiRecommendation] =
    useState<AIRecommendation>(INITIAL_AI_RECOMMENDATION);
  const [automations, setAutomations] = useState<Automation[]>(INITIAL_AUTOMATIONS);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>(INITIAL_AUTOMATION_RUNS);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(INITIAL_ACTIVITY_EVENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [users] = useState<Record<string, User>>(INITIAL_USERS);

  const currentUser: User = useMemo(() => {
    if (initialUser) {
      return {
        id: initialUser.id,
        name: initialUser.name,
        email: initialUser.email,
        role: initialUser.role,
        jobTitle:
          initialUser.jobTitle ||
          (initialUser.role === "OWNER"
            ? "Founder & Head of Agency"
            : initialUser.role === "MANAGER"
              ? "Delivery Director"
              : "Team Member"),
        colorTone: 0,
        capacityWeeklyHours: 40,
        currentWorkloadHours: 35,
      };
    }
    return users[currentUserId] || INITIAL_USERS["user-rohan"];
  }, [initialUser, users, currentUserId]);

  // Set user and sync role
  const handleSetCurrentUserId = useCallback(
    (userId: string) => {
      setCurrentUserId(userId);
      if (users[userId]) {
        setCurrentRole(users[userId].role);
      }
    },
    [users]
  );

  // Recalculate Project Progress based on PRD Formula:
  // progress = sum(weight_d * factor(state_d)) / sum(weight_d)
  const recalculateProgress = useCallback(
    (currentDeliverables: Record<string, Deliverable>): number => {
      const factorMap: Record<string, number> = {
        PLANNED: 0.1,
        IN_PROGRESS: 0.5,
        INTERNAL_REVIEW: 0.7,
        REVISION_REQUIRED: 0.6,
        CLIENT_REVIEW: 0.8,
        APPROVED: 1.0,
        COMPLETED: 1.0,
        CANCELLED: 0.0,
      };

      let totalWeight = 0;
      let earned = 0;

      Object.values(currentDeliverables).forEach((del) => {
        const factor = factorMap[del.status] ?? 0.1;
        earned += del.weight * factor;
        totalWeight += del.weight;
      });

      if (totalWeight === 0) return 0;
      return Math.round((earned / totalWeight) * 100);
    },
    []
  );

  // Update Task Status
  const updateTaskStatus = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      setTasks((prev) => {
        const task = prev[taskId];
        if (!task) return prev;
        const updatedTask: Task = {
          ...task,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          version: task.version + 1,
        };

        // Record Activity Event
        const newEvent: ActivityEvent = {
          id: `evt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: {
            type: "HUMAN",
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.jobTitle,
          },
          entity: {
            type: "TASK",
            id: task.id,
            title: task.title,
          },
          action: "task.status_changed",
          before: { status: task.status },
          after: { status: newStatus },
          source: "WEB",
          visibility: task.audience,
          projectId: task.projectId,
        };

        setActivityEvents((evts) => [newEvent, ...evts]);

        return {
          ...prev,
          [taskId]: updatedTask,
        };
      });
    },
    [currentUser]
  );

  // Create Task
  const createTask = useCallback(
    (taskData: Partial<Task>): Task => {
      const newId = `task-${Date.now()}`;
      const newTask: Task = {
        id: newId,
        projectId: taskData.projectId || project.id,
        deliverableId: taskData.deliverableId || "del-landing",
        title: taskData.title || "Untitled Task",
        description: taskData.description || "",
        ownerId: taskData.ownerId || currentUser.id,
        assigneeId: taskData.assigneeId || currentUser.id,
        status: taskData.status || "NOT_STARTED",
        priority: taskData.priority || "P2",
        workstream: taskData.workstream || "WEB",
        estimateHours: taskData.estimateHours || 4,
        dueDate: taskData.dueDate || "2026-10-20",
        audience: taskData.audience || "INTERNAL",
        subtasks: taskData.subtasks || [],
        dependencyIds: taskData.dependencyIds || [],
        tags: taskData.tags || ["General"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      setTasks((prev) => ({ ...prev, [newId]: newTask }));

      // Append to Deliverable task list
      setDeliverables((prev) => {
        const del = prev[newTask.deliverableId];
        if (!del) return prev;
        return {
          ...prev,
          [newTask.deliverableId]: {
            ...del,
            taskIds: [...del.taskIds, newId],
            updatedAt: new Date().toISOString(),
          },
        };
      });

      // Record Event
      const newEvent: ActivityEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: {
          type: "HUMAN",
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.jobTitle,
        },
        entity: {
          type: "TASK",
          id: newTask.id,
          title: newTask.title,
        },
        action: "task.created",
        after: { title: newTask.title, status: newTask.status },
        source: "WEB",
        visibility: newTask.audience,
        projectId: newTask.projectId,
      };
      setActivityEvents((evts) => [newEvent, ...evts]);

      return newTask;
    },
    [currentUser, project.id]
  );

  // Add Comment
  const addComment = useCallback(
    (
      targetType: Comment["targetType"],
      targetId: string,
      text: string,
      audience: EntityAudience
    ) => {
      const newComment: Comment = {
        id: `comm-${Date.now()}`,
        projectId: project.id,
        targetType,
        targetId,
        authorId: currentUser.id,
        authorRole: currentUser.role,
        text,
        audience,
        createdAt: new Date().toISOString(),
      };

      setComments((prev) => [...prev, newComment]);

      const newEvent: ActivityEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: {
          type: currentRole === "CLIENT" ? "CLIENT" : "HUMAN",
          id: currentUser.id,
          name: currentUser.name,
        },
        entity: {
          type: "COMMENT",
          id: newComment.id,
          title: text.slice(0, 30) + (text.length > 30 ? "..." : ""),
        },
        action: "comment.created",
        source: currentRole === "CLIENT" ? "CLIENT_PORTAL" : "WEB",
        visibility: audience,
        projectId: project.id,
      };
      setActivityEvents((evts) => [newEvent, ...evts]);
    },
    [currentRole, currentUser, project.id]
  );

  // 🌟 Key PRD Workflow: Approve Deliverable as Client
  // Content Calendar approval moves deliverable to APPROVED, progress from 78% to 82%!
  const approveDeliverableAsClient = useCallback(
    (deliverableId: string, feedback?: string) => {
      const del = deliverables[deliverableId];
      if (!del) return;

      const updatedDeliverable: Deliverable = {
        ...del,
        status: "APPROVED",
        clientLabel: "Approved",
        progressPercent: 100,
        updatedAt: new Date().toISOString(),
      };

      const nextDeliverables = {
        ...deliverables,
        [deliverableId]: updatedDeliverable,
      };

      setDeliverables(nextDeliverables);

      // Calculate new progress (78% -> 82%)
      const newProgress = recalculateProgress(nextDeliverables);

      setProject((prev) => ({
        ...prev,
        progressPercent: newProgress,
        stateVersion: prev.stateVersion + 1,
        asOfTimestamp: new Date().toISOString(),
        healthReasons: [
          "Content Calendar approved by Acme Corp (Neha Sharma).",
          "Landing page and Launch Reel completed.",
          "Launch window scheduled for October 16.",
        ],
        updatedAt: new Date().toISOString(),
      }));

      // Update AI Insight to resolved
      setAiInsight((prev) => ({
        ...prev,
        status: "RESOLVED",
        statement: prev.resolvedStatement || "The launch window is now scheduled.",
      }));

      // Update approval entity
      if (del.currentApprovalId && approvals[del.currentApprovalId]) {
        setApprovals((prev) => ({
          ...prev,
          [del.currentApprovalId!]: {
            ...prev[del.currentApprovalId!],
            decision: "APPROVED",
            decidedById: INITIAL_CLIENT.id,
            decidedAt: new Date().toISOString(),
            feedback: feedback || "Approved via Acme Client Portal. Looks fantastic!",
          },
        }));
      }

      // Add Activity Event
      const newEvent: ActivityEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: {
          type: "CLIENT",
          id: INITIAL_CLIENT.id,
          name: INITIAL_CLIENT.name,
          role: `${INITIAL_CLIENT.roleTitle}, ${INITIAL_CLIENT.company}`,
        },
        entity: {
          type: "DELIVERABLE",
          id: del.id,
          title: del.title,
        },
        action: "deliverable.approved_by_client",
        before: { status: del.status, progress: project.progressPercent },
        after: { status: "APPROVED", progress: newProgress },
        source: "CLIENT_PORTAL",
        reason: feedback || "Approved in portal",
        visibility: "CLIENT_VISIBLE",
        projectId: project.id,
      };
      setActivityEvents((evts) => [newEvent, ...evts]);

      // Send Notification to Team
      const newNotification: NotificationItem = {
        id: `ntf-${Date.now()}`,
        recipientId: "user-aisha",
        priority: "N1_URGENT",
        title: "Content Calendar Approved by Client!",
        message: `Neha Sharma approved "${del.title}". Project progress advanced to ${newProgress}%.`,
        entityType: "DELIVERABLE",
        entityId: del.id,
        projectId: project.id,
        createdAt: new Date().toISOString(),
        isRead: false,
        source: "CLIENT",
        actionType: "VIEW",
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    [approvals, deliverables, project.id, project.progressPercent, recalculateProgress]
  );

  // Request Revision as Client
  const requestDeliverableRevision = useCallback(
    (deliverableId: string, feedback: string) => {
      const del = deliverables[deliverableId];
      if (!del) return;

      const updatedDeliverable: Deliverable = {
        ...del,
        status: "REVISION_REQUIRED",
        clientLabel: "Action Required",
        revisionCount: del.revisionCount + 1,
        updatedAt: new Date().toISOString(),
      };

      setDeliverables((prev) => ({
        ...prev,
        [deliverableId]: updatedDeliverable,
      }));

      // Record Activity
      const newEvent: ActivityEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: {
          type: "CLIENT",
          id: INITIAL_CLIENT.id,
          name: INITIAL_CLIENT.name,
          role: INITIAL_CLIENT.roleTitle,
        },
        entity: {
          type: "DELIVERABLE",
          id: del.id,
          title: del.title,
        },
        action: "deliverable.revision_requested",
        before: { status: del.status },
        after: { status: "REVISION_REQUIRED", revisionCount: del.revisionCount + 1 },
        source: "CLIENT_PORTAL",
        reason: feedback,
        visibility: "CLIENT_VISIBLE",
        projectId: project.id,
      };
      setActivityEvents((evts) => [newEvent, ...evts]);
    },
    [deliverables, project.id]
  );

  // 🌟 Key PRD Workflow: Approve AI Recommendation (AI -> Human Approves -> Governed Automation Executes)
  const approveAIRecommendation = useCallback(() => {
    if (aiRecommendation.status === "EXECUTED") return;

    // 1. Mark recommendation as approved & executing
    setAiRecommendation((prev) => ({
      ...prev,
      status: "EXECUTED",
      decisionBy: currentUser.id,
      decisionAt: new Date().toISOString(),
    }));

    // 2. Execute proposed action 1: Assign task to Aisha with P1
    setTasks((prev) => {
      const task = prev["task-soc-3"];
      if (!task) return prev;
      return {
        ...prev,
        "task-soc-3": {
          ...task,
          status: "IN_PROGRESS",
          priority: "P1",
          assigneeId: "user-aisha",
          updatedAt: new Date().toISOString(),
        },
      };
    });

    // 3. Execute proposed action 2: Reserve Publishing Calendar Window
    const newCalItem: CalendarItem = {
      id: `cal-publish-${Date.now()}`,
      projectId: project.id,
      title: "Social Campaign Publishing Window (P1)",
      kind: "PUBLISH_WINDOW",
      startDate: "2026-10-12",
      endDate: "2026-10-16",
      ownerId: "user-aisha",
      deliverableId: "del-calendar",
      clientVisible: true,
      source: "AUTOMATION",
    };
    setCalendarItems((prev) => [...prev, newCalItem]);

    // 4. Create Automation Run record
    const newRun: AutomationRun = {
      id: `run-${Date.now()}`,
      automationId: "auto-review-notify",
      automationName: "AI Action Plan: Bring Social Launch Forward",
      projectId: project.id,
      triggeredAt: new Date().toISOString(),
      triggeredBy: "AI",
      approvedById: currentUser.id,
      status: "SUCCEEDED",
      completedAt: new Date().toISOString(),
      stepsExecuted: [
        {
          stepName: "Assign Publishing Task to Aisha",
          status: "SUCCEEDED",
          details: "Task 'Reserve Publishing Window' assigned with priority P1.",
          timestamp: new Date().toISOString(),
        },
        {
          stepName: "Reserve Publishing Window in Calendar",
          status: "SUCCEEDED",
          details: "Calendar window reserved for Oct 12-16.",
          timestamp: new Date().toISOString(),
        },
      ],
      resultSummary: "Social launch brought forward; publishing window reserved.",
    };
    setAutomationRuns((prev) => [newRun, ...prev]);

    // 5. Create Activity Event with attribution (Actor = AUTOMATION, approved_by = Rohan)
    const newEvent: ActivityEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        type: "AUTOMATION",
        id: "engine-karyalaya",
        name: "KaryaLaya Automation Engine",
      },
      initiatedBy: "AI_RECOMMENDATION",
      approvedBy: `${currentUser.name} (${currentUser.role})`,
      entity: {
        type: "AUTOMATION",
        id: "rec-launch-timing",
        title: "Bring Social Launch Forward",
      },
      action: "automation.executed_action_plan",
      source: "AUTOMATION",
      reason: "Approved by Delivery Manager",
      visibility: "INTERNAL",
      projectId: project.id,
    };
    setActivityEvents((evts) => [newEvent, ...evts]);

    // 6. Update notification
    setNotifications((prev) =>
      prev.map((n) =>
        n.entityId === "rec-launch-timing" ? { ...n, isRead: true, isActioned: true } : n
      )
    );
  }, [aiRecommendation.status, currentUser, project.id]);

  // Reject AI Recommendation
  const rejectAIRecommendation = useCallback(
    (reason: string) => {
      setAiRecommendation((prev) => ({
        ...prev,
        status: "REJECTED",
        decisionBy: currentUser.id,
        decisionAt: new Date().toISOString(),
      }));

      const newEvent: ActivityEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: {
          type: "HUMAN",
          id: currentUser.id,
          name: currentUser.name,
        },
        entity: {
          type: "AI_INSIGHT",
          id: aiRecommendation.id,
          title: aiRecommendation.headline,
        },
        action: "recommendation.rejected",
        reason,
        source: "WEB",
        visibility: "INTERNAL",
        projectId: project.id,
      };
      setActivityEvents((evts) => [newEvent, ...evts]);
    },
    [aiRecommendation.headline, aiRecommendation.id, currentUser, project.id]
  );

  // Trigger Automation manually
  const triggerAutomation = useCallback(
    (automationId: string) => {
      const auto = automations.find((a) => a.id === automationId);
      if (!auto) return;

      const newRun: AutomationRun = {
        id: `run-${Date.now()}`,
        automationId: auto.id,
        automationName: auto.name,
        projectId: project.id,
        triggeredAt: new Date().toISOString(),
        triggeredBy: "HUMAN",
        approvedById: currentUser.id,
        status: "SUCCEEDED",
        completedAt: new Date().toISOString(),
        stepsExecuted: auto.steps.map((s) => ({
          stepName: s.name,
          status: "SUCCEEDED",
          details: `Simulated step execution on target: ${s.target}`,
          timestamp: new Date().toISOString(),
        })),
        resultSummary: `Executed ${auto.steps.length} steps cleanly.`,
      };

      setAutomationRuns((prev) => [newRun, ...prev]);

      setAutomations((prev) =>
        prev.map((a) =>
          a.id === automationId
            ? { ...a, lastRunAt: new Date().toISOString(), runCount: a.runCount + 1 }
            : a
        )
      );
    },
    [automations, currentUser.id, project.id]
  );

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  const markNotificationActioned = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, isActioned: true } : n))
    );
  }, []);

  // Reset to initial demo state
  const resetToInitialDemo = useCallback(() => {
    setProject(INITIAL_PROJECT);
    setDeliverables(INITIAL_DELIVERABLES);
    setTasks(INITIAL_TASKS);
    setMilestones(INITIAL_MILESTONES);
    setApprovals(INITIAL_APPROVALS);
    setComments(INITIAL_COMMENTS);
    setDocuments(INITIAL_DOCUMENTS);
    setCalendarItems(INITIAL_CALENDAR_ITEMS);
    setAiInsight(INITIAL_AI_INSIGHT);
    setAiRecommendation(INITIAL_AI_RECOMMENDATION);
    setAutomations(INITIAL_AUTOMATIONS);
    setAutomationRuns(INITIAL_AUTOMATION_RUNS);
    setActivityEvents(INITIAL_ACTIVITY_EVENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
  }, []);

  // 🌟 Derived Server/Domain-Generated Client Projection (§26)
  // Strictly redacts internal operational items, health scores, private comments, automations, and AI risk scores
  const clientProjection: ClientProjection = useMemo(() => {
    const clientDeliverables = Object.values(deliverables)
      .filter((d) => d.clientVisible)
      .map((d) => ({
        id: d.id,
        title: d.title,
        workstream: d.workstream,
        status: d.status,
        clientLabel: d.clientLabel,
        progressPercent: d.progressPercent,
        dueDate: d.dueDate,
        revisionRound: `${d.revisionCount} / ${d.revisionBudget}`,
        hasPendingApproval: d.status === "CLIENT_REVIEW",
        approvalId: d.currentApprovalId,
        latestVersionNumber:
          d.versions.length > 0 ? d.versions[d.versions.length - 1].versionNumber : 1,
      }));

    const clientMilestones = Object.values(milestones)
      .filter((m) => m.isClientVisible)
      .map((m) => ({
        id: m.id,
        title: m.title,
        targetDate: m.targetDate,
        isAchieved: m.isAchieved,
      }));

    const clientMessages = comments
      .filter((c) => c.audience === "CLIENT_VISIBLE")
      .map((c) => ({
        id: c.id,
        senderName:
          users[c.authorId]?.name ||
          (c.authorId === INITIAL_CLIENT.id ? INITIAL_CLIENT.name : "Team Member"),
        senderRole:
          users[c.authorId]?.jobTitle ||
          (c.authorId === INITIAL_CLIENT.id ? INITIAL_CLIENT.roleTitle : "Agency Staff"),
        text: c.text,
        createdAt: c.createdAt,
      }));

    const pendingApprovals = Object.values(deliverables)
      .filter((d) => d.status === "CLIENT_REVIEW")
      .map((d) => ({
        id: d.currentApprovalId || `appr-${d.id}`,
        deliverableId: d.id,
        deliverableTitle: d.title,
        versionNumber: d.versions.length > 0 ? d.versions[d.versions.length - 1].versionNumber : 1,
        submittedAt:
          d.versions.length > 0 ? d.versions[d.versions.length - 1].submittedAt : d.updatedAt,
        summary: d.description,
      }));

    const publishedFiles = [
      {
        id: "file-01",
        title: "Brand Growth Campaign Master Scope v2.pdf",
        size: "2.4 MB",
        updatedAt: "2026-10-02",
        downloadUrl: "#",
      },
      {
        id: "file-02",
        title: "Acme October 30-Day Content Distribution Schedule.xlsx",
        size: "1.1 MB",
        updatedAt: "2026-10-07",
        downloadUrl: "#",
      },
    ];

    return {
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
      progressPercent: project.progressPercent,
      healthSummary: "On Track for Global October 16 Launch",
      deliverables: clientDeliverables,
      milestones: clientMilestones,
      pendingApprovals,
      clientMessages,
      publishedFiles,
      asOfTimestamp: project.asOfTimestamp,
      projectionVersion: project.stateVersion,
    };
  }, [comments, deliverables, milestones, project, users]);

  const value = useMemo(
    () => ({
      currentUser,
      clientContact: INITIAL_CLIENT,
      currentRole,
      setCurrentRole,
      setCurrentUserId: handleSetCurrentUserId,
      project,
      deliverables,
      tasks,
      dependencies,
      milestones,
      approvals,
      comments,
      documents,
      calendarItems,
      aiInsight,
      aiRecommendation,
      automations,
      automationRuns,
      activityEvents,
      notifications,
      users,
      clientProjection,
      updateTaskStatus,
      createTask,
      addComment,
      approveDeliverableAsClient,
      requestDeliverableRevision,
      approveAIRecommendation,
      rejectAIRecommendation,
      triggerAutomation,
      markNotificationAsRead,
      markNotificationActioned,
      resetToInitialDemo,
    }),
    [
      currentUser,
      currentRole,
      handleSetCurrentUserId,
      project,
      deliverables,
      tasks,
      dependencies,
      milestones,
      approvals,
      comments,
      documents,
      calendarItems,
      aiInsight,
      aiRecommendation,
      automations,
      automationRuns,
      activityEvents,
      notifications,
      users,
      clientProjection,
      updateTaskStatus,
      createTask,
      addComment,
      approveDeliverableAsClient,
      requestDeliverableRevision,
      approveAIRecommendation,
      rejectAIRecommendation,
      triggerAutomation,
      markNotificationAsRead,
      markNotificationActioned,
      resetToInitialDemo,
    ]
  );

  return <WorkStateContext.Provider value={value}>{children}</WorkStateContext.Provider>;
}

export function useWorkState() {
  const context = useContext(WorkStateContext);
  if (!context) {
    throw new Error("useWorkState must be used within a WorkStateProvider");
  }
  return context;
}
