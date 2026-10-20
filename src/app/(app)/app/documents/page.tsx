"use client";

import React from "react";
import { useWorkState } from "@/lib/state/work-state-context";
import { AudiencePill } from "@/components/work-os/Badges";

export default function DocumentsPage() {
  const { documents, project, users } = useWorkState();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-sky-400 uppercase tracking-wider mb-1">
            Knowledge Layer (PRD §23)
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Documents & Scope Baselines
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Knowledge tied directly to deliverables, briefs, and client scope agreements.
          </p>
        </div>

        <button className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg">
          + Create Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => {
          const author = users[doc.authorId];

          return (
            <div
              key={doc.id}
              className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    Version {doc.version}
                  </span>
                  {doc.workstream && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {doc.workstream}
                    </span>
                  )}
                </div>
                <AudiencePill audience={doc.clientVisible ? "CLIENT_VISIBLE" : "INTERNAL"} />
              </div>

              <div>
                <h2 className="text-base font-bold text-white mb-1">{doc.title}</h2>
                <div className="text-xs text-zinc-400">Author: {author?.name || "Rohan Varma"}</div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-850 text-xs text-zinc-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {doc.content}
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
