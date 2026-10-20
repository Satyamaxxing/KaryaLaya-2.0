"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OwnerDashboardData } from "@/server/services/dashboard";
import { WeeklyAgencySummaryModal } from "@/components/work-os/WeeklyAgencySummaryModal";

interface ManagerDashboardViewProps {
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

export function ManagerDashboardView({ data, user }: ManagerDashboardViewProps) {
  const [briefingOpen, setBriefingOpen] = useState(false);

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const waitingReviewCount = data.needsAttention.waitingReviewTasks.length;
  const lateTasksCount = data.needsAttention.overdueTasks.length;
  const waitingClientCount = data.needsAttention.clientApprovalsPending.length;
  const dueThisWeekCount = data.needsAttention.dueThisWeekTasks?.length || 0;

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
            {todayFormatted} · Delivery Management
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
        {/* Card 1: Waiting for my review */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--kl-surface-1, #0a101d)",
            border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
            borderRadius: "0.75rem",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Waiting for My Review
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: waitingReviewCount > 0 ? "#38bdf8" : "#ffffff", fontFamily: "var(--font-mono, monospace)", marginTop: "0.25rem" }}>
            {waitingReviewCount}
          </div>
        </div>

        {/* Card 2: Late Tasks */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--kl-surface-1, #0a101d)",
            border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
            borderRadius: "0.75rem",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Late Tasks
          </div>
          <div style={{ fontSize: lateTasksCount > 0 ? "1.75rem" : "1rem", fontWeight: 700, color: lateTasksCount > 0 ? "#f43f5e" : "#10b981", fontFamily: "var(--font-mono, monospace)", marginTop: "0.25rem" }}>
            {lateTasksCount > 0 ? lateTasksCount : "Nothing overdue"}
          </div>
        </div>

        {/* Card 3: Waiting for Client */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--kl-surface-1, #0a101d)",
            border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
            borderRadius: "0.75rem",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Waiting for Client
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono, monospace)", marginTop: "0.25rem" }}>
            {waitingClientCount}
          </div>
        </div>

        {/* Card 4: Due This Week */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--kl-surface-1, #0a101d)",
            border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
            borderRadius: "0.75rem",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Due This Week
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono, monospace)", marginTop: "0.25rem" }}>
            {dueThisWeekCount}
          </div>
        </div>
      </div>

      {/* 3. Team Load List */}
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
        <div>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Team load
          </h2>
          <p style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))", margin: "2px 0 0 0" }}>
            Member assignment distribution across current deliverables
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
          {data.teamWorkload.map((member) => {
            const isOpen = member.openTasksCount > 0;
            const isOverloaded = member.openTasksCount >= 5 || member.overdueCount > 0;
            const loadStatus = member.openTasksCount === 0 ? "Free" : isOverloaded ? "Overloaded" : "Busy";
            const loadColor = member.openTasksCount === 0 ? "#10b981" : isOverloaded ? "#f43f5e" : "#38bdf8";
            const loadBg = member.openTasksCount === 0
              ? "rgba(16, 185, 129, 0.12)"
              : isOverloaded
              ? "rgba(244, 63, 94, 0.12)"
              : "rgba(56, 189, 248, 0.12)";

            return (
              <div
                key={member.user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--kl-surface-0, #060913)",
                  border: "1px solid var(--kl-border-hairline, rgba(255, 255, 255, 0.06))",
                  borderRadius: "0.5rem",
                  gap: "0.75rem",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {member.user.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))" }}>
                    {member.jobTitle || member.role} · {member.openTasksCount} open task{member.openTasksCount === 1 ? "" : "s"}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    backgroundColor: loadBg,
                    color: loadColor,
                    flexShrink: 0,
                  }}
                >
                  {loadStatus}
                </span>
              </div>
            );
          })}
        </div>
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
