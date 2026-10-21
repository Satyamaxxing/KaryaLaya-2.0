"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import {
  canAccessRoute,
  getDefaultRedirectForRole,
} from "@/lib/permissions/route-permissions";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("meera@karyalaya.agency");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Check your credentials.");
      }

      // Role-based destination redirection
      const userRole = data.user?.role;
      let targetUrl = getDefaultRedirectForRole(userRole);

      // Validate `next` param against permissions for this specific role
      if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.includes("\\")) {
        if (!nextParam.startsWith("/login") && !nextParam.startsWith("/client/login")) {
          if (canAccessRoute(userRole, nextParam)) {
            targetUrl = nextParam;
          }
        }
      }

      // Hard redirect to target path to cleanly mount session cookies
      window.location.href = targetUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--kl-canvas, #020408)",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Background Radial Glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "500px",
          background: "radial-gradient(circle at center, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.06) 40%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "rgba(10, 16, 29, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "1.25rem",
          padding: "clamp(1.5rem, 5vw, 2.75rem) clamp(1.25rem, 5vw, 2.25rem)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.5rem",
                background: "linear-gradient(135deg, #10b981, #38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#000",
                fontSize: "1rem",
              }}
            >
              K
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.25rem",
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              KaryaLaya
            </span>
          </Link>
          <h1
            style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}
          >
            Sign in to Workspace
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", marginTop: "0.35rem" }}>
            The work operating system for modern digital agencies
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(225, 29, 72, 0.12)",
              border: "1px solid rgba(225, 29, 72, 0.35)",
              borderRadius: "0.5rem",
              color: "#fca5a5",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {nextParam && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              backgroundColor: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: "0.5rem",
              color: "#7dd3fc",
              fontSize: "11px",
            }}
          >
            🔒 Sign in to access <strong>{nextParam}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "0.35rem",
              }}
            >
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.com"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                fontSize: "13px",
                backgroundColor: "#0a101d",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "0.5rem",
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <div
              style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}
            >
              <label
                style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255, 255, 255, 0.7)" }}
              >
                Password
              </label>
              <span style={{ fontSize: "11px", color: "#38bdf8", cursor: "pointer" }}>Forgot?</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                fontSize: "13px",
                backgroundColor: "#0a101d",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "0.5rem",
                color: "#fff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: loading ? "#71717a" : "#10b981",
              color: "#080808",
              fontSize: "13px",
              fontWeight: 700,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.5rem",
              transition: "background 180ms ease",
            }}
          >
            {loading ? "Authenticating..." : "Sign In to Workspace →"}
          </button>
        </form>

        {/* Demo/Dev Only Quick Role Selectors */}
        {process.env.NODE_ENV !== "production" && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#0a101d",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "0.5rem",
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 600, color: "#10b981" }}>Quick Sign In (Seed Accounts):</div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setDemoAccount("meera@karyalaya.agency")}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "10px",
                  borderRadius: "4px",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#34d399",
                  cursor: "pointer",
                }}
              >
                👑 Owner (Meera)
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("rohan@karyalaya.agency")}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "10px",
                  borderRadius: "4px",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  color: "#fbbf24",
                  cursor: "pointer",
                }}
              >
                👔 Manager (Rohan)
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("satyam@karyalaya.agency")}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "10px",
                  borderRadius: "4px",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  backgroundColor: "rgba(56, 189, 248, 0.12)",
                  color: "#38bdf8",
                  cursor: "pointer",
                }}
              >
                ⚡ Member (Satyam)
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("sarah@brightwave.com")}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "10px",
                  borderRadius: "4px",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                  backgroundColor: "rgba(168, 85, 247, 0.12)",
                  color: "#c084fc",
                  cursor: "pointer",
                }}
              >
                🏢 Client (Sarah)
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
          Client partner?{" "}
          <Link href="/client/login" style={{ color: "#38bdf8", textDecoration: "underline" }}>
            Client Portal Magic Link →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#010307",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading workspace...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
