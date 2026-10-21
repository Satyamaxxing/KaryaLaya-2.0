"use client";

import React from "react";
import { useWorkState } from "@/lib/state/work-state-context";

export default function SettingsPage() {
  const { currentRole } = useWorkState();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px" }}>
      <div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--kl-text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Agency Configuration
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginTop: "0.25rem" }}>
          Workspace Settings
        </h1>
        <p style={{ fontSize: "13px", color: "var(--kl-text-muted)", marginTop: "0.25rem" }}>
          Configure agency branding, client portal domains, integrations, and permission boundaries.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Agency Profile */}
        <div
          style={{
            padding: "1.25rem",
            backgroundColor: "var(--kl-surface-0)",
            border: "1px solid var(--kl-border-hairline)",
            borderRadius: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>Agency Profile</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "1rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "var(--kl-text-muted)",
                  marginBottom: "0.35rem",
                }}
              >
                Agency Name
              </label>
              <input
                type="text"
                defaultValue="Apex Global Agency"
                className="input"
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  fontSize: "13px",
                  backgroundColor: "var(--kl-surface-1)",
                  border: "1px solid var(--kl-border-hairline)",
                  borderRadius: "0.375rem",
                  color: "#fff",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "var(--kl-text-muted)",
                  marginBottom: "0.35rem",
                }}
              >
                Primary Domain
              </label>
              <input
                type="text"
                defaultValue="agency.karyalaya.work"
                className="input"
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  fontSize: "13px",
                  backgroundColor: "var(--kl-surface-1)",
                  border: "1px solid var(--kl-border-hairline)",
                  borderRadius: "0.375rem",
                  color: "#fff",
                }}
              />
            </div>
          </div>
        </div>

        {/* Client Portal Configuration */}
        <div
          style={{
            padding: "1.25rem",
            backgroundColor: "var(--kl-surface-0)",
            border: "1px solid var(--kl-border-hairline)",
            borderRadius: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
            Client Portal Preferences
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>
                Client Approval Gate Enforcement
              </div>
              <div style={{ fontSize: "11px", color: "var(--kl-text-muted)" }}>
                Require explicit client sign-off before marking deliverables as complete
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              style={{ accentColor: "var(--kl-emerald)", width: "16px", height: "16px" }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--kl-border-hairline)",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500 }}>
                Internal Task Obfuscation
              </div>
              <div style={{ fontSize: "11px", color: "var(--kl-text-muted)" }}>
                Ensure internal revision notes and draft tasks never leak to client portal
              </div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              style={{ accentColor: "var(--kl-emerald)", width: "16px", height: "16px" }}
            />
          </div>
        </div>

        {/* Current Active Role info */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--kl-surface-1)",
            border: "1px solid var(--kl-border-subtle)",
            borderRadius: "0.75rem",
            fontSize: "12px",
            color: "var(--kl-text-muted)",
          }}
        >
          Current session running with simulated role:{" "}
          <strong style={{ color: "var(--kl-sky)" }}>{currentRole}</strong>. Use the persona
          switcher in the top bar to test other permissions.
        </div>
      </div>
    </div>
  );
}
