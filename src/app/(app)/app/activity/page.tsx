"use client";

import React, { useState, useEffect } from "react";
import { useWorkState } from "@/lib/state/work-state-context";

interface RealActivityEvent {
  id: string;
  actorId: string;
  actorType: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  projectId?: string | null;
  description: string;
  metadata?: string | null;
  createdAt: string;
}

export default function ActivityAuditPage() {
  const { activityEvents: mockEvents } = useWorkState();
  const [events, setEvents] = useState<RealActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actorTypeFilter, setActorTypeFilter] = useState<string>("ALL");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("ALL");
  const [actorSearch, setActorSearch] = useState<string>("");

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (actorTypeFilter !== "ALL") params.set("actorType", actorTypeFilter);
      if (entityTypeFilter !== "ALL") params.set("entityType", entityTypeFilter);
      params.set("limit", "100");

      const res = await fetch(`/api/activity?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const params = new URLSearchParams();
        if (actorTypeFilter !== "ALL") params.set("actorType", actorTypeFilter);
        if (entityTypeFilter !== "ALL") params.set("entityType", entityTypeFilter);
        params.set("limit", "100");

        const res = await fetch(`/api/activity?${params.toString()}`);
        if (res.ok && active) {
          const data = await res.json();
          setEvents(data.events || []);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [actorTypeFilter, entityTypeFilter]);

  // Client-side text filter for user / actor name
  const filteredEvents = events.filter((e) => {
    if (!actorSearch.trim()) return true;
    const q = actorSearch.toLowerCase();
    return (
      e.actorName.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Global Activity Audit Trail
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Agency Activity & Event Feed</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Append-only, immutable record of all mutations, file uploads, visibility toggles, and status transitions across the agency.
          </p>
        </div>

        {/* Live indicator & refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live SSE Synced
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchEvents();
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-lg transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Actor Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono">Actor:</span>
            <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
              {["ALL", "INTERNAL", "CLIENT"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActorTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    actorTypeFilter === t
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {t === "ALL" ? "All Actors" : t}
                </button>
              ))}
            </div>
          </div>

          {/* Entity Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono">Entity:</span>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
            >
              <option value="ALL">All Entities</option>
              <option value="PROJECT">Projects</option>
              <option value="DELIVERABLE">Deliverables</option>
              <option value="TASK">Tasks</option>
              <option value="FILE">Files</option>
              <option value="COMMENT">Comments</option>
            </select>
          </div>
        </div>

        {/* User Search Input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by actor or description..."
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl divide-y divide-zinc-800 text-xs shadow-xl overflow-hidden">
        {loading && events.length === 0 ? (
          <div className="p-8 space-y-3">
            <div className="h-14 bg-zinc-950/60 rounded-xl animate-pulse" />
            <div className="h-14 bg-zinc-950/60 rounded-xl animate-pulse" />
            <div className="h-14 bg-zinc-950/60 rounded-xl animate-pulse" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="text-3xl">📜</div>
            <div className="font-semibold text-white">No activity events found</div>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              {actorSearch || actorTypeFilter !== "ALL" || entityTypeFilter !== "ALL"
                ? "Try clearing your filters to see more events."
                : "Activity logs will accumulate as deliverables are created, files uploaded, and comments posted."}
            </p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            let meta: any = null;
            try {
              if (evt.metadata) meta = JSON.parse(evt.metadata);
            } catch (_) {}

            const isClient = evt.actorType === "CLIENT";

            return (
              <div key={evt.id} className="p-4 space-y-2 hover:bg-zinc-850/60 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isClient ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                    />
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isClient
                          ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {evt.actorType}
                    </span>
                    <strong className="text-white">{evt.actorName}</strong>
                    <span className="font-mono text-zinc-500 text-[11px]">
                      {evt.action.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
                    <span className="px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-800">
                      {evt.entityType}
                    </span>
                    <span>{new Date(evt.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Plain-language description */}
                <p className="text-zinc-200 text-xs leading-relaxed font-sans pl-4">
                  {evt.description || `${evt.action} performed on ${evt.entityType}`}
                </p>

                {/* Plain-language Before/After Diff */}
                {meta && (meta.before || meta.after) && (
                  <div className="ml-4 p-2 bg-zinc-950/80 rounded-lg border border-zinc-850 text-[11px] font-mono text-zinc-400 space-y-0.5">
                    {meta.before && (
                      <div className="text-rose-400/90">
                        - Previous: {typeof meta.before === "object" ? JSON.stringify(meta.before) : String(meta.before)}
                      </div>
                    )}
                    {meta.after && (
                      <div className="text-emerald-400/90">
                        + New: {typeof meta.after === "object" ? JSON.stringify(meta.after) : String(meta.after)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
