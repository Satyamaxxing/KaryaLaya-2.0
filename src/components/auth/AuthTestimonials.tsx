"use client";

import React, { useState, useEffect } from "react";

const TESTIMONIALS = [
  {
    quote: "We were already doing the work. We just needed a better way to keep everything organised.",
    author: "Creative Studio Founder",
  },
  {
    quote: "Honestly, it’s so much easier when I don’t have to keep checking five different places for updates.",
    author: "Freelance Designer",
  },
  {
    quote: "The best part is that I don’t have to keep asking everyone for updates. I can just see where things stand.",
    author: "Agency Owner",
  },
  {
    quote: "I spend less time following up on work and more time actually getting it done.",
    author: "Freelance Developer",
  },
  {
    quote: "My clients know what’s happening, my team knows what to do, and I don’t have to manage everything over chat.",
    author: "Agency Owner",
  },
];

export default function AuthTestimonials() {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setAnimating(true);

      const timer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        setAnimating(false);
      }, 420); // Fade out duration

      return () => clearTimeout(timer);
    }, 5400); // Display duration per testimonial

    return () => clearInterval(interval);
  }, [isPaused]);

  const current = TESTIMONIALS[index];

  return (
    <div
      style={{
        position: "relative",
        zIndex: 20,
        maxWidth: "520px",
        marginBottom: "0.5rem",
        minHeight: "110px",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-live="polite"
    >
      <div
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(-6px)" : "translateY(0)",
          transition: "opacity 420ms cubic-bezier(0.16, 1, 0.3, 1), transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "opacity, transform",
        }}
      >
        <blockquote
          style={{
            margin: 0,
            fontSize: "clamp(16px, 1.4vw, 18.5px)",
            fontWeight: 400,
            lineHeight: 1.45,
            letterSpacing: "-0.015em",
            color: "#f4f4f5",
          }}
        >
          &ldquo;{current.quote}&rdquo;
        </blockquote>
        <div
          style={{
            marginTop: "12px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "13px",
            color: "#a1a1aa",
            letterSpacing: "0.02em",
          }}
        >
          ~ {current.author}
        </div>
      </div>

      {/* Subtle indicator pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "14px",
        }}
      >
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (i === index) return;
              setAnimating(true);
              setTimeout(() => {
                setIndex(i);
                setAnimating(false);
              }, 250);
            }}
            aria-label={`Go to testimonial ${i + 1}`}
            style={{
              height: "2px",
              width: i === index ? "24px" : "10px",
              borderRadius: "1px",
              backgroundColor: i === index ? "#ffffff" : "rgba(255, 255, 255, 0.22)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
