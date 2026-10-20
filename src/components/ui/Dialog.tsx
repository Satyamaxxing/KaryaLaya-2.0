"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "./Button";
import { MonoEyebrow } from "./Pill";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  maxWidth = "520px",
  className = "",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="kl-dialog-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-modal, 60)",
        backgroundColor: "rgba(11, 11, 12, 0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        animation: "fadeIn 180ms cubic-bezier(0.2, 0.7, 0.2, 1)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`kl-dialog-content ${className}`}
        style={{
          width: "100%",
          maxWidth,
          backgroundColor: "var(--kl-surface-0, #FFFFFF)",
          borderRadius: "var(--kl-radius-xl, 28px)",
          border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
          boxShadow: "var(--kl-shadow-modal, 0 25px 70px rgba(0, 0, 0, 0.12))",
          overflow: "hidden",
          animation: "scaleIn 220ms cubic-bezier(0.2, 0.7, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "1.5rem 1.75rem 1.25rem",
            borderBottom: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {eyebrow && <MonoEyebrow>{eyebrow}</MonoEyebrow>}
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                margin: 0,
                color: "var(--kl-text-primary, #0B0B0C)",
              }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "transparent",
              border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--kl-text-secondary, #6B6B70)",
              fontSize: "13px",
              transition: "background-color 150ms ease",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "1.75rem", overflowY: "auto", maxHeight: "70vh" }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: "1.25rem 1.75rem",
              borderTop: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
              backgroundColor: "var(--kl-surface-card-subtle, #FAFAF9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface TabsProps {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Tabs({ tabs, activeTab, onChange, className = "", style }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`kl-tabs ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.25rem",
        backgroundColor: "var(--kl-surface-1, #ECECEB)",
        borderRadius: "var(--kl-radius-pill, 9999px)",
        border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={{
              padding: "0.35rem 0.95rem",
              fontSize: "12px",
              fontWeight: isActive ? 500 : 400,
              fontFamily: "var(--font-sans, inherit)",
              borderRadius: "var(--kl-radius-pill, 9999px)",
              border: "none",
              cursor: "pointer",
              lineHeight: 1,
              transition: "all var(--kl-duration-fast, 180ms) var(--kl-ease-standard, ease)",
              backgroundColor: isActive ? "var(--kl-surface-0, #FFFFFF)" : "transparent",
              color: isActive ? "var(--kl-text-primary, #0B0B0C)" : "var(--kl-text-secondary, #6B6B70)",
              boxShadow: isActive ? "0 1px 4px rgba(0, 0, 0, 0.06)" : "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px",
                  padding: "0.1rem 0.35rem",
                  borderRadius: "var(--kl-radius-pill, 9999px)",
                  backgroundColor: isActive
                    ? "var(--kl-surface-2, #E5E5E3)"
                    : "var(--kl-surface-0, #FFFFFF)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface TableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Table({ headers, children, className = "", style }: TableProps) {
  return (
    <div
      className={`kl-table-container ${className}`}
      style={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
        borderRadius: "var(--kl-radius-lg, 20px)",
        backgroundColor: "var(--kl-surface-0, #FFFFFF)",
        boxShadow: "var(--kl-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.02))",
        ...style,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
              backgroundColor: "var(--kl-surface-card-subtle, #FAFAF9)",
            }}
          >
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: "0.85rem 1.25rem",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--kl-text-secondary, #6B6B70)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
