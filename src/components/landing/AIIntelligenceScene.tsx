"use client";

import React, { useRef } from "react";
import { useGsapContext } from "@/lib/motion";
import gsap from "gsap";

export default function AIIntelligenceScene() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGsapContext(
    () => {
      if (!sectionRef.current) return;

      gsap.fromTo(
        sectionRef.current.querySelector(".ai-panel-preview"),
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
      id="ai-intelligence"
      ref={sectionRef}
      style={{
        position: "relative",
        padding: "7rem 2rem",
        backgroundColor: "var(--kl-canvas-deep, #070b14)",
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
              color: "#5B5BD6",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#5B5BD6" }} />
            05 / 06 · EXPLAINABLE AI INTELLIGENCE
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
            Explainable AI with clear evidence. No magical hallucinations.
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.65)",
              maxWidth: "620px",
              lineHeight: 1.6,
            }}
          >
            AI in KaryaLaya is permission-aware and auditable: every recommendation shows its summary, step-by-step causal chain, and exact underlying data evidence.
          </p>
        </div>

        {/* Explainable AI Card Specimen */}
        <div
          className="ai-panel-preview"
          style={{
            backgroundColor: "rgba(10, 16, 29, 0.9)",
            border: "1px solid rgba(91, 91, 214, 0.35)",
            borderRadius: "24px",
            padding: "2.5rem",
            boxShadow: "0 24px 70px rgba(91, 91, 214, 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
          }}
        >
          {/* AI Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(91, 91, 214, 0.2)",
                  color: "#5B5BD6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                ✦
              </span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>
                Risk & Capacity Assessment · Brand Growth Campaign
              </span>
            </div>

            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "11px",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(91, 91, 214, 0.15)",
                color: "#818cf8",
                border: "1px solid rgba(91, 91, 214, 0.3)",
              }}
            >
              RULE-BASED + AI ASSISTED · CONFIDENCE: 94%
            </span>
          </div>

          {/* 3-Step Explainability Structure */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {/* 1. Summary */}
            <div style={{ padding: "1.25rem", borderRadius: "14px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.5rem" }}>
                01 · EXECUTIVE SUMMARY
              </div>
              <div style={{ fontSize: "13px", color: "#ffffff", lineHeight: 1.5 }}>
                Friday launch milestone is at risk due to dependency cascade from Landing Page revision cycle and Aisha&apos;s workload overload.
              </div>
            </div>

            {/* 2. Causal Chain */}
            <div style={{ padding: "1.25rem", borderRadius: "14px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.5rem" }}>
                02 · CAUSAL CHAIN
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.6, fontFamily: "var(--font-mono, monospace)" }}>
                Landing Page delay (+2d) → blocks Launch Reel CTA → Content Calendar cannot schedule → Client review window slips by 1 business day.
              </div>
            </div>

            {/* 3. Evidence */}
            <div style={{ padding: "1.25rem", borderRadius: "14px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.5rem" }}>
                03 · UNDERLYING EVIDENCE
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.5 }}>
                • Task #104 status: REVISION_REQUIRED<br />
                • Member #03 (Aisha) load ratio: 118%<br />
                • Deliverable #02 dependency: HARD
              </div>
            </div>
          </div>

          <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", fontFamily: "var(--font-mono, monospace)" }}>
            * AI respects organizational RBAC and never accesses data outside the requesting user&apos;s permissions.
          </div>
        </div>
      </div>
    </section>
  );
}
