import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { prisma } from "../src/server/db";
import { can, assertCan } from "../src/server/permissions";
import { AuthenticatedUser } from "../src/server/auth";

describe("KaryaLaya 2.0 — Multi-Tenant Isolation Tests", () => {
  let orgA: { id: string; name: string };
  let orgB: { id: string; name: string };
  let userA: AuthenticatedUser;
  let userB: AuthenticatedUser;
  let clientInOrgB: { id: string; name: string };

  before(async () => {
    // 1. Setup Tenant A
    const createdOrgA = await prisma.organization.create({
      data: { name: "Tenant Agency Alpha", slug: `alpha-${Date.now()}` },
    });
    orgA = createdOrgA;

    const createdUserA = await prisma.user.create({
      data: { name: "Owner Alpha", email: `owner-alpha-${Date.now()}@test.com` },
    });

    await prisma.membership.create({
      data: { organizationId: orgA.id, userId: createdUserA.id, role: "OWNER" },
    });

    userA = {
      id: createdUserA.id,
      email: createdUserA.email,
      name: createdUserA.name,
      role: "OWNER",
      organizationId: orgA.id,
      organizationName: orgA.name,
    };

    // 2. Setup Tenant B
    const createdOrgB = await prisma.organization.create({
      data: { name: "Tenant Agency Beta", slug: `beta-${Date.now()}` },
    });
    orgB = createdOrgB;

    const createdUserB = await prisma.user.create({
      data: { name: "Owner Beta", email: `owner-beta-${Date.now()}@test.com` },
    });

    await prisma.membership.create({
      data: { organizationId: orgB.id, userId: createdUserB.id, role: "OWNER" },
    });

    userB = {
      id: createdUserB.id,
      email: createdUserB.email,
      name: createdUserB.name,
      role: "OWNER",
      organizationId: orgB.id,
      organizationName: orgB.name,
    };

    // 3. Create a private client in Org B
    clientInOrgB = await prisma.client.create({
      data: {
        organizationId: orgB.id,
        name: "Confidential Client Beta",
        companyName: "Beta Corp",
      },
    });
  });

  after(async () => {
    // Cleanup test data
    if (orgA?.id) await prisma.organization.delete({ where: { id: orgA.id } }).catch(() => {});
    if (orgB?.id) await prisma.organization.delete({ where: { id: orgB.id } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("User from Org A cannot access data in Org B even with a valid known ID", async () => {
    // Even if User A somehow guesses clientInOrgB.id, can() strictly rejects it
    const hasAccess = can(userA, "VIEW_CLIENTS", {
      organizationId: orgB.id,
      clientId: clientInOrgB.id,
    });

    assert.strictEqual(hasAccess, false, "User A must not have permission to view Org B client");
  });

  it("assertCan throws an explicit Security exception on cross-tenant access attempt", () => {
    assert.throws(
      () => {
        assertCan(userA, "VIEW_CLIENTS", {
          organizationId: orgB.id,
          clientId: clientInOrgB.id,
        });
      },
      /Access Denied/,
      "Expected assertCan to throw Access Denied when attempting cross-tenant access"
    );
  });

  it("Database query with tenant scoping returns null when querying with guessed ID from another org", async () => {
    // Correct tenant-scoped query pattern used throughout KaryaLaya:
    // Every query scopes by organizationId: user.organizationId
    const result = await prisma.client.findFirst({
      where: {
        id: clientInOrgB.id,
        organizationId: userA.organizationId, // Scoped to User A's org
      },
    });

    assert.strictEqual(
      result,
      null,
      "Scoped database query must return null when querying an ID from a different tenant"
    );
  });

  it("User B from Org B can successfully access their own client in Org B", async () => {
    const hasAccess = can(userB, "VIEW_CLIENTS", {
      organizationId: orgB.id,
      clientId: clientInOrgB.id,
    });

    assert.strictEqual(
      hasAccess,
      true,
      "User B must have permission to access their own Org B client"
    );

    const result = await prisma.client.findFirst({
      where: {
        id: clientInOrgB.id,
        organizationId: userB.organizationId,
      },
    });

    assert.ok(result, "User B must be able to retrieve their own Org B client");
    assert.strictEqual(result?.id, clientInOrgB.id);
  });
});
