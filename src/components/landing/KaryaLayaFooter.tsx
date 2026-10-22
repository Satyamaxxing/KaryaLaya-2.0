"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import InteractiveFooterLogo from "./InteractiveFooterLogo";

export function KaryaLayaFooter() {
  const [activeModal, setActiveModal] = useState<"privacy" | "terms" | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [activeModal]);

  return (
    <footer className="relative bg-black border-t border-white/10 text-white overflow-hidden">
      <style>{`
        .kl-footer-container {
          padding-top: 2.75rem;
          padding-bottom: 2rem;
        }
        .kl-footer-main-grid {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .kl-footer-brand-col {
          margin-bottom: 1.75rem;
        }
        .kl-footer-desktop-links {
          display: none !important;
        }
        .kl-footer-mobile-links {
          display: block !important;
        }
        .kl-footer-link {
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
          line-height: 1.45;
          padding: 2px 0;
          transition: color 200ms ease;
          display: inline-block;
        }
        .kl-footer-link:hover {
          color: #34d399;
        }
        .kl-footer-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.875rem;
          text-align: center;
          padding-top: 1.5rem;
          padding-bottom: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        @media (min-width: 768px) {
          .kl-footer-container {
            padding-top: 4.5rem;
            padding-bottom: 3.5rem;
          }
          .kl-footer-main-grid {
            display: grid !important;
            grid-template-columns: 2.2fr 1fr 1fr 1fr 1fr !important;
            gap: 2rem !important;
          }
          .kl-footer-brand-col {
            margin-bottom: 0 !important;
          }
          .kl-footer-desktop-links {
            display: contents !important;
          }
          .kl-footer-mobile-links {
            display: none !important;
          }
          .kl-footer-bottom {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            text-align: left !important;
            padding-top: 2rem !important;
            padding-bottom: 2rem !important;
          }
        }

        @media (min-width: 1024px) {
          .kl-footer-container {
            padding-top: 5rem;
            padding-bottom: 4rem;
          }
          .kl-footer-main-grid {
            gap: 2.5rem !important;
          }
        }
      `}</style>

      <div className="relative z-10 max-w-[1400px] mx-auto px-[15px] lg:px-14">
        <div className="kl-footer-container">
          <div className="kl-footer-main-grid">
            {/* Brand column: rendered once, scales gracefully */}
            <div className="kl-footer-brand-col">
              <InteractiveFooterLogo />
              <p className="text-white/90 font-medium text-[13px] sm:text-sm mt-3 mb-1.5 tracking-tight">
                The operating system for connected work.
              </p>
              <p className="text-zinc-400 leading-relaxed max-w-sm text-xs sm:text-sm">
                Bring projects, deliverables, teams, client approvals, and workflows together in one workspace.
              </p>
            </div>

            {/* Desktop Links (4 columns, rendered across the 5-column grid) */}
            <div className="kl-footer-desktop-links">
              {/* Product Column */}
              <div>
                <h3 className="text-sm font-medium text-white mb-5 tracking-tight">Product</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm">
                  <li>
                    <a
                      href="#features"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Projects &amp; Deliverables
                    </a>
                  </li>
                  <li>
                    <a
                      href="#how-it-works"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Team Collaboration
                    </a>
                  </li>
                  <li>
                    <a
                      href="#deadlines"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Deadlines &amp; Milestones
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/client"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Client Portal
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#automations"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      AI &amp; Automations
                    </a>
                  </li>
                  <li>
                    <a
                      href="#insights"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Insights &amp; Analytics
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources Column */}
              <div>
                <h3 className="text-sm font-medium text-white mb-5 tracking-tight">Resources</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm">
                  <li>
                    <Link
                      href="/signup"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Getting Started
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:support@karyalaya.agency"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Help &amp; Support
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:hello@karyalaya.agency"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Column */}
              <div>
                <h3 className="text-sm font-medium text-white mb-5 tracking-tight">Company</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm">
                  <li>
                    <a
                      href="#capabilities"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      About KaryaLaya
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:hello@karyalaya.agency"
                      className="text-white/50 hover:text-emerald-400 transition-colors inline-block"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal Column */}
              <div>
                <h3 className="text-sm font-medium text-white mb-5 tracking-tight">Legal</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm">
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveModal("privacy")}
                      className="text-left text-white/50 hover:text-emerald-400 transition-colors inline-block bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setActiveModal("terms")}
                      className="text-left text-white/50 hover:text-emerald-400 transition-colors inline-block bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Terms of Service
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Links: Clean, Symmetrical & Arranged Without Crowding */}
            <div className="kl-footer-mobile-links">
              {/* Product: Symmetrical 2-Column Grid */}
              <div className="border-t border-white/[0.08] pt-5 pb-5">
                <h3 className="text-[11px] font-mono uppercase tracking-[0.12em] text-white/45 mb-3.5 flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-400" />
                  Product
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <a href="#features" className="kl-footer-link">
                    Projects &amp; Deliverables
                  </a>
                  <Link href="/client" className="kl-footer-link">
                    Client Portal
                  </Link>
                  <a href="#how-it-works" className="kl-footer-link">
                    Team Collaboration
                  </a>
                  <a href="#automations" className="kl-footer-link">
                    AI &amp; Automations
                  </a>
                  <a href="#deadlines" className="kl-footer-link">
                    Deadlines &amp; Milestones
                  </a>
                  <a href="#insights" className="kl-footer-link">
                    Insights &amp; Analytics
                  </a>
                </div>
              </div>

              {/* Resources & Company/Legal: Symmetrical 2 Columns */}
              <div className="border-t border-white/[0.08] pt-5 pb-2 grid grid-cols-2 gap-x-4">
                {/* Resources */}
                <div>
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.12em] text-white/45 mb-3.5 flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-cyan-400" />
                    Resources
                  </h3>
                  <ul className="space-y-2.5">
                    <li>
                      <Link href="/signup" className="kl-footer-link">
                        Getting Started
                      </Link>
                    </li>
                    <li>
                      <a href="mailto:support@karyalaya.agency" className="kl-footer-link">
                        Help &amp; Support
                      </a>
                    </li>
                    <li>
                      <a href="mailto:hello@karyalaya.agency" className="kl-footer-link">
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Company & Legal */}
                <div>
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.12em] text-white/45 mb-3.5 flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-violet-400" />
                    Company &amp; Legal
                  </h3>
                  <ul className="space-y-2.5">
                    <li>
                      <a href="#capabilities" className="kl-footer-link">
                        About KaryaLaya
                      </a>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setActiveModal("privacy")}
                        className="kl-footer-link text-left bg-transparent border-0 p-0 cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setActiveModal("terms")}
                        className="kl-footer-link text-left bg-transparent border-0 p-0 cursor-pointer"
                      >
                        Terms of Service
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Live System Status */}
        <div className="kl-footer-bottom">
          <p className="text-xs text-white/40">
            © 2026 KaryaLaya. All rights reserved.
          </p>
          <a
            href="https://www.google.com/search?q=Satyamaxxing"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/30 text-xs text-zinc-400 hover:text-zinc-200 transition-all duration-200 backdrop-blur-sm cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]"
            aria-label="Made by Satyamaxxing (opens Google search in new tab)"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
              Made by <span className="font-medium text-white group-hover:text-emerald-300 transition-colors">Satyamaxxing</span>
            </span>
            <svg
              className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        </div>
      </div>

      {/* Accessible Policy & Terms Modal */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0e1015] p-5 sm:p-8 text-white shadow-2xl"
            style={{ WebkitOverflowScrolling: "touch" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <h3 className="text-lg font-semibold tracking-tight">
                  {activeModal === "privacy" ? "Privacy Policy" : "Terms of Service"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-white/70 leading-relaxed">
              {activeModal === "privacy" ? (
                <>
                  <p>
                    <strong className="text-white">1. Data Ownership &amp; Privacy:</strong>{" "}
                    At KaryaLaya, you retain 100% ownership of your agency deliverables, client briefs, assets, and project communications. We do not sell your personal or agency data to any third party.
                  </p>
                  <p>
                    <strong className="text-white">2. Confidential Client Information:</strong>{" "}
                    All client portal handoffs, review items, video master revisions, and creative scopes are isolated and accessible only to authorized team members and authenticated client contacts.
                  </p>
                  <p>
                    <strong className="text-white">3. Secure Communications:</strong>{" "}
                    All sessions and handoffs utilize end-to-end transport layer security (TLS 1.3) encryption. Sensitive keys and tokens are stored with enterprise-grade isolation.
                  </p>
                  <p>
                    <strong className="text-white">4. Inquiries:</strong>{" "}
                    For any privacy or data handling inquiries, reach out directly to our security &amp; privacy team at{" "}
                    <a href="mailto:satyamggacc@gmail.com" className="text-emerald-400 hover:underline">
                      satyamggacc@gmail.com
                    </a>.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong className="text-white">1. Use of the Operating System:</strong>{" "}
                    KaryaLaya provides digital agencies, studios, and production teams with a workspace for tracking projects, delegating tasks, reviewing deliverables, and facilitating client approvals.
                  </p>
                  <p>
                    <strong className="text-white">2. Account Responsibility:</strong>{" "}
                    Agency owners and managers are responsible for managing access permissions for invited internal members and external client accounts.
                  </p>
                  <p>
                    <strong className="text-white">3. Deliverable Approvals:</strong>{" "}
                    Client sign-offs, revision feedback, and status timestamps executed within the portal are recorded as authoritative milestones for your workflow.
                  </p>
                  <p>
                    <strong className="text-white">4. Service Availability:</strong>{" "}
                    We strive for continuous 99.9% uptime across all workspace coordination and client review services. For enterprise support or inquiries, contact{" "}
                    <a href="mailto:hello@karyalaya.agency" className="text-emerald-400 hover:underline">
                      hello@karyalaya.agency
                    </a>.
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

export default KaryaLayaFooter;
