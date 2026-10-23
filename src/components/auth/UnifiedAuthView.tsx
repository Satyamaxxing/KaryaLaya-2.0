"use client";

import React, { useState, useEffect } from "react";
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
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");

  const [isNewUser, setIsNewUser] = useState(initialMode === "signup");
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [oauthConfigNotice, setOauthConfigNotice] = useState<{
    provider: string;
    message: string;
  } | null>(null);

  const [showDemoSeeds, setShowDemoSeeds] = useState(false);

  useEffect(() => {
    if (urlError) {
      if (urlError === "google_not_configured") {
        setOauthConfigNotice({
          provider: "Google",
          message:
            "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.",
        });
      } else if (urlError === "github_not_configured") {
        setOauthConfigNotice({
          provider: "GitHub",
          message:
            "GitHub OAuth is not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your .env file.",
        });
      } else {
        setError(decodeURIComponent(urlError));
      }
    }
  }, [urlError]);

  // Validate email format
  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  // Quick Demo Account Helper
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setShowPasswordStep(true);
    setShowForgotPassword(false);
    setIsNewUser(false);
    setError(null);
    setOauthConfigNotice(null);
  };

  // Step 1: "Continue With Email"
  const handleContinueWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOauthConfigNotice(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setCheckingEmail(true);

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (data.exists) {
        setIsNewUser(false);
        if (data.name) {
          setName(data.name);
        }
      } else {
        // If initialMode was signup or email not found, guide to account creation
        setIsNewUser(true);
      }

      setShowPasswordStep(true);
      setShowForgotPassword(false);
    } catch {
      // Fallback: proceed to password step
      setShowPasswordStep(true);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Step 2: Final Submit (Login or Signup)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (isNewUser && password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (isNewUser) {
        // Register new workspace
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agencyName: agencyName.trim() || `${name.trim() || "My"}'s Agency`,
            name: name.trim() || cleanEmail.split("@")[0],
            email: cleanEmail,
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to create account. Please try again.");
        }

        window.location.href = "/app/dashboard";
      } else {
        // Existing user login
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Authentication failed. Check your credentials.");
        }

        const userRole = data.user?.role;
        let targetUrl = getDefaultRedirectForRole(userRole);

        if (
          nextParam &&
          nextParam.startsWith("/") &&
          !nextParam.startsWith("//") &&
          !nextParam.includes("\\")
        ) {
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

  // Real OAuth Flow (Google & GitHub)
  const handleOAuthClick = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    setError(null);
    setOauthConfigNotice(null);

    try {
      const res = await fetch(`/api/auth/oauth/${provider}?next=${encodeURIComponent(nextParam || "/app")}`, {
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.configured === false) {
        setOauthConfigNotice({
          provider: provider === "google" ? "Google" : "GitHub",
          message:
            data.message ||
            `${provider === "google" ? "Google" : "GitHub"} OAuth is not configured. Missing environment credentials.`,
        });
        setSocialLoading(null);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Direct browser navigation
        window.location.href = `/api/auth/oauth/${provider}?next=${encodeURIComponent(nextParam || "/app")}`;
      }
    } catch {
      window.location.href = `/api/auth/oauth/${provider}?next=${encodeURIComponent(nextParam || "/app")}`;
    }
  };

  // Forgot Password Request
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Password reset request failed.");
      }

      setSuccessMessage(
        data.message || "Password reset instructions have been generated."
      );

      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Execution
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!resetToken) {
      setError("Missing reset token. Please request a new link.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccessMessage("Password successfully reset! You can now sign in.");
      setPassword(newPassword);
      setResetToken(null);
      setShowForgotPassword(false);
      setShowPasswordStep(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout" data-lenis-prevent="true">
      {/* =========================================================================
          MOBILE-ONLY HEADER: Clean logo & Home link (Centered on Mobile)
          ========================================================================= */}
      <header className="auth-mobile-header" aria-label="Mobile Navigation">
        <Link
          href="/"
          className="auth-brand-link"
          aria-label="KaryaLaya Home"
        >
          <div className="auth-brand-glyph">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <path d="M17.5 14v7M14 17.5h7" />
            </svg>
          </div>
          <span className="auth-brand-name">KaryaLaya</span>
        </Link>

        <Link href="/" className="auth-home-btn" aria-label="Return to Homepage">
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
      </header>

      {/* =========================================================================
          LEFT PANEL (Desktop): 50% split, Dark Charcoal, Silky Curved Artwork, Brand & Testimonial
          ========================================================================= */}
      <aside className="auth-left-pane" aria-label="KaryaLaya Testimonials & Showcase">
        {/* Top-Left: KaryaLaya Branding */}
        <div style={{ position: "relative", zIndex: 20 }}>
          <Link
            href="/"
            className="auth-brand-link"
            aria-label="KaryaLaya Home"
          >
            <div className="auth-brand-glyph-desktop">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M17.5 14v7M14 17.5h7" />
              </svg>
            </div>
            <span className="auth-brand-name-desktop">KaryaLaya</span>
          </Link>
        </div>

        {/* Dynamic Curved Line Artwork Canvas */}
        <AuthWaveCanvas />

        {/* Bottom-Left: Anchored Testimonial Rotator */}
        <AuthTestimonials />
      </aside>

      {/* =========================================================================
          RIGHT PANEL: Pure Black, Home Link, Vertically & Horizontally Centered Content
          ========================================================================= */}
      <main className="auth-right-pane" data-lenis-prevent="true">
        {/* Desktop Top Bar: < Home link */}
        <div className="auth-desktop-topbar">
          <Link
            href="/"
            className="auth-home-btn"
            aria-label="Return to Homepage"
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

        {/* Centered Authentication Form Card */}
        <div className="auth-form-card">
          {/* Header Line & Supporting Line: Centered horizontally on mobile & desktop */}
          <div className="auth-heading-container">
            <h1 className="auth-heading-title">
              {showForgotPassword
                ? "Reset Your Password"
                : showPasswordStep
                ? isNewUser
                  ? "Join KaryaLaya"
                  : "Welcome Back"
                : "Sign In or Join Now!"}
            </h1>
            <p className="auth-heading-subtitle">
              {showForgotPassword
                ? "Enter your email to receive recovery instructions."
                : showPasswordStep
                ? isNewUser
                  ? "Complete your workspace details to get started."
                  : "Enter your password to continue to your workspace."
                : "login or create your karyalaya account."}
            </p>
          </div>

          {/* OAuth Missing Credentials Notice */}
          {oauthConfigNotice && (
            <div className="auth-notice-box" role="alert">
              <div className="auth-notice-title">
                ⚙️ {oauthConfigNotice.provider} OAuth Setup Required
              </div>
              <p className="auth-notice-desc">{oauthConfigNotice.message}</p>
              <div className="auth-notice-keys">
                Required in <code>.env</code>:
                <br />
                {oauthConfigNotice.provider === "Google" ? (
                  <>
                    <code>GOOGLE_CLIENT_ID</code>
                    <br />
                    <code>GOOGLE_CLIENT_SECRET</code>
                  </>
                ) : (
                  <>
                    <code>GITHUB_CLIENT_ID</code>
                    <br />
                    <code>GITHUB_CLIENT_SECRET</code>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="auth-alert-error" role="alert">
              {error}
            </div>
          )}

          {/* Success Notification */}
          {successMessage && (
            <div className="auth-alert-success" role="status">
              {successMessage}
            </div>
          )}

          {/* Redirection indicator if next param present */}
          {nextParam && !showForgotPassword && (
            <div className="auth-alert-info">
              Sign in to access <strong>{nextParam}</strong>
            </div>
          )}

          {/* =========================================================================
              VIEW A: Initial State (OAuth buttons + Continue with Email)
              ========================================================================= */}
          {!showPasswordStep && !showForgotPassword && (
            <div className="auth-step-container" style={{ width: "100%" }}>
              {/* Social Auth Buttons (Google & GitHub - Apple completely removed) */}
              <div className="auth-oauth-group">
                {/* Google Button */}
                <button
                  type="button"
                  id="google-login-btn"
                  onClick={() => handleOAuthClick("google")}
                  disabled={loading || !!socialLoading || checkingEmail}
                  className="auth-oauth-btn"
                  aria-label="Continue with Google"
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
                  <span>
                    {socialLoading === "google"
                      ? "Connecting to Google..."
                      : "Continue with Google"}
                  </span>
                </button>

                {/* GitHub Button */}
                <button
                  type="button"
                  id="github-login-btn"
                  onClick={() => handleOAuthClick("github")}
                  disabled={loading || !!socialLoading || checkingEmail}
                  className="auth-oauth-btn"
                  aria-label="Continue with GitHub"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#18181b">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>
                    {socialLoading === "github"
                      ? "Connecting to GitHub..."
                      : "Continue with GitHub"}
                  </span>
                </button>
              </div>

              {/* Divider: OR with fine line */}
              <div className="auth-divider-container">
                <div className="auth-divider-line" />
                <span className="auth-divider-badge">OR</span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleContinueWithEmail} className="auth-form-body">
                <label htmlFor="auth-email-input" className="auth-field-label">
                  Enter your email address to sign in or create an account
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-prefix">@</span>
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
                    disabled={checkingEmail}
                  />
                </div>

                <button
                  type="submit"
                  id="continue-with-email-btn"
                  disabled={checkingEmail || !email.trim()}
                  className="auth-submit-btn"
                >
                  {checkingEmail ? "Checking account..." : "Continue With Email"}
                </button>
              </form>
            </div>
          )}

          {/* =========================================================================
              VIEW B: Password / Registration Step
              ========================================================================= */}
          {showPasswordStep && !showForgotPassword && (
            <form onSubmit={handleFinalSubmit} className="auth-step-container auth-form-body">
              {/* Email Pill with Change Action */}
              <div className="auth-email-pill">
                <span className="auth-email-pill-text">{email}</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordStep(false);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="auth-email-change-btn"
                >
                  Change
                </button>
              </div>

              {/* New Workspace Registration Fields */}
              {isNewUser && (
                <div className="auth-field-group">
                  <div>
                    <label htmlFor="auth-name-input" className="auth-field-label">
                      Your Full Name
                    </label>
                    <div className="auth-input-wrapper">
                      <input
                        id="auth-name-input"
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
                    <label htmlFor="auth-agency-input" className="auth-field-label">
                      Agency / Workspace Name
                    </label>
                    <div className="auth-input-wrapper">
                      <input
                        id="auth-agency-input"
                        type="text"
                        required
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder="e.g. Apex Creative Studio"
                        className="auth-input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="auth-password-wrapper">
                <div className="auth-password-label-row">
                  <label htmlFor="auth-password-input" className="auth-field-label">
                    {isNewUser ? "Create Password" : "Password"}
                  </label>
                  {!isNewUser && (
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="auth-forgot-btn"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <input
                    id="auth-password-input"
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
                {isNewUser && (
                  <span className="auth-helper-text">Must be at least 8 characters long</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="auth-submit-btn"
                disabled={loading || !password}
                className="auth-submit-btn"
              >
                {loading
                  ? "Authenticating..."
                  : isNewUser
                  ? "Create Workspace Account →"
                  : "Sign In to Workspace →"}
              </button>

              {/* Toggle Login / Register mode manually */}
              <div className="auth-mode-switch">
                {isNewUser ? (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewUser(false);
                        setError(null);
                      }}
                      className="auth-mode-toggle"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    New to KaryaLaya?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewUser(true);
                        setError(null);
                      }}
                      className="auth-mode-toggle"
                    >
                      Create an account
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}

          {/* =========================================================================
              VIEW C: Forgot Password / Reset Password View
              ========================================================================= */}
          {showForgotPassword && (
            <div className="auth-step-container auth-form-body">
              {!resetToken ? (
                <form onSubmit={handleForgotPasswordSubmit} className="auth-form-body">
                  <label htmlFor="auth-reset-email" className="auth-field-label">
                    Enter the email associated with your account
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-prefix">@</span>
                    <input
                      id="auth-reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="auth-input-field"
                    />
                  </div>
                  <button
                    type="submit"
                    id="request-reset-btn"
                    disabled={loading || !email.trim()}
                    className="auth-submit-btn"
                  >
                    {loading ? "Generating Instructions..." : "Send Reset Instructions"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="auth-form-body">
                  <label htmlFor="auth-new-password" className="auth-field-label">
                    Enter your new password (min. 8 characters)
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      id="auth-new-password"
                      type="password"
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="auth-input-field"
                    />
                  </div>
                  <button
                    type="submit"
                    id="confirm-reset-btn"
                    disabled={loading || newPassword.length < 8}
                    className="auth-submit-btn"
                  >
                    {loading ? "Updating Password..." : "Set New Password & Sign In"}
                  </button>
                </form>
              )}

              <button
                type="button"
                id="back-to-login-btn"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetToken(null);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="auth-back-btn"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Terms of Service & Privacy Policy Footer */}
          <footer className="auth-legal-footer">
            By clicking continue, you agree to our{" "}
            <Link href="/terms" className="auth-legal-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="auth-legal-link">
              Privacy Policy
            </Link>
            .
          </footer>

          {/* Quick Demo Accounts Drawer */}
          <div className="auth-demo-section">
            <button
              type="button"
              id="quick-demo-toggle-btn"
              onClick={() => setShowDemoSeeds((prev) => !prev)}
              className="auth-demo-toggle"
              aria-expanded={showDemoSeeds}
            >
              <span>⚡ {showDemoSeeds ? "Hide Quick Demo Accounts" : "Quick Demo Accounts"}</span>
            </button>

            {showDemoSeeds && (
              <div className="auth-demo-chips">
                <button
                  type="button"
                  id="demo-owner-btn"
                  onClick={() => handleQuickLogin("meera@karyalaya.agency")}
                  className="auth-seed-chip auth-seed-owner"
                >
                  👑 Owner (Meera)
                </button>
                <button
                  type="button"
                  id="demo-manager-btn"
                  onClick={() => handleQuickLogin("rohan@karyalaya.agency")}
                  className="auth-seed-chip auth-seed-manager"
                >
                  👔 Manager (Rohan)
                </button>
                <button
                  type="button"
                  id="demo-member-btn"
                  onClick={() => handleQuickLogin("satyam@karyalaya.agency")}
                  className="auth-seed-chip auth-seed-member"
                >
                  ⚡ Member (Satyam)
                </button>
                <button
                  type="button"
                  id="demo-client-btn"
                  onClick={() => handleQuickLogin("sarah@brightwave.com")}
                  className="auth-seed-chip auth-seed-client"
                >
                  🏢 Client (Sarah)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Spacer for balanced viewport centering */}
        <div className="auth-bottom-spacer" aria-hidden="true" />
      </main>
    </div>
  );
}
