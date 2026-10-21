"use client";

import React, { useState, useEffect } from "react";
import { TeamMemberRosterItem } from "@/server/services/team";

export default function TeamPage() {
  const [roster, setRoster] = useState<TeamMemberRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leave recording modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    userId: "",
    startDate: "",
    endDate: "",
    reason: "Annual Vacation",
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "MEMBER",
    jobTitle: "",
  });
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const fetchRoster = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load team roster");
      }
      const data = await res.json();
      setRoster(data.roster || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/team");
        if (!active) return;
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to load team roster");
        }
        const data = await res.json();
        if (active) setRoster(data.roster || []);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error loading team");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleRecordLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.userId || !leaveForm.startDate || !leaveForm.endDate) return;

    setSubmittingLeave(true);
    try {
      const res = await fetch("/api/team/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to record leave");
      }

      setShowLeaveModal(false);
      setLeaveForm({ userId: "", startDate: "", endDate: "", reason: "Annual Vacation" });
      await fetchRoster();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving leave");
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm("Are you sure you want to cancel this leave record?")) return;
    try {
      const res = await fetch(`/api/team/leave?id=${leaveId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete leave");
      await fetchRoster();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting leave");
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email) return;

    setSubmittingInvite(true);
    setInviteSuccess(null);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to send invitation");
      }

      const data = await res.json();
      setInviteSuccess(`Invitation link generated: ${data.inviteUrl || "Email sent"}`);
      setInviteForm({ email: "", role: "MEMBER", jobTitle: "" });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error inviting member");
    } finally {
      setSubmittingInvite(false);
    }
  };

  // Open leave modal prefilled with user
  const handleOpenLeaveForUser = (userId: string) => {
    setLeaveForm((prev) => ({ ...prev, userId }));
    setShowLeaveModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-56 rounded-xl bg-zinc-900/40 border border-zinc-800" />
          <div className="h-56 rounded-xl bg-zinc-900/40 border border-zinc-800" />
          <div className="h-56 rounded-xl bg-zinc-900/40 border border-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =====================================================================
       * 1. HEADER & ACTIONS
       * ===================================================================== */}
      <div className="bg-zinc-900/90 border border-zinc-850 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40 font-bold uppercase tracking-wider">
                Agency Talent & Workload
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Capacity Tracking & Availability
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Team Roster & Workload
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Monitor specialist capacity, active task loads, weekly hours, and scheduled leaves.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (roster.length > 0) setLeaveForm((prev) => ({ ...prev, userId: roster[0].id }));
                setShowLeaveModal(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>🏖️</span>
              <span>Record Leave</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg shadow-sm transition-all"
            >
              + Invite Member
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-850 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* =====================================================================
       * 2. TEAM MEMBERS GRID
       * ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roster.map((member) => (
          <div
            key={member.id}
            className={`bg-zinc-900/80 border rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between transition-all ${
              member.isCurrentlyOnLeave
                ? "border-rose-800/40 bg-zinc-900/90"
                : member.capacityRating === "HIGH_LOAD"
                ? "border-amber-800/40"
                : "border-zinc-800"
            }`}
          >
            {/* Top info */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white truncate">{member.name}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                      {member.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {member.jobTitle || member.email}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {member.isCurrentlyOnLeave ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40 font-semibold">
                      ON LEAVE
                    </span>
                  ) : member.capacityRating === "HIGH_LOAD" ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 font-semibold">
                      HIGH LOAD
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-semibold">
                      AVAILABLE
                    </span>
                  )}
                </div>
              </div>

              {/* Workload Telemetry Cards */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800/70 text-center">
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850">
                  <div className="text-base font-bold text-white font-mono">{member.openTasksCount}</div>
                  <div className="text-[10px] text-zinc-500 uppercase font-mono">Open Tasks</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850">
                  <div className="text-base font-bold text-emerald-400 font-mono">{member.hoursThisWeek}h</div>
                  <div className="text-[10px] text-zinc-500 uppercase font-mono">This Week</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850">
                  <div
                    className={`text-base font-bold font-mono ${
                      member.overdueTasksCount > 0 ? "text-rose-400" : "text-zinc-400"
                    }`}
                  >
                    {member.overdueTasksCount}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase font-mono">Overdue</div>
                </div>
              </div>

              {/* Active Leave details */}
              {member.currentLeave && (
                <div className="mt-3 p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">On Leave:</span>{" "}
                    {new Date(member.currentLeave.startDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(member.currentLeave.endDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    {member.currentLeave.reason && (
                      <span className="text-rose-300/80 block text-[10px]">{member.currentLeave.reason}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLeave(member.currentLeave!.id)}
                    className="text-rose-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded bg-rose-900/50"
                    title="Cancel leave"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Upcoming Leaves */}
              {member.upcomingLeaves.length > 0 && !member.currentLeave && (
                <div className="mt-3 p-2 rounded-lg bg-zinc-950/60 border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                    Upcoming Leave:
                  </div>
                  {member.upcomingLeaves.slice(0, 2).map((ul) => (
                    <div key={ul.id} className="flex items-center justify-between text-[10px]">
                      <span>
                        {new Date(ul.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} -{" "}
                        {new Date(ul.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {ul.reason ? ` (${ul.reason})` : ""}
                      </span>
                      <button
                        onClick={() => handleDeleteLeave(ul.id)}
                        className="text-zinc-500 hover:text-rose-400"
                        title="Cancel leave"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs">
              <button
                onClick={() => handleOpenLeaveForUser(member.id)}
                className="text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors"
              >
                + Schedule Leave
              </button>
              <span className="text-[10px] font-mono text-zinc-500">{member.email}</span>
            </div>
          </div>
        ))}
      </div>

      {/* =====================================================================
       * 3. RECORD LEAVE MODAL
       * ===================================================================== */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <form
            onSubmit={handleRecordLeave}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏖️</span>
                <h3 className="text-base font-bold text-white">Record Member Leave</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Scheduled leave ranges reduce member capacity on the calendar and display warnings when assigning tasks.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">
                  Team Member
                </label>
                <select
                  value={leaveForm.userId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, userId: e.target.value })}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                >
                  <option value="" disabled>
                    Select member...
                  </option>
                  {roster.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">
                  Leave Reason / Note
                </label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="e.g. Annual Vacation, Conference, Personal"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingLeave}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50"
              >
                {submittingLeave ? "Saving..." : "Confirm Leave"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
       * 4. INVITE MEMBER MODAL
       * ===================================================================== */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <form
            onSubmit={handleInviteSubmit}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✉️</span>
                <h3 className="text-base font-bold text-white">Invite Agency Teammate</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSuccess(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="designer@agency.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  >
                    <option value="MEMBER">MEMBER (Specialist)</option>
                    <option value="MANAGER">MANAGER (Lead)</option>
                    <option value="OWNER">OWNER (Director)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Designer"
                    value={inviteForm.jobTitle}
                    onChange={(e) => setInviteForm({ ...inviteForm, jobTitle: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>
            </div>

            {inviteSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
                {inviteSuccess}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSuccess(null);
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submittingInvite}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50"
              >
                {submittingInvite ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
