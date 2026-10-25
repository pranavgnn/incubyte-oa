import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createAuthApi } from "@/api/auth-api";
import { createApiClient } from "@/api/client";
import { server } from "../msw/server";

const baseUrl = "http://api.test";
const user = {
  id: "4c1d2a4e-8f7b-4d5e-9a3c-1b2c3d4e5f60",
  email: "alice@example.com",
  role: "user",
} as const;

describe("auth api", () => {
  it("registers by posting exactly { email, password } as JSON and returns the session", async () => {
    let received: unknown;
    let contentType: string | null = null;
    server.use(
      http.post(`${baseUrl}/api/auth/register`, async ({ request }) => {
        contentType = request.headers.get("Content-Type");
        received = await request.json();
        return HttpResponse.json({ token: "t0k3n", user }, { status: 201 });
      }),
    );
    const auth = createAuthApi(createApiClient({ baseUrl }));
    // The register form also holds confirmPassword; it must never be sent.
    const formValues = {
      email: "alice@example.com",
      password: "correct horse",
      confirmPassword: "correct horse",
    };

    const session = await auth.register(formValues);

    expect(contentType).toBe("application/json");
    expect(received).toEqual({ email: "alice@example.com", password: "correct horse" });
    expect(session).toEqual({ token: "t0k3n", user });
  });

  it("logs in by posting exactly { email, password } and returns the session", async () => {
    let received: unknown;
    server.use(
      http.post(`${baseUrl}/api/auth/login`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ token: "t0k3n", user });
      }),
    );
    const auth = createAuthApi(createApiClient({ baseUrl }));
    const formValues = { email: "alice@example.com", password: "correct horse", remember: true };

    const session = await auth.login(formValues);

    expect(received).toEqual({ email: "alice@example.com", password: "correct horse" });
    expect(session).toEqual({ token: "t0k3n", user });
  });
});
