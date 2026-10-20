"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";

interface ClientContact {
  id: string;
  name: string;
  email: string;
  title?: string | null;
  canApprove: boolean;
  createdAt: string;
}

interface DeliverableSummary {
  id: string;
  title: string;
  status: string;
  progressPercent: number;
}

interface ClientProject {
  id: string;
  name: string;
  status: string;
  startDate?: string | null;
  dueDate?: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  deliverables: DeliverableSummary[];
}

interface ClientDetail {
  id: string;
  name: string;
  companyName?: string | null;
  industry?: string | null;
  portalAccessEnabled: boolean;
  contacts: ClientContact[];
  projects: ClientProject[];
  createdAt: string;
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingPortal, setTogglingPortal] = useState(false);

  // Add Contact Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    title: "",
    canApprove: true,
  });
  const [contactErrors, setContactErrors] = useState<{ [key: string]: string }>({});
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitError, setContactSubmitError] = useState<string | null>(null);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) {
        throw new Error("Client not found or access denied.");
      }
      const data = await res.json();
      setClient(data.client);
    } catch (err: any) {
      setError(err.message || "Failed to load client");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (!active) return;
        if (!res.ok) throw new Error("Client not found or access denied.");
        const data = await res.json();
        setClient(data.client);
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load client");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleTogglePortal = async () => {
    if (!client || togglingPortal) return;
    setTogglingPortal(true);
    try {
      const nextState = !client.portalAccessEnabled;
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portalAccessEnabled: nextState }),
      });
      if (!res.ok) throw new Error("Failed to update portal status");
      setClient({ ...client, portalAccessEnabled: nextState });
    } catch (err: any) {
      alert(err.message || "Error updating portal access");
    } finally {
      setTogglingPortal(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitError(null);

    const errors: { [key: string]: string } = {};
    if (!contactForm.name.trim()) errors.name = "Contact name is required.";
    if (!contactForm.email.trim() || !contactForm.email.includes("@")) {
      errors.email = "Valid work email is required.";
    }

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    setContactSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add contact");

      setIsContactModalOpen(false);
      setContactForm({ name: "", email: "", title: "", canApprove: true });
      fetchClient();
    } catch (err: any) {
      setContactSubmitError(err.message || "An error occurred");
    } finally {
      setContactSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
          <div className="h-64 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
        <div className="text-rose-400 text-lg">⚠️</div>
        <h2 className="text-lg font-bold text-white">Client Not Found</h2>
        <p className="text-xs text-zinc-400">{error || "Unable to retrieve client details."}</p>
        <Link
          href="/app/clients"
          className="inline-block px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
        >
          ← Return to Clients Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/app/clients" className="hover:text-zinc-300">
          Clients
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-medium">{client.name}</span>
      </div>

      {/* Header Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-0.5">
                {client.industry || "Agency Partner Client"}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{client.name}</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {client.companyName ? `Legal: ${client.companyName}` : "Scoped external principal"}
              </p>
            </div>
          </div>

          {/* Portal Access Toggle Box */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Client Portal Access</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    client.portalAccessEnabled
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                      : "bg-rose-950 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {client.portalAccessEnabled ? "ENABLED" : "SUSPENDED"}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {client.portalAccessEnabled
                  ? "Contacts can log in to view progress and approve work."
                  : "External client portal logins are temporarily blocked."}
              </div>
            </div>

            <button
              onClick={handleTogglePortal}
              disabled={togglingPortal}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                client.portalAccessEnabled
                  ? "bg-zinc-900 hover:bg-zinc-800 text-rose-300 border-rose-800/60"
                  : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-400"
              }`}
            >
              {togglingPortal
                ? "Updating..."
                : client.portalAccessEnabled
                ? "Disable Portal"
                : "Enable Portal"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Projects (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white">Client Projects</h2>
              <p className="text-xs text-zinc-400">
                Campaigns and delivery pipelines executed for {client.name}.
              </p>
            </div>
            <Link
              href="/app/projects"
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg shadow-sm"
            >
              + New Project
            </Link>
          </div>

          {client.projects.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl space-y-3">
              <div className="text-zinc-500 text-2xl">📁</div>
              <h3 className="text-sm font-semibold text-white">No projects for this client yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Launch a Website Launch, Social Media Monthly, Video Production, or Brand Identity
                project for {client.name}.
              </p>
              <Link
                href="/app/projects"
                className="inline-block px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg"
              >
                Launch New Project →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {client.projects.map((proj) => {
                const totalDeliv = proj.deliverables.length;
                const completedDeliv = proj.deliverables.filter(
                  (d) => d.status === "APPROVED" || d.status === "DELIVERED"
                ).length;
                const progressPct =
                  totalDeliv > 0 ? Math.round((completedDeliv / totalDeliv) * 100) : 0;

                return (
                  <Link
                    key={proj.id}
                    href={`/app/projects/${proj.id}`}
                    className="block p-5 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                            {proj.status}
                          </span>
                          <span className="text-xs text-zinc-400">
                            Owner: {proj.owner?.name || "Agency Lead"}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white group-hover:text-sky-300 transition-colors">
                          {proj.name}
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          {progressPct}%
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {completedDeliv}/{totalDeliv} Deliverables
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                      <span>
                        Due:{" "}
                        {proj.dueDate
                          ? new Date(proj.dueDate).toLocaleDateString()
                          : "No due date"}
                      </span>
                      <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform">
                        Open Project Workspace →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Authorized Contacts (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white">Contacts & Sign-Off</h2>
              <p className="text-xs text-zinc-400">Client portal stakeholders.</p>
            </div>
            <button
              onClick={() => {
                setContactErrors({});
                setContactSubmitError(null);
                setIsContactModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg"
            >
              + Add Contact
            </button>
          </div>

          {client.contacts.length === 0 ? (
            <div className="p-6 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl space-y-2">
              <div className="text-zinc-500 text-xl">👤</div>
              <div className="text-xs font-semibold text-white">No contacts registered</div>
              <p className="text-[11px] text-zinc-400">
                Add client decision-makers to send portal invites and approvals.
              </p>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="px-3 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg mt-2"
              >
                + Add Primary Contact
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {client.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{contact.name}</div>
                      <div className="text-[11px] text-zinc-400">{contact.title || "Stakeholder"}</div>
                    </div>
                    {contact.canApprove ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-mono">
                        Approver
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                        Observer
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-zinc-300 pt-1 border-t border-zinc-800/60">
                    {contact.email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Add Client Contact</h3>
                <p className="text-xs text-zinc-400">
                  Register a portal user with approval permissions for {client.name}.
                </p>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {contactSubmitError && (
              <div className="p-3 text-xs bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg">
                {contactSubmitError}
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={contactForm.name}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, name: e.target.value });
                    if (contactErrors.name) setContactErrors({ ...contactErrors, name: "" });
                  }}
                  className={`w-full px-3.5 py-2 text-xs bg-zinc-950 border rounded-lg text-white placeholder-zinc-500 focus:outline-none ${
                    contactErrors.name ? "border-rose-500" : "border-zinc-800 focus:border-sky-500"
                  }`}
                />
                {contactErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{contactErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  placeholder="e.g. sarah@brightwave.com"
                  value={contactForm.email}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, email: e.target.value });
                    if (contactErrors.email) setContactErrors({ ...contactErrors, email: "" });
                  }}
                  className={`w-full px-3.5 py-2 text-xs bg-zinc-950 border rounded-lg text-white placeholder-zinc-500 focus:outline-none ${
                    contactErrors.email ? "border-rose-500" : "border-zinc-800 focus:border-sky-500"
                  }`}
                />
                {contactErrors.email && (
                  <p className="text-[11px] text-rose-400 mt-1">{contactErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Title / Role in Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. VP of Marketing, Creative Director"
                  value={contactForm.title}
                  onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">
                    Deliverable Sign-Off Authority
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Can approve deliverables or request revisions on behalf of client.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={contactForm.canApprove}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, canApprove: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {contactSubmitting ? "Adding Contact..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
