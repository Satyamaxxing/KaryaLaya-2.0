"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext, getReducedMotion } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type DeliverableStatus =
  | "Ready for review"
  | "Awaiting approval"
  | "Due soon"
  | "Approved";

export interface AgencyNotification {
  id: string;
  title: string;
  workstream: string;
  assignee: string;
  assigneeInitials: string;
  avatarBg: string;
  avatarText: string;
  statusText: DeliverableStatus;
  statusVariant: "review" | "approval" | "deadline" | "approved";
  statusIcon: "check" | "alert" | "clock";
  timestamp: string;
  rawMinutesAgo: number;
  unread: boolean;
  client: string;
  scope: string;
  deliverableSummary: string;
}

const INITIAL_NOTIFICATIONS: AgencyNotification[] = [
  {
    id: "notif-1",
    title: "Landing Page Experience",
    workstream: "Web Development",
    assignee: "Satyam",
    assigneeInitials: "SK",
    avatarBg: "rgba(16, 185, 129, 0.22)",
    avatarText: "#34d399",
    statusText: "Ready for review",
    statusVariant: "review",
    statusIcon: "check",
    timestamp: "8m ago",
    rawMinutesAgo: 8,
    unread: true,
    client: "Acme Corp",
    scope: "Next.js App + GSAP Showcase",
    deliverableSummary:
      "Interactive marketing experience built with smooth scrolling, motion tokens, and client approval portal integration.",
  },
  {
    id: "notif-2",
    title: "Campaign Creative — V3",
    workstream: "Design",
    assignee: "Client Portal",
    assigneeInitials: "AG",
    avatarBg: "rgba(245, 158, 11, 0.22)",
    avatarText: "#fbbf24",
    statusText: "Awaiting approval",
    statusVariant: "approval",
    statusIcon: "alert",
    timestamp: "1h ago",
    rawMinutesAgo: 60,
    unread: true,
    client: "Starlight Digital",
    scope: "Q4 Performance Ad Suite",
    deliverableSummary:
      "Multi-platform motion cuts, social feed variants, and billboard assets awaiting client stakeholder sign-off.",
  },
  {
    id: "notif-3",
    title: "Content Calendar",
    workstream: "Social Media",
    assignee: "Aisha",
    assigneeInitials: "AP",
    avatarBg: "rgba(244, 63, 94, 0.22)",
    avatarText: "#fb7185",
    statusText: "Due soon",
    statusVariant: "deadline",
    statusIcon: "clock",
    timestamp: "4h ago",
    rawMinutesAgo: 240,
    unread: true,
    client: "Nexus Ventures",
    scope: "30-Day LinkedIn & IG Grid",
    deliverableSummary:
      "Monthly social media publication calendar with copy drafts, carousel visuals, and scheduled go-live slots.",
  },
  {
    id: "notif-4",
    title: "Founder Brand Identity Kit",
    workstream: "Brand Design",
    assignee: "Arjun",
    assigneeInitials: "AN",
    avatarBg: "rgba(52, 211, 153, 0.22)",
    avatarText: "#6ee7b7",
    statusText: "Approved",
    statusVariant: "approved",
    statusIcon: "check",
    timestamp: "1d ago",
    rawMinutesAgo: 1440,
    unread: true,
    client: "HyperScale Studio",
    scope: "Vector Logo Suite & Brand Tokens",
    deliverableSummary:
      "Primary logomarks, color system, typography pairings, and vector asset guidelines signed off by executive team.",
  },
];

export function InboxSection() {
  const [notifications, setNotifications] = useState<AgencyNotification[]>(
    INITIAL_NOTIFICATIONS
  );
  const [filter, setFilter] = useState<"all" | "unread" | "approvals">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedItem, setSelectedItem] = useState<AgencyNotification | null>(
    null
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterBarOpen, setFilterBarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const dashboardCardRef = useRef<HTMLDivElement>(null);
  const rowsContainerRef = useRef<HTMLDivElement>(null);
  const arrowsGroupRef = useRef<HTMLDivElement>(null);
  const lowerContentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Derived unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  // Filtered and sorted notifications
  const displayedNotifications = useMemo(() => {
    let list = [...notifications];

    if (filter === "unread") {
      list = list.filter((n) => n.unread);
    } else if (filter === "approvals") {
      list = list.filter(
        (n) => n.statusVariant === "approval" || n.statusVariant === "review"
      );
    }

    list.sort((a, b) =>
      sortOrder === "newest"
        ? a.rawMinutesAgo - b.rawMinutesAgo
        : b.rawMinutesAgo - a.rawMinutesAgo
    );

    return list;
  }, [notifications, filter, sortOrder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  // Mark single notification read/unread
  const toggleReadStatus = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.unread;
          showToast(
            nextState
              ? `Marked "${item.title}" as unread`
              : `Marked "${item.title}" as read`
          );
          return { ...item, unread: nextState };
        }
        return item;
      })
    );
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, unread: !prev.unread } : null));
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    setMenuOpen(false);
    showToast("All notifications marked as read");
  };

  // Mark all as unread
  const markAllAsUnread = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: true })));
    setMenuOpen(false);
    showToast("All notifications marked as unread");
  };

  // Clear filters
  const clearFilters = () => {
    setFilter("all");
    setSortOrder("newest");
    setFilterBarOpen(false);
    setMenuOpen(false);
    showToast("Filters reset to default");
  };

  // Reset demo
  const resetDemo = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
    setFilter("all");
    setSortOrder("newest");
    setFilterBarOpen(false);
    setMenuOpen(false);
    showToast("Demo inbox data reset to default");
  };

  // Contextual action in modal
  const handleDeliverableAction = (id: string, actionType: string) => {
    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (actionType === "approve" || actionType === "review") {
            return {
              ...item,
              statusText: "Approved",
              statusVariant: "approved",
              statusIcon: "check",
              unread: false,
            };
          }
          return { ...item, unread: false };
        }
        return item;
      })
    );
    if (selectedItem) {
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              statusText: "Approved",
              statusVariant: "approved",
              statusIcon: "check",
              unread: false,
            }
          : null
      );
    }
    showToast(`Deliverable status updated to Approved`);
  };

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedItem(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // GSAP Entrance & Scroll Animations
  useGsapContext(
    () => {
      if (getReducedMotion() || !sectionRef.current) return;

      const card = dashboardCardRef.current;
      const rows = rowsContainerRef.current?.querySelectorAll(".inbox-item-row");
      const arrowPaths = arrowsGroupRef.current?.querySelectorAll(".annot-arrow-path");
      const arrowLabels = arrowsGroupRef.current?.querySelectorAll(".annot-label");
      const lowerCols = lowerContentRef.current?.querySelectorAll(".lower-col-stagger");

      if (!card) return;

      // Master Entrance Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          end: "bottom top",
          toggleActions: "play none none none",
        },
      });

      // 1. Dashboard card enters with upward glide & scale
      tl.fromTo(
        card,
        { opacity: 0, y: 28, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "power3.out" }
      );

      // 2. Notification rows enter with alternating staggered directions
      if (rows && rows.length > 0) {
        rows.forEach((row, i) => {
          const xTravel = i % 2 === 0 ? -18 : 18;
          tl.fromTo(
            row,
            { opacity: 0, x: xTravel },
            { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" },
            i === 0 ? "-=0.35" : "-=0.32"
          );
        });
      }

      // 3. Arrow annotation paths draw in via stroke-dashoffset
      if (arrowPaths && arrowPaths.length > 0) {
        tl.fromTo(
          arrowPaths,
          { strokeDashoffset: 180 },
          { strokeDashoffset: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" },
          "-=0.3"
        );
      }

      // 4. Arrow labels fade in with subtle spring
      if (arrowLabels && arrowLabels.length > 0) {
        tl.fromTo(
          arrowLabels,
          { opacity: 0, scale: 0.92, y: (i) => (i < 2 ? -6 : 0) },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.06,
            ease: "back.out(1.4)",
          },
          "-=0.5"
        );
      }

      // 5. Lower two-column section reveals
      if (lowerCols && lowerCols.length > 0) {
        tl.fromTo(
          lowerCols,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: "power3.out" },
          "-=0.35"
        );
      }
    },
    sectionRef,
    []
  );

  return (
    <article
      id="agency-inbox"
      ref={sectionRef}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        padding: "74px 20px 64px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Subtle emerald atmospheric background glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "450px",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle at 65% 30%, rgba(16, 185, 129, 0.09) 0%, rgba(5, 150, 105, 0.02) 50%, transparent 75%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderRadius: "9999px",
            border: "1px solid rgba(52, 211, 153, 0.4)",
            backgroundColor: "#0d1311",
            padding: "10px 18px",
            fontSize: "12px",
            color: "#5ee9b5",
            boxShadow:
              "0 10px 30px rgba(0, 0, 0, 0.85), 0 0 15px rgba(16, 185, 129, 0.3)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "9999px",
              backgroundColor: "#34d399",
              boxShadow: "0 0 8px #34d399",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP DASHBOARD CARD WRAPPER WITH SURROUNDING ARROW ANNOTATIONS */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          margin: "0 auto",
          width: "100%",
          maxWidth: "840px",
        }}
      >
        {/* DESKTOP CURVED SVG ARROWS (Visible on screens >= 1024px) */}
        <div
          ref={arrowsGroupRef}
          className="inbox-desktop-annotations"
          aria-hidden="true"
        >
          {/* Defs for arrow markers and emerald drop shadow */}
          <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
            <defs>
              <marker
                id="inbox-emerald-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5.5"
                markerHeight="5.5"
                orient="auto-start-reverse"
              >
                <path
                  d="M 1 2 L 8 5 L 1 8"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
              <filter id="emerald-arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="2"
                  floodColor="#10b981"
                  floodOpacity="0.5"
                />
              </filter>
            </defs>
          </svg>

          {/* CALLOUT 1: Upper-Left (Live count of notifications) */}
          <div
            className="annot-label"
            style={{
              position: "absolute",
              top: "-56px",
              left: "-12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11.5px",
                fontWeight: 600,
                lineHeight: "1.3",
                color: "#6ee7b7",
                letterSpacing: "0.02em",
                textShadow: "0 0 10px rgba(52, 211, 153, 0.55)",
              }}
            >
              Live count
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: 500,
                lineHeight: "1.3",
                color: "rgba(110, 231, 183, 0.85)",
                letterSpacing: "0.02em",
              }}
            >
              of notifications
            </span>
            <svg
              style={{
                width: "92px",
                height: "52px",
                marginTop: "2px",
                overflow: "visible",
              }}
              viewBox="0 0 92 52"
              fill="none"
            >
              <path
                className="annot-arrow-path"
                d="M 12 8 C 34 -4, 68 4, 86 42"
                stroke="#34d399"
                strokeWidth="1.35"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="180"
                strokeDashoffset="0"
                markerEnd="url(#inbox-emerald-arrow)"
                filter="url(#emerald-arrow-glow)"
              />
            </svg>
          </div>

          {/* CALLOUT 2: Upper-Right (Live project updates indicator) */}
          <div
            className="annot-label"
            style={{
              position: "absolute",
              top: "-56px",
              right: "-14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              textAlign: "right",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11.5px",
                fontWeight: 600,
                lineHeight: "1.3",
                color: "#6ee7b7",
                letterSpacing: "0.02em",
                textShadow: "0 0 10px rgba(52, 211, 153, 0.55)",
              }}
            >
              Live indicator
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: 500,
                lineHeight: "1.3",
                color: "rgba(110, 231, 183, 0.85)",
                letterSpacing: "0.02em",
              }}
            >
              with subtle pulse
            </span>
            <svg
              style={{
                width: "92px",
                height: "52px",
                marginTop: "2px",
                overflow: "visible",
              }}
              viewBox="0 0 92 52"
              fill="none"
            >
              <path
                className="annot-arrow-path"
                d="M 80 8 C 58 -4, 24 4, 6 42"
                stroke="#34d399"
                strokeWidth="1.35"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="180"
                strokeDashoffset="0"
                markerEnd="url(#inbox-emerald-arrow)"
                filter="url(#emerald-arrow-glow)"
              />
            </svg>
          </div>

          {/* CALLOUT 3: Left-Side (Clear deliverable statuses & avatars) */}
          <div
            className="annot-label"
            style={{
              position: "absolute",
              top: "185px",
              left: "-200px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                textAlign: "right",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  lineHeight: "1.3",
                  color: "#6ee7b7",
                  letterSpacing: "0.02em",
                  textShadow: "0 0 10px rgba(52, 211, 153, 0.55)",
                }}
              >
                Clear deliverable
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: 500,
                  lineHeight: "1.3",
                  color: "rgba(110, 231, 183, 0.85)",
                  letterSpacing: "0.02em",
                }}
              >
                statuses &amp; avatars
              </span>
            </div>
            <svg
              style={{
                width: "56px",
                height: "32px",
                overflow: "visible",
                flexShrink: 0,
              }}
              viewBox="0 0 56 32"
              fill="none"
            >
              <path
                className="annot-arrow-path"
                d="M 4 8 C 24 6, 42 12, 54 20"
                stroke="#34d399"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="180"
                strokeDashoffset="0"
                markerEnd="url(#inbox-emerald-arrow)"
                filter="url(#emerald-arrow-glow)"
              />
            </svg>
          </div>

          {/* CALLOUT 4: Right-Side (Smooth stagger animation on scroll) */}
          <div
            className="annot-label"
            style={{
              position: "absolute",
              top: "168px",
              right: "-195px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              style={{
                width: "56px",
                height: "32px",
                overflow: "visible",
                flexShrink: 0,
              }}
              viewBox="0 0 56 32"
              fill="none"
            >
              <path
                className="annot-arrow-path"
                d="M 52 8 C 32 6, 14 12, 2 20"
                stroke="#34d399"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="180"
                strokeDashoffset="0"
                markerEnd="url(#inbox-emerald-arrow)"
                filter="url(#emerald-arrow-glow)"
              />
            </svg>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  lineHeight: "1.3",
                  color: "#6ee7b7",
                  letterSpacing: "0.02em",
                  textShadow: "0 0 10px rgba(52, 211, 153, 0.55)",
                }}
              >
                Smooth stagger
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: 500,
                  lineHeight: "1.3",
                  color: "rgba(110, 231, 183, 0.85)",
                  letterSpacing: "0.02em",
                }}
              >
                animation on scroll
              </span>
            </div>
          </div>
        </div>

        {/* MOBILE/TABLET RESPONSIVE CALLOUT PILLS BAR (< 1024px) */}
        <div className="inbox-mobile-annotations">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "9999px",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              background: "rgba(16, 185, 129, 0.08)",
              fontFamily: "monospace",
              fontSize: "10.5px",
              color: "#34d399",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "9999px",
                backgroundColor: "#34d399",
                boxShadow: "0 0 6px #34d399",
              }}
            />
            Live count: {unreadCount} unread
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "9999px",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              background: "rgba(16, 185, 129, 0.08)",
              fontFamily: "monospace",
              fontSize: "10.5px",
              color: "#34d399",
            }}
          >
            Live project updates
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.04)",
              fontFamily: "monospace",
              fontSize: "10.5px",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            Clear deliverable statuses
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.04)",
              fontFamily: "monospace",
              fontSize: "10.5px",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            Stagger animation
          </span>
        </div>

        {/* MAIN COMPACT DASHBOARD CARD */}
        <div
          ref={dashboardCardRef}
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            background:
              "linear-gradient(165deg, rgba(17, 19, 23, 0.98) 0%, rgba(9, 10, 13, 0.99) 100%)",
            boxShadow:
              "0 25px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        >
          {/* Subtle traveling border highlight effect */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "20px",
              pointerEvents: "none",
              border: "1px solid transparent",
              background:
                "linear-gradient(120deg, transparent 30%, rgba(52, 211, 153, 0.18) 50%, transparent 70%) border-box",
              WebkitMask:
                "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              opacity: 0.6,
            }}
          />

          {/* DASHBOARD HEADER */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px 14px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              backgroundColor: "rgba(255, 255, 255, 0.015)",
            }}
          >
            {/* Header Left: Inbox Title, Live Count Badge, Filter Icon, Sort Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.015em",
                  margin: 0,
                }}
              >
                Inbox
              </h2>

              {/* Live unread count badge pill */}
              <span
                id="inbox-unread-count-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "22px",
                  height: "20px",
                  padding: "0 6px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(16, 185, 129, 0.16)",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  color: "#5ee9b5",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: 700,
                  boxShadow: "0 0 10px rgba(16, 185, 129, 0.25)",
                }}
              >
                {unreadCount}
              </span>

              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setFilterBarOpen((v) => !v)}
                aria-label="Filter deliverables"
                title="Filter deliverables"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  border: filterBarOpen
                    ? "1px solid rgba(52, 211, 153, 0.5)"
                    : "1px solid transparent",
                  backgroundColor: filterBarOpen
                    ? "rgba(16, 185, 129, 0.15)"
                    : "transparent",
                  color: filterBarOpen ? "#34d399" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  marginLeft: "2px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = filterBarOpen
                    ? "#34d399"
                    : "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.backgroundColor = filterBarOpen
                    ? "rgba(16, 185, 129, 0.15)"
                    : "transparent";
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>

              {/* Sort Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))
                }
                aria-label={`Sort by date (currently ${sortOrder})`}
                title={`Sort by date (${sortOrder})`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  border: "1px solid transparent",
                  backgroundColor: "transparent",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </button>
            </div>

            {/* Header Right: Live Updates indicator pill & Overflow menu */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* LIVE UPDATES INDICATOR PILL */}
              <div
                id="inbox-live-updates-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(52, 211, 153, 0.28)",
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  boxShadow: "0 0 14px rgba(16, 185, 129, 0.15)",
                }}
              >
                <span
                  style={{
                    position: "relative",
                    display: "flex",
                    width: "7px",
                    height: "7px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "9999px",
                      backgroundColor: "#34d399",
                      opacity: 0.75,
                      animation: "ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite",
                    }}
                  />
                  <span
                    style={{
                      position: "relative",
                      width: "7px",
                      height: "7px",
                      borderRadius: "9999px",
                      backgroundColor: "#34d399",
                      boxShadow: "0 0 8px #34d399",
                    }}
                  />
                </span>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    color: "#5ee9b5",
                  }}
                >
                  Live updates
                </span>
              </div>

              {/* OVERFLOW MENU BUTTON */}
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="More inbox options"
                  title="More options"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "1px solid transparent",
                    backgroundColor: menuOpen
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent",
                    color: "rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = menuOpen
                      ? "#ffffff"
                      : "rgba(255, 255, 255, 0.5)";
                    e.currentTarget.style.backgroundColor = menuOpen
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent";
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                    <circle cx="5" cy="12" r="1.5" />
                  </svg>
                </button>

                {/* OVERFLOW MENU DROPDOWN */}
                {menuOpen && (
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "34px",
                      zIndex: 50,
                      width: "185px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      backgroundColor: "#0d0f14",
                      padding: "6px",
                      boxShadow: "0 15px 35px rgba(0, 0, 0, 0.75)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={markAllAsRead}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.85)",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.color = "#34d399";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>✓</span>
                      <span>Mark all as read</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={markAllAsUnread}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.85)",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.color = "#34d399";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>●</span>
                      <span>Mark all as unread</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={clearFilters}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.85)",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.color = "#34d399";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>↺</span>
                      <span>Clear filters</span>
                    </button>
                    <div
                      style={{
                        height: "1px",
                        margin: "4px 0",
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                      }}
                    />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={resetDemo}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.55)",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.55)";
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>⚡</span>
                      <span>Reset demo inbox</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OPTIONAL FILTER BAR (Toggled via Filter Icon) */}
          {filterBarOpen && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 20px",
                backgroundColor: "rgba(16, 185, 129, 0.04)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "rgba(255, 255, 255, 0.45)",
                  marginRight: "4px",
                }}
              >
                FILTER:
              </span>
              <button
                type="button"
                onClick={() => setFilter("all")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: filter === "all" ? 600 : 400,
                  border:
                    filter === "all"
                      ? "1px solid rgba(52, 211, 153, 0.4)"
                      : "1px solid transparent",
                  backgroundColor:
                    filter === "all"
                      ? "rgba(16, 185, 129, 0.16)"
                      : "transparent",
                  color: filter === "all" ? "#5ee9b5" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                }}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: filter === "unread" ? 600 : 400,
                  border:
                    filter === "unread"
                      ? "1px solid rgba(52, 211, 153, 0.4)"
                      : "1px solid transparent",
                  backgroundColor:
                    filter === "unread"
                      ? "rgba(16, 185, 129, 0.16)"
                      : "transparent",
                  color: filter === "unread" ? "#5ee9b5" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                }}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("approvals")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: filter === "approvals" ? 600 : 400,
                  border:
                    filter === "approvals"
                      ? "1px solid rgba(245, 158, 11, 0.4)"
                      : "1px solid transparent",
                  backgroundColor:
                    filter === "approvals"
                      ? "rgba(245, 158, 11, 0.16)"
                      : "transparent",
                  color: filter === "approvals" ? "#fbbf24" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                }}
              >
                Approvals &amp; Reviews
              </button>
            </div>
          )}

          {/* NOTIFICATION ROWS CONTAINER */}
          <div
            ref={rowsContainerRef}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "6px 12px",
            }}
          >
            {displayedNotifications.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 20px",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.4)",
                  }}
                >
                  No deliverable notifications matching &quot;{filter}&quot;
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#34d399",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear filter
                </button>
              </div>
            ) : (
              displayedNotifications.map((item, index) => {
                const isUnread = item.unread;
                const isLast = index === displayedNotifications.length - 1;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedItem(item);
                      }
                    }}
                    className="inbox-item-row"
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "14px",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      borderBottom: isLast
                        ? "none"
                        : "1px solid rgba(255, 255, 255, 0.05)",
                      backgroundColor: isUnread
                        ? "rgba(255, 255, 255, 0.025)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.055)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread
                        ? "rgba(255, 255, 255, 0.025)"
                        : "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    {/* Left: Avatar with Status Icon and Deliverable Titles */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {/* Avatar with Status Badge */}
                      <div
                        style={{
                          position: "relative",
                          width: "42px",
                          height: "42px",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "9999px",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            backgroundColor: item.avatarBg,
                            color: item.avatarText,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {item.assigneeInitials}
                        </div>

                        {/* Status badge circle at bottom right of avatar */}
                        <span
                          style={{
                            position: "absolute",
                            bottom: "-2px",
                            right: "-2px",
                            width: "17px",
                            height: "17px",
                            borderRadius: "9999px",
                            boxShadow: "0 0 0 2px #0a0b0e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.statusIcon === "check" && (
                            <span
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "9999px",
                                backgroundColor: "#34d399",
                                color: "#000000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 0 6px rgba(52, 211, 153, 0.8)",
                              }}
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ margin: "auto" }}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                          {item.statusIcon === "alert" && (
                            <span
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "9999px",
                                backgroundColor: "#fbbf24",
                                color: "#000000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 0 6px rgba(251, 191, 36, 0.8)",
                              }}
                            >
                              <svg
                                width="9"
                                height="9"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ margin: "auto" }}
                              >
                                <line x1="12" y1="8" x2="12" y2="13" />
                                <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
                              </svg>
                            </span>
                          )}
                          {item.statusIcon === "clock" && (
                            <span
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "9999px",
                                backgroundColor: "#f43f5e",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 0 6px rgba(244, 63, 94, 0.8)",
                              }}
                            >
                              <svg
                                width="9"
                                height="9"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ margin: "auto" }}
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 15 14" />
                              </svg>
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "rgba(255, 255, 255, 0.95)",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            fontSize: "12.5px",
                            color: "rgba(255, 255, 255, 0.45)",
                            margin: "2px 0 0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.workstream} · {item.assignee}
                        </p>
                      </div>
                    </div>

                    {/* Right area: Status Tag Badge Pill, Timestamp, Unread Dot, Chevron */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        flexShrink: 0,
                      }}
                    >
                      {/* Status Tag Badge (matching [🤖 Research Agent] style in reference) */}
                      <div
                        className="inbox-row-status-badge"
                        style={{
                          backgroundColor:
                            item.statusVariant === "review" ||
                            item.statusVariant === "approved"
                              ? "rgba(16, 185, 129, 0.12)"
                              : item.statusVariant === "approval"
                              ? "rgba(245, 158, 11, 0.12)"
                              : "rgba(244, 63, 94, 0.12)",
                          border:
                            item.statusVariant === "review" ||
                            item.statusVariant === "approved"
                              ? "1px solid rgba(52, 211, 153, 0.32)"
                              : item.statusVariant === "approval"
                              ? "1px solid rgba(251, 191, 36, 0.32)"
                              : "1px solid rgba(244, 63, 94, 0.32)",
                          color:
                            item.statusVariant === "review" ||
                            item.statusVariant === "approved"
                              ? "#5ee9b5"
                              : item.statusVariant === "approval"
                              ? "#fbbf24"
                              : "#fb7185",
                        }}
                      >
                        {item.statusIcon === "check" && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {item.statusIcon === "alert" && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        )}
                        {item.statusIcon === "clock" && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 15 14" />
                          </svg>
                        )}
                        <span>{item.statusText}</span>
                      </div>

                      {/* Timestamp */}
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "rgba(255, 255, 255, 0.4)",
                          minWidth: "46px",
                          textAlign: "right",
                        }}
                      >
                        {item.timestamp}
                      </span>

                      {/* Unread indicator dot */}
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "9999px",
                          backgroundColor: isUnread ? "#34d399" : "transparent",
                          boxShadow: isUnread ? "0 0 8px #34d399" : "none",
                          transition: "all 0.2s ease",
                        }}
                      />

                      {/* Chevron Right */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* LOWER CONTENT: TWO-COLUMN LAYOUT MATCHING REFERENCE HIERARCHY */}
      <div
        ref={lowerContentRef}
        style={{
          position: "relative",
          zIndex: 10,
          margin: "42px auto 0",
          width: "100%",
          maxWidth: "840px",
        }}
      >
        <div className="inbox-lower-grid">
          {/* LEFT COLUMN: Eyebrow, Heading, Description */}
          <div className="lower-col-stagger">
            {/* Eyebrow Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 14px",
                borderRadius: "9999px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                marginBottom: "16px",
                boxShadow: "0 0 16px rgba(16, 185, 129, 0.12)",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "9999px",
                  backgroundColor: "#34d399",
                  boxShadow: "0 0 8px #34d399",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "#34d399",
                  textTransform: "uppercase",
                }}
              >
                AGENCY INBOX
              </span>
            </div>

            {/* Main Heading with emerald accent */}
            <h3
              style={{
                fontFamily: "var(--font-display, inherit)",
                fontSize: "clamp(30px, 4vw, 44px)",
                lineHeight: "1.08",
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.025em",
                margin: 0,
              }}
            >
              Stay ahead of{" "}
              <span
                style={{
                  color: "#34d399",
                  textShadow: "0 0 22px rgba(52, 211, 153, 0.35)",
                }}
              >
                every deliverable.
              </span>
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: "15.5px",
                lineHeight: "1.6",
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: "16px",
                maxWidth: "460px",
              }}
            >
              Review approvals, track project updates, and keep every important
              decision in one focused workspace.
            </p>
          </div>

          {/* RIGHT COLUMN: 4 Concise Feature Rows with Icons and Emerald Check Indicators */}
          <div
            className="lower-col-stagger"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Row 1: Real-time project updates */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                backgroundColor: "rgba(255, 255, 255, 0.025)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34d399",
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  Real-time project updates
                </span>
              </div>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                  boxShadow: "0 0 8px rgba(52, 211, 153, 0.25)",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            {/* Row 2: Faster client approvals */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                backgroundColor: "rgba(255, 255, 255, 0.025)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34d399",
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  Faster client approvals
                </span>
              </div>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                  boxShadow: "0 0 8px rgba(52, 211, 153, 0.25)",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            {/* Row 3: Clear ownership and accountability */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                backgroundColor: "rgba(255, 255, 255, 0.025)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34d399",
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  Clear ownership and accountability
                </span>
              </div>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                  boxShadow: "0 0 8px rgba(52, 211, 153, 0.25)",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            {/* Row 4: Every decision in one place */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                backgroundColor: "rgba(255, 255, 255, 0.025)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34d399",
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  Every decision in one place
                </span>
              </div>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                  boxShadow: "0 0 8px rgba(52, 211, 153, 0.25)",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DELIVERABLE INSPECTION MODAL / DETAIL PANEL */}
      {mounted && selectedItem && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deliverable-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(2, 4, 8, 0.8)",
            backdropFilter: "blur(12px)",
            padding: "20px",
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              borderRadius: "18px",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              backgroundColor: "#0d0f14",
              padding: "24px",
              boxShadow:
                "0 30px 70px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Workstream Pill + Close Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(52, 211, 153, 0.35)",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#5ee9b5",
                  fontFamily: "monospace",
                }}
              >
                <span>{selectedItem.workstream}</span>
                <span>•</span>
                <span>{selectedItem.client}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Close details"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.05)";
                }}
              >
                ✕
              </button>
            </div>

            {/* Deliverable Title */}
            <h4
              id="deliverable-modal-title"
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.015em",
                margin: "0 0 8px",
              }}
            >
              {selectedItem.title}
            </h4>

            {/* Summary */}
            <p
              style={{
                fontSize: "13.5px",
                lineHeight: "1.55",
                color: "rgba(255, 255, 255, 0.7)",
                margin: "0 0 18px",
              }}
            >
              {selectedItem.deliverableSummary}
            </p>

            {/* Deliverable Specs Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "rgba(255, 255, 255, 0.4)",
                    textTransform: "uppercase",
                  }}
                >
                  ASSIGNED OWNER
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#ffffff",
                    marginTop: "4px",
                  }}
                >
                  {selectedItem.assignee}
                </span>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "rgba(255, 255, 255, 0.4)",
                    textTransform: "uppercase",
                  }}
                >
                  CURRENT STATUS
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color:
                        selectedItem.statusVariant === "review" ||
                        selectedItem.statusVariant === "approved"
                          ? "#34d399"
                          : selectedItem.statusVariant === "approval"
                          ? "#fbbf24"
                          : "#fb7185",
                    }}
                  >
                    {selectedItem.statusText}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    {selectedItem.timestamp}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <button
                type="button"
                onClick={() => toggleReadStatus(selectedItem.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "9999px",
                    backgroundColor: selectedItem.unread
                      ? "#34d399"
                      : "transparent",
                    border: selectedItem.unread
                      ? "none"
                      : "1px solid rgba(255, 255, 255, 0.4)",
                    boxShadow: selectedItem.unread
                      ? "0 0 6px #34d399"
                      : "none",
                  }}
                />
                <span>
                  {selectedItem.unread ? "Mark as Read" : "Mark as Unread"}
                </span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {selectedItem.statusVariant === "approval" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeliverableAction(selectedItem.id, "approve")
                    }
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      border: "1px solid rgba(52, 211, 153, 0.4)",
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      color: "#34d399",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 0 14px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    ✓ Approve Deliverable
                  </button>
                )}
                {selectedItem.statusVariant === "review" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeliverableAction(selectedItem.id, "review")
                    }
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      border: "1px solid rgba(52, 211, 153, 0.4)",
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      color: "#34d399",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 0 14px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    Review &amp; Sign Off
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    backgroundColor: "transparent",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}
