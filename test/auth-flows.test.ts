import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { prisma } from "../src/server/db";
import {
  signup,
  login,
  logout,
  inviteTeamMember,
  acceptInvite,
  getSessionByToken,
} from "../src/server/auth";

describe("KaryaLaya 2.0 — End-to-End Auth Flows", () => {
  const timestamp = Date.now();
  let createdOrgId: string;
  let ownerUser: { id: string; email: string };
  let ownerSessionToken: string;
  let invitationToken: string;
  let invitedTeammateEmail: string;

  after(async () => {
    if (createdOrgId) {
      await prisma.organization.delete({ where: { id: createdOrgId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("Flow 1: Signup creates Organization + User + Membership as OWNER", async () => {
    const signupEmail = `agency-founder-${timestamp}@test.com`;
    const result = await signup({
      agencyName: "Vortex Creative Studio",
      name: "Founder Maya",
      email: signupEmail,
      password: "securePassword123!",
      ip: `192.168.1.${timestamp % 250}`,
    });

    assert.ok(result.user, "Expected user to be returned");
    assert.strictEqual(result.user.role, "OWNER");
    assert.strictEqual(result.user.email, signupEmail);
    assert.ok(result.sessionToken, "Expected session token");

    createdOrgId = result.user.organizationId;
    ownerUser = { id: result.user.id, email: result.user.email };
    ownerSessionToken = result.sessionToken;

    // Verify session resolves in DB
    const session = await getSessionByToken(result.sessionToken);
    assert.ok(session);
    assert.strictEqual(session.id, result.user.id);
    assert.strictEqual(session.role, "OWNER");
  });

  it("Flow 2: Login authenticates valid credentials and rejects invalid passwords", async () => {
    // Valid password
    const loginResult = await login({
      email: ownerUser.email,
      password: "securePassword123!",
      ip: `192.168.2.${timestamp % 250}`,
    });
    assert.ok(loginResult.user);
    assert.strictEqual(loginResult.user.id, ownerUser.id);
    assert.strictEqual(loginResult.user.role, "OWNER");

    // Invalid password
    await assert.rejects(async () => {
      await login({
        email: ownerUser.email,
        password: "wrongPassword",
        ip: `192.168.2.${timestamp % 250}`,
      });
    }, /Invalid email or password/);
  });

  it("Flow 3: Owner invites a teammate with role MEMBER", async () => {
    invitedTeammateEmail = `video-editor-${timestamp}@test.com`;

    const inviteResult = await inviteTeamMember({
      invitedBy: {
        id: ownerUser.id,
        email: ownerUser.email,
        name: "Founder Maya",
        role: "OWNER",
        organizationId: createdOrgId,
        organizationName: "Vortex Creative Studio",
      },
      email: invitedTeammateEmail,
      role: "MEMBER",
      jobTitle: "Senior Motion Designer",
    });

    assert.ok(inviteResult.invitationId);
    assert.ok(inviteResult.token);
    assert.ok(inviteResult.inviteUrl.includes("/invite/"));

    invitationToken = inviteResult.token;

    // Verify invitation in DB
    const inv = await prisma.invitation.findUnique({
      where: { token: inviteResult.token },
    });
    assert.ok(inv);
    assert.strictEqual(inv.status, "PENDING");
    assert.strictEqual(inv.role, "MEMBER");
  });

  it("Flow 4: Teammate accepts invitation, sets password, and gains MEMBER session", async () => {
    const acceptResult = await acceptInvite({
      token: invitationToken,
      name: "Alex Rivera",
      password: "memberPassword456!",
    });

    assert.ok(acceptResult.user);
    assert.strictEqual(acceptResult.user.role, "MEMBER");
    assert.strictEqual(acceptResult.user.email, invitedTeammateEmail);
    assert.strictEqual(acceptResult.user.organizationId, createdOrgId);
    assert.strictEqual(acceptResult.user.jobTitle, "Senior Motion Designer");

    // Verify invitation is marked ACCEPTED
    const inv = await prisma.invitation.findUnique({
      where: { token: invitationToken },
    });
    assert.strictEqual(inv?.status, "ACCEPTED");

    // Verify teammate can now log in directly
    const memberLogin = await login({
      email: invitedTeammateEmail,
      password: "memberPassword456!",
      ip: `192.168.3.${timestamp % 250}`,
    });
    assert.strictEqual(memberLogin.user.role, "MEMBER");
  });

  it("Flow 5: Logout destroys session token", async () => {
    await logout(ownerSessionToken);

    const session = await getSessionByToken(ownerSessionToken);
    assert.strictEqual(session, null, "Session must be null after logout");
  });
});
