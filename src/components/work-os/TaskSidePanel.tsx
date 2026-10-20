"use client";

import React, { useState, useEffect } from "react";
import { CommentThread } from "./CommentThread";
import { FileAssetManager } from "./FileAssetManager";
import { AssigneeWorkloadHelper } from "./AssigneeWorkloadHelper";

export interface TaskDetailData {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  estimateHours?: number | null;
  loggedHours?: number;
  order?: number;
  progressNote?: string | null;
  isRevisionRequested?: boolean;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  project?: {
    id: string;
    name: string;
    client?: { id: string; name: string };
  } | null;
  deliverable?: {
    id: string;
    title: string;
    serviceType: string;
  } | null;
  subtasks?: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
  blockedBy?: Array<{
    id: string;
    blockingTask: {
      id: string;
      title: string;
      status: string;
    };
  }>;
  blocking?: Array<{
    id: string;
    dependentTask: {
      id: string;
      title: string;
      status: string;
    };
  }>;
}

interface TaskSidePanelProps {
  task: TaskDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
  canEdit?: boolean;
}

export function TaskSidePanel({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  canEdit = true,
}: TaskSidePanelProps) {
  const [prevTaskId, setPrevTaskId] = useState<string | null>(task?.id ?? null);
  const [status, setStatus] = useState<string>(task?.status ?? "TODO");
  const [priority, setPriority] = useState<string>(task?.priority ?? "MEDIUM");
  const [progressNote, setProgressNote] = useState<string>(task?.progressNote || "");
  const [loggedHours, setLoggedHours] = useState<number>(task?.loggedHours || 0);
  const [hoursToAdd, setHoursToAdd] = useState<string>("");
  const [description, setDescription] = useState<string>(task?.description || "");
  const [isRevisionRequested, setIsRevisionRequested] = useState<boolean>(Boolean(task?.isRevisionRequested));
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; isCompleted: boolean }>>(
    task?.subtasks || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [panelTab, setPanelTab] = useState<"details" | "files" | "discussion">("details");

  const [assignee, setAssignee] = useState(task?.assignee || null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email?: string; role: string }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.members) {
          setTeamMembers(data.members.map((m: any) => m.user));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (task && task.id !== prevTaskId) {
    setPrevTaskId(task.id);
    setStatus(task.status);
    setPriority(task.priority);
    setAssignee(task.assignee || null);
    setProgressNote(task.progressNote || "");
    setLoggedHours(task.loggedHours || 0);
    setDescription(task.description || "");
    setIsRevisionRequested(Boolean(task.isRevisionRequested));
    setSubtasks(task.subtasks || []);
  }

  if (!isOpen || !task) return null;

  const handleUpdate = async (overrides: Partial<TaskDetailData> = {}) => {
    setSaving(true);
    try {
      const payload: any = {
        status,
        priority,
        progressNote: progressNote.trim() || null,
        description: description.trim() || null,
        loggedHours,
        isRevisionRequested,
        ...overrides,
      };

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }

      onTaskUpdated?.();
    } catch (err: any) {
      alert(err.message || "Failed to save task update");
    } finally {
      setSaving(false);
    }
  };

  const handleAddHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const add = parseFloat(hoursToAdd);
    if (isNaN(add) || add <= 0) return;

    const newTotal = Number((loggedHours + add).toFixed(1));
    setLoggedHours(newTotal);
    setHoursToAdd("");
    await handleUpdate({ loggedHours: newTotal });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubtasks([...subtasks, data.subtask]);
        setNewSubtaskTitle("");
        onTaskUpdated?.();
      }
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });

      if (res.ok) {
        setSubtasks(
          subtasks.map((st) => (st.id === subtaskId ? { ...st, isCompleted } : st))
        );
        onTaskUpdated?.();
      }
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
      if (res.ok) {
        setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
        onTaskUpdated?.();
      }
    } catch (err) {
      console.error("Failed to delete subtask:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {task.deliverable && (
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                    {task.deliverable.serviceType} · {task.deliverable.title}
                  </span>
                )}
                {isRevisionRequested && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50 flex items-center gap-1">
                    <span>⚠️</span> Revision Requested
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{task.title}</h2>
              {task.project && (
                <div className="text-xs text-zinc-400 mt-0.5">
                  Project: {task.project.name}
                  {task.project.client && ` (${task.project.client.name})`}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Quick Controls Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-zinc-950/70 border border-zinc-850 p-4 rounded-xl text-xs">
            {/* Status */}
            <div>
              <label className="text-zinc-500 font-medium block mb-1">Status</label>
              <select
                disabled={!canEdit}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  handleUpdate({ status: e.target.value as any });
                }}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-zinc-500 font-medium block mb-1">Priority</label>
              <select
                disabled={!canEdit}
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  handleUpdate({ priority: e.target.value as any });
                }}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-zinc-500 font-medium block mb-1">Due Date</label>
              <div className="text-zinc-200 py-1.5 font-mono text-[11px]">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
              </div>
            </div>
          </div>

          {/* Assignee & Workload Helper */}
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Assignee & Workload</span>
              <span className="text-[10px] text-zinc-500 font-mono">Live capacity check</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                {assignee ? (assignee.name?.[0]?.toUpperCase() || "U") : "?"}
              </div>
              <div className="flex-1">
                {canEdit ? (
                  <select
                    value={assignee?.id || ""}
                    onChange={(e) => {
                      const newId = e.target.value;
                      const found = teamMembers.find((m) => m.id === newId);
                      setAssignee(found ? { id: found.id, name: found.name, email: found.email } : null);
                      handleUpdate({ assigneeId: newId || null } as any);
                    }}
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Unassigned (Open task)</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email} ({m.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm font-medium text-white">
                    {assignee?.name || "Unassigned"}
                  </div>
                )}
              </div>
            </div>
            {assignee?.id && (
              <div className="pt-1">
                <AssigneeWorkloadHelper
                  memberId={assignee.id}
                  targetDueDate={task.dueDate ? String(task.dueDate) : null}
                />
              </div>
            )}
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 text-xs">
            <button
              type="button"
              onClick={() => setPanelTab("details")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                panelTab === "details"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Details & Progress
            </button>
            <button
              type="button"
              onClick={() => setPanelTab("files")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                panelTab === "files"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <span>📁</span> Files & Attachments
            </button>
            <button
              type="button"
              onClick={() => setPanelTab("discussion")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                panelTab === "discussion"
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <span>💬</span> Discussion & Mentions
            </button>
          </div>

          {/* TAB 1: DETAILS */}
          {panelTab === "details" && (
            <div className="space-y-6">
              {/* Logged Hours Tracker */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white">Logged Work Hours</span>
                    <div className="text-[11px] text-zinc-400">
                      Track actual effort toward this deliverable.
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      {loggedHours}h
                    </span>
                    {task.estimateHours && (
                      <span className="text-zinc-500 text-xs font-mono"> / {task.estimateHours}h</span>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <form onSubmit={handleAddHours} className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder="+ Add hours (e.g. 1.5)"
                      value={hoursToAdd}
                      onChange={(e) => setHoursToAdd(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg"
                    >
                      Log Hours
                    </button>
                  </form>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Task Scope & Details</label>
                <textarea
                  disabled={!canEdit}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed instructions, links, or specifications..."
                  className="w-full p-3 text-xs bg-zinc-950 border border-zinc-850 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Progress Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Latest Progress Note</label>
                <input
                  disabled={!canEdit}
                  type="text"
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="e.g. Completed initial mockups; waiting on client brand kit logo."
                  className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-850 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Checklist / Subtasks */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Checklist / Subtasks ({subtasks.filter((s) => s.isCompleted).length}/{subtasks.length})
                  </span>
                </div>

                <div className="space-y-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="p-2.5 bg-zinc-950/70 border border-zinc-850 rounded-lg flex items-center justify-between gap-3 text-xs group"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={st.isCompleted}
                          onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                          className="w-3.5 h-3.5 accent-emerald-500 rounded"
                        />
                        <span
                          className={`text-zinc-200 ${
                            st.isCompleted ? "line-through text-zinc-500" : ""
                          }`}
                        >
                          {st.title}
                        </span>
                      </label>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteSubtask(st.id)}
                          className="text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="+ Add checklist item..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
                    >
                      Add
                    </button>
                  </form>
                )}
              </div>

              {/* Dependencies Block */}
              {((task.blockedBy && task.blockedBy.length > 0) ||
                (task.blocking && task.blocking.length > 0)) && (
                <div className="p-4 bg-zinc-950/70 border border-zinc-850 rounded-xl space-y-3 text-xs">
                  <div className="font-semibold text-white">Task Dependencies</div>

                  {task.blockedBy && task.blockedBy.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-zinc-400 font-mono uppercase">
                        Blocked By (Prerequisites):
                      </div>
                      {task.blockedBy.map((dep) => (
                        <div
                          key={dep.id}
                          className="p-2 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between"
                        >
                          <span className="text-zinc-200">{dep.blockingTask.title}</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              dep.blockingTask.status === "DONE"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                                : "bg-rose-950 text-rose-300 border border-rose-800/40"
                            }`}
                          >
                            {dep.blockingTask.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {task.blocking && task.blocking.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                      <div className="text-[11px] text-zinc-400 font-mono uppercase">
                        Blocking (Downstream Tasks):
                      </div>
                      {task.blocking.map((dep) => (
                        <div
                          key={dep.id}
                          className="p-2 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between"
                        >
                          <span className="text-zinc-200">{dep.dependentTask.title}</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {dep.dependentTask.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FILES & ATTACHMENTS */}
          {panelTab === "files" && (
            <div className="p-1">
              <FileAssetManager
                taskId={task.id}
                deliverableId={task.deliverable?.id}
                canUpload={true}
                canManageVisibility={canEdit}
              />
            </div>
          )}

          {/* TAB 3: DISCUSSION & MENTIONS */}
          {panelTab === "discussion" && (
            <div className="p-1">
              <CommentThread
                taskId={task.id}
                deliverableId={task.deliverable?.id}
                title="Task Discussion"
                canPost={true}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {canEdit && (
          <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
            <button
              onClick={() => handleUpdate()}
              disabled={saving}
              className="w-full py-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Task Updates"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
