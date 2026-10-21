"use client";

import React, { useState } from "react";
import {
  Task,
  Deliverable,
  User,
  PriorityLevel,
  WorkstreamType,
  EntityAudience,
} from "@/types/work-os";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliverables: Record<string, Deliverable>;
  users: Record<string, User>;
  onCreate: (taskData: Partial<Task>) => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  deliverables,
  users,
  onCreate,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliverableId, setDeliverableId] = useState(Object.keys(deliverables)[0] || "del-landing");
  const [assigneeId, setAssigneeId] = useState(Object.keys(users)[0] || "user-satyam");
  const [priority, setPriority] = useState<PriorityLevel>("P1");
  const [workstream, setWorkstream] = useState<WorkstreamType>("WEB");
  const [estimateHours, setEstimateHours] = useState(4);
  const [dueDate, setDueDate] = useState("2026-10-18");
  const [audience, setAudience] = useState<EntityAudience>("INTERNAL");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title,
      description,
      deliverableId,
      assigneeId,
      ownerId: assigneeId,
      priority,
      workstream,
      estimateHours: Number(estimateHours),
      dueDate,
      audience,
      status: "NOT_STARTED",
    });

    onClose();
    setTitle("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4"
        style={{
          maxHeight: "calc(100vh - 2rem)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Finalize interactive hero animations"
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be achieved?"
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Deliverable</label>
              <select
                value={deliverableId}
                onChange={(e) => setDeliverableId(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
              >
                {Object.values(deliverables).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.workstream})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
              >
                {Object.values(users).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.jobTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
              >
                <option value="P0">P0 · Urgent</option>
                <option value="P1">P1 · High</option>
                <option value="P2">P2 · Medium</option>
                <option value="P3">P3 · Low</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Workstream</label>
              <select
                value={workstream}
                onChange={(e) => setWorkstream(e.target.value as WorkstreamType)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
              >
                <option value="WEB">Web Development</option>
                <option value="VIDEO">Video Editing</option>
                <option value="SOCIAL">Social Media</option>
                <option value="BRAND">Personal Branding</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Estimate (Hours)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={estimateHours}
                onChange={(e) => setEstimateHours(Number(e.target.value))}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as EntityAudience)}
                className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-200"
              >
                <option value="INTERNAL">Internal Only (Default)</option>
                <option value="CLIENT_VISIBLE">Client-Visible</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-lg shadow-md"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
