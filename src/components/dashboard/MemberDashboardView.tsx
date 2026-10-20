"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MemberDashboardData, AttentionTask } from "@/server/services/dashboard";

interface MemberDashboardViewProps {
  data: MemberDashboardData;
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

export function MemberDashboardView({ data, user }: MemberDashboardViewProps) {
  const [tasksToday, setTasksToday] = useState<AttentionTask[]>(data.myTasksToday);
  const [overdueTasks, setOverdueTasks] = useState<AttentionTask[]>(data.overdueTasks);
  const [revisions, setRevisions] = useState<AttentionTask[]>(data.revisionsRequested);
  const [upcoming, setUpcoming] = useState<AttentionTask[]>(data.upcomingDeadlines);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      // Optimistically update lists:
      if (newStatus === "DONE") {
        setTasksToday((prev) => prev.filter((t) => t.id !== taskId));
        setOverdueTasks((prev) => prev.filter((t) => t.id !== taskId));
        setRevisions((prev) => prev.filter((t) => t.id !== taskId));
        setUpcoming((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        const updateItem = (list: AttentionTask[]) =>
          list.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
        setTasksToday(updateItem);
        setOverdueTasks(updateItem);
        setRevisions(updateItem);
        setUpcoming(updateItem);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const totalActiveTasks =
    tasksToday.length + overdueTasks.length + revisions.length + upcoming.length;

  const renderTaskRow = (task: AttentionTask, badgeColor = "var(--kl-border-subtle)") => (
    <div
      key={task.id}
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
        <div style={{ fontSize: "11px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.5))", marginBottom: "2px" }}>
          {task.projectName}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
          {task.title}
        </div>
        <div style={{ fontSize: "11px", color: "var(--kl-text-dim, rgba(255, 255, 255, 0.4))", marginTop: "2px" }}>
          {task.dueDate
            ? `Due: ${new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
            : "No due date"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <select
          value={task.status}
          disabled={updatingTaskId === task.id}
          onChange={(e) => handleStatusChange(task.id, e.target.value)}
          style={{
            padding: "0.35rem 0.6rem",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "0.375rem",
            backgroundColor: "var(--kl-surface-2, #0f172a)",
            border: "1px solid var(--kl-border-subtle, rgba(56, 139, 253, 0.2))",
            color: task.status === "DONE" ? "#10b981" : "#38bdf8",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        <Link
          href={`/app/projects/${task.projectId}`}
          style={{
            fontSize: "11px",
            color: "var(--kl-text-dim, rgba(255, 255, 255, 0.4))",
            textDecoration: "none",
            padding: "0.35rem",
          }}
          title="Open Project"
        >
          →
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* 1. Header: One-line greeting + date + small action button */}
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
            {todayFormatted} · Specialist Workspace
          </p>
        </div>

        <Link
          href="/app/my-work"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.85rem",
            backgroundColor: "var(--kl-surface-2, #0f172a)",
            border: "1px solid var(--kl-border-subtle, rgba(56, 139, 253, 0.25))",
            borderRadius: "0.5rem",
            color: "#38bdf8",
            fontSize: "12px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 140ms ease",
          }}
        >
          <span>Open My Work →</span>
        </Link>
      </header>

      {/* 2. Tasks Sections (Rendered ONLY if non-empty) */}
      {totalActiveTasks === 0 ? (
        <div
          style={{
            padding: "3rem 1.5rem",
            textAlign: "center",
            backgroundColor: "var(--kl-surface-1, #0a101d)",
            border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
            borderRadius: "0.75rem",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            You have no pending tasks today.
          </h2>
          <p style={{ fontSize: "12px", color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))", margin: "0.5rem 0 1.25rem 0" }}>
            All caught up! Check assigned projects or relax.
          </p>
          <Link
            href="/app/my-work"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "var(--kl-surface-3, #141f36)",
              color: "#ffffff",
              borderRadius: "0.5rem",
              textDecoration: "none",
            }}
          >
            Open My Work
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Section 1: Late (Rendered ONLY if non-empty) */}
          {overdueTasks.length > 0 && (
            <section
              style={{
                backgroundColor: "var(--kl-surface-1, #0a101d)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "12px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", fontWeight: 700 }}>
                  Late
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                  ({overdueTasks.length})
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {overdueTasks.map((t) => renderTaskRow(t, "rgba(244, 63, 94, 0.4)"))}
              </div>
            </section>
          )}

          {/* Section 2: Revisions requested (Rendered ONLY if non-empty) */}
          {revisions.length > 0 && (
            <section
              style={{
                backgroundColor: "var(--kl-surface-1, #0a101d)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "12px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", fontWeight: 700 }}>
                  Revisions requested
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                  ({revisions.length})
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {revisions.map((t) => renderTaskRow(t, "rgba(245, 158, 11, 0.4)"))}
              </div>
            </section>
          )}

          {/* Section 3: Due today (Rendered ONLY if non-empty) */}
          {tasksToday.length > 0 && (
            <section
              style={{
                backgroundColor: "var(--kl-surface-1, #0a101d)",
                border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "12px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", fontWeight: 700 }}>
                  Due today
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                  ({tasksToday.length})
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {tasksToday.map((t) => renderTaskRow(t))}
              </div>
            </section>
          )}

          {/* Section 4: Next 7 days (Rendered ONLY if non-empty) */}
          {upcoming.length > 0 && (
            <section
              style={{
                backgroundColor: "var(--kl-surface-1, #0a101d)",
                border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "12px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 700 }}>
                  Next 7 days
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                  ({upcoming.length})
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {upcoming.map((t) => renderTaskRow(t))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
