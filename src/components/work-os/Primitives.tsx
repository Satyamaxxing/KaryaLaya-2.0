"use client";

import React from "react";
import {
  DeliverableStatus,
  TaskStatus,
  PriorityLevel,
  EntityAudience,
  ActorType,
  HealthStatus,
  RiskTier,
} from "@/types/work-os";

/**
 * StatusMark - PRD §49.4
 * Status conveyed by text + distinct shape/glyph, not color alone (WCAG 2.2 AA).
 */
export function StatusMark({
  status,
  size = "md",
}: {
  status: DeliverableStatus | TaskStatus | string;
  size?: "sm" | "md" | "lg";
}) {
  const getDescriptor = () => {
    switch (status) {
      case "APPROVED":
        return {
          glyph: "✓",
          label: "Approved",
          className:
            "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10",
        };
      case "COMPLETED":
        return {
          glyph: "◼",
          label: "Completed",
          className: "bg-emerald-950/70 text-emerald-300 border-emerald-500/30",
        };
      case "CLIENT_REVIEW":
        return {
          glyph: "◉",
          label: "In Client Review",
          className:
            "bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10",
        };
      case "IN_REVIEW":
        return {
          glyph: "◎",
          label: "In Review",
          className: "bg-amber-950/70 text-amber-300 border-amber-500/30",
        };
      case "IN_PROGRESS":
        return {
          glyph: "▶",
          label: "In Progress",
          className: "bg-sky-950/80 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/10",
        };
      case "REVISION_REQUIRED":
        return {
          glyph: "↺",
          label: "Revision Required",
          className: "bg-rose-950/80 text-rose-300 border-rose-500/40",
        };
      case "PLANNED":
      case "NOT_STARTED":
      default:
        return {
          glyph: "○",
          label: status.replace(/_/g, " "),
          className: "bg-zinc-900 text-zinc-400 border-zinc-700/60",
        };
    }
  };

  const { glyph, label, className } = getDescriptor();
  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : size === "lg"
        ? "text-xs px-3 py-1"
        : "text-[11px] px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono uppercase font-semibold border ${sizeClasses} ${className}`}
    >
      <span className="font-bold text-[10px] leading-none" aria-hidden="true">
        {glyph}
      </span>
      <span>{label}</span>
    </span>
  );
}

/**
 * StateHeader - PRD §49.4
 * Displays State Version lineage, As-Of timestamp, and One Work State synchronization.
 */
export function StateHeader({
  stateVersion,
  asOfTimestamp,
  title,
  subtitle,
  children,
}: {
  stateVersion: number;
  asOfTimestamp: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            STATE v{stateVersion}
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            As of{" "}
            {new Date(asOfTimestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">One Work State Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-300 leading-relaxed">{subtitle}</p>}
      </div>

      {children && <div className="shrink-0 flex items-center gap-3">{children}</div>}
    </div>
  );
}

/**
 * NodeLink - PRD §49.4
 * Relationship connector line representing causal or dependency link.
 */
export function NodeLink({
  label,
  kind = "HARD",
  isBlocked = false,
}: {
  label?: string;
  kind?: "HARD" | "SOFT";
  isBlocked?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 my-1 text-xs">
      <div className="flex-1 h-[1px] bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700 relative">
        {isBlocked && (
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
        )}
      </div>
      {label && (
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${
            kind === "HARD"
              ? "bg-rose-950/80 text-rose-300 border-rose-500/40"
              : "bg-blue-950/80 text-blue-300 border-blue-500/40"
          }`}
        >
          {label}
        </span>
      )}
      <div className="flex-1 h-[1px] bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700" />
    </div>
  );
}

/**
 * EmptyState - PRD §49.4 & §29
 * Explainable empty state with next action.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="p-8 text-center bg-zinc-950/60 border border-dashed border-zinc-800 rounded-xl space-y-3">
      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 mx-auto flex items-center justify-center text-zinc-400 text-lg">
        ◻
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg shadow-sm transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * ErrorState - PRD §29
 * Explainable error state naming cause and recovery.
 */
export function ErrorState({
  title = "Operation Encountered a Constraint",
  cause,
  recovery,
  onRetry,
}: {
  title?: string;
  cause: string;
  recovery: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-5 bg-rose-950/30 border border-rose-500/40 rounded-xl space-y-3 text-xs">
      <div className="flex items-center gap-2 text-rose-300 font-semibold">
        <span>⚠</span>
        <span>{title}</span>
      </div>
      <div className="text-zinc-300">
        <strong className="text-white">Cause:</strong> {cause}
      </div>
      <div className="text-zinc-400">
        <strong className="text-white">Recovery:</strong> {recovery}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition-colors"
        >
          Retry Verification
        </button>
      )}
    </div>
  );
}

/**
 * PermissionState - PRD §13
 * Scoped boundary indicator explaining what's hidden without leaking content.
 */
export function PermissionState({
  resourceName,
  requiredRole = "MANAGER+",
}: {
  resourceName: string;
  requiredRole?: string;
}) {
  return (
    <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between text-xs text-zinc-400">
      <div className="flex items-center gap-2">
        <span className="text-zinc-500 font-mono">🔒</span>
        <span>
          Access Scoped: <strong className="text-zinc-200">{resourceName}</strong> requires{" "}
          <strong className="text-sky-400 font-mono">{requiredRole}</strong> permission.
        </span>
      </div>
      <span className="text-[10px] text-zinc-500 font-mono">Server Enforced</span>
    </div>
  );
}

/**
 * Avatar & AvatarGroup
 */
export function Avatar({
  name,
  role,
  size = "md",
}: {
  name: string;
  role?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "w-5 h-5 text-[10px]",
    md: "w-7 h-7 text-xs",
    lg: "w-9 h-9 text-sm",
  }[size];

  return (
    <div
      title={role ? `${name} (${role})` : name}
      className={`rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold flex items-center justify-center shrink-0 ${sizeMap}`}
    >
      {name.charAt(0)}
    </div>
  );
}
