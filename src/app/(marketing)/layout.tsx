import React from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="marketing-theme"
      data-theme="marketing"
      style={{
        backgroundColor: "var(--kl-canvas, #020408)",
        color: "var(--kl-text-primary, #FFFFFF)",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}
