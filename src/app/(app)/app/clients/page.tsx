"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ClientContact {
  id: string;
  name: string;
  email: string;
  title?: string | null;
  canApprove: boolean;
}

interface ClientProject {
  id: string;
  name: string;
  status: string;
  dueDate?: string | null;
}

interface ClientItem {
  id: string;
  name: string;
  companyName?: string | null;
  industry?: string | null;
  portalAccessEnabled: boolean;
  contacts: ClientContact[];
  projects: ClientProject[];
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("OWNER");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    industry: "",
    portalAccessEnabled: true,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [clientsRes, userRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/auth/me"),
        ]);
        if (!active) return;

        if (clientsRes.ok) {
          const clientData = await clientsRes.json();
          setClients(clientData.clients || []);
        }
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) setCurrentUserRole(userData.user.role);
        }
      } catch (err) {
        console.error("Failed to load clients data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const canCreateClient = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errors.name = "Client brand name is required.";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create client");
      }

      setIsModalOpen(false);
      setFormData({ name: "", companyName: "", industry: "", portalAccessEnabled: true });
      fetchClients();
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Client Directory & Portal Access
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Client Management</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            External scoped principals with client-safe projection portals and feedback loops.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreateClient ? (
            <button
              onClick={() => {
                setFormErrors({});
                setSubmitError(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg shadow-sm transition-transform active:scale-95"
            >
              + Add Client
            </button>
          ) : (
            <span className="text-xs px-3 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Role: {currentUserRole} (Read-only)
            </span>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search clients by name, company, or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-zinc-900/90 border border-zinc-800 focus:border-sky-500 rounded-lg text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="text-xs text-zinc-400 font-mono">
          Showing {filteredClients.length} of {clients.length} Clients
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-zinc-900/40 border border-zinc-850 animate-pulse"
            />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 text-lg">
            🏢
          </div>
          <h3 className="text-base font-semibold text-white">No clients found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search
              ? "No clients match your search criteria. Try a different query."
              : "Add your first agency client to start launching projects, managing deliverables, and sharing portals."}
          </p>
          {canCreateClient && !search && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg shadow-sm"
            >
              + Add First Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const primaryContact = client.contacts?.[0];
            const activeProjectsCount = client.projects?.length || 0;

            return (
              <div
                key={client.id}
                className="p-6 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-xl space-y-4 shadow-xl transition-all relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-lg font-bold shadow-md">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        <Link href={`/app/clients/${client.id}`}>
                          {client.companyName || client.name}
                        </Link>
                      </h2>
                      <div className="text-xs text-zinc-400">
                        {client.industry || "Agency Client"}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded font-mono border ${
                      client.portalAccessEnabled
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {client.portalAccessEnabled ? "Portal Active" : "Portal Disabled"}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Primary Contact:</span>
                    <span className="text-zinc-200">
                      {primaryContact ? primaryContact.name : "No contact linked"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Contact Email:</span>
                    <span className="font-mono text-zinc-200">
                      {primaryContact ? primaryContact.email : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Active Projects:</span>
                    <span className="font-semibold text-sky-400">
                      {activeProjectsCount} Campaign{activeProjectsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    Added {new Date(client.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/app/clients/${client.id}`}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-lg transition-colors"
                  >
                    Manage Client Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Add Agency Client</h3>
                <p className="text-xs text-zinc-400">
                  Onboard a new client company into your Work Operating System.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="p-3 text-xs bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Client Brand Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. BrightWave Dental"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                  }}
                  className={`w-full px-3.5 py-2 text-xs bg-zinc-950 border rounded-lg text-white placeholder-zinc-500 focus:outline-none ${
                    formErrors.name ? "border-rose-500" : "border-zinc-800 focus:border-sky-500"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Legal / Company Entity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. BrightWave Dental Care Inc."
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Industry / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Healthcare & Aesthetics, SaaS, E-Commerce"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">
                    Enable Client Portal Access
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Allows contacts to view project progress and approve deliverables.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.portalAccessEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, portalAccessEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Creating Client..." : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
