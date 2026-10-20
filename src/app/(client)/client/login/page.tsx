"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorParam ? decodeURIComponent(errorParam) : "");
  const [sentLink, setSentLink] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setSentLink(null);

    try {
      const res = await fetch("/api/client/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate magic link.");
      }

      setSentLink(data.magicLinkUrl);
      setRecipientName(data.name || "Client");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      {/* Ambient Radial Backdrop Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,rgba(56,189,248,0.06)_40%,transparent_70%)] blur-[60px] pointer-events-none"
      />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Portal Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black font-extrabold text-xl shadow-lg shadow-emerald-500/20 mb-2">
            KL
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Client Portal Access</h1>
          <p className="text-xs text-zinc-400">
            Passwordless magic link authentication for client review & approvals
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0b101d]/80 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {sentLink ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center text-xl">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Magic Link Ready</h3>
                <p className="text-xs text-zinc-300">
                  Welcome back, <span className="text-emerald-400 font-semibold">{recipientName}</span>. Your secure access link is generated below.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <a
                  href={sentLink}
                  className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl font-medium text-xs bg-emerald-400 hover:bg-emerald-300 text-black shadow-lg shadow-emerald-500/20 transition-all font-semibold"
                >
                  Enter Client Portal →
                </a>

                <p className="text-[11px] text-zinc-500">
                  Valid for 24 hours. Single-use session security.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSentLink(null)}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="contact@clientcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-emerald-400 hover:bg-emerald-300 text-black disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                {loading ? "Verifying contact..." : "Send Magic Link →"}
              </button>

              <div className="pt-4 border-t border-zinc-800/80 text-center">
                <p className="text-[11px] text-zinc-500">
                  Are you an agency team member?{" "}
                  <Link href="/login" className="text-zinc-300 hover:text-white underline">
                    Internal Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
