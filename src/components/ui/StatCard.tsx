"use client";

import React from "react";
import { MonoEyebrow } from "./Pill";

export interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function StatCard({
  label,
  value,
  subtext,
  badge,
  onClick,
  accentColor,
  className = "",
  style,
}: StatCardProps) {
  const isClickable = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`kl-stat-card ${isClickable ? "kl-stat-card-clickable" : ""} ${className}`}
      style={{
        backgroundColor: "var(--kl-surface-card, #FFFFFF)",
        border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
        borderRadius: "var(--kl-radius-lg, 20px)",
        padding: "1.25rem 1.5rem",
        boxShadow: "var(--kl-shadow-sm, 0 1px 3px rgba(0,0,0,0.02))",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "0.75rem",
        cursor: isClickable ? "pointer" : "default",
        transition:
          "transform var(--kl-duration-fast, 180ms) var(--kl-ease-standard, ease), box-shadow var(--kl-duration-fast, 180ms) ease, border-color var(--kl-duration-fast, 180ms) ease",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {accentColor && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: accentColor,
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <MonoEyebrow dotColor={accentColor}>{label}</MonoEyebrow>
        {badge}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "36px",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            fontFamily: "var(--font-sans, inherit)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--kl-text-primary, #0B0B0C)",
          }}
        >
          {value}
        </span>
        {subtext && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--kl-text-secondary, #6B6B70)",
              fontFamily: "var(--font-sans, inherit)",
            }}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

export interface DataRowProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  sublabel?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function DataRow({
  label,
  value,
  sublabel,
  action,
  onClick,
  className = "",
  style,
}: DataRowProps) {
  const isClickable = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`kl-data-row ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.85rem 1rem",
        borderBottom: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
        cursor: isClickable ? "pointer" : "default",
        transition: "background-color var(--kl-duration-fast, 180ms) ease",
        gap: "1rem",
        ...style,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--kl-text-primary, #0B0B0C)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--kl-text-secondary, #6B6B70)",
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.02em",
            }}
          >
            {sublabel}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
        {value && (
          <div
            style={{
              fontSize: "13px",
              fontVariantNumeric: "tabular-nums",
              color: "var(--kl-text-primary, #0B0B0C)",
              fontWeight: 500,
            }}
          >
            {value}
          </div>
        )}
        {action}
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  monoNote?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function EmptyState({
  title,
  description,
  monoNote,
  action,
  actionLabel,
  onAction,
  icon = "✓",
  className = "",
  style,
}: EmptyStateProps) {
  return (
    <div
      className={`kl-empty-state ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 1.5rem",
        borderRadius: "var(--kl-radius-lg, 20px)",
        backgroundColor: "var(--kl-surface-card-subtle, #FAFAF9)",
        border: "1px dashed var(--kl-border-hairline, rgba(11, 11, 12, 0.1))",
        gap: "0.75rem",
        ...style,
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: "var(--kl-surface-2, #E5E5E3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          color: "var(--kl-text-secondary, #6B6B70)",
        }}
      >
        {icon}
      </div>

      <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--kl-text-primary, #0B0B0C)" }}>
        {title}
      </div>

      {description && (
        <div
          style={{
            fontSize: "13px",
            color: "var(--kl-text-secondary, #6B6B70)",
            maxWidth: "360px",
            lineHeight: 1.45,
          }}
        >
          {description}
        </div>
      )}

      {monoNote && (
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--kl-text-muted, #8E8E93)",
            marginTop: "0.25rem",
          }}
        >
          {monoNote}
        </div>
      )}

      {action && <div style={{ marginTop: "0.5rem" }}>{action}</div>}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: "0.5rem",
            padding: "0.45rem 1rem",
            fontSize: "12px",
            fontWeight: 500,
            borderRadius: "var(--kl-radius-pill, 9999px)",
            backgroundColor: "var(--kl-ink, #0B0B0C)",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
