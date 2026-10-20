"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OwnerDashboardData } from "@/server/services/dashboard";
import { WeeklyAgencySummaryModal } from "@/components/work-os/WeeklyAgencySummaryModal";

interface OwnerDashboardViewProps {
  data: OwnerDashboardData;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(" ")[0] || name;
  if (hour < 12) return `Good morning, ${firstName}`;
  if (hour < 18) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

export function OwnerDashboardView({ data, user }: OwnerDashboardViewProps) {
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "CLIENT" | "LATE" | "WEEK">("ALL");

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const activeProjectsCount = data.activeProjects.length;
  const waitingClientCount = data.needsAttention.clientApprovalsPending.length;
  const lateTasksCount = data.needsAttention.overdueTasks.length;
  const dueThisWeekCount = data.needsAttention.dueThisWeekTasks?.length || 0;

  // Filter attention items if a number card is clicked
  const showApprovals = filterType === "ALL" || filterType === "CLIENT";
  const showAtRisk = filterType === "ALL";
  const showReview = filterType === "ALL";
  const showLate = filterType === "ALL" || filterType === "LATE";
  const showThisWeek = filterType === "WEEK";

  const totalAttentionItems =
    data.needsAttention.clientApprovalsPending.length +
    data.needsAttention.deliverablesAtRisk.length +
    data.needsAttention.waitingReviewTasks.length +
    data.needsAttention.overdueTasks.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* 1. Header: One-line greeting + date + at most one small action button */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          paddingBottom: "0.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {getGreeting(user.name)}
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--kl-text-muted, rgba(255, 255, 255, 0.55))",
              margin: "0.25rem 0 0 0",
            }}
          >
            {todayFormatted} · {data.organizationName}
          </p>
        </div>

        <button
          onClick={() => setBriefingOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.85rem",
            backgroundColor: "var(--kl-surface-2, #0f172a)",
            border: "1px solid var(--kl-border-subtle, rgba(56, 139, 253, 0.2))",
            borderRadius: "0.5rem",
            color: "#38bdf8",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <span>✨</span>
          <span>Weekly briefing</span>
        </button>
      </header>

      {/* 2. Compact row of max 4 summary numbers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.875rem",
        }}
      >
        {/* Card 1: Active Projects */}
        <button
          type="button"
          onClick={() => setFilterType("ALL")}
          style={{
            textAlign: "left",
            padding: "1rem",
            backgroundColor: filterType === "ALL" ? "var(--kl-surface-2, #0f172a)" : "var(--kl-surface-1, #0a101d)",
            border: `1px solid ${filterType === "ALL" ? "var(--kl-border-focus, #38bdf8)" : "var(--kl-border-card, rgba(255, 255, 255, 0.08))"}`,
            borderRadius: "0.75rem",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Active Projects
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono, monospace)", marginTop: "0.25rem" }}>
            {activeProjectsCount}
          </div>
        </button>

        {/* Card 2: Waiting for Client */}
        <button
          type="button"
          onClick={() => setFilterType(filterType === "CLIENT" ? "ALL" : "CLIENT")}
          style={{
            textAlign: "left",
            padding: "1rem",
            backgroundColor: filterType === "CLIENT" ? "var(--kl-surface-2, #0f172a)" : "var(--kl-surface-1, #0a101d)",
            border: `1px solid ${filterType === "CLIENT" ? "var(--kl-border-focus, #38bdf8)" : "var(--kl-border-card, rgba(255, 255, 255, 0.08))"}`,
            borderRadius: "0.75rem",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Waiting for Client
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: waitingClientCount > 0 ? "#38bdf8" : "#ffffff", fontFamily: "var(--font-mono, monospace)", marginTop: "0.25rem" }}>
            {waitingClientCount}
          </div>
        </button>

        {/* Card 3: Late Tasks */}
        <button
          type="button"
          onClick={() => setFilterType(filterType === "LATE" ? "ALL" : "LATE")}
          style={{
            textAlign: "left",
            padding: "1rem",
            backgroundColor: filterType === "LATE" ? "var(--kl-surface-2, #0f172a)" : "var(--kl-surface-1, #0a101d)",
            border: `1px solid ${filterType === "LATE" ? "#f43f5e" : "var(--kl-border-card, rgba(255, 255, 255, 0.08))"}`,
            borderRadius: "0.75rem",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Late Tasks
          </div>
          <div style={{ fontSize: lateTasksCount > 0 ? "1.75rem" : "1rem", fontWeight: 700, color: lateTasksCount > 0 ? "#f43f5e" : "#10b981", fontFamily: "var(--font-mono, monospace)", marginTop: "0.25rem" }}>
            {lateTasksCount > 0 ? lateTasksCount : "Nothing overdue"}
          </div>
        </button>

        {/* Card 4: Due This Week */}
        <button
          type="button"
          onClick={() => setFilterType(filterType === "WEEK" ? "ALL" : "WEEK")}
          style={{
            textAlign: "left",
            padding: "1rem",
            backgroundColor: filterType === "WEEK" ? "var(--kl-surface-2, #0f172a)" : "var(--kl-surface-1, #0a101d)",
            border: `1px solid ${filterType === "WEEK" ? "var(--kl-border-focus, #38bdf8)" : "var(--kl-border-card, rgba(255, 255, 255, 0.08))"}`,
            borderRadius: "0.75rem",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Due This Week
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono, monospace)", marginTop: "0.25rem" }}>
            {dueThisWeekCount}
          </div>
        </button>
      </div>

      {/* 3. Main List: Needs Your Attention */}
      <section
        style={{
          backgroundColor: "var(--kl-surface-1, #0a101d)",
          border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
              Needs your attention
            </h2>
            <p style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))", margin: "2px 0 0 0" }}>
              Actionable items requiring sign-off, decision, or intervention
            </p>
          </div>
          {filterType !== "ALL" && (
            <button
              onClick={() => setFilterType("ALL")}
              style={{
                fontSize: "11px",
                color: "#38bdf8",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              Show all ({totalAttentionItems})
            </button>
          )}
        </div>

        {totalAttentionItems === 0 ? (
          <div
            style={{
              padding: "2rem 1rem",
              textAlign: "center",
              backgroundColor: "rgba(16, 185, 129, 0.04)",
              borderRadius: "0.5rem",
              border: "1px dashed rgba(16, 185, 129, 0.2)",
            }}
          >
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#10b981", margin: 0 }}>
              ✓ All clear — operations are on schedule.
            </p>
            <p style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))", margin: "4px 0 0 0" }}>
              No client sign-offs pending, no at-risk deliverables, and nothing overdue.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {/* A. Client Approvals Pending */}
            {showApprovals &&
              data.needsAttention.clientApprovalsPending.map((item) => (
                <div
                  key={`approval-${item.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--kl-surface-0, #060913)",
                    border: "1px solid var(--kl-border-hairline, rgba(255, 255, 255, 0.06))",
                    borderRadius: "0.5rem",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontWeight: 600 }}>
                        Awaiting Client Sign-off
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))" }}>
                        {item.clientName}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--kl-text-dim, rgba(255, 255, 255, 0.4))" }}>
                      Project: {item.projectName}
                    </div>
                  </div>

                  <Link
                    href={`/app/projects/${item.projectId}`}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#38bdf8",
                      backgroundColor: "var(--kl-surface-2, #0f172a)",
                      border: "1px solid var(--kl-border-subtle, rgba(56, 139, 253, 0.2))",
                      borderRadius: "0.375rem",
                      textDecoration: "none",
                    }}
                  >
                    View Project →
                  </Link>
                </div>
              ))}

            {/* B. Deliverables At Risk */}
            {showAtRisk &&
              data.needsAttention.deliverablesAtRisk.map((item) => (
                <div
                  key={`atrisk-${item.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--kl-surface-0, #060913)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    borderRadius: "0.5rem",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", fontWeight: 600 }}>
                        At risk
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))" }}>
                        {item.clientName}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#fbbf24" }}>
                      {item.riskReason ? `Reason: ${item.riskReason}` : "Pacing behind scheduled turnaround"}
                    </div>
                  </div>

                  <Link
                    href={`/app/projects/${item.projectId}`}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#fbbf24",
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "0.375rem",
                      textDecoration: "none",
                    }}
                  >
                    Resolve →
                  </Link>
                </div>
              ))}

            {/* C. Tasks Waiting for Review */}
            {showReview &&
              data.needsAttention.waitingReviewTasks.map((task) => (
                <div
                  key={`review-${task.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--kl-surface-0, #060913)",
                    border: "1px solid var(--kl-border-hairline, rgba(255, 255, 255, 0.06))",
                    borderRadius: "0.5rem",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#c084fc", fontWeight: 600 }}>
                        Needs Internal Review
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))" }}>
                        Assignee: {task.assignee?.name || "Unassigned"}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--kl-text-dim, rgba(255, 255, 255, 0.4))" }}>
                      Project: {task.projectName}
                    </div>
                  </div>

                  <Link
                    href={`/app/projects/${task.projectId}`}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#ffffff",
                      backgroundColor: "var(--kl-surface-2, #0f172a)",
                      border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.1))",
                      borderRadius: "0.375rem",
                      textDecoration: "none",
                    }}
                  >
                    Review →
                  </Link>
                </div>
              ))}

            {/* D. Late Tasks */}
            {showLate &&
              data.needsAttention.overdueTasks.map((task) => (
                <div
                  key={`late-${task.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--kl-surface-0, #060913)",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    borderRadius: "0.5rem",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", backgroundColor: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", fontWeight: 600 }}>
                        Late
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))" }}>
                        Assignee: {task.assignee?.name || "Unassigned"}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#f43f5e" }}>
                      Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Past Due"} · {task.projectName}
                    </div>
                  </div>

                  <Link
                    href={`/app/projects/${task.projectId}`}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#f43f5e",
                      backgroundColor: "rgba(244, 63, 94, 0.1)",
                      border: "1px solid rgba(244, 63, 94, 0.3)",
                      borderRadius: "0.375rem",
                      textDecoration: "none",
                    }}
                  >
                    Open →
                  </Link>
                </div>
              ))}

            {/* E. Due This Week Tasks */}
            {showThisWeek &&
              data.needsAttention.dueThisWeekTasks?.map((task) => (
                <div
                  key={`week-${task.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--kl-surface-0, #060913)",
                    border: "1px solid var(--kl-border-hairline, rgba(255, 255, 255, 0.06))",
                    borderRadius: "0.5rem",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontWeight: 600 }}>
                        Due this week
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))" }}>
                        Assignee: {task.assignee?.name || "Unassigned"}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--kl-text-dim, rgba(255, 255, 255, 0.4))" }}>
                      Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ""} · {task.projectName}
                    </div>
                  </div>

                  <Link
                    href={`/app/projects/${task.projectId}`}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#38bdf8",
                      backgroundColor: "var(--kl-surface-2, #0f172a)",
                      border: "1px solid var(--kl-border-subtle, rgba(56, 139, 253, 0.2))",
                      borderRadius: "0.375rem",
                      textDecoration: "none",
                    }}
                  >
                    Open →
                  </Link>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* 4. Projects List */}
      <section
        style={{
          backgroundColor: "var(--kl-surface-1, #0a101d)",
          border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Projects
          </h2>
          <Link
            href="/app/projects"
            style={{ fontSize: "11px", color: "#38bdf8", textDecoration: "none" }}
          >
            All projects ({data.activeProjects.length}) →
          </Link>
        </div>

        {data.activeProjects.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))", margin: 0 }}>
            No active projects.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {data.activeProjects.map((p) => {
              const isLate = p.dueDate && new Date(p.dueDate) < new Date();
              const isAtRisk = p.health === "AT_RISK";
              const statusLabel = isLate ? "Late" : isAtRisk ? "At risk" : "On track";
              const statusColor = isLate ? "#f43f5e" : isAtRisk ? "#fbbf24" : "#10b981";
              const statusBg = isLate
                ? "rgba(244, 63, 94, 0.15)"
                : isAtRisk
                ? "rgba(245, 158, 11, 0.15)"
                : "rgba(16, 185, 129, 0.15)";

              return (
                <Link
                  key={p.id}
                  href={`/app/projects/${p.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: "var(--kl-surface-0, #060913)",
                    border: "1px solid var(--kl-border-hairline, rgba(255, 255, 255, 0.06))",
                    borderRadius: "0.5rem",
                    textDecoration: "none",
                    gap: "1rem",
                    flexWrap: "wrap",
                    transition: "border-color 140ms ease",
                  }}
                >
                  <div style={{ minWidth: "180px", flex: 2 }}>
                    <div style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))" }}>
                      {p.client.name}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                      {p.name}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ minWidth: "140px", flex: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "var(--kl-text-dim, rgba(255, 255, 255, 0.5))", marginBottom: "4px" }}>
                      <span>Progress</span>
                      <span style={{ fontFamily: "var(--font-mono, monospace)", color: "#ffffff" }}>{p.progressPercent}%</span>
                    </div>
                    <div style={{ height: "4px", backgroundColor: "var(--kl-surface-2, #0f172a)", borderRadius: "2px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${p.progressPercent}%`,
                          backgroundColor: statusColor,
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Due Date & Status */}
                  <div style={{ minWidth: "120px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <span style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))" }}>
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Ongoing"}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: statusBg,
                        color: statusColor,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Weekly Agency Summary Briefing Modal */}
      <WeeklyAgencySummaryModal
        isOpen={briefingOpen}
        onClose={() => setBriefingOpen(false)}
      />
    </div>
  );
}
