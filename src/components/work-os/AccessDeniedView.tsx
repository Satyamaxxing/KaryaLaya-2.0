import React from "react";
import Link from "next/link";

interface AccessDeniedProps {
  role: string;
  pathname?: string;
}

export function AccessDeniedView({ role, pathname }: AccessDeniedProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "2.5rem 2rem",
          backgroundColor: "var(--kl-surface-1, #0a101d)",
          border: "1px solid var(--kl-border-card, rgba(255, 255, 255, 0.08))",
          borderRadius: "1rem",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            backgroundColor: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.35)",
            color: "#f43f5e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            fontWeight: 800,
          }}
        >
          403
        </div>

        <div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            You don&apos;t have access
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--kl-text-muted, rgba(255, 255, 255, 0.6))",
              lineHeight: 1.6,
            }}
          >
            Your current role (<strong style={{ color: "#38bdf8" }}>{role}</strong>) does not have
            permission to access this section
            {pathname ? <code> {pathname}</code> : ""}.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <Link
            href="/app/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              backgroundColor: "var(--kl-surface-3, #141f36)",
              border: "1px solid var(--kl-border-subtle, rgba(56, 139, 253, 0.25))",
              borderRadius: "0.5rem",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 140ms ease",
            }}
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
