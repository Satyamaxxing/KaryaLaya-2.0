"use client";

import React, { useState } from "react";
import { AIInsight, AIRecommendation } from "@/types/work-os";

interface WhyPanelProps {
  insight: AIInsight;
  recommendation?: AIRecommendation;
  onApprovePlan?: () => void;
  onRejectPlan?: (reason: string) => void;
}

export function WhyPanel({ insight, recommendation, onApprovePlan, onRejectPlan }: WhyPanelProps) {
  const [level, setLevel] = useState<1 | 2 | 3>(2);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isExecuted = recommendation?.status === "EXECUTED";

  return (
    <div className="bg-gradient-to-b from-indigo-950/40 via-zinc-900/90 to-zinc-950 border border-indigo-500/30 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 text-sm">
            ✨
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              Work Intelligence Layer
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                Confidence: {insight.confidence}
              </span>
            </div>
            <h3 className="text-base font-medium text-white mt-0.5">
              {insight.status === "RESOLVED" ? insight.resolvedStatement : insight.statement}
            </h3>
          </div>
        </div>

        {/* Level Selector Tabs */}
        <div className="flex flex-wrap items-center bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setLevel(1)}
            className={`px-2.5 py-1 rounded transition-colors ${
              level === 1
                ? "bg-indigo-600 text-white font-medium shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Summary (L1)
          </button>
          <button
            onClick={() => setLevel(2)}
            className={`px-2.5 py-1 rounded transition-colors ${
              level === 2
                ? "bg-indigo-600 text-white font-medium shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Causal Chain (L2)
          </button>
          <button
            onClick={() => setLevel(3)}
            className={`px-2.5 py-1 rounded transition-colors ${
              level === 3
                ? "bg-indigo-600 text-white font-medium shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Evidence (L3)
          </button>
        </div>
      </div>

      {/* Body per Level */}
      <div className="py-4 space-y-3 text-sm">
        {level === 1 && (
          <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-zinc-300 leading-relaxed">
            <p className="font-medium text-white mb-1">Grounded Analysis:</p>
            {insight.explanationLevel1}
          </div>
        )}

        {level === 2 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Causal Graph Traversal (Why this matters):
            </div>
            <div className="space-y-2">
              {insight.explanationLevel2.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg text-xs text-zinc-200"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-900/50 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-300 shrink-0 font-mono mt-0.5">
                    {idx + 1}
                  </div>
                  <div>{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {level === 3 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Verified Entity Grounding (No hallucinations):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {insight.evidence.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="uppercase tracking-wider font-mono text-indigo-400">
                      {ev.entityType}
                    </span>
                    <span className="font-mono text-zinc-500">{ev.entityId}</span>
                  </div>
                  <div className="font-medium text-white">{ev.label}</div>
                  <div className="text-zinc-400 text-[11px]">{ev.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendation & Action Plan (Governed Automation Flow) */}
      {recommendation && (
        <div className="mt-2 pt-4 border-t border-indigo-500/20 bg-indigo-950/20 -mx-5 -mb-5 p-5 rounded-b-xl">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Proposed Action Plan
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono">
                  Risk Tier: {recommendation.riskTier} (Requires Human Approval)
                </span>
              </div>
              <h4 className="text-base font-semibold text-white mt-1">{recommendation.headline}</h4>
              <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                {recommendation.rationale}
              </p>
            </div>
          </div>

          {/* Action Steps */}
          <div className="space-y-2 mb-4">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Actions to be executed by Governed Automation Engine upon approval:
            </div>
            <div className="space-y-1.5">
              {recommendation.proposedActions.map((act, i) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 text-[10px] flex items-center justify-center font-mono">
                      {i + 1}
                    </span>
                    <span className="text-zinc-200 font-medium">{act.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {act.targetEntityType}: {act.targetEntityId}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Human Decision Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-zinc-400 italic">
              {isExecuted ? (
                <span className="text-emerald-400 font-medium not-italic flex items-center gap-1.5">
                  ✓ Action Plan Approved & Executed by Rohan Varma (Manager)
                </span>
              ) : (
                "AI never executes without human approval (PRD §32)"
              )}
            </div>

            {!isExecuted && onApprovePlan && (
              <div className="flex flex-wrap items-center gap-2">
                {isRejecting ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => {
                        onRejectPlan?.(rejectReason);
                        setIsRejecting(false);
                      }}
                      className="px-2.5 py-1 text-xs bg-rose-600 text-white rounded hover:bg-rose-500"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="px-2 py-1 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setIsRejecting(true)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      Reject Plan
                    </button>
                    <button
                      onClick={onApprovePlan}
                      className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Approve & Execute via Automation
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
