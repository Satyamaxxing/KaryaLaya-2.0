"use client";

import React, { useRef } from "react";
import { useGsapContext } from "@/lib/motion";
import gsap from "gsap";

export default function CommunicationScene() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGsapContext(
    () => {
      if (!sectionRef.current) return;

      gsap.fromTo(
        sectionRef.current.querySelectorAll(".comm-card-anim"),
        { opacity: 0.2, y: 25 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
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
      id="communication"
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
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#38bdf8" }} />
            03 / 06 · CONTEXTUAL COLLABORATION
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
            Communication lives on the deliverable, with strict audience boundaries.
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.65)",
              maxWidth: "620px",
              lineHeight: 1.6,
            }}
          >
            No lost context in 20-person Slack channels. Team threads stay strictly internal. When ready, summarize and promote verified updates to the client portal with one click.
          </p>
        </div>

        {/* Dual Panel: Internal Discussion vs Client-Visible Portal */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2rem",
          }}
        >
          {/* 1. Internal Team View */}
          <div
            className="comm-card-anim"
            style={{
              backgroundColor: "rgba(10, 16, 29, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                >
                  AUDIENCE: INTERNAL
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.45)" }}>Launch Reel V3</span>
              </div>
              <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", fontFamily: "var(--font-mono, monospace)" }}>
                ENCRYPTED
              </span>
            </div>

            {/* Internal Comments Mock */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ padding: "0.85rem", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                  <strong style={{ color: "#ffffff" }}>Rohan Varma (Manager)</strong>
                  <span style={{ fontFamily: "var(--font-mono, monospace)" }}>10:14 AM</span>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.45 }}>
                  The transition at 0:24 is too snappy. Swap in the ambient b-roll clip before we send to Sarah.
                </div>
              </div>

              <div style={{ padding: "0.85rem", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                  <strong style={{ color: "#ffffff" }}>Satyam Kumar (Member)</strong>
                  <span style={{ fontFamily: "var(--font-mono, monospace)" }}>10:42 AM</span>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.45 }}>
                  Done! Color graded in Rec.709 and re-exported. Ready for client preview window.
                </div>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "var(--font-mono, monospace)" }}>
              🔒 Never visible to client portal accounts.
            </div>
          </div>

          {/* 2. Client-Visible Portal View */}
          <div
            className="comm-card-anim"
            style={{
              backgroundColor: "rgba(10, 16, 29, 0.85)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "20px",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                  }}
                >
                  AUDIENCE: CLIENT VISIBLE
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.45)" }}>Published Update</span>
              </div>
              <span style={{ fontSize: "11px", color: "#10b981", fontFamily: "var(--font-mono, monospace)" }}>
                VERIFIED
              </span>
            </div>

            {/* Client Update Specimen */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ padding: "1rem", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                  <strong style={{ color: "#10b981" }}>Apex Global Agency → Sarah Jenkins</strong>
                  <span style={{ fontFamily: "var(--font-mono, monospace)" }}>11:00 AM</span>
                </div>
                <div style={{ fontSize: "13px", color: "#ffffff", lineHeight: 1.5 }}>
                  &ldquo;Launch Reel V3 is ready for your review. We incorporated the brand audio track and color graded the master 4K cut.&rdquo;
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#38bdf8", fontFamily: "var(--font-mono, monospace)" }}>
              <span>DELIVERABLE VERSION: v3 (CONTENT HASH: #a8f2)</span>
              <span>1-CLICK APPROVE ENABLED</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
