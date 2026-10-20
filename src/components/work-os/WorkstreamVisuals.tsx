"use client";

import React from "react";
import { WorkstreamType } from "@/types/work-os";

/**
 * WebWorkstreamVisual - PRD §5 & §34
 * Web Development: High-conversion WebGL browser preview with CTA intake.
 */
export function WebWorkstreamVisual() {
  return (
    <div className="w-full h-24 bg-zinc-950/90 rounded-lg border border-zinc-800/80 p-2 flex flex-col justify-between overflow-hidden relative group">
      {/* Browser Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500/80" />
          <span className="w-2 h-2 rounded-full bg-amber-500/80" />
          <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
        </div>
        <div className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-400">
          staging.acmecampaign.com
        </div>
        <span className="text-[9px] text-emerald-400 font-mono">200 OK</span>
      </div>

      {/* Hero Canvas Representation */}
      <div className="flex-1 flex items-center justify-center relative py-1">
        {/* Subtle radial vortex hint */}
        <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent opacity-60" />
        <div className="text-center space-y-0.5 relative z-10">
          <div className="text-[10px] font-bold text-white tracking-tight">
            The Center of Gravity
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[8px] font-bold">
            Live CTA Active ✓
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * VideoWorkstreamVisual - PRD §5 & §34
 * Video Editing: Multi-track NLE timeline preview with playhead and 4K reel master.
 */
export function VideoWorkstreamVisual() {
  return (
    <div className="w-full h-24 bg-zinc-950/90 rounded-lg border border-zinc-800/80 p-2 flex flex-col justify-between overflow-hidden relative">
      {/* Top track timecode */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60 text-[9px] font-mono text-zinc-400">
        <span className="text-purple-400 font-semibold">ProRes 4K · 60fps</span>
        <span className="text-zinc-300">00:00:48:12 / 00:01:00:00</span>
      </div>

      {/* Multi-track representation */}
      <div className="space-y-1 py-1">
        {/* Track V1: Video Clip */}
        <div className="h-3.5 bg-purple-950/80 border border-purple-500/40 rounded flex items-center px-1.5 justify-between text-[8px] text-purple-200">
          <span>V1: Cinematic Hero Reel V3</span>
          <span className="font-mono text-emerald-400 font-bold">Color Graded ✓</span>
        </div>
        {/* Track A1: Audio Waveform */}
        <div className="h-3 bg-indigo-950/80 border border-indigo-500/40 rounded flex items-center px-1.5 justify-between text-[8px] text-indigo-300">
          <span>A1: Dolby Atmos Spatial Audio</span>
          <span className="font-mono">Mastered</span>
        </div>
      </div>

      {/* Playhead bar */}
      <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
        <div className="bg-purple-500 h-full rounded-full" style={{ width: "80%" }} />
      </div>
    </div>
  );
}

/**
 * SocialWorkstreamVisual - PRD §5 & §34
 * Social Media: 30-Day Multi-Channel Content Calendar Matrix.
 */
export function SocialWorkstreamVisual() {
  return (
    <div className="w-full h-24 bg-zinc-950/90 rounded-lg border border-zinc-800/80 p-2 flex flex-col justify-between overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60 text-[9px] font-mono">
        <span className="text-sky-400 font-semibold">30-Day Distribution Grid</span>
        <span className="text-amber-400 font-medium">Pending Client Sign-Off</span>
      </div>

      {/* Calendar Slots */}
      <div className="grid grid-cols-4 gap-1 py-1 text-[8px]">
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-zinc-500">W1</div>
          <div className="text-emerald-400 font-bold">LinkedIn</div>
        </div>
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-zinc-500">W2</div>
          <div className="text-sky-400 font-bold">X Threads</div>
        </div>
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-zinc-500">W3</div>
          <div className="text-purple-400 font-bold">Carousels</div>
        </div>
        <div className="p-1 rounded bg-amber-950/60 border border-amber-500/40 text-center">
          <div className="text-amber-300 font-bold">Oct 16</div>
          <div className="text-amber-400 font-bold">Launch</div>
        </div>
      </div>

      <div className="text-[9px] text-zinc-400 flex items-center justify-between">
        <span>Channel: Multi-Platform</span>
        <span className="font-mono text-emerald-400">12 Posts Scheduled</span>
      </div>
    </div>
  );
}

/**
 * BrandWorkstreamVisual - PRD §5 & §34
 * Personal Branding: Executive Narrative & Identity Kit.
 */
export function BrandWorkstreamVisual() {
  return (
    <div className="w-full h-24 bg-zinc-950/90 rounded-lg border border-zinc-800/80 p-2 flex flex-col justify-between overflow-hidden relative">
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60 text-[9px] font-mono text-zinc-400">
        <span className="text-amber-300 font-semibold">Founder Executive Brand Kit</span>
        <span className="text-zinc-500">Scope v1</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 py-1">
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-[8px] space-y-0.5">
          <div className="text-zinc-500 font-mono">Pillar 1</div>
          <div className="font-semibold text-white truncate">Visionary POV</div>
        </div>
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-[8px] space-y-0.5">
          <div className="text-zinc-500 font-mono">Pillar 2</div>
          <div className="font-semibold text-white truncate">Product Proof</div>
        </div>
        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-[8px] space-y-0.5">
          <div className="text-zinc-500 font-mono">Assets</div>
          <div className="font-semibold text-sky-400 truncate">PR Package</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-zinc-400">
        <span>Tone: Authoritative & Direct</span>
        <span className="font-mono text-zinc-500">Upcoming Wave 2</span>
      </div>
    </div>
  );
}

export function WorkstreamVisual({ workstream }: { workstream: WorkstreamType }) {
  switch (workstream) {
    case "WEB":
      return <WebWorkstreamVisual />;
    case "VIDEO":
      return <VideoWorkstreamVisual />;
    case "SOCIAL":
      return <SocialWorkstreamVisual />;
    case "BRAND":
      return <BrandWorkstreamVisual />;
    default:
      return <WebWorkstreamVisual />;
  }
}
