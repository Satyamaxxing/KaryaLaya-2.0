"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StarButton, { DoubleArrowRightIcon } from "@/components/ui/StarButton";

const NAV_ITEMS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Deadlines", href: "#features" },
  { label: "Collaboration", href: "#how-it-works" },
  { label: "Client Portal", href: "#insights" },
  { label: "AI & Automations", href: "#features" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const isScrolled = scrollY > 10;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Synchronize with Lenis instance if available
    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.on === "function") {
      lenis.on("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (lenis && typeof lenis.off === "function") {
        lenis.off("scroll", handleScroll);
      }
    };
  }, []);

  // Lock body scroll and pause Lenis when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      (window as any).lenis?.stop();
    } else {
      document.body.style.overflow = "";
      (window as any).lenis?.start();
    }
    return () => {
      document.body.style.overflow = "";
      (window as any).lenis?.start();
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: "12px",
          left: 0,
          right: 0,
          zIndex: 50,
          pointerEvents: "auto",
          transform: "translateZ(0)",
        }}
      >
        <nav
          style={{
            position: "relative",
            margin: "0 auto",
            width: "calc(100% - 2.5rem)",
          }}
        >
          {/* Frosted Translucent Background Ribbon — Opacity transition for smooth 120fps GPU compositing */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
              opacity: scrolled ? 1 : 0,
              pointerEvents: "none",
              transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 0,
            }}
          />
          <div
            style={{
              display: "flex",
              height: "54px",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 1.25rem",
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                transition: "opacity 200ms ease",
              }}
              aria-label="KaryaLaya home"
            >
              <img
                src="/images/karyalaya-logo-mark.png"
                alt="KaryaLaya"
                style={{
                  height: "35px",
                  width: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
              <img
                src="/images/karyalaya-logo-text.png"
                alt="KaryaLaya"
                style={{
                  height: "20px",
                  width: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div
              className="qronos-desktop-nav"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3rem",
              }}
            >
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="qronos-nav-link"
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    transition: "color 300ms ease",
                    position: "relative",
                    fontWeight: 400,
                  }}
                >
                  {item.label}
                  <span className="qronos-nav-underline" />
                </a>
              ))}
            </div>

            {/* Right Action: Desktop Sign In & Star Button & Mobile Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div
                className="qronos-desktop-action"
                style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}
              >
                <Link
                  href="/login"
                  className="qronos-nav-link"
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.75)",
                    textDecoration: "none",
                    transition: "color 300ms ease",
                    position: "relative",
                    fontWeight: 400,
                  }}
                >
                  Sign In
                  <span className="qronos-nav-underline" />
                </Link>
                <Link href="#features" style={{ textDecoration: "none" }}>
                  <StarButton
                    backgroundColor="#000000"
                    style={{ height: "32px", padding: "0 14px", fontSize: "11px" }}
                  >
                    <span>GET STARTED</span>
                    <DoubleArrowRightIcon size={13} />
                  </StarButton>
                </Link>
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                className="qronos-mobile-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  padding: "6px",
                  cursor: "pointer",
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {mobileOpen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 4 Corner Crosshairs */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "12px",
              height: "12px",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              opacity: scrolled ? 1 : 0,
              transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "1px",
                height: "100%",
                background: "linear-gradient(to bottom, transparent, rgba(226, 232, 240, 0.65) 50%, transparent)",
              }}
            />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                width: "100%",
                height: "1px",
                background: "linear-gradient(to right, transparent, rgba(226, 232, 240, 0.65) 50%, transparent)",
              }}
            />
          </span>

          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "12px",
              height: "12px",
              transform: "translate(50%, -50%)",
              pointerEvents: "none",
              opacity: scrolled ? 1 : 0,
              transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "1px",
                height: "100%",
                background: "linear-gradient(to bottom, transparent, rgba(226, 232, 240, 0.65) 50%, transparent)",
              }}
            />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                width: "100%",
                height: "1px",
                background: "linear-gradient(to right, transparent, rgba(226, 232, 240, 0.65) 50%, transparent)",
              }}
            />
          </span>

          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "12px",
              height: "12px",
              transform: "translate(-50%, 50%)",
              pointerEvents: "none",
              opacity: scrolled ? 1 : 0,
              transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "1px",
                height: "100%",
                background: "linear-gradient(to bottom, transparent, rgba(226, 232, 240, 0.65) 50%, transparent)",
              }}
            />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                width: "100%",
                height: "1px",
                background: "linear-gradient(to right, transparent, rgba(226, 232, 240, 0.65) 50%, transparent)",
              }}
            />
          </span>

          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "12px",
              height: "12px",
              transform: "translate(50%, 50%)",
              pointerEvents: "none",
              opacity: scrolled ? 1 : 0,
              transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "1px",
                height: "100%",
                background: "linear-gradient(to bottom, transparent, rgba(226, 232, 240, 0.65) 50%, transparent)",
              }}
            />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                width: "100%",
                height: "1px",
                background: "linear-gradient(to right, transparent, rgba(226, 232, 240, 0.65) 50%, transparent)",
              }}
            />
          </span>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div
          data-lenis-prevent
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            backgroundColor: "#000000",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "5.5rem 1.75rem 2.5rem",
            boxSizing: "border-box",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            animation: "qronosFadeIn 250ms ease forwards",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(1.1rem, 2.8vh, 1.85rem)", margin: "auto 0" }}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: "clamp(1.6rem, 6.2vw, 2.25rem)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  transition: "color 200ms ease",
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div
            style={{
              paddingTop: "1.5rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              flexShrink: 0,
            }}
          >
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "inline-flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backgroundColor: "transparent",
                color: "#ffffff",
                padding: "0.75rem 1.5rem",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textDecoration: "none",
              }}
            >
              SIGN IN
            </Link>
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "inline-flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "9999px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: "0.85rem 1.5rem",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textDecoration: "none",
              }}
            >
              <span>GET STARTED</span>
              <DoubleArrowRightIcon size={14} />
            </a>
          </div>
        </div>
      )}

      <style jsx>{`
        .qronos-nav-link:hover {
          color: #ffffff !important;
        }
        .qronos-nav-underline {
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background-color: #ffffff;
          transition: width 300ms ease;
        }
        .qronos-nav-link:hover .qronos-nav-underline {
          width: 100%;
        }
        @media (max-width: 768px) {
          .qronos-desktop-nav,
          .qronos-desktop-action {
            display: none !important;
          }
          .qronos-mobile-btn {
            display: inline-flex !important;
          }
        }
        @keyframes qronosFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
