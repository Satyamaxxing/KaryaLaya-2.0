"use client";

import React from "react";

/**
 * 1. Web Development Service Visual
 * Browser frame, staging URL, live build status, code-to-preview layout
 */
export function WebDevVisual({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      data-cursor="Explore"
      className={`service-visual web-dev-visual ${className}`}
      style={{
        backgroundColor: "rgba(10, 16, 29, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans, sans-serif)",
        ...style,
      }}
    >
      {/* Browser Chrome Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.65rem 1rem",
          backgroundColor: "rgba(6, 9, 19, 0.95)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
          <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#10b981" }} />
        </div>

        {/* Staging URL Pill */}
        <div
          style={{
            flex: 1,
            maxWidth: "340px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.25rem 0.75rem",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "9999px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.75)",
          }}
        >
          <span style={{ color: "#10b981" }}>🔒</span>
          <span>https://staging.acme-agency.live/v3</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              boxShadow: "0 0 8px #10b981",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "10px",
              color: "#10b981",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            LIVE SYNC
          </span>
        </div>
      </div>

      {/* Viewport Content */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "#38bdf8", letterSpacing: "0.1em" }}>
              WORKSTREAM · WEB DEVELOPMENT
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
              Client Staging Environment
            </span>
          </div>
          <span
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#10b981",
              fontSize: "11px",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            DEPLOYED · v2.4.1
          </span>
        </div>

        {/* Wireframe Mock Site Preview */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ height: "12px", width: "70%", backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "4px" }} />
            <div style={{ height: "8px", width: "90%", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "4px" }} />
            <div style={{ height: "8px", width: "80%", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "4px" }} />
            <div style={{ height: "24px", width: "80px", backgroundColor: "#5B5BD6", borderRadius: "9999px", marginTop: "0.5rem" }} />
          </div>
          <div
            style={{
              height: "90px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderRadius: "8px",
              border: "1px dashed rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "10px",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            HERO 3D VIEWPORT
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255, 255, 255, 0.45)", fontFamily: "var(--font-mono, monospace)" }}>
          <span>SSL ENCRYPTED · NEXT.JS 16 · TURBOPACK</span>
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>ILLUSTRATIVE SAMPLE</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Video Production Service Visual
 * Multi-track NLE timeline, playhead, timecode, color grade indicators
 */
export function VideoProductionVisual({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      data-cursor="Explore"
      className={`service-visual video-production-visual ${className}`}
      style={{
        backgroundColor: "rgba(10, 16, 29, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans, sans-serif)",
        ...style,
      }}
    >
      {/* Top Transport & Timecode Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.65rem 1rem",
          backgroundColor: "rgba(6, 9, 19, 0.95)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#ef4444", fontSize: "12px" }}>● REC</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>
            Launch Reel V3 · 4K ProRes
          </span>
        </div>

        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
            letterSpacing: "0.08em",
            color: "#38bdf8",
            padding: "0.15rem 0.6rem",
            backgroundColor: "rgba(56, 189, 248, 0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          01 : 14 : 22 : 18
        </div>
      </div>

      {/* Multi-Track Timeline */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* Track V1: Video Primary */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "24px", fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>V1</span>
          <div style={{ flex: 1, height: "22px", display: "flex", gap: "3px", backgroundColor: "rgba(255, 255, 255, 0.04)", borderRadius: "4px", padding: "2px" }}>
            <div style={{ flex: 3, backgroundColor: "rgba(56, 189, 248, 0.4)", borderRadius: "3px", display: "flex", alignItems: "center", paddingLeft: "6px", fontSize: "9px", color: "#ffffff" }}>A-Roll Intro</div>
            <div style={{ flex: 2, backgroundColor: "rgba(16, 185, 129, 0.4)", borderRadius: "3px", display: "flex", alignItems: "center", paddingLeft: "6px", fontSize: "9px", color: "#ffffff" }}>Feature Cut</div>
            <div style={{ flex: 4, backgroundColor: "rgba(99, 102, 241, 0.4)", borderRadius: "3px", display: "flex", alignItems: "center", paddingLeft: "6px", fontSize: "9px", color: "#ffffff" }}>Outro Call</div>
          </div>
        </div>

        {/* Track V2: Overlay & Graphics */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "24px", fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>V2</span>
          <div style={{ flex: 1, height: "18px", display: "flex", gap: "3px", backgroundColor: "rgba(255, 255, 255, 0.04)", borderRadius: "4px", padding: "2px" }}>
            <div style={{ width: "25%", marginLeft: "25%", backgroundColor: "rgba(245, 158, 11, 0.4)", borderRadius: "3px", display: "flex", alignItems: "center", paddingLeft: "6px", fontSize: "8px", color: "#ffffff" }}>Motion Titles</div>
            <div style={{ width: "20%", marginLeft: "15%", backgroundColor: "rgba(244, 63, 94, 0.4)", borderRadius: "3px", display: "flex", alignItems: "center", paddingLeft: "6px", fontSize: "8px", color: "#ffffff" }}>Lower Third</div>
          </div>
        </div>

        {/* Track A1: Audio Master */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "24px", fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>A1</span>
          <div style={{ flex: 1, height: "18px", backgroundColor: "rgba(16, 185, 129, 0.2)", borderRadius: "4px", padding: "2px", display: "flex", alignItems: "center", paddingLeft: "6px", fontSize: "8px", color: "#10b981" }}>
            Dialogue Stem · Master -14 LUFS
          </div>
        </div>

        {/* Timeline Bottom Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", fontSize: "10px", color: "rgba(255, 255, 255, 0.45)", fontFamily: "var(--font-mono, monospace)" }}>
          <span>COLOR GRADE: REC.709 · SOUND DESIGN: 5.1 STEM</span>
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>ILLUSTRATIVE SAMPLE</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Social Media Management Service Visual
 * 30-day distribution matrix, multi-channel schedule, approval status
 */
export function SocialMediaVisual({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      data-cursor="Explore"
      className={`service-visual social-media-visual ${className}`}
      style={{
        backgroundColor: "rgba(10, 16, 29, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans, sans-serif)",
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.65rem 1rem",
          backgroundColor: "rgba(6, 9, 19, 0.95)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>
            Monthly Campaign Grid
          </span>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono, monospace)", color: "#10b981" }}>
            [30 DAYS ACTIVE]
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.3rem" }}>
          {["IG", "LI", "X", "YT"].map((ch) => (
            <span
              key={ch}
              style={{
                fontSize: "9px",
                fontFamily: "var(--font-mono, monospace)",
                padding: "2px 5px",
                borderRadius: "3px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                color: "rgba(255, 255, 255, 0.8)",
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>

      {/* Mini Calendar Grid Preview */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} style={{ fontSize: "9px", fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.4)" }}>
              {d}
            </span>
          ))}

          {Array.from({ length: 14 }).map((_, i) => {
            const hasPost = i === 2 || i === 4 || i === 8 || i === 11;
            const isApproved = i === 2 || i === 4;
            return (
              <div
                key={i}
                style={{
                  height: "26px",
                  borderRadius: "6px",
                  backgroundColor: hasPost
                    ? isApproved
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(245, 158, 11, 0.15)"
                    : "rgba(255, 255, 255, 0.02)",
                  border: hasPost
                    ? isApproved
                      ? "1px solid rgba(16, 185, 129, 0.4)"
                      : "1px solid rgba(245, 158, 11, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  color: hasPost ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "rgba(255, 255, 255, 0.45)", fontFamily: "var(--font-mono, monospace)" }}>
          <span>AUTO-SCHEDULE · CLIENT GATED</span>
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>ILLUSTRATIVE SAMPLE</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Brand Design Service Visual
 * Type specimen scale, color swatches, identity kit
 */
export function BrandDesignVisual({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      data-cursor="Explore"
      className={`service-visual brand-design-visual ${className}`}
      style={{
        backgroundColor: "rgba(10, 16, 29, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans, sans-serif)",
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.65rem 1rem",
          backgroundColor: "rgba(6, 9, 19, 0.95)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>
          Founder Brand Kit · Specimen
        </span>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "#a855f7" }}>
          STYLEGUIDE v1.0
        </span>
      </div>

      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Type Specimen */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "32px", fontWeight: 300, lineHeight: 1, color: "#ffffff" }}>Aa</div>
            <div style={{ fontSize: "10px", fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>
              INTER / GEIST SANS · WEIGHTS 300 / 500 / 900
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.6)" }}>
            <div>HEADLINE: 48px / -0.04em</div>
            <div>MONO: 11px / 0.12em</div>
          </div>
        </div>

        {/* Color Palette Swatches */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {[
            { name: "Canvas", hex: "#010307", border: "rgba(255,255,255,0.2)" },
            { name: "Ink White", hex: "#F5F5F5", border: "transparent" },
            { name: "Emerald", hex: "#10B981", border: "transparent" },
            { name: "Indigo AI", hex: "#5B5BD6", border: "transparent" },
          ].map((c) => (
            <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div
                style={{
                  height: "26px",
                  borderRadius: "6px",
                  backgroundColor: c.hex,
                  border: `1px solid ${c.border}`,
                }}
              />
              <span style={{ fontSize: "8px", fontFamily: "var(--font-mono, monospace)", color: "rgba(255, 255, 255, 0.6)" }}>
                {c.hex}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255, 255, 255, 0.45)", fontFamily: "var(--font-mono, monospace)" }}>
          <span>ASSETS PACKAGED FOR WEB & PRINT</span>
          <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>ILLUSTRATIVE SAMPLE</span>
        </div>
      </div>
    </div>
  );
}
