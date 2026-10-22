"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * CustomCursor:
 * - Default: Fluid Curzr Arrow Pointer (rotates in direction of movement)
 * - Interactive Hover (buttons, links, clickable items): Morphs into the Retro Card-Hand Pointer (1:1 matching reference image)
 * - Dual-layer support: Works seamlessly with hardware acceleration, falls back gracefully.
 * - Robust: Safe Element checking (handles SVGs/text nodes without throwing), preserves native I-beam on inputs.
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const cardHandRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only disable if device does not support hover at all (e.g. mobile phones / pure touchscreens without mouse)
    // Never disable on Windows touchscreen laptops that have a mouse or trackpad connected!
    const canHover = window.matchMedia("(hover: hover)").matches;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canHover || isReduced) {
      return;
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const cursor = cursorRef.current;
    const arrow = arrowRef.current;
    const cardHand = cardHandRef.current;
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

    const updateHoverState = (hovering: boolean) => {
      if (isHovering === hovering) return;
      isHovering = hovering;

      if (arrow && cardHand) {
        if (isHovering) {
          arrow.style.opacity = "0";
          arrow.style.transform = "scale(0.65)";
          cardHand.style.opacity = "1";
          cardHand.style.transform = "scale(1)";
        } else {
          arrow.style.opacity = "1";
          arrow.style.transform = "scale(1)";
          cardHand.style.opacity = "0";
          cardHand.style.transform = "scale(0.65)";
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // If user is directly touching screen with finger, hide custom cursor
      if (e.pointerType === "touch") {
        isVisible = false;
        cursor.style.opacity = "0";
        return;
      }

      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
        cursor.style.opacity = "1";
      }

      // Check DOM safely across SVGs, text nodes, and standard elements
      if (e.target !== lastTarget) {
        lastTarget = e.target;
        const rawTarget = e.target as Node | null;
        const target = (rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement) as Element | null;

        if (target && typeof target.closest === "function") {
          const editable = target.closest("input, textarea, select, [contenteditable='true']");
          isOverEditable = !!editable;

          cursor.style.opacity = isOverEditable ? "0" : "1";

          const interactive = target.closest(
            "a, button, [role='button'], .cursor-pointer, summary, input[type='submit'], input[type='button'], label[for], [onclick], [data-cursor='pointer']"
          );
          updateHoverState(!!interactive && !isOverEditable);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isClicking = true;
      }
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

    // Smooth physics loop
    const loop = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // Position lerp
      currentX += dx * 0.32;
      currentY += dy * 0.32;

      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isHovering) {
        // Pointing card hand stays upright with zero angular tilt
        targetAngle = 0;
        currentAngle += (0 - currentAngle) * 0.35;
      } else {
        // Default arrow dynamically tracks travel direction
        if (dist > 0.8) {
          targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        }

        // Shortest-arc angular displacement
        let diff = targetAngle - currentAngle;
        if (diff > 180) diff -= 360;
        else if (diff < -180) diff += 360;
        currentAngle += diff * 0.22;
      }

      // Scale easing
      targetScale = isClicking ? 0.85 : 1;
      currentScale += (targetScale - currentScale) * 0.28;

      // Hotspot offset:
      // When hovering (Card Hand): index fingertip is at x=16, y=10 inside 32x32 box
      // When default (Arrow): tip is at x=16, y=4 inside 32x32 box
      const hotspotOffsetX = 16;
      const hotspotOffsetY = isHovering ? 10 : 4;

      const posX = currentX - hotspotOffsetX;
      const posY = currentY - hotspotOffsetY;

      cursor.style.transform = `translate3d(${posX}px, ${posY}px, 0) rotate(${currentAngle}deg) scale(${currentScale})`;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          html, body, a, button, [role="button"], .cursor-pointer, summary, [onclick], label[for] {
            cursor: none !important;
          }
          input, textarea, select, [contenteditable="true"] {
            cursor: auto !important;
          }
        }
        .curzr-master-container {
          box-sizing: border-box;
          position: fixed;
          top: 0;
          left: 0;
          width: 32px;
          height: 32px;
          z-index: 2147483647;
          user-select: none;
          pointer-events: none;
          will-change: transform;
          opacity: 0;
          transition: opacity 120ms ease;
        }
        .curzr-arrow-layer,
        .curzr-cardhand-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .curzr-arrow-layer svg,
        .curzr-cardhand-layer svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }
      `}</style>

      <div ref={cursorRef} aria-hidden="true" className="curzr-master-container">
        {/* State 1: Default Sleek Curzr Arrow Pointer */}
        <div ref={arrowRef} className="curzr-arrow-layer" style={{ opacity: 1, transform: "scale(1)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
            <defs>
              <filter id="curzr-arrow-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
              </filter>
            </defs>
            <g filter="url(#curzr-arrow-shadow)">
              <path
                d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z"
                fill="#000000"
              />
              <path
                d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z"
                fill="#FFFFFF"
              />
            </g>
          </svg>
        </div>

        {/* State 2: Interactive Hover — Retro Card-Hand Pointer (1:1 Reference Match) */}
        <div ref={cardHandRef} className="curzr-cardhand-layer" style={{ opacity: 0, transform: "scale(0.65)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
            <defs>
              <filter id="curzr-cardhand-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.9" />
              </filter>
            </defs>
            <g filter="url(#curzr-cardhand-shadow)">
              {/* Back Card (Hollow with White Border) */}
              <rect
                x="3.5"
                y="3"
                width="10.5"
                height="14"
                rx="1.5"
                fill="rgba(0, 0, 0, 0.45)"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* Front Card (Hollow with White Border, shifted down-right) */}
              <rect
                x="8"
                y="6"
                width="10.5"
                height="14"
                rx="1.5"
                fill="rgba(0, 0, 0, 0.6)"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* Pointing Hand with Solid Black Fill & Crisp White Outline */}
              {/* Hotspot at index fingertip: (16, 10) */}
              <path
                d="M 14.5 11
                   C 14.5 9 17.5 9 17.5 11
                   L 17.5 17
                   C 18.2 16.3 20.2 16.5 20.5 17.8
                   C 21.2 17.2 22.8 17.5 23 18.6
                   C 23.8 18.3 25.2 18.7 25 20
                   L 24.5 23
                   C 24 25.8 21.5 27 19 27
                   L 15 27
                   C 13 27 11.8 26 11.2 24.5
                   L 9 21.5
                   C 8.2 20.3 9.4 19.2 10.6 19.8
                   L 12.5 20.8
                   L 13.5 20.8
                   L 13.5 11
                   Z"
                fill="#000000"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>
      </div>
    </>
  );
}
