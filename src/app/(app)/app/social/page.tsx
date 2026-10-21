"use client";

import React, { useEffect, useState, useMemo } from "react";
import { SocialPostPreview } from "@/components/social/SocialPostPreview";
import { PLATFORM_LIMITS } from "@/server/services/social-media";

interface ClientOption {
  id: string;
  name: string;
}

interface SocialAccount {
  id: string;
  clientId: string;
  platform: string;
  handle: string;
  profileUrl?: string | null;
}

interface SocialPost {
  id: string;
  clientId: string;
  client: { id: string; name: string };
  title: string | null;
  platforms: string[];
  caption: string;
  hashtags: string | null;
  mediaUrls: string[];
  scheduledAt: string | null;
  publishedAt: string | null;
  publishedUrl: string | null;
  assigneeId: string | null;
  assignee: { id: string; name: string; email: string } | null;
  status: string;
  comments?: Array<{ id: string; authorName: string; content: string; createdAt: string }>;
}

const STATUS_COLUMNS = [
  { key: "IDEA", label: "Idea / Backlog", color: "border-zinc-700 text-zinc-400" },
  { key: "COPY", label: "Copywriting", color: "border-sky-500/40 text-sky-400" },
  { key: "DESIGN", label: "Design / Creative", color: "border-purple-500/40 text-purple-400" },
  { key: "INTERNAL_REVIEW", label: "Internal Review", color: "border-amber-500/40 text-amber-400" },
  { key: "CLIENT_APPROVAL", label: "Client Review", color: "border-orange-500/40 text-orange-400" },
  { key: "APPROVED", label: "Approved", color: "border-emerald-500/40 text-emerald-400" },
  { key: "SCHEDULED", label: "Scheduled", color: "border-teal-500/40 text-teal-400" },
  { key: "PUBLISHED", label: "Published", color: "border-emerald-400 text-emerald-300" },
];

export default function SocialMediaWorkspacePage() {
  const [viewMode, setViewMode] = useState<"calendar" | "pipeline">("calendar");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar Date State (default to current month/year)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Oct 2026

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form State for Post Editor
  const [postForm, setPostForm] = useState({
    title: "",
    caption: "",
    hashtags: "",
    platforms: ["INSTAGRAM"],
    scheduledAt: "",
    status: "IDEA",
    mediaUrl: "",
    publishedUrl: "",
  });

  // Bulk Generator State
  const [bulkTheme, setBulkTheme] = useState("Agency Brand Growth");
  const [bulkCount, setBulkCount] = useState(30);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // New Channel Account State
  const [accountForm, setAccountForm] = useState({
    platform: "INSTAGRAM",
    handle: "",
    profileUrl: "",
  });

  // Fetch initial clients & accounts
  useEffect(() => {
    async function init() {
      try {
        const clientRes = await fetch("/api/clients");
        if (clientRes.ok) {
          const clientData = await clientRes.json();
          setClients(clientData.clients || []);
          if (clientData.clients && clientData.clients.length > 0) {
            setSelectedClientId(clientData.clients[0].id);
          }
        }
      } catch {
        // ignore
      }
    }
    init();
  }, []);

  // Fetch posts and accounts when client or filters change
  const fetchPostsAndAccounts = async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("clientId", selectedClientId);
      if (selectedPlatform !== "ALL") params.set("platform", selectedPlatform);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const [postsRes, accsRes] = await Promise.all([
        fetch(`/api/social/posts?${params.toString()}`),
        fetch(`/api/social/accounts?clientId=${selectedClientId}`),
      ]);

      if (postsRes.ok) {
        const pData = await postsRes.json();
        setPosts(pData.posts || []);
      }
      if (accsRes.ok) {
        const aData = await accsRes.json();
        setAccounts(aData.accounts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!selectedClientId) return;

    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedClientId) params.set("clientId", selectedClientId);
        if (selectedPlatform !== "ALL") params.set("platform", selectedPlatform);
        if (selectedStatus !== "ALL") params.set("status", selectedStatus);

        const [postsRes, accsRes] = await Promise.all([
          fetch(`/api/social/posts?${params.toString()}`),
          fetch(`/api/social/accounts?clientId=${selectedClientId}`),
        ]);

        if (!active) return;

        if (postsRes.ok) {
          const pData = await postsRes.json();
          if (active) setPosts(pData.posts || []);
        }
        if (accsRes.ok) {
          const aData = await accsRes.json();
          if (active) setAccounts(aData.accounts || []);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [selectedClientId, selectedPlatform, selectedStatus]);

  // Open editor for new or existing post
  const handleOpenEditor = (post?: SocialPost) => {
    if (post) {
      setEditingPost(post);
      setPostForm({
        title: post.title || "",
        caption: post.caption,
        hashtags: post.hashtags || "",
        platforms: post.platforms.length > 0 ? post.platforms : ["INSTAGRAM"],
        scheduledAt: post.scheduledAt ? post.scheduledAt.slice(0, 16) : "",
        status: post.status,
        mediaUrl: post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : "",
        publishedUrl: post.publishedUrl || "",
      });
    } else {
      setEditingPost(null);
      setPostForm({
        title: "",
        caption: "",
        hashtags: "#marketing #growth",
        platforms: ["INSTAGRAM"],
        scheduledAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 10, 0)
          .toISOString()
          .slice(0, 16),
        status: "IDEA",
        mediaUrl: "",
        publishedUrl: "",
      });
    }
    setIsEditorOpen(true);
  };

  // Save post from editor
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.caption.trim()) {
      alert("Please enter a caption.");
      return;
    }

    try {
      const payload = {
        clientId: selectedClientId,
        title: postForm.title,
        caption: postForm.caption,
        hashtags: postForm.hashtags,
        platforms: postForm.platforms,
        scheduledAt: postForm.scheduledAt || null,
        status: postForm.status,
        mediaUrls: postForm.mediaUrl ? [postForm.mediaUrl] : [],
        publishedUrl: postForm.publishedUrl,
      };

      let res;
      if (editingPost) {
        res = await fetch(`/api/social/posts/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/social/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save post");
      }

      setIsEditorOpen(false);
      setActionNotice(editingPost ? "Post updated successfully!" : "New post created!");
      fetchPostsAndAccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save");
    }
  };

  // Mark Published via PublishingProvider
  const handleMarkPublished = async (post: SocialPost) => {
    const liveUrl = prompt("Enter published URL (or leave blank to auto-generate):", post.publishedUrl || "");
    if (liveUrl === null) return;

    try {
      const res = await fetch(`/api/social/posts/${post.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedUrl: liveUrl.trim() || undefined }),
      });

      if (!res.ok) throw new Error("Failed to publish post.");
      setActionNotice(`Post published live! Live URL recorded.`);
      fetchPostsAndAccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Publishing failed");
    }
  };

  // Bulk create 30-day monthly plan
  const handleGenerateBulkPlan = async () => {
    setBulkSubmitting(true);
    try {
      const res = await fetch("/api/social/bulk-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          count: bulkCount,
          theme: bulkTheme,
          platforms: ["INSTAGRAM", "LINKEDIN"],
        }),
      });

      if (!res.ok) throw new Error("Failed to generate bulk plan");
      const data = await res.json();
      setIsBulkModalOpen(false);
      setActionNotice(`Success! Generated ${data.count} posts for the month.`);
      fetchPostsAndAccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Bulk creation failed");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Duplicate current month to next month
  const handleDuplicateToNextMonth = async () => {
    if (!confirm("Duplicate all scheduled posts from this month to next month?")) return;
    try {
      const res = await fetch("/api/social/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          fromYear: currentDate.getFullYear(),
          fromMonth: currentDate.getMonth() + 1,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to duplicate");
      }

      const data = await res.json();
      setActionNotice(`Successfully duplicated ${data.duplicatedCount} posts to next month!`);
      // Advance calendar to next month to see results
      setCurrentDate(new Date(data.targetYear, data.targetMonth - 1, 1));
      fetchPostsAndAccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Duplication failed");
    }
  };

  // Add social account handle
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.handle.trim()) return;

    try {
      const res = await fetch("/api/social/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          platform: accountForm.platform,
          handle: accountForm.handle,
          profileUrl: accountForm.profileUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to add account");
      setIsAccountModalOpen(false);
      setAccountForm({ platform: "INSTAGRAM", handle: "", profileUrl: "" });
      fetchPostsAndAccounts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add channel");
    }
  };

  // Calendar Helpers
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun

    const days = [];
    // Padding for previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, date: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ day: d, date: new Date(year, month, d) });
    }
    return days;
  }, [currentDate]);

  const selectedClientName = clients.find((c) => c.id === selectedClientId)?.name || "Client";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-zinc-100">
      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
            Social Media & Content Ops
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Content Pipeline & Calendar</h1>
          <p className="text-xs text-zinc-400">
            Design, schedule, review with clients, and publish multi-platform campaigns for modern agencies.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenEditor()}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <span>+</span> New Post
          </button>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3 py-2 text-xs font-medium bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-xl transition-all"
          >
            ⚡ Bulk 30-Day Plan
          </button>

          <button
            type="button"
            onClick={handleDuplicateToNextMonth}
            className="px-3 py-2 text-xs font-medium bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-xl transition-all"
            title="Duplicate all posts to next month"
          >
            📑 Duplicate to Next Mo
          </button>

          <button
            type="button"
            onClick={() => setIsAccountModalOpen(true)}
            className="px-3 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 rounded-xl transition-all"
          >
            + Connect Channel
          </button>
        </div>
      </div>

      {/* Connected Channels & Filters Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Client Selector & View Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Client:</span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="text-xs px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  viewMode === "calendar" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                📅 Calendar View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pipeline")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  viewMode === "pipeline" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                📊 Pipeline (Kanban)
              </button>
            </div>
          </div>

          {/* Platform & Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300"
            >
              <option value="ALL">All Platforms</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="TWITTER">X (Twitter)</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="TIKTOK">TikTok</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="IDEA">Idea</option>
              <option value="COPY">Copywriting</option>
              <option value="DESIGN">Design</option>
              <option value="INTERNAL_REVIEW">Internal Review</option>
              <option value="CLIENT_APPROVAL">Client Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        {/* Connected Channel Handles Pill Row */}
        <div className="pt-2 border-t border-zinc-850 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-mono text-zinc-500 uppercase">Channels:</span>
          {accounts.length === 0 ? (
            <span className="text-zinc-500 text-[11px] italic">No handles connected yet. Click &apos;+ Connect Channel&apos;</span>
          ) : (
            accounts.map((acc) => (
              <span
                key={acc.id}
                className="px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5"
              >
                <span>{PLATFORM_LIMITS[acc.platform]?.icon || "🌐"}</span>
                <span className="font-semibold text-white">{acc.handle}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({acc.platform})</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 font-mono text-xs">Loading social content...</div>
      ) : viewMode === "calendar" ? (
        /* CALENDAR VIEW */
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
              </h2>
              <span className="text-xs text-zinc-500 font-mono">({posts.length} posts scheduled)</span>
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
                onClick={() => setCurrentDate(new Date(2026, 9, 1))}
                className="px-2.5 py-1 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300"
              >
                Today
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
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="min-w-[680px]">
              <div className="grid grid-cols-7 gap-px bg-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div
                key={dayName}
                className="bg-zinc-950 p-2 text-center text-[10px] font-mono text-zinc-400 uppercase font-semibold"
              >
                {dayName}
              </div>
            ))}

            {daysInMonth.map((item, idx) => {
              if (!item.date) {
                return <div key={`empty-${idx}`} className="bg-zinc-950/40 min-h-[110px] p-2 opacity-30" />;
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
                  className="bg-zinc-900/90 hover:bg-zinc-900 min-h-[110px] p-2 space-y-1.5 transition-colors border-t border-zinc-850/60"
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
                        onClick={() => handleOpenEditor(post)}
                        className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-850 border border-zinc-800/80 cursor-pointer text-[10px] space-y-0.5 transition-all group"
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
                            post.status === "PUBLISHED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : post.status === "APPROVED"
                              ? "bg-teal-500/20 text-teal-300"
                              : post.status === "CLIENT_APPROVAL"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {post.status.slice(0, 4)}
                          </span>
                        </div>
                        <div className="text-zinc-200 truncate font-medium group-hover:text-emerald-300">
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
        </div>
      ) : (
        /* PIPELINE KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((col) => {
            const colPosts = posts.filter((p) => p.status === col.key);

            return (
              <div
                key={col.key}
                className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3 flex flex-col min-w-[220px] max-h-[750px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {colPosts.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {colPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handleOpenEditor(post)}
                      className="p-3 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded-xl cursor-pointer text-xs space-y-2 transition-all shadow-md group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {post.platforms.map((pl) => (
                            <span key={pl} className="text-xs">
                              {PLATFORM_LIMITS[pl]?.icon || "🌐"}
                            </span>
                          ))}
                        </div>
                        {post.scheduledAt && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(post.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {post.title || post.caption}
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {post.caption}
                      </p>

                      <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{post.assignee?.name ? post.assignee.name.split(" ")[0] : "Team"}</span>
                        {post.status === "SCHEDULED" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkPublished(post);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-bold"
                          >
                            Publish ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================================
       * POST EDITOR MODAL WITH LIVE MOCKUP PREVIEW
       * ==================================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-5xl w-full p-4 sm:p-8 space-y-6 shadow-2xl my-auto"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingPost ? "Edit Social Post" : "Create Social Post"}
                </h3>
                <p className="text-xs text-zinc-400">
                  Compose content, monitor platform character constraints, and preview live render.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-zinc-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form Editor */}
              <form onSubmit={handleSavePost} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Working Title / Hook</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Traps in Agency Workflow"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Platforms Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Publish Target Platforms</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["INSTAGRAM", "LINKEDIN", "TWITTER", "YOUTUBE", "FACEBOOK", "TIKTOK"].map((p) => {
                      const isSelected = postForm.platforms.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (postForm.platforms.length > 1) {
                                setPostForm({
                                  ...postForm,
                                  platforms: postForm.platforms.filter((x) => x !== p),
                                });
                              }
                            } else {
                              setPostForm({
                                ...postForm,
                                platforms: [...postForm.platforms, p],
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-zinc-800 text-white border-emerald-500/60 font-semibold"
                              : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                          }`}
                        >
                          <span>{PLATFORM_LIMITS[p]?.icon || "🌐"}</span>
                          <span>{PLATFORM_LIMITS[p]?.name || p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Caption Textarea + Character Counters */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      Caption Copy <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {postForm.caption.length} chars
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    required
                    placeholder="Write engaging copy with a strong hook, core insight, and call to action..."
                    value={postForm.caption}
                    onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                    className="w-full text-xs p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />

                  {/* Real-time Platform Character Limit Badges */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {postForm.platforms.map((pl) => {
                      const maxLimit = PLATFORM_LIMITS[pl]?.charLimit || 2200;
                      const remaining = maxLimit - postForm.caption.length;
                      const isExceeded = remaining < 0;

                      return (
                        <span
                          key={pl}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                            isExceeded
                              ? "bg-rose-950/60 border-rose-500 text-rose-300 font-bold"
                              : "bg-zinc-950 border-zinc-800 text-zinc-400"
                          }`}
                        >
                          {PLATFORM_LIMITS[pl]?.icon} {pl}:{" "}
                          <span className={isExceeded ? "text-rose-400" : "text-emerald-400"}>
                            {remaining} left
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Hashtags Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Hashtags</label>
                  <input
                    type="text"
                    placeholder="#design #agency #branding"
                    value={postForm.hashtags}
                    onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Media URL / Asset */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Media / Image Asset URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/creative-graphic.jpg"
                    value={postForm.mediaUrl}
                    onChange={(e) => setPostForm({ ...postForm, mediaUrl: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Scheduled Date & Pipeline Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Scheduled Time</label>
                    <input
                      type="datetime-local"
                      value={postForm.scheduledAt}
                      onChange={(e) => setPostForm({ ...postForm, scheduledAt: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Workflow Status</label>
                    <select
                      value={postForm.status}
                      onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none"
                    >
                      {STATUS_COLUMNS.map((sc) => (
                        <option key={sc.key} value={sc.key}>
                          {sc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    {editingPost && (
                      <button
                        type="button"
                        onClick={() => handleMarkPublished(editingPost)}
                        className="px-3 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 rounded-xl hover:bg-emerald-950/30"
                      >
                        Publish Post ↗
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                      Save Post
                    </button>
                  </div>
                </div>
              </form>

              {/* Right Column: Live Mockup Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                  Live Multi-Platform Preview
                </div>
                <SocialPostPreview
                  platform={postForm.platforms[0] || "INSTAGRAM"}
                  clientName={selectedClientName}
                  caption={postForm.caption}
                  hashtags={postForm.hashtags}
                  mediaUrls={postForm.mediaUrl ? [postForm.mediaUrl] : []}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * BULK 30-DAY MONTHLY PLAN MODAL
       * ==================================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Bulk 30-Day Monthly Plan</h3>
                <p className="text-xs text-zinc-400">
                  Auto-generate an entire month of structured social content spread across the calendar.
                </p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Campaign Theme / Objective</label>
                <input
                  type="text"
                  value={bulkTheme}
                  onChange={(e) => setBulkTheme(e.target.value)}
                  placeholder="e.g. Product Launch & Customer Proof"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Number of Posts to Generate</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-850 rounded-xl text-[11px] text-zinc-400 space-y-1">
                <div>Client: <strong className="text-white">{selectedClientName}</strong></div>
                <div>Month: <strong className="text-emerald-400">{currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}</strong></div>
                <div>Platforms: <strong>Instagram + LinkedIn</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkSubmitting}
                onClick={handleGenerateBulkPlan}
                className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {bulkSubmitting ? "Generating 30 Posts..." : "Generate Monthly Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
       * CONNECT CHANNEL MODAL
       * ==================================================================== */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Connect Client Social Channel</h3>
                <p className="text-xs text-zinc-400">
                  Register social handle for {selectedClientName}.
                </p>
              </div>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3.5 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Platform</label>
                <select
                  value={accountForm.platform}
                  onChange={(e) => setAccountForm({ ...accountForm, platform: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                >
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="TWITTER">X (Twitter)</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="TIKTOK">TikTok</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Handle / Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="@agencybrand"
                  value={accountForm.handle}
                  onChange={(e) => setAccountForm({ ...accountForm, handle: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Channel URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/agencybrand"
                  value={accountForm.profileUrl}
                  onChange={(e) => setAccountForm({ ...accountForm, profileUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-black rounded-xl"
                >
                  Add Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
