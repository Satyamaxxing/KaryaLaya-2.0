"use client";

import React from "react";
import Link from "next/link";
import StarButton, { DoubleArrowRightIcon } from "@/components/ui/StarButton";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-black text-white">
      {/* Background Ambiance — Subtle curved horizon and radial emerald/silver glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "450px",
            background:
              "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.09) 0%, rgba(255, 255, 255, 0.03) 40%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        {/* Subtle curved hairline horizon */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(1280px, 92vw)",
            height: "360px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "50% 50% 0 0",
            maskImage:
              "linear-gradient(to right, transparent, black 25%, black 75%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 25%, black 75%, transparent)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-[15px] lg:px-14">
        <div className="mx-0 px-0 py-12 text-center lg:mx-5 lg:px-6 lg:py-16">
          <div className="relative z-10 mx-auto max-w-3xl">
            {/* Connected Team Avatar Cluster */}
            <div
              className="mb-6 flex justify-center items-center"
              aria-label="Teams connected with KaryaLaya"
            >
              <span className="relative flex shrink-0 overflow-hidden rounded-full -ml-2 size-9 border border-white/12 bg-black p-[2px] first:ml-0 shadow-lg">
                <span className="flex size-full items-center justify-center rounded-full bg-emerald-950/80 text-emerald-300 text-[11px] font-semibold tracking-wide">
                  SK
                </span>
              </span>
              <span className="relative flex shrink-0 overflow-hidden rounded-full -ml-2 size-9 border border-white/12 bg-black p-[2px] first:ml-0 shadow-lg">
                <span className="flex size-full items-center justify-center rounded-full bg-indigo-950/80 text-indigo-300 text-[11px] font-semibold tracking-wide">
                  RR
                </span>
              </span>
              <span className="relative flex shrink-0 overflow-hidden rounded-full -ml-2 size-9 border border-white/12 bg-black p-[2px] first:ml-0 shadow-lg">
                <span className="flex size-full items-center justify-center rounded-full bg-amber-950/80 text-amber-300 text-[11px] font-semibold tracking-wide">
                  AP
                </span>
              </span>
              <span className="relative flex shrink-0 overflow-hidden rounded-full -ml-2 size-9 border border-white/12 bg-black p-[2px] first:ml-0 shadow-lg">
                <span className="flex size-full items-center justify-center rounded-full bg-cyan-950/80 text-cyan-300 text-[11px] font-semibold tracking-wide">
                  AN
                </span>
              </span>
              <span className="relative flex shrink-0 overflow-hidden rounded-full -ml-2 size-9 border border-white/12 bg-black p-[2px] first:ml-0 shadow-lg">
                <span className="flex size-full items-center justify-center rounded-full bg-zinc-900 text-zinc-300 text-[12px] font-medium">
                  +
                </span>
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-display text-[38px] sm:text-[46px] lg:text-[54px] font-normal leading-[1.05] tracking-tight">
              <span className="block text-white">One workspace.</span>
              <span className="mt-1 block bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent lg:mt-2">
                Every deliverable in sync.
              </span>
            </h2>

            {/* Supporting Text */}
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-400">
              From the first brief to final approval, keep your team, clients, and every deadline moving together.
            </p>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" style={{ textDecoration: "none" }}>
                <StarButton
                  backgroundColor="#000000"
                  style={{
                    height: "44px",
                    padding: "0 22px",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  <span>GET STARTED</span>
                  <DoubleArrowRightIcon size={14} />
                </StarButton>
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold tracking-wider transition-all duration-300 h-[44px] px-6 rounded-full border border-white/20 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                style={{ textDecoration: "none" }}
              >
                <span>EXPLORE WORKFLOW</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
