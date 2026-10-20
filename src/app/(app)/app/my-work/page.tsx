"use client";

import React, { useState, useEffect } from "react";
import { TaskSidePanel, TaskDetailData } from "@/components/work-os/TaskSidePanel";

interface MyWorkResponse {
  all: TaskDetailData[];
  groups: {
    today: TaskDetailData[];
    thisWeek: TaskDetailData[];
    later: TaskDetailData[];
    waitingReview: TaskDetailData[];
  };
  counts: {
    total: number;
    today: number;
    thisWeek: number;
    later: number;
    waitingReview: number;
  };
}

export default function MyWorkPage() {
  const [data, setData] = useState<MyWorkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<"today" | "thisWeek" | "later" | "waitingReview">("today");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Side Panel state
  const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchMyWork = async () => {
    try {
      const res = await fetch("/api/my-work");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load My Work:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [workRes, meRes] = await Promise.all([
          fetch("/api/my-work"),
          fetch("/api/auth/me"),
        ]);
        if (!active) return;

        if (workRes.ok) {
          const json = await workRes.json();
          setData(json);
        }
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }
      } catch (err) {
        console.error("Failed to load My Work data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleQuickStatusChange = async (
    e: React.MouseEvent,
    taskId: string,
    currentStatus: string
  ) => {
    e.stopPropagation();
    const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchMyWork();
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleOpenSidePanel = (task: TaskDetailData) => {
    setSelectedTask(task);
    setIsPanelOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
        <div className="h-12 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const groups = data?.groups || {
    today: [],
    thisWeek: [],
    later: [],
    waitingReview: [],
  };

  const currentTasks = groups[activeGroup] || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Personal Work Execution Queue
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            My Work · {currentUser?.name || "Team Member"}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Role: <strong className="text-zinc-200">{currentUser?.role || "MEMBER"}</strong> ·
            Tasks assigned to you. Updating tasks automatically recalculates deliverable progress
            and agency health.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
            <span className="text-zinc-400 mr-2">Assigned:</span>
            <strong className="text-white text-sm">{data?.counts.total || 0}</strong>
          </div>
          <div className="px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
            <span className="text-zinc-400 mr-2">Today:</span>
            <strong className="text-emerald-400 text-sm">{data?.counts.today || 0}</strong>
          </div>
        </div>
      </div>

      {/* Group Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 overflow-x-auto pb-px">
        {[
          { key: "today", label: "Today & Overdue", count: data?.counts.today || 0 },
          { key: "thisWeek", label: "This Week", count: data?.counts.thisWeek || 0 },
          { key: "later", label: "Later", count: data?.counts.later || 0 },
          {
            key: "waitingReview",
            label: "Waiting on Review",
            count: data?.counts.waitingReview || 0,
          },
        ].map((tab) => {
          const isActive = activeGroup === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveGroup(tab.key as any)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? "border-emerald-500 text-white bg-zinc-900/60"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task Queue List */}
      {currentTasks.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-3">
          <div className="text-3xl">✨</div>
          <h3 className="text-base font-semibold text-white">All caught up in this queue</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {activeGroup === "today"
              ? "No tasks due today. Check your 'This Week' or 'Later' queues."
              : activeGroup === "waitingReview"
              ? "No tasks currently submitted for review."
              : "No upcoming tasks in this timeframe."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentTasks.map((task) => {
            const isDone = task.status === "DONE";
            const isRevision = Boolean(task.isRevisionRequested);
            const subtaskCount = task.subtasks?.length || 0;
            const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;

            return (
              <div
                key={task.id}
                onClick={() => handleOpenSidePanel(task)}
                className={`p-4 bg-zinc-900/80 hover:bg-zinc-900 border rounded-xl transition-all cursor-pointer shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  isRevision
                    ? "border-rose-500/60 bg-rose-950/20"
                    : isDone
                    ? "border-zinc-850 opacity-60 bg-zinc-950/40"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={(e) => handleQuickStatusChange(e as any, task.id, task.status)}
                    className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isRevision && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 flex items-center gap-1 font-bold">
                          <span>⚠️</span> REVISION REQUESTED
                        </span>
                      )}
                      {task.deliverable && (
                        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                          {task.deliverable.serviceType} · {task.deliverable.title}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        {task.project?.name}
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-semibold text-white group-hover:text-sky-300 transition-colors ${
                        isDone ? "line-through text-zinc-500" : ""
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.progressNote && (
                      <p className="text-[11px] text-zinc-400 italic">
                        Note: &ldquo;{task.progressNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  {subtaskCount > 0 && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      ✓ {completedSubtasks}/{subtaskCount}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                    <span>⏱</span>
                    <span>{task.loggedHours || 0}h</span>
                    {task.estimateHours && (
                      <span className="text-zinc-500">/{task.estimateHours}h</span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      task.priority === "HIGH" || task.priority === "URGENT"
                        ? "bg-rose-950 text-rose-300 border-rose-800/40"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {task.priority}
                  </span>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      isDone
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800/40"
                        : task.status === "IN_REVIEW"
                        ? "bg-amber-950 text-amber-300 border-amber-800/40"
                        : task.status === "IN_PROGRESS"
                        ? "bg-sky-950 text-sky-300 border-sky-800/40"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}
                  >
                    {task.status}
                  </span>

                  <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform text-xs">
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Side Panel */}
      <TaskSidePanel
        task={selectedTask}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={() => {
          fetchMyWork();
          // Update selectedTask local state if currently open
          if (selectedTask) {
            fetch(`/api/projects/${selectedTask.project?.id || ""}`)
              .then((r) => r.json())
              .then((data) => {
                const refreshed = data.project?.tasks?.find((t: any) => t.id === selectedTask.id);
                if (refreshed) setSelectedTask(refreshed);
              })
              .catch(() => {});
          }
        }}
        canEdit={true}
      />
    </div>
  );
}
