"use client";

import React from "react";
import { MonoEyebrow } from "./Pill";

export interface SpecSheetProps {
  title?: React.ReactNode;
  eyebrow?: string;
  metadata?: Array<{ label: string; value: string | number }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SpecSheet({
  title,
  eyebrow,
  metadata,
  actions,
  children,
  className = "",
  style,
}: SpecSheetProps) {
  return (
    <div
      className={`kl-specsheet ${className}`}
      style={{
        backgroundColor: "var(--kl-surface-0, #FFFFFF)",
        borderRadius: "var(--kl-radius-xl, 28px)",
        border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
        boxShadow: "var(--kl-shadow-lg, 0 20px 60px rgba(0, 0, 0, 0.08))",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {(title || eyebrow || actions) && (
        <div
          style={{
            padding: "1.5rem 1.75rem 1.25rem",
            borderBottom: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            backgroundColor: "var(--kl-surface-card-subtle, #FAFAF9)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {eyebrow && <MonoEyebrow>{eyebrow}</MonoEyebrow>}
            {title && (
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: "var(--kl-text-primary, #0B0B0C)",
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}
          </div>
          {actions && <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>{actions}</div>}
        </div>
      )}

      <div style={{ padding: "1.75rem" }}>{children}</div>

      {metadata && metadata.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${metadata.length}, 1fr)`,
            borderTop: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
            backgroundColor: "var(--kl-surface-1, #ECECEB)",
          }}
        >
          {metadata.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: "0.85rem 1.25rem",
                borderRight:
                  idx < metadata.length - 1
                    ? "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))"
                    : "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--kl-text-muted, #8E8E93)",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--kl-text-primary, #0B0B0C)",
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`kl-panel ${className}`}
      style={{
        backgroundColor: "var(--kl-surface-0, #FFFFFF)",
        borderRadius: "var(--kl-radius-lg, 20px)",
        border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
        boxShadow: "var(--kl-shadow-card, 0 4px 20px rgba(0, 0, 0, 0.04))",
        padding: "1.5rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
