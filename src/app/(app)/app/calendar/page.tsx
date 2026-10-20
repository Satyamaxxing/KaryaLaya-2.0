"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CalendarEvent, CalendarConflictHint, CalendarEventType } from "@/server/services/calendar";

export default function CalendarPage() {
  const [scope, setScope] = useState<"TEAM" | "PERSONAL">("TEAM");
  const [viewMode, setViewMode] = useState<"MONTH" | "WEEK">("MONTH");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter state
  const [selectedClientId, setSelectedClientId] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<CalendarEventType | "ALL">("ALL");

  // Telemetry state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<CalendarConflictHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options loaded from database
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  // ICS modal state
  const [showIcsModal, setShowIcsModal] = useState(false);
  const [icsFeedUrl, setIcsFeedUrl] = useState<string>("");
  const [copyingIcs, setCopyingIcs] = useState(false);

  // Active event detail modal
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Fetch initial clients, projects, members for filter dropdowns
  useEffect(() => {
    let active = true;
    async function loadMeta() {
      try {
        const [cRes, pRes, tRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/projects"),
          fetch("/api/team"),
        ]);
        if (!active) return;
        if (cRes.ok) {
          const cData = await cRes.json();
          if (active) setClients(cData.clients || []);
        }
        if (pRes.ok) {
          const pData = await pRes.json();
          if (active) setProjects(pData.projects || []);
        }
        if (tRes.ok) {
          const tData = await tRes.json();
          if (active) setMembers(tData.roster || []);
        }
      } catch {
        // ignore
      }
    }
    loadMeta();
    return () => {
      active = false;
    };
  }, []);

  // Fetch calendar events & conflicts
  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("scope", scope);
      if (selectedClientId !== "ALL") params.set("clientId", selectedClientId);
      if (selectedProjectId !== "ALL") params.set("projectId", selectedProjectId);
      if (selectedMemberId !== "ALL") params.set("memberId", selectedMemberId);
      if (selectedType !== "ALL") params.set("type", selectedType);

      const res = await fetch(`/api/calendar?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load calendar events.");
      }
      const data = await res.json();
      setEvents(data.events || []);
      setConflicts(data.conflicts || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error syncing calendar telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const params = new URLSearchParams();
        params.set("scope", scope);
        if (selectedClientId !== "ALL") params.set("clientId", selectedClientId);
        if (selectedProjectId !== "ALL") params.set("projectId", selectedProjectId);
        if (selectedMemberId !== "ALL") params.set("memberId", selectedMemberId);
        if (selectedType !== "ALL") params.set("type", selectedType);

        const res = await fetch(`/api/calendar?${params.toString()}`);
        if (!active) return;
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to load calendar events.");
        }
        const data = await res.json();
        if (active) {
          setEvents(data.events || []);
          setConflicts(data.conflicts || []);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error syncing calendar telemetry");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [scope, selectedClientId, selectedProjectId, selectedMemberId, selectedType]);

  // Handle ICS export feed retrieval
  const handleOpenIcsModal = async () => {
    setShowIcsModal(true);
    if (!icsFeedUrl) {
      try {
        const res = await fetch("/api/calendar/token");
        if (res.ok) {
          const data = await res.json();
          setIcsFeedUrl(data.feedUrl || "");
        }
      } catch {
        // ignore
      }
    }
  };

  const handleCopyIcs = () => {
    if (!icsFeedUrl) return;
    navigator.clipboard.writeText(icsFeedUrl);
    setCopyingIcs(true);
    setTimeout(() => setCopyingIcs(false), 2000);
  };

  // Month navigation
  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === "MONTH") {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === "MONTH") {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Month days
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill complete weeks (up to 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Week days (7 days centered around currentDate)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const distanceToSunday = dayOfWeek;
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - distanceToSunday);

    const todayStr = new Date().toISOString().slice(0, 10);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: d.getMonth() === month,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [currentDate, month]);

  const activeDays = viewMode === "MONTH" ? monthDays : weekDays;

  // Group events by YYYY-MM-DD
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const key = new Date(evt.date).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(evt);
    }
    return map;
  }, [events]);

  // Group conflicts by YYYY-MM-DD
  const conflictsByDay = useMemo(() => {
    const map = new Map<string, CalendarConflictHint[]>();
    for (const c of conflicts) {
      const key = new Date(c.date).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [conflicts]);

  const eventTypeStyles: Record<
    CalendarEventType,
    { label: string; bg: string; text: string; border: string; icon: string }
  > = {
    TASK: {
      label: "Task",
      bg: "bg-emerald-950/70",
      text: "text-emerald-300",
      border: "border-emerald-800/50",
      icon: "✓",
    },
    DELIVERABLE: {
      label: "Deliverable",
      bg: "bg-sky-950/70",
      text: "text-sky-300",
      border: "border-sky-800/50",
      icon: "📦",
    },
    MILESTONE: {
      label: "Milestone",
      bg: "bg-purple-950/70",
      text: "text-purple-300",
      border: "border-purple-800/50",
      icon: "🏁",
    },
    CLIENT_REVIEW: {
      label: "Client Review",
      bg: "bg-amber-950/70",
      text: "text-amber-300",
      border: "border-amber-800/50",
      icon: "👁️",
    },
    SOCIAL_POST: {
      label: "Social Post",
      bg: "bg-pink-950/70",
      text: "text-pink-300",
      border: "border-pink-800/50",
      icon: "📱",
    },
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
       * 1. HEADER & CONTROL BAR
       * ===================================================================== */}
      <div className="bg-zinc-900/90 border border-zinc-850 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-bold uppercase tracking-wider">
                Work-Aware Timeline
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Unified Cross-Campaign Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Agency Master Schedule
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Unified schedule of task due dates, deliverable deadlines, milestones, review windows, and social publications.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Personal vs Team Scope Toggle */}
            <div className="flex p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
              <button
                onClick={() => setScope("PERSONAL")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  scope === "PERSONAL"
                    ? "bg-zinc-800 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                👤 My Work
              </button>
              <button
                onClick={() => setScope("TEAM")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  scope === "TEAM"
                    ? "bg-emerald-500 text-zinc-950 font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                🏢 Agency Wide
              </button>
            </div>

            {/* ICS Feed Export Button */}
            <button
              onClick={handleOpenIcsModal}
              className="px-3 py-1.5 text-xs font-semibold bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-lg transition-colors flex items-center gap-1.5"
              title="Subscribe or export calendar in Apple/Google Calendar (ICS)"
            >
              <span>📅</span>
              <span>Sync ICS</span>
            </button>

            {/* Month / Week View Toggle */}
            <div className="flex p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
              <button
                onClick={() => setViewMode("MONTH")}
                className={`px-2.5 py-1.5 rounded-md font-medium ${
                  viewMode === "MONTH" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("WEEK")}
                className={`px-2.5 py-1.5 rounded-md font-medium ${
                  viewMode === "WEEK" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Client */}
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
            >
              <option value="ALL">🏢 All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filter by Project */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
            >
              <option value="ALL">📁 All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Filter by Member */}
            {scope === "TEAM" && (
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
              >
                <option value="ALL">👥 All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {/* Filter by Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
            >
              <option value="ALL">All Event Types</option>
              <option value="TASK">✓ Tasks</option>
              <option value="DELIVERABLE">📦 Deliverables</option>
              <option value="MILESTONE">🏁 Milestones</option>
              <option value="CLIENT_REVIEW">👁️ Client Reviews</option>
              <option value="SOCIAL_POST">📱 Social Posts</option>
            </select>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition-colors"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white font-mono text-[11px]"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition-colors"
            >
              →
            </button>
            <span className="font-semibold text-white text-sm ml-1">
              {monthName} {year}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
       * 2. CONFLICT WATCHLIST BANNER (Plain deterministic rules)
       * ===================================================================== */}
      {conflicts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-zinc-900 border border-amber-600/50 rounded-2xl p-4 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200 font-mono">
                  Capacity & Sequencing Conflicts ({conflicts.length})
                </h3>
                <p className="text-[11px] text-zinc-300">
                  Automated plain-rule conflict checks detect potential schedule bottlenecks and broken sequences.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40 font-semibold">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {conflicts.slice(0, 6).map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded-lg bg-zinc-950/80 border border-amber-800/40 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                      c.severity === "CRITICAL"
                        ? "bg-rose-950 text-rose-300 border border-rose-800/50"
                        : "bg-amber-950 text-amber-300 border border-amber-800/50"
                    }`}
                  >
                    {c.type.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(c.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-white truncate">{c.title}</div>
                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{c.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
       * 3. CALENDAR GRID (Month & Week Views)
       * ===================================================================== */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-950/70 text-center py-2.5 text-[11px] font-mono uppercase text-zinc-400 font-semibold">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-800/60 bg-zinc-900/30">
          {activeDays.map((d) => {
            const dayEvents = eventsByDay.get(d.dateStr) || [];
            const dayConflicts = conflictsByDay.get(d.dateStr) || [];

            return (
              <div
                key={d.dateStr}
                className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                  !d.isCurrentMonth && viewMode === "MONTH" ? "bg-zinc-950/40 opacity-40" : "bg-zinc-900/40"
                } ${d.isToday ? "ring-1 ring-inset ring-emerald-500/60 bg-emerald-950/10" : ""}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                      d.isToday
                        ? "bg-emerald-500 text-zinc-950 font-bold"
                        : d.isCurrentMonth
                        ? "text-zinc-200"
                        : "text-zinc-500"
                    }`}
                  >
                    {d.date.getDate()}
                  </span>

                  {dayConflicts.length > 0 && (
                    <span
                      title={`${dayConflicts.length} conflict(s) detected`}
                      className="text-[10px] font-mono px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/40 animate-pulse font-bold"
                    >
                      ⚠️ {dayConflicts.length}
                    </span>
                  )}
                </div>

                {/* Events list */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[140px] pr-0.5 scrollbar-thin">
                  {dayEvents.map((evt) => {
                    const style = eventTypeStyles[evt.type];
                    return (
                      <button
                        key={`${evt.type}-${evt.id}`}
                        onClick={() => setActiveEvent(evt)}
                        className={`w-full text-left p-1 rounded border text-[10px] transition-all block truncate ${style.bg} ${style.text} ${style.border} hover:scale-[1.02] shadow-sm`}
                      >
                        <span className="mr-1">{style.icon}</span>
                        <span className="font-medium">{evt.title}</span>
                      </button>
                    );
                  })}
                </div>

                {dayEvents.length === 0 && (
                  <div className="text-[10px] text-zinc-600 font-mono py-4 text-center select-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
       * 4. EVENT DETAIL MODAL
       * ===================================================================== */}
      {activeEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                    eventTypeStyles[activeEvent.type].bg
                  } ${eventTypeStyles[activeEvent.type].text} ${eventTypeStyles[activeEvent.type].border}`}
                >
                  {eventTypeStyles[activeEvent.type].icon} {activeEvent.type.replace("_", " ")}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{activeEvent.title}</h3>
              </div>
              <button
                onClick={() => setActiveEvent(null)}
                className="text-zinc-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-mono">Date / Due:</span>
                <span className="font-mono text-zinc-200">
                  {new Date(activeEvent.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {activeEvent.clientName && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-mono">Client:</span>
                  <span className="font-medium text-white">{activeEvent.clientName}</span>
                </div>
              )}
              {activeEvent.projectName && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-mono">Project:</span>
                  <span className="font-medium text-sky-300">{activeEvent.projectName}</span>
                </div>
              )}
              {activeEvent.assignee && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-mono">Assignee / Owner:</span>
                  <span className="font-medium text-white">{activeEvent.assignee.name}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-mono">Status:</span>
                <span className="font-mono uppercase text-emerald-400 font-semibold">
                  {activeEvent.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {activeEvent.projectId && (
                <Link
                  href={`/app/projects/${activeEvent.projectId}`}
                  className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold"
                >
                  Open Project →
                </Link>
              )}
              {activeEvent.type === "SOCIAL_POST" && (
                <Link
                  href="/app/social"
                  className="px-3 py-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-400 text-xs font-semibold"
                >
                  Open Social Hub →
                </Link>
              )}
              <button
                onClick={() => setActiveEvent(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * 5. ICS FEED EXPORT MODAL
       * ===================================================================== */}
      {showIcsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="text-base font-bold text-white">Subscribe via iCalendar (ICS)</h3>
              </div>
              <button
                onClick={() => setShowIcsModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Sync your assigned deliverables, tasks, and social posts directly with{" "}
              <strong>Apple Calendar</strong>, <strong>Google Calendar</strong>, or <strong>Outlook</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                Your Private Calendar Feed URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={icsFeedUrl || "Generating feed URL..."}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyIcs}
                  className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shrink-0 transition-transform active:scale-95"
                >
                  {copyingIcs ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
              <a
                href={icsFeedUrl || "/api/calendar/ics"}
                download="karyalaya-calendar.ics"
                className="text-xs text-sky-400 hover:text-sky-300 underline font-medium"
              >
                📥 Download .ics file directly
              </a>
              <button
                onClick={() => setShowIcsModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
