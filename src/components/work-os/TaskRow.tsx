"use client";

import React, { useState } from "react";
import { Task, User, TaskStatus } from "@/types/work-os";
import { StatusBadge, PriorityBadge, AudiencePill } from "./Badges";

interface TaskRowProps {
  task: Task;
  assignee?: User;
  owner?: User;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  isClientView?: boolean;
}

export function TaskRow({
  task,
  assignee,
  owner,
  onStatusChange,
  isClientView = false,
}: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statuses: TaskStatus[] = [
    "NOT_STARTED",
    "IN_PROGRESS",
    "IN_REVIEW",
    "REVISION_REQUIRED",
    "APPROVED",
    "COMPLETED",
  ];

  const hasDependencies = task.dependencyIds.length > 0;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Status & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status Changer or Badge */}
          {onStatusChange && !isClientView ? (
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="text-[11px] bg-zinc-950 border border-zinc-700/80 rounded px-2 py-1 text-zinc-200 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          ) : (
            <StatusBadge status={task.status} />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white hover:text-sky-300 transition-colors truncate">
                {task.title}
              </span>

              {hasDependencies && (
                <span
                  title="Has prerequisite dependencies"
                  className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30 flex items-center gap-0.5"
                >
                  🔗 {task.dependencyIds.length} Blocker{task.dependencyIds.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
              <span className="font-mono text-sky-400">{task.workstream}</span>
              <span className="text-zinc-600">·</span>
              <span>Due {task.dueDate}</span>
              <span className="text-zinc-600">·</span>
              <span>{task.estimateHours}h est</span>
              {task.loggedHours !== undefined && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-300">{task.loggedHours}h logged</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Badges & People */}
        <div className="flex items-center gap-3 shrink-0">
          <PriorityBadge priority={task.priority} />

          {!isClientView && <AudiencePill audience={task.audience} />}

          {/* Assignee Avatar */}
          {assignee && (
            <div
              className="flex items-center gap-1.5"
              title={`Assigned to ${assignee.name} (Owner: ${owner?.name || "Self"})`}
            >
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white font-medium">
                {assignee.name.charAt(0)}
              </div>
              <span className="text-xs text-zinc-300 hidden md:inline">{assignee.name}</span>
            </div>
          )}

          {/* Expand subtasks button */}
          {task.subtasks.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
              title="Toggle Subtasks"
            >
              {isExpanded ? "▲" : "▼"} {task.subtasks.length}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Subtasks */}
      {isExpanded && task.subtasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1.5 pl-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Checklist / Subtasks:
          </div>
          {task.subtasks.map((st) => (
            <div key={st.id} className="flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={st.isCompleted}
                readOnly
                className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0 cursor-default"
              />
              <span className={st.isCompleted ? "line-through text-zinc-500" : ""}>{st.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
