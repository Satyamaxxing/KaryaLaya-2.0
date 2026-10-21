"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLATFORM_LIMITS } from "@/server/services/social-media";

interface ClientPost {
  id: string;
  title: string | null;
  caption: string;
  hashtags: string | null;
  platforms: string[];
  mediaUrls: string[];
  scheduledAt: string | null;
  status: string;
  comments?: Array<{ id: string; authorName: string; content: string; createdAt: string }>;
}

export default function ClientSocialPortalPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ClientPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  // Month navigation
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Oct 2026

  // Selected post modal
  const [selectedPost, setSelectedPost] = useState<ClientPost | null>(null);
  const [commentText, setCommentText] = useState("");

  const loadPosts = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await fetch(`/api/client/social?month=${month}&year=${year}`);

      if (res.status === 401) {
        router.push("/client/login");
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load social calendar");
      }

      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const res = await fetch(`/api/client/social?year=${year}&month=${month}`);
        if (!active) return;
        if (!res.ok) throw new Error("Failed to load client social calendar.");

        const data = await res.json();
        if (active) setPosts(data.posts || []);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error loading calendar");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [currentDate]);

  // Batch approve all pending posts
  const pendingPosts = useMemo(() => {
    return posts.filter((p) => p.status === "CLIENT_APPROVAL");
  }, [posts]);

  const handleBatchApprove = async () => {
    if (pendingPosts.length === 0 || approving) return;
    setApproving(true);
    try {
      const res = await fetch("/api/client/social/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: pendingPosts.map((p) => p.id) }),
      });

      if (!res.ok) throw new Error("Batch approval failed.");
      const data = await res.json();
      setActionNotice(`Success! Batch of ${data.approvedCount} social posts approved.`);
      loadPosts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve batch");
    } finally {
      setApproving(false);
    }
  };

  // Single post approve
  const handleApproveSingle = async (postId: string) => {
    try {
      const res = await fetch("/api/client/social/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: [postId] }),
      });
      if (!res.ok) throw new Error("Approval failed.");
      setActionNotice("Post approved successfully!");
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
      }
      loadPosts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Approval failed");
    }
  };

  // Submit client comment on post
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !commentText.trim()) return;

    try {
      const res = await fetch(`/api/social/posts/${selectedPost.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      setCommentText("");
      loadPosts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Comment failed");
    }
  };

  // Calendar Helpers
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, date: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ day: d, date: new Date(year, month, d) });
    }
    return days;
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Client Portal Header */}
      <header className="h-16 bg-zinc-950 border-b border-zinc-850 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/client"
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-extrabold text-black text-sm shadow-md shadow-emerald-500/20"
          >
            KL
          </Link>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Link href="/client" className="hover:text-emerald-400">
                Client Portal
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-300">Social Content Calendar</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">Monthly Multi-Platform Content Review</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/client"
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg transition-colors"
          >
            ← Projects Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {actionNotice && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-lg">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Banner with Batch Approval Button */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-emerald-950/30 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">
              Content Pipeline
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()} Social Calendar
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Review creative assets, verify copy and captions, and sign off on scheduled campaigns across all channels.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {pendingPosts.length > 0 ? (
              <button
                type="button"
                disabled={approving}
                onClick={handleBatchApprove}
                className="px-5 py-3 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>✓</span>
                <span>
                  {approving
                    ? "Approving Batch..."
                    : `Approve Batch (${pendingPosts.length} Posts)`}
                </span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>All Scheduled Content Approved</span>
              </div>
            )}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span>Total Posts: <strong>{posts.length}</strong></span>
            <span>·</span>
            <span className="text-emerald-400">Approved: <strong>{posts.filter((p) => p.status === "APPROVED" || p.status === "SCHEDULED" || p.status === "PUBLISHED").length}</strong></span>
            <span>·</span>
            <span className="text-amber-400">Needs Sign-Off: <strong>{pendingPosts.length}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="p-16 text-center text-zinc-500 font-mono text-xs">Loading calendar...</div>
        ) : (
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="min-w-[680px]">
              <div className="grid grid-cols-7 gap-px bg-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div
                key={dayName}
                className="bg-zinc-950 p-2.5 text-center text-[10px] font-mono text-zinc-400 uppercase font-semibold"
              >
                {dayName}
              </div>
            ))}

            {daysInMonth.map((item, idx) => {
              if (!item.date) {
                return <div key={`empty-${idx}`} className="bg-zinc-950/40 min-h-[115px] p-2 opacity-30" />;
              }

              const dayPosts = posts.filter((p) => {
                if (!p.scheduledAt) return false;
                const pDate = new Date(p.scheduledAt);
                return (
                  pDate.getFullYear() === item.date.getFullYear() &&
                  pDate.getMonth() === item.date.getMonth() &&
                  pDate.getDate() === item.date.getDate()
                );
              });

              return (
                <div
                  key={`day-${item.day}`}
                  className="bg-zinc-900/90 hover:bg-zinc-900 min-h-[115px] p-2 space-y-1.5 transition-colors border-t border-zinc-850/60"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-zinc-300">{item.day}</span>
                    {dayPosts.length > 0 && (
                      <span className="text-[10px] text-emerald-400 font-semibold">{dayPosts.length}</span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`p-1.5 rounded-lg border text-[10px] space-y-0.5 cursor-pointer transition-all ${
                          post.status === "CLIENT_APPROVAL"
                            ? "bg-amber-950/40 border-amber-500/50 hover:bg-amber-950/60"
                            : "bg-zinc-950 border-zinc-800 hover:bg-zinc-850"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-0.5">
                            {post.platforms.map((pl) => (
                              <span key={pl} className="text-[9px]">
                                {PLATFORM_LIMITS[pl]?.icon || "🌐"}
                              </span>
                            ))}
                          </span>
                          <span className={`text-[8px] font-mono px-1 rounded ${
                            post.status === "APPROVED" || post.status === "SCHEDULED" || post.status === "PUBLISHED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}>
                            {post.status === "CLIENT_APPROVAL" ? "Sign-off" : post.status.slice(0, 4)}
                          </span>
                        </div>
                        <div className="text-zinc-200 truncate font-medium">
                          {post.title || post.caption}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Post Detail & Approval Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-auto"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  {selectedPost.platforms.map((pl) => (
                    <span key={pl} className="text-xs px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono">
                      {PLATFORM_LIMITS[pl]?.icon} {pl}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    {selectedPost.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {selectedPost.title || "Social Post Review"}
                </h3>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Media Asset Preview */}
            {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPost.mediaUrls[0]} alt="Post asset" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Caption */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-850 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {selectedPost.caption}
              {selectedPost.hashtags && (
                <div className="pt-2 text-emerald-400 font-mono text-[11px]">{selectedPost.hashtags}</div>
              )}
            </div>

            {/* Approve button if pending */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-400 font-mono">
                {selectedPost.scheduledAt ? `Scheduled: ${new Date(selectedPost.scheduledAt).toLocaleString()}` : ""}
              </span>

              {selectedPost.status === "CLIENT_APPROVAL" && (
                <button
                  type="button"
                  onClick={() => handleApproveSingle(selectedPost.id)}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  ✓ Approve This Post
                </button>
              )}
            </div>

            {/* Client feedback comment box */}
            <form onSubmit={handlePostComment} className="pt-3 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                placeholder="Leave feedback on copy or visual adjustments..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-3 py-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
