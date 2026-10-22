"use client";

import React from "react";

interface CapabilityIcon {
  label: string;
  src: string;
}

const CAPABILITY_ICONS: CapabilityIcon[] = [
  {
    label: "Projects",
    src: "/assets/icons/projects.svg",
  },
  {
    label: "Deadlines",
    src: "/assets/icons/tasks-deadlines.svg",
  },
  {
    label: "Teams",
    src: "/assets/icons/team-collaboration.svg",
  },
  {
    label: "Client Portal",
    src: "/assets/icons/client-portal.svg",
  },
  {
    label: "AI Automations",
    src: "/assets/icons/ai-automations.svg",
  },
  {
    label: "Workflows",
    src: "/assets/icons/workflows.svg",
  },
  {
    label: "Analytics",
    src: "/assets/icons/analytics.svg",
  },
  {
    label: "Security",
    src: "/assets/icons/security.svg",
  },
  {
    label: "Workspaces",
    src: "/assets/icons/layers.svg",
  },
  {
    label: "Instant Speed",
    src: "/assets/icons/zap.svg",
  },
];

// Repeat 2 times per cycle (20 icons) so 1 cycle is >2600px wide, and 3 cycles for a seamless -33.333333% loop
const CYCLE_ICONS = [
  ...CAPABILITY_ICONS,
  ...CAPABILITY_ICONS,
];

const SETS = [0, 1, 2];

export default function IntegrationLogoStrip() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        padding: "0.5rem 0",
        margin: "0 auto",
        overflow: "hidden",
        background: "transparent",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      <div
        className="qronos-marquee-track"
        style={{
          display: "flex",
          width: "max-content",
          gap: "72px",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {SETS.map((setIdx) =>
          CYCLE_ICONS.map((item, idx) => (
            <div
              key={`${setIdx}-${idx}`}
              className="qronos-icon-item"
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                flexShrink: 0,
                cursor: "default",
                userSelect: "none",
              }}
            >
              <img
                src={item.src}
                alt={item.label}
                width={50}
                height={50}
                className="qronos-marquee-svg"
                style={{
                  width: "clamp(44px, 3.2vw, 54px)",
                  height: "clamp(44px, 3.2vw, 54px)",
                  opacity: 0.85,
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                  filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.7))",
                  transition:
                    "opacity 200ms ease, transform 250ms cubic-bezier(0.16, 1, 0.3, 1), filter 250ms ease",
                }}
              />
              <span
                className="qronos-marquee-label"
                style={{
                  fontSize: "clamp(10px, 0.85vw, 12px)",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.65)",
                  whiteSpace: "nowrap",
                  transition: "color 200ms ease",
                }}
              >
                {item.label}
              </span>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes qronosMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333333%);
          }
        }
        .qronos-marquee-track {
          animation: qronosMarquee 50s linear infinite;
          will-change: transform;
          transform: translateZ(0);
        }
        .qronos-icon-item:hover .qronos-marquee-svg {
          opacity: 1 !important;
          transform: scale(1.15) translateY(-3px);
          filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.6)) !important;
        }
        .qronos-icon-item:hover .qronos-marquee-label {
          color: #ffffff !important;
        }
        @media (max-width: 768px) {
          .qronos-marquee-svg {
            filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}
