"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AgencyAnalyticsData } from "@/server/services/analytics";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [data, setData] = useState<AgencyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetricTab, setSelectedMetricTab] = useState<
    "onTime" | "turnaround" | "revisions" | "throughput" | "workload" | "clients"
  >("onTime");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics?timeRange=${timeRange}`);
        if (!active) return;
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to load analytics");
        }
        const json = await res.json();
        if (active) setData(json.data);
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load analytics");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 rounded-xl bg-zinc-900/50 border border-zinc-800" />
          <div className="h-32 rounded-xl bg-zinc-900/50 border border-zinc-800" />
          <div className="h-32 rounded-xl bg-zinc-900/50 border border-zinc-800" />
          <div className="h-32 rounded-xl bg-zinc-900/50 border border-zinc-800" />
        </div>
        <div className="h-72 rounded-xl bg-zinc-900/40 border border-zinc-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-zinc-900/70 border border-rose-900/50 rounded-2xl space-y-4 max-w-lg mx-auto my-12">
        <div className="text-3xl">⚠️</div>
        <h2 className="text-lg font-bold text-white">Analytics Restricted</h2>
        <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
        <Link
          href="/app/dashboard"
          className="inline-block px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
        >
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header Ribbon */}
      <div className="bg-zinc-900/90 border border-zinc-850 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-bold uppercase tracking-wider">
                📊 Operational Telemetry
              </span>
              <span className="text-xs font-mono text-zinc-400">
                OWNER / MANAGER Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Agency Delivery Analytics
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strictly computed from immutable activity logs, milestone sign-offs, and real client turnaround.
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
            {(["7d", "30d", "90d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {range === "7d"
                  ? "7 Days"
                  : range === "30d"
                  ? "30 Days"
                  : range === "90d"
                  ? "90 Days"
                  : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Headline Cards (Click to Drill Down) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: On-Time Delivery Rate */}
        <div
          onClick={() => setSelectedMetricTab("onTime")}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedMetricTab === "onTime"
              ? "bg-zinc-850 border-emerald-500/60 shadow-lg shadow-emerald-950/30"
              : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-mono uppercase text-[11px]">On-Time Delivery</span>
            <span className="text-[10px] text-zinc-500 font-mono">Target: &gt;90%</span>
          </div>
          {data.onTimeDelivery.hasData && data.onTimeDelivery.value ? (
            <div>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {data.onTimeDelivery.value.ratePercent}%
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {data.onTimeDelivery.value.onTimeCount} of {data.onTimeDelivery.value.totalCompletedWithDueDate} met deadline
              </div>
            </div>
          ) : (
            <div className="py-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                Insufficient Data
              </span>
              <p className="text-[11px] text-zinc-500 mt-1.5 line-clamp-1">
                {data.onTimeDelivery.insufficientReason}
              </p>
            </div>
          )}
        </div>

        {/* KPI 2: Approval Turnaround */}
        <div
          onClick={() => setSelectedMetricTab("turnaround")}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedMetricTab === "turnaround"
              ? "bg-zinc-850 border-sky-500/60 shadow-lg shadow-sky-950/30"
              : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-mono uppercase text-[11px]">Client Turnaround</span>
            <span className="text-[10px] text-zinc-500 font-mono">Target: &lt;2.0d</span>
          </div>
          {data.approvalTurnaround.hasData && data.approvalTurnaround.value ? (
            <div>
              <div className="text-3xl font-bold font-mono text-sky-400">
                {data.approvalTurnaround.value.averageDays} Days
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Avg {data.approvalTurnaround.value.averageHours} hrs across {data.approvalTurnaround.value.totalApprovalsAnalyzed} approvals
              </div>
            </div>
          ) : (
            <div className="py-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                Insufficient Data
              </span>
              <p className="text-[11px] text-zinc-500 mt-1.5 line-clamp-1">
                {data.approvalTurnaround.insufficientReason}
              </p>
            </div>
          )}
        </div>

        {/* KPI 3: Revision Cycles */}
        <div
          onClick={() => setSelectedMetricTab("revisions")}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedMetricTab === "revisions"
              ? "bg-zinc-850 border-amber-500/60 shadow-lg shadow-amber-950/30"
              : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-mono uppercase text-[11px]">Revision Frequency</span>
            <span className="text-[10px] text-zinc-500 font-mono">Target: &lt;1.5</span>
          </div>
          {data.revisions.hasData && data.revisions.value ? (
            <div>
              <div className="text-3xl font-bold font-mono text-amber-400">
                {data.revisions.value.averageRevisionsPerDeliverable}x
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {data.revisions.value.totalRevisionsRequested} total revision requests in period
              </div>
            </div>
          ) : (
            <div className="py-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                Insufficient Data
              </span>
              <p className="text-[11px] text-zinc-500 mt-1.5 line-clamp-1">
                {data.revisions.insufficientReason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Metric Detail Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto text-xs font-mono">
        {[
          { key: "onTime", label: "On-Time Deliverables" },
          { key: "turnaround", label: "Client Approvals" },
          { key: "revisions", label: "Revision Cycles" },
          { key: "throughput", label: "Weekly Throughput" },
          { key: "workload", label: "Team Workload" },
          { key: "clients", label: "Per-Client Overview" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedMetricTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedMetricTab === tab.key
                ? "bg-zinc-800 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metric Content Section with Direct Item Links */}
      <section>
        {/* ===================================================================
         * DETAIL 1: ON-TIME DELIVERY RATE
         * =================================================================== */}
        {selectedMetricTab === "onTime" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">
              Deliverables Delivery Timing & Schedule Variance
            </h2>

            {!data.onTimeDelivery.hasData ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-2">
                <div className="text-2xl">⏳</div>
                <h3 className="text-sm font-semibold text-white">Insufficient Data</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {data.onTimeDelivery.insufficientReason}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Deliverable</th>
                      <th className="py-3 px-4">Client / Project</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Delivered At</th>
                      <th className="py-3 px-4 text-right">Schedule Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.onTimeDelivery.value?.items.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-850/50 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={item.linkUrl}
                            className="font-medium text-white hover:text-sky-300 transition-colors block"
                          >
                            {item.title} ↗
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {item.clientName} · <span className="text-zinc-500">{item.projectName}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isOnTime
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                                : "bg-rose-950 text-rose-300 border border-rose-800/40"
                            }`}
                          >
                            {item.isOnTime
                              ? item.daysDelta >= 0
                                ? `On Time (${item.daysDelta}d early)`
                                : "On Time"
                              : `Late (${Math.abs(item.daysDelta)}d delay)`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
         * DETAIL 2: APPROVAL TURNAROUND
         * =================================================================== */}
        {selectedMetricTab === "turnaround" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">
              Client Review Window & Decision Latency
            </h2>

            {!data.approvalTurnaround.hasData ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-2">
                <div className="text-2xl">⏳</div>
                <h3 className="text-sm font-semibold text-white">Insufficient Data</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {data.approvalTurnaround.insufficientReason}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Deliverable</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Sent for Review</th>
                      <th className="py-3 px-4">Approved At</th>
                      <th className="py-3 px-4 text-right">Turnaround Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.approvalTurnaround.value?.items.map((item) => (
                      <tr key={item.deliverableId} className="hover:bg-zinc-850/50 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={item.linkUrl}
                            className="font-medium text-white hover:text-sky-300 transition-colors block"
                          >
                            {item.deliverableTitle} ↗
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {item.clientName}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {new Date(item.sentAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {new Date(item.approvedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sky-400">
                          {item.turnaroundDays} Days ({item.turnaroundHours}h)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
         * DETAIL 3: REVISIONS
         * =================================================================== */}
        {selectedMetricTab === "revisions" && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-white">
              Revision Cycles by Deliverable and Client
            </h2>

            {!data.revisions.hasData ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-2">
                <div className="text-2xl">⏳</div>
                <h3 className="text-sm font-semibold text-white">Insufficient Data</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {data.revisions.insufficientReason}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deliverables with Revisions */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    Deliverables with Revision Requests ({data.revisions.value?.perDeliverable.length})
                  </h3>
                  <div className="divide-y divide-zinc-800/60 text-xs">
                    {data.revisions.value?.perDeliverable.map((del) => (
                      <div key={del.deliverableId} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={del.linkUrl}
                            className="font-medium text-white hover:text-sky-300 truncate block"
                          >
                            {del.title} ↗
                          </Link>
                          <span className="text-[11px] text-zinc-500">
                            Client: {del.clientName}
                          </span>
                        </div>
                        <span className="shrink-0 px-2.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40 font-mono font-bold text-[11px]">
                          {del.revisionCount} Cycle{del.revisionCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-Client Revision Average */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    Client Revision Frequency ({data.revisions.value?.perClient.length})
                  </h3>
                  <div className="divide-y divide-zinc-800/60 text-xs">
                    {data.revisions.value?.perClient.map((c) => (
                      <div key={c.clientId} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={c.linkUrl}
                            className="font-medium text-white hover:text-sky-300 truncate block"
                          >
                            {c.clientName} ↗
                          </Link>
                          <span className="text-[11px] text-zinc-500">
                            {c.totalDeliverables} Total Deliverables
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-white">{c.totalRevisions} Revisions</div>
                          <div className="text-[10px] text-zinc-400">Avg {c.averageRevisions}x / deliv</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
         * DETAIL 4: WEEKLY THROUGHPUT
         * =================================================================== */}
        {selectedMetricTab === "throughput" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">
              Weekly Deliverable and Task Output
            </h2>

            {!data.throughput.hasData ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-2">
                <div className="text-2xl">⏳</div>
                <h3 className="text-sm font-semibold text-white">Insufficient Data</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {data.throughput.insufficientReason}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.throughput.value?.weeks.map((w, idx) => (
                  <div key={idx} className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                    <div className="text-xs font-mono font-bold text-zinc-300">
                      {w.weekLabel}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60">
                      <div>
                        <div className="text-2xl font-bold font-mono text-emerald-400">
                          {w.deliverablesCompleted}
                        </div>
                        <div className="text-[10px] uppercase font-mono text-zinc-500">
                          Deliverables
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono text-sky-400">
                          {w.tasksCompleted}
                        </div>
                        <div className="text-[10px] uppercase font-mono text-zinc-500">
                          Tasks
                        </div>
                      </div>
                    </div>

                    {w.deliverableItems.length > 0 && (
                      <div className="pt-2 text-[11px] space-y-1">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase">Highlights</div>
                        {w.deliverableItems.slice(0, 2).map((item) => (
                          <Link
                            key={item.id}
                            href={item.linkUrl}
                            className="block truncate text-zinc-300 hover:text-white"
                          >
                            • {item.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
         * DETAIL 5: MEMBER WORKLOAD
         * =================================================================== */}
        {selectedMetricTab === "workload" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">
              Team Member Capacity, Active Tasks, and Leave Status
            </h2>

            {!data.memberWorkload.hasData ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-2">
                <div className="text-2xl">⏳</div>
                <h3 className="text-sm font-semibold text-white">Insufficient Data</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {data.memberWorkload.insufficientReason}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Active Tasks</th>
                      <th className="py-3 px-4">Est. Remaining Hours</th>
                      <th className="py-3 px-4">Overdue</th>
                      <th className="py-3 px-4 text-right">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.memberWorkload.value?.members.map((m) => (
                      <tr key={m.memberId} className="hover:bg-zinc-850/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">
                          <Link href="/app/team" className="hover:text-sky-300">
                            {m.name} ↗
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                          {m.role}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {m.activeTasksCount} Active ({m.completedTasksCount} Done)
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300">
                          {m.estimatedHoursRemaining} hrs
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {m.overdueTasksCount > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40 font-bold">
                              {m.overdueTasksCount} Overdue
                            </span>
                          ) : (
                            <span className="text-zinc-500">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {m.isOnLeave ? (
                            <span
                              className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 font-mono text-[10px]"
                              title={m.leaveDetails}
                            >
                              🏖 On Leave
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-mono text-[10px]">
                              🟢 Available
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
         * DETAIL 6: PER-CLIENT OVERVIEW
         * =================================================================== */}
        {selectedMetricTab === "clients" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">
              Client Health, Volume, and On-Time Performance
            </h2>

            {!data.clientOverview.hasData ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-2">
                <div className="text-2xl">⏳</div>
                <h3 className="text-sm font-semibold text-white">Insufficient Data</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {data.clientOverview.insufficientReason}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono">
                    <tr>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Projects</th>
                      <th className="py-3 px-4">Deliverables</th>
                      <th className="py-3 px-4">On-Time Rate</th>
                      <th className="py-3 px-4 text-right">Revisions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {data.clientOverview.value?.clients.map((c) => (
                      <tr key={c.clientId} className="hover:bg-zinc-850/50 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={c.linkUrl}
                            className="font-medium text-white hover:text-sky-300 transition-colors block"
                          >
                            {c.name} ↗
                          </Link>
                          {c.companyName && (
                            <span className="text-[11px] text-zinc-500">{c.companyName}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-300 font-mono">
                          {c.activeProjects} active / {c.totalProjects} total
                        </td>
                        <td className="py-3 px-4 text-zinc-300 font-mono">
                          {c.completedDeliverables} done / {c.totalDeliverables} total
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {c.onTimeRatePercent !== null && c.onTimeRatePercent !== undefined ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.onTimeRatePercent >= 80
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                                  : "bg-amber-950 text-amber-300 border border-amber-800/40"
                              }`}
                            >
                              {c.onTimeRatePercent}%
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-[10px] font-mono">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-300">
                          {c.revisionCount} cycles
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
