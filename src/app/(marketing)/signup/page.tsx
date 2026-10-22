import Image from "next/image";
import Link from "next/link";
import DataRain from "@/components/ui/data-rain";

export default function SignupPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Instant-load High-Priority Celestial Saturn Cosmos Background */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/saturn-cosmos-bg.webp"
          alt="Celestial Saturn Cosmos Landscape Background"
          fill
          priority
          quality={88}
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center center",
          }}
        />
        {/* Subtle vignette darkening for enhanced depth and content contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.45) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Interactive DataRain Starfall & Flow Canvas */}
      <DataRain palette={{ calm: "#9ca3af", mid: "#cbd5e1", hot: "#f1f5f9" }} />



      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "rgba(10, 16, 29, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "1.25rem",
          padding: "clamp(1.5rem, 5vw, 2.75rem) clamp(1.25rem, 5vw, 2.25rem)",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.5rem",
                background: "linear-gradient(135deg, #10b981, #38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#000",
                fontSize: "1rem",
              }}
            >
              K
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.25rem",
                letterSpacing: "-0.02em",
                color: "#fff",
              }}
            >
              KaryaLaya
            </span>
          </Link>
          <h1
            style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}
          >
            Start your agency workspace
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", marginTop: "0.35rem" }}>
            Free starter plan · No credit card required · Unlimited client reviewers
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "0.35rem",
              }}
            >
              Agency Name
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Creative Studio"
              defaultValue="Acme Digital Agency"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                fontSize: "13px",
                backgroundColor: "#0a101d",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "0.5rem",
                color: "#fff",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "0.35rem",
              }}
            >
              Work Email
            </label>
            <input
              type="email"
              placeholder="you@agency.com"
              defaultValue="founder@agency.com"
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                fontSize: "13px",
                backgroundColor: "#0a101d",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "0.5rem",
                color: "#fff",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "0.35rem",
              }}
            >
              Primary Agency Services
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
              {["Web Development", "Video Editing", "Social Media", "Branding"].map((s, idx) => (
                <span
                  key={s}
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 500,
                    backgroundColor: idx < 2 ? "rgba(16, 185, 129, 0.15)" : "#0f172a",
                    color: idx < 2 ? "#10b981" : "rgba(255, 255, 255, 0.7)",
                    border:
                      idx < 2
                        ? "1px solid rgba(16, 185, 129, 0.35)"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/app/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#f5f5f5",
              color: "#080808",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              marginTop: "0.5rem",
              transition: "background 180ms ease",
            }}
          >
            Create Agency Workspace →
          </Link>
        </div>

        <div style={{ textAlign: "center", fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
          Already have an agency account?{" "}
          <Link href="/login" style={{ color: "#38bdf8", textDecoration: "underline" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
