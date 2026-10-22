"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Curzr Arrow Pointer — Exact Math & Easing from Curzr Library (Taylon Chan / fuzionix)
 * Reference: https://codepen.io/fuzionix/pen/PoRWVRg
 *
 * Characteristics:
 * - Fluid requestAnimationFrame lerp tracking (0.25 position easing, 0.20 angular easing)
 * - True Curzr shortest-arc angle displacement (handles 360 wrap-around seamlessly)
 * - Micro-spring scaling on click (0.75) and interactive hover (1.18)
 * - Hardware-accelerated translate3d + rotate on single matrix pass
 * - Zero pointermove overhead (lightweight coordinate capture)
 * - Disabled on touch/mobile devices and hidden over editable text inputs
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Disable entirely on touch/coarse pointer devices and reduced motion
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

    const cursor = cursorRef.current;
    if (!cursor) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    let targetAngle = 0;
    let currentAngle = 0;

    let isVisible = false;
    let isHovering = false;
    let isClicking = false;
    let isOverEditable = false;
    let currentScale = 1;
    let targetScale = 1;

    let lastTarget: EventTarget | null = null;
    let animId: number;

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
        cursor.style.opacity = "1";
      }

      // Check DOM only when moving over a different element
      if (e.target !== lastTarget) {
        lastTarget = e.target;
        const target = e.target as HTMLElement | null;
        if (target) {
          const editable = target.closest("input, textarea, select, [contenteditable='true']");
          isOverEditable = !!editable;

          cursor.style.opacity = isOverEditable ? "0" : "1";

          const interactive = target.closest(
            "a, button, [role='button'], .cursor-pointer, summary, input[type='submit'], input[type='button'], label[for]"
          );
          isHovering = !!interactive && !isOverEditable;
        }
      }
    };

    const onMouseDown = () => {
      isClicking = true;
    };

    const onMouseUp = () => {
      isClicking = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
      cursor.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (!isOverEditable) {
        cursor.style.opacity = "1";
      }
    };

    // Curzr core animation loop: smooth lerp of position, rotation, and scale
    const loop = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // Position easing: fluid gliding response
      currentX += dx * 0.28;
      currentY += dy * 0.28;

      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only reorient when moving
      if (dist > 0.8) {
        // Arrow points naturally along direction of travel (+90 because default SVG vector points upward)
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      }

      // Curzr shortest-path angular displacement
      let diff = targetAngle - currentAngle;
      if (diff > 180) diff -= 360;
      else if (diff < -180) diff += 360;

      currentAngle += diff * 0.22;

      // Scale easing
      targetScale = isClicking ? 0.75 : isHovering ? 1.2 : 1;
      currentScale += (targetScale - currentScale) * 0.25;

      // Single hardware-accelerated transform
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${currentAngle}deg) scale(${currentScale})`;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onMouseDown, { passive: true });
    window.addEventListener("pointerup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onMouseDown);
      window.removeEventListener("pointerup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          html, body, a, button, [role="button"], .cursor-pointer, summary {
            cursor: none !important;
          }
          input, textarea, select, [contenteditable="true"] {
            cursor: auto !important;
          }
        }
        .curzr-arrow-pointer {
          box-sizing: border-box;
          position: fixed;
          top: -2.06px;
          left: -11px;
          width: 22px;
          height: 22px;
          z-index: 2147483647;
          user-select: none;
          pointer-events: none;
          will-change: transform;
          opacity: 0;
          transition: opacity 150ms ease;
          transform-origin: 50% 9.375%;
        }
        .curzr-arrow-pointer svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }
      `}</style>
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="curzr-arrow-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <defs>
            <filter id="curzr-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </defs>
          <g filter="url(#curzr-shadow)">
            {/* Black Body Interior */}
            <path
              className="inner"
              d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z"
              fill="#000000"
            />
            {/* Crisp White Stroke Outline */}
            <path
              className="outer"
              d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z"
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </div>
    </>
  );
}
