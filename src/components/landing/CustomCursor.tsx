"use client";

import React, { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client, non-touch devices, and when reduced motion is not requested
    if (typeof window === "undefined") return;
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      !window.matchMedia("(hover: hover)").matches;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || isReduced) {
      return;
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !glow || !label) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX;
    let dotY = mouseY;
    let ringX = mouseX;
    let ringY = mouseY;
    let glowX = mouseX;
    let glowY = mouseY;

    let isVisible = false;
    let isHoveringInteractive = false;
    let isMouseDown = false;
    let currentMagneticTarget: HTMLElement | null = null;
    let rafId: number;

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        glow.style.opacity = "1";
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // When over form inputs or native text editable fields, hide custom cursor for standard caret
      const isInput = target.closest("input, textarea, select, [contenteditable='true'], dialog");
      if (isInput) {
        dot.style.opacity = "0";
        ring.style.opacity = "0";
        glow.style.opacity = "0";
        return;
      } else {
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        glow.style.opacity = "1";
      }

      // Check for custom cursor label
      const cursorAttr = target.closest("[data-cursor]")?.getAttribute("data-cursor");
      if (cursorAttr) {
        label.textContent = cursorAttr;
        label.style.opacity = "1";
      } else {
        label.textContent = "";
        label.style.opacity = "0";
      }

      // Detect interactive elements (links, buttons, interactive cards, clickables, dashboard items)
      const interactiveEl = target.closest<HTMLElement>(
        "a, button, [role='button'], .qronos-nav-link, .cursor-pointer, [data-cursor], .group\\/star-button, summary, [data-magnetic], .card-interactive, .sidebar-link, .interactive-cell, .badge-pill, .scattered-icon, .karyalaya-dest-icon, .flow-card-anim"
      );

      if (interactiveEl) {
        isHoveringInteractive = true;

        // Subtle magnetic pull strictly on dedicated small static elements (buttons, nav links)
        // Avoid elements that have their own continuous GSAP animation loops (e.g. .scattered-icon)
        const isMagneticCandidate =
          !interactiveEl.classList.contains("scattered-icon") &&
          !interactiveEl.classList.contains("sparkle-star") &&
          !interactiveEl.classList.contains("karyalaya-dest-icon") &&
          (interactiveEl.matches(
            ".qronos-nav-link, [data-magnetic], .group\\/star-button"
          ) ||
            (interactiveEl.tagName === "BUTTON" &&
              interactiveEl.offsetWidth > 0 &&
              interactiveEl.offsetWidth <= 180));

        if (isMagneticCandidate) {
          currentMagneticTarget = interactiveEl;
          const rect = interactiveEl.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          // Restrained max 4px magnetic pull toward cursor
          const pullX = Math.max(-4, Math.min(4, (e.clientX - centerX) * 0.16));
          const pullY = Math.max(-4, Math.min(4, (e.clientY - centerY) * 0.16));
          interactiveEl.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
          interactiveEl.style.transition = "transform 140ms cubic-bezier(0.2, 0, 0.2, 1)";
        }
      } else {
        isHoveringInteractive = false;
        if (currentMagneticTarget) {
          currentMagneticTarget.style.transform = "";
          currentMagneticTarget.style.transition = "transform 260ms cubic-bezier(0.2, 0, 0.2, 1)";
          currentMagneticTarget = null;
        }
      }
    };

    const onPointerDown = () => {
      isMouseDown = true;
    };

    const onPointerUp = () => {
      isMouseDown = false;
    };

    const onPointerLeave = () => {
      isVisible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      glow.style.opacity = "0";

      if (currentMagneticTarget) {
        currentMagneticTarget.style.transform = "";
        currentMagneticTarget = null;
      }
    };

    let isTicking = true;

    const requestTick = () => {
      if (!isTicking) {
        isTicking = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      onPointerMove(e);
      requestTick();
    };

    const handlePointerDown = () => {
      onPointerDown();
      requestTick();
    };

    const handlePointerUp = () => {
      onPointerUp();
      requestTick();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    // High performance smooth Lerp animation loop
    const tick = () => {
      // Direct fast response for dot (immediate precision)
      dotX += (mouseX - dotX) * 0.55;
      dotY += (mouseY - dotY) * 0.55;

      // Fluid trailing lerp for ring
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      // Soft trailing lerp for ambient glow aura
      glowX += (mouseX - glowX) * 0.085;
      glowY += (mouseY - glowY) * 0.085;

      // Scale calculations for reactive feedback
      let ringScale = 1;
      let dotScale = 1;

      if (isHoveringInteractive) {
        ringScale = 1.45;
        dotScale = 0.65;
      }
      if (isMouseDown) {
        ringScale *= 0.85;
        dotScale *= 1.2;
      }

      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%) scale(${dotScale})`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${ringScale})`;
      glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;

      if (isHoveringInteractive) {
        ring.style.borderColor = "rgba(52, 211, 153, 0.8)";
        ring.style.backgroundColor = "rgba(16, 185, 129, 0.10)";
        ring.style.boxShadow = "0 0 16px rgba(16, 185, 129, 0.25)";
        glow.style.opacity = "1";
      } else {
        ring.style.borderColor = "rgba(52, 211, 153, 0.4)";
        ring.style.backgroundColor = "transparent";
        ring.style.boxShadow = "none";
      }

      const isSettled =
        Math.abs(mouseX - dotX) < 0.15 &&
        Math.abs(mouseY - dotY) < 0.15 &&
        Math.abs(mouseX - ringX) < 0.15 &&
        Math.abs(mouseY - ringY) < 0.15 &&
        Math.abs(mouseX - glowX) < 0.15 &&
        Math.abs(mouseY - glowY) < 0.15;

      if (!isSettled) {
        rafId = requestAnimationFrame(tick);
      } else {
        isTicking = false;
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("mouseleave", onPointerLeave);
      if (currentMagneticTarget) {
        currentMagneticTarget.style.transform = "";
      }
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      {/* 1. Subtle, soft emerald ambient glow that follows smoothly */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "240px",
          height: "240px",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.035) 45%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9996,
          opacity: 0,
          transition: "opacity 300ms ease",
          willChange: "transform",
        }}
      />

      {/* 2. Precision micro-dot with emerald radiance */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "5px",
          height: "5px",
          backgroundColor: "#ffffff",
          borderRadius: "50%",
          boxShadow: "0 0 10px 1.5px rgba(52, 211, 153, 0.85)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
          transition: "opacity 200ms ease",
          willChange: "transform",
        }}
      />

      {/* 3. Follower ring with interactive hover feedback & subtle magnetic snapping */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "30px",
          height: "30px",
          border: "1.5px solid rgba(52, 211, 153, 0.4)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition:
            "border-color 220ms ease, background-color 220ms ease, box-shadow 220ms ease, opacity 200ms ease",
          willChange: "transform",
        }}
      >
        <span
          ref={labelRef}
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#ffffff",
            opacity: 0,
            transition: "opacity 180ms ease",
            userSelect: "none",
          }}
        />
      </div>
    </>
  );
}
