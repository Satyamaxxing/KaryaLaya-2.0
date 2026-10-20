"use client";

import React, { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  dotColor?: "emerald" | "indigo" | "amber" | "rose" | string;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    dotColor,
    loading = false,
    className = "",
    disabled,
    style,
    ...props
  },
  ref
) {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: "0.4rem 0.85rem",
      fontSize: "12px",
      minHeight: "32px",
    },
    md: {
      padding: "0.55rem 1.25rem",
      fontSize: "13px",
      minHeight: "40px",
    },
    lg: {
      padding: "0.75rem 1.75rem",
      fontSize: "15px",
      minHeight: "48px",
    },
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--kl-ink, #0B0B0C)",
          color: "#FFFFFF",
          border: "1px solid var(--kl-ink, #0B0B0C)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        };
      case "secondary":
        return {
          backgroundColor: "var(--kl-surface-0, #FFFFFF)",
          color: "var(--kl-text-primary, #0B0B0C)",
          border: "1px solid var(--kl-border-hairline, rgba(11, 11, 12, 0.08))",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: "var(--kl-text-primary, #0B0B0C)",
          border: "1px solid var(--kl-border-subtle, rgba(11, 11, 12, 0.14))",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: "var(--kl-text-secondary, #6B6B70)",
          border: "1px solid transparent",
        };
      case "danger":
        return {
          backgroundColor: "var(--kl-rose, #E11D48)",
          color: "#FFFFFF",
          border: "1px solid var(--kl-rose, #E11D48)",
        };
      default:
        return {};
    }
  };

  const dotHex =
    dotColor === "emerald"
      ? "#10B981"
      : dotColor === "indigo"
      ? "#5B5BD6"
      : dotColor === "amber"
      ? "#F59E0B"
      : dotColor === "rose"
      ? "#E11D48"
      : dotColor;

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`kl-button kl-button-${variant} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        borderRadius: "var(--kl-radius-pill, 9999px)",
        fontFamily: "var(--font-sans, inherit)",
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition:
          "transform var(--kl-duration-fast, 180ms) var(--kl-ease-standard, ease), box-shadow var(--kl-duration-fast, 180ms) ease, background-color var(--kl-duration-fast, 180ms) ease",
        outline: "none",
        userSelect: "none",
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {dotHex && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: dotHex,
            flexShrink: 0,
            display: "inline-block",
          }}
        />
      )}
      {loading ? (
        <span
          style={{
            display: "inline-block",
            width: "12px",
            height: "12px",
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
      ) : (
        children
      )}
    </button>
  );
});
