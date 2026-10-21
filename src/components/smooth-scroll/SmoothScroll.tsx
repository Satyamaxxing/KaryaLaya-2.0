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

    // Initialize Lenis with smooth wheel and syncTouch for silky smooth mobile touch scrolling
    const lenis = new Lenis({
      autoRaf: false,
      anchors: false, // We handle anchor clicks ourselves with fixed navbar offset
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3), // Exact cubic-out easing curve
      smoothWheel: true,
      wheelMultiplier: 1.0,
      syncTouch: true, // Enables smooth inertial momentum scrolling on mobile touch devices
      syncTouchLerp: 0.08, // Buttery smooth deceleration on finger release
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
    gsap.ticker.lagSmoothing(0);

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
