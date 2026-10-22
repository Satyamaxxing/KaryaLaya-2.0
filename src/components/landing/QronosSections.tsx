"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGsapContext, getReducedMotion } from "@/lib/motion";
import { InboxSection } from "./InboxSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { FeaturesSection } from "./FeaturesSection";
export { InboxSection } from "./InboxSection";

const S2_ART1_HTML = `<article class="group relative flex flex-col overflow-hidden w-full border-b border-white/[0.12]" style="position: relative; display: flex; flex-direction: column; overflow: hidden; width: 100%; box-sizing: border-box; padding: clamp(40px, 4.5vw, 60px) clamp(16px, 3vw, 40px) clamp(64px, 7.5vw, 96px); border-bottom: 1px solid rgba(255,255,255,0.12);"><div class="flex flex-1 items-center"><div class="relative w-full overflow-hidden rounded-[14px] border border-white/[0.09] p-[5px]"><div class="w-full overflow-hidden rounded-[8px] border border-white/[0.09] bg-[linear-gradient(145deg,rgba(19,19,21,0.98),rgba(7,7,8,0.98))] font-sans"><div class="flex items-center justify-between border-b border-white/[0.06] px-5 sm:px-8 py-3.5"><div class="flex items-center gap-2 sm:gap-2.5"><span class="inline-block size-[7px] rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span><span class="font-mono text-[10px] sm:text-[11px] tracking-[0.12em] text-white/70">CONNECTED TEAM WORKFLOW — LIVE</span></div><span class="font-mono text-[10px] sm:text-[11px] text-white/60">3 teams · 0 blockers</span></div><svg width="100%" viewBox="0 0 580 172" class="block" style="display: block; width: 100%; padding: 18px 0 24px;" aria-label="Animated connected team workflow"><defs><linearGradient id="qronos-agent-pipeline-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8fafc"></stop><stop offset="0.42" stop-color="#9ca3af"></stop><stop offset="0.7" stop-color="#e5e7eb"></stop><stop offset="1" stop-color="#6b7280"></stop></linearGradient><linearGradient id="qronos-orchestrator-silver" x1="306" y1="53" x2="411" y2="123" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f8fafc"></stop><stop offset="0.28" stop-color="#8b929d"></stop><stop offset="0.56" stop-color="#e5e7eb"></stop><stop offset="1" stop-color="#525866"></stop></linearGradient><marker id="qronos-agent-pipeline-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M2 1.5L7.5 5L2 8.5" fill="none" stroke="rgba(0,82,255,0.45)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></marker></defs><path d="M116,88 L158,88" fill="none" stroke="rgba(0,82,255,0.22)" stroke-width="1.5" stroke-dasharray="3 5" marker-end="url(#qronos-agent-pipeline-arrow)"></path><path d="M268,88 L306,88" fill="none" stroke="rgba(0,82,255,0.22)" stroke-width="1.5" stroke-dasharray="3 5" marker-end="url(#qronos-agent-pipeline-arrow)"></path><path d="M411,88 C425,88 435,50 448,50" fill="none" stroke="rgba(0,82,255,0.15)" stroke-width="1.5" stroke-dasharray="3 5"></path><path d="M411,88 L448,88" fill="none" stroke="rgba(0,82,255,0.15)" stroke-width="1.5" stroke-dasharray="3 5"></path><path d="M411,88 C425,88 435,126 448,126" fill="none" stroke="rgba(0,82,255,0.15)" stroke-width="1.5" stroke-dasharray="3 5"></path><circle r="2.5" fill="url(#qronos-agent-pipeline-silver)" opacity="1"><animateMotion dur="1.05s" repeatCount="indefinite" begin="0s" path="M116,88 L158,88"></animateMotion></circle><circle r="1.8" fill="url(#qronos-agent-pipeline-silver)" opacity="0.65"><animateMotion dur="1.05s" repeatCount="indefinite" begin="0.35s" path="M116,88 L158,88"></animateMotion></circle><circle r="1.3" fill="url(#qronos-agent-pipeline-silver)" opacity="0.35"><animateMotion dur="1.05s" repeatCount="indefinite" begin="0.7s" path="M116,88 L158,88"></animateMotion></circle><circle r="2.5" fill="url(#qronos-agent-pipeline-silver)" opacity="1"><animateMotion dur="0.88s" repeatCount="indefinite" begin="0.18s" path="M268,88 L306,88"></animateMotion></circle><circle r="1.8" fill="url(#qronos-agent-pipeline-silver)" opacity="0.65"><animateMotion dur="0.88s" repeatCount="indefinite" begin="0.62s" path="M268,88 L306,88"></animateMotion></circle><circle r="2.2" fill="url(#qronos-agent-pipeline-silver)" opacity="0.9"><animateMotion dur="1.3s" repeatCount="indefinite" begin="0.08s" path="M411,88 C425,88 435,50 448,50"></animateMotion></circle><circle r="1.5" fill="url(#qronos-agent-pipeline-silver)" opacity="0.55"><animateMotion dur="1.3s" repeatCount="indefinite" begin="0.65s" path="M411,88 C425,88 435,50 448,50"></animateMotion></circle><circle r="2.2" fill="url(#qronos-agent-pipeline-silver)" opacity="0.9"><animateMotion dur="1.15s" repeatCount="indefinite" begin="0.28s" path="M411,88 L448,88"></animateMotion></circle><circle r="1.5" fill="url(#qronos-agent-pipeline-silver)" opacity="0.55"><animateMotion dur="1.15s" repeatCount="indefinite" begin="0.85s" path="M411,88 L448,88"></animateMotion></circle><circle r="2.2" fill="url(#qronos-agent-pipeline-silver)" opacity="0.9"><animateMotion dur="1.4s" repeatCount="indefinite" begin="0.45s" path="M411,88 C425,88 435,126 448,126"></animateMotion></circle><circle r="1.5" fill="url(#qronos-agent-pipeline-silver)" opacity="0.55"><animateMotion dur="1.4s" repeatCount="indefinite" begin="1s" path="M411,88 C425,88 435,126 448,126"></animateMotion></circle><rect x="16" y="66" width="100" height="44" rx="8" fill="#141414" stroke="rgba(255,255,255,0.09)" stroke-width="0.5"></rect><text x="66" y="83" text-anchor="middle" font-size="9.5" fill="rgba(255,255,255,0.5)" font-family="system-ui" letter-spacing=".07em">TRIGGER</text><text x="66" y="100" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.95)" font-family="system-ui">Client Brief</text><text x="66" y="122" text-anchor="middle" font-size="8.5" fill="rgba(255,255,255,0.45)" font-family="monospace">intake · scope</text><rect x="158" y="66" width="110" height="44" rx="8" fill="#141414" stroke="rgba(255,255,255,0.09)" stroke-width="0.5"></rect><text x="213" y="83" text-anchor="middle" font-size="9.5" fill="rgba(255,255,255,0.5)" font-family="system-ui" letter-spacing=".07em">SHARED CONTEXT</text><text x="213" y="100" text-anchor="middle" font-size="9.5" fill="rgba(255,255,255,0.95)" font-family="system-ui">Project Details Ready</text><text x="213" y="122" text-anchor="middle" font-size="8.5" fill="rgba(255,255,255,0.45)" font-family="monospace">brief + assets</text><rect x="306" y="53" width="105" height="70" rx="10" fill="#000" stroke="url(#qronos-orchestrator-silver)" stroke-width="2"></rect><text x="358" y="78" text-anchor="middle" font-size="9.5" fill="rgba(138,180,255,0.9)" font-family="system-ui" letter-spacing=".07em">COORDINATION</text><text x="358" y="97" text-anchor="middle" font-size="12" fill="#fff" font-family="system-ui" font-weight="500">Work Assigned</text><circle cx="346" cy="113" r="2.8" fill="url(#qronos-agent-pipeline-silver)"></circle><circle cx="358" cy="113" r="2.8" fill="url(#qronos-agent-pipeline-silver)"></circle><circle cx="370" cy="113" r="2.8" fill="url(#qronos-agent-pipeline-silver)"></circle><text x="358" y="139" text-anchor="middle" font-size="8.5" fill="rgba(138,180,255,0.95)" font-family="monospace">handoffs active</text><rect x="448" y="35" width="116" height="30" rx="7" fill="#111" stroke="rgba(255,255,255,0.07)" stroke-width="0.5"></rect><text x="494" y="53.5" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.85)" font-family="system-ui">Design Team</text><circle cx="550" cy="43" r="3" fill="#22c55e" opacity="0.95"></circle><rect x="448" y="73" width="116" height="30" rx="7" fill="#111" stroke="rgba(255,255,255,0.07)" stroke-width="0.5"></rect><text x="494" y="91.5" text-anchor="middle" font-size="9.8" fill="rgba(255,255,255,0.85)" font-family="system-ui">Development Team</text><circle cx="550" cy="81" r="3" fill="#f59e0b"></circle><rect x="448" y="111" width="116" height="30" rx="7" fill="#111" stroke="rgba(255,255,255,0.07)" stroke-width="0.5"></rect><text x="494" y="129.5" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.85)" font-family="system-ui">Content Team</text><circle cx="550" cy="119" r="3" fill="#f59e0b"></circle></svg></div><span aria-hidden="true" class="pointer-events-none absolute left-[1.125rem] top-0 h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-slate-300/0 via-slate-200/90 to-slate-300/0"></span></div></div><span aria-hidden="true" class="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-slate-300/0 via-slate-200/90 to-slate-300/0 transition-all duration-500 group-hover:w-full"></span></article>`;
const S2_ART2_HTML = `<article class="group relative flex min-h-[620px] flex-col overflow-hidden w-full border-b border-white/[0.12]" style="position: relative; display: flex; min-height: 620px; flex-direction: column; overflow: hidden; width: 100%; box-sizing: border-box; padding: clamp(64px, 7.5vw, 96px) clamp(16px, 3vw, 40px) clamp(56px, 6.5vw, 84px); border-bottom: 1px solid rgba(255,255,255,0.12);"><div class="flex flex-1 items-center"><div class="relative w-full overflow-hidden rounded-[14px] border border-white/[0.09] p-[5px]"><div class="before-after-panel flex flex-col border gap-0 overflow-hidden rounded-xl border-white/[0.09] bg-[linear-gradient(145deg,rgba(19,19,21,0.98),rgba(7,7,8,0.98))] py-0 shadow-none font-sans" style="background: linear-gradient(145deg, rgba(19,19,21,0.98), rgba(7,7,8,0.98)); border: 1px solid rgba(255,255,255,0.09); border-radius: 12px;"><div class="flex min-h-12 items-center justify-between border-b border-white/[0.08] px-5 py-3" style="min-height: 48px; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 12px 20px; background: rgba(255,255,255,0.02);"><div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 8px;"><span style="width: 10px; height: 10px; border-radius: 9999px; background: rgba(255,95,86,0.85); display: inline-block;"></span><span style="width: 10px; height: 10px; border-radius: 9999px; background: rgba(255,189,46,0.85); display: inline-block;"></span><span style="width: 10px; height: 10px; border-radius: 9999px; background: rgba(39,201,63,0.85); display: inline-block;"></span></div><div style="display: flex; align-items: center; gap: 8px; padding: 4px 14px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-family: monospace; font-size: 11px; color: rgba(255,255,255,0.6);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>karyalaya.agency</span></div><div style="display: flex; align-items: center;"><span style="border-radius: 9999px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); padding: 2px 8px; font-family: monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(255,255,255,0.65);">LIVE OS</span></div></div><div style="padding: 30px 24px 34px;"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 36px; align-items: center;"><div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 240px; overflow: visible; padding: 12px 0;"><div style="position: absolute; width: 240px; height: 240px; border-radius: 9999px; background: rgba(239, 68, 68, 0.05); filter: blur(55px); pointer-events: none;"></div><div class="scattered-icon" style="position: absolute; top: -22px; left: 16px; z-index: 30; pointer-events: none; filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.75));"><div style="position: relative; width: 140px; height: 86px;"><svg width="140" height="86" viewBox="0 0 140 86" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cloud-fill-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(32, 34, 44, 0.96)"/><stop offset="100%" stop-color="rgba(16, 17, 23, 0.93)"/></linearGradient><linearGradient id="cloud-stroke-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.35)"/><stop offset="50%" stop-color="rgba(248, 113, 113, 0.42)"/><stop offset="100%" stop-color="rgba(255, 255, 255, 0.18)"/></linearGradient></defs><path d="M 34,44 A 14,14 0 0,1 16,30 A 15,15 0 0,1 28,13 A 18,18 0 0,1 56,8 A 20,20 0 0,1 92,8 A 17,17 0 0,1 118,18 A 15,15 0 0,1 120,34 A 15,15 0 0,1 104,46 A 18,18 0 0,1 68,48 A 16,16 0 0,1 42,46 A 8,8 0 0,1 34,44 Z" fill="url(#cloud-fill-grad)" stroke="url(#cloud-stroke-grad)" stroke-width="1.35"/><circle cx="34" cy="60" r="5" fill="url(#cloud-fill-grad)" stroke="rgba(255, 255, 255, 0.22)" stroke-width="1.2"/><circle cx="25" cy="70" r="3.5" fill="url(#cloud-fill-grad)" stroke="rgba(255, 255, 255, 0.18)" stroke-width="1"/><circle cx="18" cy="78" r="2.2" fill="url(#cloud-fill-grad)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="0.8"/></svg><div style="position: absolute; top: 8px; left: 14px; width: 112px; height: 42px; display: flex; align-items: center; justify-content: center; gap: 5px;"><span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 9999px; background: rgba(239, 68, 68, 0.22); border: 1px solid rgba(239, 68, 68, 0.5); color: #f87171; font-size: 11px; font-weight: 800; line-height: 1; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">?</span><span style="font-size: 11px; font-family: monospace; font-weight: 600; color: rgba(255, 255, 255, 0.95); letter-spacing: 0.04em; white-space: nowrap; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);">lost update</span></div></div></div><div class="live-os-cluster-box" style="position: relative; width: 330px; height: 210px;"><svg class="cluster-connections" width="330" height="210" viewBox="0 0 330 210" style="position: absolute; inset: 0; pointer-events: none; z-index: 5;" fill="none"><path d="M 40 60 Q 60 28 98 42" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="2 3"/><circle r="1.6" fill="#60a5fa" opacity="0"><animateMotion path="M 40 60 Q 60 28 98 42" dur="6.5s" repeatCount="indefinite" begin="1s"/><animate attributeName="opacity" values="0;0;0.7;0.7;0;0" keyTimes="0;0.1;0.35;0.65;0.85;1" dur="6.5s" repeatCount="indefinite" begin="1s"/></circle><path d="M 118 112 Q 145 84 186 108" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="2 3"/><circle r="1.6" fill="#34d399" opacity="0"><animateMotion path="M 118 112 Q 145 84 186 108" dur="8.5s" repeatCount="indefinite" begin="3.5s"/><animate attributeName="opacity" values="0;0;0.75;0.75;0;0" keyTimes="0;0.1;0.35;0.65;0.85;1" dur="8.5s" repeatCount="indefinite" begin="3.5s"/></circle><path d="M 48 124 Q 78 142 114 114" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="2 3"/><circle r="1.6" fill="#a78bfa" opacity="0"><animateMotion path="M 48 124 Q 78 142 114 114" dur="7.5s" repeatCount="indefinite" begin="5.8s"/><animate attributeName="opacity" values="0;0;0.7;0.7;0;0" keyTimes="0;0.1;0.35;0.65;0.85;1" dur="7.5s" repeatCount="indefinite" begin="5.8s"/></circle></svg><div class="scattered-icon" style="position: absolute; left: 14px; top: 36px; z-index: 10; width: 52px; height: 52px; border-radius: 12px; background: #131418; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.65); display: flex; align-items: center; justify-content: center; transform: rotate(-6deg);"><svg width="25" height="25" viewBox="0 0 24 24" fill="#3b82f6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg><span class="badge-pill" style="position: absolute; top: -5px; right: -5px; border-radius: 9999px; background: #ef4444; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5); border: 1.5px solid #0c0d10;">2</span></div><div class="scattered-icon" style="position: absolute; left: 74px; top: 16px; z-index: 12; width: 54px; height: 54px; border-radius: 12px; background: #131418; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.65); display: flex; align-items: center; justify-content: center; transform: rotate(3deg);"><svg width="25" height="25" viewBox="0 0 24 24" fill="#10b981"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H5v-4h5v4zm0-6H5V7h5v4zm7 6h-5v-4h5v4zm0-6h-5V7h5v4z"/></svg><span class="badge-pill" style="position: absolute; top: -5px; right: -5px; border-radius: 9999px; background: #ef4444; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5); border: 1.5px solid #0c0d10;">12</span></div><div class="scattered-icon" style="position: absolute; left: 138px; top: 12px; z-index: 11; width: 52px; height: 52px; border-radius: 12px; background: #131418; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.65); display: flex; align-items: center; justify-content: center; transform: rotate(-2deg);"><svg width="25" height="25" viewBox="0 0 24 24" fill="#f59e0b"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/><circle cx="12" cy="15" r="2.2" fill="#fff"/></svg><span class="badge-pill" style="position: absolute; top: -5px; right: -5px; border-radius: 9999px; background: #ef4444; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5); border: 1.5px solid #0c0d10;">8</span></div><div class="scattered-icon" style="position: absolute; left: 202px; top: 20px; z-index: 10; width: 50px; height: 50px; border-radius: 12px; background: #131418; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.65); display: flex; align-items: center; justify-content: center; transform: rotate(5deg);"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="#F24E1E" d="M8.5 12A3.5 3.5 0 0 0 5 8.5 3.5 3.5 0 0 0 8.5 5H12v7H8.5z"/><path fill="#FF7262" d="M15.5 5A3.5 3.5 0 0 1 19 8.5a3.5 3.5 0 0 1-3.5 3.5H12V5h3.5z"/><path fill="#1ABCFE" d="M12 12h3.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5H12v-7z"/><path fill="#0ACF83" d="M8.5 19a3.5 3.5 0 0 1-3.5-3.5A3.5 3.5 0 0 1 8.5 12H12v3.5a3.5 3.5 0 0 1-3.5 3.5z"/><path fill="#A259FF" d="M8.5 12A3.5 3.5 0 0 1 5 8.5 3.5 3.5 0 0 1 8.5 5H12v7H8.5z"/></svg></div><div class="scattered-icon" style="position: absolute; left: 20px; top: 98px; z-index: 20; width: 58px; height: 58px; border-radius: 13px; background: #18191f; border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; transform: rotate(-4deg);"><svg width="25" height="25" viewBox="0 0 24 24" fill="#ffffff"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.213.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.886-.793-.84l-15.083.886c-.56.047-.793.327-.793.888zm13.95 1.167c.094.42 0 .84-.42.887l-.746.14v9.611c-.56.327-1.12.513-1.633.513-.84 0-.98-.28-1.587-1.027l-5.086-7.98v7.467l1.493.327c.093.047.14.42.046.793l-3.36.187c-.093-.374 0-.794.373-.84l.887-.234V8.828L9.08 8.688c-.093-.42.093-.747.513-.794l3.78-.233 5.32 8.167V8.502l-1.306-.14c-.094-.42.093-.794.513-.84z"/></svg><span class="badge-pill" style="position: absolute; top: -5px; right: -5px; border-radius: 9999px; background: #ef4444; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5); border: 1.5px solid #0c0d10;">7</span></div><div class="scattered-icon" style="position: absolute; left: 86px; top: 82px; z-index: 22; width: 66px; height: 66px; border-radius: 15px; background: #0b5cff; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 12px 28px rgba(11, 92, 255, 0.35); display: flex; align-items: center; justify-content: center; transform: rotate(2deg);"><svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff"><path d="M16 16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v8zm5.5-8.5l-4.5 3.37v2.26l4.5 3.37c.3.23.5.01.5-.37V7.87c0-.38-.2-.6-.5-.37z"/></svg><span class="badge-pill" style="position: absolute; top: -5px; right: -5px; border-radius: 9999px; background: #ef4444; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5); border: 1.5px solid #0c0d10;">3</span></div><div class="scattered-icon" style="position: absolute; left: 158px; top: 76px; z-index: 25; width: 70px; height: 70px; border-radius: 17px; background: #ffffff; border: 1px solid rgba(255, 255, 255, 0.25); box-shadow: 0 14px 30px rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; transform: rotate(-3deg);"><svg width="32" height="32" viewBox="0 0 24 24"><path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"/><path fill="#E01E5A" d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/><path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z"/><path fill="#36C5F0" d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/><path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z"/><path fill="#2EB67D" d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/><path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z"/><path fill="#ECB22E" d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg><span class="badge-pill" style="position: absolute; top: -6px; right: -6px; border-radius: 9999px; background: #ef4444; padding: 2px 7px; font-family: monospace; font-size: 10px; font-weight: bold; color: #ffffff; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.6); border: 1.5px solid #0c0d10;">19</span></div><div class="scattered-icon" style="position: absolute; left: 236px; top: 72px; z-index: 18; width: 54px; height: 54px; border-radius: 12px; background: #4b53bc; border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; transform: rotate(4deg);"><svg width="25" height="25" viewBox="0 0 24 24" fill="#ffffff"><path d="M19.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-1 2h2c1.1 0 2 .9 2 2v2.5c0 .3-.2.5-.5.5h-3.5v-5zm-6-3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-3.5 3h7c1.4 0 2.5 1.1 2.5 2.5v5.5H6.5V12c0-1.4 1.1-2.5 2.5-2.5zm-5 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-1 2h2c.8 0 1.5.7 1.5 1.5v3.5H3V14c0-.8.7-1.5 1.5-1.5z"/></svg><span class="badge-pill" style="position: absolute; top: -5px; right: -5px; border-radius: 9999px; background: #ef4444; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5); border: 1.5px solid #0c0d10;">15</span></div><div class="scattered-icon" style="position: absolute; left: 120px; top: 128px; z-index: 26; width: 60px; height: 60px; border-radius: 14px; background: #25D366; border: 1px solid rgba(255, 255, 255, 0.28); box-shadow: 0 12px 28px rgba(37, 211, 102, 0.42), 0 8px 20px rgba(0, 0, 0, 0.65); display: flex; align-items: center; justify-content: center; transform: rotate(-3deg);"><svg width="30" height="30" viewBox="0 0 24 24" fill="#ffffff"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg><span class="badge-pill" style="position: absolute; top: -5px; right: -5px; border-radius: 9999px; background: #ef4444; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #ffffff; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5); border: 1.5px solid #0c0d10;">24</span></div></div></div><div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 240px; padding: 12px 0;"><div class="kl-radial-aura" style="position: absolute; width: 230px; height: 230px; border-radius: 9999px; background: radial-gradient(circle, rgba(16, 185, 129, 0.26) 0%, rgba(5, 150, 105, 0.14) 45%, rgba(16, 185, 129, 0.02) 70%, transparent 85%); pointer-events: none; z-index: 0;"></div><div style="position: relative; display: flex; flex-direction: column; align-items: center;"><div class="kl-particles-wrapper" aria-hidden="true" style="position: absolute; top: 0; left: 50%; width: 124px; height: 124px; transform: translateX(-50%); pointer-events: none; z-index: 1;"><span class="kl-particle" style="--p-dx: -16px; --p-dy: -52px; --p-dur: 4.2s; --p-del: 0s; --p-max-op: 0.55; left: 32px; bottom: 30px;"></span><span class="kl-particle" style="--p-dx: 18px; --p-dy: -58px; --p-dur: 4.8s; --p-del: 0.9s; --p-max-op: 0.5; left: 88px; bottom: 25px;"></span><span class="kl-particle" style="--p-dx: -8px; --p-dy: -62px; --p-dur: 4.4s; --p-del: 1.8s; --p-max-op: 0.6; left: 58px; bottom: 20px;"></span><span class="kl-particle" style="--p-dx: -24px; --p-dy: -46px; --p-dur: 5.1s; --p-del: 2.7s; --p-max-op: 0.45; left: 24px; bottom: 42px;"></span><span class="kl-particle" style="--p-dx: 14px; --p-dy: -50px; --p-dur: 3.9s; --p-del: 1.4s; --p-max-op: 0.55; left: 95px; bottom: 36px;"></span><span class="kl-particle" style="--p-dx: 6px; --p-dy: -58px; --p-dur: 4.6s; --p-del: 3.3s; --p-max-op: 0.5; left: 68px; bottom: 45px;"></span></div><svg class="sparkle-star" style="position: absolute; top: -10px; right: -14px; width: 24px; height: 24px; color: #5ee9b5; filter: drop-shadow(0 0 10px rgba(94, 233, 181, 0.95)); z-index: 20; pointer-events: none;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z"/></svg><svg class="sparkle-star" style="position: absolute; top: 18px; right: -32px; width: 16px; height: 16px; color: rgba(255, 255, 255, 0.85); filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.85)); z-index: 20; pointer-events: none;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z"/></svg><div class="karyalaya-dest-icon" style="width: 124px; height: 124px; border-radius: 28px; border: 2px solid rgba(16, 185, 129, 0.45); background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.22), transparent 70%), linear-gradient(145deg, #1c1e24, #0c0d11); box-shadow: 0 0 50px rgba(16, 185, 129, 0.25), 0 20px 40px rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; z-index: 2;"><div class="kl-sweep-track" aria-hidden="true" style="position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 26px; z-index: 1;"><div class="kl-light-sweep"></div></div><img src="/images/karyalaya-logo-mark.png" alt="KaryaLaya" style="position: relative; z-index: 2; width: 68px; height: 68px; object-fit: contain; filter: drop-shadow(0 0 18px rgba(16, 185, 129, 0.5)); pointer-events: none;" /></div><div style="margin-top: 16px; display: flex; align-items: center; gap: 8px;"><span style="width: 7px; height: 7px; border-radius: 9999px; background: #34d399; box-shadow: 0 0 8px rgba(52, 211, 153, 0.9); display: inline-block;"></span><span style="font-family: monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(52, 211, 153, 0.95);">KaryaLaya Operating System</span></div></div></div></div></div><div style="padding: 20px 24px 32px; border-top: 1px solid rgba(255, 255, 255, 0.08);"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 36px;"><div style="display: flex; flex-direction: column;"><div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;"><div style="height: 1px; flex: 1; background: rgba(255, 255, 255, 0.08);"></div><span style="padding: 4px 18px; border-radius: 9999px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.14); font-size: 11.5px; font-family: monospace; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255, 255, 255, 0.75); font-weight: 600;">BEFORE</span><div style="height: 1px; flex: 1; background: rgba(255, 255, 255, 0.08);"></div></div><ul style="display: flex; flex-direction: column; gap: 16px; list-style: none; padding: 0; margin: 0;"><li class="before-item" style="display: flex; align-items: center; gap: 14px; color: rgba(255, 255, 255, 0.75); font-size: 16px; font-weight: 500; line-height: 1.5;"><span style="display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; font-size: 12px; font-weight: bold; line-height: 1;">✕</span><span style="text-decoration: underline; text-decoration-color: rgba(255, 255, 255, 0.22); text-underline-offset: 4px;">Scattered conversations</span></li><li class="before-item" style="display: flex; align-items: center; gap: 14px; color: rgba(255, 255, 255, 0.75); font-size: 16px; font-weight: 500; line-height: 1.5;"><span style="display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; font-size: 12px; font-weight: bold; line-height: 1;">✕</span><span style="text-decoration: underline; text-decoration-color: rgba(255, 255, 255, 0.22); text-underline-offset: 4px;">Decisions get lost</span></li><li class="before-item" style="display: flex; align-items: center; gap: 14px; color: rgba(255, 255, 255, 0.75); font-size: 16px; font-weight: 500; line-height: 1.5;"><span style="display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; font-size: 12px; font-weight: bold; line-height: 1;">✕</span><span style="text-decoration: underline; text-decoration-color: rgba(255, 255, 255, 0.22); text-underline-offset: 4px;">Constant app switching</span></li><li class="before-item" style="display: flex; align-items: center; gap: 14px; color: rgba(255, 255, 255, 0.75); font-size: 16px; font-weight: 500; line-height: 1.5;"><span style="display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; font-size: 12px; font-weight: bold; line-height: 1;">✕</span><span style="text-decoration: underline; text-decoration-color: rgba(255, 255, 255, 0.22); text-underline-offset: 4px;">Deadlines slip through</span></li></ul></div><div style="display: flex; flex-direction: column;"><div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;"><div style="height: 1px; flex: 1; background: rgba(16, 185, 129, 0.25);"></div><span style="padding: 4px 18px; border-radius: 9999px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.38); font-size: 11.5px; font-family: monospace; letter-spacing: 0.16em; text-transform: uppercase; color: #34d399; font-weight: 600; box-shadow: 0 0 14px rgba(16, 185, 129, 0.22);">AFTER</span><div style="height: 1px; flex: 1; background: rgba(16, 185, 129, 0.25);"></div></div><ul style="display: flex; flex-direction: column; gap: 16px; list-style: none; padding: 0; margin: 0;"><li class="after-item" style="display: flex; align-items: center; gap: 14px; color: #ffffff; font-size: 16px; font-weight: 500; line-height: 1.5;"><span style="display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 12px; font-weight: bold; line-height: 1; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);">✓</span><span style="text-decoration: underline; text-decoration-color: rgba(16, 185, 129, 0.4); text-underline-offset: 4px;">Projects, tasks, and chats in one workspace</span></li><li class="after-item" style="display: flex; align-items: center; gap: 14px; color: #ffffff; font-size: 16px; font-weight: 500; line-height: 1.5;"><span style="display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 12px; font-weight: bold; line-height: 1; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);">✓</span><span style="text-decoration: underline; text-decoration-color: rgba(16, 185, 129, 0.4); text-underline-offset: 4px;">Every decision stays connected</span></li><li class="after-item" style="display: flex; align-items: center; gap: 14px; color: #ffffff; font-size: 16px; font-weight: 500; line-height: 1.5;"><span style="display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 12px; font-weight: bold; line-height: 1; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);">✓</span><span style="text-decoration: underline; text-decoration-color: rgba(16, 185, 129, 0.4); text-underline-offset: 4px;">Teams work in sync</span></li><li class="after-item" style="display: flex; align-items: center; gap: 14px; color: #ffffff; font-size: 16px; font-weight: 500; line-height: 1.5;"><span style="display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 12px; font-weight: bold; line-height: 1; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);">✓</span><span style="text-decoration: underline; text-decoration-color: rgba(16, 185, 129, 0.4); text-underline-offset: 4px;">Every deadline stays visible</span></li></ul></div></div></div></div><span aria-hidden="true" class="pointer-events-none absolute left-[1.125rem] top-0 h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-slate-300/0 via-slate-200/90 to-slate-300/0"></span></div></div><span aria-hidden="true" class="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-slate-300/0 via-slate-200/90 to-slate-300/0 transition-all duration-500 group-hover:w-full"></span></article>`;

const emptySubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function HowItWorksSection() {
  const mounted = useMounted();
  const containerRef = useRef<HTMLDivElement>(null);

  useGsapContext(
    () => {
      if (!mounted || !containerRef.current) return;
      if (getReducedMotion()) return;

      const el = containerRef.current;
      const section = el.querySelector<HTMLElement>("#how-it-works");
      const line1 = el.querySelector<HTMLElement>(".sec3-line-1");
      const line2 = el.querySelector<HTMLElement>(".sec3-line-2");

      if (!section || !line1 || !line2) return;

      const lines = [line1, line2];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom top",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        lines,
        {
          x: -60,
          opacity: 0,
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
        }
      );

      const beforeAfterPanel = el.querySelector<HTMLElement>(".before-after-panel");
      if (beforeAfterPanel) {
        const clusterIcons = beforeAfterPanel.querySelectorAll<HTMLElement>(".scattered-icon");
        const badges = beforeAfterPanel.querySelectorAll<HTMLElement>(".badge-pill");
        const karyaIcon = beforeAfterPanel.querySelector<HTMLElement>(".karyalaya-dest-icon");
        const sparkles = beforeAfterPanel.querySelectorAll<HTMLElement>(".sparkle-star");

        // Initial entrance timeline
        const tlPanel = gsap.timeline({
          scrollTrigger: {
            trigger: beforeAfterPanel,
            start: "top 85%",
            end: "bottom top",
            toggleActions: "play none none reverse",
          },
        });

        tlPanel
          .from(
            clusterIcons,
            {
              scale: 0.82,
              x: (i) => [-24, 20, -16, 22, -18, 16, -12, 18, 15, -14][i % 10],
              y: (i) => [14, -18, 22, -14, 18, -22, 12, -10, 16, -15][i % 10],
              duration: 0.7,
              stagger: 0.03,
              ease: "power2.out",
            }
          )
          .from(
            badges,
            { scale: 0, opacity: 0, duration: 0.35, stagger: 0.02, ease: "back.out(2)" },
            "-=0.3"
          )
          .from(
            karyaIcon,
            { scale: 0.88, duration: 0.6, ease: "back.out(1.4)" },
            "-=0.4"
          )
          .from(
            sparkles,
            { scale: 0, rotate: -30, opacity: 0, duration: 0.4, stagger: 0.08, ease: "back.out(2)" },
            "-=0.2"
          );

        // Continuous animations for the scattered icons cluster ONLY
        const continuousTweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];

        // 1. Floating motion + gentle rotation + subtle depth shadows
        const floatParams = [
          { y: -5, rot: 1.5, dur: 2.8, delay: 0.2 },
          { y: -6, rot: 2.5, dur: 3.1, delay: 0.5 },
          { y: 5, rot: -2.0, dur: 3.5, delay: 0.1 },
          { y: -5, rot: 2.0, dur: 2.9, delay: 0.8 },
          { y: 6, rot: -2.5, dur: 3.3, delay: 0.3 },
          { y: 6, rot: 2.2, dur: 3.8, delay: 0.6 },
          { y: -7, rot: -2.5, dur: 3.0, delay: 0.0 },
          { y: 5, rot: 2.8, dur: 3.6, delay: 0.4 },
          { y: -6, rot: -2.2, dur: 3.2, delay: 0.7 },
          { y: 6, rot: -1.8, dur: 3.4, delay: 0.35 },
        ];

        clusterIcons.forEach((icon, i) => {
          const p = floatParams[i % floatParams.length];

          const floatTween = gsap.to(icon, {
            y: `+=${p.y}`,
            duration: p.dur,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: p.delay,
          });
          continuousTweens.push(floatTween);

          if (p.rot) {
            const rotTween = gsap.to(icon, {
              rotation: `+=${p.rot}`,
              duration: p.dur * 1.15,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              delay: p.delay + 0.3,
            });
            continuousTweens.push(rotTween);
          }
        });

        // 2. Notification badges: Soft, staggered, independent pulsing
        const badgeDelays = [0.2, 2.8, 1.4, 4.1, 0.9, 3.3, 2.1];
        const badgeDurations = [0.75, 0.85, 0.7, 0.8, 0.7, 0.8, 0.75];
        const badgePauses = [3.8, 4.6, 5.2, 3.5, 4.9, 4.2, 5.5];

        badges.forEach((badge, idx) => {
          const pause = badgePauses[idx % badgePauses.length];
          const dur = badgeDurations[idx % badgeDurations.length];
          const d = badgeDelays[idx % badgeDelays.length];

          const badgeTween = gsap.to(badge, {
            scale: 1.16,
            boxShadow: "0 2px 10px rgba(239, 68, 68, 0.75)",
            duration: dur,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            repeatDelay: pause,
            delay: d,
          });
          continuousTweens.push(badgeTween);
        });

        // 3. Occasional app interactions every 5–8 seconds
        const interactionTl = gsap.timeline({
          repeat: -1,
          repeatDelay: 1.5,
        });

        const slackIcon = clusterIcons[7];
        if (slackIcon) {
          interactionTl.to(
            slackIcon,
            {
              y: "-=8",
              scale: 1.05,
              rotation: "+=2.5",
              boxShadow: "0 18px 36px rgba(0,0,0,0.85)",
              duration: 0.5,
              ease: "power2.out",
            },
            2.0
          ).to(
            slackIcon,
            {
              y: "+=8",
              scale: 1,
              rotation: "-=2.5",
              boxShadow: "0 14px 30px rgba(0,0,0,0.8)",
              duration: 0.7,
              ease: "power2.inOut",
            },
            "+=0.4"
          );
        }

        const notionIcon = clusterIcons[5];
        if (notionIcon) {
          interactionTl.to(
            notionIcon,
            {
              y: "-=7",
              scale: 1.04,
              rotation: "-=2",
              boxShadow: "0 16px 28px rgba(0,0,0,0.75)",
              duration: 0.45,
              ease: "power2.out",
            },
            6.5
          ).to(
            notionIcon,
            {
              y: "+=7",
              scale: 1,
              rotation: "+=2",
              boxShadow: "0 12px 24px rgba(0,0,0,0.7)",
              duration: 0.65,
              ease: "power2.inOut",
            },
            "+=0.3"
          );
        }

        const zoomIcon = clusterIcons[6];
        if (zoomIcon) {
          interactionTl.to(
            zoomIcon,
            {
              y: "-=8",
              scale: 1.05,
              boxShadow: "0 16px 34px rgba(11,92,255,0.45)",
              duration: 0.5,
              ease: "power2.out",
            },
            11.0
          ).to(
            zoomIcon,
            {
              y: "+=8",
              scale: 1,
              boxShadow: "0 12px 28px rgba(11,92,255,0.35)",
              duration: 0.7,
              ease: "power2.inOut",
            },
            "+=0.4"
          );
        }

        const teamsIcon = clusterIcons[8];
        if (teamsIcon) {
          interactionTl.to(
            teamsIcon,
            {
              y: "-=6",
              scale: 1.04,
              rotation: "+=2",
              boxShadow: "0 14px 28px rgba(0,0,0,0.7)",
              duration: 0.45,
              ease: "power2.out",
            },
            15.5
          ).to(
            teamsIcon,
            {
              y: "+=6",
              scale: 1,
              rotation: "-=2",
              boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
              duration: 0.65,
              ease: "power2.inOut",
            },
            "+=0.3"
          );
        }

        continuousTweens.push(interactionTl);

        // Pause animations when off-screen for maximum performance
        ScrollTrigger.create({
          trigger: beforeAfterPanel,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => continuousTweens.forEach((t) => t.play()),
          onLeave: () => continuousTweens.forEach((t) => t.pause()),
          onEnterBack: () => continuousTweens.forEach((t) => t.play()),
          onLeaveBack: () => continuousTweens.forEach((t) => t.pause()),
        });
      }
    },
    containerRef,
    [mounted]
  );

  return (
    <div ref={containerRef} suppressHydrationWarning>
      <section id="how-it-works" className="relative overflow-hidden py-24 lg:py-32">
        <div className="relative mx-auto max-w-[1400px] px-[15px] lg:px-14">
          <div className="mx-0 lg:mx-5">
            <h2
              className="font-display tracking-tight"
              style={{
                fontSize: "clamp(44px, 5.2vw, 72px)",
                lineHeight: 1.05,
                letterSpacing: "-0.065em",
                wordSpacing: "0.18em",
              }}
            >
              <span className="sec3-line-1 block text-foreground will-change-transform">
                Stay in control of your work.
              </span>
              <span className="sec3-line-2 mt-2 block text-muted-foreground lg:mt-3.5 will-change-transform">
                Keep your team and clients connected.
              </span>
            </h2>
          </div>
          <div
            className="mx-0 flex flex-col overflow-hidden rounded-xl border border-white/[0.12] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.055),transparent_70%),linear-gradient(#0a0a0c,#070708)] transition-all delay-300 duration-1000 lg:mx-5 translate-y-0 opacity-100"
            style={{ marginTop: "clamp(3rem, 5vw, 4.5rem)" }}
          >
            {/* Article 1: Connected Team Workflow */}
            <div
              style={{ display: "contents" }}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: mounted ? S2_ART1_HTML : "" }}
            />
            {/* Article 2: Before vs After */}
            <div
              style={{ display: "contents" }}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: mounted ? S2_ART2_HTML : "" }}
            />
            {/* Article 3: Rebuilt KaryaLaya Agent Inbox Section */}
            <InboxSection />
          </div>
        </div>
      </section>
    </div>
  );
}


export { InsightsSection } from "./InsightsSection";

export { CtaSection } from "./CtaSection";
export { KaryaLayaFooter, KaryaLayaFooter as QronosFooter } from "./KaryaLayaFooter";
