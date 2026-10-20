"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWorkState } from "@/lib/state/work-state-context";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RealNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  assignmentNotify: boolean;
  mentionNotify: boolean;
  dueSoonNotify: boolean;
  overdueNotify: boolean;
  revisionNotify: boolean;
  approvalNotify: boolean;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { notifications: mockNotifications } = useWorkState();
  const [activeTab, setActiveTab] = useState<"inbox" | "preferences">("inbox");
  const [realNotifications, setRealNotifications] = useState<RealNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    assignmentNotify: true,
    mentionNotify: true,
    dueSoonNotify: true,
    overdueNotify: true,
    revisionNotify: true,
    approvalNotify: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setRealNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    let active = true;
    if (isOpen) {
      (async () => {
        try {
          const [nRes, pRes] = await Promise.all([
            fetch("/api/notifications"),
            fetch("/api/notifications/preferences"),
          ]);
          if (!active) return;
          if (nRes.ok) {
            const data = await nRes.json();
            setRealNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
          if (pRes.ok) {
            const data = await pRes.json();
            if (data.preferences) setPreferences(data.preferences);
          }
        } catch (_) {}
      })();
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setRealNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignored
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setRealNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    }
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setSavingPrefs(true);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {
      // Ignored
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!isOpen) return null;

  const displayList = realNotifications.length > 0 ? realNotifications : mockNotifications.map((m) => ({
    id: m.id,
    type: m.priority || "GENERAL",
    title: m.title,
    message: m.message,
    entityType: m.entityType,
    entityId: m.id,
    link: "/app/dashboard",
    isRead: m.isRead,
    createdAt: m.createdAt,
  }));

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" />

      <div
        data-lenis-prevent
        className="fixed top-14 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Notifications & Attention</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && activeTab === "inbox" && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] text-zinc-400 hover:text-emerald-400 font-mono transition-colors"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-xs p-1">
              ✕
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-950/50 text-xs px-2 pt-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`px-3 py-1.5 rounded-t-md font-medium transition-colors ${
              activeTab === "inbox"
                ? "bg-zinc-900 text-white border-t border-x border-zinc-750"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Inbox Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`px-3 py-1.5 rounded-t-md font-medium transition-colors ${
              activeTab === "preferences"
                ? "bg-zinc-900 text-white border-t border-x border-zinc-750"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Preferences
          </button>
        </div>

        {/* TAB 1: INBOX */}
        {activeTab === "inbox" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {loading && displayList.length === 0 ? (
              <div className="space-y-2 py-4">
                <div className="h-16 bg-zinc-950/60 rounded-lg animate-pulse" />
                <div className="h-16 bg-zinc-950/60 rounded-lg animate-pulse" />
              </div>
            ) : displayList.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No new notifications. Everything is on track!
              </div>
            ) : (
              displayList.map((ntf) => (
                <div
                  key={ntf.id}
                  className={`p-3 rounded-lg border transition-all ${
                    ntf.isRead
                      ? "bg-zinc-950/40 border-zinc-800/60 opacity-75"
                      : "bg-zinc-950 border-zinc-700 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          ntf.type.includes("URGENT") || ntf.type === "OVERDUE"
                            ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                            : ntf.type === "MENTION"
                            ? "bg-sky-950 text-sky-300 border border-sky-800/40"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {ntf.type.replace(/_/g, " ")}
                      </span>
                      <span className="font-semibold text-white">{ntf.title}</span>
                    </div>
                  </div>

                  <p className="text-zinc-300 text-xs mb-2 leading-relaxed">{ntf.message}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-850 text-[11px]">
                    <span className="text-zinc-500">
                      {new Date(ntf.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {ntf.link && (
                        <Link
                          href={ntf.link}
                          onClick={onClose}
                          className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
                        >
                          View Context
                        </Link>
                      )}

                      {!ntf.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(ntf.id)}
                          className="text-zinc-400 hover:text-zinc-200"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: PREFERENCES */}
        {activeTab === "preferences" && (
          <div className="p-4 space-y-4 text-xs overflow-y-auto">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Notification Delivery Rules
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Anti-spam rolling window deduplicates repeat notifications within 1 hour.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">Email Notifications</div>
                  <div className="text-[10px] text-zinc-400">Send summary emails to your inbox</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => handleTogglePreference("emailNotifications")}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">Task Assignments</div>
                  <div className="text-[10px] text-zinc-400">When assigned to a deliverable task</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.assignmentNotify}
                  onChange={() => handleTogglePreference("assignmentNotify")}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">@Mentions in Comments</div>
                  <div className="text-[10px] text-zinc-400">When teammates tag you in comments</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.mentionNotify}
                  onChange={() => handleTogglePreference("mentionNotify")}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">Deadlines & Due Soon</div>
                  <div className="text-[10px] text-zinc-400">Items due within 48 hours</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.dueSoonNotify}
                  onChange={() => handleTogglePreference("dueSoonNotify")}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="font-semibold text-zinc-200">Client Approvals & Revisions</div>
                  <div className="text-[10px] text-zinc-400">When client approves or requests revisions</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.approvalNotify}
                  onChange={() => handleTogglePreference("approvalNotify")}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>
            </div>

            {savingPrefs && (
              <div className="text-[11px] text-emerald-400 font-mono text-center">
                Saving preferences...
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
