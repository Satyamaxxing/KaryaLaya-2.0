"use client";

import React from "react";

export interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: "sm" | "md";
  dotColor?: string;
}

export function Pill({
  children,
  active = false,
  size = "md",
  dotColor,
  className = "",
  style,
  ...props
}: PillProps) {
  const isSm = size === "sm";

  return (
    <button
      type="button"
      className={`kl-pill ${active ? "kl-pill-active" : ""} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.35rem",
        borderRadius: "var(--kl-radius-pill, 9999px)",
        padding: isSm ? "0.25rem 0.65rem" : "0.4rem 0.95rem",
        fontSize: isSm ? "11px" : "12px",
        fontWeight: active ? 500 : 400,
        fontFamily: "var(--font-sans, inherit)",
        letterSpacing: "-0.01em",
        cursor: "pointer",
        lineHeight: 1,
        transition: "all var(--kl-duration-fast, 180ms) var(--kl-ease-standard, ease)",
        backgroundColor: active
          ? "var(--kl-ink, #0B0B0C)"
          : "var(--kl-surface-0, #FFFFFF)",
        color: active ? "#FFFFFF" : "var(--kl-text-secondary, #6B6B70)",
        border: active
          ? "1px solid var(--kl-ink, #0B0B0C)"
          : "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
        boxShadow: active
          ? "0 2px 6px rgba(0, 0, 0, 0.08)"
          : "0 1px 2px rgba(0, 0, 0, 0.02)",
        outline: "none",
        ...style,
      }}
      {...props}
    >
      {dotColor && (
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  );
}

export interface MonoEyebrowProps {
  children: React.ReactNode;
  dotColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MonoEyebrow({
  children,
  dotColor = "var(--kl-indigo, #5B5BD6)",
  className = "",
  style,
}: MonoEyebrowProps) {
  return (
    <div
      className={`kl-mono-eyebrow ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--kl-text-secondary, #6B6B70)",
        lineHeight: 1,
        ...style,
      }}
    >
      {dotColor && (
        <span
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: dotColor,
            flexShrink: 0,
            display: "inline-block",
          }}
        />
      )}
      <span>{children}</span>
    </div>
  );
}

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  height?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ProgressBar({
  value,
  max = 100,
  height = 4,
  color = "var(--kl-indigo, #5B5BD6)",
  trackColor = "var(--kl-surface-2, #E5E5E3)",
  showLabel = false,
  className = "",
  style,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={`kl-progress-wrapper ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        width: "100%",
        ...style,
      }}
    >
      <div
        style={{
          flex: 1,
          height: `${height}px`,
          backgroundColor: trackColor,
          borderRadius: "var(--kl-radius-pill, 9999px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: "var(--kl-radius-pill, 9999px)",
            transition: "width var(--kl-duration-slow, 700ms) var(--kl-ease-standard, ease)",
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.05em",
            fontVariantNumeric: "tabular-nums",
            color: "var(--kl-text-secondary, #6B6B70)",
            minWidth: "32px",
            textAlign: "right",
          }}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "approved" | "in-review" | "needs-attention" | "at-risk" | "late" | "neutral" | "indigo";
  glyph?: string;
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  variant = "neutral",
  glyph,
  size = "md",
  className = "",
  style,
}: BadgeProps) {
  const isSm = size === "sm";

  const getVariantStyles = (): { bg: string; color: string; border: string; defaultGlyph: string } => {
    switch (variant) {
      case "approved":
        return {
          bg: "var(--kl-emerald-bg, rgba(16, 185, 129, 0.08))",
          color: "var(--kl-emerald, #10B981)",
          border: "var(--kl-emerald-border, rgba(16, 185, 129, 0.25))",
          defaultGlyph: "✓",
        };
      case "in-review":
      case "needs-attention":
        return {
          bg: "var(--kl-amber-bg, rgba(245, 158, 11, 0.08))",
          color: "var(--kl-amber, #F59E0B)",
          border: "var(--kl-amber-border, rgba(245, 158, 11, 0.25))",
          defaultGlyph: "◎",
        };
      case "at-risk":
      case "late":
        return {
          bg: "var(--kl-rose-bg, rgba(225, 29, 72, 0.08))",
          color: "var(--kl-rose, #E11D48)",
          border: "var(--kl-rose-border, rgba(225, 29, 72, 0.25))",
          defaultGlyph: "✕",
        };
      case "indigo":
        return {
          bg: "var(--kl-indigo-bg, rgba(91, 91, 214, 0.08))",
          color: "var(--kl-indigo, #5B5BD6)",
          border: "var(--kl-indigo-border, rgba(91, 91, 214, 0.25))",
          defaultGlyph: "◆",
        };
      case "neutral":
      default:
        return {
          bg: "var(--kl-surface-1, #ECECEB)",
          color: "var(--kl-text-secondary, #6B6B70)",
          border: "var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
          defaultGlyph: "•",
        };
    }
  };

  const v = getVariantStyles();

  return (
    <span
      className={`kl-badge kl-badge-${variant} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        borderRadius: "var(--kl-radius-pill, 9999px)",
        padding: isSm ? "0.15rem 0.5rem" : "0.25rem 0.65rem",
        fontSize: isSm ? "10px" : "11px",
        fontWeight: 500,
        lineHeight: 1,
        backgroundColor: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        fontFamily: "var(--font-sans, inherit)",
        letterSpacing: "0.01em",
        ...style,
      }}
    >
      <span style={{ fontSize: isSm ? "9px" : "10px", lineHeight: 1 }}>{glyph || v.defaultGlyph}</span>
      <span>{children}</span>
    </span>
  );
}
