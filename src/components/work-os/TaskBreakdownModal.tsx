"use client";

import React, { useState, useEffect } from "react";
import { TaskBreakdownSuggestion, SuggestedTaskItem } from "@/server/ai/types";

interface TaskBreakdownModalProps {
  deliverableId: string;
  deliverableTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated?: () => void;
}

export function TaskBreakdownModal({
  deliverableId,
  deliverableTitle,
  isOpen,
  onClose,
  onTasksCreated,
}: TaskBreakdownModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<TaskBreakdownSuggestion | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [aiOutputId, setAiOutputId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      setAppliedCount(null);
      try {
        const res = await fetch("/api/ai/task-breakdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliverableId }),
        });

        if (!active) return;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to suggest task breakdown");
        }

        const data = await res.json();
        if (active && data.result?.data) {
          const s: TaskBreakdownSuggestion = data.result.data;
          setSuggestion(s);
          setAiOutputId(data.result.outputId);
          // By default, select all suggested tasks for convenience
          setSelectedTaskIds(new Set(s.suggestedTasks.map((t) => t.tempId)));
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error generating tasks");
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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedTaskIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTaskIds(next);
  };

  const handleApply = async () => {
    if (!suggestion || !aiOutputId || selectedTaskIds.size === 0) return;
    setApplying(true);
    try {
      const selectedTasks = suggestion.suggestedTasks.filter((t) => selectedTaskIds.has(t.tempId));

      const res = await fetch("/api/ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiOutputId,
          actionPayload: {
            actionType: "CREATE_SUGGESTED_TASKS",
            deliverableId,
            tasks: selectedTasks.map((t) => ({
              title: t.title,
              description: t.description,
              priority: t.priority,
              estimateHours: t.estimateHours,
            })),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create tasks");
      }

      const resData = await res.json();
      setAppliedCount(resData.createdTasksCount || selectedTasks.length);
      onTasksCreated?.();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating approved tasks");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-bold uppercase tracking-wider">
                🤖 AI Task Breakdown
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Requires Human Approval</span>
            </div>
            <h2 className="text-base font-bold text-white">Suggested Subtasks Breakdown</h2>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 font-mono text-xs">
                Generating tactical task breakdown from deliverable scope...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300">
              <span className="font-semibold block mb-1">Could not generate breakdown</span>
              <span>{error}</span>
            </div>
          )}

          {appliedCount !== null && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 flex items-center gap-2 font-medium">
              <span>✓</span>
              <span>Successfully created {appliedCount} approved tasks in deliverable!</span>
            </div>
          )}

          {!loading && suggestion && appliedCount === null && (
            <>
              {/* Safety notice banner */}
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                <span>🛡️</span>
                <span>{suggestion.approvalNotice}</span>
              </div>

              {/* Task Checklist */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono px-1">
                  <span>SELECT TASKS TO APPROVE</span>
                  <span>{selectedTaskIds.size} of {suggestion.suggestedTasks.length} selected</span>
                </div>

                {suggestion.suggestedTasks.map((task) => {
                  const isChecked = selectedTaskIds.has(task.tempId);
                  return (
                    <div
                      key={task.tempId}
                      onClick={() => toggleSelect(task.tempId)}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? "bg-zinc-950 border-emerald-800/60"
                          : "bg-zinc-950/40 border-zinc-850 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(task.tempId)}
                        className="mt-0.5 rounded border-zinc-700 text-emerald-500 focus:ring-0"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white text-xs">{task.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {task.estimateHours}h · {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-zinc-400 text-[11px] leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!suggestion || loading || applying || selectedTaskIds.size === 0 || appliedCount !== null}
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {applying ? "Creating Tasks..." : `Approve & Create ${selectedTaskIds.size} Tasks`}
          </button>
        </div>
      </div>
    </div>
  );
}
