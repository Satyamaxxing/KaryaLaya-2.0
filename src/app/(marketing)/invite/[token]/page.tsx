import Link from "next/link";
import { prisma } from "@/server/db";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: true,
      invitedBy: true,
    },
  });

  const isInvalid =
    !invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#010307",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#060913",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "1rem",
          padding: "clamp(1.5rem, 5vw, 2.5rem) clamp(1.25rem, 5vw, 2rem)",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              margin: "0 auto 1rem",
              borderRadius: "0.625rem",
              background: "linear-gradient(135deg, #10b981, #38bdf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#000",
              fontSize: "1.25rem",
            }}
          >
            K
          </div>

          {isInvalid ? (
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f43f5e" }}>
                Invitation Expired or Invalid
              </h1>
              <p
                style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", marginTop: "0.5rem" }}
              >
                This invitation link has expired or was already redeemed. Ask your agency owner for
                a new invitation.
              </p>
              <Link
                href="/login"
                style={{
                  display: "inline-block",
                  marginTop: "1.5rem",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f5f5f5",
                  color: "#080808",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono, monospace)",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(56, 189, 248, 0.12)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                INVITATION TO JOIN
              </span>
              <h1
                style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginTop: "0.75rem" }}
              >
                {invitation.organization.name}
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(255, 255, 255, 0.65)",
                  marginTop: "0.35rem",
                }}
              >
                {invitation.invitedBy.name} invited you to join as a{" "}
                <strong style={{ color: "#38bdf8" }}>{invitation.role}</strong>
                {invitation.jobTitle ? ` (${invitation.jobTitle})` : ""}.
              </p>

              <form
                action="/api/auth/accept-invite"
                method="POST"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  marginTop: "1.5rem",
                  textAlign: "left",
                }}
              >
                <input type="hidden" name="token" value={token} />

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.7)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Full Name"
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
                      color: "rgba(255, 255, 255, 0.7)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Create Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••••••"
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

                <button
                  type="submit"
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#f5f5f5",
                    color: "#080808",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  Accept & Enter Workspace →
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
