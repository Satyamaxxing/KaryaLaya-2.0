"use client";

import React from "react";
import { Dependency, Task, Deliverable, User } from "@/types/work-os";
import { StatusBadge } from "./Badges";

interface DependencyGraphViewProps {
  dependencies: Dependency[];
  tasks: Record<string, Task>;
  deliverables: Record<string, Deliverable>;
  users: Record<string, User>;
}

export function DependencyGraphView({
  dependencies,
  tasks,
  deliverables,
  users,
}: DependencyGraphViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Critical Path & Dependencies Graph</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Directed Acyclic Graph (DAG) governing sequencing, review gates, and milestone
            forecasts.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-mono">
          {dependencies.length} Active Edges
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {dependencies.map((dep, idx) => {
          const predTask = tasks[dep.predecessorTaskId];
          const succTask = tasks[dep.successorTaskId];
          const predOwner = predTask ? users[predTask.assigneeId] : null;
          const succOwner = succTask ? users[succTask.assigneeId] : null;
          const predDel = predTask ? deliverables[predTask.deliverableId] : null;
          const succDel = succTask ? deliverables[succTask.deliverableId] : null;

          const isBlocking = predTask?.status !== "COMPLETED" && predTask?.status !== "APPROVED";

          return (
            <div
              key={dep.id || idx}
              className={`p-4 rounded-xl border transition-all ${
                isBlocking
                  ? "bg-gradient-to-r from-amber-950/20 via-zinc-900 to-zinc-900 border-amber-500/40"
                  : "bg-zinc-900/70 border-zinc-800"
              }`}
            >
              {/* Top status indicator */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      dep.kind === "HARD"
                        ? "bg-rose-950 text-rose-300 border border-rose-600/40"
                        : "bg-blue-950 text-blue-300 border border-blue-600/40"
                    }`}
                  >
                    {dep.kind} BLOCKER
                  </span>
                  <span className="text-zinc-400 font-medium">Edge #{idx + 1}</span>
                </div>

                {isBlocking ? (
                  <span className="text-amber-400 font-medium flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Currently Blocking Downstream Work
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    ✓ Predecessor Satisfied
                  </span>
                )}
              </div>

              {/* Connected Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center relative">
                {/* Predecessor Box (WHO IS BLOCKING) */}
                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-1.5">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Predecessor (Prerequisite)
                  </div>
                  <div className="font-medium text-sm text-white">
                    {predTask?.title || dep.predecessorTaskId}
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span>
                      Owner:{" "}
                      <strong className="text-zinc-200">{predOwner?.name || "Unassigned"}</strong>
                    </span>
                    {predTask && <StatusBadge status={predTask.status} />}
                  </div>
                  {predDel && (
                    <div className="text-[11px] text-sky-400">Deliverable: {predDel.title}</div>
                  )}
                </div>

                {/* Successor Box (WHAT IS BLOCKED) */}
                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-1.5">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Successor (Blocked Task)
                  </div>
                  <div className="font-medium text-sm text-white">
                    {succTask?.title || dep.successorTaskId}
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span>
                      Assignee:{" "}
                      <strong className="text-zinc-200">{succOwner?.name || "Unassigned"}</strong>
                    </span>
                    {succTask && <StatusBadge status={succTask.status} />}
                  </div>
                  {succDel && (
                    <div className="text-[11px] text-sky-400">Deliverable: {succDel.title}</div>
                  )}
                </div>
              </div>

              {/* Explanation (WHY IT MATTERS & DOWNSTREAM IMPACT) */}
              <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 text-zinc-300">
                <div>
                  <span className="font-semibold text-zinc-200">Why it matters:</span> {dep.reason}
                </div>
                {dep.impactDescription && (
                  <div className="text-amber-300/90 shrink-0 font-medium">
                    ⚡ {dep.impactDescription}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
