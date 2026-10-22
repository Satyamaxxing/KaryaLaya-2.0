"use client";

import React, { useEffect, useRef } from "react";

/**
 * AuthWaveCanvas:
 * Recreates the subtle curved line artwork from the reference screenshot & animation sheet.
 * Consists of an undulating 3D ribbon of ~36 flowing bezier curves with smooth sine harmonics,
 * running at 60fps/120fps with minimal CPU/GPU overhead.
 */
export default function AuthWaveCanvas({ className = "" }: { className?: string }) {
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

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const lineCount = 38;
    let startTime = performance.now();

    const draw = (now: number) => {
      const elapsed = (now - startTime) * 0.001; // elapsed in seconds

      ctx.clearRect(0, 0, width, height);

      // Slow, hypnotic undulation frequency
      const waveTime = elapsed * 0.45;

      for (let i = 0; i < lineCount; i++) {
        const p = i / (lineCount - 1); // 0 to 1

        // Base y positions matching the reference screenshot:
        // Starts mid-left (~45% - 58% height), dips into a crest, sweeps down towards bottom-right
        const startY = height * 0.44 + p * (height * 0.16) + Math.sin(waveTime + p * 1.8) * 14;

        // Control point 1 (initial curve dip/crest)
        const cp1X = width * 0.32 + Math.cos(waveTime * 0.8 + p * 2.2) * 28;
        const cp1Y = height * 0.48 + p * (height * 0.22) + Math.sin(waveTime * 1.2 + p * 2.5) * 38;

        // Control point 2 (middle swoop)
        const cp2X = width * 0.68 + Math.sin(waveTime * 0.9 + p * 1.9) * 32;
        const cp2Y = height * 0.64 + p * (height * 0.24) + Math.cos(waveTime * 1.1 + p * 2.1) * 44;

        // End point at right edge
        const endX = width * 1.05;
        const endY = height * 0.78 + p * (height * 0.22) + Math.sin(waveTime * 0.7 + p * 1.6) * 22;

        // Varying alpha profile: brighter in center, fading gracefully at edges
        const centerWeight = Math.sin(p * Math.PI);
        const alpha = 0.035 + centerWeight * 0.24;

        ctx.beginPath();
        ctx.moveTo(-15, startY);
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
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
