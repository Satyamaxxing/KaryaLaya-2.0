"use client";

import React, { useState, useEffect } from "react";

interface MemberWorkloadSummary {
  userId: string;
  name: string;
  role: string;
  openTasksCount: number;
  hoursThisWeek: number;
  isOnLeaveOnTargetDate: boolean;
  activeLeave?: {
    startDate: string;
    endDate: string;
    reason?: string | null;
  } | null;
  capacityRating: "AVAILABLE" | "HIGH_LOAD" | "ON_LEAVE";
  warningMessage?: string | null;
}

interface AssigneeWorkloadHelperProps {
  memberId?: string | null;
  targetDueDate?: string | null;
  className?: string;
}

export function AssigneeWorkloadHelper({
  memberId,
  targetDueDate,
  className = "",
}: AssigneeWorkloadHelperProps) {
  const [workload, setWorkload] = useState<MemberWorkloadSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!memberId) {
      return;
    }

    async function load() {
      try {
        const url = `/api/team/workload?memberId=${memberId}${
          targetDueDate ? `&targetDueDate=${encodeURIComponent(targetDueDate)}` : ""
        }`;
        const res = await fetch(url);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (active) setWorkload(data.workload);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [memberId, targetDueDate]);

  if (!memberId) return null;
  if (loading) {
    return <span className="text-[10px] text-zinc-500 font-mono">Assessing load...</span>;
  }
  if (!workload) return null;

  if (workload.capacityRating === "ON_LEAVE") {
    return (
      <div className={`p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-1.5 ${className}`}>
        <span>⚠️</span>
        <span className="font-medium text-[11px]">{workload.warningMessage || "Assignee is on leave during this target date."}</span>
      </div>
    );
  }

  if (workload.capacityRating === "HIGH_LOAD") {
    return (
      <div className={`p-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-1.5 ${className}`}>
        <span>⚠️</span>
        <span className="font-medium text-[11px]">{workload.warningMessage} ({workload.openTasksCount} active tasks, {workload.hoursThisWeek}h logged)</span>
      </div>
    );
  }

  return (
    <div className={`px-2 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center gap-1.5 ${className}`}>
      <span>✓</span>
      <span>Available capacity ({workload.openTasksCount} open tasks · {workload.hoursThisWeek}h)</span>
    </div>
  );
}
