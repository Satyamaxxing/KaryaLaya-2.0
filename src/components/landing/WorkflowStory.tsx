"use client";

import React, { useRef } from "react";
import { useGsapContext } from "@/lib/motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WebDevVisual, VideoProductionVisual, SocialMediaVisual, BrandDesignVisual } from "./ServiceVisuals";

export default function WorkflowStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useGsapContext(
    () => {
      if (!sectionRef.current) return;

      gsap.fromTo(
        sectionRef.current.querySelectorAll(".flow-card-anim"),
        { opacity: 0.2, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
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
      id="how-it-flows"
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
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            01 / 06 · CORE LOOP
          </div>

          <h2
            ref={headlineRef}
            style={{
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              fontWeight: 300,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              color: "#ffffff",
              maxWidth: "800px",
            }}
          >
            Client → Project → Deliverables → Tasks → Approval.
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.65)",
              maxWidth: "620px",
              lineHeight: 1.6,
            }}
          >
            Work is more than unlinked tasks. KaryaLaya binds execution directly to deliverables so team velocity translates straight into client approvals.
          </p>
        </div>

        {/* 4 Workstream Visual Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.75rem",
          }}
        >
          <div className="flow-card-anim">
            <WebDevVisual />
          </div>
          <div className="flow-card-anim">
            <VideoProductionVisual />
          </div>
          <div className="flow-card-anim">
            <SocialMediaVisual />
          </div>
          <div className="flow-card-anim">
            <BrandDesignVisual />
          </div>
        </div>

        {/* Flow Connector Banner */}
        <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem 2rem",
            borderRadius: "18px",
            backgroundColor: "rgba(10, 16, 29, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                fontSize: "16px",
              }}
            >
              ✓
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
                Single State Machine Across All Lanes
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>
                Internal updates automatically calculate delivery progress (0% to 100%) in real time.
              </span>
            </div>
          </div>

          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "11px",
              color: "#38bdf8",
              letterSpacing: "0.08em",
            }}
          >
            PROGRESSION: DRAFT → REVIEW → APPROVED
          </div>
        </div>
      </div>
    </section>
  );
}
