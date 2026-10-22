"use client";

import React, { useEffect, useRef, memo } from "react";

/**
 * AuthWaveCanvas:
 * Continuous silk string lines sweeping across the dark left pane.
 *
 * Entrance Animation (Matching Screenshot 2):
 * - Fine combed needle-point fiber threads stream in from the left on a diagonal sweep.
 * - Each thread has a unique organic reach stagger (upper-middle leads, with pseudo-stochastic
 *   needle offsets so no two adjacent lines end at the same point).
 * - 100% continuous floating-point evaluation: NO discrete integer step rounding or vertical staircases.
 * - Soft luminous gradient feathering at the leading tip of each thread.
 * - Buttery quintic-out easing curve over 2.4s.
 * - Once fully entered, lines smoothly transition into perpetual, edge-to-edge organic silk undulation.
 */
function AuthWaveCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;

    // 44 fine parallel silk threads (matches density in Screenshot 2)
    const numLines = 44;
    const steps = 36; // Spline control points per thread

    // Pre-allocated typed coordinate buffers (zero per-frame heap allocation)
    const pointsX = new Float32Array(steps + 1);
    const pointsY = new Float32Array(steps + 1);

    // Precompute deterministic per-line fiber configuration (stagger, alpha, speed)
    interface FiberConfig {
      p: number;
      baseAlpha: number;
      reachOffset: number; // Stagger offset (-0.28 to +0.28)
      baseColorStr: string;
      glowColorStr: string;
      isCrease: boolean;
    }

    const fibers: FiberConfig[] = [];
    for (let i = 0; i < numLines; i++) {
      const p = i / (numLines - 1); // 0 (top) to 1 (bottom)

      // Deterministic pseudo-random hash per line for needle-point micro-stagger
      const hash1 = Math.sin((i + 1) * 127.1 + 311.7) * 43758.5453;
      const rand1 = hash1 - Math.floor(hash1); // 0 to 1

      // Macro envelope: upper & upper-middle threads lead forward (as seen in Screenshot 2)
      const macroReach = (1 - Math.pow(p, 1.4) * 0.75) * 0.22;

      // Micro needle jitter: +/- 0.16 spread so adjacent lines end at varied lengths
      const microReach = (rand1 - 0.5) * 0.32;

      const reachOffset = macroReach + microReach;

      // Luminance profile: delicate at top, rich in body, radiant at lower silk fold
      const baseAlpha = 0.05 + Math.sin(p * Math.PI) * 0.38 + (p > 0.82 ? 0.34 : 0);
      const alpha = Math.min(baseAlpha, 0.95);
      const isCrease = p > 0.84;

      fibers.push({
        p,
        baseAlpha: alpha,
        reachOffset,
        baseColorStr: `rgba(255, 255, 255, ${alpha.toFixed(3)})`,
        glowColorStr: `rgba(255, 255, 255, ${(alpha * 0.24).toFixed(3)})`,
        isCrease,
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      if (width <= 0 || height <= 0) return;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Pause when offscreen or hidden
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry ? entry.isIntersecting : true;
        if (isVisible && !animId) {
          animId = requestAnimationFrame(draw);
        }
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const handleVisibility = () => {
      if (document.hidden) {
        isVisible = false;
        if (animId) {
          cancelAnimationFrame(animId);
          animId = 0;
        }
      } else {
        isVisible = true;
        if (!animId) {
          animId = requestAnimationFrame(draw);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const startTime = performance.now();

    const draw = (now: number) => {
      if (!isVisible || width <= 0 || height <= 0) {
        animId = 0;
        return;
      }

      const elapsed = (now - startTime) * 0.001; // elapsed seconds

      // Luxurious buttery quintic-out entrance over 2.4 seconds
      const entranceDuration = 2.4;
      const rawT = Math.min(elapsed / entranceDuration, 1.0);
      const isEntering = rawT < 1.0;

      // Quintic-out easing curve for buttery-smooth deceleration
      const ease = 1 - Math.pow(1 - rawT, 3.4);

      // Convergence factor: as rawT -> 1.0, all threads smoothly unify to 1.0 (edge-to-edge)
      const convergence = Math.pow(rawT, 2.2);

      ctx.clearRect(0, 0, width, height);

      // Harmonious traveling wave frequencies for calm, liquid undulation
      const t1 = elapsed * 0.88;
      const t2 = elapsed * 1.50;
      const t3 = elapsed * 0.68;
      const t4 = elapsed * 1.10;
      const t5 = elapsed * 0.36;

      for (let i = 0; i < numLines; i++) {
        const fiber = fibers[i];
        const p = fiber.p;

        // Individual continuous lineHead (strictly a float, NO integer rounding!)
        // In the entrance phase: staggered needle tips matching Screenshot 2
        // At the end of entrance: smoothly reaches 1.0 for seamless continuous silk
        let lineHead = 1.0;
        if (isEntering) {
          const staggeredReach = ease * (1 + fiber.reachOffset * (1 - convergence));
          lineHead = Math.min(Math.max(staggeredReach, 0.015), 1.0);
        }

        if (lineHead <= 0.02) {
          continue; // Fiber hasn't started entering yet
        }

        // Hoist line-level invariants outside the vertex sampling loop
        // Starts mid-upper left (~26% - 50%), sweeps down towards bottom-right (~46% - 82%)
        const baseH = height * (0.28 + p * 0.22);
        const slopeH = height * (0.18 + p * 0.14);
        const amp1 = 24 + p * 12;
        const amp2 = 13 + p * 8;
        const pPhase1 = p * 1.9 - t1;
        const pPhase2 = p * 2.6 - t2;
        const pPhase3 = p * 3.2 - t3;
        const pPhase4 = p * 1.4 - t4;
        const w5 = Math.sin(t5 + p * 2.0) * 8;

        // Evaluate continuous points strictly along [0, lineHead]
        // This eliminates any possibility of vertical staircase steps!
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const xNorm = frac * lineHead; // 100% continuous from 0 to exact lineHead

          // Continuous x coordinate from offscreen left (-35px) to active tip
          pointsX[s] = -35 + xNorm * (width + 70);

          const base = baseH + xNorm * slopeH;
          const w1 = Math.sin(xNorm * 3.3 + pPhase1) * amp1;
          const w2 = Math.cos(xNorm * 5.6 + pPhase2) * amp2;
          const w3 = Math.sin(xNorm * 2.2 + pPhase3) * 15;
          const w4 = Math.cos((1 - xNorm) * 4.0 + pPhase4) * 10;

          pointsY[s] = base + w1 + w2 + w3 + w4 + w5;
        }

        // Draw C1 continuous curve using midpoint quadratic splines
        ctx.beginPath();
        ctx.moveTo(pointsX[0], pointsY[0]);

        for (let s = 1; s < steps; s++) {
          const midX = (pointsX[s] + pointsX[s + 1]) * 0.5;
          const midY = (pointsY[s] + pointsY[s + 1]) * 0.5;
          ctx.quadraticCurveTo(pointsX[s], pointsY[s], midX, midY);
        }

        ctx.lineTo(pointsX[steps], pointsY[steps]);

        // Dynamic tip feathering during entrance (soft feathered needle tips matching Screenshot 2)
        if (isEntering && lineHead < 0.98) {
          const startX = pointsX[0];
          const tipX = pointsX[steps];
          const grad = ctx.createLinearGradient(startX, 0, tipX, 0);
          grad.addColorStop(0, "rgba(255, 255, 255, 0)");
          grad.addColorStop(0.08, fiber.baseColorStr);
          grad.addColorStop(0.78, fiber.baseColorStr);
          grad.addColorStop(1.0, "rgba(255, 255, 255, 0)"); // Soft feathered tip

          if (fiber.isCrease) {
            ctx.strokeStyle = fiber.glowColorStr;
            ctx.lineWidth = 2.6;
            ctx.stroke();
          }

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.05;
          ctx.stroke();
        } else {
          // Continuous edge-to-edge mode: use pre-compiled solid alpha with crisp lines
          if (fiber.isCrease) {
            ctx.strokeStyle = fiber.glowColorStr;
            ctx.lineWidth = 2.6;
            ctx.stroke();
          }

          ctx.strokeStyle = fiber.baseColorStr;
          ctx.lineWidth = 1.05;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}

export default memo(AuthWaveCanvas);
