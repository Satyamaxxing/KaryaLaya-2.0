import { describe, it } from "node:test";
import assert from "node:assert";
import { POST as checkEmailRoute } from "../src/app/api/auth/check-email/route";
import { POST as loginRoute } from "../src/app/api/auth/login/route";
import { POST as signupRoute } from "../src/app/api/auth/signup/route";
import { POST as forgotPasswordRoute } from "../src/app/api/auth/forgot-password/route";
import { POST as resetPasswordRoute } from "../src/app/api/auth/reset-password/route";
import { GET as oauthRoute } from "../src/app/api/auth/oauth/[provider]/route";

describe("KaryaLaya 2.0 — Auth API Route Endpoints", () => {
  const timestamp = Date.now();

  it("POST /api/auth/check-email: returns exists:true for seeded user", async () => {
    const req = new Request("http://localhost:3000/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "meera@karyalaya.agency" }),
    });

    const res = await checkEmailRoute(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.exists, true);
    assert.strictEqual(data.name, "Meera Sen");
  });

  it("POST /api/auth/check-email: returns 400 when email is omitted", async () => {
    const req = new Request("http://localhost:3000/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await checkEmailRoute(req);
    assert.strictEqual(res.status, 400);
  });

  it("POST /api/auth/login: fails on invalid credentials with 401", async () => {
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "meera@karyalaya.agency", password: "wrong-password" }),
    });

    const res = await loginRoute(req);
    assert.strictEqual(res.status, 401);
  });

  it("POST /api/auth/login: successfully logs in seeded user and sets cookie", async () => {
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "meera@karyalaya.agency", password: "password123" }),
    });

    const res = await loginRoute(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, "OWNER");
    assert.ok(res.cookies.get("karyalaya_session"));
  });

  it("POST /api/auth/signup: validates required fields and returns 400 on missing params", async () => {
    const req = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `test-${timestamp}@agency.test` }),
    });

    const res = await signupRoute(req);
    assert.strictEqual(res.status, 400);
  });

  it("POST /api/auth/signup: creates workspace and sets session cookie", async () => {
    const signupEmail = `api-signup-${timestamp}@test.agency`;
    const req = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agencyName: "Prism Creative Labs",
        name: "David Kim",
        email: signupEmail,
        password: "SecretPassword2026!",
      }),
    });

    const res = await signupRoute(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, signupEmail);
    assert.strictEqual(data.user.role, "OWNER");
    assert.ok(res.cookies.get("karyalaya_session"));
  });

  it("POST /api/auth/forgot-password: generates reset response", async () => {
    const req = new Request("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "meera@karyalaya.agency" }),
    });

    const res = await forgotPasswordRoute(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.resetToken);
  });

  it("POST /api/auth/reset-password: rejects empty token or password", async () => {
    const req = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "", password: "" }),
    });

    const res = await resetPasswordRoute(req);
    assert.strictEqual(res.status, 400);
  });

  it("GET /api/auth/oauth/google: returns 400 or redirect when keys not configured", async () => {
    const req = new Request("http://localhost:3000/api/auth/oauth/google", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const res = await oauthRoute(req, {
      params: Promise.resolve({ provider: "google" }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.configured, false);
    assert.strictEqual(data.error, "GOOGLE_NOT_CONFIGURED");
  });

  it("GET /api/auth/oauth/github: returns 400 or redirect when keys not configured", async () => {
    const req = new Request("http://localhost:3000/api/auth/oauth/github", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const res = await oauthRoute(req, {
      params: Promise.resolve({ provider: "github" }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.configured, false);
    assert.strictEqual(data.error, "GITHUB_NOT_CONFIGURED");
  });
});
