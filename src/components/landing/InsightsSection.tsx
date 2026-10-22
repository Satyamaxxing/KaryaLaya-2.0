"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Canonical team members matching KaryaLaya product data
export interface TeamWorkload {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  completed: number;
  inProgress: number;
  inReview: number;
}

export interface DeliverableItem {
  id: string;
  title: string;
  workstream: string;
  assignee: string;
  assigneeInitials: string;
  status: "APPROVED" | "COMPLETED" | "IN_REVIEW" | "IN_PROGRESS";
  dueDate: string;
  progress: number;
  milestones: string[];
  client: string;
}

const TEAM_WORKLOAD_14D: TeamWorkload[] = [
  {
    id: "satyam",
    name: "Satyam Kumar",
    role: "Lead Web Dev",
    initials: "SK",
    avatarBg: "rgba(16, 185, 129, 0.2)",
    avatarText: "#34d399",
    completed: 48,
    inProgress: 24,
    inReview: 8,
  },
  {
    id: "rishav",
    name: "Rishav Ray",
    role: "Motion Specialist",
    initials: "RR",
    avatarBg: "rgba(99, 102, 241, 0.2)",
    avatarText: "#818cf8",
    completed: 42,
    inProgress: 20,
    inReview: 10,
  },
  {
    id: "aisha",
    name: "Aisha Patel",
    role: "Social Strategist",
    initials: "AP",
    avatarBg: "rgba(245, 158, 11, 0.2)",
    avatarText: "#fbbf24",
    completed: 38,
    inProgress: 26,
    inReview: 8,
  },
  {
    id: "arjun",
    name: "Arjun Nair",
    role: "Brand Architect",
    initials: "AN",
    avatarBg: "rgba(168, 85, 247, 0.2)",
    avatarText: "#c084fc",
    completed: 34,
    inProgress: 18,
    inReview: 6,
  },
  {
    id: "priya",
    name: "Priya Shah",
    role: "Lead Designer",
    initials: "PS",
    avatarBg: "rgba(244, 63, 94, 0.2)",
    avatarText: "#fb7185",
    completed: 30,
    inProgress: 16,
    inReview: 6,
  },
  {
    id: "rohan",
    name: "Rohan Varma",
    role: "Delivery Lead",
    initials: "RV",
    avatarBg: "rgba(14, 165, 233, 0.2)",
    avatarText: "#38bdf8",
    completed: 24,
    inProgress: 14,
    inReview: 10,
  },
  {
    id: "meera",
    name: "Meera Sen",
    role: "Creative Head",
    initials: "MS",
    avatarBg: "rgba(20, 184, 166, 0.2)",
    avatarText: "#2dd4bf",
    completed: 20,
    inProgress: 8,
    inReview: 6,
  },
  {
    id: "gate",
    name: "Agency Gate",
    role: "Client Review",
    initials: "AG",
    avatarBg: "rgba(148, 163, 184, 0.2)",
    avatarText: "#cbd5e1",
    completed: 16,
    inProgress: 8,
    inReview: 12,
  },
];

const TEAM_WORKLOAD_30D: TeamWorkload[] = [
  {
    id: "satyam",
    name: "Satyam Kumar",
    role: "Lead Web Dev",
    initials: "SK",
    avatarBg: "rgba(16, 185, 129, 0.2)",
    avatarText: "#34d399",
    completed: 96,
    inProgress: 36,
    inReview: 14,
  },
  {
    id: "rishav",
    name: "Rishav Ray",
    role: "Motion Specialist",
    initials: "RR",
    avatarBg: "rgba(99, 102, 241, 0.2)",
    avatarText: "#818cf8",
    completed: 86,
    inProgress: 30,
    inReview: 16,
  },
  {
    id: "aisha",
    name: "Aisha Patel",
    role: "Social Strategist",
    initials: "AP",
    avatarBg: "rgba(245, 158, 11, 0.2)",
    avatarText: "#fbbf24",
    completed: 78,
    inProgress: 42,
    inReview: 14,
  },
  {
    id: "arjun",
    name: "Arjun Nair",
    role: "Brand Architect",
    initials: "AN",
    avatarBg: "rgba(168, 85, 247, 0.2)",
    avatarText: "#c084fc",
    completed: 68,
    inProgress: 28,
    inReview: 12,
  },
  {
    id: "priya",
    name: "Priya Shah",
    role: "Lead Designer",
    initials: "PS",
    avatarBg: "rgba(244, 63, 94, 0.2)",
    avatarText: "#fb7185",
    completed: 62,
    inProgress: 24,
    inReview: 10,
  },
  {
    id: "rohan",
    name: "Rohan Varma",
    role: "Delivery Lead",
    initials: "RV",
    avatarBg: "rgba(14, 165, 233, 0.2)",
    avatarText: "#38bdf8",
    completed: 52,
    inProgress: 22,
    inReview: 18,
  },
  {
    id: "meera",
    name: "Meera Sen",
    role: "Creative Head",
    initials: "MS",
    avatarBg: "rgba(20, 184, 166, 0.2)",
    avatarText: "#2dd4bf",
    completed: 44,
    inProgress: 14,
    inReview: 8,
  },
  {
    id: "gate",
    name: "Agency Gate",
    role: "Client Review",
    initials: "AG",
    avatarBg: "rgba(148, 163, 184, 0.2)",
    avatarText: "#cbd5e1",
    completed: 36,
    inProgress: 14,
    inReview: 22,
  },
];

const INITIAL_DELIVERABLES: DeliverableItem[] = [
  {
    id: "del-1",
    title: "Landing Page Experience",
    workstream: "Web Dev",
    assignee: "Satyam Kumar",
    assigneeInitials: "SK",
    status: "APPROVED",
    dueDate: "Oct 12",
    progress: 100,
    client: "Acme Corp",
    milestones: [
      "Information Architecture",
      "Interactive Wireframes",
      "Tailwind/GSAP Engineering",
      "Client Final Sign-Off",
    ],
  },
  {
    id: "del-2",
    title: "Launch Reel — V3 Master",
    workstream: "Motion & 3D",
    assignee: "Rishav Ray",
    assigneeInitials: "RR",
    status: "COMPLETED",
    dueDate: "Oct 14",
    progress: 100,
    client: "Acme Corp",
    milestones: [
      "Storyboard & Animatic",
      "3D Product Modeling",
      "Sound Design & Color Grading",
      "4K Master Export",
    ],
  },
  {
    id: "del-3",
    title: "Content Calendar & Distribution",
    workstream: "Social Media",
    assignee: "Aisha Patel",
    assigneeInitials: "AP",
    status: "IN_REVIEW",
    dueDate: "Oct 22",
    progress: 85,
    client: "Acme Corp",
    milestones: [
      "Growth Angle Strategy",
      "Copy Deck & Hooks",
      "Carousel & Video Assets",
      "Client Approval Gate",
    ],
  },
  {
    id: "del-4",
    title: "Founder Brand Identity Kit",
    workstream: "Brand Design",
    assignee: "Arjun Nair",
    assigneeInitials: "AN",
    status: "IN_PROGRESS",
    dueDate: "Oct 26",
    progress: 65,
    client: "Acme Corp",
    milestones: [
      "Competitive Brand Audit",
      "Primary & Secondary Marks",
      "Typography Scale",
      "Brand Guidelines Deck",
    ],
  },
  {
    id: "del-5",
    title: "Client Approval Portal Review",
    workstream: "Client Gate",
    assignee: "Rohan Varma",
    assigneeInitials: "RV",
    status: "IN_REVIEW",
    dueDate: "Oct 28",
    progress: 75,
    client: "Acme Corp",
    milestones: [
      "Portal Workspace Setup",
      "Feedback Notification Rules",
      "Magic Link Access Test",
      "Executive Sign-Off Gate",
    ],
  },
  {
    id: "del-6",
    title: "Campaign Distribution Pipeline",
    workstream: "Growth",
    assignee: "Satyam Kumar",
    assigneeInitials: "SK",
    status: "IN_PROGRESS",
    dueDate: "Nov 02",
    progress: 40,
    client: "Acme Corp",
    milestones: [
      "Ad Analytics Webhook Schema",
      "Segment Audiences Config",
      "Automated UTM Tagging",
      "Multi-Channel Push",
    ],
  },
  {
    id: "del-7",
    title: "Asset Delivery Sign-Off",
    workstream: "Delivery",
    assignee: "Meera Sen",
    assigneeInitials: "MS",
    status: "IN_PROGRESS",
    dueDate: "Nov 05",
    progress: 30,
    client: "Acme Corp",
    milestones: [
      "Asset Packaging & Indexing",
      "License Documentation",
      "Client Handover Session",
      "Final Retainer Transition",
    ],
  },
];

type KpiFilter = "all" | "completed" | "in_progress" | "reviews" | "deadlines";

export function InsightsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // User interactive state
  const [dateRange, setDateRange] = useState<"14d" | "30d">("14d");
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(INITIAL_DELIVERABLES);
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilter>("all");
  const [hoveredMember, setHoveredMember] = useState<TeamWorkload | null>(null);
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<"insights" | "inbox" | "projects" | "deliverables" | "approvals">("insights");
  const [isInboxOpen, setIsInboxOpen] = useState<boolean>(false);

  // Series visibility toggles in chart legend
  const [visibleSeries, setVisibleSeries] = useState({
    completed: true,
    inProgress: true,
    inReview: true,
  });

  // Continuous subtle motion & simulation
  const [isLiveSimulation, setIsLiveSimulation] = useState<boolean>(true);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [highlightedKpiKey, setHighlightedKpiKey] = useState<KpiFilter | null>(null);
  const [activityNotice, setActivityNotice] = useState<string>("Acme Campaign synced with agency workspace");

  // Entrance count-up display numbers
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [displayCounts, setDisplayCounts] = useState({
    completed: 0,
    inProgress: 0,
    reviews: 0,
    deadlines: 0,
  });

  // Target metrics based on dateRange and dynamic state
  const targetCompleted = dateRange === "14d" ? 1428 : 3120;
  const targetInProgress = dateRange === "14d" ? 38 : 54;
  const targetReviews = dateRange === "14d" ? 12 : 19;
  const targetDeadlines = dateRange === "14d" ? 18 : 34;
  const maxDeadlines = dateRange === "14d" ? 20 : 36;

  // Animate numbers counting up on entrance or date range toggle
  useEffect(() => {
    if (!hasEntered) return;

    let start = 0;
    const duration = 1100;
    const startTime = performance.now();

    const startCompleted = displayCounts.completed;
    const startInProgress = displayCounts.inProgress;
    const startReviews = displayCounts.reviews;
    const startDeadlines = displayCounts.deadlines;

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // smooth easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplayCounts({
        completed: Math.round(startCompleted + (targetCompleted - startCompleted) * ease),
        inProgress: Math.round(startInProgress + (targetInProgress - startInProgress) * ease),
        reviews: Math.round(startReviews + (targetReviews - startReviews) * ease),
        deadlines: Math.round(startDeadlines + (targetDeadlines - startDeadlines) * ease),
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [hasEntered, dateRange, targetCompleted, targetInProgress, targetReviews, targetDeadlines]);

  // Rotate through realistic demo activity every 4–6 seconds
  useEffect(() => {
    if (!isLiveSimulation) return;

    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cycle = 0;
    const interval = setInterval(() => {
      cycle = (cycle + 1) % 5;

      if (cycle === 1) {
        // Step 1: Content Calendar approved by client
        setDeliverables((prev) =>
          prev.map((d) =>
            d.id === "del-3" ? { ...d, status: "APPROVED", progress: 100 } : d
          )
        );
        setHighlightedRowId("del-3");
        setHighlightedKpiKey("completed");
        setActivityNotice("Client Gate approved Content Calendar & Distribution (Aisha)");
      } else if (cycle === 2) {
        // Step 2: Campaign Distribution advances
        setDeliverables((prev) =>
          prev.map((d) =>
            d.id === "del-6" ? { ...d, progress: 65 } : d
          )
        );
        setHighlightedRowId("del-6");
        setHighlightedKpiKey("in_progress");
        setActivityNotice("Satyam pushed webhook testing for Campaign Distribution (65%)");
      } else if (cycle === 3) {
        // Step 3: Brand Identity Kit progresses
        setDeliverables((prev) =>
          prev.map((d) =>
            d.id === "del-4" ? { ...d, progress: 85, status: "IN_REVIEW" } : d
          )
        );
        setHighlightedRowId("del-4");
        setHighlightedKpiKey("reviews");
        setActivityNotice("Arjun submitted Founder Brand Identity Kit for agency review");
      } else if (cycle === 4) {
        // Step 4: Asset Delivery Sign-Off ticks
        setDeliverables((prev) =>
          prev.map((d) =>
            d.id === "del-7" ? { ...d, progress: 50 } : d
          )
        );
        setHighlightedRowId("del-7");
        setHighlightedKpiKey("in_progress");
        setActivityNotice("Meera packaged initial staging assets for Acme delivery");
      } else {
        // Step 5: Reset smoothly
        setDeliverables(INITIAL_DELIVERABLES);
        setHighlightedRowId(null);
        setHighlightedKpiKey(null);
        setActivityNotice("Real-time live sync: Sprint velocity on track (90%)");
      }

      // Reset row highlight after 1.5s
      const timer = setTimeout(() => {
        setHighlightedRowId(null);
        setHighlightedKpiKey(null);
      }, 1500);

      return () => clearTimeout(timer);
    }, 5200);

    return () => clearInterval(interval);
  }, [isLiveSimulation]);

  // Team workload data based on active dateRange
  const activeWorkloadData = useMemo(() => {
    return dateRange === "14d" ? TEAM_WORKLOAD_14D : TEAM_WORKLOAD_30D;
  }, [dateRange]);

  // Filtered deliverables based on activeKpiFilter, search, and activeNav
  const filteredDeliverables = useMemo(() => {
    let list = [...deliverables];

    // Sidebar nav filtering
    if (activeNav === "approvals") {
      list = list.filter((d) => d.status === "IN_REVIEW");
    }

    // KPI Card filtering
    if (activeKpiFilter === "completed") {
      list = list.filter((d) => d.status === "APPROVED" || d.status === "COMPLETED");
    } else if (activeKpiFilter === "in_progress") {
      list = list.filter((d) => d.status === "IN_PROGRESS");
    } else if (activeKpiFilter === "reviews") {
      list = list.filter((d) => d.status === "IN_REVIEW");
    } else if (activeKpiFilter === "deadlines") {
      list = list.filter((d) => d.dueDate.includes("Oct 22") || d.dueDate.includes("Oct 26") || d.dueDate.includes("Oct 28"));
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.workstream.toLowerCase().includes(q) ||
          d.assignee.toLowerCase().includes(q) ||
          d.status.toLowerCase().includes(q)
      );
    }

    return list;
  }, [deliverables, activeKpiFilter, searchQuery, activeNav]);

  // GSAP scroll-triggered entrance animation exactly matching user prompt:
  // - Main frame: scale 0.97 -> 1, duration 0.8s
  // - Sidebar: slide in from left, duration 0.7s
  // - KPI cards: alternate directions (left, top, right, bottom), stagger 0.12s, duration 0.65s
  // - Workload chart: reveal bars from bottom to top, stagger 0.045s
  // - Deliverables table: slide in from right, revealing rows with 0.07s stagger
  // - power3.out easing, start at top 78%, support reverse scrolling without glitch
  useGsapContext(
    () => {
      const sec = sectionRef.current;
      if (!sec) return;

      const titleLines = sec.querySelectorAll(".insights-title-line");
      const frame = sec.querySelector(".insights-dashboard-frame");
      const sidebar = sec.querySelector(".insights-sidebar");
      const kpiCards = sec.querySelectorAll(".insights-kpi-card");
      const chartCard = sec.querySelector(".insights-chart-card");
      const chartBars = sec.querySelectorAll(".insights-chart-bar");
      const tableCard = sec.querySelector(".insights-table-card");
      const tableRows = sec.querySelectorAll(".insights-table-row");
      const sparklines = sec.querySelectorAll(".insights-sparkline-path");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top 78%",
          toggleActions: "play none none reverse",
          onEnter: () => setHasEntered(true),
        },
      });

      // 1. Header title lines
      tl.fromTo(
        titleLines,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      )
        // 2. Main dashboard frame: subtle fade-in with scale 0.97 -> 1, duration 0.8s
        .fromTo(
          frame,
          { opacity: 0, scale: 0.97 },
          { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" },
          "-=0.5"
        )
        // 3. Sidebar: slide in from left, duration 0.7s
        .fromTo(
          sidebar,
          { opacity: 0, x: -35 },
          { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" },
          "-=0.6"
        );

      // 4. KPI cards: alternate directions (left, top, right, bottom) with stagger 0.12s, duration 0.65s
      const cardDirections = [
        { x: -30, y: 0 },
        { x: 0, y: -30 },
        { x: 30, y: 0 },
        { x: 0, y: 30 },
      ];

      kpiCards.forEach((card, idx) => {
        const dir = cardDirections[idx % cardDirections.length];
        tl.fromTo(
          card,
          { opacity: 0, x: dir.x, y: dir.y },
          { opacity: 1, x: 0, y: 0, duration: 0.65, ease: "power3.out" },
          idx === 0 ? "-=0.45" : "<+0.12"
        );
      });

      // Sparkline trend lines draw in
      tl.fromTo(
        sparklines,
        { strokeDashoffset: 100 },
        { strokeDashoffset: 0, duration: 0.85, stagger: 0.1, ease: "power2.out" },
        "-=0.5"
      );

      // 5. Workload chart: reveal bars from bottom to top, stagger 0.045s
      tl.fromTo(
        chartCard,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" },
        "-=0.35"
      ).fromTo(
        chartBars,
        { scaleY: 0, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.75, stagger: 0.045, ease: "power3.out" },
        "-=0.4"
      );

      // 6. Deliverables table: slide in from right, revealing rows with 0.07s stagger
      tl.fromTo(
        tableCard,
        { opacity: 0, x: 35 },
        { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" },
        "-=0.6"
      ).fromTo(
        tableRows,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power3.out" },
        "-=0.5"
      );
    },
    sectionRef,
    []
  );

  // Toggle KPI Filter helper
  const handleKpiCardClick = (filter: KpiFilter) => {
    setActiveKpiFilter((current) => (current === filter ? "all" : filter));
  };

  // Toggle Chart Series
  const toggleSeries = (series: "completed" | "inProgress" | "inReview") => {
    setVisibleSeries((prev) => ({
      ...prev,
      [series]: !prev[series],
    }));
  };

  // Deliverable status update from detail inspector
  const updateDeliverableStatus = (
    id: string,
    newStatus: "APPROVED" | "COMPLETED" | "IN_REVIEW" | "IN_PROGRESS"
  ) => {
    const updated = deliverables.map((d) => {
      if (d.id === id) {
        const newProgress =
          newStatus === "APPROVED" || newStatus === "COMPLETED"
            ? 100
            : newStatus === "IN_REVIEW"
            ? 85
            : 50;
        return { ...d, status: newStatus, progress: newProgress };
      }
      return d;
    });
    setDeliverables(updated);
    if (selectedDeliverable && selectedDeliverable.id === id) {
      setSelectedDeliverable({
        ...selectedDeliverable,
        status: newStatus,
        progress:
          newStatus === "APPROVED" || newStatus === "COMPLETED"
            ? 100
            : newStatus === "IN_REVIEW"
            ? 85
            : 50,
      });
    }
    setActivityNotice(`Updated "${selectedDeliverable?.title || id}" status to ${newStatus}`);
  };

  return (
    <section
      id="insights"
      ref={sectionRef}
      style={{
        position: "relative",
        overflow: "hidden",
        paddingTop: "6rem",
        paddingBottom: "5.5rem",
        color: "#ffffff",
      }}
    >
      {/* Scoped CSS Styles for smooth transitions, layout, and glows */}
      <style>{`
        .insights-sidebar {
          width: 210px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background-color: rgba(12, 13, 18, 0.95);
          padding: 1.25rem 1rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .insights-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 1.25rem;
        }
        .insights-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          gap: 14px;
        }
        .insights-chart-bar-glow {
          animation: barSubtleGlow 4s ease-in-out infinite alternate;
        }
        @keyframes barSubtleGlow {
          0% { filter: drop-shadow(0 0 1px rgba(52, 211, 153, 0.15)); }
          100% { filter: drop-shadow(0 0 6px rgba(52, 211, 153, 0.45)); }
        }
        @keyframes sweepAura {
          0% { transform: translate(-30%, -20%) scale(1); opacity: 0.12; }
          50% { transform: translate(30%, 15%) scale(1.15); opacity: 0.22; }
          100% { transform: translate(-30%, -20%) scale(1); opacity: 0.12; }
        }
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .live-dot-pulse {
          animation: liveDotPulse 2s ease-in-out infinite;
        }
        .insights-sparkline-path {
          stroke-dasharray: 100;
          transition: stroke-dashoffset 0.8s ease-out;
        }
        @media (max-width: 1100px) {
          .insights-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 1023px) {
          .insights-sidebar {
            display: none !important;
          }
          .insights-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .insights-url-pill {
            display: none !important;
          }
          .insights-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Atmospheric ambient emerald light sweep */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "10%",
          width: "900px",
          height: "450px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.05) 45%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          animation: "sweepAura 18s ease-in-out infinite alternate",
        }}
      />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.25rem" }}>
        {/* Section Header */}
        <div style={{ marginBottom: "2.75rem" }}>
          {/* Eyebrow Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                borderRadius: "9999px",
                border: "1px solid rgba(16, 185, 129, 0.28)",
                backgroundColor: "rgba(16, 185, 129, 0.10)",
                padding: "0.25rem 0.85rem",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#34d399",
                textTransform: "uppercase",
                boxShadow: "0 0 12px rgba(16, 185, 129, 0.15)",
              }}
            >
              <span
                className="live-dot-pulse"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "9999px",
                  backgroundColor: "#34d399",
                  boxShadow: "0 0 8px rgba(52, 211, 153, 0.9)",
                }}
              />
              WORKSPACE INSIGHTS
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "11px",
                color: "rgba(255, 255, 255, 0.5)",
                letterSpacing: "0.1em",
              }}
            >
              <span style={{ color: "#34d399" }}>✦</span>
              REAL-TIME VISIBILITY · AGENCY METRICS
            </div>
          </div>

          <div>
            <h2
              className="font-display tracking-tight"
              style={{
                fontSize: "clamp(44px, 5.2vw, 72px)",
                lineHeight: 1.05,
                letterSpacing: "-0.065em",
                wordSpacing: "0.18em",
              }}
            >
              <span className="insights-title-line" style={{ display: "block", color: "#ffffff" }}>
                Track your work.
              </span>
              <span
                className="insights-title-line"
                style={{
                  display: "block",
                  marginTop: "clamp(0.5rem, 1vw, 0.875rem)",
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                Understand your progress.
              </span>
            </h2>
          </div>
        </div>

        {/* Dashboard Window Frame */}
        <div
          className="insights-dashboard-frame"
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            background:
              "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05), transparent 65%), linear-gradient(180deg, #0e1015 0%, #08090c 100%)",
            boxShadow:
              "0 25px 70px -15px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        >
          {/* Top Window Header */}
          <div
            style={{
              display: "flex",
              height: "44px",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              padding: "0 1.25rem",
            }}
          >
            {/* Window control dots */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(239, 68, 68, 0.85)",
                  boxShadow: "0 0 6px rgba(239, 68, 68, 0.4)",
                }}
              />
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(245, 158, 11, 0.85)",
                  boxShadow: "0 0 6px rgba(245, 158, 11, 0.4)",
                }}
              />
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(16, 185, 129, 0.85)",
                  boxShadow: "0 0 6px rgba(16, 185, 129, 0.4)",
                }}
              />
            </div>

            {/* Address bar pill */}
            <div
              className="insights-url-pill"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                padding: "3px 14px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "11px",
                color: "rgba(255, 255, 255, 0.65)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>karyalaya.agency/workspace/insights</span>
            </div>

            {/* Live simulation toggle button */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setIsLiveSimulation(!isLiveSimulation)}
                title="Click to toggle continuous demo simulation"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "9999px",
                  border: isLiveSimulation
                    ? "1px solid rgba(16, 185, 129, 0.35)"
                    : "1px solid rgba(245, 158, 11, 0.35)",
                  backgroundColor: isLiveSimulation
                    ? "rgba(16, 185, 129, 0.12)"
                    : "rgba(245, 158, 11, 0.12)",
                  padding: "3px 10px",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "9.5px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: isLiveSimulation ? "#34d399" : "#fbbf24",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                <span
                  className={isLiveSimulation ? "live-dot-pulse" : ""}
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "9999px",
                    backgroundColor: isLiveSimulation ? "#34d399" : "#fbbf24",
                  }}
                />
                {isLiveSimulation ? "● LIVE SYNC" : "❚❚ PAUSED"}
              </button>
            </div>
          </div>

          {/* Dual Column Side-by-Side Content */}
          <div style={{ display: "flex", width: "100%", minHeight: "560px", position: "relative" }}>
            {/* Sidebar (Left Column) */}
            <aside aria-label="Workspace sidebar" className="insights-sidebar">
              <div>
                {/* Brand & Workspace Switcher */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #34d399, #38bdf8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        color: "#000",
                        fontSize: "12px",
                        boxShadow: "0 0 10px rgba(52, 211, 153, 0.4)",
                      }}
                    >
                      K
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                      KaryaLaya
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>

                  {/* Interactive Quick Search button */}
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    title="Search deliverables"
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      backgroundColor: isSearchOpen ? "rgba(16, 185, 129, 0.2)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isSearchOpen ? "#34d399" : "rgba(255, 255, 255, 0.6)",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </button>
                </div>

                {/* Optional Search bar dropdown */}
                {isSearchOpen && (
                  <div style={{ marginBottom: "1rem" }}>
                    <input
                      type="text"
                      placeholder="Filter deliverables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                        borderRadius: "6px",
                        padding: "5px 8px",
                        fontSize: "11px",
                        color: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>
                )}

                {/* Primary Nav Items */}
                <nav style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                  {/* Inbox Item */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveNav("inbox");
                      setIsInboxOpen(!isInboxOpen);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: activeNav === "inbox" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                      color: activeNav === "inbox" ? "#fff" : "rgba(255, 255, 255, 0.65)",
                      transition: "background 150ms ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span>Inbox</span>
                    </div>
                    <span style={{ borderRadius: "9999px", background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", padding: "1px 6px", fontSize: "9px", fontFamily: "monospace", fontWeight: 600 }}>
                      4
                    </span>
                  </div>

                  {/* Active Insights Item */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveNav("insights");
                      setActiveKpiFilter("all");
                      setSearchQuery("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: activeNav === "insights" ? "1px solid rgba(16, 185, 129, 0.28)" : "1px solid transparent",
                      backgroundColor: activeNav === "insights" ? "rgba(16, 185, 129, 0.12)" : "transparent",
                      color: activeNav === "insights" ? "#34d399" : "rgba(255, 255, 255, 0.65)",
                      fontWeight: activeNav === "insights" ? 600 : 400,
                      cursor: "pointer",
                      boxShadow: activeNav === "insights" ? "0 0 12px rgba(16, 185, 129, 0.12)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3v18h18" />
                        <path d="m19 9-5 5-4-4-3 3" />
                      </svg>
                      <span style={{ color: activeNav === "insights" ? "#ffffff" : "inherit" }}>Insights</span>
                    </div>
                    <span style={{ width: "6px", height: "6px", borderRadius: "9999px", backgroundColor: "#34d399" }} />
                  </div>

                  {/* Projects Item */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveNav("projects");
                      setActiveKpiFilter("all");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: activeNav === "projects" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                      color: activeNav === "projects" ? "#fff" : "rgba(255, 255, 255, 0.65)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                      </svg>
                      <span>Projects</span>
                    </div>
                    <span style={{ borderRadius: "9999px", background: "rgba(255, 255, 255, 0.1)", padding: "1px 6px", fontSize: "9px", fontFamily: "monospace" }}>
                      12
                    </span>
                  </div>

                  {/* Deliverables Item */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveNav("deliverables");
                      setActiveKpiFilter("all");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: activeNav === "deliverables" ? "rgba(255, 255, 255, 0.08)" : "transparent",
                      color: activeNav === "deliverables" ? "#fff" : "rgba(255, 255, 255, 0.65)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      <span>Deliverables</span>
                    </div>
                    <span style={{ borderRadius: "9999px", background: "rgba(255, 255, 255, 0.1)", padding: "1px 6px", fontSize: "9px", fontFamily: "monospace" }}>
                      {deliverables.length}
                    </span>
                  </div>

                  {/* Approvals Item */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveNav("approvals");
                      setActiveKpiFilter("reviews");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: activeNav === "approvals" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                      color: activeNav === "approvals" ? "#fbbf24" : "rgba(255, 255, 255, 0.65)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <span>Approvals</span>
                    </div>
                    <span style={{ borderRadius: "9999px", background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", padding: "1px 6px", fontSize: "9px", fontFamily: "monospace", fontWeight: 600 }}>
                      {deliverables.filter((d) => d.status === "IN_REVIEW").length}
                    </span>
                  </div>
                </nav>

                {/* Workspace subcategory */}
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "1rem" }}>
                  <p style={{ marginBottom: "0.5rem", fontSize: "10px", fontFamily: "var(--font-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255, 255, 255, 0.35)" }}>
                    WORKSPACE
                  </p>
                  <nav style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleKpiCardClick("deadlines")}
                      style={{ display: "flex", alignItems: "center", gap: "9px", padding: "5px 8px", cursor: "pointer", borderRadius: "4px" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                      <span>Deadlines & Radar</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "5px 8px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>Team Capacity</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "5px 8px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                      <span>Client Portal</span>
                    </div>
                  </nav>
                </div>
              </div>

              {/* Favorites Bottom Section */}
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "1rem" }}>
                <p style={{ marginBottom: "0.5rem", fontSize: "10px", fontFamily: "var(--font-mono, monospace)", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255, 255, 255, 0.35)" }}>
                  FAVORITES
                </p>
                <nav style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255, 255, 255, 0.7)" }}>
                    <span style={{ color: "#fbbf24" }}>★</span>
                    <span>Daily Briefing</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255, 255, 255, 0.7)" }}>
                    <span style={{ color: "#34d399" }}>✦</span>
                    <span>Acme Campaign</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255, 255, 255, 0.7)" }}>
                    <span style={{ color: "#38bdf8" }}>◈</span>
                    <span>Delivery Pipeline</span>
                  </div>
                </nav>
              </div>
            </aside>

            {/* Main Workspace Dashboard (Right Column) */}
            <div style={{ flex: 1, padding: "1.25rem 1.5rem", backgroundColor: "rgba(10, 11, 15, 0.8)", minWidth: 0, position: "relative" }}>
              {/* Dashboard Sub-Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.02em" }}>
                    Agency Insights
                  </h3>
                  <span style={{ color: "#fbbf24", fontSize: "12px" }}>★</span>
                  <span style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "12px" }}>•••</span>
                  <span
                    style={{
                      borderRadius: "9999px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      padding: "2px 8px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "9px",
                      color: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    Demo Workspace
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Date Filter Tabs - Interactive */}
                  <div
                    style={{
                      display: "inline-flex",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      padding: "2px",
                      fontSize: "11px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setDateRange("14d")}
                      style={{
                        borderRadius: "6px",
                        padding: "3px 10px",
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: "10.5px",
                        cursor: "pointer",
                        border: dateRange === "14d" ? "1px solid rgba(16, 185, 129, 0.3)" : "none",
                        backgroundColor: dateRange === "14d" ? "rgba(16, 185, 129, 0.18)" : "transparent",
                        color: dateRange === "14d" ? "#34d399" : "rgba(255, 255, 255, 0.6)",
                        transition: "all 150ms ease",
                      }}
                    >
                      Last 14 days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateRange("30d")}
                      style={{
                        borderRadius: "6px",
                        padding: "3px 10px",
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: "10.5px",
                        cursor: "pointer",
                        border: dateRange === "30d" ? "1px solid rgba(16, 185, 129, 0.3)" : "none",
                        backgroundColor: dateRange === "30d" ? "rgba(16, 185, 129, 0.18)" : "transparent",
                        color: dateRange === "30d" ? "#34d399" : "rgba(255, 255, 255, 0.6)",
                        transition: "all 150ms ease",
                      }}
                    >
                      Oct 1 – Oct 31
                    </button>
                  </div>

                  {/* Live Simulation Indicator Pill */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsLiveSimulation(!isLiveSimulation)}
                    title="Click to pause or resume simulation"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      borderRadius: "8px",
                      border: isLiveSimulation
                        ? "1px solid rgba(16, 185, 129, 0.25)"
                        : "1px solid rgba(245, 158, 11, 0.25)",
                      backgroundColor: isLiveSimulation
                        ? "rgba(16, 185, 129, 0.10)"
                        : "rgba(245, 158, 11, 0.10)",
                      padding: "3px 10px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "11px",
                      color: isLiveSimulation ? "#34d399" : "#fbbf24",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      className={isLiveSimulation ? "live-dot-pulse" : ""}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "9999px",
                        backgroundColor: isLiveSimulation ? "#34d399" : "#fbbf24",
                        boxShadow: isLiveSimulation ? "0 0 6px rgba(52, 211, 153, 0.8)" : "none",
                      }}
                    />
                    <span>{isLiveSimulation ? "Live" : "Paused"}</span>
                  </div>
                </div>
              </div>

              {/* 4 Interactive KPI Cards */}
              <div className="insights-kpi-grid">
                {/* 1. Tasks Completed */}
                <div
                  className="insights-kpi-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleKpiCardClick("completed")}
                  title="Click to filter completed deliverables"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "10px",
                    border:
                      activeKpiFilter === "completed"
                        ? "1px solid rgba(16, 185, 129, 0.8)"
                        : highlightedKpiKey === "completed"
                        ? "1px solid rgba(16, 185, 129, 0.6)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    background:
                      activeKpiFilter === "completed"
                        ? "linear-gradient(180deg, rgba(16, 185, 129, 0.12), rgba(255, 255, 255, 0.02))"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.01))",
                    padding: "14px",
                    cursor: "pointer",
                    transform: activeKpiFilter === "completed" ? "translateY(-2px)" : "none",
                    boxShadow:
                      activeKpiFilter === "completed"
                        ? "0 8px 24px rgba(16, 185, 129, 0.2)"
                        : highlightedKpiKey === "completed"
                        ? "0 0 16px rgba(16, 185, 129, 0.3)"
                        : "none",
                    transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)" }}>Tasks Completed</span>
                    <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 600, color: "#34d399" }}>
                      ↑ +14%
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "24px", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.03em" }}>
                      {displayCounts.completed.toLocaleString()}
                    </p>
                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" style={{ color: "#34d399" }}>
                      <path
                        className="insights-sparkline-path"
                        d="M2 20 C12 18, 18 12, 26 14 C34 16, 44 4, 58 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        pathLength="100"
                      />
                      <circle cx="58" cy="3" r="2.5" fill="currentColor" />
                    </svg>
                  </div>
                  <p style={{ marginTop: "4px", fontSize: "10px", color: "rgba(255, 255, 255, 0.4)" }}>
                    +176 deliverables &amp; tasks this cycle
                  </p>
                </div>

                {/* 2. Tasks In Progress */}
                <div
                  className="insights-kpi-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleKpiCardClick("in_progress")}
                  title="Click to filter in-progress deliverables"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "10px",
                    border:
                      activeKpiFilter === "in_progress"
                        ? "1px solid rgba(99, 102, 241, 0.8)"
                        : highlightedKpiKey === "in_progress"
                        ? "1px solid rgba(99, 102, 241, 0.6)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    background:
                      activeKpiFilter === "in_progress"
                        ? "linear-gradient(180deg, rgba(99, 102, 241, 0.12), rgba(255, 255, 255, 0.02))"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.01))",
                    padding: "14px",
                    cursor: "pointer",
                    transform: activeKpiFilter === "in_progress" ? "translateY(-2px)" : "none",
                    boxShadow:
                      activeKpiFilter === "in_progress"
                        ? "0 8px 24px rgba(99, 102, 241, 0.2)"
                        : highlightedKpiKey === "in_progress"
                        ? "0 0 16px rgba(99, 102, 241, 0.3)"
                        : "none",
                    transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)" }}>Tasks In Progress</span>
                    <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 600, color: "#818cf8" }}>
                      ↑ +8%
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "24px", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.03em" }}>
                      {displayCounts.inProgress}
                    </p>
                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" style={{ color: "#818cf8" }}>
                      <path
                        className="insights-sparkline-path"
                        d="M2 16 C12 18, 22 8, 32 12 C42 16, 50 6, 58 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        pathLength="100"
                      />
                      <circle cx="58" cy="4" r="2.5" fill="currentColor" />
                    </svg>
                  </div>
                  <p style={{ marginTop: "4px", fontSize: "10px", color: "rgba(255, 255, 255, 0.4)" }}>
                    Active across 12 agency workstreams
                  </p>
                </div>

                {/* 3. Pending Reviews */}
                <div
                  className="insights-kpi-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleKpiCardClick("reviews")}
                  title="Click to filter pending reviews"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "10px",
                    border:
                      activeKpiFilter === "reviews"
                        ? "1px solid rgba(245, 158, 11, 0.8)"
                        : highlightedKpiKey === "reviews"
                        ? "1px solid rgba(245, 158, 11, 0.6)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    background:
                      activeKpiFilter === "reviews"
                        ? "linear-gradient(180deg, rgba(245, 158, 11, 0.12), rgba(255, 255, 255, 0.02))"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.01))",
                    padding: "14px",
                    cursor: "pointer",
                    transform: activeKpiFilter === "reviews" ? "translateY(-2px)" : "none",
                    boxShadow:
                      activeKpiFilter === "reviews"
                        ? "0 8px 24px rgba(245, 158, 11, 0.2)"
                        : highlightedKpiKey === "reviews"
                        ? "0 0 16px rgba(245, 158, 11, 0.3)"
                        : "none",
                    transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)" }}>Pending Reviews</span>
                    <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 600, color: "#fbbf24" }}>
                      {displayCounts.reviews} Total
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "24px", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.03em" }}>
                      {displayCounts.reviews}
                    </p>
                    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" style={{ color: "#fbbf24" }}>
                      <path
                        className="insights-sparkline-path"
                        d="M2 18 C12 10, 24 16, 34 8 C44 4, 52 8, 58 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        pathLength="100"
                      />
                      <circle cx="58" cy="6" r="2.5" fill="currentColor" />
                    </svg>
                  </div>
                  <p style={{ marginTop: "4px", fontSize: "10px", color: "#fbbf24" }}>
                    6 client approvals · 6 internal gates
                  </p>
                </div>

                {/* 4. Upcoming Deadlines */}
                <div
                  className="insights-kpi-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleKpiCardClick("deadlines")}
                  title="Click to filter upcoming milestone deadlines"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "10px",
                    border:
                      activeKpiFilter === "deadlines"
                        ? "1px solid rgba(16, 185, 129, 0.8)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    background:
                      activeKpiFilter === "deadlines"
                        ? "linear-gradient(180deg, rgba(16, 185, 129, 0.12), rgba(255, 255, 255, 0.02))"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.01))",
                    padding: "14px",
                    cursor: "pointer",
                    transform: activeKpiFilter === "deadlines" ? "translateY(-2px)" : "none",
                    boxShadow: activeKpiFilter === "deadlines" ? "0 8px 24px rgba(16, 185, 129, 0.2)" : "none",
                    transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.55)" }}>Upcoming Deadlines</span>
                    <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 600, color: "#34d399" }}>
                      90% On-Track
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "24px", fontWeight: 300, color: "#ffffff", letterSpacing: "-0.03em" }}>
                      {displayCounts.deadlines}{" "}
                      <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 400 }}>
                        / {maxDeadlines}
                      </span>
                    </p>
                    <span
                      style={{
                        borderRadius: "9999px",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        padding: "2px 7px",
                        fontSize: "9px",
                        fontFamily: "monospace",
                        color: "#34d399",
                      }}
                    >
                      2 due today
                    </span>
                  </div>
                  {/* Progress bar with smooth fill */}
                  <div style={{ marginTop: "8px", height: "5px", width: "100%", borderRadius: "9999px", backgroundColor: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(displayCounts.deadlines / maxDeadlines) * 100}%`,
                        borderRadius: "9999px",
                        background: "linear-gradient(90deg, #10b981, #38bdf8)",
                        transition: "width 800ms cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                  <p style={{ marginTop: "4px", fontSize: "9.5px", color: "rgba(255, 255, 255, 0.4)" }}>
                    Next milestone: Oct 22 (Aisha / Social)
                  </p>
                </div>
              </div>

              {/* Bottom Row: Stacked Chart (Left) + Activity Table (Right) */}
              <div className="insights-bottom-grid">
                {/* 1. Main Chart: Task Completion & Workload by Team Member */}
                <div
                  className="insights-chart-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.01em" }}>
                        Team Workload &amp; Task Distribution
                      </h4>
                      <p style={{ marginTop: "2px", fontSize: "10.5px", color: "rgba(255, 255, 255, 0.45)" }}>
                        Completed, in-progress, and review states across team members
                      </p>
                    </div>

                    <div
                      style={{
                        borderRadius: "6px",
                        border: "1px solid rgba(255, 255, 255, 0.10)",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        padding: "3px 8px",
                        fontFamily: "monospace",
                        fontSize: "10px",
                        color: "rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      {dateRange === "14d" ? "Active Sprint" : "Monthly Scope"}
                    </div>
                  </div>

                  {/* Chart Graphic Area */}
                  <div style={{ position: "relative", flex: 1, minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "14px", paddingBottom: "6px" }}>
                    {/* Y-Axis Gridlines */}
                    <div style={{ position: "absolute", inset: "14px 0", display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
                      {[100, 75, 50, 25, 0].map((val) => (
                        <div
                          key={val}
                          style={{
                            position: "relative",
                            borderTop: "1px dashed rgba(255, 255, 255, 0.07)",
                          }}
                        >
                          <span style={{ position: "absolute", left: "-2px", top: "-10px", fontSize: "9px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.3)" }}>
                            {dateRange === "14d" ? val : val * 2}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Stacked Bars with tooltips */}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 10,
                        display: "flex",
                        height: "155px",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        padding: "0 1.25rem",
                      }}
                    >
                      {activeWorkloadData.map((member) => {
                        const maxVal = dateRange === "14d" ? 100 : 200;
                        const compPct = visibleSeries.completed ? (member.completed / maxVal) * 100 : 0;
                        const progPct = visibleSeries.inProgress ? (member.inProgress / maxVal) * 100 : 0;
                        const revPct = visibleSeries.inReview ? (member.inReview / maxVal) * 100 : 0;
                        const isHovered = hoveredMember?.id === member.id;

                        return (
                          <div
                            key={member.id}
                            style={{
                              position: "relative",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                            onMouseEnter={() => setHoveredMember(member)}
                            onMouseLeave={() => setHoveredMember(null)}
                            onClick={() => {
                              // Filter deliverables by this member
                              setSearchQuery(member.name.split(" ")[0]);
                            }}
                            title={`Click to view deliverables for ${member.name}`}
                          >
                            {/* Rich Hover Tooltip */}
                            {isHovered && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "-72px",
                                  zIndex: 40,
                                  whiteSpace: "nowrap",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(255, 255, 255, 0.15)",
                                  backgroundColor: "#16181f",
                                  padding: "6px 10px",
                                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.9)",
                                  fontSize: "10px",
                                  pointerEvents: "none",
                                }}
                              >
                                <p style={{ fontWeight: 600, color: "#fff" }}>{member.name}</p>
                                <p style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.55)" }}>{member.role}</p>
                                <div style={{ marginTop: "4px", display: "flex", gap: "8px", fontFamily: "monospace", fontSize: "9px" }}>
                                  <span style={{ color: "#34d399" }}>✓ {member.completed}</span>
                                  <span style={{ color: "#818cf8" }}>⏳ {member.inProgress}</span>
                                  <span style={{ color: "#fbbf24" }}>👁 {member.inReview}</span>
                                </div>
                              </div>
                            )}

                            {/* Stacked Bar Container with alternating subtle glow */}
                            <div
                              className="insights-chart-bar insights-chart-bar-glow"
                              style={{
                                width: "18px",
                                height: "135px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-end",
                                overflow: "hidden",
                                borderRadius: "4px 4px 0 0",
                                transform: isHovered ? "scale(1.10)" : "scale(1)",
                                transition: "transform 150ms ease, height 300ms ease",
                              }}
                            >
                              {/* 1. Completed (Emerald) */}
                              <div
                                style={{
                                  height: `${compPct}%`,
                                  backgroundColor: "rgba(16, 185, 129, 0.9)",
                                  boxShadow: "0 0 10px rgba(52, 211, 153, 0.35)",
                                  transition: "height 350ms cubic-bezier(0.16, 1, 0.3, 1)",
                                }}
                              />
                              {/* 2. In Progress (Indigo) */}
                              <div
                                style={{
                                  height: `${progPct}%`,
                                  backgroundColor: "rgba(99, 102, 241, 0.85)",
                                  transition: "height 350ms cubic-bezier(0.16, 1, 0.3, 1)",
                                }}
                              />
                              {/* 3. In Review (Amber) */}
                              <div
                                style={{
                                  height: `${revPct}%`,
                                  backgroundColor: "rgba(245, 158, 11, 0.9)",
                                  transition: "height 350ms cubic-bezier(0.16, 1, 0.3, 1)",
                                }}
                              />
                            </div>

                            {/* Member Avatar / Initial */}
                            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <span
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "9999px",
                                  border: `1px solid ${member.avatarText}40`,
                                  backgroundColor: member.avatarBg,
                                  color: member.avatarText,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "8.5px",
                                  fontWeight: 700,
                                }}
                              >
                                {member.initials}
                              </span>
                              <span
                                style={{
                                  marginTop: "3px",
                                  fontSize: "9px",
                                  fontFamily: "monospace",
                                  color: "rgba(255, 255, 255, 0.5)",
                                }}
                              >
                                {member.name.split(" ")[0]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Chart Legend (Toggle Series on Click) */}
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "14px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      paddingTop: "10px",
                      fontSize: "10.5px",
                      fontFamily: "monospace",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSeries("completed")}
                      title="Click to toggle Completed series"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: visibleSeries.completed ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.35)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: visibleSeries.completed ? "none" : "line-through",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          backgroundColor: "#10b981",
                          boxShadow: visibleSeries.completed ? "0 0 6px rgba(52, 211, 153, 0.6)" : "none",
                          opacity: visibleSeries.completed ? 1 : 0.4,
                        }}
                      />
                      Tasks Completed
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSeries("inProgress")}
                      title="Click to toggle In Progress series"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: visibleSeries.inProgress ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.35)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: visibleSeries.inProgress ? "none" : "line-through",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          backgroundColor: "#6366f1",
                          opacity: visibleSeries.inProgress ? 1 : 0.4,
                        }}
                      />
                      In Progress
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSeries("inReview")}
                      title="Click to toggle In Review series"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: visibleSeries.inReview ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.35)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: visibleSeries.inReview ? "none" : "line-through",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "2px",
                          backgroundColor: "#f59e0b",
                          opacity: visibleSeries.inReview ? 1 : 0.4,
                        }}
                      />
                      In Review
                    </button>
                  </div>
                </div>

                {/* 2. Activity Table: Project & Deliverable Status */}
                <div
                  className="insights-table-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    padding: "16px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.01em" }}>
                        Active Deliverables &amp; Milestones
                      </h4>
                      <p style={{ marginTop: "2px", fontSize: "10.5px", color: "rgba(255, 255, 255, 0.45)" }}>
                        {activityNotice}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {/* Filter Reset pill if filter is active */}
                      {(activeKpiFilter !== "all" || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveKpiFilter("all");
                            setSearchQuery("");
                          }}
                          style={{
                            borderRadius: "9999px",
                            border: "1px solid rgba(245, 158, 11, 0.35)",
                            backgroundColor: "rgba(245, 158, 11, 0.12)",
                            padding: "2px 7px",
                            fontFamily: "monospace",
                            fontSize: "9px",
                            color: "#fbbf24",
                            cursor: "pointer",
                          }}
                        >
                          ✕ Reset filter
                        </button>
                      )}

                      <span
                        style={{
                          borderRadius: "9999px",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          backgroundColor: "rgba(16, 185, 129, 0.10)",
                          padding: "2px 8px",
                          fontFamily: "monospace",
                          fontSize: "9.5px",
                          color: "#34d399",
                        }}
                      >
                        {filteredDeliverables.length} Deliverables
                      </span>
                    </div>
                  </div>

                  {/* Table Container */}
                  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                    <table style={{ width: "100%", minWidth: "540px", textAlign: "left", fontSize: "11px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.4)" }}>
                          <th style={{ paddingBottom: "8px", fontWeight: 400 }}>Deliverable</th>
                          <th style={{ paddingBottom: "8px", fontWeight: 400 }}>Owner</th>
                          <th style={{ paddingBottom: "8px", fontWeight: 400 }}>Status</th>
                          <th style={{ paddingBottom: "8px", fontWeight: 400 }}>Due</th>
                          <th style={{ paddingBottom: "8px", fontWeight: 400, textAlign: "right" }}>Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeliverables.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: "2rem 0", textAlign: "center", color: "rgba(255, 255, 255, 0.45)" }}>
                              No deliverables match the selected filter.
                              <div style={{ marginTop: "6px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKpiFilter("all");
                                    setSearchQuery("");
                                  }}
                                  style={{
                                    border: "1px solid rgba(16, 185, 129, 0.4)",
                                    background: "rgba(16, 185, 129, 0.15)",
                                    color: "#34d399",
                                    padding: "3px 10px",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    cursor: "pointer",
                                  }}
                                >
                                  View all deliverables
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredDeliverables.map((del) => {
                            let badgeBg = "rgba(99, 102, 241, 0.15)";
                            let badgeBorder = "rgba(99, 102, 241, 0.35)";
                            let badgeColor = "#818cf8";
                            let badgeLabel = "In Progress";

                            if (del.status === "APPROVED") {
                              badgeBg = "rgba(16, 185, 129, 0.15)";
                              badgeBorder = "rgba(16, 185, 129, 0.35)";
                              badgeColor = "#34d399";
                              badgeLabel = "Approved";
                            } else if (del.status === "COMPLETED") {
                              badgeBg = "rgba(20, 184, 166, 0.15)";
                              badgeBorder = "rgba(20, 184, 166, 0.35)";
                              badgeColor = "#2dd4bf";
                              badgeLabel = "Completed";
                            } else if (del.status === "IN_REVIEW") {
                              badgeBg = "rgba(245, 158, 11, 0.15)";
                              badgeBorder = "rgba(245, 158, 11, 0.35)";
                              badgeColor = "#fbbf24";
                              badgeLabel = "In Review";
                            }

                            const isRowHighlighted = highlightedRowId === del.id;
                            const isSelected = selectedDeliverable?.id === del.id;

                            return (
                              <tr
                                key={del.id}
                                className="insights-table-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedDeliverable(del)}
                                title="Click to inspect deliverable details & approval checklist"
                                style={{
                                  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                                  cursor: "pointer",
                                  backgroundColor: isRowHighlighted
                                    ? "rgba(16, 185, 129, 0.12)"
                                    : isSelected
                                    ? "rgba(255, 255, 255, 0.06)"
                                    : "transparent",
                                  boxShadow: isRowHighlighted
                                    ? "inset 0 0 16px rgba(16, 185, 129, 0.2)"
                                    : "none",
                                  transition: "all 250ms ease",
                                }}
                              >
                                {/* Deliverable title */}
                                <td style={{ padding: "8px 8px 8px 0" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span
                                      style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "9999px",
                                        backgroundColor: isRowHighlighted ? "#34d399" : "rgba(255, 255, 255, 0.25)",
                                      }}
                                    />
                                    <span style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.9)", maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {del.title}
                                    </span>
                                  </div>
                                  <span style={{ display: "block", fontSize: "9px", color: "rgba(255, 255, 255, 0.4)", fontFamily: "monospace", paddingLeft: "12px" }}>
                                    {del.workstream}
                                  </span>
                                </td>

                                {/* Assignee */}
                                <td style={{ padding: "8px 8px 8px 0" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span
                                      style={{
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "9999px",
                                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "8px",
                                        fontFamily: "monospace",
                                        color: "rgba(255, 255, 255, 0.8)",
                                      }}
                                    >
                                      {del.assigneeInitials}
                                    </span>
                                    <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "10.5px" }}>
                                      {del.assignee.split(" ")[0]}
                                    </span>
                                  </div>
                                </td>

                                {/* Status badge */}
                                <td style={{ padding: "8px 8px 8px 0" }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      borderRadius: "9999px",
                                      border: `1px solid ${badgeBorder}`,
                                      backgroundColor: badgeBg,
                                      color: badgeColor,
                                      padding: "2px 7px",
                                      fontSize: "9px",
                                      fontFamily: "monospace",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {badgeLabel}
                                  </span>
                                </td>

                                {/* Due Date */}
                                <td style={{ padding: "8px 8px 8px 0", fontFamily: "monospace", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>
                                  {del.dueDate}
                                </td>

                                {/* Progress bar & value with smooth transition */}
                                <td style={{ padding: "8px 0", textAlign: "right" }}>
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ height: "4px", width: "42px", borderRadius: "9999px", backgroundColor: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                                      <div
                                        style={{
                                          height: "100%",
                                          width: `${del.progress}%`,
                                          borderRadius: "9999px",
                                          backgroundColor: del.status === "APPROVED" ? "#34d399" : "#10b981",
                                          transition: "width 600ms cubic-bezier(0.16, 1, 0.3, 1)",
                                        }}
                                      />
                                    </div>
                                    <span style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255, 255, 255, 0.6)" }}>
                                      {del.progress}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Compact Deliverable Detail Inspector Modal/Drawer */}
              {selectedDeliverable && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      backdropFilter: "blur(6px)",
                      zIndex: 49,
                      borderRadius: "10px",
                    }}
                    onClick={() => setSelectedDeliverable(null)}
                  />
                  <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "calc(100% - 2rem)",
                      maxWidth: "660px",
                      maxHeight: "92%",
                      overflowY: "auto",
                      backgroundColor: "rgba(15, 17, 23, 0.98)",
                      borderRadius: "14px",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      boxShadow: "0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(16, 185, 129, 0.2)",
                      zIndex: 50,
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                  <div>
                    {/* Inspector Top Bar */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px", marginBottom: "14px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span
                            style={{
                              borderRadius: "4px",
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              padding: "2px 6px",
                              fontSize: "9px",
                              fontFamily: "monospace",
                              color: "#34d399",
                            }}
                          >
                            {selectedDeliverable.workstream}
                          </span>
                          <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", fontFamily: "monospace" }}>
                            {selectedDeliverable.client} · Due {selectedDeliverable.dueDate}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
                          {selectedDeliverable.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedDeliverable(null)}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "none",
                          borderRadius: "9999px",
                          width: "26px",
                          height: "26px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Deliverable Meta Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "14px",
                        marginBottom: "16px",
                      }}
                    >
                      {/* Owner Card */}
                      <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>
                          Assigned Owner
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "9999px",
                              backgroundColor: "rgba(16, 185, 129, 0.2)",
                              color: "#34d399",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            {selectedDeliverable.assigneeInitials}
                          </span>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>{selectedDeliverable.assignee}</p>
                            <p style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>{selectedDeliverable.workstream} Lead</p>
                          </div>
                        </div>
                      </div>

                      {/* Status & Progress Card */}
                      <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase" }}>
                            Current Progress
                          </p>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#34d399", fontFamily: "monospace" }}>
                            {selectedDeliverable.progress}%
                          </span>
                        </div>
                        <div style={{ marginTop: "8px", height: "5px", width: "100%", borderRadius: "9999px", backgroundColor: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${selectedDeliverable.progress}%`, borderRadius: "9999px", backgroundColor: "#34d399" }} />
                        </div>
                        <p style={{ marginTop: "6px", fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>
                          Status: <strong style={{ color: "#fff" }}>{selectedDeliverable.status}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Milestones Checklist */}
                    <div>
                      <p style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", marginBottom: "8px" }}>
                        Milestone Gates &amp; Verifications
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                        {selectedDeliverable.milestones.map((m, idx) => {
                          const isDone = (idx + 1) * 25 <= selectedDeliverable.progress;
                          return (
                            <div
                              key={m}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                backgroundColor: isDone ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.02)",
                                border: isDone ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(255, 255, 255, 0.05)",
                                fontSize: "11px",
                              }}
                            >
                              <span style={{ color: isDone ? "#34d399" : "rgba(255, 255, 255, 0.3)", fontSize: "12px" }}>
                                {isDone ? "✓" : "○"}
                              </span>
                              <span style={{ color: isDone ? "#fff" : "rgba(255, 255, 255, 0.6)" }}>{m}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Quick-action Status Controls */}
                  <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "10.5px", color: "rgba(255, 255, 255, 0.4)", fontFamily: "monospace" }}>
                        Quick Status Action:
                      </span>
                      <button
                        type="button"
                        onClick={() => updateDeliverableStatus(selectedDeliverable.id, "APPROVED")}
                        style={{
                          borderRadius: "6px",
                          border: "1px solid rgba(16, 185, 129, 0.4)",
                          backgroundColor: selectedDeliverable.status === "APPROVED" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.12)",
                          color: "#34d399",
                          padding: "4px 9px",
                          fontSize: "10px",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDeliverableStatus(selectedDeliverable.id, "IN_REVIEW")}
                        style={{
                          borderRadius: "6px",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          backgroundColor: selectedDeliverable.status === "IN_REVIEW" ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.12)",
                          color: "#fbbf24",
                          padding: "4px 9px",
                          fontSize: "10px",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        👁 Submit Review
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDeliverableStatus(selectedDeliverable.id, "IN_PROGRESS")}
                        style={{
                          borderRadius: "6px",
                          border: "1px solid rgba(99, 102, 241, 0.4)",
                          backgroundColor: selectedDeliverable.status === "IN_PROGRESS" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.12)",
                          color: "#818cf8",
                          padding: "4px 9px",
                          fontSize: "10px",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ⏳ In Progress
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDeliverable(null)}
                      style={{
                        borderRadius: "6px",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        color: "#fff",
                        padding: "5px 14px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      Close Inspector
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
