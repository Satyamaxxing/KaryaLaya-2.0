"use client";

import React, { useState, useEffect } from "react";
import { WeeklyAgencySummary } from "@/server/ai/types";

interface WeeklyAgencySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklyAgencySummaryModal({
  isOpen,
  onClose,
}: WeeklyAgencySummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<WeeklyAgencySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/weekly-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!active) return;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to generate weekly agency summary");
        }

        const data = await res.json();
        if (active && data.result?.data) {
          setSummary(data.result.data);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error generating summary");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 font-bold uppercase tracking-wider">
                🤖 Leadership Briefing
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Owner & Manager Digest</span>
            </div>
            <h2 className="text-base font-bold text-white">Weekly Agency Operations Summary</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{summary?.period || "Past 7 Days"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 font-mono text-xs">
                Aggregating finished milestones, stuck deliverables, and team workloads...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300">
              <span className="font-semibold block mb-1">Leadership summary unavailable</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && summary && (
            <>
              {/* SECTION 1: WHAT FINISHED THIS WEEK */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                    ✓ Finished This Week ({summary.finishedThisWeek.length})
                  </span>
                </div>
                {summary.finishedThisWeek.length === 0 ? (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 text-[11px]">
                    No deliverables or tasks marked complete in the last 7 days.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                    {summary.finishedThisWeek.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-white">{item.title}</span>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {item.projectName && `Project: ${item.projectName}`}
                            {item.clientName && ` · Client: ${item.clientName}`}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {item.completedAt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: WHAT IS STUCK OR AT RISK */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-400 tracking-wider">
                    ⚠️ Stuck or At Risk ({summary.stuckOrAtRisk.length})
                  </span>
                </div>
                {summary.stuckOrAtRisk.length === 0 ? (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <span>✓</span> All active deliverables are currently on schedule!
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                    {summary.stuckOrAtRisk.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-medium text-white">{item.title}</span>
                          <div className="text-[11px] text-rose-300">
                            Reason: {item.riskReason}
                            {item.delayDays && ` (${item.delayDays}d delayed)`}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                          NEEDS ATTENTION
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: WHO IS OVERLOADED OR ON LEAVE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider">
                    👥 Team Capacity & Overload ({summary.overloadedMembers.length})
                  </span>
                </div>
                {summary.overloadedMembers.length === 0 ? (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <span>✓</span> All team members have balanced workloads.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {summary.overloadedMembers.map((m) => (
                      <div
                        key={m.memberId}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{m.name}</span>
                          <div className="text-[11px] text-zinc-400">{m.warningReason}</div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                            m.capacityRating === "ON_LEAVE"
                              ? "bg-rose-950 text-rose-300 border border-rose-800/40"
                              : "bg-amber-950 text-amber-300 border border-amber-800/40"
                          }`}
                        >
                          {m.capacityRating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 4: RECOMMENDATIONS */}
              {summary.actionRecommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                    💡 High-Leverage Leadership Recommendations
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px]">
                    {summary.actionRecommendations.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
