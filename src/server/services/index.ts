/**
 * KaryaLaya 2.0 — Core Agency Services
 * The central business logic implementing the Core Loop:
 * Agency Owner creates Client + Project -> adds Deliverables -> assigns Tasks to members ->
 * Members update progress -> Owner dashboard reflects status -> Owner shares Portal link ->
 * Client approves or requests revisions.
 */

export * from "./deliverable-state-machine";
export * from "./project-templates";
export * from "./agency-work";
export * from "./progress";
export * from "./dashboard";
export * from "./notification";
export * from "./comments";
export * from "./files";
export * from "./client-portal";
export * from "./social-media";
export * from "./calendar";
export * from "./team";

export interface AgencyMetrics {
  activeProjects: number;
  openTasks: number;
  pendingReviews: number;
  teamWorkloadPercent: number;
}

export const AgencyService = {
  getMetrics: async (): Promise<AgencyMetrics> => {
    return {
      activeProjects: 3,
      openTasks: 18,
      pendingReviews: 4,
      teamWorkloadPercent: 78,
    };
  },
};
