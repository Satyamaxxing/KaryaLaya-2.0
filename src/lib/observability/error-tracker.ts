"use client";

import { useEffect, useCallback } from "react";

interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, unknown>;
}

/**
 * Checks if remote error tracking is enabled via environment variables.
 * Remains completely disabled by default for local development.
 */
export const isErrorTrackingEnabled = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN ||
    process.env.NEXT_PUBLIC_ERROR_TRACKING_KEY
  );
};

/**
 * Dispatches an exception to the configured telemetry provider if enabled.
 * If disabled (the default), safely logs or ignores.
 */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!isErrorTrackingEnabled()) {
    // Disabled in local-first environment; log in development for awareness
    if (process.env.NODE_ENV === "development") {
      console.warn("[Local ErrorTracker - Inactive (No API Key)]", error, context);
    }
    return;
  }

  const details: ErrorDetails = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  };

  try {
    // Hook for external telemetry provider (e.g. Sentry, PostHog, or custom endpoint)
    const endpoint = process.env.NEXT_PUBLIC_ERROR_TRACKING_DSN;
    if (endpoint) {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        }),
      }).catch(() => {
        // Fallback swallow to prevent cascading telemetry loops
      });
    }
  } catch {
    // Prevent failure in tracker from impacting UX
  }
}

/**
 * React hook for component error monitoring and unhandled error boundary tracking.
 */
export function useErrorTracker(componentName?: string) {
  const isEnabled = isErrorTrackingEnabled();

  const reportError = useCallback(
    (error: unknown, extra?: Record<string, unknown>) => {
      captureException(error, {
        component: componentName,
        ...extra,
      });
    },
    [componentName]
  );

  useEffect(() => {
    if (!isEnabled) return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason, { type: "unhandledRejection" });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [isEnabled, reportError]);

  return {
    isEnabled,
    reportError,
  };
}
