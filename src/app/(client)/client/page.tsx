"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ClientProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  plainStatus: string;
  progressPercent: number;
  dueDate: string | null;
  startDate: string | null;
  clientLastViewedAt: string | null;
  deliverableCount: number;
  pendingApprovalsCount: number;
}

interface PendingDeliverable {
  id: string;
  title: string;
  projectName: string;
  projectId: string;
  serviceType: string;
  dueDate: string | null;
}

interface RecentUpdate {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

interface PortalData {
  agency: { name: string; slug: string };
  client: { id: string; name: string };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    canApprove: boolean;
  };
  projects: ClientProject[];
  pendingDeliverables: PendingDeliverable[];
  recentUpdates: RecentUpdate[];
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(" ")[0] || name;
  if (hour < 12) return `Good morning, ${firstName}`;
  if (hour < 18) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

export default function ClientPortalHomePage() {
  const router = useRouter();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingDeliverableId, setActingDeliverableId] = useState<string | null>(null);

  const loadPortal = async () => {
    try {
      const res = await fetch("/api/client/projects");
      if (res.status === 401) {
        router.push("/client/login");
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load portal data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading portal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/client/login");
  };

  const handleApprove = async (deliverableId: string) => {
    setActingDeliverableId(deliverableId);
    try {
      const res = await fetch(`/api/client/deliverables/${deliverableId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: "Approved via client portal" }),
      });
      if (!res.ok) throw new Error("Approval failed");
      await loadPortal();
    } catch (err) {
      console.error(err);
    } finally {
      setActingDeliverableId(null);
    }
  };

  const handleRequestRevision = async (deliverableId: string) => {
    const feedback = window.prompt("Please describe the requested revisions:");
    if (!feedback || !feedback.trim()) return;

    setActingDeliverableId(deliverableId);
    try {
      const res = await fetch(`/api/client/deliverables/${deliverableId}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim() }),
      });
      if (!res.ok) throw new Error("Revision request failed");
      await loadPortal();
    } catch (err) {
      console.error(err);
    } finally {
      setActingDeliverableId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-300 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-zinc-500">Loading client portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-rose-950 text-rose-400 mx-auto flex items-center justify-center font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-white">Access Notice</h2>
          <p className="text-xs text-zinc-400">{error || "Unable to access portal."}</p>
          <div className="pt-2">
            <Link
              href="/client/login"
              className="inline-block px-4 py-2 text-xs font-semibold bg-emerald-400 text-black rounded-xl hover:bg-emerald-300"
            >
              Sign In Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const avgProgress =
    data.projects.length > 0
      ? Math.round(
          data.projects.reduce((acc, p) => acc + (p.progressPercent || 0), 0) /
            data.projects.length
        )
      : 0;

  const pendingDeliverables = data.pendingDeliverables || [];
  const recentUpdates = data.recentUpdates || [];

  return (
    <div className="min-h-screen bg-[#020408] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Topbar */}
      <header className="h-14 bg-[#050811]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center font-extrabold text-black text-xs shadow-md">
            {data.agency.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              {data.agency.name}
              <span className="text-[10px] font-normal text-zinc-400 px-1.5 py-0.2 rounded bg-white/5 border border-white/10 font-mono">
                Client Portal
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">{data.client.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/client/social"
            className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
          >
            Social
          </Link>
          <button
            onClick={handleLogout}
            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* 1. Header: One line greeting + date */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {getGreeting(data.user.name)}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {todayFormatted} · {data.client.name}
            </p>
          </div>

          {/* Overall Progress Badge */}
          <div className="inline-flex items-center gap-3 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
            <span className="text-xs text-zinc-400">Overall Progress</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {avgProgress}%
            </span>
          </div>
        </header>

        {/* 2. Deliverables Needing My Review */}
        <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                Deliverables Needing Your Review
              </h2>
              <p className="text-[11px] text-zinc-400">
                Ready for sign-off or change requests
              </p>
            </div>
            {pendingDeliverables.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                {pendingDeliverables.length} Action Needed
              </span>
            )}
          </div>

          {pendingDeliverables.length === 0 ? (
            <div className="p-6 text-center bg-zinc-950/50 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-xs text-emerald-400 font-medium">
                ✓ No deliverables currently awaiting your review.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Your agency team will post deliverables here when ready for sign-off.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingDeliverables.map((del) => (
                <div
                  key={del.id}
                  className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-zinc-400">
                      {del.projectName} · {del.serviceType}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {del.title}
                    </div>
                    {del.dueDate && (
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Due: {new Date(del.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {data.user.canApprove ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRequestRevision(del.id)}
                        disabled={actingDeliverableId === del.id}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors"
                      >
                        Request revision
                      </button>
                      <button
                        onClick={() => handleApprove(del.id)}
                        disabled={actingDeliverableId === del.id}
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
                      >
                        {actingDeliverableId === del.id ? "Processing..." : "Approve ✓"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-500 italic">
                      View only account
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Projects Overview */}
        <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Your Projects</h2>
            <span className="text-xs text-zinc-400 font-mono">
              {data.projects.length} Total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.projects.map((p) => (
              <Link
                key={p.id}
                href={`/client/projects/${p.id}`}
                className="block p-4 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-white hover:text-emerald-300 transition-colors">
                    {p.name}
                  </div>
                  <span className="text-[10px] font-mono font-medium text-emerald-400 uppercase">
                    {p.plainStatus}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Progress</span>
                    <span className="font-mono text-white">
                      {p.progressPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 pt-1 flex justify-between">
                  <span>{p.deliverableCount} deliverables</span>
                  <span className="text-emerald-400 font-medium">View details →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Latest Client-Safe Updates */}
        <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">
            Latest Client-Safe Updates
          </h2>

          {recentUpdates.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No recent updates posted yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentUpdates.map((up) => (
                <div
                  key={up.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60 last:border-b-0"
                >
                  <span className="text-zinc-300">{up.description}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {new Date(up.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
