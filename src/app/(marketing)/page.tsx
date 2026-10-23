"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import LandingNavbar from "@/components/landing/LandingNavbar";
import VortexBackground from "@/components/background/VortexBackground";
import IntegrationLogoStrip from "@/components/landing/IntegrationLogoStrip";
import StarButton, { DoubleArrowRightIcon } from "@/components/ui/StarButton";
import {
  FeaturesSection,
  HowItWorksSection,
  InsightsSection,
  CtaSection,
  KaryaLayaFooter,
} from "@/components/landing/QronosSections";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      {/* Precision Vertical Hairline Guidelines matching original Qronos template spanning full screen */}
      <div
        aria-hidden="true"
        className="hidden sm:block"
        style={{
          pointerEvents: "none",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          width: "100%",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "1.25rem",
            width: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: "1.25rem",
            width: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "1.75rem",
            width: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: "1.75rem",
            width: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
        />
      </div>

      {/* Header */}
      <LandingNavbar />

      <main
        style={{
          position: "relative",
          minHeight: "100vh",
          width: "100%",
          overflowX: "clip",
          backgroundColor: "#000000",
          color: "#ffffff",
          fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        }}
      >
        {/* =========================================================================
            SECTION 1: HERO — FULL SCREEN EDGE-TO-EDGE
            ========================================================================= */}
        <section
          style={{
            position: "relative",
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            overflow: "hidden",
            backgroundColor: "#000000",
          }}
        >
          {/* Full Screen Edge-to-Edge Canvas Container — 100% Viewport Coverage */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              overflow: "hidden",
            }}
          >
            <VortexBackground
              background="#000000"
              lineOptions={{ color: "#ffffff", glow: 11.5, count: 80 }}
              dotOptions={{ color: "#ffffff", glow: 13, count: 950, size: 28 }}
              cometOptions={{ color: "#ffffff", glow: 7 }}
              repel={true}
            />

            {/* Readability Vignette: Soft radial backdrop directly behind hero text */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(ellipse 65% 50% at 50% 46%, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.08) 45%, transparent 75%)",
              }}
            />

            {/* Subtle Edge Vignette Gradients */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: "linear-gradient(to right, rgba(0, 0, 0, 0.35) 0%, transparent 15%, transparent 85%, rgba(0, 0, 0, 0.35) 100%)",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 0%, transparent 45%, rgba(0, 0, 0, 0.65) 100%)",
              }}
            />
          </div>

          {/* Centered Hero Content */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              width: "100%",
              maxWidth: "1600px",
              margin: "0 auto",
              padding: "10.5rem 1.5rem 5.5rem",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                margin: "0 auto",
                display: "flex",
                maxWidth: "100%",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {/* Main Headline */}
              <div style={{ marginBottom: "1.5rem", width: "100%", display: "flex", justifyContent: "center" }}>
                <h1
                  className="hero-headline"
                  style={{
                    position: "relative",
                    zIndex: 10,
                    margin: 0,
                    fontSize: "clamp(2.1rem, 4.6vw, 4.5rem)",
                    lineHeight: 1.02,
                    letterSpacing: "-0.095em",
                    wordSpacing: "0.22em",
                    color: "#ffffff",
                    fontWeight: 400,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(1.5rem)",
                    transition: "opacity 1000ms ease, transform 1000ms ease",
                  }}
                >
                  <span style={{ display: "block" }}>
                    The Centre Of{" "}
                    <span
                      style={{
                        fontFamily: "'Newsreader', 'Instrument Serif', Georgia, serif",
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: "1.08em",
                        letterSpacing: "-0.04em",
                        color: "#ffffff",
                        paddingRight: "0.22em",
                      }}
                    >
                      Gravity
                    </span>
                  </span>
                  <span
                    style={{
                      display: "block",
                      background: "linear-gradient(180deg, #FFFFFF 15%, #d4d4d8 50%, #71717a 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    for your{" "}
                    <span
                      style={{
                        fontFamily: "'Newsreader', 'Instrument Serif', Georgia, serif",
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: "1.08em",
                        letterSpacing: "-0.06em",
                        paddingRight: "0.22em",
                      }}
                    >
                      Modern Work
                    </span>
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <p
                className="hero-subtitle"
                style={{
                  position: "relative",
                  zIndex: 0,
                  marginBottom: "2.25rem",
                  fontSize: "clamp(13px, 1.8vw, 22px)",
                  lineHeight: 1.5,
                  letterSpacing: "-0.01em",
                  color: "#ffffff",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(1rem)",
                  transition: "opacity 700ms 150ms ease, transform 700ms 150ms ease",
                }}
              >
                The Workspace for freelancers, agencies, and their clients.
              </p>

              {/* Action Buttons: 1:1 Qronos Buttons */}
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.85rem",
                  flexWrap: "wrap",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(1rem)",
                  transition: "opacity 700ms 200ms ease, transform 700ms 200ms ease",
                }}
              >
                {/* Button 1: StarButton redirecting to /signup */}
                <Link href="/signup" style={{ textDecoration: "none" }}>
                  <StarButton
                    backgroundColor="#000000"
                    style={{
                      height: "40px",
                      padding: "0 1.25rem",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}>
                      GET STARTED
                    </span>
                    <DoubleArrowRightIcon size={14} />
                  </StarButton>
                </Link>

                {/* Button 2: White Pill sliding down to #features */}
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.querySelector("#features");
                    if (target) {
                      if ((window as any).lenis) {
                        (window as any).lenis.scrollTo(target, { offset: -76, duration: 1.2 });
                      } else {
                        target.scrollIntoView({ behavior: "smooth" });
                      }
                    }
                  }}
                  style={{
                    position: "relative",
                    isolation: "isolate",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    whiteSpace: "nowrap",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    height: "40px",
                    overflow: "hidden",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    backgroundColor: "#ffffff",
                    padding: "0 1.35rem",
                    color: "#000000",
                    textDecoration: "none",
                    cursor: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAADs0lEQVRYhe2WT0gjZxjGH2V32T/k1JYe4l68lFoo6KW5eOrB9dB6aRChVklAeosoCC2CqBRyEqQpwm50yYJSSgU9WDHdthT00EPWIApGNzHbMkmYjklmzL/JzDff8g4zki5kV2N2L90Hnssw876/93u/95sPeKsaaZr2BWPsCec8Uc+MsaeMsUeyLL+DZkpRlA7GmK5pmpFOp7V6zufzOuecl8vlHwG0NCt/qyAI31Jgv99fBJCpZ4fDISqKYpRKpTyAm80CuH5wcHCfAKanp1MAfgfw2Ol0/hkOh9PpdLokiqLtMmOMM8YMxljSakuE2nclgL29vYcEMDMz8w+AXwGEw+Fwhp5JkmQkk8lzi6LIyYIgaORqtUowuqIoHzYT4HEmk9FyuRwHoAKo2B4cHDSGhoYMAFny7Oxshb4VBOEbamfTACRJYplMhhIpAGTLCgF4PB7D6/X+7fF4nk1NTWXpW2ojxXodAHKtKfnJyQm3lUqlzMmgGK8dwOVyFSRJMhNvbGyYtvVGAEZHR81+p1Ip3tXVxUdGRt4sgM/nU+k9SgzgLQBvWgsikcgDCjI3Nyc02oLj4+PVhgGCwaBP13WDfkb2sUtHbjab5f39/cz20tISrwdgGAbXdf1nXde/rFQqH1wGoBXAR6FQKCGKYkWWZZVMAQlgYGCA2V5cXDRqAWgS9vf3+fz8PN/d3T2HYYwxTdO+U1X144tC3ADwOYCfAPwG4A9ZljVZlo3Ozk7F6XTS3y83MTFRrgWodXt7Ow+FQnx8fJyfnZ2dL0y1Wv36wq0AcBvAHQDvx2Kx9HlJnPNKpcIKhQKrB1Drnp4ePjY2xovFIi8UCk8b2Rs3/X6/uTGPjo74zs5OLQv3er0vBbCtqiqXZTlvFXYptfp8vk/K5TKjKjo6Onhvby9fWVnhy8vL5nK/Kjl9Q0okEoK1qpdSC4B319fX4xQkGo1yh8Nxoaptu91uEyAajf4F4BYa0A0Ag4eHhwoFCgQClwJYWFgwATY3N+9bsRqSw+12/5DL5TQaS5fLdaHkNJ6lUok2oT48PPwZgGuNArQCuBsMBiNUTTKZ5N3d3XUTt7W18cnJSdp4ZvWrq6uHAN676g36OoB729vb/9pTQNXF4/H/mJ7ZUlXVWFtbronuvt3o8fyi6IxGg8EAs9isVhRkqRqPp/Xan16elqNx+OlrW2t076+vicAvmpk/OqpxQr2KYDvAWxYJ2atfwHwAACdfHevsvFepmvWSN2p41tW4oZux/jf6TmVnYEWge6xlr/28AAAAASUVORK5CYII=') 16 10, url('/images/custom-pointer.png') 16 10, pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      pointerEvents: "none",
                      position: "absolute",
                      left: "1.125rem",
                      top: 0,
                      height: "1px",
                      width: "calc(100% - 2.25rem)",
                      background: "linear-gradient(to right, transparent, rgba(0, 0, 0, 0.5), transparent)",
                    }}
                  />
                  <span style={{ position: "relative", zIndex: 10 }}>SEE HOW IT WORKS</span>
                </a>
              </div>
            </div>
          </div>

        </section>

        {/* Marquee Strip — Positioned in the next section below the hero fold */}
        <section
          id="capabilities"
          aria-label="Capabilities Overview"
          style={{
            position: "relative",
            zIndex: 20,
            width: "100%",
            backgroundColor: "#000000",
            padding: "3.5rem 0 4.5rem",
            overflow: "hidden",
            opacity: mounted ? 1 : 0,
            transition: "opacity 700ms 300ms ease",
          }}
        >
          <IntegrationLogoStrip />
        </section>

        {/* Full KaryaLaya Sections */}
        <FeaturesSection />
        <HowItWorksSection />
        <InsightsSection />
        <CtaSection />
        <KaryaLayaFooter />
      </main>
    </>
  );
}
