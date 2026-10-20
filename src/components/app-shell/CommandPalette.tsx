"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchProject {
  id: string;
  name: string;
  status: string;
  progressPercent: number;
}

interface SearchTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
}

interface SearchClient {
  id: string;
  name: string;
  companyName?: string | null;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [clients, setClients] = useState<SearchClient[]>([]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Query search API
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search.trim())}`);
        if (res.ok && active) {
          const data = await res.json();
          setProjects(data.projects || []);
          setTasks(data.tasks || []);
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error("Search fetch failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, search]);

  if (!isOpen) return null;

  const quickNav = [
    { label: "Dashboard", href: "/app/dashboard", category: "Core" },
    { label: "My Work", href: "/app/my-work", category: "Core" },
    { label: "Projects", href: "/app/projects", category: "Agency" },
    { label: "Clients", href: "/app/clients", category: "Agency" },
    { label: "Social Media", href: "/app/social", category: "Agency" },
    { label: "Calendar", href: "/app/calendar", category: "Planning" },
    { label: "Agency Settings", href: "/app/settings", category: "Admin" },
  ].filter((n) => n.label.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  const hasResults =
    projects.length > 0 || tasks.length > 0 || clients.length > 0 || quickNav.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div
        data-lenis-prevent
        className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950">
          <svg
            className="w-5 h-5 text-zinc-400 shrink-0"
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
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, tasks, clients, or commands..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {loading && (
            <span className="text-[10px] text-zinc-400 font-mono animate-pulse">Searching...</span>
          )}
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {!hasResults && !loading && (
            <div className="py-8 text-center text-zinc-500">
              No results found for &ldquo;{search}&rdquo;
            </div>
          )}

          {/* Quick Navigation */}
          {quickNav.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1.5 px-2">
                Navigation
              </div>
              <div className="space-y-1">
                {quickNav.map((n) => (
                  <button
                    key={n.href}
                    onClick={() => handleSelect(n.href)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <span>{n.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">Jump ↵</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1.5 px-2 flex items-center justify-between">
                <span>Projects</span>
                <span className="font-mono text-[9px]">{projects.length}</span>
              </div>
              <div className="space-y-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => handleSelect(`/app/projects/${proj.id}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">📁</span>
                      <span className="font-medium truncate">{proj.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-emerald-400">
                        {proj.progressPercent}%
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 font-mono">
                        {proj.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1.5 px-2 flex items-center justify-between">
                <span>Tasks</span>
                <span className="font-mono text-[9px]">{tasks.length}</span>
              </div>
              <div className="space-y-1">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelect(`/app/projects/${task.projectId}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">⚡</span>
                      <span className="font-medium truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          task.priority === "HIGH" || task.priority === "URGENT"
                            ? "bg-rose-950 text-rose-300 border-rose-800/40"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 font-mono">
                        {task.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {clients.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1.5 px-2 flex items-center justify-between">
                <span>Clients</span>
                <span className="font-mono text-[9px]">{clients.length}</span>
              </div>
              <div className="space-y-1">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/app/clients/${c.id}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">🏢</span>
                      <span className="font-medium truncate">{c.name}</span>
                      {c.companyName && c.companyName !== c.name && (
                        <span className="text-[10px] text-zinc-500">({c.companyName})</span>
                      )}
                    </div>
                    <span className="text-[10px] text-sky-400">View Client →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
