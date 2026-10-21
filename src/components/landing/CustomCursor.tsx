"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Curzr Smooth Directional Arrow Pointer
 * - Solid black body with a crisp white stroke outline
 * - Directional rotation that dynamically points along the movement path
 * - Shortest-arc angle lerp & filtered velocity to eliminate jitter ("shaky shaky")
 * - Pinpointed tip alignment (transform-origin at 50% 9.375%)
 * - Frame-rate independent animation loop synced to requestAnimationFrame
 * - Auto-hidden over text inputs and disabled on touch devices
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Disable entirely on touch/coarse devices and reduced-motion
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

    const CURSOR_SIZE = 26;
    // Arrow tip in 32x32 viewBox is at (16, 3)
    const OFFSET_X = -CURSOR_SIZE / 2; // -13px
    const OFFSET_Y = -CURSOR_SIZE * (3 / 32); // -2.4375px

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    let prevRawX = targetX;
    let prevRawY = targetY;
    let filteredDx = 0;
    let filteredDy = 0;

    let targetAngle = 0;
    let currentAngle = 0;

    let targetScale = 1;
    let currentScale = 1;

    let isVisible = false;
    let isHovering = false;
    let isClicking = false;
    let isOverEditable = false;

    let animationFrameId: number;
    let lastTime = performance.now();

    const onPointerMove = (e: MouseEvent) => {
      const rawDx = e.clientX - prevRawX;
      const rawDy = e.clientY - prevRawY;
      prevRawX = e.clientX;
      prevRawY = e.clientY;

      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
        cursor.style.opacity = "1";
      }

      // Check if cursor is over form/editable elements
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
        isHovering = !!interactive && !isOverEditable;
      }

      // Exponential moving average filter on displacement vector to eliminate sensor/pixel noise
      const alpha = 0.35;
      filteredDx = filteredDx * (1 - alpha) + rawDx * alpha;
      filteredDy = filteredDy * (1 - alpha) + rawDy * alpha;

      const speed = Math.hypot(filteredDx, filteredDy);

      // Only update target heading if intentional movement occurs (> 1.2px)
      // This prevents micro-jitter and shaking when moving slowly or resting
      if (speed > 1.2) {
        // SVG arrow points UP (towards -Y) at 0 deg, so atan2 + 90 deg gives exact heading
        targetAngle = (Math.atan2(filteredDy, filteredDx) * 180) / Math.PI + 90;
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

    // Frame-rate independent render loop
    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Position: locked directly to pointer tip for zero input latency
      currentX = targetX;
      currentY = targetY;

      // Shortest-arc angle interpolation (never does 360 degree spin flips)
      let diff = (targetAngle - currentAngle) % 360;
      if (diff < -180) diff += 360;
      if (diff > 180) diff -= 360;

      // Ultra-smooth exponential decay rotation (higher response without jitter)
      const rotFactor = 1 - Math.exp(-22 * dt);
      currentAngle += diff * rotFactor;

      // Smooth interactive scaling
      targetScale = isClicking ? 0.78 : isHovering ? 1.18 : 1;
      const scaleFactor = 1 - Math.exp(-20 * dt);
      currentScale += (targetScale - currentScale) * scaleFactor;

      const posX = currentX + OFFSET_X;
      const posY = currentY + OFFSET_Y;

      cursor.style.transform = `translate3d(${posX.toFixed(2)}px, ${posY.toFixed(2)}px, 0) rotate(${currentAngle.toFixed(2)}deg) scale(${currentScale.toFixed(3)})`;

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onMouseDown, { passive: true });
    window.addEventListener("pointerup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("pointerdown", onMouseDown);
      window.removeEventListener("pointerup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(animationFrameId);
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
          position: fixed;
          top: 0;
          left: 0;
          width: 26px;
          height: 26px;
          z-index: 2147483647;
          pointer-events: none;
          user-select: none;
          transform-origin: 50% 9.375%;
          will-change: transform;
          opacity: 0;
          transition: opacity 150ms ease;
          filter: drop-shadow(0 2px 7px rgba(0, 0, 0, 0.75));
        }
        .curzr-arrow-pointer svg {
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
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
        </svg>
      </div>
    </>
  );
}
