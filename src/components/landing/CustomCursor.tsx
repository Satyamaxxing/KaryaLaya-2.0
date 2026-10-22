"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Curzr Arrow Pointer — High-Performance Zero-Lag Implementation
 *
 * Characteristics:
 * - Solid black body interior with crisp white stroke outline
 * - Curzr signature directional rotation & cumulative angle displacement
 * - Instant 1:1 hardware tracking with zero translation latency
 * - Decoupled rotation (immediate, fluid direction following without lag)
 * - Micro-spring scaling on click (0.75) and link/button hover (1.15)
 * - Optimized SVG vector shadow (replaces heavy CSS filter compositing)
 * - Throttled DOM inspection for 120Hz/240Hz mouse responsiveness
 * - Disabled on touch/mobile devices and hidden over editable text fields
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
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
    const rotator = rotatorRef.current;
    const scaler = scalerRef.current;
    if (!cursor || !rotator || !scaler) return;

    const degrees = 57.296; // 180 / Math.PI

    const position = {
      distanceX: 0,
      distanceY: 0,
      distance: 0,
      pointerX: window.innerWidth / 2,
      pointerY: window.innerHeight / 2,
    };

    let previousPointerX = position.pointerX;
    let previousPointerY = position.pointerY;
    let angle = 0;
    let previousAngle = 0;
    let angleDisplace = 0;

    let isVisible = false;
    let isHovering = false;
    let isClicking = false;
    let isOverEditable = false;
    let lastTarget: EventTarget | null = null;

    // Curzr native rotation calculation
    const rotate = () => {
      const unsortedAngle =
        Math.atan(Math.abs(position.distanceY) / Math.abs(position.distanceX)) * degrees;
      previousAngle = angle;

      if (position.distanceX <= 0 && position.distanceY >= 0) {
        angle = 90 - unsortedAngle;
      } else if (position.distanceX < 0 && position.distanceY < 0) {
        angle = unsortedAngle + 90;
      } else if (position.distanceX >= 0 && position.distanceY <= 0) {
        angle = 90 - unsortedAngle + 180;
      } else if (position.distanceX > 0 && position.distanceY > 0) {
        angle = unsortedAngle + 270;
      }

      if (isNaN(angle)) {
        angle = previousAngle;
      } else {
        if (angle - previousAngle <= -270) {
          angleDisplace += 360 + angle - previousAngle;
        } else if (angle - previousAngle >= 270) {
          angleDisplace += angle - previousAngle - 360;
        } else {
          angleDisplace += angle - previousAngle;
        }
      }
    };

    const updateScale = () => {
      const scale = isClicking ? 0.75 : isHovering ? 1.15 : 1;
      scaler.style.transform = `scale(${scale})`;
    };

    const move = (e: PointerEvent) => {
      previousPointerX = position.pointerX;
      previousPointerY = position.pointerY;
      position.pointerX = e.clientX;
      position.pointerY = e.clientY;
      position.distanceX = previousPointerX - position.pointerX;
      position.distanceY = previousPointerY - position.pointerY;
      position.distance = Math.sqrt(
        position.distanceY * position.distanceY + position.distanceX * position.distanceX
      );

      // 0ms translation for true 1:1 hardware mouse tracking without drag or lag
      cursor.style.transform = `translate3d(${position.pointerX}px, ${position.pointerY}px, 0)`;

      if (!isVisible) {
        isVisible = true;
        cursor.style.opacity = "1";
      }

      // Check DOM only when hovering over a different element (avoids 1000 DOM lookups/sec)
      if (e.target !== lastTarget) {
        lastTarget = e.target;
        const target = e.target as HTMLElement | null;
        if (target) {
          const editable = target.closest("input, textarea, select, [contenteditable='true']");
          isOverEditable = !!editable;

          if (isOverEditable) {
            cursor.style.opacity = "0";
          } else {
            cursor.style.opacity = "1";
          }

          const interactive = target.closest(
            "a, button, [role='button'], .cursor-pointer, summary, input[type='submit'], input[type='button'], label[for]"
          );
          const nextHovering = !!interactive && !isOverEditable;
          if (nextHovering !== isHovering) {
            isHovering = nextHovering;
            updateScale();
          }
        }
      }

      if (position.distance > 1) {
        rotate();
        rotator.style.transform = `rotate(${angleDisplace}deg)`;
      }
    };

    const onMouseDown = () => {
      isClicking = true;
      updateScale();
    };

    const onMouseUp = () => {
      isClicking = false;
      updateScale();
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

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", onMouseDown, { passive: true });
    window.addEventListener("pointerup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      window.removeEventListener("pointermove", move);
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
          transition: opacity 120ms ease;
        }
        .curzr-arrow-rotator {
          width: 100%;
          height: 100%;
          transform-origin: 50% 9.375%;
          will-change: transform;
        }
        .curzr-arrow-scaler {
          width: 100%;
          height: 100%;
          transform-origin: 50% 9.375%;
          will-change: transform;
          transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .curzr-arrow-scaler svg {
          width: 100%;
          height: 100%;
          display: block;
        }
      `}</style>
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="curzr-arrow-pointer"
      >
        <div ref={rotatorRef} className="curzr-arrow-rotator">
          <div ref={scalerRef} className="curzr-arrow-scaler">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={{ overflow: "visible" }}>
              <defs>
                <filter id="curzr-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.65" />
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
        </div>
      </div>
    </>
  );
}
