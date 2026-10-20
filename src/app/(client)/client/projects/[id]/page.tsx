"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface FileView {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version: number;
  signedDownloadUrl: string;
  signedPreviewUrl: string;
  createdAt: string;
}

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  serviceType: string;
  dueDate: string | null;
  status: string;
  plainStatus: string;
  progressPercent: number;
  files: FileView[];
  sentToClientAt: string | null;
}

interface Comment {
  id: string;
  authorName: string;
  authorType: string;
  content: string;
  deliverableId: string | null;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  actorName: string;
  actorType: string;
  action: string;
  description: string;
  createdAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  plainStatus: string;
  progressPercent: number;
  dueDate: string | null;
  startDate: string | null;
  clientLastViewedAt: string | null;
  agency: { name: string; slug: string };
  client: { id: string; name: string; companyName: string | null };
  deliverables: Deliverable[];
  pendingApprovals: Deliverable[];
  comments: Comment[];
  activity: ActivityItem[];
}

export default function ClientProjectPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction States
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [approvalNoteMap, setApprovalNoteMap] = useState<Record<string, string>>({});

  // Revision Modal State
  const [revisionDeliv, setRevisionDeliv] = useState<Deliverable | null>(null);
  const [revisionComment, setRevisionComment] = useState("");
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // File Preview Modal State
  const [previewFile, setPreviewFile] = useState<FileView | null>(null);

  // Comment reply state
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchProject() {
      try {
        const url = `/api/client/projects/${projectId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
        const res = await fetch(url);

        if (res.status === 401 && !token) {
          router.push("/client/login");
          return;
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to load project portal");
        }

        const json = await res.json();
        if (mounted) {
          setProject(json.project);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error loading project");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchProject();

    return () => {
      mounted = false;
    };
  }, [projectId, token, router, refreshIndex]);

  const reloadProjectDetails = () => setRefreshIndex((prev) => prev + 1);

  // Handle Approve Deliverable
  const handleApprove = async (delivId: string) => {
    if (actionLoading) return; // Prevent double-click
    setActionLoading(delivId);
    setActionNotice(null);

    try {
      const note = approvalNoteMap[delivId] || "";
      const res = await fetch(`/api/client/deliverables/${delivId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve deliverable.");
      }

      if (data.stale) {
        setActionNotice("Notice: " + data.message);
      } else {
        setActionNotice(data.message || "Deliverable approved successfully!");
      }

      // Reload project state to update progress and UI everywhere
      reloadProjectDetails();
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Request Revision
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionDeliv) return;

    if (!revisionComment.trim()) {
      setRevisionError("Please enter detailed revision feedback.");
      return;
    }

    setActionLoading(revisionDeliv.id);
    setRevisionError(null);

    try {
      const res = await fetch(`/api/client/deliverables/${revisionDeliv.id}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: revisionComment.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to request revision.");
      }

      setRevisionDeliv(null);
      setRevisionComment("");
      setActionNotice(data.message || "Revision request submitted.");

      reloadProjectDetails();
    } catch (err: unknown) {
      setRevisionError(err instanceof Error ? err.message : "Failed to submit revision.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Client Comment Post
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replyLoading) return;

    setReplyLoading(true);
    try {
      const res = await fetch("/api/client/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content: replyText.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to post message.");
      }

      setReplyText("");
      reloadProjectDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-300 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-zinc-500">Loading project portal...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-rose-950 text-rose-400 mx-auto flex items-center justify-center font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-white">Access Notice</h2>
          <p className="text-xs text-zinc-400">{error || "Unable to load project."}</p>
          <div className="pt-2">
            <Link
              href="/client"
              className="inline-block px-4 py-2 text-xs font-semibold bg-emerald-400 text-black rounded-xl hover:bg-emerald-300"
            >
              ← Return to Client Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Branded Header */}
      <header className="h-16 bg-zinc-950 border-b border-zinc-850 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/client"
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-extrabold text-black text-sm shadow-md shadow-emerald-500/20 hover:opacity-90 transition-opacity"
          >
            {project.agency.name.slice(0, 2).toUpperCase()}
          </Link>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Link href="/client" className="hover:text-emerald-400 transition-colors">
                {project.agency.name}
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-300">{project.client.name}</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Client Portal Project Review
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/client"
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            ← All Projects
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Notice Alert if any */}
        {actionNotice && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-zinc-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          </div>
        )}

        {/* Project Header Projection */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-emerald-950/30 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider font-mono">
                {project.plainStatus}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            {/* Overall Progress Widget */}
            <div className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl shrink-0">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-700"
                    strokeDasharray={`${project.progressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold font-mono text-white">
                  {project.progressPercent}%
                </span>
              </div>

              <div>
                <div className="text-[10px] uppercase font-mono text-zinc-400">
                  Overall Progress
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {project.progressPercent}% Completed
                </div>
                <div className="text-[10px] text-zinc-500 pt-0.5">
                  {project.dueDate
                    ? `Due ${new Date(project.dueDate).toLocaleDateString()}`
                    : "Flexible timeline"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 ACTION REQUIRED: Deliverables Sent For Review */}
        {project.pendingApprovals.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Sign-Off Needed ({project.pendingApprovals.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {project.pendingApprovals.map((deliv) => {
                const isSubmitting = actionLoading === deliv.id;

                return (
                  <div
                    key={deliv.id}
                    className="p-6 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/40 rounded-2xl space-y-4 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                            {deliv.serviceType}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            Sent for Review {deliv.sentToClientAt ? new Date(deliv.sentToClientAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{deliv.title}</h3>
                        {deliv.description && (
                          <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                            {deliv.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-semibold">
                          {deliv.plainStatus}
                        </span>
                      </div>
                    </div>

                    {/* Files & Version Review Section */}
                    {deliv.files && deliv.files.length > 0 ? (
                      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                        <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                          Deliverable Assets & Versions ({deliv.files.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {deliv.files.map((file) => (
                            <div
                              key={file.id}
                              className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-zinc-300 shrink-0">
                                  v{file.version}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-white truncate">
                                    {file.fileName}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    {(file.fileSize / 1024).toFixed(1)} KB · {file.fileType.split("/")[1] || "file"}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(file)}
                                  className="px-2.5 py-1 text-[11px] bg-zinc-850 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-750 transition-colors"
                                >
                                  Preview
                                </button>
                                <a
                                  href={file.signedDownloadUrl}
                                  download
                                  className="px-2.5 py-1 text-[11px] bg-zinc-850 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-750 transition-colors"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-400">
                        Creative assets uploaded by the agency team are available for this deliverable.
                      </div>
                    )}

                    {/* Action Controls: Approve or Request Revision */}
                    <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="Optional approval notes or compliments..."
                        value={approvalNoteMap[deliv.id] || ""}
                        onChange={(e) =>
                          setApprovalNoteMap({
                            ...approvalNoteMap,
                            [deliv.id]: e.target.value,
                          })
                        }
                        className="flex-1 text-xs px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setRevisionDeliv(deliv);
                            setRevisionComment("");
                            setRevisionError(null);
                          }}
                          className="px-3.5 py-2.5 text-xs text-zinc-300 hover:text-white border border-zinc-700/80 hover:bg-zinc-800/80 rounded-xl transition-all"
                        >
                          Request Revision
                        </button>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleApprove(deliv.id)}
                          className="px-4 py-2.5 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          {isSubmitting ? (
                            "Processing..."
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve Deliverable
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* All Deliverables Overview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Campaign Deliverables</h2>
            <span className="text-xs text-zinc-400 font-mono">
              {project.deliverables.length} Deliverable{project.deliverables.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.deliverables.map((deliv) => (
              <div
                key={deliv.id}
                className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-emerald-400 uppercase">
                    {deliv.serviceType}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      deliv.status === "APPROVED" || deliv.status === "DELIVERED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : deliv.status === "SENT_TO_CLIENT"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : deliv.status === "REVISION_REQUESTED"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    }`}
                  >
                    {deliv.plainStatus}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{deliv.title}</h3>
                {deliv.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {deliv.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Progress</span>
                    <span className="font-bold text-white">{deliv.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${deliv.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/80">
                  <span>
                    {deliv.dueDate
                      ? `Deadline: ${new Date(deliv.dueDate).toLocaleDateString()}`
                      : "Target date pending"}
                  </span>
                  <span>{deliv.files.length} asset{deliv.files.length === 1 ? "" : "s"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discussion & Messages (Client-Visible Only) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Project Discussion</h2>
            <span className="text-xs text-zinc-400 font-mono">Client-Visible Messages</span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {project.comments.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No discussion messages posted yet. Post a question or note below.
                </div>
              ) : (
                project.comments.map((msg) => {
                  const isClient = msg.authorType === "CLIENT_CONTACT";

                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        isClient
                          ? "bg-emerald-950/30 border-emerald-500/30 ml-4"
                          : "bg-zinc-950/80 border-zinc-800 mr-4"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold ${isClient ? "text-emerald-300" : "text-white"}`}>
                          {msg.authorName} {isClient ? "(You)" : "(Agency Team)"}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(msg.createdAt).toLocaleDateString()} ·{" "}
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input */}
            <form onSubmit={handlePostComment} className="pt-3 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                placeholder="Post a message to the delivery team..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || replyLoading}
                className="px-4 py-2.5 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black rounded-xl transition-all shrink-0"
              >
                {replyLoading ? "Sending..." : "Reply"}
              </button>
            </form>
          </div>
        </section>

        {/* Client-Safe Activity Feed */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Recent Project Timeline</h2>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
            {project.activity.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">No recent activity recorded.</p>
            ) : (
              project.activity.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between gap-3 text-xs py-2 border-b border-zinc-850 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-white">{ev.actorName}:</span>{" "}
                      <span className="text-zinc-300">{ev.description}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {new Date(ev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Revision Modal (Comment Strictly Required) */}
      {revisionDeliv && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Request Deliverable Revision</h3>
                <p className="text-xs text-zinc-400">
                  {revisionDeliv.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevisionDeliv(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Please specify the modifications or adjustments required. Your feedback will be logged, and a revision task will be automatically created and assigned to the creative lead.
            </p>

            {revisionError && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {revisionError}
              </div>
            )}

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Revision Feedback <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the specific color, copy, layout, or timeline adjustments needed..."
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  className="w-full text-xs p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionDeliv(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === revisionDeliv.id}
                  className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-rose-500/20"
                >
                  {actionLoading === revisionDeliv.id ? "Submitting..." : "Send Revision Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{previewFile.fileName}</h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Version {previewFile.version} · {(previewFile.fileSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.signedDownloadUrl}
                  download
                  className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="text-zinc-400 hover:text-white text-base px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center min-h-[300px]">
              {previewFile.fileType.startsWith("image/") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewFile.signedPreviewUrl}
                  alt={previewFile.fileName}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              ) : previewFile.fileType.startsWith("video/") ? (
                <video
                  src={previewFile.signedPreviewUrl}
                  controls
                  className="max-h-[60vh] max-w-full rounded-lg"
                />
              ) : previewFile.fileType === "application/pdf" ? (
                <iframe
                  src={previewFile.signedPreviewUrl}
                  title={previewFile.fileName}
                  className="w-full h-[60vh] rounded-lg"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="text-3xl text-zinc-600">📄</div>
                  <p className="text-xs text-zinc-400">
                    Preview not available inline for this file type ({previewFile.fileType}).
                  </p>
                  <a
                    href={previewFile.signedDownloadUrl}
                    download
                    className="inline-block px-4 py-2 text-xs font-semibold bg-emerald-400 text-black rounded-xl hover:bg-emerald-300"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="h-14 border-t border-zinc-850 px-6 sm:px-8 flex items-center justify-between text-[11px] text-zinc-500">
        <div>
          {project.agency.name} · Client Portal
        </div>
        <div className="text-zinc-400">
          Client Sign-Off & Review Engine
        </div>
      </footer>
    </div>
  );
}
