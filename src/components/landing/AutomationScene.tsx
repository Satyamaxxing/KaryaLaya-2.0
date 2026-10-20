"use client";

import React, { useRef } from "react";
import { useGsapContext } from "@/lib/motion";
import gsap from "gsap";

export default function AutomationScene() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGsapContext(
    () => {
      if (!sectionRef.current) return;

      gsap.fromTo(
        sectionRef.current.querySelector(".auto-panel-preview"),
        { opacity: 0.25, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
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
      id="automations"
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
              color: "#a3e635",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#a3e635" }} />
            06 / 06 · GOVERNED AUTOMATION
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
            Safe, governed automation. Never rogue side effects.
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.65)",
              maxWidth: "620px",
              lineHeight: 1.6,
            }}
          >
            Automations are explicitly separated from AI: defined with clear trigger-condition-action logic, human approval gates for sensitive operations, and complete transactional run logs.
          </p>
        </div>

        {/* Governed Automation Recipe Card */}
        <div
          className="auto-panel-preview"
          style={{
            backgroundColor: "rgba(10, 16, 29, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "24px",
            padding: "2.5rem",
            boxShadow: "0 24px 70px rgba(0, 0, 0, 0.6)",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* Header */}
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
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "#a3e635" }}>
                AUTOMATION RECIPE #AUTO-082
              </div>
              <div style={{ fontSize: "18px", fontWeight: 500, color: "#ffffff", marginTop: "2px" }}>
                Deliverable Approval → Production CDN & Social Schedule
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                RISK TIER: T2 (HUMAN GATE)
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                ACTIVE & AUDITED
              </span>
            </div>
          </div>

          {/* Trigger → Condition → Action Steps */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
            <div style={{ padding: "1.25rem", borderRadius: "14px", backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.4rem" }}>
                STEP 1 · TRIGGER
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
                Client Signs Off
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "4px" }}>
                Event `deliverable.approved` emitted with signed hash.
              </div>
            </div>

            <div style={{ padding: "1.25rem", borderRadius: "14px", backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.4rem" }}>
                STEP 2 · CONDITION GUARD
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
                Check Preconditions
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "4px" }}>
                Verify all tasks closed & manager review recorded.
              </div>
            </div>

            <div style={{ padding: "1.25rem", borderRadius: "14px", backgroundColor: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.4rem" }}>
                STEP 3 · ACTION
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
                Execute Deployment
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginTop: "4px" }}>
                Lock deliverable version & schedule distribution window.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", fontFamily: "var(--font-mono, monospace)" }}>
            <span>TRANSACTIONAL OUTBOX · ZERO SILENT FAILURES</span>
            <span style={{ color: "#a3e635" }}>RETRY & ROLLBACK SUPPORTED</span>
          </div>
        </div>
      </div>
    </section>
  );
}
