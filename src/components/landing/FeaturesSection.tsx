"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext, useReducedMotion, getReducedMotion } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type WorkstreamStatus =
  | "Not Started"
  | "In Progress"
  | "In Review"
  | "Revision Required"
  | "Approved"
  | "Completed";

export interface Milestone {
  label: string;
  percent: number;
  state: "completed" | "active" | "pending";
  glowColor?: string;
}

export interface WorkstreamBase {
  id: string;
  title: string;
  shortTitle?: string;
  owner: string;
  dotColor: string;
  barLeft: number;
  themeColor: string;
  activePhase: number;
}

export interface WorkstreamPhaseState {
  status: WorkstreamStatus;
  statusBadgeClass: string;
  statusDotClass: string;
  barWidth: number;
  meta: string;
  sidebarStat?: string;
  milestones: Milestone[];
}

export interface DependencyConnector {
  id: string;
  fromName: string;
  toName: string;
  fromIdx: number;
  toIdx: number;
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
  path: string;
  gradientId: string;
  fromColor: string;
  toColor: string;
}

/**
 * Direct mathematical Cubic Bézier point calculation B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
 * Guarantees zero transform or coordinate drift across all viewport sizes
 */
export function getCubicBezierPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt;
  const b = 3 * mt2 * t;
  const c = 3 * mt * t2;
  const d = t2 * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

/**
 * 6 Process boxes in a compact, alternating sequence (Left -> Right -> Left -> Right -> Left -> Right):
 * Left boxes: barLeft: 6% (spans 6% -> 44%, finish at X = 440)
 * Right boxes: barLeft: 52% (spans 52% -> 90%, finish at X = 900)
 */
const WORKSTREAM_BASES: WorkstreamBase[] = [
  {
    id: "ws-1",
    title: "Landing Page Development",
    shortTitle: "Landing Dev",
    owner: "Satyam",
    dotColor: "bg-cyan-400",
    barLeft: 6,
    themeColor: "#38bdf8",
    activePhase: 0,
  },
  {
    id: "ws-2",
    title: "Launch Reel — V3",
    shortTitle: "Launch Reel",
    owner: "Rishav",
    dotColor: "bg-rose-400",
    barLeft: 52,
    themeColor: "#f43f5e",
    activePhase: 1,
  },
  {
    id: "ws-3",
    title: "Content Calendar",
    shortTitle: "Content Cal",
    owner: "Aisha",
    dotColor: "bg-emerald-400",
    barLeft: 6,
    themeColor: "#34d399",
    activePhase: 2,
  },
  {
    id: "ws-4",
    title: "Founder Brand Kit",
    shortTitle: "Brand Kit",
    owner: "Arjun",
    dotColor: "bg-violet-400",
    barLeft: 52,
    themeColor: "#c084fc",
    activePhase: 3,
  },
  {
    id: "ws-5",
    title: "Client Portal Review",
    shortTitle: "Client Review",
    owner: "Agency Gate",
    dotColor: "bg-amber-300",
    barLeft: 6,
    themeColor: "#fbbf24",
    activePhase: 4,
  },
  {
    id: "ws-6",
    title: "Campaign Distribution",
    shortTitle: "Campaign",
    owner: "Growth Team",
    dotColor: "bg-sky-300",
    barLeft: 52,
    themeColor: "#38bdf8",
    activePhase: 5,
  },
];

/**
 * Flowing Cubic Bézier connectors linking each task's exact endpoint to the next task's starting point:
 * 1. Landing Page End (440, 52) -> Launch Reel Start (520, 152)
 * 2. Launch Reel End (900, 152) -> Content Calendar Start (60, 252)
 * 3. Content Calendar End (440, 252) -> Founder Brand Kit Start (520, 348)
 * 4. Founder Brand Kit End (900, 348) -> Client Portal Review Start (60, 450)
 * 5. Client Portal Review End (440, 450) -> Campaign Distribution Start (520, 548)
 */
const DEPENDENCY_CONNECTORS: DependencyConnector[] = [
  {
    id: "dep-1-2",
    fromName: "Landing Page Dev",
    toName: "Launch Reel",
    fromIdx: 0,
    toIdx: 1,
    p0: [440, 52],
    p1: [485, 52],
    p2: [475, 152],
    p3: [520, 152],
    path: "M 440 52 C 485 52, 475 152, 520 152",
    gradientId: "dep-grad-1",
    fromColor: "#38bdf8",
    toColor: "#f43f5e",
  },
  {
    id: "dep-2-3",
    fromName: "Launch Reel",
    toName: "Content Calendar",
    fromIdx: 1,
    toIdx: 2,
    p0: [900, 152],
    p1: [960, 152],
    p2: [0, 252],
    p3: [60, 252],
    path: "M 900 152 C 960 152, 0 252, 60 252",
    gradientId: "dep-grad-2",
    fromColor: "#f43f5e",
    toColor: "#34d399",
  },
  {
    id: "dep-3-4",
    fromName: "Content Calendar",
    toName: "Founder Brand Kit",
    fromIdx: 2,
    toIdx: 3,
    p0: [440, 252],
    p1: [485, 252],
    p2: [475, 348],
    p3: [520, 348],
    path: "M 440 252 C 485 252, 475 348, 520 348",
    gradientId: "dep-grad-3",
    fromColor: "#34d399",
    toColor: "#c084fc",
  },
  {
    id: "dep-4-5",
    fromName: "Founder Brand Kit",
    toName: "Client Portal Review",
    fromIdx: 3,
    toIdx: 4,
    p0: [900, 348],
    p1: [960, 348],
    p2: [0, 450],
    p3: [60, 450],
    path: "M 900 348 C 960 348, 0 450, 60 450",
    gradientId: "dep-grad-4",
    fromColor: "#c084fc",
    toColor: "#fbbf24",
  },
  {
    id: "dep-5-6",
    fromName: "Client Portal Review",
    toName: "Campaign Distribution",
    fromIdx: 4,
    toIdx: 5,
    p0: [440, 450],
    p1: [485, 450],
    p2: [475, 548],
    p3: [520, 548],
    path: "M 440 450 C 485 450, 475 548, 520 548",
    gradientId: "dep-grad-5",
    fromColor: "#fbbf24",
    toColor: "#38bdf8",
  },
];

/**
 * Autonomous workflow simulation phase states.
 * Progresses sequentially down through every task from landing page to campaign distribution:
 * Phase 0: Baseline state as revealed on scroll entrance
 * Phase 1: Satyam (Landing Page Dev) Approved -> Connector 1 pulses to Launch Reel
 * Phase 2: Rishav (Launch Reel) Approved -> Connector 1 stops pulsing; Connector 2 pulses to Content Calendar
 * Phase 3: Aisha (Content Calendar) Approved -> Connector 2 stops pulsing; Connector 3 pulses to Founder Brand Kit
 * Phase 4: Arjun (Brand Kit) Completed -> Connector 3 stops pulsing; Connector 4 pulses to Client Portal Review
 * Phase 5: Client Portal Review Approved -> Connector 4 stops pulsing; Connector 5 pulses to Campaign Distribution
 * Phase 6: Campaign Distribution Pre-Flight Live -> Entire chain connected and complete
 */
function getWorkstreamPhaseState(id: string, phase: number): WorkstreamPhaseState {
  switch (id) {
    case "ws-1": // Landing Page Development (Satyam)
      if (phase >= 1) {
        return {
          status: "Approved",
          statusBadgeClass: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]",
          statusDotClass: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]",
          barWidth: 38,
          meta: "Dev · Approved",
          sidebarStat: "Approved",
          milestones: [
            { label: "Wireframes", percent: 28, state: "completed" },
            { label: "UI Polish", percent: 64, state: "completed" },
            { label: "Pre-Launch QA", percent: 88, state: "completed" },
          ],
        };
      }
      return {
        status: "In Progress",
        statusBadgeClass: "border-cyan-400/35 bg-cyan-400/10 text-cyan-300",
        statusDotClass: "bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]",
        barWidth: 38,
        meta: "Dev · Oct 24",
        sidebarStat: "85%",
        milestones: [
          { label: "Wireframes", percent: 28, state: "completed" },
          { label: "UI Polish", percent: 64, state: "active", glowColor: "rgba(56, 189, 248, 0.45)" },
          { label: "Pre-Launch QA", percent: 88, state: "pending" },
        ],
      };

    case "ws-2": // Launch Reel — V3 (Rishav)
      if (phase >= 2) {
        return {
          status: "Approved",
          statusBadgeClass: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]",
          statusDotClass: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]",
          barWidth: 38,
          meta: "Motion · Master 4K",
          sidebarStat: "V4 · Done",
          milestones: [
            { label: "Storyboard", percent: 26, state: "completed" },
            { label: "Sound & VFX", percent: 60, state: "completed" },
            { label: "Final Cut", percent: 88, state: "completed" },
          ],
        };
      }
      return {
        status: "Revision Required",
        statusBadgeClass: "border-rose-400/35 bg-rose-400/10 text-rose-300",
        statusDotClass: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
        barWidth: 38,
        meta: "Motion · 4K",
        sidebarStat: "V3",
        milestones: [
          { label: "Storyboard", percent: 26, state: "completed" },
          { label: "Sound & VFX", percent: 60, state: "active", glowColor: "rgba(244, 63, 94, 0.4)" },
          { label: "Final Cut", percent: 88, state: "pending" },
        ],
      };

    case "ws-3": // Content Calendar (Aisha)
      if (phase >= 3) {
        return {
          status: "Approved",
          statusBadgeClass: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]",
          statusDotClass: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]",
          barWidth: 38,
          meta: "Copy · 30 Posts Scheduled",
          sidebarStat: "30p Done",
          milestones: [
            { label: "Strategy", percent: 26, state: "completed" },
            { label: "Drafting", percent: 56, state: "completed" },
            { label: "Review", percent: 88, state: "completed" },
          ],
        };
      }
      return {
        status: "In Progress",
        statusBadgeClass: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
        statusDotClass: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
        barWidth: 38,
        meta: "Copy · 24/30 Posts",
        sidebarStat: "24p",
        milestones: [
          { label: "Strategy", percent: 26, state: "completed" },
          { label: "Drafting", percent: 56, state: "completed" },
          { label: "Review", percent: 88, state: "active", glowColor: "rgba(52, 211, 153, 0.4)" },
        ],
      };

    case "ws-4": // Founder Brand Kit (Arjun)
      if (phase >= 4) {
        return {
          status: "Completed",
          statusBadgeClass: "border-violet-400/40 bg-violet-400/10 text-violet-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]",
          statusDotClass: "bg-violet-400 shadow-[0_0_6px_rgba(168,85,247,0.7)]",
          barWidth: 38,
          meta: "Brand · Locked",
          sidebarStat: "Done",
          milestones: [
            { label: "Logo Suite", percent: 26, state: "completed" },
            { label: "Guidelines", percent: 58, state: "completed" },
            { label: "Vault Export", percent: 88, state: "completed" },
          ],
        };
      }
      return {
        status: "In Review",
        statusBadgeClass: "border-violet-400/35 bg-violet-400/10 text-violet-300",
        statusDotClass: "bg-violet-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]",
        barWidth: 38,
        meta: "Brand · Final Polish",
        sidebarStat: "90%",
        milestones: [
          { label: "Logo Suite", percent: 26, state: "completed" },
          { label: "Guidelines", percent: 58, state: "active", glowColor: "rgba(168, 85, 247, 0.4)" },
          { label: "Vault Export", percent: 88, state: "pending" },
        ],
      };

    case "ws-5": // Client Portal Review (Agency Gate)
      if (phase >= 5) {
        return {
          status: "Approved",
          statusBadgeClass: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]",
          statusDotClass: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]",
          barWidth: 38,
          meta: "Sign-Off · Approved",
          milestones: [
            { label: "Internal QA", percent: 35, state: "completed" },
            { label: "Approval", percent: 85, state: "completed" },
          ],
        };
      }
      return {
        status: "In Review",
        statusBadgeClass: "border-amber-400/35 bg-amber-400/10 text-amber-300",
        statusDotClass: "bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
        barWidth: 38,
        meta: "Sign-Off · Pending",
        milestones: [
          { label: "Internal QA", percent: 35, state: "completed" },
          { label: "Approval", percent: 85, state: "active", glowColor: "rgba(251, 191, 36, 0.45)" },
        ],
      };

    case "ws-6": // Campaign Distribution (Growth Team)
    default:
      if (phase >= 6) {
        return {
          status: "Approved",
          statusBadgeClass: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.15)]",
          statusDotClass: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]",
          barWidth: 38,
          meta: "Live · Nov 04",
          milestones: [
            { label: "Checklist", percent: 35, state: "completed" },
            { label: "Go-Live", percent: 85, state: "completed" },
          ],
        };
      }
      if (phase >= 5) {
        return {
          status: "In Progress",
          statusBadgeClass: "border-sky-400/35 bg-sky-400/10 text-sky-300",
          statusDotClass: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]",
          barWidth: 38,
          meta: "Pre-Flight Ready",
          milestones: [
            { label: "Checklist", percent: 35, state: "completed" },
            { label: "Go-Live", percent: 85, state: "active", glowColor: "rgba(56, 189, 248, 0.45)" },
          ],
        };
      }
      return {
        status: "Not Started",
        statusBadgeClass: "border-white/15 bg-white/5 text-white/45",
        statusDotClass: "bg-sky-300/60",
        barWidth: 38,
        meta: "Scheduled · Nov 04",
        milestones: [
          { label: "Checklist", percent: 35, state: "completed" },
          { label: "Go-Live", percent: 85, state: "pending" },
        ],
      };
  }
}

/**
 * Silky smooth micro-status badge with fluid cross-fade slide transitions
 */
function StatusBadge({
  status,
  badgeClass,
  dotClass,
  isAdvancing,
}: {
  status: string;
  badgeClass: string;
  dotClass: string;
  isAdvancing?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-[1.5px] font-mono text-[7.5px] uppercase tracking-wider transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${badgeClass}`}
    >
      <span
        className={`size-1.5 rounded-full transition-colors duration-1000 ${dotClass} ${
          isAdvancing ? "animate-pulse" : ""
        }`}
      />
      <span className="relative inline-block overflow-hidden">
        <span key={status} className="inline-block sec2-text-glide">
          {status}
        </span>
      </span>
    </span>
  );
}

const SIDEBAR_NAV_ITEMS = [
  {
    label: "Overview",
    active: false,
    icon: (
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2.5 12C2.5 7.52 2.5 5.28 3.89 3.89 5.28 2.5 7.52 2.5 12 2.5c4.48 0 6.72 0 8.11 1.39C21.5 5.28 21.5 7.52 21.5 12c0 4.48 0 6.72-1.39 8.11C18.72 21.5 16.48 21.5 12 21.5c-4.48 0-6.72 0-8.11-1.39C2.5 18.72 2.5 16.48 2.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21.5 13.5H16.57c-.84 0-1.5.7-1.87 1.45-.4.8-1.21 1.55-2.7 1.55s-2.3-.75-2.7-1.55c-.37-.75-1.03-1.45-1.87-1.45H2.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Projects",
    active: true,
    icon: (
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14.53 11.08L18.56 12.66c2.32.91 3.48 1.36 3.44 2.08-.04.72-1.25 1.05-3.67 1.71-.72.2-1.08.3-1.33.55-.25.25-.35.61-.55 1.33-.66 2.42-.99 3.63-1.71 3.67-.72.04-1.17-1.12-2.08-3.44L11.08 14.53c-.95-2.43-1.42-3.64-.81-4.26.62-.62 1.83-.14 4.26.81Z" strokeLinejoin="round" />
        <path d="M2 8.5V11.5M11.5 2H8.5M8.5 18H9M18 9V8.5M4.5 18C3.12 18 2 16.88 2 15.5M2 4.5C2 3.12 3.12 2 4.5 2M18 4.5C18 3.12 16.88 2 15.5 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    active: false,
    icon: (
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22a2 2 0 100-4 2 2 0 000 4zM12 2c-3.04 0-5.5 2.46-5.5 5.5 0 2.52 1.69 4.64 4 5.29L12 15l1.5-2.21c2.31-.65 4-2.77 4-5.29C17.5 4.46 15.04 2 12 2zM12 5v2.5l1.5 1M14 20h7M10 20H3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    active: false,
    icon: (
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 2v3M6 2v3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2.5" y="3.5" width="19" height="18.5" rx="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 8h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.44 14.53c1.61-.2 2.88-1.48 3.08-3.09.03-.24.23-.44.48-.44.25 0 .44.2.47.44.2 1.61 1.48 2.89 3.09 3.09.24.03.44.23.44.47 0 .25-.2.44-.44.47-1.61.2-2.89 1.48-3.09 3.09-.03.24-.22.44-.47.44-.25 0-.45-.2-.48-.44-.2-1.61-1.47-2.89-3.08-3.09-.24-.03-.44-.22-.44-.47 0-.24.2-.44.44-.47z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Team",
    active: false,
    icon: (
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Client Portal",
    active: false,
    icon: (
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [simPhase, setSimPhase] = useState(0);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [activeTaskIdx, setActiveTaskIdx] = useState<number | null>(0);
  const [activeConnectorIdx, setActiveConnectorIdx] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  // Progress fill DOM elements for all 6 task bars
  const fillRefs = useRef<(HTMLDivElement | null)[]>([]);

  // SVG moving indicator dot references
  const dotGroupRef = useRef<SVGGElement>(null);
  const dotGlowRef = useRef<SVGCircleElement>(null);
  const dotCoreRef = useRef<SVGCircleElement>(null);
  const dotCenterRef = useRef<SVGCircleElement>(null);

  // Master simulation timeline reference for cleanup
  const masterTlRef = useRef<gsap.core.Timeline | null>(null);

  // Coordinated staggered entrance triggered when scrolling from Hero into Section 2
  useGsapContext(
    () => {
      if (!sectionRef.current) return;

      if (getReducedMotion()) {
        setHasEntered(true);
        return;
      }

      const entranceTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          once: true, // Prevents flickering or repeated unwanted replays
          onEnter: () => {
            setHasEntered(true);
          },
        },
        onComplete: () => {
          setHasEntered(true);
        },
      });

      entranceTl
        .fromTo(
          ".sec2-headline-line",
          { opacity: 0, y: 34 },
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.12, ease: "power3.out" }
        )
        .fromTo(
          cardRef.current,
          { opacity: 0, y: 32, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 0.95, ease: "power3.out" },
          "-=0.45"
        )
        .fromTo(
          ".sec2-sidebar-item",
          { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: 0.45, stagger: 0.04, ease: "power2.out" },
          "-=0.6"
        )
        .fromTo(
          ".sec2-timeline-header",
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.5"
        )
        .fromTo(
          ".sec2-gantt-row",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "power2.out" },
          "-=0.45"
        )
        .fromTo(
          ".sec2-pillar-card",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power2.out" },
          "-=0.4"
        )
        .fromTo(
          ".sec2-divider",
          { opacity: 0, scaleX: 0.96 },
          { opacity: 1, scaleX: 1, duration: 0.75, ease: "power2.out" },
          "-=0.3"
        );
    },
    sectionRef,
    []
  );

  // Guarantee that workflow animations activate seamlessly on mobile touch/scroll
  useEffect(() => {
    if (hasEntered) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEntered]);

  // Pause simulation timeline when section is scrolled out of view to eliminate background re-renders
  useEffect(() => {
    if (!hasEntered) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!masterTlRef.current) return;
        if (entry.isIntersecting) {
          masterTlRef.current.play();
        } else {
          masterTlRef.current.pause();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEntered]);

  // Helper to update SVG indicator dot position along the cubic Bézier curve
  const updateDotPosition = (x: number, y: number, color: string) => {
    const xs = x.toFixed(2);
    const ys = y.toFixed(2);
    if (dotGlowRef.current) {
      dotGlowRef.current.setAttribute("cx", xs);
      dotGlowRef.current.setAttribute("cy", ys);
      dotGlowRef.current.setAttribute("fill", color);
    }
    if (dotCoreRef.current) {
      dotCoreRef.current.setAttribute("cx", xs);
      dotCoreRef.current.setAttribute("cy", ys);
      dotCoreRef.current.setAttribute("fill", color);
    }
    if (dotCenterRef.current) {
      dotCenterRef.current.setAttribute("cx", xs);
      dotCenterRef.current.setAttribute("cy", ys);
    }
  };

  // Coordinated GSAP Timeline: Synchronizes task bar fills, status changes,
  // curved workflow connectors, and handoff indicator travel across all 6 tasks
  useEffect(() => {
    if (!hasEntered) return;

    if (reducedMotion) {
      setSimPhase(6);
      setActiveTaskIdx(null);
      setActiveConnectorIdx(null);
      fillRefs.current.forEach((el) => {
        if (el) el.style.width = "100%";
      });
      return;
    }

    if (masterTlRef.current) {
      masterTlRef.current.kill();
    }

    // Reset initial fill widths
    fillRefs.current.forEach((el) => {
      if (el) {
        el.style.width = "0%";
        el.style.opacity = "1";
      }
    });

    const masterTl = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.6,
    });
    masterTlRef.current = masterTl;

    // Sequence through each task and handoff connector
    for (let i = 0; i < 6; i++) {
      // 1. Start Task i progress fill from left to right (0% -> 100%)
      masterTl.call(() => {
        setActiveTaskIdx(i);
        setActiveConnectorIdx(null);
        if (i === 0) setSimPhase(0);
      });

      // Smooth 1.8s fill transition showing work advancing over time
      masterTl.fromTo(
        fillRefs.current[i],
        { width: "0%" },
        {
          width: "100%",
          duration: 1.8,
          ease: "power1.inOut",
        }
      );

      // 2. Task i hits 100%: mark Approved/Completed, keep filled and stationary
      masterTl.call(() => {
        setSimPhase(i + 1);
        setActiveTaskIdx(null);
      });

      // Realistic pause between task completion and connector handoff
      masterTl.to({}, { duration: 0.25 });

      // 3. Move connector indicator along the curved path to Task i + 1 (for i < 5)
      if (i < 5) {
        const dep = DEPENDENCY_CONNECTORS[i];
        const dotState = { t: 0 };
        const connDuration = i === 1 || i === 3 ? 1.35 : 1.15;

        // Reveal indicator dot at the exact endpoint of Task i
        masterTl.call(() => {
          setActiveConnectorIdx(i);
          if (dotGroupRef.current) {
            dotGroupRef.current.style.opacity = "1";
          }
          const [startX, startY] = dep.p0;
          updateDotPosition(startX, startY, dep.fromColor);
        });

        // Smoothly animate indicator along the exact cubic Bézier curve to startpoint of Task i + 1
        masterTl.to(dotState, {
          t: 1,
          duration: connDuration,
          ease: "power1.inOut",
          onUpdate: () => {
            const [x, y] = getCubicBezierPoint(dep.p0, dep.p1, dep.p2, dep.p3, dotState.t);
            const dotColor = dotState.t > 0.5 ? dep.toColor : dep.fromColor;
            updateDotPosition(x, y, dotColor);
          },
        });

        // Hide indicator dot upon exact arrival at the starting point of Task i + 1
        masterTl.call(() => {
          if (dotGroupRef.current) {
            dotGroupRef.current.style.opacity = "0";
          }
          setActiveConnectorIdx(null);
        });

        // Realistic pause upon arrival before Task i + 1 begins progress
        masterTl.to({}, { duration: 0.1 });
      }
    }

    // 4. Hold the full workflow completion state for 3.5 seconds
    masterTl.to({}, { duration: 3.5 });

    // 5. Graceful cycle restart: fade out fills and reset to baseline
    masterTl.to(fillRefs.current.filter(Boolean), {
      opacity: 0,
      duration: 0.45,
      ease: "power2.out",
      onComplete: () => {
        fillRefs.current.forEach((el) => {
          if (el) {
            el.style.width = "0%";
            el.style.opacity = "1";
          }
        });
        setSimPhase(0);
        setActiveTaskIdx(0);
        setActiveConnectorIdx(null);
      },
    });

    return () => {
      if (masterTlRef.current) {
        masterTlRef.current.kill();
        masterTlRef.current = null;
      }
    };
  }, [hasEntered, reducedMotion]);

  // Which workstream is actively making a forward move in the current phase
  const activeAdvancingId =
    simPhase === 1
      ? "ws-1"
      : simPhase === 2
      ? "ws-2"
      : simPhase === 3
      ? "ws-3"
      : simPhase === 4
      ? "ws-4"
      : simPhase === 5
      ? "ws-5"
      : simPhase === 6
      ? "ws-6"
      : null;

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative overflow-hidden pt-28 pb-0 lg:pt-36 lg:pb-0"
      style={{
        backgroundColor: "#000000",
        contain: "paint",
      }}
    >
      {/* Global CSS keyframes for silky smooth status, label, and end-to-end active beam animations */}
      <style>{`
        @keyframes sec2FadeSlide {
          0% {
            opacity: 0;
            transform: translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .sec2-text-glide {
          animation: sec2FadeSlide 750ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes sec2BeamSweep {
          0% {
            left: -50%;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
        .sec2-beam-sweep {
          animation: sec2BeamSweep 1.8s cubic-bezier(0.35, 0, 0.25, 1) infinite;
        }
        .sec2-dashboard-card {
          height: 350px;
        }
        .sec2-timeline-header {
          height: 36px;
        }
        .sec2-month-banner {
          height: 18px;
        }
        .sec2-date-row {
          height: 18px;
        }
        .sec2-row-label {
          top: 4px;
          font-size: 8.5px;
          line-height: 11px;
        }
        .sec2-gantt-bar {
          top: 18px;
          height: 13px;
        }
        @media (min-width: 640px) {
          .sec2-dashboard-card {
            height: 420px;
          }
          .sec2-timeline-header {
            height: 54px;
          }
          .sec2-month-banner {
            height: 26px;
          }
          .sec2-date-row {
            height: 26px;
          }
          .sec2-row-label {
            top: 6px;
            font-size: 11px;
            line-height: 14px;
          }
          .sec2-gantt-bar {
            top: 24px;
            height: 20px;
          }
        }
        @media (min-width: 1024px) {
          .sec2-dashboard-card {
            height: auto;
            aspect-ratio: 16 / 9;
          }
          .sec2-timeline-header {
            height: 70px;
          }
          .sec2-month-banner {
            height: 32px;
          }
          .sec2-date-row {
            height: 38px;
          }
          .sec2-row-label {
            top: 13%;
            font-size: 12.5px;
            line-height: 16px;
          }
          .sec2-gantt-bar {
            top: 40%;
            height: 24px;
          }
        }
        .sec2-mobile-only {
          display: inline;
        }
        .sec2-desktop-only {
          display: none;
        }
        .sec2-desktop-flex {
          display: none;
        }
        @media (min-width: 640px) {
          .sec2-mobile-only {
            display: none !important;
          }
          .sec2-desktop-only {
            display: inline !important;
          }
          .sec2-desktop-flex {
            display: inline-flex !important;
          }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-[15px] lg:px-14">
        {/* Section Heading */}
        <div className="relative mb-8 sm:mb-16 lg:mb-20">
          <div className="mx-0 lg:mx-5">
            <h2
              className="font-display tracking-tight"
              style={{
                fontSize: "clamp(24px, 4.5vw, 72px)",
                lineHeight: 1.08,
                letterSpacing: "-0.065em",
                wordSpacing: "0.18em",
              }}
            >
              <span className="sec2-headline-line block text-foreground">
                Every project. One clear workflow.
              </span>
              <span className="sec2-headline-line mt-1.5 sm:mt-2 block text-muted-foreground lg:mt-3.5">
                From scattered tasks to work that moves.
              </span>
            </h2>
          </div>

          {/* Gantt Schedule Dashboard Card Container */}
          <div
            ref={cardRef}
            className="sec2-dashboard-card relative mx-0 h-[360px] sm:h-[420px] lg:h-auto lg:aspect-video w-full overflow-hidden rounded-xl border border-[#37333b] bg-[radial-gradient(circle_at_50%_0%,rgba(94,73,86,0.24),transparent_68%),linear-gradient(#09090c,#09090c)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.7)] [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)] lg:mx-5 lg:w-[calc(100%-2.5rem)]"
            style={{
              marginTop: "clamp(1.75rem, 4.5vw, 5.5rem)",
            }}
          >
            {/* Top Hairline Ambient Shine Line */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[1.125rem] top-0 z-30 h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-slate-300/0 via-slate-200/90 to-slate-300/0"
            />

            {/* Live Interactive Dashboard */}
            <div className="flex h-full w-full items-stretch overflow-hidden">
              {/* Sidebar Preview */}
              <aside
                aria-label="Agency workflow scheduler sidebar"
                className="sticky top-0 h-full w-[29%] sm:w-[25%] lg:w-[23%] shrink-0 self-stretch overflow-hidden border-r border-white/[0.06] bg-[#0c0d0f]/60 px-2.5 py-3 sm:px-3.5 sm:py-4 lg:px-4 lg:py-4.5 text-white/70 backdrop-blur-sm flex flex-col gap-3.5 sm:gap-4 lg:gap-5 justify-start"
              >
                {/* Brand Header */}
                <div className="sec2-sidebar-item flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 font-medium text-white">
                    <div className="relative size-4 sm:size-5 shrink-0 overflow-hidden rounded-sm flex items-center justify-center">
                      <Image
                        src="/images/karyalaya-logo-mark.png"
                        alt="KaryaLaya"
                        width={20}
                        height={20}
                        className="size-full object-contain"
                      />
                    </div>
                    <span className="truncate text-xs sm:text-sm lg:text-[15px] font-semibold tracking-tight text-white">
                      KaryaLaya
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3 shrink-0 text-white/40"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>

                  {/* Header Action Icons */}
                  <div className="hidden items-center gap-1.5 lg:flex">
                    <span className="grid size-6 place-items-center text-white/45">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M16 16.5L20 20.5M18 11.5A6.5 6.5 0 115 11.5a6.5 6.5 0 0113 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="grid size-6 place-items-center rounded-md border border-white/10 text-white/70">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M16.42 4.6l.99-.99a2.83 2.83 0 114 4l-.99.99M16.42 4.6L9.77 11.26a4 4 0 00-.73 1.84L8 16l2.9-.72a4 4 0 001.84-.73L19.4 7.6" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Primary Navigation Items */}
                <nav className="space-y-1">
                  {SIDEBAR_NAV_ITEMS.slice(0, 4).map((item, idx) => (
                    <div
                      key={item.label}
                      className={`sec2-sidebar-item group items-center gap-2 rounded-md px-2 py-1 sm:py-1.5 transition-all duration-200 cursor-default select-none ${
                        idx >= 3 ? "hidden sm:flex" : "flex"
                      } ${
                        item.active
                          ? "border border-white/10 bg-white/[0.08] text-white shadow-[0_1px_4px_rgba(0,0,0,0.5)] font-medium"
                          : "text-white/60 hover:bg-white/[0.04] hover:text-white/90"
                      }`}
                    >
                      <span className={item.active ? "text-cyan-400" : "text-white/45 group-hover:text-white/70"}>
                        {item.icon}
                      </span>
                      <span className="truncate text-xs sm:text-[13px] lg:text-[13.5px] font-medium tracking-tight">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </nav>

                {/* Active Campaign Project Group */}
                <div className="sec2-sidebar-item pt-2.5 sm:pt-3.5 border-t border-white/[0.07]">
                  <p className="mb-2 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-white/40">
                    <span>Active Campaign</span>
                    <svg className="size-2.5 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </p>
                  <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-2 sm:p-2.5 transition-colors duration-300 hover:border-white/15">
                    <p className="truncate text-xs sm:text-[13px] font-medium text-white/95">
                      Brand Growth
                    </p>
                    <p className="mt-1 font-mono text-[10px] sm:text-[11px] text-emerald-400 flex items-center gap-1.5 transition-all duration-700">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span key={simPhase} className="truncate inline-block sec2-text-glide font-medium">
                        {simPhase === 0 && "Live · In Progress"}
                        {simPhase === 1 && "Dev OK · Verified"}
                        {simPhase === 2 && "V4 OK · Review"}
                        {simPhase === 3 && "30/30 Posts OK"}
                        {simPhase === 4 && "Brand Kit Done"}
                        {simPhase === 5 && "5/5 Sign-Off"}
                        {simPhase >= 6 && "Approved"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Workstream Leads */}
                <div className="sec2-sidebar-item pt-2.5 sm:pt-3.5 border-t border-white/[0.07] hidden lg:block">
                  <p className="mb-2.5 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-white/40">
                    <span>Workstream Leads</span>
                    <span className="text-[10px] font-mono text-white/30 font-normal">4 active</span>
                  </p>
                  <nav className="space-y-1.5">
                    {/* Satyam · Landing Dev */}
                    <div className="flex items-center justify-between gap-1.5 py-1 px-1 rounded-md hover:bg-white/[0.03] transition-colors">
                      <span className="truncate flex items-center gap-2 text-white/80 text-[12px] lg:text-[12.5px] font-medium min-w-0">
                        <span className={`size-2 rounded-full bg-cyan-400 shrink-0 transition-transform duration-500 ${simPhase === 1 ? "scale-125 ring-2 ring-cyan-400/30" : ""}`} />
                        <span className="truncate">Satyam · Landing Dev</span>
                      </span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors duration-700 text-cyan-400 bg-cyan-400/10 font-medium">
                        <span key={getWorkstreamPhaseState("ws-1", simPhase).sidebarStat} className="inline-block sec2-text-glide">
                          {getWorkstreamPhaseState("ws-1", simPhase).sidebarStat}
                        </span>
                      </span>
                    </div>

                    {/* Rishav · Launch Reel */}
                    <div className="flex items-center justify-between gap-1.5 py-1 px-1 rounded-md hover:bg-white/[0.03] transition-colors">
                      <span className="truncate flex items-center gap-2 text-white/80 text-[12px] lg:text-[12.5px] font-medium min-w-0">
                        <span className={`size-2 rounded-full bg-rose-400 shrink-0 transition-transform duration-500 ${simPhase === 2 ? "scale-125 ring-2 ring-rose-400/30" : ""}`} />
                        <span className="truncate">Rishav · Launch Reel</span>
                      </span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors duration-700 text-rose-400 bg-rose-400/10 font-medium">
                        <span key={getWorkstreamPhaseState("ws-2", simPhase).sidebarStat} className="inline-block sec2-text-glide">
                          {getWorkstreamPhaseState("ws-2", simPhase).sidebarStat}
                        </span>
                      </span>
                    </div>

                    {/* Aisha · Calendar */}
                    <div className="flex items-center justify-between gap-1.5 py-1 px-1 rounded-md hover:bg-white/[0.03] transition-colors">
                      <span className="truncate flex items-center gap-2 text-white/80 text-[12px] lg:text-[12.5px] font-medium min-w-0">
                        <span className={`size-2 rounded-full bg-emerald-400 shrink-0 transition-transform duration-500 ${simPhase === 3 ? "scale-125 ring-2 ring-emerald-400/30" : ""}`} />
                        <span className="truncate">Aisha · Calendar</span>
                      </span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors duration-700 text-emerald-400 bg-emerald-400/10 font-medium">
                        <span key={getWorkstreamPhaseState("ws-3", simPhase).sidebarStat} className="inline-block sec2-text-glide">
                          {getWorkstreamPhaseState("ws-3", simPhase).sidebarStat}
                        </span>
                      </span>
                    </div>

                    {/* Arjun · Brand Kit */}
                    <div className="flex items-center justify-between gap-1.5 py-1 px-1 rounded-md hover:bg-white/[0.03] transition-colors">
                      <span className="truncate flex items-center gap-2 text-white/80 text-[12px] lg:text-[12.5px] font-medium min-w-0">
                        <span className={`size-2 rounded-full bg-violet-400 shrink-0 transition-transform duration-500 ${simPhase === 4 ? "scale-125 ring-2 ring-violet-400/30" : ""}`} />
                        <span className="truncate">Arjun · Brand Kit</span>
                      </span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors duration-700 text-violet-400 bg-violet-400/10 font-medium">
                        <span key={getWorkstreamPhaseState("ws-4", simPhase).sidebarStat} className="inline-block sec2-text-glide">
                          {getWorkstreamPhaseState("ws-4", simPhase).sidebarStat}
                        </span>
                      </span>
                    </div>
                  </nav>
                </div>
              </aside>

              {/* Gantt Timeline Area (flex-1 min-w-0) */}
              <div className="flex-1 min-w-0 h-full flex flex-col p-[3px] sm:p-[5px] overflow-hidden self-stretch">
                <section
                  aria-label="Agency workflow deliverable timeline Gantt chart"
                  className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#101112] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
                >
                  {/* Dashed Timeline Grid Background Lines (7 Columns) */}
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 size-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 700 1000"
                  >
                    <line x1="0" x2="0" y1="0" y2="1000" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                    <line x1="100" x2="100" y1="0" y2="1000" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                    <line x1="200" x2="200" y1="0" y2="1000" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                    <line x1="300" x2="300" y1="0" y2="1000" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                    <line x1="400" x2="400" y1="0" y2="1000" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                    <line x1="500" x2="500" y1="0" y2="1000" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                    <line x1="600" x2="600" y1="0" y2="1000" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
                  </svg>

                  {/* Header with Timeline Dates */}
                  <header className="sec2-timeline-header relative z-10 shrink-0 border-b border-white/[0.04] overflow-hidden">
                    {/* Month Span Banner */}
                    <div className="sec2-month-banner absolute inset-x-0 top-0 grid grid-cols-7 items-end pb-0.5 sm:pb-1 text-[8px] sm:text-[9.5px] lg:text-[10px] font-medium tracking-[0.06em] text-white/32">
                      <span className="col-span-5 pl-2 sm:pl-4">OCT</span>
                      <span className="col-span-2 pl-2 sm:pl-4">NOV</span>
                    </div>

                    {/* Day Dates Columns */}
                    <div className="sec2-date-row absolute inset-x-0 bottom-0 grid grid-cols-7 text-[7px] sm:text-[8.5px] lg:text-[9px] font-mono text-white/24">
                      <div className="flex items-center pl-2 sm:pl-4">03</div>
                      <div className="flex items-center pl-2 sm:pl-4">10</div>
                      <div className="flex items-center pl-2 sm:pl-4">17</div>
                      <div className="flex items-center pl-2 sm:pl-4 text-cyan-300/80 font-medium">24</div>
                      <div className="flex items-center pl-2 sm:pl-4">31</div>
                      <div className="flex items-center pl-2 sm:pl-4">07</div>
                      <div className="flex items-center pl-2 sm:pl-4">14</div>
                    </div>

                    {/* Current Live Date Indicator Line (Oct 24) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 z-20"
                      style={{ left: "50%" }}
                    >
                      <div className="h-full w-px border-l border-dashed border-cyan-400/25" />
                      <div className="absolute top-0.5 sm:top-1 -translate-x-1/2 rounded bg-cyan-500/10 border border-cyan-400/25 px-1 py-0.2 text-[5.5px] sm:text-[7px] font-mono text-cyan-300 whitespace-nowrap flex items-center gap-0.5 sm:gap-1 shadow-[0_0_8px_rgba(56,189,248,0.2)]">
                        <span className="size-0.5 sm:size-1 rounded-full bg-cyan-400 animate-pulse" />
                        LIVE
                      </div>
                    </div>
                  </header>

                  {/* Timeline Rows Container */}
                  <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
                    {/* Flowing Cubic Bézier Connectors and Joint Anchor Pins */}
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 size-full overflow-visible z-10 opacity-85"
                      preserveAspectRatio="none"
                      viewBox="0 0 1000 600"
                    >
                      <defs>
                        <filter id="dep-glow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>

                        {DEPENDENCY_CONNECTORS.map((dep) => (
                          <linearGradient key={dep.gradientId} id={dep.gradientId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={dep.fromColor} stopOpacity="0.85" />
                            <stop offset="100%" stopColor={dep.toColor} stopOpacity="0.95" />
                          </linearGradient>
                        ))}
                      </defs>

                      {/* Joint Anchor Pins at the Finish End of each task */}
                      <circle
                        cx="440"
                        cy="52"
                        r={simPhase >= 1 ? "3" : "2"}
                        fill="#38bdf8"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 1 ? 0.95 : 0.2,
                        }}
                      />
                      <circle
                        cx="900"
                        cy="152"
                        r={simPhase >= 2 ? "3" : "2"}
                        fill="#f43f5e"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 2 ? 0.95 : 0.2,
                        }}
                      />
                      <circle
                        cx="440"
                        cy="252"
                        r={simPhase >= 3 ? "3" : "2"}
                        fill="#34d399"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 3 ? 0.95 : 0.2,
                        }}
                      />
                      <circle
                        cx="900"
                        cy="348"
                        r={simPhase >= 4 ? "3" : "2"}
                        fill="#c084fc"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 4 ? 0.95 : 0.2,
                        }}
                      />
                      <circle
                        cx="440"
                        cy="450"
                        r={simPhase >= 5 ? "3" : "2"}
                        fill="#fbbf24"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 5 ? 0.95 : 0.2,
                        }}
                      />
                      <circle
                        cx="900"
                        cy="548"
                        r={simPhase >= 6 ? "3" : "2"}
                        fill="#38bdf8"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 6 ? 0.95 : 0.2,
                        }}
                      />

                      {/* Joint Anchor Pins at the Start of each subsequent task */}
                      <circle
                        cx="520"
                        cy="152"
                        r={activeConnectorIdx === 0 || simPhase >= 2 ? "3" : "2"}
                        fill="#f43f5e"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 1 ? 0.9 : 0.2,
                        }}
                      />
                      <circle
                        cx="60"
                        cy="252"
                        r={activeConnectorIdx === 1 || simPhase >= 3 ? "3" : "2"}
                        fill="#34d399"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 2 ? 0.9 : 0.2,
                        }}
                      />
                      <circle
                        cx="520"
                        cy="348"
                        r={activeConnectorIdx === 2 || simPhase >= 4 ? "3" : "2"}
                        fill="#c084fc"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 3 ? 0.9 : 0.2,
                        }}
                      />
                      <circle
                        cx="60"
                        cy="450"
                        r={activeConnectorIdx === 3 || simPhase >= 5 ? "3" : "2"}
                        fill="#fbbf24"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 4 ? 0.9 : 0.2,
                        }}
                      />
                      <circle
                        cx="520"
                        cy="548"
                        r={activeConnectorIdx === 4 || simPhase >= 6 ? "3" : "2"}
                        fill="#38bdf8"
                        style={{
                          transition: "r 400ms ease, opacity 400ms ease",
                          opacity: simPhase >= 5 ? 0.9 : 0.2,
                        }}
                      />

                      {/* 5 Flowing Cubic Bézier Curved Connectors */}
                      {DEPENDENCY_CONNECTORS.map((dep, idx) => {
                        const isActivelyTraversing = activeConnectorIdx === idx;
                        const isCompleted = simPhase > dep.fromIdx;

                        return (
                          <g key={dep.id}>
                            {/* Thin Dashed Connector Curve */}
                            <path
                              d={dep.path}
                              fill="none"
                              stroke={
                                isActivelyTraversing || isCompleted
                                  ? `url(#${dep.gradientId})`
                                  : "rgba(255,255,255,0.08)"
                              }
                              strokeWidth={isActivelyTraversing ? "1.8" : isCompleted ? "1.25" : "1"}
                              strokeDasharray="4 4"
                              vectorEffect="non-scaling-stroke"
                              style={{
                                opacity: isActivelyTraversing ? 0.95 : isCompleted ? 0.45 : 0.08,
                                transition: "stroke 600ms ease, opacity 600ms ease, stroke-width 600ms ease",
                                filter: isActivelyTraversing ? "drop-shadow(0 0 4px rgba(255,255,255,0.3))" : "none",
                              }}
                            />
                          </g>
                        );
                      })}

                      {/* Moving Indicator Dot along the actual curve (animated via GSAP) */}
                      <g
                        ref={dotGroupRef}
                        style={{
                          opacity: 0,
                          pointerEvents: "none",
                          transition: "opacity 180ms ease",
                        }}
                      >
                        {/* Outer Glow Halo */}
                        <circle
                          ref={dotGlowRef}
                          r="7"
                          fill="#38bdf8"
                          filter="url(#dep-glow)"
                          opacity="0.8"
                        />
                        {/* Main Colored Core Dot */}
                        <circle
                          ref={dotCoreRef}
                          r="3.5"
                          fill="#38bdf8"
                        />
                        {/* Center White Pin Highlight */}
                        <circle
                          ref={dotCenterRef}
                          r="1.75"
                          fill="#ffffff"
                        />
                      </g>
                    </svg>

                    {/* Workstream Gantt Rows */}
                    {WORKSTREAM_BASES.map((ws, wsIdx) => {
                      const isHovered = activeHoverId === ws.id;
                      const phaseState = getWorkstreamPhaseState(ws.id, simPhase);
                      const isTaskActive = activeTaskIdx === wsIdx;
                      const isTaskCompleted = simPhase > ws.activePhase;
                      const isAdvancing = isTaskActive;

                      return (
                        <div
                          key={ws.id}
                          className="sec2-gantt-row relative min-h-0 flex-1 group transition-colors duration-200"
                          onMouseEnter={() => setActiveHoverId(ws.id)}
                          onMouseLeave={() => setActiveHoverId(null)}
                        >
                          {/* Row Header & Metadata Label */}
                          <div
                            className="sec2-row-label absolute flex items-center gap-1 sm:gap-2 z-20 pointer-events-none"
                            style={{ left: `${ws.barLeft}%` }}
                          >
                            <span className={`size-1 sm:size-1.5 rounded-sm shrink-0 ${ws.dotColor}`} />
                            <span
                              className="font-semibold tracking-[-0.01em] text-white/90 whitespace-nowrap text-[8.5px] sm:text-[11px] lg:text-[12.5px]"
                            >
                              <span className="sec2-mobile-only">{ws.shortTitle || ws.title}</span>
                              <span className="sec2-desktop-only">{ws.title} — {ws.owner}</span>
                            </span>
                            <span
                              className="sec2-desktop-only font-mono text-white/55 whitespace-nowrap"
                              style={{ fontSize: "9.5px" }}
                            >
                              <span key={phaseState.meta} className="inline-block sec2-text-glide">
                                {phaseState.meta}
                              </span>
                            </span>

                            {/* Ultra-Smooth Autonomous Status Micro-Badge (Hidden on mobile to eliminate clutter) */}
                            <div className="sec2-desktop-flex">
                              <StatusBadge
                                status={phaseState.status}
                                badgeClass={phaseState.statusBadgeClass}
                                dotClass={phaseState.statusDotClass}
                                isAdvancing={isAdvancing}
                              />
                            </div>
                          </div>

                          {/* Task Gantt Bar Container (Fixed 38% width, dark unfinished background visible) */}
                          <div
                            className={`sec2-gantt-bar absolute rounded-[3px] sm:rounded-md border bg-[#121316] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors duration-500 ${
                              isTaskCompleted
                                ? "border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.12)]"
                                : isTaskActive
                                ? "border-white/40 shadow-[0_0_16px_rgba(255,255,255,0.12)]"
                                : isHovered
                                ? "border-white/25"
                                : "border-white/[0.09]"
                            }`}
                            style={{
                              left: `${ws.barLeft}%`,
                              width: "38%",
                            }}
                          >
                            {/* Smooth Progress Fill (Animates from left to right: 0% -> 100%, stationary when complete) */}
                            <div
                              ref={(el) => {
                                fillRefs.current[wsIdx] = el;
                              }}
                              className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-[2px] sm:rounded-[5px]"
                              style={{
                                width: "0%", // controlled by GSAP master timeline
                                background: isTaskCompleted
                                  ? `linear-gradient(90deg, ${ws.themeColor}35 0%, ${ws.themeColor}85 100%)`
                                  : `linear-gradient(90deg, ${ws.themeColor}25 0%, ${ws.themeColor}75 80%, ${ws.themeColor} 100%)`,
                                boxShadow: isTaskActive || isTaskCompleted ? `0 0 14px ${ws.themeColor}35` : "none",
                              }}
                            >
                              {/* Active Leading-Edge Spark (visible only while actively advancing) */}
                              {isTaskActive && (
                                <span
                                  className="absolute right-0 inset-y-0 w-2.5 bg-gradient-to-r from-transparent via-white/50 to-white/95"
                                  style={{
                                    boxShadow: `0 0 8px #ffffff, 0 0 14px ${ws.themeColor}`,
                                  }}
                                />
                              )}
                            </div>

                            {/* Milestone Diamond Markers & Labels */}
                            {phaseState.milestones.map((m) => {
                              const isCompleted = isTaskCompleted || m.state === "completed";
                              const isActive = isTaskActive && m.state === "active";

                              return (
                                <span
                                  key={m.label}
                                  className="absolute inset-y-0 z-10 pointer-events-none"
                                  style={{
                                    left: `${m.percent}%`,
                                  }}
                                >
                                  {/* Diamond marker */}
                                  <span
                                    className={`absolute left-0 top-1/2 size-1 sm:size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border transition-all duration-700 ease-out ${
                                      isCompleted
                                        ? "border-emerald-400/90 bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.55)]"
                                        : isActive
                                        ? "border-rose-400/90 bg-rose-500/25 shadow-[0_0_7px_rgba(244,63,94,0.45)]"
                                        : "border-white/35 bg-[#101112]"
                                    }`}
                                    style={
                                      isActive && m.glowColor
                                        ? { borderColor: m.glowColor, boxShadow: `0 0 7px ${m.glowColor}` }
                                        : undefined
                                    }
                                  />

                                  {/* Milestone label underneath (top-[29px]) - hidden on mobile to eliminate overlap */}
                                  <span
                                    className={`hidden sm:inline absolute left-0 top-[29px] -translate-x-1/2 whitespace-nowrap select-none transition-colors duration-700 ${
                                      isCompleted
                                        ? "text-emerald-300/80 font-medium"
                                        : isActive
                                        ? "text-white/70 font-medium"
                                        : "text-white/27"
                                    }`}
                                    style={{ fontSize: "8px", lineHeight: "9px" }}
                                  >
                                    {m.label}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Agency Workflow Pillars (Preserved for desktop, hidden on mobile for clean UI) */}
        <div className="hidden md:grid mx-0 mt-10 lg:mt-12 gap-6 sm:gap-8 md:grid-cols-3 lg:mx-5 lg:gap-12">
          {/* Card 1 */}
          <div className="sec2-pillar-card max-w-sm text-base leading-relaxed text-muted-foreground group">
            <p className="flex items-center gap-2 font-medium text-foreground text-sm lg:text-base">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="shrink-0 text-cyan-400 transition-transform duration-300 group-hover:scale-110"
              >
                <path d="M12 8V12L13.5 13.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.5 16.5A9 9 0 1 1 12 3a9 9 0 0 1 7.5 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Predictable Delivery Gates.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Define phases, review checkpoints, and sign-offs for every client deliverable before work starts.
            </p>
          </div>

          {/* Card 2 */}
          <div className="sec2-pillar-card max-w-sm text-base leading-relaxed text-muted-foreground group">
            <p className="flex items-center gap-2 font-medium text-foreground text-sm lg:text-base">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="shrink-0 text-rose-400 transition-transform duration-300 group-hover:scale-110"
              >
                <path d="M14 11l4 2-4 2v-4z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Zero Misplaced Feedback.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Revisions, client edits, and owner handoffs live in one timeline—no chasing WhatsApp or email threads.
            </p>
          </div>

          {/* Card 3 */}
          <div className="sec2-pillar-card max-w-sm text-base leading-relaxed text-muted-foreground group">
            <p className="flex items-center gap-2 font-medium text-foreground text-sm lg:text-base">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="shrink-0 text-emerald-400 transition-transform duration-300 group-hover:scale-110"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Full Client Transparency.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Share real-time status and deliverable stages through the dedicated client portal with total security.
            </p>
          </div>
        </div>

        {/* Diagonal Striped Hairline Divider at Section Boundary */}
        <div
          aria-hidden="true"
          className="sec2-divider relative mx-auto h-10 w-full max-w-[1344px] lg:w-[calc(100%-3.5rem)]"
          style={{
            marginTop: "clamp(3.5rem, 6vw, 5.5rem)",
            marginBottom: "clamp(2.5rem, 4.5vw, 4rem)",
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 border-y border-white/[0.12] bg-[repeating-linear-gradient(135deg,transparent_0,transparent_6px,rgba(255,255,255,0.06)_6px,rgba(255,255,255,0.06)_7px)]" />
          <span className="absolute left-0 top-0 z-10 size-3 -translate-x-1/2 -translate-y-1/2 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-[linear-gradient(to_bottom,transparent,rgba(226,232,240,0.65)_50%,transparent)] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-[linear-gradient(to_right,transparent,rgba(226,232,240,0.65)_50%,transparent)]" />
          <span className="absolute right-0 top-0 z-10 size-3 translate-x-1/2 -translate-y-1/2 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-[linear-gradient(to_bottom,transparent,rgba(226,232,240,0.65)_50%,transparent)] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-[linear-gradient(to_right,transparent,rgba(226,232,240,0.65)_50%,transparent)]" />
          <span className="absolute bottom-0 left-0 z-10 size-3 -translate-x-1/2 translate-y-1/2 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-[linear-gradient(to_bottom,transparent,rgba(226,232,240,0.65)_50%,transparent)] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-[linear-gradient(to_right,transparent,rgba(226,232,240,0.65)_50%,transparent)]" />
          <span className="absolute bottom-0 right-0 z-10 size-3 translate-x-1/2 translate-y-1/2 before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:-translate-x-1/2 before:bg-[linear-gradient(to_bottom,transparent,rgba(226,232,240,0.65)_50%,transparent)] after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:-translate-y-1/2 after:bg-[linear-gradient(to_right,transparent,rgba(226,232,240,0.65)_50%,transparent)]" />
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
