"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthWaveCanvas from "./AuthWaveCanvas";
import AuthTestimonials from "./AuthTestimonials";
import {
  canAccessRoute,
  getDefaultRedirectForRole,
} from "@/lib/permissions/route-permissions";

interface UnifiedAuthViewProps {
  initialMode?: "login" | "signup";
}

export default function UnifiedAuthView({ initialMode = "login" }: UnifiedAuthViewProps) {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [isNewUser, setIsNewUser] = useState(initialMode === "signup");
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showDemoSeeds, setShowDemoSeeds] = useState(false);

  // Validate email format
  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  // Quick Demo Account Helper
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setShowPasswordStep(true);
    setIsNewUser(false);
    setError(null);
  };

  // Step 1: "Continue With Email"
  const handleContinueWithEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const knownSeeds = [
      "meera@karyalaya.agency",
      "rohan@karyalaya.agency",
      "satyam@karyalaya.agency",
      "sarah@brightwave.com",
    ];

    if (knownSeeds.includes(email.trim().toLowerCase())) {
      setPassword("password123");
      setIsNewUser(false);
    }

    setShowPasswordStep(true);
  };

  // Step 2: Final Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isNewUser) {
        // Register new workspace
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agencyName: agencyName.trim() || "My Agency Workspace",
            name: name.trim() || email.split("@")[0],
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to create account. Please try again.");
        }

        window.location.href = "/app";
      } else {
        // Existing user login
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Authentication failed. Check your credentials.");
        }

        const userRole = data.user?.role;
        let targetUrl = getDefaultRedirectForRole(userRole);

        if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.includes("\\")) {
          if (!nextParam.startsWith("/login") && !nextParam.startsWith("/client/login")) {
            if (canAccessRoute(userRole, nextParam)) {
              targetUrl = nextParam;
            }
          }
        }

        window.location.href = targetUrl;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  };

  // Social OAuth click with instant demo fallback
  const handleSocialClick = (provider: string) => {
    setSocialLoading(provider);
    setError(null);
    setTimeout(() => {
      setEmail("meera@karyalaya.agency");
      setPassword("password123");
      setShowPasswordStep(true);
      setSocialLoading(null);
    }, 450);
  };

  return (
    <div className="auth-split-layout" data-lenis-prevent="true">
        {/* =========================================================================
            MOBILE-ONLY HEADER: Clean logo & Home link
            ========================================================================= */}
        <div className="auth-mobile-header">
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              color: "#ffffff",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "5px",
                border: "1.5px solid #ffffff",
                padding: "2px",
                boxSizing: "border-box",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M17.5 14v7M14 17.5h7" />
              </svg>
            </div>
            <span style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.03em" }}>
              KaryaLaya
            </span>
          </Link>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13.5px",
              color: "#d4d4d8",
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Home</span>
          </Link>
        </div>

        {/* =========================================================================
            LEFT PANEL (Desktop): 50% split, Dark Charcoal, Silky Curved Artwork, Brand & Testimonial
            ========================================================================= */}
        <div className="auth-left-pane">
          {/* Top-Left: KaryaLaya Branding */}
          <div style={{ position: "relative", zIndex: 20 }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "#ffffff",
              }}
              aria-label="KaryaLaya Home"
            >
              {/* Reference 4-Square Plus Glyph */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  border: "1.8px solid #ffffff",
                  padding: "3px",
                  boxSizing: "border-box",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <path d="M17.5 14v7M14 17.5h7" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                }}
              >
                KaryaLaya
              </span>
            </Link>
          </div>

          {/* Dynamic Curved Line Artwork Canvas (Silky 60fps undulation from reference contact sheet) */}
          <AuthWaveCanvas />

          {/* Bottom-Left: Anchored Testimonial Rotator */}
          <AuthTestimonials />
        </div>

        {/* =========================================================================
            RIGHT PANEL: 50% split, Pure Black, Home Link, Vertically Centered Form
            ========================================================================= */}
        <div className="auth-right-pane" data-lenis-prevent="true">
          {/* Top Bar: < Home link (Exact 1:1 match with screenshot top-left) */}
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                color: "#d4d4d8",
                textDecoration: "none",
                fontWeight: 400,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Home</span>
            </Link>
          </div>

          {/* Centered Authentication Form */}
          <div className="auth-form-card">
            {/* Title & Subtitle */}
            <h1
              style={{
                fontSize: "clamp(26px, 2.3vw, 30px)",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.035em",
                margin: "0 0 6px 0",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Sign In or Join Now!
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#71717a",
                margin: "0 0 22px 0",
                textAlign: "center",
                fontWeight: 400,
              }}
            >
              login or create your karyalaya account.
            </p>

            {/* Error Notification */}
            {error && (
              <div
                style={{
                  width: "100%",
                  marginBottom: "16px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(225, 29, 72, 0.12)",
                  border: "1px solid rgba(225, 29, 72, 0.35)",
                  color: "#fca5a5",
                  fontSize: "12.5px",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                {error}
              </div>
            )}

            {/* Redirection indicator */}
            {nextParam && (
              <div
                style={{
                  width: "100%",
                  marginBottom: "14px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  color: "#7dd3fc",
                  fontSize: "12px",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                Sign in to access <strong>{nextParam}</strong>
              </div>
            )}

            {/* Social Auth Buttons (3 Pill Buttons) */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "9px" }}>
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialClick("Google")}
                disabled={loading || !!socialLoading}
                className="auth-oauth-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#18181b"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#18181b"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#18181b"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#18181b"
                  />
                </svg>
                <span>{socialLoading === "Google" ? "Connecting to Google..." : "Continue with Google"}</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => handleSocialClick("Apple")}
                disabled={loading || !!socialLoading}
                className="auth-oauth-btn"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#18181b">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.72-.86 2.75 1 .08 2.02-.5 2.57-1.25z" />
                </svg>
                <span>{socialLoading === "Apple" ? "Connecting to Apple..." : "Continue with Apple"}</span>
              </button>

              {/* GitHub Button */}
              <button
                type="button"
                onClick={() => handleSocialClick("GitHub")}
                disabled={loading || !!socialLoading}
                className="auth-oauth-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#18181b">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>{socialLoading === "GitHub" ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
              </button>
            </div>

            {/* Divider: OR with fine line */}
            <div style={{ position: "relative", width: "100%", margin: "18px 0", textAlign: "center" }}>
              <div style={{ position: "absolute", inset: "0 0 0 0", display: "flex", alignItems: "center" }}>
                <div style={{ width: "100%", borderTop: "1px solid #1f1f23" }} />
              </div>
              <span
                style={{
                  position: "relative",
                  backgroundColor: "#000000",
                  padding: "0 10px",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  color: "#71717a",
                  textTransform: "uppercase",
                }}
              >
                OR
              </span>
            </div>

            {/* Email Form */}
            {!showPasswordStep ? (
              <form onSubmit={handleContinueWithEmail} className="auth-step-container" style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <label
                  htmlFor="auth-email-input"
                  style={{
                    fontSize: "12.5px",
                    color: "#a1a1aa",
                    textAlign: "left",
                    width: "100%",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Enter your email address to sign in or create an account
                </label>

                {/* Email Input Field */}
                <div className="auth-input-wrapper">
                  <span style={{ fontFamily: "monospace", fontSize: "15px", color: "#71717a", marginRight: "10px", userSelect: "none" }}>
                    @
                  </span>
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="auth-input-field"
                  />
                </div>

                {/* Continue With Email Button */}
                <button type="submit" className="auth-submit-btn">
                  Continue With Email
                </button>
              </form>
            ) : (
              <form onSubmit={handleFinalSubmit} className="auth-step-container" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Email pill with change action */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "#0d0d10",
                    border: "1px solid #27272a",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#ffffff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordStep(false)}
                    style={{ background: "none", border: "none", color: "#38bdf8", fontSize: "11.5px", cursor: "pointer" }}
                  >
                    Change
                  </button>
                </div>

                {/* New Workspace Fields if registering */}
                {isNewUser && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#a1a1aa", marginBottom: "4px" }}>
                        Your Full Name
                      </label>
                      <div className="auth-input-wrapper" style={{ height: "40px" }}>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Alex Morgan"
                          className="auth-input-field"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#a1a1aa", marginBottom: "4px" }}>
                        Agency / Workspace Name
                      </label>
                      <div className="auth-input-wrapper" style={{ height: "40px" }}>
                        <input
                          type="text"
                          required
                          value={agencyName}
                          onChange={(e) => setAgencyName(e.target.value)}
                          placeholder="e.g. Apex Creative Studio"
                          className="auth-input-field"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password field */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "12px", color: "#a1a1aa" }}>
                      {isNewUser ? "Create Password" : "Password"}
                    </label>
                    {!isNewUser && (
                      <span style={{ fontSize: "11px", color: "#38bdf8", cursor: "pointer" }}>
                        Forgot?
                      </span>
                    )}
                  </div>
                  <div className="auth-input-wrapper">
                    <input
                      type="password"
                      required
                      autoFocus
                      autoComplete={isNewUser ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="auth-input-field"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="auth-submit-btn">
                  {loading ? "Authenticating..." : isNewUser ? "Create Workspace Account →" : "Sign In to Workspace →"}
                </button>
              </form>
            )}

            {/* Terms of Service & Privacy Policy Footer (Exact 1:1 text & wrapping from reference) */}
            <div
              style={{
                width: "100%",
                marginTop: "24px",
                fontSize: "12px",
                lineHeight: 1.5,
                color: "#71717a",
                textAlign: "left",
              }}
            >
              By clicking continue, you agree to our{" "}
              <Link
                href="/terms"
                style={{
                  color: "#d4d4d8",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Terms of Service
              </Link>{" "}
              and<br />
              <Link
                href="/privacy"
                style={{
                  color: "#d4d4d8",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Privacy Policy
              </Link>
              .
            </div>

            {/* Subtle Seed Accounts / Mode Switch Drawer (Discrete for development convenience) */}
            <div
              style={{
                width: "100%",
                marginTop: "24px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowDemoSeeds((prev) => !prev)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#52525b",
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px",
                }}
              >
                <span>⚡ {showDemoSeeds ? "Hide Quick Demo Accounts" : "Quick Demo Accounts"}</span>
              </button>

              {showDemoSeeds && (
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("meera@karyalaya.agency")}
                    className="auth-seed-chip"
                    style={{ color: "#34d399", borderColor: "rgba(16, 185, 129, 0.35)", backgroundColor: "rgba(16, 185, 129, 0.08)" }}
                  >
                    👑 Owner (Meera)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("rohan@karyalaya.agency")}
                    className="auth-seed-chip"
                    style={{ color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.35)", backgroundColor: "rgba(245, 158, 11, 0.08)" }}
                  >
                    👔 Manager (Rohan)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("satyam@karyalaya.agency")}
                    className="auth-seed-chip"
                    style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.35)", backgroundColor: "rgba(56, 189, 248, 0.08)" }}
                  >
                    ⚡ Member (Satyam)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("sarah@brightwave.com")}
                    className="auth-seed-chip"
                    style={{ color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.35)", backgroundColor: "rgba(168, 85, 247, 0.08)" }}
                  >
                    🏢 Client (Sarah)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Spacer for balanced centering */}
          <div style={{ height: "16px" }} aria-hidden="true" />
        </div>
      </div>
  );
}
