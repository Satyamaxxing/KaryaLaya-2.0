"use client";

import React from "react";
import { useWorkState } from "@/lib/state/work-state-context";
import { WhyPanel } from "@/components/work-os/WhyPanel";

export default function AIIntelligencePage() {
  const { aiInsight, aiRecommendation, approveAIRecommendation, rejectAIRecommendation, project } =
    useWorkState();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span>✨</span> Work Intelligence Layer (PRD §28)
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AI Graph Reasoning & Grounded Insights
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            AI reasons over the work graph (people, dependencies, deadlines) and proposes
            human-gated actions.
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono">
          Model: Grounded Deterministic Analyzer
        </div>
      </div>

      {/* Main Explainable WhyPanel */}
      <WhyPanel
        insight={aiInsight}
        recommendation={aiRecommendation}
        onApprovePlan={approveAIRecommendation}
        onRejectPlan={rejectAIRecommendation}
      />

      {/* Architectural Contract Note */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-400">
        <h3 className="font-semibold text-white text-sm">
          Governance & Traceability Rule (PRD §32)
        </h3>
        <p className="leading-relaxed">
          In KaryaLaya 2.0, <strong>AI proposal ≠ automation execution</strong>. The AI understands
          work graph bottlenecks and formulates typed action plans with confidence scores. High-tier
          changes require explicit human sign-off, which then routes through the governed Automation
          Engine.
        </p>
      </div>
    </div>
  );
}
