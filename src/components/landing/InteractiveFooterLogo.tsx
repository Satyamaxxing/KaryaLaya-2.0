"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  targetAlpha: number;
  life: number;
  maxLife: number;
  drag: number;
  glow: boolean;
}

interface InteractiveFooterLogoProps {
  logoMarkSrc?: string;
  logoTextSrc?: string;
}

interface FlyingLogoCoords {
  x: number;
  y: number;
  width: number;
  height: number;
  markHeight: number;
  textHeight: number;
}

export default function InteractiveFooterLogo({
  logoMarkSrc = "/images/karyalaya-logo-mark.png",
  logoTextSrc = "/images/karyalaya-logo-text.png",
}: InteractiveFooterLogoProps) {
  // State machine: idle -> falling -> missing -> restoring -> idle
  const [state, setState] = useState<"idle" | "falling" | "missing" | "restoring">("idle");
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [flyingCoords, setFlyingCoords] = useState<FlyingLogoCoords | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const logoWrapperRef = useRef<HTMLButtonElement>(null);
  const flyingLogoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shockwaveRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const isHoveredRef = useRef(false);
  const chargeRef = useRef(0); // 0 to 1
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const missingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Logo center origin in canvas coordinates
  const originRef = useRef({
    x: 200,
    y: 380,
    width: 240,
    height: 100,
  });

  // Client-side mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (missingTimerRef.current) clearTimeout(missingTimerRef.current);
      gsap.killTweensOf(logoWrapperRef.current);
      gsap.killTweensOf(flyingLogoRef.current);
    };
  }, []);

  // Emerald particle color palette
  const EMERALD_COLORS = [
    "#10b981", // Emerald 500
    "#34d399", // Emerald 400
    "#6ee7b7", // Emerald 300
    "#a7f3d0", // Emerald 200
    "#ffffff", // Diamond White
    "#ffffff",
  ];

  // Spawn particles across expanded canvas
  const spawnParticle = useCallback(
    (
      type: "charge" | "burst" | "restore",
      customX?: number,
      customY?: number
    ) => {
      const origin = originRef.current;
      const logoWidth = origin.width || 240;
      const logoHeight = origin.height || 100;

      let x = customX ?? (origin.x + (Math.random() - 0.5) * (logoWidth * 0.85));
      let y = customY ?? (origin.y + (Math.random() - 0.5) * (logoHeight * 0.75));
      let vx = 0;
      let vy = 0;
      let radius = 1.3;
      let maxLife = 55;
      let targetAlpha = 0.85;
      let drag = 0.98;
      let glow = false;

      const color = EMERALD_COLORS[Math.floor(Math.random() * EMERALD_COLORS.length)];

      if (type === "charge") {
        // Accelerating energy emissions behind logo spreading outward across the page
        const angle = Math.random() * Math.PI * 2;
        const currentCharge = chargeRef.current;
        const speed = 0.6 + currentCharge * (3.0 + Math.random() * 3.5);
        vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 1.0;
        vy = Math.sin(angle) * speed - 0.7 - currentCharge * 2.0; // upward draft
        radius = 1.0 + Math.random() * (1.4 + currentCharge * 2.0);
        maxLife = 40 + Math.floor(Math.random() * 45);
        targetAlpha = 0.45 + currentCharge * 0.5;
        drag = 0.975;
        glow = currentCharge > 0.35;
      } else if (type === "burst") {
        // High-energy burst exploding across the visible page
        const angle = Math.random() * Math.PI * 2;
        const speed = 4.0 + Math.random() * 12;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed - 2.5; // upward bias
        radius = 1.5 + Math.random() * 2.8;
        maxLife = 45 + Math.floor(Math.random() * 35);
        targetAlpha = 0.95;
        drag = 0.95;
        glow = true;
      } else if (type === "restore") {
        // Gentle re-emergence sparkle
        vx = (Math.random() - 0.5) * 2.5;
        vy = -1.5 - Math.random() * 3.2;
        radius = 1.2 + Math.random() * 2.0;
        maxLife = 50 + Math.floor(Math.random() * 35);
        targetAlpha = 0.9;
        drag = 0.965;
        glow = true;
      }

      particlesRef.current.push({
        x,
        y,
        vx,
        vy,
        radius,
        color,
        alpha: 0,
        targetAlpha,
        life: 0,
        maxLife,
        drag,
        glow,
      });
    },
    []
  );

  // Resize and position the particle canvas dynamically
  const updateCanvasBounds = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clientWidth = document.documentElement.clientWidth || window.innerWidth;

    // Canvas spans the full viewport width and ~950px height (-420px above to +450px below)
    const offsetX = rect.left;
    const offsetY = 420;
    const canvasWidth = clientWidth;
    const canvasHeight = rect.height + offsetY + 450;

    canvas.style.position = "absolute";
    canvas.style.left = `${-offsetX}px`;
    canvas.style.top = `${-offsetY}px`;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    originRef.current = {
      x: offsetX + rect.width * 0.35,
      y: offsetY + rect.height * 0.5,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // Canvas particle loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    updateCanvasBounds();
    window.addEventListener("resize", updateCanvasBounds);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // Smooth charge accumulation / dissipation
      if (isHoveredRef.current && stateRef.current === "idle") {
        chargeRef.current = Math.min(1, chargeRef.current + 0.016);
      } else {
        chargeRef.current = Math.max(0, chargeRef.current - 0.035);
      }

      // Spawn charge particles when hovering
      if (chargeRef.current > 0.02 && stateRef.current === "idle") {
        const spawnCount = Math.floor(chargeRef.current * 4) + (Math.random() < chargeRef.current ? 1 : 0);
        for (let i = 0; i < spawnCount; i++) {
          spawnParticle("charge");
        }
      }

      // Update and draw particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy *= p.drag;

        // Fade in quickly, then fade out
        if (p.life < 8) {
          p.alpha = (p.life / 8) * p.targetAlpha;
        } else {
          p.alpha = Math.max(0, (1 - p.life / p.maxLife) * p.targetAlpha);
        }

        if (p.life >= p.maxLife || p.alpha <= 0.01) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.glow) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle motion trail for high-energy particles
        if (chargeRef.current > 0.5 && (Math.abs(p.vx) > 1.2 || Math.abs(p.vy) > 1.2)) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
          ctx.lineWidth = p.radius * 0.75;
          ctx.strokeStyle = p.color;
          ctx.stroke();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", updateCanvasBounds);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateCanvasBounds, spawnParticle]);

  // Handle Pointer Enter / Leave for energy charging
  const handlePointerEnter = () => {
    if (stateRef.current !== "idle") return;
    updateCanvasBounds();
    isHoveredRef.current = true;
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
    setIsHovered(false);
  };

  // Launch and Fall Interaction (Click)
  const handleLaunch = (e: React.MouseEvent | React.KeyboardEvent) => {
    console.log("[InteractiveFooterLogo] handleLaunch called, event:", e.type, "state:", stateRef.current);
    if (e.type === "keydown") {
      const key = (e as React.KeyboardEvent).key;
      if (key !== "Enter" && key !== " ") return;
      e.preventDefault();
    } else {
      e.preventDefault();
    }

    if (stateRef.current !== "idle") {
      console.log("[InteractiveFooterLogo] Ignored launch because state is not idle:", stateRef.current);
      return;
    }

    const logoEl = logoWrapperRef.current;
    if (!logoEl) return;

    updateCanvasBounds();
    const rect = logoEl.getBoundingClientRect();
    const markEl = logoEl.querySelector<HTMLImageElement>("img[alt*='Mark']");
    const textEl = logoEl.querySelector<HTMLImageElement>("img[alt*='Text']");
    const markRect = markEl?.getBoundingClientRect();
    const textRect = textEl?.getBoundingClientRect();

    const coords: FlyingLogoCoords = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      markHeight: markRect?.height ?? rect.height,
      textHeight: textRect?.height ?? rect.height * 0.9,
    };

    setFlyingCoords(coords);
    setState("falling");
    isHoveredRef.current = false;
    setIsHovered(false);

    // 1. Emerald Energy Burst Particles across the expanded area
    const origin = originRef.current;
    for (let i = 0; i < 65; i++) {
      spawnParticle(
        "burst",
        origin.x + (Math.random() - 0.5) * (origin.width * 0.9),
        origin.y + (Math.random() - 0.5) * (origin.height * 0.8)
      );
    }

    // 2. Shockwave flash
    if (shockwaveRef.current) {
      gsap.killTweensOf(shockwaveRef.current);
      gsap.fromTo(
        shockwaveRef.current,
        { scale: 0.3, opacity: 0.9 },
        { scale: 2.8, opacity: 0, duration: 0.55, ease: "power2.out" }
      );
    }

    // Reduced motion fallback
    if (prefersReducedMotion) {
      setFlyingCoords(null);
      missingTimerRef.current = setTimeout(() => {
        setState("missing");
      }, 2000);
      return;
    }

    // 3. Unclipped Flight in Page-Level Portal:
    // Uses requestAnimationFrame to ensure the flying clone is mounted in DOM before running GSAP
    requestAnimationFrame(() => {
      const flyingEl = flyingLogoRef.current;
      if (!flyingEl) {
        console.warn("[InteractiveFooterLogo] flyingLogoRef is not yet attached");
        return;
      }

      gsap.killTweensOf(flyingEl);

      const tl = gsap.timeline({
        onComplete: () => {
          // Logo has plunged completely below viewport
          setFlyingCoords(null);

          // Wait 2.0 seconds before revealing empty-state "Bring the logo back ↗"
          missingTimerRef.current = setTimeout(() => {
            setState("missing");
          }, 2000);
        },
      });

      // Upward launch: quick acceleration high into the page visible area
      const upwardDistance = Math.min(420, coords.y + 60);
      // Downward plunge: accelerates with gravity completely beyond bottom of viewport
      const fallDistance = window.innerHeight - coords.y + 240;

      tl.to(flyingEl, {
        y: -upwardDistance,
        rotation: -4.5,
        scale: 1.05,
        duration: 0.38,
        ease: "power3.out",
      })
      // Gravity takes over: accelerates downwards through visible area and off-screen
      .to(flyingEl, {
        y: fallDistance,
        rotation: 12.5,
        scale: 0.95,
        duration: 0.72,
        ease: "power2.in", // quadratic gravitational acceleration
      });
    });
  };

  // Restore the Logo Interaction
  const handleRestore = (e: React.MouseEvent | React.KeyboardEvent) => {
    console.log("[InteractiveFooterLogo] handleRestore called, event:", e.type, "state:", stateRef.current);
    if (e.type === "keydown") {
      const key = (e as React.KeyboardEvent).key;
      if (key !== "Enter" && key !== " ") return;
      e.preventDefault();
    } else {
      e.preventDefault();
    }

    if (stateRef.current !== "missing") {
      console.log("[InteractiveFooterLogo] Ignored restore because state is not missing:", stateRef.current);
      return;
    }

    updateCanvasBounds();
    setState("restoring");

    // Spawn restoration emerald particles across the logo zone
    const origin = originRef.current;
    for (let i = 0; i < 45; i++) {
      spawnParticle(
        "restore",
        origin.x + (Math.random() - 0.5) * (origin.width * 0.9),
        origin.y + origin.height * 0.3 + (Math.random() - 0.5) * 30
      );
    }

    const logoEl = logoWrapperRef.current;
    if (!logoEl) return;

    if (prefersReducedMotion) {
      gsap.set(logoEl, { y: 0, rotation: 0, scale: 1, visibility: "visible" });
      gsap.fromTo(
        logoEl,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
          onComplete: () => {
            setState("idle");
          },
        }
      );
      return;
    }

    // Emerges smoothly from below with upward emergence and soft settle
    gsap.fromTo(
      logoEl,
      {
        y: 45,
        rotation: 0,
        scale: 0.94,
        opacity: 0,
        visibility: "visible",
      },
      {
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 0.72,
        ease: "power3.out",
        onComplete: () => {
          setState("idle");
        },
      }
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative mb-4 sm:mb-6 kl-footer-logo-wrapper"
      style={{
        display: "inline-block",
        maxWidth: "100%",
      }}
    >
      <style>{`
        .kl-footer-logo-wrapper {
          min-height: 40px;
        }
        .kl-footer-logo-box {
          min-height: 40px;
        }
        .kl-footer-logo-btn {
          gap: 0.625rem;
        }
        .kl-footer-logo-mark {
          height: 38px;
          width: auto;
          display: block;
          object-fit: contain;
          flex-shrink: 0;
        }
        .kl-footer-logo-text {
          height: 30px;
          width: auto;
          display: block;
          object-fit: contain;
          max-width: 100%;
        }
        @media (min-width: 640px) {
          .kl-footer-logo-wrapper {
            min-height: 52px;
          }
          .kl-footer-logo-box {
            min-height: 52px;
          }
          .kl-footer-logo-btn {
            gap: 0.875rem;
          }
          .kl-footer-logo-mark {
            height: 52px;
          }
          .kl-footer-logo-text {
            height: 44px;
          }
        }
        @media (min-width: 1024px) {
          .kl-footer-logo-wrapper {
            min-height: 54px;
          }
          .kl-footer-logo-box {
            min-height: 54px;
          }
          .kl-footer-logo-btn {
            gap: 1rem;
          }
          .kl-footer-logo-mark {
            height: clamp(46px, 4.2vw, 60px);
          }
          .kl-footer-logo-text {
            height: clamp(36px, 3.5vw, 48px);
          }
        }
      `}</style>
        {/* 
          EXPANDED UNCLIPPED CONTAINER
          Both the particle canvas and the logo can render and move freely without container-level clipping.
          Layout, footer, and adjacent columns remain 100% static and shift-free!
        */}
        <div
          className="relative kl-footer-logo-box"
          style={{
            overflow: "visible",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Background Particle Canvas (Behind the logo, z-index: 1) */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none"
            style={{
              zIndex: 1,
            }}
          />

          {/* Shockwave Radial Burst (Triggered on click launch) */}
          <div
            ref={shockwaveRef}
            aria-hidden="true"
            className="absolute pointer-events-none rounded-full"
            style={{
              left: "35%",
              top: "50%",
              width: "120px",
              height: "120px",
              marginTop: "-60px",
              marginLeft: "-60px",
              background:
                "radial-gradient(circle, rgba(52, 211, 153, 0.5) 0%, rgba(16, 185, 129, 0.2) 45%, transparent 75%)",
              opacity: 0,
              zIndex: 2,
            }}
          />

          {/* 
            STATIC / IN-FLOW LOGO LOCKUP
            Hidden during 'falling' and 'missing', restored during 'restoring' and 'idle'.
            Preserves its exact layout box in the footer at all times.
          */}
          <button
            type="button"
            ref={logoWrapperRef}
            onClick={handleLaunch}
            onKeyDown={handleLaunch}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            className="kl-footer-logo-btn inline-flex items-center group transition-opacity select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 rounded-xl cursor-pointer"
            style={{
              position: "relative",
              zIndex: 10,
              background: "transparent",
              border: "none",
              padding: 0,
              margin: 0,
              textAlign: "left",
              transformOrigin: "center center",
              pointerEvents: state === "idle" ? "auto" : "none",
              opacity: state === "falling" || state === "missing" ? 0 : 1,
              visibility: state === "falling" || state === "missing" ? "hidden" : "visible",
            }}
            aria-label="KaryaLaya — Interactive physics logo (hover to charge, click to launch)"
          >
            <img
              src={logoMarkSrc}
              alt="KaryaLaya Mark"
              className="kl-footer-logo-mark"
              style={{
                filter:
                  isHovered && state === "idle"
                    ? "drop-shadow(0 0 18px rgba(16, 185, 129, 0.65))"
                    : "drop-shadow(0 0 6px rgba(255, 255, 255, 0.08))",
                transition: "filter 350ms ease",
              }}
            />
            <img
              src={logoTextSrc}
              alt="KaryaLaya Text"
              className="kl-footer-logo-text"
            />
          </button>

        {/* 
          EMPTY STATE REVEAL: "Bring the logo back ↗"
          Appears smoothly in the vacant logo slot after 2 seconds.
        */}
        <div
          className="absolute inset-0 flex items-center justify-start z-10"
          style={{
            opacity: state === "missing" ? 1 : 0,
            pointerEvents: state === "missing" ? "auto" : "none",
            transform: state === "missing" ? "translateY(0)" : "translateY(6px)",
            transition:
              "opacity 450ms cubic-bezier(0.16, 1, 0.3, 1), transform 450ms cubic-bezier(0.16, 1, 0.3, 1)",
            visibility: state === "missing" ? "visible" : "hidden",
          }}
        >
          <button
            type="button"
            onClick={handleRestore}
            onKeyDown={handleRestore}
            className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderColor: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.12)",
            }}
            aria-label="Bring the logo back into view"
          >
            {/* Sparkle Icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:rotate-45 transition-transform duration-300"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>

            <span className="text-xs sm:text-sm font-medium tracking-wide text-white/90 group-hover:text-white transition-colors">
              Bring the logo back
            </span>

            <span className="text-[#34d399] font-mono text-sm font-semibold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
              ↗
            </span>
          </button>
        </div>
      </div>

      {/* 
        PAGE-LEVEL UNCLIPPED FLYING LOGO PORTAL
        Active only during 'falling' state. Rendered via portal at document.body with position: fixed.
        Travels completely unclipped across the visible page, launching upward and plunging off-screen.
        Never alters scrollHeight or causes layout shifts.
      */}
      {mounted &&
        flyingCoords &&
        state === "falling" &&
        createPortal(
          <div
            ref={flyingLogoRef}
            style={{
              position: "fixed",
              left: `${flyingCoords.x}px`,
              top: `${flyingCoords.y}px`,
              width: `${flyingCoords.width}px`,
              height: `${flyingCoords.height}px`,
              zIndex: 9999,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              willChange: "transform",
            }}
          >
            <img
              src={logoMarkSrc}
              alt=""
              style={{
                height: `${flyingCoords.markHeight}px`,
                width: "auto",
                display: "block",
                objectFit: "contain",
                flexShrink: 0,
                filter: "drop-shadow(0 0 24px rgba(16, 185, 129, 0.75))",
              }}
            />
            <img
              src={logoTextSrc}
              alt=""
              style={{
                height: `${flyingCoords.textHeight}px`,
                width: "auto",
                display: "block",
                objectFit: "contain",
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
