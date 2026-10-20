"use client";

import React, { useRef } from "react";
import { useGsapContext } from "@/lib/motion";
import gsap from "gsap";

export default function ClientPortalScene() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGsapContext(
    () => {
      if (!sectionRef.current) return;

      gsap.fromTo(
        sectionRef.current.querySelector(".portal-card-preview"),
        { opacity: 0.3, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "bottom 85%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    },
    sectionRef,
    []
  );

  return (
    <section
      id="client-portal"
      ref={sectionRef}
      style={{
        position: "relative",
        padding: "7rem 2rem",
        backgroundColor: "var(--kl-canvas-subtle, #050811)",
        color: "#ffffff",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Section Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "3.5rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            04 / 06 · CLIENT PORTAL
          </div>

          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              fontWeight: 300,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              color: "#ffffff",
              maxWidth: "800px",
            }}
          >
            Clients see calm progress, not internal delivery chaos.
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.65)",
              maxWidth: "620px",
              lineHeight: 1.6,
            }}
          >
            A dedicated, zero-friction portal where client contacts review deliverables, compare versions, and approve with a single binding click—all without seeing internal task churn.
          </p>
        </div>

        {/* Client Portal Showcase Card */}
        <div
          className="portal-card-preview"
          style={{
            backgroundColor: "rgba(10, 16, 29, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "24px",
            padding: "2.5rem",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* Portal Top Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "1.25rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                CLIENT PORTAL · ACME GLOBAL
              </div>
              <div style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff", marginTop: "2px" }}>
                Brand Growth Campaign 2026
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>
                  OVERALL PROGRESS
                </div>
                <div style={{ fontSize: "22px", fontWeight: 600, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
                  78%
                </div>
              </div>

              <div
                style={{
                  width: "120px",
                  height: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div style={{ width: "78%", height: "100%", backgroundColor: "#10b981", borderRadius: "9999px" }} />
              </div>
            </div>
          </div>

          {/* Pending Approval Hero Card */}
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "18px",
              padding: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                  }}
                >
                  AWAITING YOUR REVIEW
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", fontFamily: "var(--font-mono, monospace)" }}>
                  VERSION 3 · PRORES 4K
                </span>
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>
                Launch Reel V3 · Product Anthem
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.65)" }}>
                Updated audio mix and ambient b-roll cuts as requested in round 2.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                type="button"
                data-cursor="Approve"
                style={{
                  backgroundColor: "#10b981",
                  color: "#010307",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "0.6rem 1.4rem",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>✓</span>
                <span>Approve Deliverable</span>
              </button>

              <button
                type="button"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "9999px",
                  padding: "0.6rem 1.2rem",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Request Revision
              </button>
            </div>
          </div>

          {/* Feature Checklist Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.65)",
            }}
          >
            <div>✓ Magic link login (no password barriers)</div>
            <div>✓ Content-hash immutable version audit</div>
            <div>✓ Revision budget safeguard (prevents creep)</div>
            <div>✓ Client-safe published milestone calendar</div>
          </div>
        </div>
      </div>
    </section>
  );
}
