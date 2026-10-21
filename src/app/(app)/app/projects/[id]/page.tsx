"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Phase3DeliverableCard,
  Phase3DeliverableData,
} from "@/components/work-os/Phase3DeliverableCard";
import {
  DeliverableStatus,
  ServiceType,
  SERVICE_TYPES,
} from "@/server/services/deliverable-state-machine";
import { TaskSidePanel, TaskDetailData } from "@/components/work-os/TaskSidePanel";
import { CommentThread } from "@/components/work-os/CommentThread";
import { FileAssetManager } from "@/components/work-os/FileAssetManager";
import { AssigneeWorkloadHelper } from "@/components/work-os/AssigneeWorkloadHelper";
import { ClientUpdateDraftModal } from "@/components/work-os/ClientUpdateDraftModal";

type ProjectTab = "overview" | "deliverables" | "tasks" | "files" | "discussion" | "activity";

interface ActivityItem {
  id: string;
  actorId: string;
  actorType: string;
  actorName?: string;
  action: string;
  entityType: string;
  description?: string;
  metadata?: string | null;
  createdAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  progressPercent?: number;
  health?: "ON_TRACK" | "AT_RISK" | string;
  startDate?: string | null;
  dueDate?: string | null;
  client: {
    id: string;
    name: string;
    companyName?: string | null;
    portalAccessEnabled: boolean;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  shareToken?: string | null;
  clientLastViewedAt?: string | null;
  deliverables: Phase3DeliverableData[];
  tasks: TaskDetailData[];
}

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
  const [currentUserRole, setCurrentUserRole] = useState<string>("OWNER");
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; name?: string } | null>(null);

  // Tasks view mode and task side panel
  const [tasksViewMode, setTasksViewMode] = useState<"list" | "board">("list");
  const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);
  const [isTaskSidePanelOpen, setIsTaskSidePanelOpen] = useState(false);

  // Activity events & filters
  const [activityEvents, setActivityEvents] = useState<ActivityItem[]>([]);
  const [activityActorFilter, setActivityActorFilter] = useState<string>("ALL");
  const [activityEntityFilter, setActivityEntityFilter] = useState<string>("ALL");
  const [loadingActivity, setLoadingActivity] = useState(false);

  // New Deliverable Modal
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [isClientUpdateModalOpen, setIsClientUpdateModalOpen] = useState(false);
  const [delivForm, setDelivForm] = useState({
    title: "",
    description: "",
    serviceType: "WEB_DEV" as ServiceType,
    dueDate: "",
    weight: 1.0,
  });
  const [delivErrors, setDelivErrors] = useState<{ [key: string]: string }>({});
  const [delivSubmitting, setDelivSubmitting] = useState(false);

  // New Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email?: string; role: string }>>([]);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    deliverableId: "",
    assigneeId: "",
    priority: "MEDIUM" as const,
    dueDate: "",
    estimateHours: "",
  });
  const [taskErrors, setTaskErrors] = useState<{ [key: string]: string }>({});
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Discussion state (UI mock for collaboration)
  const [comments, setComments] = useState<
    { id: string; author: string; text: string; time: string; audience: string }[]
  >([
    {
      id: "c1",
      author: "Rohan Varma",
      text: "Deliverables synchronized from the agency template blueprint. Ready for sprint kickoff.",
      time: "2 hours ago",
      audience: "INTERNAL",
    },
  ]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentAudience, setCommentAudience] = useState<"INTERNAL" | "CLIENT_VISIBLE">("INTERNAL");

  // Client Portal Share Link state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [clientLastViewedAt, setClientLastViewedAt] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const handleOpenShareModal = async () => {
    setIsShareModalOpen(true);
    setShareLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/share`);
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.shareUrl || "");
        setShareToken(data.shareToken || null);
        setClientLastViewedAt(data.clientLastViewedAt || null);
      }
    } catch {
      // ignore
    } finally {
      setShareLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setShareLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/share`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.shareUrl || "");
        setShareToken(data.shareToken || null);
        setClientLastViewedAt(data.clientLastViewedAt || null);
      }
    } catch {
      // ignore
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!confirm("Are you sure you want to revoke this share link? Anyone using this link will immediately lose access.")) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/share`, { method: "DELETE" });
      if (res.ok) {
        setShareUrl("");
        setShareToken(null);
      }
    } catch {
      // ignore
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Project not found or access denied.");
      const data = await res.json();
      setProject(data.project);
      if (selectedTask) {
        const refreshed = data.project.tasks?.find((t: TaskDetailData) => t.id === selectedTask.id);
        if (refreshed) setSelectedTask(refreshed);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const params = new URLSearchParams();
      params.set("projectId", id);
      if (activityActorFilter !== "ALL") params.set("actorType", activityActorFilter);
      if (activityEntityFilter !== "ALL") params.set("entityType", activityEntityFilter);

      const res = await fetch(`/api/activity?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setActivityEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadAll() {
      try {
        const [projRes, userRes, teamRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch("/api/auth/me"),
          fetch("/api/team"),
        ]);
        if (!active) return;

        if (projRes.ok) {
          const data = await projRes.json();
          setProject(data.project);
        } else {
          setError("Project not found or access denied.");
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            setCurrentUser(userData.user);
            setCurrentUserRole(userData.user.role);
          }
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          if (teamData?.members) {
            setTeamMembers(teamData.members.map((m: any) => m.user));
          }
        }

        await fetchActivity();
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load project");
      } finally {
        if (active) {
          setLoading(false);
          setLoadingActivity(false);
        }
      }
    }

    loadAll();

    // Setup live SSE stream for real-time collaboration updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/live?projectId=${id}`);
      eventSource.addEventListener("update", () => {
        if (active) {
          fetchProject();
          fetchActivity();
        }
      });
    } catch {
      // Fallback
    }

    // Secondary short poll fallback
    const pollInterval = setInterval(() => {
      if (active) {
        fetchActivity();
      }
    }, 5000);

    return () => {
      active = false;
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activityActorFilter, activityEntityFilter]);

  const canManageWork = currentUserRole === "OWNER" || currentUserRole === "MANAGER";
  const canEditSelectedTask =
    currentUserRole === "OWNER" ||
    currentUserRole === "MANAGER" ||
    (Boolean(currentUser?.id) &&
      (selectedTask?.assigneeId === currentUser?.id ||
        selectedTask?.assignee?.id === currentUser?.id));

  // Deliverable status transition
  const handleDeliverableStatusChange = async (
    deliverableId: string,
    nextStatus: DeliverableStatus
  ) => {
    const res = await fetch(`/api/deliverables/${deliverableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to transition status");
    }

    // Refresh project & activity
    fetchProject();
    fetchActivity();
  };

  // Create Deliverable
  const handleCreateDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!delivForm.title.trim()) errors.title = "Deliverable title is required.";

    if (Object.keys(errors).length > 0) {
      setDelivErrors(errors);
      return;
    }

    setDelivSubmitting(true);
    try {
      const res = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          title: delivForm.title.trim(),
          description: delivForm.description?.trim() || null,
          serviceType: delivForm.serviceType,
          dueDate: delivForm.dueDate ? new Date(delivForm.dueDate) : null,
          weight: Number(delivForm.weight) || 1.0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create deliverable");

      setIsDeliverableModalOpen(false);
      setDelivForm({
        title: "",
        description: "",
        serviceType: "WEB_DEV",
        dueDate: "",
        weight: 1.0,
      });
      fetchProject();
      fetchActivity();
    } catch (err: any) {
      alert(err.message || "Failed to create deliverable");
    } finally {
      setDelivSubmitting(false);
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!taskForm.title.trim()) errors.title = "Task title is required.";

    if (Object.keys(errors).length > 0) {
      setTaskErrors(errors);
      return;
    }

    setTaskSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          deliverableId: taskForm.deliverableId || null,
          assigneeId: taskForm.assigneeId || null,
          title: taskForm.title.trim(),
          description: taskForm.description?.trim() || null,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : null,
          estimateHours: taskForm.estimateHours ? parseFloat(taskForm.estimateHours) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      setIsTaskModalOpen(false);
      setTaskForm({
        title: "",
        description: "",
        deliverableId: "",
        assigneeId: "",
        priority: "MEDIUM",
        dueDate: "",
        estimateHours: "",
      });
      fetchProject();
      fetchActivity();
    } catch (err: any) {
      alert(err.message || "Failed to create task");
    } finally {
      setTaskSubmitting(false);
    }
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchProject();
        fetchActivity();
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  // Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchProject();
        fetchActivity();
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setComments([
      ...comments,
      {
        id: `c-${Date.now()}`,
        author: "You",
        text: newCommentText.trim(),
        time: "Just now",
        audience: commentAudience,
      },
    ]);
    setNewCommentText("");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
        <div className="h-12 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-56 rounded-xl bg-zinc-900/30 border border-zinc-800 animate-pulse" />
          <div className="h-56 rounded-xl bg-zinc-900/30 border border-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
        <div className="text-rose-400 text-lg">⚠️</div>
        <h2 className="text-lg font-bold text-white">Project Not Found</h2>
        <p className="text-xs text-zinc-400">{error || "Unable to retrieve project workspace."}</p>
        <Link
          href="/app/projects"
          className="inline-block px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
        >
          ← Return to Projects
        </Link>
      </div>
    );
  }

  // Derived metrics
  const totalDeliverables = project.deliverables.length;
  const completedDeliverables = project.deliverables.filter(
    (d) => d.status === "APPROVED" || d.status === "DELIVERED"
  ).length;
  const projectProgress =
    project.progressPercent !== undefined && project.progressPercent !== null
      ? project.progressPercent
      : totalDeliverables > 0
      ? Math.round(
          project.deliverables.reduce((acc, d) => acc + (d.progressPercent || 0), 0) /
            totalDeliverables
        )
      : 0;

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/app/projects" className="hover:text-zinc-300">
          Projects
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-medium">{project.name}</span>
      </div>

      {/* Project Banner Strip */}
      <div className="bg-zinc-900/90 border border-zinc-850 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/app/clients/${project.client.id}`}
                className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40 hover:border-sky-500 transition-colors"
              >
                Client: {project.client.name} ↗
              </Link>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                {project.status}
              </span>
              {project.health === "AT_RISK" ? (
                <span className="text-xs px-2.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800/60 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  AT RISK
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 font-mono font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ON TRACK
                </span>
              )}
              <span className="text-[11px] font-mono text-zinc-400">
                Lead: {project.owner.name}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 shrink-0 bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {projectProgress}%
              </div>
              <div className="text-[10px] uppercase font-mono text-zinc-400">Completion</div>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-right text-xs">
              <div className="font-bold text-white">
                {completedDeliverables} / {totalDeliverables} Done
              </div>
              <div className="text-[11px] text-zinc-400">
                {completedTasks} / {totalTasks} Tasks
              </div>
            </div>
          </div>
        </div>

        {/* Project Metadata Ribbon */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Target Launch:{" "}
              <strong className="text-white">
                {project.dueDate
                  ? new Date(project.dueDate).toLocaleDateString()
                  : "No date set"}
              </strong>
            </span>
            <span className="text-zinc-600">·</span>
            <span>
              Portal Status:{" "}
              <strong
                className={
                  project.client.portalAccessEnabled ? "text-emerald-400" : "text-zinc-400"
                }
              >
                {project.client.portalAccessEnabled ? "Live & Active" : "Disabled"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsClientUpdateModalOpen(true)}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Draft a friendly client progress update using real deliverables data"
            >
              <span>✨</span>
              <span>Draft Client Update</span>
            </button>
            <button
              type="button"
              onClick={handleOpenShareModal}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>🔗</span>
              <span>Share Portal Link</span>
            </button>
            <Link
              href={`/client/projects/${project.id}?preview=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Open the client portal view in read-only preview mode"
            >
              <span>👁</span>
              <span>Preview as client ↗</span>
            </Link>
            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
              Workspace ID: #{project.id.slice(-6)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto pb-px">
        {[
          { key: "overview", label: "Overview", count: null },
          { key: "deliverables", label: "Deliverables", count: totalDeliverables },
          { key: "tasks", label: "Tasks", count: totalTasks },
          { key: "files", label: "Files & Documents", count: null },
          { key: "discussion", label: "Discussion", count: comments.length },
          { key: "activity", label: "Activity Audit", count: activityEvents.length },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ProjectTab)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? "border-emerald-500 text-white bg-zinc-900/60"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ====================================================================
       * TAB 1: OVERVIEW
       * ==================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase">Deliverables</div>
              <div className="text-2xl font-bold text-white">
                {completedDeliverables} / {totalDeliverables}
              </div>
              <div className="text-xs text-zinc-400">Approved or Delivered Outcomes</div>
            </div>

            <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase">Workstreams</div>
              <div className="text-lg font-bold text-sky-400">
                {Array.from(new Set(project.deliverables.map((d) => d.serviceType))).join(", ") ||
                  "General"}
              </div>
              <div className="text-xs text-zinc-400">Cross-functional disciplines engaged</div>
            </div>

            <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
              <div className="text-xs font-mono text-zinc-400 uppercase">Team Tasks</div>
              <div className="text-2xl font-bold text-white">
                {completedTasks} / {totalTasks}
              </div>
              <div className="text-xs text-zinc-400">Executable tactical action items</div>
            </div>
          </div>

          {/* Quick Deliverables Preview Strip */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Key Project Deliverables
              </h2>
              <button
                onClick={() => setActiveTab("deliverables")}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                View all deliverables →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.deliverables.slice(0, 4).map((deliv) => (
                <Phase3DeliverableCard
                  key={deliv.id}
                  deliverable={deliv}
                  canManage={canManageWork}
                  onStatusChange={handleDeliverableStatusChange}
                  onTasksCreated={fetchProject}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * TAB 2: DELIVERABLES (Full CRUD + State Machine)
       * ==================================================================== */}
      {activeTab === "deliverables" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white">Project Deliverables</h2>
              <p className="text-xs text-zinc-400">
                Core client outcomes, service disciplines, and review gating pipeline.
              </p>
            </div>

            {canManageWork && (
              <button
                onClick={() => {
                  setDelivErrors({});
                  setIsDeliverableModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg shadow-sm"
              >
                + New Deliverable
              </button>
            )}
          </div>

          {project.deliverables.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-3">
              <div className="text-2xl">📦</div>
              <h3 className="text-sm font-semibold text-white">No deliverables in this project</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Add deliverables for web development, video, social media, branding, or design.
              </p>
              {canManageWork && (
                <button
                  onClick={() => setIsDeliverableModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg"
                >
                  + Add First Deliverable
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.deliverables.map((deliv) => (
                <Phase3DeliverableCard
                  key={deliv.id}
                  deliverable={deliv}
                  canManage={canManageWork}
                  onStatusChange={handleDeliverableStatusChange}
                  onTasksCreated={fetchProject}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
       * TAB 3: TASKS (List + Board View Toggle)
       * ==================================================================== */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white">Tactical Tasks</h2>
              <p className="text-xs text-zinc-400">
                Execution backlog linked to deliverables. Manage team work items across list and board views.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Switcher: List vs Board */}
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTasksViewMode("list")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    tasksViewMode === "list"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>☰</span> List
                </button>
                <button
                  type="button"
                  onClick={() => setTasksViewMode("board")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    tasksViewMode === "board"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>☷</span> Board
                </button>
              </div>

              <button
                onClick={() => {
                  setTaskErrors({});
                  setIsTaskModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg shadow-sm"
              >
                + Add Task
              </button>
            </div>
          </div>

          {project.tasks.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-3">
              <div className="text-2xl">⚡</div>
              <h3 className="text-sm font-semibold text-white">No tasks created yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Break deliverables into bite-sized actionable tasks for developers, editors, and designers.
              </p>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg"
              >
                + Create Task
              </button>
            </div>
          ) : tasksViewMode === "list" ? (
            /* ==================== LIST VIEW ==================== */
            <div className="space-y-2">
              {project.tasks.map((task) => {
                const isDone = task.status === "DONE";
                const isBlocked = task.blockedBy?.some(
                  (b) => b.blockingTask && b.blockingTask.status !== "DONE"
                );
                const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
                const totalSubtasks = task.subtasks?.length || 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsTaskSidePanelOpen(true);
                    }}
                    className={`p-3.5 bg-zinc-900/80 border rounded-xl flex items-center justify-between gap-4 transition-all cursor-pointer ${
                      isDone
                        ? "border-zinc-850 opacity-60 bg-zinc-950/40"
                        : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleToggleTaskStatus(task.id, task.status)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-medium text-white truncate ${
                              isDone ? "line-through text-zinc-500" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.isRevisionRequested && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-semibold">
                              Revision Requested
                            </span>
                          )}
                          {isBlocked && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                              Blocked
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                          {task.deliverable && (
                            <span>
                              Deliverable: {task.deliverable.title} ({task.deliverable.serviceType})
                            </span>
                          )}
                          {totalSubtasks > 0 && (
                            <span className="font-mono">
                              ☑ {completedSubtasks}/{totalSubtasks}
                            </span>
                          )}
                          {(task.loggedHours !== undefined && task.loggedHours !== null || task.estimateHours) && (
                            <span className="font-mono">
                              ⏱ {task.loggedHours || 0}h
                              {task.estimateHours ? ` / ${task.estimateHours}h` : ""}
                            </span>
                          )}
                          {task.dueDate && (
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-zinc-400 hidden sm:inline">
                        {task.assignee ? `@${task.assignee.name}` : "Unassigned"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          task.priority === "HIGH" || task.priority === "URGENT"
                            ? "bg-rose-950 text-rose-300 border-rose-800/40"
                            : task.priority === "MEDIUM"
                            ? "bg-amber-950 text-amber-300 border-amber-800/40"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        className={`text-[10px] font-mono px-2 py-1 rounded bg-zinc-950 border border-zinc-800 focus:outline-none cursor-pointer ${
                          isDone ? "text-emerald-400" : "text-zinc-300"
                        }`}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ==================== BOARD (KANBAN) VIEW ==================== */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
              {[
                { status: "TODO" as const, label: "To Do", dotColor: "bg-zinc-400", borderColor: "border-zinc-800" },
                { status: "IN_PROGRESS" as const, label: "In Progress", dotColor: "bg-sky-400", borderColor: "border-sky-900/40" },
                { status: "IN_REVIEW" as const, label: "In Review", dotColor: "bg-purple-400", borderColor: "border-purple-900/40" },
                { status: "DONE" as const, label: "Done", dotColor: "bg-emerald-400", borderColor: "border-emerald-900/40" },
              ].map((column) => {
                const columnTasks = project.tasks.filter((t) => t.status === column.status);

                return (
                  <div
                    key={column.status}
                    className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3 space-y-3 min-h-[300px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          {column.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div className="space-y-2.5">
                      {columnTasks.length === 0 ? (
                        <div className="py-12 text-center text-[11px] text-zinc-600 font-mono">
                          No tasks
                        </div>
                      ) : (
                        columnTasks.map((task) => {
                          const isBlocked = task.blockedBy?.some(
                            (b) => b.blockingTask && b.blockingTask.status !== "DONE"
                          );
                          const completedSubtasks =
                            task.subtasks?.filter((s) => s.isCompleted).length || 0;
                          const totalSubtasks = task.subtasks?.length || 0;

                          return (
                            <div
                              key={task.id}
                              onClick={() => {
                                setSelectedTask(task);
                                setIsTaskSidePanelOpen(true);
                              }}
                              className="p-3 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-xl shadow-sm cursor-pointer space-y-2.5 transition-all group"
                            >
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                    task.priority === "HIGH" || task.priority === "URGENT"
                                      ? "bg-rose-950 text-rose-300 border-rose-800/40"
                                      : task.priority === "MEDIUM"
                                      ? "bg-amber-950 text-amber-300 border-amber-800/40"
                                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                                  }`}
                                >
                                  {task.priority}
                                </span>
                                {task.isRevisionRequested && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-semibold">
                                    Revision
                                  </span>
                                )}
                                {isBlocked && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                                    Blocked
                                  </span>
                                )}
                              </div>

                              <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors line-clamp-2">
                                {task.title}
                              </div>

                              {task.deliverable && (
                                <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                                  <span>📦</span>
                                  <span>{task.deliverable.title}</span>
                                </div>
                              )}

                              {task.progressNote && (
                                <div className="text-[11px] text-zinc-400 italic bg-zinc-950/60 p-1.5 rounded border border-zinc-850 line-clamp-2">
                                  &ldquo;{task.progressNote}&rdquo;
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-[10px] text-zinc-500">
                                <span>
                                  {task.assignee ? `@${task.assignee.name.split(" ")[0]}` : "Unassigned"}
                                </span>
                                <div className="flex items-center gap-2">
                                  {totalSubtasks > 0 && (
                                    <span className="font-mono">
                                      ☑ {completedSubtasks}/{totalSubtasks}
                                    </span>
                                  )}
                                  {(task.loggedHours !== undefined && task.loggedHours !== null || task.estimateHours) && (
                                    <span className="font-mono text-zinc-400">
                                      ⏱ {task.loggedHours || 0}h{task.estimateHours ? `/${task.estimateHours}h` : ""}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quick Move Selector */}
                              <div className="pt-1.5 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500">
                                <span>Move to:</span>
                                <select
                                  value={task.status}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none"
                                >
                                  <option value="TODO">To Do</option>
                                  <option value="IN_PROGRESS">In Progress</option>
                                  <option value="IN_REVIEW">In Review</option>
                                  <option value="DONE">Done</option>
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
       * TAB 4: FILES & DOCUMENTS
       * ==================================================================== */}
      {activeTab === "files" && (
        <FileAssetManager
          projectId={project.id}
          deliverables={project.deliverables}
          canUpload={true}
          canManageVisibility={canManageWork}
        />
      )}

      {/* ====================================================================
       * TAB 5: DISCUSSION
       * ==================================================================== */}
      {activeTab === "discussion" && (
        <div className="max-w-3xl">
          <CommentThread
            projectId={project.id}
            title={`${project.name} Discussion`}
            canPost={true}
          />
        </div>
      )}

      {/* ====================================================================
       * TAB 6: ACTIVITY AUDIT (ActivityEvents)
       * ==================================================================== */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Project Activity & Audit Trail</h2>
              <p className="text-xs text-zinc-400">
                Immutable, append-only activity feed rendering plain-language event records.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <select
                value={activityActorFilter}
                onChange={(e) => setActivityActorFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none"
              >
                <option value="ALL">All Actors</option>
                <option value="INTERNAL">Internal Team</option>
                <option value="CLIENT">Client Portal</option>
              </select>

              <select
                value={activityEntityFilter}
                onChange={(e) => setActivityEntityFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none"
              >
                <option value="ALL">All Entities</option>
                <option value="PROJECT">Projects</option>
                <option value="DELIVERABLE">Deliverables</option>
                <option value="TASK">Tasks</option>
                <option value="FILE">Files</option>
                <option value="COMMENT">Comments</option>
              </select>
            </div>
          </div>

          {loadingActivity ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-zinc-900/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activityEvents.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl space-y-2">
              <div className="text-zinc-500 text-xl">📜</div>
              <div className="text-xs font-semibold text-white">No activity matching filters</div>
              <p className="text-[11px] text-zinc-400">
                Mutations and state changes will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityEvents.map((evt) => {
                let parsedMeta: any = null;
                try {
                  if (evt.metadata) parsedMeta = JSON.parse(evt.metadata);
                } catch (_) {}

                return (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          evt.actorType === "CLIENT" ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-white leading-snug">
                          {evt.description || evt.action.replace(/_/g, " ")}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{evt.entityType}</span>
                          <span>·</span>
                          <span
                            className={`font-mono px-1.5 py-0.2 rounded text-[10px] ${
                              evt.actorType === "CLIENT"
                                ? "bg-amber-950 text-amber-300"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {evt.actorType}
                          </span>
                          {parsedMeta?.before && parsedMeta?.after && (
                            <>
                              <span>·</span>
                              <span className="text-zinc-300">
                                {parsedMeta.before} → {parsedMeta.after}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500 flex-shrink-0">
                      {new Date(evt.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
       * MODAL: CREATE DELIVERABLE
       * ==================================================================== */}
      {isDeliverableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">New Project Deliverable</h3>
                <p className="text-xs text-zinc-400">
                  Define a client deliverable outcome and assign service discipline.
                </p>
              </div>
              <button
                onClick={() => setIsDeliverableModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Deliverable Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interactive Prototype & UX Audit"
                  value={delivForm.title}
                  onChange={(e) => {
                    setDelivForm({ ...delivForm, title: e.target.value });
                    if (delivErrors.title) setDelivErrors({ ...delivErrors, title: "" });
                  }}
                  className={`w-full px-3.5 py-2 text-xs bg-zinc-950 border rounded-lg text-white focus:outline-none ${
                    delivErrors.title
                      ? "border-rose-500"
                      : "border-zinc-800 focus:border-sky-500"
                  }`}
                />
                {delivErrors.title && (
                  <p className="text-[11px] text-rose-400 mt-1">{delivErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Service Discipline / Type *
                </label>
                <select
                  value={delivForm.serviceType}
                  onChange={(e) =>
                    setDelivForm({ ...delivForm, serviceType: e.target.value as ServiceType })
                  }
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                >
                  {SERVICE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Scope Description
                </label>
                <textarea
                  rows={2}
                  value={delivForm.description}
                  onChange={(e) => setDelivForm({ ...delivForm, description: e.target.value })}
                  placeholder="Summary of outcome specifications..."
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Progress Weight (x)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="5.0"
                    value={delivForm.weight}
                    onChange={(e) =>
                      setDelivForm({ ...delivForm, weight: parseFloat(e.target.value) || 1.0 })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={delivForm.dueDate}
                    onChange={(e) => setDelivForm({ ...delivForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDeliverableModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={delivSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {delivSubmitting ? "Creating..." : "Create Deliverable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
       * MODAL: CREATE TASK
       * ==================================================================== */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Add Task</h3>
                <p className="text-xs text-zinc-400">
                  Assign a tactical action item to a project deliverable.
                </p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Set up DNS records and SSL certs"
                  value={taskForm.title}
                  onChange={(e) => {
                    setTaskForm({ ...taskForm, title: e.target.value });
                    if (taskErrors.title) setTaskErrors({ ...taskErrors, title: "" });
                  }}
                  className={`w-full px-3.5 py-2 text-xs bg-zinc-950 border rounded-lg text-white focus:outline-none ${
                    taskErrors.title
                      ? "border-rose-500"
                      : "border-zinc-800 focus:border-sky-500"
                  }`}
                />
                {taskErrors.title && (
                  <p className="text-[11px] text-rose-400 mt-1">{taskErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description / Specification
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context, links, or expectations..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Link to Deliverable
                </label>
                <select
                  value={taskForm.deliverableId}
                  onChange={(e) => setTaskForm({ ...taskForm, deliverableId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                >
                  <option value="">General Project Task (No Deliverable)</option>
                  {project.deliverables.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.serviceType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Assignee & Workload
                  </label>
                  {taskForm.assigneeId && (
                    <span className="text-[10px] text-zinc-500 font-mono">Live capacity check</span>
                  )}
                </div>
                <select
                  value={taskForm.assigneeId}
                  onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                >
                  <option value="">Unassigned (Open task)</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.email} ({m.role})
                    </option>
                  ))}
                </select>
                {taskForm.assigneeId && (
                  <div className="mt-2">
                    <AssigneeWorkloadHelper
                      memberId={taskForm.assigneeId}
                      targetDueDate={taskForm.dueDate || null}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Estimate (Hrs)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 4.5"
                    value={taskForm.estimateHours}
                    onChange={(e) => setTaskForm({ ...taskForm, estimateHours: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {taskSubmitting ? "Saving..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
       * CLIENT SHARE LINK MODAL
       * ==================================================================== */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🔗</span> Client Portal Share Link
                </h3>
                <p className="text-xs text-zinc-400">
                  Allow client contacts to view scoped deliverables, files, and sign off on work.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {shareLoading ? (
              <div className="p-6 text-center text-xs text-zinc-400">Loading share link...</div>
            ) : shareUrl ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-zinc-400 uppercase">Shareable Portal URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-xl shrink-0 transition-all"
                    >
                      {copiedLink ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 border border-zinc-850 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Client Last Viewed:</span>
                    <span className="font-mono text-white">
                      {clientLastViewedAt
                        ? new Date(clientLastViewedAt).toLocaleString()
                        : "Not yet viewed by client"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Access Scope:</span>
                    <span className="font-mono text-emerald-400">Client-Visible Only</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleRevokeShareLink}
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Revoke Share Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-4 py-2 text-xs text-zinc-300 hover:text-white bg-zinc-800 rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <p className="text-xs text-zinc-400">
                  No active share link exists for this project. Generate one to give your client direct portal access.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateShareLink}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Generate Share Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
       * TASK DETAIL SIDE PANEL
       * ==================================================================== */}
      <TaskSidePanel
        task={selectedTask}
        isOpen={isTaskSidePanelOpen}
        onClose={() => setIsTaskSidePanelOpen(false)}
        onTaskUpdated={() => {
          fetchProject();
          fetchActivity();
        }}
        canEdit={canEditSelectedTask}
      />

      {/* AI Client Update Draft Modal */}
      <ClientUpdateDraftModal
        projectId={project.id}
        projectName={project.name}
        isOpen={isClientUpdateModalOpen}
        onClose={() => setIsClientUpdateModalOpen(false)}
        onPostAsComment={async (text) => {
          setComments((prev) => [
            ...prev,
            {
              id: `c-${Date.now()}`,
              author: "You",
              text,
              time: "Just now",
              audience: "CLIENT",
            },
          ]);
        }}
      />
    </div>
  );
}
