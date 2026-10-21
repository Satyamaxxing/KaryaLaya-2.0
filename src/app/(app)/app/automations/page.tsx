"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AutomationTriggerType,
  AutomationActionType,
} from "@/server/services/automations";

interface AutomationRunItem {
  id: string;
  ruleId: string;
  triggerType: string;
  status: "SUCCESS" | "FAILURE" | "RETRYING" | "SKIPPED";
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string | null;
  executedAt: string;
  errorReason?: string | null;
  contextSnapshot?: string | null;
}

interface AutomationRuleItem {
  id: string;
  name: string;
  description?: string | null;
  triggerType: AutomationTriggerType;
  triggerConfig?: any;
  actionType: AutomationActionType;
  actionConfig: any;
  enabled: boolean;
  requiresApproval: boolean;
  isApproved: boolean;
  owner?: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string } | null;
  runs: AutomationRunItem[];
  createdAt: string;
}

const TRIGGER_LABELS: Record<AutomationTriggerType, { label: string; desc: string; icon: string }> = {
  TASK_MOVED_TO_REVIEW: {
    label: "Task Moved to Review",
    desc: "Fires when an internal task status moves to IN_REVIEW",
    icon: "🔍",
  },
  DELIVERABLE_SENT_TO_CLIENT: {
    label: "Deliverable Sent to Client",
    desc: "Fires when a deliverable is sent to the client review window",
    icon: "📤",
  },
  CLIENT_APPROVED: {
    label: "Client Approved Deliverable",
    desc: "Fires immediately when a client signs off on a deliverable",
    icon: "✅",
  },
  CLIENT_REQUESTED_REVISION: {
    label: "Client Requested Revision",
    desc: "Fires when a client flags changes or requests deliverable revision",
    icon: "🔄",
  },
  DUE_DATE_APPROACHING: {
    label: "Due Date Approaching",
    desc: "Fires 24-48h before a task or milestone deadline",
    icon: "⏳",
  },
  POST_APPROVED: {
    label: "Social Post Approved",
    desc: "Fires when a scheduled social asset is approved for publishing",
    icon: "📱",
  },
};

const ACTION_LABELS: Record<AutomationActionType, { label: string; icon: string }> = {
  NOTIFY_USER_OR_ROLE: { label: "Notify User or Role", icon: "🔔" },
  CREATE_TASK: { label: "Create Action Task", icon: "📋" },
  CHANGE_ASSIGNEE: { label: "Change Assignee", icon: "👤" },
  CHANGE_PRIORITY: { label: "Change Priority", icon: "🔥" },
  POST_COMMENT: { label: "Post Discussion Comment", icon: "💬" },
  SEND_CLIENT_REMINDER: { label: "Send Client Reminder", icon: "✉️" },
};

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "needs-approval" | "history">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ ruleId: string; result: any } | null>(null);
  const [retryingInProgress, setRetryingInProgress] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form state for rule creation
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTrigger, setFormTrigger] = useState<AutomationTriggerType>("CLIENT_REQUESTED_REVISION");
  const [formAction, setFormAction] = useState<AutomationActionType>("CREATE_TASK");
  const [formTaskTitle, setFormTaskTitle] = useState("Turnaround: {deliverableTitle}");
  const [formPriority, setFormPriority] = useState("HIGH");
  const [formAssignToOwner, setFormAssignToOwner] = useState(true);
  const [formEstimateHours, setFormEstimateHours] = useState("4");
  const [formNotifyRole, setFormNotifyRole] = useState("MANAGER");
  const [formNotifyTitle, setFormNotifyTitle] = useState("Important workflow update");
  const [formNotifyMessage, setFormNotifyMessage] = useState("Review required for {deliverableTitle}");
  const [formCommentText, setFormCommentText] = useState("Automated status check passed.");
  const [formCommentVisibility, setFormCommentVisibility] = useState<"INTERNAL" | "CLIENT_VISIBLE">("INTERNAL");
  const [formClientSubject, setFormClientSubject] = useState("Reminder: Deliverable waiting for review");
  const [formClientMessage, setFormClientMessage] = useState("Your deliverable is waiting for your approval on the portal.");

  const loadRules = useCallback(async () => {
    try {
      const res = await fetch("/api/automations");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load automations");
      }
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err: any) {
      setError(err.message || "Failed to load automations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/automations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load automations");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setRules(data.rules || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Failed to load automations");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleToggleRule(ruleId: string, currentEnabled: boolean) {
    try {
      const res = await fetch(`/api/automations/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to toggle rule");
      }
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentEnabled } : r))
      );
      setActionMessage(`Rule ${!currentEnabled ? "enabled" : "disabled"} successfully.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleApproveRule(ruleId: string) {
    try {
      const res = await fetch(`/api/automations/${ruleId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to approve rule");
      }
      await loadRules();
      setActionMessage("Rule approved for client-facing execution.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleRunTest(ruleId: string) {
    try {
      setTestResult(null);
      const res = await fetch(`/api/automations/${ruleId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            deliverableTitle: "Brand Identity v2.0",
            taskTitle: "Design Homepage Wireframes",
            clientName: "Acme Corp",
          },
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to run test");
      }
      const json = await res.json();
      setTestResult({ ruleId, result: json.result });
      await loadRules();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleProcessRetries() {
    try {
      setRetryingInProgress(true);
      const res = await fetch("/api/automations/retry", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to process retries");
      setActionMessage(
        json.processedCount > 0
          ? `Processed ${json.processedCount} queued retry jobs.`
          : "No pending retry jobs needed backoff processing right now."
      );
      setTimeout(() => setActionMessage(null), 4000);
      await loadRules();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRetryingInProgress(false);
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    let actionConfig: Record<string, any> = {};
    if (formAction === "CREATE_TASK") {
      actionConfig = {
        taskTitle: formTaskTitle,
        priority: formPriority,
        assignToOwner: formAssignToOwner,
        estimateHours: Number(formEstimateHours) || 4,
      };
    } else if (formAction === "NOTIFY_USER_OR_ROLE") {
      actionConfig = {
        targetRole: formNotifyRole,
        title: formNotifyTitle,
        message: formNotifyMessage,
      };
    } else if (formAction === "CHANGE_PRIORITY") {
      actionConfig = { targetPriority: formPriority };
    } else if (formAction === "POST_COMMENT") {
      actionConfig = {
        comment: formCommentText,
        visibility: formCommentVisibility,
      };
    } else if (formAction === "SEND_CLIENT_REMINDER") {
      actionConfig = {
        templateSubject: formClientSubject,
        message: formClientMessage,
      };
    } else {
      actionConfig = {};
    }

    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          triggerType: formTrigger,
          actionType: formAction,
          actionConfig,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to create rule");
      }

      setIsCreateModalOpen(false);
      setFormName("");
      setFormDescription("");
      setActionMessage("New automation rule configured successfully!");
      setTimeout(() => setActionMessage(null), 3000);
      await loadRules();
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Derive counts and lists
  const pendingApprovalRules = rules.filter((r) => r.requiresApproval && !r.isApproved);
  const activeRulesCount = rules.filter((r) => r.enabled).length;

  const allRuns: Array<AutomationRunItem & { ruleName: string }> = rules.flatMap((r) =>
    (r.runs || []).map((run) => ({ ...run, ruleName: r.name }))
  ).sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());

  const displayedRules =
    activeTab === "needs-approval"
      ? pendingApprovalRules
      : rules;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 rounded-xl bg-zinc-900/50 border border-zinc-800" />
          <div className="h-28 rounded-xl bg-zinc-900/50 border border-zinc-800" />
          <div className="h-28 rounded-xl bg-zinc-900/50 border border-zinc-800" />
        </div>
        <div className="h-80 rounded-xl bg-zinc-900/40 border border-zinc-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-zinc-900/70 border border-rose-900/50 rounded-2xl space-y-4 max-w-lg mx-auto my-12">
        <div className="text-3xl">⚠️</div>
        <h2 className="text-lg font-bold text-white">Automations Restricted</h2>
        <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
        <Link
          href="/app/dashboard"
          className="inline-block px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
        >
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Feedback message */}
      {actionMessage && (
        <div className="p-3 px-4 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-zinc-900/90 border border-zinc-850 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40 font-bold uppercase tracking-wider">
                ⚡ Governed Event Automation
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Deterministic Pipelines • Idempotent Execution
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Agency Automation Rules
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Event-driven background workflows with retry backoffs, client side-effect governance, and audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleProcessRetries}
              disabled={retryingInProgress}
              className="px-3.5 py-2 text-xs font-medium bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              title="Execute pending retry queue with exponential backoff"
            >
              <span>🔄</span>
              <span>{retryingInProgress ? "Processing..." : "Process Retries"}</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-950/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>+</span>
              <span>Create Rule</span>
            </button>
          </div>
        </div>

        {/* Headline Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Configured Rules</div>
            <div className="text-xl font-bold text-white mt-1">{rules.length}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{activeRulesCount} active</div>
          </div>
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Awaiting Approval</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{pendingApprovalRules.length}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Client side-effects</div>
          </div>
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Total Run Executions</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{allRuns.length}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Idempotently logged</div>
          </div>
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Queued Retries</div>
            <div className="text-xl font-bold text-sky-400 mt-1">
              {allRuns.filter((r) => r.status === "RETRYING").length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Exponential backoff</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "all"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          All Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("needs-approval")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "needs-approval"
              ? "bg-amber-950/70 text-amber-200 border border-amber-800/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span>Requires Approval</span>
          {pendingApprovalRules.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-bold">
              {pendingApprovalRules.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "history"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Execution Logs ({allRuns.length})
        </button>
      </div>

      {/* Live Test Run Feedback Toast / Alert */}
      {testResult && (
        <div className="p-4 bg-zinc-900 border border-purple-800/60 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span className="font-bold text-white text-xs">Test Execution Result</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-950 text-purple-300">
                Rule ID: {testResult.ruleId.slice(0, 8)}
              </span>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-zinc-300 font-mono bg-zinc-950 p-3 rounded-lg overflow-x-auto border border-zinc-850">
            {JSON.stringify(testResult.result, null, 2)}
          </div>
        </div>
      )}

      {/* Rules List or History Tab */}
      {activeTab === "history" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Durable Automation Run Logs</h2>
            <span className="text-xs text-zinc-500 font-mono">
              Recorded with actorType: AUTOMATION
            </span>
          </div>

          {allRuns.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-xs text-zinc-500">
              No automation runs recorded yet. Use &ldquo;Run Test&rdquo; on any rule or perform workflow events to trigger pipelines.
            </div>
          ) : (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl divide-y divide-zinc-800 text-xs overflow-hidden">
              {allRuns.map((run) => (
                <div key={run.id} className="p-4 space-y-2 hover:bg-zinc-850/30 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{run.ruleName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          run.status === "SUCCESS"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                            : run.status === "RETRYING"
                            ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                            : run.status === "SKIPPED"
                            ? "bg-zinc-800 text-zinc-400"
                            : "bg-rose-950 text-rose-300 border border-rose-800/40"
                        }`}
                      >
                        {run.status}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Trigger: {run.triggerType}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(run.executedAt).toLocaleString()}
                    </span>
                  </div>

                  {run.errorReason && (
                    <div className="p-2.5 bg-rose-950/40 border border-rose-900/50 rounded-lg text-rose-300 font-mono text-[11px]">
                      Error: {run.errorReason}
                    </div>
                  )}

                  {run.status === "RETRYING" && (
                    <div className="text-[11px] text-amber-300/80 flex items-center gap-2">
                      <span>⏳ Retrying with backoff (attempt {run.retryCount}/{run.maxRetries})</span>
                      {run.nextRetryAt && (
                        <span>Next retry: {new Date(run.nextRetryAt).toLocaleTimeString()}</span>
                      )}
                    </div>
                  )}

                  {run.contextSnapshot && (
                    <div className="text-[11px] text-zinc-400 font-mono bg-zinc-950/60 p-2 rounded border border-zinc-850 truncate">
                      Payload: {run.contextSnapshot}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {activeTab === "needs-approval" ? "Rules Awaiting Manager Approval" : "Configured Rules"}
            </h2>
            <span className="text-xs text-zinc-500">
              {displayedRules.length} rule{displayedRules.length === 1 ? "" : "s"} shown
            </span>
          </div>

          {displayedRules.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-2">
              <div className="text-2xl">⚡</div>
              <p className="text-xs text-zinc-400">
                {activeTab === "needs-approval"
                  ? "No rules currently need manager approval."
                  : "No automation rules configured yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedRules.map((rule) => {
                const trigInfo = TRIGGER_LABELS[rule.triggerType] || {
                  label: rule.triggerType,
                  desc: "",
                  icon: "⚡",
                };
                const actInfo = ACTION_LABELS[rule.actionType] || {
                  label: rule.actionType,
                  icon: "🔧",
                };
                const needsApproval = rule.requiresApproval && !rule.isApproved;

                return (
                  <div
                    key={rule.id}
                    className={`p-5 bg-zinc-900/80 border rounded-xl space-y-4 shadow-lg transition-all ${
                      needsApproval
                        ? "border-amber-700/60 bg-gradient-to-r from-zinc-900 via-amber-950/10 to-zinc-900"
                        : "border-zinc-800"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-base">{rule.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                              rule.enabled
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {rule.enabled ? "ACTIVE" : "PAUSED"}
                          </span>
                          {needsApproval ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/50">
                              ⚠️ Needs Manager Approval
                            </span>
                          ) : rule.requiresApproval && rule.isApproved ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono text-zinc-400 bg-zinc-850">
                              ✓ Approved by {rule.approvedBy?.name || "Manager"}
                            </span>
                          ) : null}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {rule.description}
                          </p>
                        )}
                        <div className="text-[11px] text-zinc-500 flex items-center gap-3 pt-0.5">
                          <span>Owner: {rule.owner?.name || "System"}</span>
                          <span>•</span>
                          <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        {needsApproval && (
                          <button
                            onClick={() => handleApproveRule(rule.id)}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-black rounded-lg shadow transition-all active:scale-95"
                          >
                            Approve Rule
                          </button>
                        )}
                        <button
                          onClick={() => handleRunTest(rule.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <span>⚡</span>
                          <span>Run Test</span>
                        </button>
                        <button
                          onClick={() => handleToggleRule(rule.id, rule.enabled)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                            rule.enabled
                              ? "bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border-zinc-800"
                              : "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800"
                          }`}
                        >
                          {rule.enabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>

                    {/* Rule Logic Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Trigger Box */}
                      <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-850 space-y-1">
                        <div className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1">
                          <span>{trigInfo.icon}</span>
                          <span>Trigger Event</span>
                        </div>
                        <div className="font-semibold text-zinc-200">{trigInfo.label}</div>
                        <div className="text-[11px] text-zinc-400">{trigInfo.desc}</div>
                      </div>

                      {/* Action Box */}
                      <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-850 space-y-1">
                        <div className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1">
                          <span>{actInfo.icon}</span>
                          <span>Deterministic Action</span>
                        </div>
                        <div className="font-semibold text-zinc-200">{actInfo.label}</div>
                        <div className="text-[11px] text-zinc-400 font-mono bg-zinc-900/60 p-1.5 rounded border border-zinc-800/60 truncate">
                          {JSON.stringify(rule.actionConfig)}
                        </div>
                      </div>
                    </div>

                    {/* Recent Runs Mini Strip */}
                    {rule.runs && rule.runs.length > 0 && (
                      <div className="pt-2 border-t border-zinc-850/80 flex items-center justify-between text-[11px] text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-500">Last Execution:</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                              rule.runs[0].status === "SUCCESS"
                                ? "bg-emerald-950 text-emerald-300"
                                : rule.runs[0].status === "RETRYING"
                                ? "bg-amber-950 text-amber-300"
                                : rule.runs[0].status === "SKIPPED"
                                ? "bg-zinc-800 text-zinc-400"
                                : "bg-rose-950 text-rose-300"
                            }`}
                          >
                            {rule.runs[0].status}
                          </span>
                          <span>{new Date(rule.runs[0].executedAt).toLocaleString()}</span>
                          {rule.runs[0].errorReason && (
                            <span className="text-rose-400 italic">
                              ({rule.runs[0].errorReason})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-zinc-500 text-[10px]">
                          {rule.runs.length} runs on record
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Simple Rule Builder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-6"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white">Create Automation Rule</h3>
                <p className="text-xs text-zinc-400">
                  Fixed triggers and governed actions with built-in audit trails.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on deliverable review"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Explains the operational intention of this pipeline..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Trigger Select */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Trigger Event *
                </label>
                <select
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value as AutomationTriggerType)}
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="CLIENT_REQUESTED_REVISION">Client Requested Revision</option>
                  <option value="TASK_MOVED_TO_REVIEW">Task Moved to Review</option>
                  <option value="DELIVERABLE_SENT_TO_CLIENT">Deliverable Sent to Client</option>
                  <option value="CLIENT_APPROVED">Client Approved Deliverable</option>
                  <option value="DUE_DATE_APPROACHING">Due Date Approaching (24h)</option>
                  <option value="POST_APPROVED">Social Post Approved</option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {TRIGGER_LABELS[formTrigger]?.desc}
                </p>
              </div>

              {/* Action Select */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Deterministic Action *
                </label>
                <select
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value as AutomationActionType)}
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="CREATE_TASK">Create Action Task</option>
                  <option value="NOTIFY_USER_OR_ROLE">Notify User or Role</option>
                  <option value="CHANGE_PRIORITY">Change Priority</option>
                  <option value="POST_COMMENT">Post Discussion Comment</option>
                  <option value="SEND_CLIENT_REMINDER">Send Client Reminder</option>
                  <option value="CHANGE_ASSIGNEE">Change Assignee</option>
                </select>
              </div>

              {/* Dynamic Action Configuration */}
              <div className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Action Parameters</div>

                {formAction === "CREATE_TASK" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Task Title (supports {"{deliverableTitle}"})
                      </label>
                      <input
                        type="text"
                        value={formTaskTitle}
                        onChange={(e) => setFormTaskTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Priority</label>
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="URGENT">URGENT</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Hours Estimate</label>
                        <input
                          type="number"
                          value={formEstimateHours}
                          onChange={(e) => setFormEstimateHours(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={formAssignToOwner}
                        onChange={(e) => setFormAssignToOwner(e.target.checked)}
                        className="rounded bg-zinc-900 border-zinc-700"
                      />
                      <span>Assign automatically to deliverable owner</span>
                    </label>
                  </div>
                )}

                {formAction === "NOTIFY_USER_OR_ROLE" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Target Role</label>
                      <select
                        value={formNotifyRole}
                        onChange={(e) => setFormNotifyRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                      >
                        <option value="MANAGER">MANAGER</option>
                        <option value="OWNER">OWNER</option>
                        <option value="MEMBER">MEMBER</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Notification Title</label>
                      <input
                        type="text"
                        value={formNotifyTitle}
                        onChange={(e) => setFormNotifyTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Message Body</label>
                      <input
                        type="text"
                        value={formNotifyMessage}
                        onChange={(e) => setFormNotifyMessage(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                      />
                    </div>
                  </div>
                )}

                {formAction === "CHANGE_PRIORITY" && (
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Target Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                )}

                {formAction === "POST_COMMENT" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Comment Text</label>
                      <textarea
                        rows={2}
                        value={formCommentText}
                        onChange={(e) => setFormCommentText(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Visibility</label>
                      <select
                        value={formCommentVisibility}
                        onChange={(e) =>
                          setFormCommentVisibility(e.target.value as "INTERNAL" | "CLIENT_VISIBLE")
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                      >
                        <option value="INTERNAL">Internal Team Only</option>
                        <option value="CLIENT_VISIBLE">Client Visible (External)</option>
                      </select>
                    </div>
                  </div>
                )}

                {formAction === "SEND_CLIENT_REMINDER" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Email / Alert Subject</label>
                      <input
                        type="text"
                        value={formClientSubject}
                        onChange={(e) => setFormClientSubject(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Message Body</label>
                      <textarea
                        rows={2}
                        value={formClientMessage}
                        onChange={(e) => setFormClientMessage(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Side Effect Governance Alert */}
              {(formAction === "SEND_CLIENT_REMINDER" ||
                (formAction === "POST_COMMENT" && formCommentVisibility === "CLIENT_VISIBLE")) && (
                <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Client Side-Effect Governance</span>
                  </div>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    This rule will communicate directly with external clients. In accordance with safety rules,
                    it will require manager approval before executing in production.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg active:scale-95 transition-all"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
