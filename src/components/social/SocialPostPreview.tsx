/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";

interface SocialPostPreviewProps {
  platform: string;
  clientName: string;
  handle?: string;
  caption: string;
  hashtags?: string;
  mediaUrls?: string[];
}

export function SocialPostPreview({
  platform,
  clientName,
  handle,
  caption,
  hashtags,
  mediaUrls,
}: SocialPostPreviewProps) {
  const [activeTab, setActiveTab] = useState(platform.toUpperCase());

  const cleanHandle = handle || `@${clientName.toLowerCase().replace(/\s+/g, "")}`;
  const fullText = `${caption || "Your captivating copy will appear here..."}${
    hashtags ? `\n\n${hashtags}` : ""
  }`;
  const mediaUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : null;

  return (
    <div className="space-y-3">
      {/* Platform Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
        {[
          { key: "INSTAGRAM", name: "Instagram", icon: "📸" },
          { key: "LINKEDIN", name: "LinkedIn", icon: "💼" },
          { key: "TWITTER", name: "X / Twitter", icon: "𝕏" },
          { key: "YOUTUBE", name: "YouTube", icon: "▶" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-1.5 px-2 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab.key
                ? "bg-zinc-800 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Platform Mockup Container */}
      <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 min-h-[360px] flex items-center justify-center">
        {activeTab === "INSTAGRAM" && (
          <div className="w-full max-w-[340px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl text-white text-xs">
            {/* IG Header */}
            <div className="p-3 flex items-center justify-between border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
                  <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center font-bold text-[10px]">
                    {clientName.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-xs leading-none">{cleanHandle}</div>
                  <div className="text-[9px] text-zinc-400 leading-none pt-0.5">Sponsored / Agency Partner</div>
                </div>
              </div>
              <span className="text-zinc-400 text-sm">•••</span>
            </div>

            {/* IG Media Box */}
            <div className="w-full aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-850">
              {mediaUrl ? (
                <img src={mediaUrl} alt="Post asset" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="text-3xl opacity-40">📸</div>
                  <div className="text-[11px] text-zinc-500 font-mono">1080 × 1080 Visual Canvas</div>
                </div>
              )}
            </div>

            {/* IG Actions & Caption */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-base text-zinc-200">
                <div className="flex items-center gap-3">
                  <span>♡</span>
                  <span>💬</span>
                  <span>↗</span>
                </div>
                <span>🔖</span>
              </div>
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold mr-1.5">{cleanHandle}</span>
                <span className="text-zinc-300 whitespace-pre-wrap">{fullText}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "LINKEDIN" && (
          <div className="w-full max-w-[360px] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl text-white text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-md bg-sky-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                {clientName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{clientName}</div>
                <div className="text-[10px] text-zinc-400">12,450 followers · Promoted</div>
                <div className="text-[9px] text-zinc-500">Just now · 🌐</div>
              </div>
              <span className="text-zinc-400 text-xs">•••</span>
            </div>

            <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">{fullText}</p>

            {mediaUrl && (
              <div className="w-full h-44 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                <img src={mediaUrl} alt="Asset" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
              <span className="flex items-center gap-1 hover:text-sky-400 cursor-pointer">👍 Like</span>
              <span className="flex items-center gap-1 hover:text-sky-400 cursor-pointer">💬 Comment</span>
              <span className="flex items-center gap-1 hover:text-sky-400 cursor-pointer">🔄 Repost</span>
              <span className="flex items-center gap-1 hover:text-sky-400 cursor-pointer">✈ Send</span>
            </div>
          </div>
        )}

        {activeTab === "TWITTER" && (
          <div className="w-full max-w-[340px] bg-black border border-zinc-800 rounded-2xl p-4 shadow-2xl text-white text-xs space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs shrink-0">
                {clientName.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white truncate">{clientName}</span>
                  <span className="text-sky-400 text-[11px]">☑</span>
                  <span className="text-[11px] text-zinc-500 truncate">{cleanHandle}</span>
                </div>
                <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed pt-1">{fullText}</p>

                {mediaUrl && (
                  <div className="w-full h-40 mt-2.5 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-850">
                    <img src={mediaUrl} alt="Asset" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 text-[11px] text-zinc-500">
                  <span>💬 12</span>
                  <span>🔄 34</span>
                  <span>♡ 182</span>
                  <span>📊 1.8K</span>
                  <span>↗</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "YOUTUBE" && (
          <div className="w-full max-w-[340px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl text-white text-xs space-y-2.5">
            <div className="w-full aspect-video bg-zinc-950 flex items-center justify-center relative border-b border-zinc-800">
              {mediaUrl ? (
                <img src={mediaUrl} alt="Asset" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center mx-auto text-base">
                    ▶
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono pt-1">Video Thumbnail 16:9</div>
                </div>
              )}
            </div>

            <div className="p-3 space-y-2">
              <div className="font-bold text-xs text-white leading-snug line-clamp-2">
                {caption ? caption.slice(0, 80) : "Title: High Impact Video Headline"}
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                <span>{clientName}</span>
                <span>•</span>
                <span>4.2K views</span>
                <span>•</span>
                <span>Just uploaded</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
