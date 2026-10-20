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
    <footer className="relative bg-black border-t border-white/10 text-white">
      <div className="relative z-10 max-w-[1400px] mx-auto px-[15px] lg:px-14">
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10 lg:gap-8">
            {/* Brand column */}
            <div className="col-span-2">
              <InteractiveFooterLogo />
              <p className="text-white/85 font-medium text-sm mb-2">
                The operating system for connected work.
              </p>
              <p className="text-white/50 leading-relaxed mb-6 max-w-sm text-xs sm:text-sm">
                Bring projects, deliverables, teams, client approvals, and workflows together in one workspace.
              </p>
            </div>

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
        </div>

        {/* Bottom Bar: Copyright & Live System Status */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 py-8 md:flex-row md:items-center">
          <p className="text-xs sm:text-sm text-white/40">
            © 2026 KaryaLaya. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs sm:text-sm text-white/40">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              </span>
              All systems operational
            </span>
          </div>
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
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0e1015] p-6 sm:p-8 text-white shadow-2xl"
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
                    <a href="mailto:support@karyalaya.agency" className="text-emerald-400 hover:underline">
                      support@karyalaya.agency
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
