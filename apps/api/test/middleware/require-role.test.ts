import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { authenticate } from "../../src/middleware/authenticate.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { requireRole } from "../../src/middleware/require-role.js";
import { JoseTokenVerifier } from "../../src/services/jose-token-verifier.js";
import { TEST_JWT_SECRET } from "../helpers/build-app.js";
import { signToken } from "../helpers/tokens.js";

// No production route uses requireRole yet, so it is exercised on a
// throwaway app wired the way real admin routes will be.
function adminOnlyApp() {
  const app = express();
  app.get(
    "/admin-only",
    authenticate(new JoseTokenVerifier(TEST_JWT_SECRET)),
    requireRole("admin"),
    (_req, res) => {
      res.json({ ok: true });
    },
  );
  app.use(errorHandler);
  return app;
}

async function bearer(role: string) {
  return `Bearer ${await signToken({ sub: randomUUID(), role })}`;
}

describe("requireRole", () => {
  it("lets a caller with the required role through", async () => {
    const response = await request(adminOnlyApp())
      .get("/admin-only")
      .set("Authorization", await bearer("admin"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("returns 403 FORBIDDEN for an authenticated caller without the role", async () => {
    const response = await request(adminOnlyApp())
      .get("/admin-only")
      .set("Authorization", await bearer("user"));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Insufficient permissions", details: [] },
    });
  });
});
