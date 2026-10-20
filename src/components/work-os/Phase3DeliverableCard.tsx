"use client";

import React, { useState } from "react";
import {
  DeliverableStatus,
  ServiceType,
  getAllowedNextStatuses,
} from "@/server/services/deliverable-state-machine";
import { RiskExplainerModal } from "@/components/work-os/RiskExplainerModal";
import { TaskBreakdownModal } from "@/components/work-os/TaskBreakdownModal";

export interface Phase3DeliverableData {
  id: string;
  title: string;
  description?: string | null;
  serviceType: ServiceType;
  status: DeliverableStatus;
  progressPercent: number;
  weight: number;
  riskStatus?: "ON_TRACK" | "AT_RISK" | null;
  riskReason?: string | null;
  dueDate?: string | Date | null;
  owner?: {
    id: string;
    name: string;
    email?: string;
  } | null;
}

interface Phase3DeliverableCardProps {
  deliverable: Phase3DeliverableData;
  canManage?: boolean;
  onStatusChange?: (id: string, nextStatus: DeliverableStatus) => Promise<void> | void;
  onTasksCreated?: () => void;
}

export function Phase3DeliverableCard({
  deliverable,
  canManage = false,
  onStatusChange,
  onTasksCreated,
}: Phase3DeliverableCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const allowedNext = getAllowedNextStatuses(deliverable.status);

  const handleTransition = async (nextStatus: DeliverableStatus) => {
    if (!onStatusChange) return;
    setIsUpdating(true);
    setErrorMsg(null);
    try {
      await onStatusChange(deliverable.id, nextStatus);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getServiceTypeBadge = (type: ServiceType) => {
    switch (type) {
      case "WEB_DEV":
        return { label: "Web Dev", bg: "bg-blue-950/80", text: "text-blue-300", border: "border-blue-800/50" };
      case "VIDEO":
        return { label: "Video", bg: "bg-purple-950/80", text: "text-purple-300", border: "border-purple-800/50" };
      case "SOCIAL":
        return { label: "Social", bg: "bg-pink-950/80", text: "text-pink-300", border: "border-pink-800/50" };
      case "BRANDING":
        return { label: "Branding", bg: "bg-amber-950/80", text: "text-amber-300", border: "border-amber-800/50" };
      case "DESIGN":
        return { label: "Design", bg: "bg-emerald-950/80", text: "text-emerald-300", border: "border-emerald-800/50" };
      default:
        return { label: "Other", bg: "bg-zinc-800", text: "text-zinc-300", border: "border-zinc-700" };
    }
  };

  const getStatusBadge = (status: DeliverableStatus) => {
    switch (status) {
      case "NOT_STARTED":
        return { label: "Not Started", bg: "bg-zinc-800", text: "text-zinc-300", border: "border-zinc-700" };
      case "IN_PROGRESS":
        return { label: "In Progress", bg: "bg-sky-950/80", text: "text-sky-300", border: "border-sky-800/50" };
      case "IN_REVIEW":
        return { label: "In Review (Internal)", bg: "bg-amber-950/80", text: "text-amber-300", border: "border-amber-800/50" };
      case "SENT_TO_CLIENT":
        return { label: "Sent to Client", bg: "bg-indigo-950/80", text: "text-indigo-300", border: "border-indigo-800/50" };
      case "REVISION_REQUESTED":
        return { label: "Revision Requested", bg: "bg-rose-950/80", text: "text-rose-300", border: "border-rose-800/50" };
      case "APPROVED":
        return { label: "Approved", bg: "bg-emerald-950/80", text: "text-emerald-300", border: "border-emerald-800/50" };
      case "DELIVERED":
        return { label: "Delivered", bg: "bg-emerald-900/90", text: "text-emerald-200", border: "border-emerald-500/60" };
      default:
        return { label: status, bg: "bg-zinc-800", text: "text-zinc-300", border: "border-zinc-700" };
    }
  };

  const stBadge = getServiceTypeBadge(deliverable.serviceType);
  const statusBadge = getStatusBadge(deliverable.status);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all rounded-xl p-5 shadow-xl relative overflow-hidden group flex flex-col justify-between">
      {/* Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500/40 via-emerald-500/40 to-indigo-500/40" />

      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${stBadge.bg} ${stBadge.text} ${stBadge.border}`}
            >
              {stBadge.label}
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
            >
              {statusBadge.label}
            </span>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs font-mono font-bold text-emerald-400">
              {deliverable.progressPercent}%
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Weight: {deliverable.weight}x
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white group-hover:text-sky-300 transition-colors mb-1.5">
          {deliverable.title}
        </h3>

        {/* Description */}
        {deliverable.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
            {deliverable.description}
          </p>
        )}

        {/* Risk Banner (if AT_RISK) */}
        {deliverable.riskStatus === "AT_RISK" && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 leading-snug">
            <div className="flex items-start gap-1.5 min-w-0">
              <span className="shrink-0">⚠️</span>
              <span className="line-clamp-2">{deliverable.riskReason || "Deliverable is currently at risk"}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRiskModal(true)}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-700/60 text-[10px] font-medium transition-colors"
              title="Explain risk reasoning with real causality chain and evidence links"
            >
              <span>✨</span>
              <span>Why is this at risk?</span>
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800/80 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${deliverable.progressPercent}%` }}
          />
        </div>
      </div>

      <div>
        {errorMsg && (
          <div className="mb-3 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded px-2 py-1">
            {errorMsg}
          </div>
        )}

        {/* Status Transition Control (enforcing allowed state machine) */}
        {canManage && allowedNext.length > 0 && (
          <div className="mb-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-400">Advance Status:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {allowedNext.map((nextSt) => {
                const nextBadge = getStatusBadge(nextSt);
                return (
                  <button
                    key={nextSt}
                    disabled={isUpdating}
                    onClick={() => handleTransition(nextSt)}
                    className="px-2 py-1 text-[11px] font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-colors disabled:opacity-50"
                  >
                    → {nextBadge.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata Footer: Owner, Due Date, AI Breakdown */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/60 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {deliverable.owner ? (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] text-white font-medium">
                  {deliverable.owner.name.charAt(0)}
                </div>
                <span className="text-zinc-300">{deliverable.owner.name}</span>
              </div>
            ) : (
              <span className="text-zinc-500">Unassigned</span>
            )}
            <span className="text-zinc-600">·</span>
            <span>
              {deliverable.dueDate
                ? `Due ${new Date(deliverable.dueDate).toLocaleDateString()}`
                : "No due date"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBreakdownModal(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 transition-colors shadow-sm"
              title="Suggest subtasks using scoped AI"
            >
              <span>✨</span>
              <span>AI Breakdown</span>
            </button>
            <span className="text-[11px] text-zinc-500 font-mono">
              #{deliverable.id.slice(-4)}
            </span>
          </div>
        </div>
      </div>

      {/* AI Modals */}
      <RiskExplainerModal
        deliverableId={deliverable.id}
        deliverableTitle={deliverable.title}
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
      />

      <TaskBreakdownModal
        deliverableId={deliverable.id}
        deliverableTitle={deliverable.title}
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        onTasksCreated={onTasksCreated}
      />
    </div>
  );
}
