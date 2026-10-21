"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Professional Ambient Cursor Spotlight
 * Clean, lightweight, and subtle illumination that tracks the pointer
 * without interfering with the native cursor, input fields, or button clicks.
 */
export default function CustomCursor() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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

    const el = spotlightRef.current;
    if (!el) return;

    let mouseX = -1000;
    let mouseY = -1000;
    let currentX = -1000;
    let currentY = -1000;
    let isVisible = false;
    let isHovering = false;
    let rafId: number;

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        el.style.opacity = "1";
      }

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          "a, button, [role='button'], input, textarea, select, .cursor-pointer"
        );
        isHovering = !!interactive;
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      el.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      el.style.opacity = "1";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    const tick = () => {
      // Fluid, natural following interpolation
      currentX += (mouseX - currentX) * 0.18;
      currentY += (mouseY - currentY) * 0.18;

      const size = isHovering ? 500 : 620;
      const innerColor = isHovering
        ? "rgba(52, 211, 153, 0.055)"
        : "rgba(255, 255, 255, 0.03)";
      const midColor = isHovering
        ? "rgba(16, 185, 129, 0.02)"
        : "rgba(255, 255, 255, 0.01)";

      el.style.background = `radial-gradient(${size}px circle at ${currentX}px ${currentY}px, ${innerColor} 0%, ${midColor} 28%, transparent 65%)`;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={spotlightRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        opacity: 0,
        transition: "opacity 300ms ease",
        willChange: "background",
      }}
    />
  );
}
