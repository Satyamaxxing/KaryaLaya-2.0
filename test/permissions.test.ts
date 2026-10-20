import { describe, it } from "node:test";
import assert from "node:assert";
import { can } from "../src/server/permissions";
import { AuthenticatedUser } from "../src/server/auth";

describe("KaryaLaya 2.0 — Permission Matrix (can)", () => {
  const orgA = "org-alpha-123";
  const orgB = "org-beta-456";

  const owner: AuthenticatedUser = {
    id: "user-owner",
    email: "owner@alpha.agency",
    name: "Meera Sen",
    role: "OWNER",
    organizationId: orgA,
    organizationName: "Alpha Agency",
  };

  const manager: AuthenticatedUser = {
    id: "user-manager",
    email: "manager@alpha.agency",
    name: "Rohan Varma",
    role: "MANAGER",
    organizationId: orgA,
    organizationName: "Alpha Agency",
  };

  const member: AuthenticatedUser = {
    id: "user-member",
    email: "dev@alpha.agency",
    name: "Satyam Kumar",
    role: "MEMBER",
    organizationId: orgA,
    organizationName: "Alpha Agency",
  };

  const client: AuthenticatedUser = {
    id: "client-sarah",
    email: "sarah@brightwave.com",
    name: "Sarah Jenkins",
    role: "CLIENT",
    organizationId: orgA,
    organizationName: "Alpha Agency",
    clientId: "client-brightwave",
    canApprove: true,
  };

  it("OWNER has full administrative & financial permissions in their org", () => {
    assert.strictEqual(can(owner, "MANAGE_ORGANIZATION", { organizationId: orgA }), true);
    assert.strictEqual(can(owner, "VIEW_FINANCIALS", { organizationId: orgA }), true);
    assert.strictEqual(can(owner, "INVITE_MEMBERS", { organizationId: orgA }), true);
    assert.strictEqual(can(owner, "CREATE_PROJECT", { organizationId: orgA }), true);
    assert.strictEqual(can(owner, "CREATE_DELIVERABLE", { organizationId: orgA }), true);
  });

  it("MANAGER can oversee delivery & invite, but cannot view financials or manage org", () => {
    assert.strictEqual(can(manager, "MANAGE_ORGANIZATION", { organizationId: orgA }), false);
    assert.strictEqual(can(manager, "VIEW_FINANCIALS", { organizationId: orgA }), false);
    assert.strictEqual(can(manager, "INVITE_MEMBERS", { organizationId: orgA }), true);
    assert.strictEqual(can(manager, "CREATE_PROJECT", { organizationId: orgA }), true);
    assert.strictEqual(can(manager, "CREATE_DELIVERABLE", { organizationId: orgA }), true);
    assert.strictEqual(can(manager, "ASSIGN_TASK", { organizationId: orgA }), true);
  });

  it("MEMBER can view projects & tasks and update assigned work, but cannot manage or invite", () => {
    assert.strictEqual(can(member, "MANAGE_ORGANIZATION", { organizationId: orgA }), false);
    assert.strictEqual(can(member, "VIEW_FINANCIALS", { organizationId: orgA }), false);
    assert.strictEqual(can(member, "INVITE_MEMBERS", { organizationId: orgA }), false);
    assert.strictEqual(can(member, "CREATE_PROJECT", { organizationId: orgA }), false);
    assert.strictEqual(can(member, "CREATE_CLIENT", { organizationId: orgA }), false);

    // Member can update their own assigned task
    assert.strictEqual(
      can(member, "UPDATE_TASK_STATUS", { organizationId: orgA, assigneeId: member.id }),
      true
    );

    // Member cannot update tasks assigned to someone else
    assert.strictEqual(
      can(member, "UPDATE_TASK_STATUS", { organizationId: orgA, assigneeId: "user-someone-else" }),
      false
    );
  });

  it("CLIENT is strictly scoped to client portal approvals and cannot view internal tasks", () => {
    assert.strictEqual(can(client, "MANAGE_ORGANIZATION", { organizationId: orgA }), false);
    assert.strictEqual(can(client, "VIEW_TASKS", { organizationId: orgA }), false);
    assert.strictEqual(can(client, "CREATE_PROJECT", { organizationId: orgA }), false);
    assert.strictEqual(can(client, "CREATE_DELIVERABLE", { organizationId: orgA }), false);

    // Can view their own client portal
    assert.strictEqual(
      can(client, "VIEW_CLIENT_PORTAL", { organizationId: orgA, clientId: "client-brightwave" }),
      true
    );

    // Cannot view another client's portal
    assert.strictEqual(
      can(client, "VIEW_CLIENT_PORTAL", { organizationId: orgA, clientId: "client-other-company" }),
      false
    );

    // Can sign off on deliverables
    assert.strictEqual(can(client, "APPROVE_AS_CLIENT", { organizationId: orgA }), true);
  });

  it("Any role is completely blocked when attempting actions across another organization (Org B)", () => {
    assert.strictEqual(can(owner, "VIEW_PROJECTS", { organizationId: orgB }), false);
    assert.strictEqual(can(manager, "VIEW_PROJECTS", { organizationId: orgB }), false);
    assert.strictEqual(can(member, "VIEW_PROJECTS", { organizationId: orgB }), false);
    assert.strictEqual(can(client, "VIEW_CLIENT_PORTAL", { organizationId: orgB }), false);
  });
});
