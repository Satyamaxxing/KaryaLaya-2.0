import { describe, it } from "node:test";
import assert from "node:assert";
import {
  canAccessRoute,
  getSidebarNavForRole,
  getDefaultRedirectForRole,
} from "../src/lib/permissions/route-permissions";
import { DashboardService } from "../src/server/services/dashboard";
import { AuthenticatedUser } from "../src/server/auth";

describe("KaryaLaya 2.0 — Role-Based Routing, Permissions & Dashboards", () => {
  describe("1. Route Permissions Map (canAccessRoute)", () => {
    it("MEMBER is denied access to owner/manager routes (/app/analytics, /app/automations, /app/team, /app/settings, /app/clients)", () => {
      assert.strictEqual(canAccessRoute("MEMBER", "/app/analytics"), false);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/automations"), false);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/team"), false);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/settings"), false);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/clients"), false);
    });

    it("MEMBER is granted access to specialist work routes", () => {
      assert.strictEqual(canAccessRoute("MEMBER", "/app/dashboard"), true);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/my-work"), true);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/projects"), true);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/projects/proj-123"), true);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/calendar"), true);
      assert.strictEqual(canAccessRoute("MEMBER", "/app/social"), true);
    });

    it("MANAGER can oversee delivery, clients & team, but cannot access org settings or analytics", () => {
      assert.strictEqual(canAccessRoute("MANAGER", "/app/dashboard"), true);
      assert.strictEqual(canAccessRoute("MANAGER", "/app/my-work"), true);
      assert.strictEqual(canAccessRoute("MANAGER", "/app/clients"), true);
      assert.strictEqual(canAccessRoute("MANAGER", "/app/projects"), true);
      assert.strictEqual(canAccessRoute("MANAGER", "/app/team"), true);
      assert.strictEqual(canAccessRoute("MANAGER", "/app/calendar"), true);
      assert.strictEqual(canAccessRoute("MANAGER", "/app/social"), true);

      assert.strictEqual(canAccessRoute("MANAGER", "/app/analytics"), false);
      assert.strictEqual(canAccessRoute("MANAGER", "/app/automations"), false);
      assert.strictEqual(canAccessRoute("MANAGER", "/app/settings"), false);
    });

    it("OWNER has full access across all workspace modules", () => {
      assert.strictEqual(canAccessRoute("OWNER", "/app/dashboard"), true);
      assert.strictEqual(canAccessRoute("OWNER", "/app/clients"), true);
      assert.strictEqual(canAccessRoute("OWNER", "/app/projects"), true);
      assert.strictEqual(canAccessRoute("OWNER", "/app/team"), true);
      assert.strictEqual(canAccessRoute("OWNER", "/app/analytics"), true);
      assert.strictEqual(canAccessRoute("OWNER", "/app/settings"), true);
      assert.strictEqual(canAccessRoute("OWNER", "/app/calendar"), true);
      assert.strictEqual(canAccessRoute("OWNER", "/app/social"), true);
    });

    it("CLIENT contact is denied on all /app/* routes and restricted to /client/*", () => {
      assert.strictEqual(canAccessRoute("CLIENT", "/app/dashboard"), false);
      assert.strictEqual(canAccessRoute("CLIENT", "/app/projects"), false);
      assert.strictEqual(canAccessRoute("CLIENT", "/app/clients"), false);
      assert.strictEqual(canAccessRoute("CLIENT", "/app/team"), false);
      assert.strictEqual(canAccessRoute("CLIENT", "/app/settings"), false);

      assert.strictEqual(canAccessRoute("CLIENT", "/client"), true);
      assert.strictEqual(canAccessRoute("CLIENT", "/client/projects/proj-123"), true);
    });
  });

  describe("2. Canonical Role-Based Sidebar Navigation", () => {
    it("OWNER sidebar contains exactly the 8 canonical Phase 0 links", () => {
      const nav = getSidebarNavForRole("OWNER");
      const labels = nav.map((i) => i.label);
      assert.deepStrictEqual(labels, [
        "Dashboard",
        "Clients",
        "Projects",
        "Calendar",
        "Social",
        "Team",
        "Analytics",
        "Settings",
      ]);
    });

    it("MANAGER sidebar contains exactly the 7 management & delivery links", () => {
      const nav = getSidebarNavForRole("MANAGER");
      const labels = nav.map((i) => i.label);
      assert.deepStrictEqual(labels, [
        "Dashboard",
        "My Work",
        "Clients",
        "Projects",
        "Calendar",
        "Social",
        "Team",
      ]);
    });

    it("MEMBER sidebar contains strictly the 5 execution & assigned work links", () => {
      const nav = getSidebarNavForRole("MEMBER");
      const labels = nav.map((i) => i.label);
      assert.deepStrictEqual(labels, [
        "Dashboard",
        "My Work",
        "Projects",
        "Calendar",
        "Social",
      ]);
    });

    it("CLIENT returns empty internal sidebar", () => {
      const nav = getSidebarNavForRole("CLIENT");
      assert.strictEqual(nav.length, 0);
    });
  });

  describe("3. Post-Login Role Destination Routing", () => {
    it("Redirects internal roles to /app/dashboard and client to /client", () => {
      assert.strictEqual(getDefaultRedirectForRole("OWNER"), "/app/dashboard");
      assert.strictEqual(getDefaultRedirectForRole("MANAGER"), "/app/dashboard");
      assert.strictEqual(getDefaultRedirectForRole("MEMBER"), "/app/dashboard");
      assert.strictEqual(getDefaultRedirectForRole("CLIENT"), "/client");
    });
  });

  describe("4. Dashboard Query Server-Side Scoping", () => {
    const ownerUser: AuthenticatedUser = {
      id: "test-owner-id",
      email: "owner@test.agency",
      name: "Meera Owner",
      role: "OWNER",
      organizationId: "non-existent-org",
      organizationName: "Test Agency",
    };

    const memberUser: AuthenticatedUser = {
      id: "test-member-id",
      email: "dev@test.agency",
      name: "Satyam Dev",
      role: "MEMBER",
      organizationId: "non-existent-org",
      organizationName: "Test Agency",
    };

    it("DashboardService returns role-scoped payload for OWNER with dueThisWeekTasks", async () => {
      const data = await DashboardService.getDashboardData(ownerUser);
      assert.strictEqual(data.role, "OWNER");
      assert.ok("needsAttention" in data);
      assert.ok("activeProjects" in data);
      assert.ok("teamWorkload" in data);
      assert.ok(Array.isArray(data.needsAttention.dueThisWeekTasks));
    });

    it("DashboardService returns role-scoped payload for MEMBER with task queues", async () => {
      const data = await DashboardService.getDashboardData(memberUser);
      assert.strictEqual(data.role, "MEMBER");
      assert.ok("myTasksToday" in data);
      assert.ok("overdueTasks" in data);
      assert.ok("revisionsRequested" in data);
      assert.ok("upcomingDeadlines" in data);
    });
  });
});
