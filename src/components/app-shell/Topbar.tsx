"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
  onToggleNotifications: () => void;
  onOpenCreateTask: () => void;
}

interface CurrentUserInfo {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "MEMBER";
  organizationId: string;
  organizationName: string;
}

export function Topbar({
  onToggleSidebar,
  onOpenCommandPalette,
  onToggleNotifications,
  onOpenCreateTask,
}: TopbarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok && active) {
          const data = await res.json();
          if (data.user) setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load user in topbar:", err);
      }
    }

    async function checkNotifications() {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true&limit=1");
        if (res.ok && active) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (_) {}
    }

    loadUser();
    checkNotifications();

    const interval = setInterval(checkNotifications, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSwitchPersona = async (email: string) => {
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123" }),
      });
      if (res.ok) {
        setIsUserMenuOpen(false);
        window.location.reload();
      } else {
        alert("Persona switch failed. Please log in with password123.");
      }
    } catch (err) {
      console.error("Switch persona error:", err);
    } finally {
      setSwitching(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "KL";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="app-topbar sticky top-0 z-30 w-full h-14 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-4 flex items-center justify-between gap-4">
      {/* Left: Mobile Drawer Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="font-mono text-zinc-500 uppercase tracking-wider text-[11px] truncate hidden sm:inline">
            {currentUser?.organizationName || "Agency Workspace"}
          </span>
          <span className="text-zinc-700 hidden sm:inline">/</span>
          <span className="font-semibold text-white truncate">
            Work Operating System
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Center: Command Palette Search (Cmd+K) */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all shadow-inner group"
        >
          <span className="flex items-center gap-2 truncate">
            <svg
              className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="truncate">Search projects, tasks, clients...</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Notification Bell, New Task, User Menu */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="sm:hidden p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
          title="Search"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={onToggleNotifications}
          className="relative p-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Notifications and Attention Feed"
          aria-label="View notifications"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[8px] flex items-center justify-center ring-2 ring-zinc-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 hover:border-zinc-700 transition-all text-xs"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-600 to-sky-600 flex items-center justify-center font-bold text-[10px] text-white">
              {getInitials(currentUser?.name)}
            </div>
            <span className="font-medium hidden md:inline truncate max-w-[100px]">
              {currentUser?.name?.split(" ")[0] || "Account"}
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border hidden sm:inline ${
                currentUser?.role === "OWNER"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/50"
                  : currentUser?.role === "MANAGER"
                  ? "bg-sky-950/80 text-sky-300 border-sky-800/50"
                  : "bg-purple-950/80 text-purple-300 border-purple-800/50"
              }`}
            >
              {currentUser?.role || "USER"}
            </span>
            <span className="text-zinc-500 text-[10px]">▾</span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2.5 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              {/* Profile Card */}
              <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-850 space-y-1">
                <div className="font-semibold text-white truncate">
                  {currentUser?.name || "Demo User"}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {currentUser?.email || "user@karyalaya.agency"}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Role: {currentUser?.role}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono truncate">
                    {currentUser?.organizationName}
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-0.5 border-b border-zinc-800/80 pb-2">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/app/my-work");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-between"
                >
                  <span>My Assigned Work</span>
                  <span className="text-[10px] text-zinc-500">→</span>
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/app/settings");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-between"
                >
                  <span>Agency Settings</span>
                  <span className="text-[10px] text-zinc-500">→</span>
                </button>
              </div>

              {/* Switch Persona (Demo Testing RBAC) */}
              <div className="space-y-1 border-b border-zinc-800/80 pb-2">
                <div className="px-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Test Role Switcher
                </div>
                {[
                  { name: "Meera Sen", role: "OWNER", email: "meera@karyalaya.agency" },
                  { name: "Rohan Varma", role: "MANAGER", email: "rohan@karyalaya.agency" },
                  { name: "Satyam Kumar", role: "MEMBER", email: "satyam@karyalaya.agency" },
                  { name: "Arjun Nair", role: "MEMBER", email: "arjun@karyalaya.agency" },
                ].map((persona) => {
                  const isCurrent = currentUser?.email === persona.email;
                  return (
                    <button
                      key={persona.email}
                      disabled={switching}
                      onClick={() => handleSwitchPersona(persona.email)}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between transition-colors ${
                        isCurrent
                          ? "bg-zinc-800/80 text-emerald-400 font-semibold"
                          : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span className="truncate">{persona.name}</span>
                      <span className="font-mono text-[9px] uppercase px-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                        {persona.role}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-medium flex items-center justify-between transition-colors"
              >
                <span>Sign Out</span>
                <span className="text-[10px] font-mono">⎋</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
