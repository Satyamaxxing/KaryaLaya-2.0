"use client";

import React, { useState } from "react";
import { Deliverable, User } from "@/types/work-os";
import { StatusBadge, AudiencePill } from "./Badges";
import { WorkstreamVisual } from "./WorkstreamVisuals";

interface DeliverableCardProps {
  deliverable: Deliverable;
  owner?: User;
  onApproveAsClient?: (id: string) => void;
  onRequestRevision?: (id: string, feedback: string) => void;
  isClientView?: boolean;
}

export function DeliverableCard({
  deliverable,
  owner,
  onApproveAsClient,
  onRequestRevision,
  isClientView = false,
}: DeliverableCardProps) {
  const [showVersions, setShowVersions] = useState(false);
  const [isRevisionModal, setIsRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");

  const isPendingReview = deliverable.status === "CLIENT_REVIEW";

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 transition-all rounded-xl p-5 shadow-lg relative overflow-hidden group">
      {/* Top Hairline Gradient Accent */}
      <div className="deliverable-card-accent" />

      {/* Top Bar */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded">
              {deliverable.workstream}
            </span>
            <StatusBadge status={deliverable.status} />
            {!isClientView && (
              <AudiencePill audience={deliverable.clientVisible ? "CLIENT_VISIBLE" : "INTERNAL"} />
            )}
          </div>
          <h3 className="text-base font-semibold text-white group-hover:text-sky-300 transition-colors">
            {deliverable.title}
          </h3>
        </div>

        {/* Deliverable Progress Badge */}
        <div className="text-right">
          <div className="text-xs font-mono font-bold text-emerald-400">
            {deliverable.progressPercent}%
          </div>
          <div className="text-[10px] text-zinc-500">
            Weight: {Math.round(deliverable.weight * 100)}%
          </div>
        </div>
      </div>

      {/* Embedded Workstream Visual Asset */}
      <div className="mb-3">
        <WorkstreamVisual workstream={deliverable.workstream} />
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-300 mb-4 line-clamp-2 leading-relaxed">
        {deliverable.description}
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800/80 rounded-full h-1.5 mb-4 overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${deliverable.progressPercent}%` }}
        />
      </div>

      {/* Metadata Row */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2">
          {owner && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] text-white font-medium">
                {owner.name.charAt(0)}
              </div>
              <span className="text-zinc-300">{owner.name}</span>
            </div>
          )}
          <span className="text-zinc-600">·</span>
          <span>Due {deliverable.dueDate}</span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span title="Revision rounds">
            Rev: {deliverable.revisionCount}/{deliverable.revisionBudget}
          </span>
          {deliverable.versions.length > 0 && (
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
            >
              v{deliverable.versions.length}
            </button>
          )}
        </div>
      </div>

      {/* Version History Drawer */}
      {showVersions && deliverable.versions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2 bg-zinc-950/60 -mx-5 -mb-5 p-4 rounded-b-xl">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Version Baseline History:
          </div>
          {deliverable.versions.map((ver) => (
            <div
              key={ver.versionNumber}
              className="p-2 bg-zinc-900/90 border border-zinc-800 rounded text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Version {ver.versionNumber}</span>
                <span className="text-[10px] text-zinc-500">
                  {new Date(ver.submittedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-zinc-300 text-[11px]">{ver.summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action Box if Pending Client Review */}
      {isPendingReview && (
        <div className="mt-4 p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg flex items-center justify-between gap-3">
          <div className="text-xs text-amber-200">
            <span className="font-semibold">Review Request Active:</span> Client sign-off required.
          </div>

          <div className="flex items-center gap-2">
            {onRequestRevision && (
              <button
                onClick={() => setIsRevisionModal(true)}
                className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white border border-zinc-700 rounded hover:bg-zinc-800"
              >
                Request Revision
              </button>
            )}

            {onApproveAsClient && (
              <button
                onClick={() => onApproveAsClient(deliverable.id)}
                className="px-3 py-1 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Approve (Client)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {isRevisionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Request Deliverable Revision</h3>
            <p className="text-xs text-zinc-300">
              Provide specific feedback for the team. This will increment the revision round (Round{" "}
              {deliverable.revisionCount + 1} of {deliverable.revisionBudget}).
            </p>
            <textarea
              rows={3}
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="e.g., Adjust the headline copy and add brand logo on frame 2..."
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsRevisionModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRequestRevision?.(deliverable.id, revisionFeedback);
                  setIsRevisionModal(false);
                }}
                disabled={!revisionFeedback.trim()}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg"
              >
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
