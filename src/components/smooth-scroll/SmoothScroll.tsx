"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

/**
 * Page-level smooth scroll matching the buttery-smooth feel of satyamaxxing.in.
 * Driven directly by GSAP's V-Sync ticker loop with lagSmoothing(0),
 * seamlessly notifying GSAP ScrollTrigger on every scroll frame.
 * Includes syncTouch support for luxurious, fluid inertial scrolling on mobile.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // Bypass smooth scroll on auth (/login, /signup, /invite) and dashboard (/app, /client)
    // so fixed-height split layouts and forms retain instant 100% native browser scrolling.
    const isAppOrAuth =
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/signup") ||
      pathname?.startsWith("/invite") ||
      pathname?.startsWith("/app") ||
      pathname?.startsWith("/client");

    if (isAppOrAuth) {
      return;
    }

    // Disable native scroll restoration across browser refreshes so the user always lands back on hero
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Respect reduced motion: leave native scrolling untouched.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
      return;
    }

    // Avoid pinned-scene jumps when mobile browser chrome resizes the viewport.
    ScrollTrigger.config({
      ignoreMobileResize: true,
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    });
    ScrollTrigger.clearScrollMemory?.("manual");

    const isTouch =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

    if (isTouch) {
      // Mobile / touch devices:
      // Completely bypass Lenis to ensure 100% native 120fps hardware scrolling without any main-thread touch software interception.
      const onNativeScroll = () => ScrollTrigger.update();
      window.addEventListener("scroll", onNativeScroll, { passive: true });

      (window as any).lenis = {
        scrollTo: (target: any, options?: any) => {
          if (typeof target === "number") {
            window.scrollTo({ top: target, behavior: options?.immediate ? "instant" : "smooth" });
          } else if (target instanceof HTMLElement) {
            const offset = options?.offset || 0;
            const top = target.getBoundingClientRect().top + window.scrollY + offset;
            window.scrollTo({ top, behavior: options?.immediate ? "instant" : "smooth" });
          }
        },
        stop: () => {},
        start: () => {},
        resize: () => {},
        destroy: () => {},
      };

      const handleAnchorClick = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement).closest("a");
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href) return;

        if (href === "/" && window.location.pathname === "/") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          if (window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
          return;
        }

        if (!href.startsWith("#") || href === "#") {
          if (href === "#") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const top = target.getBoundingClientRect().top + window.scrollY - 76;
          window.scrollTo({ top, behavior: "smooth" });
          window.history.pushState(null, "", href);
        }
      };

      document.addEventListener("click", handleAnchorClick);

      const onResize = () => {
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", onResize, { passive: true });

      const refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 400);

      return () => {
        clearTimeout(refreshTimer);
        document.removeEventListener("click", handleAnchorClick);
        window.removeEventListener("scroll", onNativeScroll);
        window.removeEventListener("resize", onResize);
        delete (window as any).lenis;
      };
    }

    // Initialize Lenis: smooth wheel for PC; native touch momentum for mobile to eliminate touch lag
    const lenis = new Lenis({
      autoRaf: false,
      anchors: false, // We handle anchor clicks ourselves with fixed navbar offset
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3), // Exact cubic-out easing curve
      smoothWheel: true,
      wheelMultiplier: 1.0,
      syncTouch: true,
      syncTouchLerp: 0.08,
      touchInertiaExponent: 1.5,
      touchMultiplier: 1.0,
      infinite: false,
    });

    // Global reference for programmatic scrolling
    (window as any).lenis = lenis;

    // Synchronize Lenis with GSAP ScrollTrigger on every scroll frame
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis via GSAP ticker for frame-locked synchronization
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(500, 33);

    // Always reset to top (Hero section) on initial mount or page refresh
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });

    // Additional micro-tick to ensure late fonts or layout shifts don't displace hero view
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true });
    });

    // Intercept in-page anchor clicks with offset so section titles are never hidden beneath the fixed navbar
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      // Clicking brand logo or home link while on homepage resets smoothly to top hero
      if (href === "/" && window.location.pathname === "/") {
        e.preventDefault();
        lenis.scrollTo(0, {
          duration: 1.15,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        return;
      }

      if (!href.startsWith("#") || href === "#") {
        if (href === "#") {
          e.preventDefault();
          lenis.scrollTo(0, {
            duration: 1.15,
            easing: (t) => 1 - Math.pow(1 - t, 3),
          });
        }
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, {
          offset: -76,
          duration: 1.15,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        window.history.pushState(null, "", href);
      }
    };

    document.addEventListener("click", handleAnchorClick);

    // Before unload / reload, ensure scroll position resets to top and hash is cleared
    const handleBeforeUnload = () => {
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    // Refresh ScrollTrigger after DOM settling
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);

    const onResize = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      clearTimeout(refreshTimer);
      document.removeEventListener("click", handleAnchorClick);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      delete (window as any).lenis;
    };
  }, [pathname]);

  return null;
}
