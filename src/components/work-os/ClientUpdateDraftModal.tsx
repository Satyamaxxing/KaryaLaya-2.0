"use client";

import React, { useState, useEffect } from "react";
import { ClientUpdateDraft } from "@/server/ai/types";

interface ClientUpdateDraftModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onPostAsComment?: (text: string) => Promise<void>;
}

export function ClientUpdateDraftModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  onPostAsComment,
}: ClientUpdateDraftModalProps) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<ClientUpdateDraft | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      setSentSuccess(false);
      try {
        const res = await fetch("/api/ai/client-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });

        if (!active) return;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to generate client update draft");
        }

        const data = await res.json();
        if (active && data.result?.data) {
          const d: ClientUpdateDraft = data.result.data;
          setDraft(d);
          setSubject(d.subject);
          setBody(d.body);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error generating draft");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePost = async () => {
    if (!onPostAsComment || !body) return;
    setSending(true);
    try {
      await onPostAsComment(body);
      setSentSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to post update comment");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/40 font-bold uppercase tracking-wider">
                🤖 Scoped AI · Client Draft
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Never auto-sent</span>
            </div>
            <h2 className="text-base font-bold text-white">Client Progress Update Draft</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Project: {projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs" style={{ WebkitOverflowScrolling: "touch" }}>
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 font-mono text-xs">
                Analyzing client-visible milestones & drafting update...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300">
              <span className="font-semibold block mb-1">Could not generate update</span>
              <span>{error}</span>
            </div>
          )}

          {sentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 flex items-center gap-2">
              <span>✓</span>
              <span>Update posted to client discussion feed!</span>
            </div>
          )}

          {!loading && draft && (
            <>
              {/* Client Safety Badge */}
              <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                <span className="text-emerald-400">🛡️</span>
                <span>{draft.clientSafeNotice}</span>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Email / Message Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Message Body (Edit before sending)
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {body.length} characters
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Highlights Summary */}
              {draft.completedHighlights.length > 0 && (
                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-850 space-y-1">
                  <span className="text-[10px] font-semibold uppercase text-zinc-500 font-mono">
                    Referenced Completed Milestones
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {draft.completedHighlights.map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-[11px]"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">Human review required before sharing.</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!draft || loading}
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              {copied ? "✓ Copied" : "Copy Draft"}
            </button>
            {onPostAsComment && (
              <button
                type="button"
                disabled={!draft || loading || sending}
                onClick={handlePost}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-400 text-black transition-colors flex items-center gap-1.5"
              >
                {sending ? "Posting..." : "Post to Client Discussion"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
