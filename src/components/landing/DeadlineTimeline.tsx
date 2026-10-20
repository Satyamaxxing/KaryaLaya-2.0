"use client";

import React, { useRef } from "react";
import { useGsapContext } from "@/lib/motion";
import gsap from "gsap";

export default function DeadlineTimeline() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGsapContext(
    () => {
      if (!sectionRef.current) return;

      gsap.fromTo(
        sectionRef.current.querySelectorAll(".timeline-node-anim"),
        { opacity: 0.3, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          stagger: 0.12,
          duration: 0.7,
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
      id="deadlines"
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
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
            02 / 06 · DEADLINE INTELLIGENCE
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
            Deadlines are not passive dates. They understand the critical path.
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.65)",
              maxWidth: "620px",
              lineHeight: 1.6,
            }}
          >
            When a predecessor task slips by two days, KaryaLaya immediately computes downstream impacts, flags at-risk milestones, and surfaces the exact reason why.
          </p>
        </div>

        {/* Interactive Timeline Cascade Specimen */}
        <div
          style={{
            backgroundColor: "rgba(10, 16, 29, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            padding: "2rem",
            boxShadow: "0 24px 70px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Timeline Nodes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              {
                step: "01",
                title: "Landing Page · Final Polish",
                owner: "Satyam Kumar",
                date: "Wed 14 Oct",
                status: "DELAYED (+2d)",
                statusColor: "#f43f5e",
                detail: "Design revisions on hero shader extended review duration.",
              },
              {
                step: "02",
                title: "Launch Reel V3 · Export & Master",
                owner: "Rishav V.",
                date: "Thu 15 Oct",
                status: "BLOCKED BY STEP 01",
                statusColor: "#f59e0b",
                detail: "Video CTA cannot be finalized until staging URL is verified.",
              },
              {
                step: "03",
                title: "Content Calendar · Schedule",
                owner: "Aisha N.",
                date: "Fri 16 Oct",
                status: "AT RISK (SLACK: 0h)",
                statusColor: "#f59e0b",
                detail: "Aisha assigned 118% load across Friday publishing slots.",
              },
              {
                step: "04",
                title: "Client Launch Gate · Acme Global",
                owner: "Meera Sen",
                date: "Mon 19 Oct",
                status: "FORECAST UPDATED",
                statusColor: "#38bdf8",
                detail: "Client review window preserved: moved from 16 Oct to 19 Oct cleanly.",
              },
            ].map((node, i) => (
              <div
                key={i}
                className="timeline-node-anim"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  borderRadius: "14px",
                  backgroundColor: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.4)",
                      marginTop: "2px",
                    }}
                  >
                    {node.step}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                      {node.title}
                    </span>
                    <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>
                      Owner: <strong style={{ color: "#ffffff" }}>{node.owner}</strong> · {node.detail}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                    {node.date}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "0.2rem 0.55rem",
                      borderRadius: "9999px",
                      color: node.statusColor,
                      backgroundColor: `${node.statusColor}18`,
                      border: `1px solid ${node.statusColor}40`,
                    }}
                  >
                    {node.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Causal Explanation Callout */}
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "12px",
              color: "#fde68a",
            }}
          >
            <span style={{ fontSize: "16px" }}>ℹ</span>
            <span>
              <strong>Deterministic Causal Engine:</strong> No guessing or fake status badges. The dependency graph evaluates slack and propagates shifts across the delivery pipeline in under 2 seconds.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
