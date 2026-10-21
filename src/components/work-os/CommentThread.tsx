"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ThreadSummary } from "@/server/ai/types";

export interface CommentItem {
  id: string;
  authorId: string;
  authorType: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  visibility: "INTERNAL" | "CLIENT_VISIBLE";
  mentions?: string | null;
  createdAt: string;
}

interface CommentThreadProps {
  projectId?: string;
  deliverableId?: string;
  taskId?: string;
  title?: string;
  canPost?: boolean;
}

export function CommentThread({
  projectId,
  deliverableId,
  taskId,
  title = "Discussion & Updates",
  canPost = true,
}: CommentThreadProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"INTERNAL" | "CLIENT_VISIBLE">("INTERNAL");
  const [showVisibilityWarning, setShowVisibilityWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Thread Summary state
  const [threadSummary, setThreadSummary] = useState<ThreadSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleSummarizeThread = async () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    if (threadSummary) {
      setShowSummary(true);
      return;
    }

    setSummarizing(true);
    try {
      const entityType = projectId ? "PROJECT" : deliverableId ? "DELIVERABLE" : "TASK";
      const entityId = projectId || deliverableId || taskId || "";

      const res = await fetch("/api/ai/thread-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result?.data) {
          setThreadSummary(data.result.data);
          setShowSummary(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setSummarizing(false);
    }
  };

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      if (deliverableId) params.set("deliverableId", deliverableId);
      if (taskId) params.set("taskId", taskId);

      const res = await fetch(`/api/comments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err: any) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, deliverableId, taskId]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      await fetchComments();
      try {
        const dRes = await fetch("/api/dashboard");
        if (dRes.ok && active) {
          const dData = await dRes.json();
          if (dData.workload) {
            setTeamMembers(
              dData.workload.map((m: any) => ({
                id: m.userId,
                name: m.name,
                role: m.role || "MEMBER",
              }))
            );
          }
        }
      } catch {
        // Fallback
      }
    }

    loadData();

    // Live update short polling
    const interval = setInterval(() => {
      if (active) fetchComments();
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchComments]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Check if cursor is right after an '@'
    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const match = textBefore.match(/@([a-zA-Z0-9_]*)$/);

    if (match) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (memberName: string) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBefore = content.slice(0, cursorPos);
    const textAfter = content.slice(cursorPos);

    const match = textBefore.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      const prefix = textBefore.slice(0, match.index);
      const newText = `${prefix}@${memberName} ${textAfter}`;
      setContent(newText);
      setMentionQuery(null);
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = (prefix + `@${memberName} `).length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleVisibilityChange = (newVal: "INTERNAL" | "CLIENT_VISIBLE") => {
    if (newVal === "CLIENT_VISIBLE") {
      setShowVisibilityWarning(true);
    } else {
      setShowVisibilityWarning(false);
    }
    setVisibility(newVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          deliverableId,
          taskId,
          content: content.trim(),
          visibility,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }

      setContent("");
      setShowVisibilityWarning(false);
      await fetchComments();
    } catch (err: any) {
      setError(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = mentionQuery !== null
    ? teamMembers.filter((m) => m.name.toLowerCase().includes(mentionQuery))
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{title}</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {comments.length}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px]">
          {comments.length >= 2 && (
            <button
              type="button"
              onClick={handleSummarizeThread}
              disabled={summarizing}
              className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-medium text-sky-400 border border-zinc-700/60 flex items-center gap-1 transition-colors"
            >
              <span>🤖</span>
              <span>{summarizing ? "Summarizing..." : showSummary ? "Hide AI Summary" : "AI Thread Summary"}</span>
            </button>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-500">Live synced</span>
        </div>
      </div>

      {/* AI Thread Summary Panel */}
      {showSummary && threadSummary && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-sky-900/50 shadow-lg space-y-3 animate-in fade-in duration-150 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-sky-400 flex items-center gap-1">
              <span>🤖</span> Scoped AI Thread Summary · {threadSummary.totalCommentsAnalyzed} messages
            </span>
            <button
              onClick={() => setShowSummary(false)}
              className="text-zinc-500 hover:text-zinc-300 text-[11px]"
            >
              ✕
            </button>
          </div>

          <p className="text-zinc-300 text-[11px] leading-relaxed">
            {threadSummary.discussionSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            {/* Decisions */}
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/30 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">
                Key Decisions
              </span>
              <ul className="space-y-0.5 text-[11px] text-zinc-300">
                {threadSummary.keyDecisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-emerald-500">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions */}
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/30 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block">
                Open Questions
              </span>
              <ul className="space-y-0.5 text-[11px] text-zinc-300">
                {threadSummary.openQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-amber-500">?</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/30 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-sky-400 block">
                Action Items
              </span>
              <ul className="space-y-0.5 text-[11px] text-zinc-300">
                {threadSummary.actionItems.map((a, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-sky-500">→</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {loading && comments.length === 0 ? (
          <div className="space-y-2 py-4">
            <div className="h-14 bg-zinc-900/60 rounded-xl animate-pulse" />
            <div className="h-14 bg-zinc-900/60 rounded-xl animate-pulse" />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-6 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl space-y-1">
            <div className="text-zinc-500 text-lg">💬</div>
            <p className="text-xs text-zinc-400">No comments yet. Start the conversation!</p>
            <p className="text-[11px] text-zinc-500">Use @name to notify specific teammates.</p>
          </div>
        ) : (
          comments.map((c) => {
            const isClientVisible = c.visibility === "CLIENT_VISIBLE";

            return (
              <div
                key={c.id}
                className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                  isClientVisible
                    ? "bg-zinc-900/90 border-emerald-900/40 shadow-emerald-950/20 shadow-sm"
                    : "bg-zinc-900/70 border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{c.authorName}</span>
                    {c.authorType === "CLIENT_CONTACT" && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                        CLIENT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Clear UI Visibility Badge */}
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                        isClientVisible
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {isClientVisible ? "CLIENT VISIBLE" : "INTERNAL"}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {/* Highlight mentions */}
                  {c.content.split(/(@[a-zA-Z0-9_\s]{2,25}\b)/g).map((chunk, idx) => {
                    if (chunk.startsWith("@")) {
                      return (
                        <span
                          key={idx}
                          className="font-semibold text-sky-400 bg-sky-950/60 px-1 py-0.5 rounded border border-sky-800/40"
                        >
                          {chunk}
                        </span>
                      );
                    }
                    return chunk;
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Comment Input */}
      {canPost && (
        <form onSubmit={handleSubmit} className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3 relative">
          {/* Autocomplete Popup */}
          {mentionQuery !== null && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-64 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-20 space-y-1">
              <div className="text-[10px] uppercase font-mono text-zinc-400 px-2 py-1">
                Mention Team Member
              </div>
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => insertMention(m.name)}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-zinc-800 flex items-center justify-between text-zinc-200"
                >
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{m.role}</span>
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={2}
            value={content}
            onChange={handleTextChange}
            placeholder="Type comment or feedback... Type @ to mention teammates"
            className="w-full p-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
          />

          {/* Explicit action warning for CLIENT_VISIBLE */}
          {showVisibilityWarning && (
            <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-center gap-2 text-xs text-amber-200">
              <span>⚠️</span>
              <span>
                <strong>Client Visible Mode:</strong> This comment will appear on the Client Portal for external stakeholders.
              </span>
            </div>
          )}

          {error && <div className="text-xs text-rose-400">{error}</div>}

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-zinc-400">Visibility:</label>
              <select
                value={visibility}
                onChange={(e) => handleVisibilityChange(e.target.value as any)}
                className={`px-2.5 py-1 text-xs rounded border font-medium focus:outline-none ${
                  visibility === "CLIENT_VISIBLE"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                    : "bg-zinc-950 text-zinc-300 border-zinc-800"
                }`}
              >
                <option value="INTERNAL">INTERNAL (Team Only)</option>
                <option value="CLIENT_VISIBLE">CLIENT_VISIBLE (Portal)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
