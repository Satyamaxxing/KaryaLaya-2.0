"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import {
  canAccessRoute,
  getDefaultRedirectForRole,
} from "@/lib/permissions/route-permissions";
import DataRain from "@/components/ui/data-rain";


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
        backgroundColor: "#000000",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "clamp(1.5rem, 4vw, 3.5rem) 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Instant-load High-Priority Celestial Saturn Cosmos Background */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/saturn-cosmos-bg.webp"
          alt="Celestial Saturn Cosmos Landscape Background"
          fill
          priority
          quality={88}
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center center",
          }}
        />
        {/* Subtle vignette darkening for enhanced depth and content contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.45) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Interactive DataRain Starfall & Flow Canvas */}
      <DataRain palette={{ calm: "#9ca3af", mid: "#cbd5e1", hot: "#f1f5f9" }} />


      <style>{`
        @keyframes floatKeyAnim {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            filter: drop-shadow(0 10px 16px rgba(15, 23, 42, 0.35));
          }
          50% {
            transform: translateY(-13px) rotate(-1.5deg);
            filter: drop-shadow(0 22px 28px rgba(15, 23, 42, 0.22));
          }
        }
        @keyframes ambientPulse {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.85;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }
        .floating-key-layer {
          animation: floatKeyAnim 3.8s ease-in-out infinite;
          will-change: transform;
        }
        .login-grid-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .login-grid-container {
            grid-template-columns: 460px 1fr;
            gap: 3.5rem;
          }
        }
      `}</style>

      {/* Main Grid Wrapper */}
      <div className="login-grid-container">

        {/* Left Column: Interactive Login Card */}
        <div
          style={{
            width: "100%",
            backgroundColor: "rgba(10, 16, 29, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "1.25rem",
            padding: "clamp(1.5rem, 5vw, 2.5rem) clamp(1.25rem, 5vw, 2rem)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                textDecoration: "none",
                marginBottom: "1.1rem",
              }}
            >
              <div
                style={{
                  width: "2.1rem",
                  height: "2.1rem",
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
                  fontSize: "1.3rem",
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
                  padding: "0.65rem 0.85rem",
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
                  padding: "0.65rem 0.85rem",
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
                transition: "background 180ms ease, transform 150ms ease",
              }}
            >
              {loading ? "Authenticating..." : "Sign In to Workspace →"}
            </button>
          </form>

          {/* Quick Sign In for Demo Accounts */}
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

          <div style={{ textAlign: "center", fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div>
              Client partner?{" "}
              <Link href="/client/login" style={{ color: "#38bdf8", textDecoration: "underline" }}>
                Client Portal Magic Link →
              </Link>
            </div>
            <div>
              Don&apos;t have a workspace?{" "}
              <Link href="/signup" style={{ color: "#10b981", fontWeight: 600, textDecoration: "none" }}>
                Sign up free →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Showcase with CSS Keyframe Floating Animation */}
        <div
          className="hidden lg:flex"
          style={{
            flexDirection: "column",
            gap: "1.25rem",
            justifyContent: "center",
          }}
        >
          {/* Header pill badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              width: "fit-content",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                boxShadow: "0 0 8px #10b981",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#34d399",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Enterprise Security &amp; Access Gate
            </span>
          </div>

          <div>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                color: "#ffffff",
                marginBottom: "0.5rem",
                textShadow: "0 2px 16px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 0, 0, 0.7)",
              }}
            >
              Unified control for your team, deliverables, and client sign-offs.
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.6,
                maxWidth: "520px",
                textShadow: "0 1px 8px rgba(0, 0, 0, 0.8)",
              }}
            >
              End-to-end access governance designed exclusively for digital agencies, video editors, designers, and web developers.
            </p>
          </div>

          {/* Animated Illustration Window Frame */}
          <div
            style={{
              position: "relative",
              borderRadius: "1.25rem",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "#0d131f",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.08)",
            }}
          >
            {/* Window Ribbon Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.65rem 1rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(10, 16, 29, 0.95)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#10b981" }} />
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono, monospace)",
                  color: "rgba(255, 255, 255, 0.45)",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  padding: "0.15rem 0.75rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>🔒</span>
                <span>karyalaya.work/auth/secure-workspace</span>
              </div>
              <div style={{ width: "30px" }} />
            </div>

            {/* Illustration Canvas with CSS Keyframe Floating Key Animation */}
            <div
              style={{
                position: "relative",
                width: "100%",
                backgroundColor: "#ffffff",
                overflow: "hidden",
              }}
            >
              {/* Base Graphic: Characters & Login Window */}
              <img
                src="/images/login-base.png"
                alt="KaryaLaya Workspace Access Graphic"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />

              {/* Layer 2: Floating Animated Key with CSS Keyframes */}
              <img
                src="/images/login-key-floating.png"
                alt="Floating Security Key"
                className="floating-key-layer"
                style={{
                  position: "absolute",
                  left: "36.13%",
                  top: "6.86%",
                  width: "43.46%",
                  height: "auto",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* 3 Trust Callout Badges with Frosted Glass Backdrop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.85rem",
            }}
          >
            <div
              style={{
                padding: "0.85rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(10, 16, 29, 0.75)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div style={{ color: "#34d399", fontSize: "13px", fontWeight: 700, marginBottom: "0.2rem" }}>
                256-Bit Vault
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", lineHeight: 1.4 }}>
                Zero-knowledge encrypted client files &amp; deliverables
              </div>
            </div>

            <div
              style={{
                padding: "0.85rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(10, 16, 29, 0.75)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div style={{ color: "#38bdf8", fontSize: "13px", fontWeight: 700, marginBottom: "0.2rem" }}>
                Role Sandboxing
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", lineHeight: 1.4 }}>
                Granular permissions for owners, leads, and clients
              </div>
            </div>

            <div
              style={{
                padding: "0.85rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(10, 16, 29, 0.75)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700, marginBottom: "0.2rem" }}>
                Magic Link Access
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", lineHeight: 1.4 }}>
                Passwordless 1-click approvals for external clients
              </div>
            </div>
          </div>
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
