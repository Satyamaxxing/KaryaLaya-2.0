"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  DeliverableStatus,
  TaskStatus,
  PriorityLevel,
  EntityAudience,
  ActorType,
  HealthStatus,
  RiskTier,
} from "@/types/work-os";

export function StatusBadge({ status }: { status: DeliverableStatus | TaskStatus | string }) {
  const getStyles = () => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return {
          bg: "rgba(16, 185, 129, 0.12)",
          color: "var(--kl-emerald)",
          border: "rgba(16, 185, 129, 0.35)",
        };
      case "IN_PROGRESS":
        return {
          bg: "rgba(56, 189, 248, 0.12)",
          color: "var(--kl-sky)",
          border: "rgba(56, 189, 248, 0.35)",
        };
      case "CLIENT_REVIEW":
      case "IN_REVIEW":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          color: "var(--kl-amber)",
          border: "rgba(245, 158, 11, 0.35)",
        };
      case "REVISION_REQUIRED":
        return {
          bg: "rgba(244, 63, 94, 0.12)",
          color: "var(--kl-rose)",
          border: "rgba(244, 63, 94, 0.35)",
        };
      case "PLANNED":
      case "NOT_STARTED":
      default:
        return {
          bg: "var(--kl-surface-2)",
          color: "var(--kl-text-muted)",
          border: "var(--kl-border-hairline)",
        };
    }
  };

  const style = getStyles();
  const formatText = (s: string) => s.replace(/_/g, " ");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.15rem 0.55rem",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: style.color,
        }}
      />
      {formatText(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const map: Record<PriorityLevel, { label: string; bg: string; color: string; border: string }> = {
    P0: {
      label: "P0 · Urgent",
      bg: "rgba(244, 63, 94, 0.15)",
      color: "var(--kl-rose)",
      border: "rgba(244, 63, 94, 0.35)",
    },
    P1: {
      label: "P1 · High",
      bg: "rgba(245, 158, 11, 0.15)",
      color: "var(--kl-amber)",
      border: "rgba(245, 158, 11, 0.35)",
    },
    P2: {
      label: "P2 · Medium",
      bg: "rgba(56, 189, 248, 0.12)",
      color: "var(--kl-sky)",
      border: "rgba(56, 189, 248, 0.3)",
    },
    P3: {
      label: "P3 · Low",
      bg: "var(--kl-surface-2)",
      color: "var(--kl-text-muted)",
      border: "var(--kl-border-hairline)",
    },
  };

  const item = map[priority] || map.P2;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.12rem 0.45rem",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: item.bg,
        color: item.color,
        border: `1px solid ${item.border}`,
        fontFamily: "var(--font-mono, monospace)",
      }}
    >
      {item.label}
    </span>
  );
}

export function AudiencePill({ audience }: { audience: EntityAudience }) {
  if (audience === "CLIENT_VISIBLE") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.12rem 0.5rem",
          borderRadius: "9999px",
          fontSize: "10px",
          fontWeight: 600,
          backgroundColor: "var(--kl-emerald-bg)",
          color: "var(--kl-emerald)",
          border: "1px solid var(--kl-emerald-border)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path
            fillRule="evenodd"
            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
            clipRule="evenodd"
          />
        </svg>
        Client-Visible
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.12rem 0.5rem",
        borderRadius: "9999px",
        fontSize: "10px",
        fontWeight: 500,
        backgroundColor: "var(--kl-surface-2)",
        color: "var(--kl-text-muted)",
        border: "1px solid var(--kl-border-hairline)",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      </svg>
      Internal
    </span>
  );
}

export function ActorChip({ actorType, name }: { actorType: ActorType; name?: string }) {
  const map: Record<
    ActorType,
    { label: string; bg: string; color: string; border: string; icon: string }
  > = {
    HUMAN: {
      label: "Human",
      bg: "rgba(56, 189, 248, 0.12)",
      color: "var(--kl-sky)",
      border: "rgba(56, 189, 248, 0.3)",
      icon: "👤",
    },
    AI: {
      label: "AI Intelligence",
      bg: "rgba(99, 102, 241, 0.15)",
      color: "var(--kl-indigo)",
      border: "rgba(99, 102, 241, 0.35)",
      icon: "✨",
    },
    AUTOMATION: {
      label: "Automation",
      bg: "rgba(168, 85, 247, 0.15)",
      color: "#c084fc",
      border: "rgba(168, 85, 247, 0.35)",
      icon: "⚡",
    },
    CLIENT: {
      label: "Client",
      bg: "var(--kl-emerald-bg)",
      color: "var(--kl-emerald)",
      border: "var(--kl-emerald-border)",
      icon: "🏢",
    },
    SYSTEM: {
      label: "System",
      bg: "var(--kl-surface-2)",
      color: "var(--kl-text-secondary)",
      border: "var(--kl-border-hairline)",
      icon: "⚙️",
    },
    INTEGRATION: {
      label: "Integration",
      bg: "rgba(245, 158, 11, 0.12)",
      color: "var(--kl-amber)",
      border: "rgba(245, 158, 11, 0.35)",
      icon: "🔗",
    },
  };

  const config = map[actorType] || map.HUMAN;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.12rem 0.5rem",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      <span>{config.icon}</span>
      <span>{name || config.label}</span>
    </span>
  );
}

/**
 * HealthBadge with accessible, bounded "Health Drivers" popover:
 * - Opens on click or hover
 * - Stays inside viewport boundaries
 * - Closes on outside click or Escape key
 */
export function HealthBadge({ health, reasons }: { health: HealthStatus; reasons?: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<"left" | "right">("left");

  const config = {
    ON_TRACK: {
      label: "On Track",
      bg: "rgba(16, 185, 129, 0.12)",
      color: "var(--kl-emerald)",
      border: "rgba(16, 185, 129, 0.35)",
    },
    AT_RISK: {
      label: "At Risk",
      bg: "rgba(245, 158, 11, 0.15)",
      color: "var(--kl-amber)",
      border: "rgba(245, 158, 11, 0.35)",
    },
    OFF_TRACK: {
      label: "Off Track",
      bg: "rgba(244, 63, 94, 0.15)",
      color: "var(--kl-rose)",
      border: "rgba(244, 63, 94, 0.35)",
    },
    UNKNOWN: {
      label: "Unknown",
      bg: "var(--kl-surface-2)",
      color: "var(--kl-text-muted)",
      border: "var(--kl-border-hairline)",
    },
  }[health];

  // Adjust placement to keep popover inside the viewport
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      if (rect.right > viewportWidth - 20) {
        setPopoverPlacement("right");
      } else {
        setPopoverPlacement("left");
      }
    }
  }, [isOpen]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => {
        if (reasons && reasons.length > 0) setIsOpen(true);
      }}
      onMouseLeave={() => {
        setIsOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (reasons && reasons.length > 0) setIsOpen((prev) => !prev);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.2rem 0.65rem",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          cursor: reasons && reasons.length > 0 ? "pointer" : "default",
          outline: "none",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: config.color,
          }}
        />
        <span>{config.label}</span>
        {reasons && reasons.length > 0 && (
          <span style={{ fontSize: "10px", opacity: 0.7 }}>ℹ️</span>
        )}
      </button>

      {/* Accessible, Viewport-Bounded Popover */}
      {isOpen && reasons && reasons.length > 0 && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Health Drivers"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            ...(popoverPlacement === "right" ? { right: 0 } : { left: 0 }),
            width: "max-content",
            maxWidth: "min(320px, 90vw)",
            padding: "0.75rem",
            backgroundColor: "var(--kl-surface-0)",
            border: "1px solid var(--kl-border-subtle)",
            borderRadius: "0.75rem",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.8)",
            zIndex: 100,
            color: "var(--kl-text-secondary)",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.35rem",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: "#fff",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Health Drivers
            </span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--kl-text-dim)",
                cursor: "pointer",
                padding: "2px",
                fontSize: "11px",
              }}
              aria-label="Close popover"
            >
              ✕
            </button>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            {reasons.map((r, i) => (
              <li key={i} style={{ color: "var(--kl-text-secondary)" }}>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ProgressRing({
  percent,
  size = 48,
  strokeWidth = 4,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--kl-emerald)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: "all 700ms ease" }}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          fontSize: "11px",
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {percent}%
      </span>
    </div>
  );
}

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const map: Record<
    RiskTier,
    { label: string; desc: string; bg: string; color: string; border: string }
  > = {
    T0: {
      label: "T0 · Read-Only",
      desc: "No state change",
      bg: "var(--kl-surface-2)",
      color: "var(--kl-text-secondary)",
      border: "var(--kl-border-hairline)",
    },
    T1: {
      label: "T1 · Notify/Internal",
      desc: "Low impact",
      bg: "rgba(56, 189, 248, 0.12)",
      color: "var(--kl-sky)",
      border: "rgba(56, 189, 248, 0.3)",
    },
    T2: {
      label: "T2 · Internal Mutation",
      desc: "Requires Manager approval",
      bg: "rgba(245, 158, 11, 0.15)",
      color: "var(--kl-amber)",
      border: "rgba(245, 158, 11, 0.35)",
    },
    T3: {
      label: "T3 · Client-Visible Action",
      desc: "Requires Gate & Preview",
      bg: "rgba(168, 85, 247, 0.15)",
      color: "#c084fc",
      border: "rgba(168, 85, 247, 0.35)",
    },
    T4: {
      label: "T4 · High-Risk / Irreversible",
      desc: "Admin Policy Gated",
      bg: "rgba(244, 63, 94, 0.15)",
      color: "var(--kl-rose)",
      border: "rgba(244, 63, 94, 0.35)",
    },
  };

  const item = map[tier] || map.T1;

  return (
    <span
      title={item.desc}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.12rem 0.45rem",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 600,
        backgroundColor: item.bg,
        color: item.color,
        border: `1px solid ${item.border}`,
        fontFamily: "var(--font-mono, monospace)",
        textTransform: "uppercase",
      }}
    >
      {item.label}
    </span>
  );
}
