"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PROJECT_TEMPLATES, ProjectTemplate } from "@/server/services/project-templates";

interface ClientOption {
  id: string;
  name: string;
}

interface DeliverableSnippet {
  id: string;
  title: string;
  serviceType: string;
  status: string;
  progressPercent: number;
}

interface ProjectItem {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: string | null;
  dueDate?: string | null;
  client: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  deliverables: DeliverableSnippet[];
  tasks: { id: string; status: string }[];
}

export default function ProjectsCataloguePage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("OWNER");

  // Filters
  const [selectedClient, setSelectedClient] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // New Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("website-launch");
  const [formData, setFormData] = useState(() => ({
    name: "Website Launch Sprint",
    clientId: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  }));
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClient !== "ALL") params.append("client", selectedClient);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [clientRes, userRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/auth/me"),
        ]);
        if (!active) return;

        if (clientRes.ok) {
          const clientData = await clientRes.json();
          setClients(clientData.clients || []);
          if (clientData.clients?.length > 0) {
            setFormData((prev) => (prev.clientId ? prev : { ...prev, clientId: clientData.clients[0].id }));
          }
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) setCurrentUserRole(userData.user.role);
        }
      } catch (err) {
        console.error("Error loading dependencies:", err);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFiltered() {
      try {
        const params = new URLSearchParams();
        if (selectedClient !== "ALL") params.append("client", selectedClient);
        if (selectedStatus !== "ALL") params.append("status", selectedStatus);

        const res = await fetch(`/api/projects?${params.toString()}`);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFiltered();
    return () => {
      active = false;
    };
  }, [selectedClient, selectedStatus]);

  const canCreateProject = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = PROJECT_TEMPLATES[tplId];
    if (tpl) {
      setFormData((prev) => ({
        ...prev,
        name: tpl.name,
        description: tpl.description,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: "Custom Agency Project",
        description: "",
      }));
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = "Project name is required.";
    if (!formData.clientId) errors.clientId = "Please select an agency client.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          clientId: formData.clientId,
          description: formData.description?.trim() || null,
          startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          templateId: selectedTemplateId === "none" ? undefined : selectedTemplateId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.client.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const activeTemplate: ProjectTemplate | null =
    selectedTemplateId !== "none" ? PROJECT_TEMPLATES[selectedTemplateId] : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Projects Portfolio
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Active Projects</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deliverable pipelines, workstream execution, and client approval tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreateProject ? (
            <button
              onClick={() => {
                setFormErrors({});
                setSubmitError(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg shadow-sm transition-transform active:scale-95"
            >
              + New Project
            </button>
          ) : (
            <span className="text-xs px-3 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Role: {currentUserRole} (Read-only)
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Client filter */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                Client: {c.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Search box */}
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 min-w-[200px]"
          />
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          Showing {filteredProjects.length} of {projects.length} Projects
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-44 rounded-xl bg-zinc-900/40 border border-zinc-850 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 text-lg">
            📂
          </div>
          <h3 className="text-base font-semibold text-white">No projects found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {selectedClient !== "ALL" || selectedStatus !== "ALL" || searchQuery
              ? "No projects match your current filter settings. Reset filters to see all campaigns."
              : "Create your first agency campaign using one of our verified project templates."}
          </p>
          {canCreateProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg shadow-sm"
            >
              + Create Project from Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => {
            const totalDeliv = project.deliverables.length;
            const completedDeliv = project.deliverables.filter(
              (d) => d.status === "APPROVED" || d.status === "DELIVERED"
            ).length;
            const progressPercent =
              totalDeliv > 0 ? Math.round((completedDeliv / totalDeliv) * 100) : 0;

            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter((t) => t.status === "DONE").length;

            return (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="p-6 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl transition-all shadow-xl group block"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40 font-semibold">
                        Client: {project.client.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-mono">
                        {project.status}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Lead: <strong className="text-zinc-200">{project.owner.name}</strong>
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                      {project.name}
                    </h2>
                    {project.description && (
                      <p className="text-xs text-zinc-400 max-w-2xl line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {progressPercent}% Complete
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {completedDeliv} / {totalDeliv} Deliverables
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deliverables summary strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                  <div>
                    <div className="text-zinc-500 text-[11px]">Deliverables</div>
                    <div className="font-bold text-white mt-0.5">
                      {totalDeliv} Outcomes Scheduled
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Tasks Execution</div>
                    <div className="font-bold text-white mt-0.5">
                      {completedTasks} / {totalTasks} Tasks Done
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Service Workstreams</div>
                    <div className="font-bold text-sky-400 mt-0.5">
                      {Array.from(new Set(project.deliverables.map((d) => d.serviceType))).join(
                        " · "
                      ) || "General"}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-[11px]">Target Launch</div>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {project.dueDate
                        ? new Date(project.dueDate).toLocaleDateString()
                        : "No due date"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Project Modal with Template Picker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Create Agency Project</h3>
                <p className="text-xs text-zinc-400">
                  Select a workflow template to auto-generate deliverables and starter tasks.
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

            <form onSubmit={handleCreateProject} className="space-y-4">
              {/* Template Picker Pills */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Select Project Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "website-launch", name: "Website Launch", icon: "🌐" },
                    { id: "social-media-monthly", name: "Social Media Monthly", icon: "📱" },
                    { id: "video-production", name: "Video Production", icon: "🎬" },
                    { id: "brand-identity", name: "Brand Identity", icon: "🎨" },
                  ].map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <button
                        type="button"
                        key={tpl.id}
                        onClick={() => handleTemplateSelect(tpl.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-sky-950/70 border-sky-500 text-white shadow-md ring-1 ring-sky-500"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="text-lg mb-1">{tpl.icon}</div>
                        <div className="text-xs font-bold text-white">{tpl.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Preview Box */}
              {activeTemplate && (
                <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-sky-400 uppercase font-semibold">
                      Template Blueprint: {activeTemplate.name}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {activeTemplate.deliverables.length} Deliverables Auto-Generated
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">{activeTemplate.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeTemplate.deliverables.map((deliv, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono"
                      >
                        {deliv.title} ({deliv.serviceType})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Agency Client *
                </label>
                {clients.length === 0 ? (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs text-amber-300">
                    No clients created yet. Please create a client first from the Clients page.
                  </div>
                ) : (
                  <select
                    value={formData.clientId}
                    onChange={(e) => {
                      setFormData({ ...formData, clientId: e.target.value });
                      if (formErrors.clientId) setFormErrors({ ...formErrors, clientId: "" });
                    }}
                    className={`w-full px-3.5 py-2 text-xs bg-zinc-950 border rounded-lg text-white focus:outline-none ${
                      formErrors.clientId
                        ? "border-rose-500"
                        : "border-zinc-800 focus:border-sky-500"
                    }`}
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.clientId && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.clientId}</p>
                )}
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                  }}
                  className={`w-full px-3.5 py-2 text-xs bg-zinc-950 border rounded-lg text-white focus:outline-none ${
                    formErrors.name ? "border-rose-500" : "border-zinc-800 focus:border-sky-500"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Scope & Objective
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-lg text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-lg text-white focus:outline-none"
                  />
                </div>
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
                  disabled={submitting || clients.length === 0}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Instantiating Project..." : "Launch Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
