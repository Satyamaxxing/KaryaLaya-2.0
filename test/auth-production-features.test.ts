import { describe, it, after } from "node:test";
import assert from "node:assert";
import { prisma } from "../src/server/db";
import {
  checkEmailExists,
  requestPasswordReset,
  verifyResetToken,
  resetPasswordWithToken,
  login,
  isGoogleOAuthConfigured,
  isGitHubOAuthConfigured,
  generateOAuthState,
  getGoogleOAuthUrl,
  getGitHubOAuthUrl,
  handleOAuthUser,
  getSessionByToken,
  getBaseUrl,
} from "../src/server/auth";

describe("KaryaLaya 2.0 — Production Auth Features & OAuth Architecture", () => {
  const timestamp = Date.now();
  let createdOAuthOrgId: string;

  after(async () => {
    if (createdOAuthOrgId) {
      await prisma.organization.delete({ where: { id: createdOAuthOrgId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe("1. Email Existence & Account Check", () => {
    it("identifies existing internal team user", async () => {
      const result = await checkEmailExists("meera@karyalaya.agency");
      assert.strictEqual(result.exists, true);
      assert.strictEqual(result.isClient, false);
      assert.strictEqual(result.name, "Meera Sen");
    });

    it("identifies existing client portal contact", async () => {
      const result = await checkEmailExists("sarah@brightwave.com");
      assert.strictEqual(result.exists, true);
      assert.strictEqual(result.isClient, true);
      assert.strictEqual(result.name, "Sarah Jenkins");
    });

    it("correctly flags nonexistent email", async () => {
      const result = await checkEmailExists(`nonexistent-${timestamp}@karyalaya.agency`);
      assert.strictEqual(result.exists, false);
      assert.strictEqual(result.isClient, false);
    });
  });

  describe("2. Cryptographic Password Reset Flow", () => {
    const testResetEmail = `reset-user-${timestamp}@test.agency`;
    let userResetToken: string;

    it("generates a signed HMAC reset token for existing user", async () => {
      // Create user for reset test
      const org = await prisma.organization.create({
        data: { name: "Reset Test Org", slug: `reset-org-${timestamp}` },
      });
      const user = await prisma.user.create({
        data: {
          email: testResetEmail,
          name: "Reset Tester",
          passwordHash: "initial-hash",
        },
      });
      await prisma.membership.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: "MEMBER",
        },
      });

      const reqResult = await requestPasswordReset({ email: testResetEmail });
      assert.strictEqual(reqResult.success, true);
      assert.ok(reqResult.resetToken, "Reset token must be provided");
      userResetToken = reqResult.resetToken;
    });

    it("verifies and validates the generated reset token", () => {
      const payload = verifyResetToken(userResetToken);
      assert.ok(payload);
      assert.strictEqual(payload.email, testResetEmail);
      assert.strictEqual(payload.type, "user");
    });

    it("rejects tampered or forged tokens", () => {
      const tampered = userResetToken.substring(0, userResetToken.length - 4) + "XXXX";
      const payload = verifyResetToken(tampered);
      assert.strictEqual(payload, null);
    });

    it("rejects short passwords and resets password when valid", async () => {
      // Short password rejected
      await assert.rejects(async () => {
        await resetPasswordWithToken({
          token: userResetToken,
          newPassword: "short",
        });
      }, /at least 8 characters/);

      // Valid password reset
      const resetRes = await resetPasswordWithToken({
        token: userResetToken,
        newPassword: "BrandNewSecurePassword2026!",
      });
      assert.strictEqual(resetRes.success, true);

      // Verify user can now log in with the new password
      const loginRes = await login({
        email: testResetEmail,
        password: "BrandNewSecurePassword2026!",
      });
      assert.ok(loginRes.user);
      assert.strictEqual(loginRes.user.email, testResetEmail);
    });
  });

  describe("3. OAuth Core Engine & State Validation", () => {
    it("reports provider configuration status without crashing or fabricating keys", () => {
      // By default without custom env, returns false
      const googleConfigured = isGoogleOAuthConfigured();
      const githubConfigured = isGitHubOAuthConfigured();
      assert.strictEqual(typeof googleConfigured, "boolean");
      assert.strictEqual(typeof githubConfigured, "boolean");
    });

    it("generates cryptographically random OAuth state", () => {
      const state1 = generateOAuthState();
      const state2 = generateOAuthState();
      assert.strictEqual(state1.length, 48); // 24 bytes in hex
      assert.notStrictEqual(state1, state2);
    });

    it("generates RFC-compliant OAuth authorization URLs", () => {
      const state = generateOAuthState();
      const redirectUri = "http://localhost:3000/api/auth/callback/google";
      const url = getGoogleOAuthUrl(state, redirectUri);
      assert.ok(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth?"));
      assert.ok(url.includes(`state=${state}`));
      assert.ok(url.includes("response_type=code"));
      assert.ok(url.includes("scope=openid+email+profile"));

      const githubUrl = getGitHubOAuthUrl(state, "http://localhost:3000/api/auth/callback/github");
      assert.ok(githubUrl.startsWith("https://github.com/login/oauth/authorize?"));
      assert.ok(githubUrl.includes(`state=${state}`));
    });

    it("dynamically resolves production origin vs localhost development via getBaseUrl", () => {
      // 1. Deployed Vercel request with x-forwarded headers
      const vercelReq = new Request("https://karyalaya20.vercel.app/api/auth/oauth/github", {
        headers: {
          "x-forwarded-host": "karyalaya20.vercel.app",
          "x-forwarded-proto": "https",
        },
      });
      assert.strictEqual(getBaseUrl(vercelReq), "https://karyalaya20.vercel.app");

      // 2. OAuth callback URI generated from Vercel request uses deployed origin
      const vercelCallback = `${getBaseUrl(vercelReq)}/api/auth/callback/github`;
      assert.strictEqual(vercelCallback, "https://karyalaya20.vercel.app/api/auth/callback/github");
      const vercelAuthUrl = getGitHubOAuthUrl("test-state", vercelCallback);
      assert.ok(
        vercelAuthUrl.includes(
          "redirect_uri=https%3A%2F%2Fkaryalaya20.vercel.app%2Fapi%2Fauth%2Fcallback%2Fgithub"
        )
      );

      // 3. Localhost request in development preserves http://localhost:3000
      const localReq = new Request("http://localhost:3000/api/auth/oauth/github", {
        headers: {
          host: "localhost:3000",
        },
      });
      assert.strictEqual(getBaseUrl(localReq), "http://localhost:3000");

      const localCallback = `${getBaseUrl(localReq)}/api/auth/callback/github`;
      assert.strictEqual(localCallback, "http://localhost:3000/api/auth/callback/github");
      const localAuthUrl = getGitHubOAuthUrl("test-state", localCallback);
      assert.ok(
        localAuthUrl.includes(
          "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgithub"
        )
      );
    });

    it("atomically registers new OAuth user as OWNER and returns valid session", async () => {
      const oauthEmail = `oauth-founder-${timestamp}@gmail.com`;
      const result = await handleOAuthUser({
        email: oauthEmail,
        name: "Elena Rostova",
        provider: "google",
      });

      assert.ok(result.user);
      assert.strictEqual(result.user.email, oauthEmail);
      assert.strictEqual(result.user.name, "Elena Rostova");
      assert.strictEqual(result.user.role, "OWNER");
      assert.ok(result.sessionToken);

      createdOAuthOrgId = result.user.organizationId;

      // Verify session exists in DB
      const session = await getSessionByToken(result.sessionToken);
      assert.ok(session);
      assert.strictEqual(session.id, result.user.id);
      assert.strictEqual(session.role, "OWNER");
    });

    it("authenticates existing OAuth user and preserves their membership", async () => {
      const oauthEmail = `oauth-founder-${timestamp}@gmail.com`;
      const result = await handleOAuthUser({
        email: oauthEmail,
        name: "Elena Rostova",
        provider: "google",
      });

      assert.ok(result.user);
      assert.strictEqual(result.user.email, oauthEmail);
      assert.strictEqual(result.user.organizationId, createdOAuthOrgId);
      assert.strictEqual(result.user.role, "OWNER");
    });
  });
});
