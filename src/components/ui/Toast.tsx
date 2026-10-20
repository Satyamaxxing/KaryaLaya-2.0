"use client";

import React, { useState, createContext, useContext, useCallback } from "react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "info" | "warning";
}

interface ToastContextType {
  toast: (options: { title: string; description?: string; variant?: "success" | "info" | "warning" }) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    ({ title, description, variant = "success" }: { title: string; description?: string; variant?: "success" | "info" | "warning" }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setMessages((prev) => [...prev, { id, title, description, variant }]);

      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, 3500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="kl-toast-container"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: "var(--z-toast, 70)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          pointerEvents: "none",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              pointerEvents: "auto",
              backgroundColor: "var(--kl-surface-0, #FFFFFF)",
              border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
              borderRadius: "var(--kl-radius-lg, 20px)",
              padding: "0.85rem 1.25rem",
              boxShadow: "var(--kl-shadow-lg, 0 20px 60px rgba(0, 0, 0, 0.08))",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              minWidth: "260px",
              animation: "slideUpFade 200ms cubic-bezier(0.2, 0.7, 0.2, 1)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor:
                  m.variant === "warning"
                    ? "var(--kl-amber, #F59E0B)"
                    : m.variant === "info"
                    ? "var(--kl-indigo, #5B5BD6)"
                    : "var(--kl-emerald, #10B981)",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--kl-text-primary, #0B0B0C)" }}>
                {m.title}
              </span>
              {m.description && (
                <span style={{ fontSize: "11px", color: "var(--kl-text-secondary, #6B6B70)" }}>
                  {m.description}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (options: { title: string; description?: string }) => {
        // Fallback if not inside provider
        if (typeof window !== "undefined") {
          console.log(`[Toast] ${options.title}: ${options.description || ""}`);
        }
      },
    };
  }
  return ctx;
}
