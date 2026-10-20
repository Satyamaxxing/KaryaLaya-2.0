"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkState } from "@/lib/state/work-state-context";

import { getSidebarNavForRole } from "@/lib/permissions/route-permissions";

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, currentRole } = useWorkState();

  // Dynamic navigation items rendered strictly from canonical permission map
  const navItems = getSidebarNavForRole(currentRole);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCloseMobile]);

  const [activeProject, setActiveProject] = React.useState<{
    id: string;
    name: string;
    progressPercent: number;
  } | null>(null);

  // Fetch real current project from database
  useEffect(() => {
    let isMounted = true;
    fetch("/api/projects")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const projects = data.projects || [];
        const current = projects.find((p: any) => p.status === "ACTIVE") || (projects.length > 0 ? projects[0] : null);
        if (current) {
          let progress = typeof current.progressPercent === "number" ? current.progressPercent : 0;
          if (progress === 0 && current.deliverables && current.deliverables.length > 0) {
            const totalWeight = current.deliverables.reduce((acc: number, d: any) => acc + (d.weight || 1), 0);
            const weightedSum = current.deliverables.reduce(
              (acc: number, d: any) => acc + ((d.progressPercent || 0) * (d.weight || 1)),
              0
            );
            progress = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
          }
          setActiveProject({
            id: current.id,
            name: current.name,
            progressPercent: progress,
          });
        } else {
          setActiveProject(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setActiveProject(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && <div onClick={onCloseMobile} className="app-drawer-backdrop" aria-hidden="true" />}

      <aside
        data-lenis-prevent
        className={`app-sidebar ${isOpen ? "drawer-open" : ""}`}
        aria-label="Application Sidebar"
        style={{ overflowX: "hidden", boxSizing: "border-box" }}
      >
        {/* Top: Brand & Workspace Switcher */}
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--kl-border-hairline)", boxSizing: "border-box", width: "100%", overflowX: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <Link
              href="/app/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: "1.75rem",
                  height: "1.75rem",
                  borderRadius: "0.5rem",
                  background: "linear-gradient(135deg, var(--kl-emerald), var(--kl-sky))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: "#000",
                  fontSize: "0.875rem",
                }}
              >
                K
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "-0.02em",
                  color: "#fff",
                }}
              >
                KaryaLaya
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 600,
                  padding: "1px 5px",
                  borderRadius: "4px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "var(--kl-emerald)",
                  border: "1px solid var(--kl-emerald-border)",
                }}
              >
                2.0
              </span>
            </Link>

            <button
              onClick={onCloseMobile}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--kl-text-muted)",
                cursor: "pointer",
                padding: "4px",
                display: "none",
              }}
              className="mobile-close-btn"
              aria-label="Close navigation"
            >
              ✕
            </button>
          </div>

          {/* Workspace Pill */}
          <div
            style={{
              padding: "0.5rem 0.75rem",
              backgroundColor: "var(--kl-surface-1)",
              border: "1px solid var(--kl-border-hairline)",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxSizing: "border-box",
              width: "100%",
              overflow: "hidden",
            }}
          >
            <div style={{ minWidth: 0, flex: 1, paddingLeft: "2px" }}>
              <div
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-mono, monospace)",
                  color: "var(--kl-text-dim)",
                  letterSpacing: "0.04em",
                }}
              >
                Workspace
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--kl-text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Digital Agency Delivery
              </div>
            </div>
            <span style={{ fontSize: "10px", color: "var(--kl-text-dim)", flexShrink: 0, marginLeft: "4px" }}>▾</span>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
            width: "100%",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
          data-lenis-prevent
        >
          <div
            style={{
              padding: "0.375rem 0.75rem",
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--kl-text-dim)",
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            Work Operating System
          </div>

          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/app/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                  transition: "all 140ms ease",
                  backgroundColor: isActive ? "var(--kl-surface-2)" : "transparent",
                  color: isActive ? "#ffffff" : "var(--kl-text-muted)",
                  border: isActive ? "1px solid var(--kl-border-subtle)" : "1px solid transparent",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ fontSize: "14px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {(item as any).badge && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono, monospace)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      backgroundColor: "var(--kl-surface-3)",
                      color: "var(--kl-sky)",
                      border: "1px solid var(--kl-sky-border)",
                    }}
                  >
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            );
          })}

          {activeProject && (
            <>
              <div
                style={{
                  padding: "0.75rem 0.75rem 0.25rem 0.75rem",
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--kl-text-dim)",
                  boxSizing: "border-box",
                  width: "100%",
                }}
              >
                Active Project
              </div>

              <Link
                href={`/app/projects/${activeProject.id}`}
                onClick={onCloseMobile}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 140ms ease",
                  backgroundColor: pathname.includes(`/app/projects/${activeProject.id}`)
                    ? "var(--kl-surface-2)"
                    : "transparent",
                  color: pathname.includes(`/app/projects/${activeProject.id}`)
                    ? "var(--kl-sky)"
                    : "var(--kl-text-muted)",
                  border: pathname.includes(`/app/projects/${activeProject.id}`)
                    ? "1px solid var(--kl-sky-border)"
                    : "1px solid transparent",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  <span style={{ fontSize: "11px", opacity: 0.8 }}>📁</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeProject.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "var(--kl-text-dim)",
                    flexShrink: 0,
                    marginLeft: "4px",
                  }}
                >
                  {activeProject.progressPercent}%
                </span>
              </Link>
            </>
          )}
        </nav>

        {/* Bottom User / Role Profile */}
        <div
          style={{
            padding: "0.75rem",
            borderTop: "1px solid var(--kl-border-hairline)",
            backgroundColor: "var(--kl-surface-0)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            boxSizing: "border-box",
            width: "100%",
            overflowX: "hidden",
          }}
        >
          {/* Current User Card */}
          <div
            style={{
              padding: "0.5rem",
              backgroundColor: "var(--kl-surface-1)",
              border: "1px solid var(--kl-border-hairline)",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
              <div
                style={{
                  width: "1.75rem",
                  height: "1.75rem",
                  borderRadius: "50%",
                  backgroundColor: "var(--kl-surface-3)",
                  border: "1px solid var(--kl-indigo-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "var(--kl-sky)",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#ffffff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentUser.name}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--kl-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentRole} · {currentUser.jobTitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
