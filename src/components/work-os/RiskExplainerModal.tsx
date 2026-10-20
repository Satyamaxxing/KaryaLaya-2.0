"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RiskReasoningExplainer } from "@/server/ai/types";

interface RiskExplainerModalProps {
  deliverableId: string;
  deliverableTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RiskExplainerModal({
  deliverableId,
  deliverableTitle,
  isOpen,
  onClose,
}: RiskExplainerModalProps) {
  const [loading, setLoading] = useState(false);
  const [explainer, setExplainer] = useState<RiskReasoningExplainer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/risk-explainer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliverableId }),
        });

        if (!active) return;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to analyze risk cause");
        }

        const data = await res.json();
        if (active && data.result?.data) {
          setExplainer(data.result.data);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error analyzing risk cause");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isOpen, deliverableId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>⚠️</span> Risk Causality Engine
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Real Dependency Chain</span>
            </div>
            <h2 className="text-base font-bold text-white">Why is this deliverable at risk?</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{deliverableTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 font-mono text-xs">
                Tracing real dependency graph and calculating delay propagation...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300">
              <span className="font-semibold block mb-1">Risk analysis unavailable</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && explainer && (
            <>
              {/* LEVEL 1: SUMMARY */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/30 space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase text-rose-400 tracking-wider">
                  Level 1 · Plain-Language Summary
                </div>
                <p className="text-sm text-zinc-100 font-medium leading-relaxed">
                  {explainer.level1Summary}
                </p>
              </div>

              {/* LEVEL 2: CAUSE CHAIN */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
                  Level 2 · Causality Progression Chain
                </div>
                <div className="space-y-2">
                  {explainer.level2CauseChain.map((step) => (
                    <div
                      key={step.step}
                      className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-850"
                    >
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-zinc-300 shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">{step.title}</span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {step.entityType}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LEVEL 3: EVIDENCE & REAL LINKS */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
                  Level 3 · Concrete Evidence & Entity Links
                </div>
                {explainer.level3Evidence.length === 0 ? (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500">
                    No individual task overdue; risk is projected based on deadline compression.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                    {explainer.level3Evidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-200">{ev.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              {ev.entityType} · {ev.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {ev.dueDate && `Target: ${new Date(ev.dueDate).toLocaleDateString()}`}
                            {ev.delayDays && (
                              <span className="text-rose-400 font-semibold ml-2">
                                ({ev.delayDays}d overdue)
                              </span>
                            )}
                            {ev.blockerTitle && (
                              <span className="text-amber-400 ml-2">
                                Blocked by: {ev.blockerTitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <Link
                          href={ev.linkUrl}
                          onClick={onClose}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sky-400 text-[11px] font-mono shrink-0"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MITIGATIONS */}
              {explainer.mitigationSuggestions && explainer.mitigationSuggestions.length > 0 && (
                <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/30 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-sky-400">
                    💡 Recommended Mitigations
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px]">
                    {explainer.mitigationSuggestions.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500">
            KaryaLaya Deterministic Risk Engine + Scoped AI
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
