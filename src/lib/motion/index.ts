"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Ensure GSAP plugins are registered in browser environment
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Motion Tokens (durations in seconds for GSAP / CSS ms equivalents)
 */
export const MOTION_TOKENS = {
  durations: {
    fast: 0.18, // 180ms
    base: 0.32, // 320ms
    slow: 0.7, // 700ms
    scene: 1.0, // 1000ms
  },
  easings: {
    standard: "power2.out", // cubic-bezier(.2,.7,.2,1)
    inOut: "power2.inOut", // cubic-bezier(.65,0,.35,1)
    cssStandard: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    cssInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
} as const;

/**
 * Check if reduced motion is requested via OS media query or app data attribute
 */
export function getReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const osPreference = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const appPreference =
    document.documentElement.getAttribute("data-reduce-motion") === "true" ||
    document.body.getAttribute("data-reduce-motion") === "true";
  return osPreference || appPreference;
}

/**
 * React hook to listen for reduced motion preference changes
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    setReduced(getReducedMotion());

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(getReducedMotion());

    mql.addEventListener("change", handler);

    // Also observe data-reduce-motion mutations
    const observer = new MutationObserver(handler);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduce-motion"],
    });

    return () => {
      mql.removeEventListener("change", handler);
      observer.disconnect();
    };
  }, []);

  return reduced;
}

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * GSAP Context helper for React components.
 * Automatically cleans up all animations, timelines, and ScrollTriggers on unmount or deps change.
 */
export function useGsapContext(
  callback: (self: gsap.Context) => void,
  scope?: React.RefObject<HTMLElement | null>,
  deps: React.DependencyList = []
) {
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context((self) => {
      callback(self);
    }, scope?.current || undefined);

    return () => {
      ctx.revert();
    };
  }, deps);
}

/**
 * Animate numeric counter with tabular figures and optional prefix/suffix
 */
export function animateCounter(
  element: HTMLElement | null,
  start: number,
  end: number,
  options?: {
    duration?: number;
    delay?: number;
    prefix?: string;
    suffix?: string;
    format?: (val: number) => string;
  }
) {
  if (!element) return;
  if (getReducedMotion()) {
    element.textContent = options?.format
      ? options.format(end)
      : `${options?.prefix || ""}${Math.round(end)}${options?.suffix || ""}`;
    return;
  }

  const obj = { val: start };
  const duration = options?.duration ?? MOTION_TOKENS.durations.slow;

  gsap.to(obj, {
    val: end,
    duration,
    delay: options?.delay ?? 0,
    ease: "power2.out",
    onUpdate: () => {
      if (options?.format) {
        element.textContent = options.format(obj.val);
      } else {
        const rounded = Math.round(obj.val);
        const pad = rounded < 10 && end >= 10 ? `0${rounded}` : `${rounded}`;
        element.textContent = `${options?.prefix || ""}${pad}${options?.suffix || ""}`;
      }
    },
  });
}

/**
 * Masked slide-up text reveal helper
 */
export function revealMaskedLines(
  elements: HTMLElement[] | NodeListOf<HTMLElement>,
  options?: {
    stagger?: number;
    duration?: number;
    delay?: number;
  }
) {
  if (!elements || elements.length === 0) return;
  if (getReducedMotion()) {
    gsap.set(elements, { opacity: 1, y: 0 });
    return;
  }

  gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: "110%",
    },
    {
      opacity: 1,
      y: "0%",
      duration: options?.duration ?? MOTION_TOKENS.durations.slow,
      delay: options?.delay ?? 0,
      stagger: options?.stagger ?? 0.08,
      ease: "power3.out",
    }
  );
}
