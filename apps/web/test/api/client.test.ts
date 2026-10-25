import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApiClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import { server } from "../msw/server";

const baseUrl = "http://api.test";
const pingUrl = `${baseUrl}/api/ping`;
const pingSchema = z.strictObject({ status: z.literal("ok") });

function errorBody(code: string, message: string, details: unknown[] = []) {
  return { error: { code, message, details } };
}

describe("api client", () => {
  it("parses a successful response with the given schema", async () => {
    server.use(http.get(pingUrl, () => HttpResponse.json({ status: "ok" })));
    const client = createApiClient({ baseUrl });

    await expect(client.request("/api/ping", { schema: pingSchema })).resolves.toEqual({
      status: "ok",
    });
  });

  it("throws an ApiError carrying the error response's code, message and details", async () => {
    const details = [{ path: ["email"], message: "Invalid email address" }];
    server.use(
      http.get(pingUrl, () =>
        HttpResponse.json(errorBody("VALIDATION_ERROR", "Request validation failed", details), {
          status: 400,
        }),
      ),
    );
    const client = createApiClient({ baseUrl });

    const error = await client.request("/api/ping", { schema: pingSchema }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details,
    });
  });

  it.each([
    ["a non-JSON error page", () => new HttpResponse("<h1>Bad gateway</h1>", { status: 502 })],
    ["an error body in the wrong shape", () => HttpResponse.json({ oops: 1 }, { status: 500 })],
    ["a success body the schema rejects", () => HttpResponse.json({ status: "nope" })],
  ])("throws a generic INTERNAL_ERROR ApiError for %s", async (_label, resolver) => {
    server.use(http.get(pingUrl, resolver));
    const client = createApiClient({ baseUrl });

    const error = await client.request("/api/ping", { schema: pingSchema }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Unexpected response from the server",
      details: [],
    });
  });
});
