import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApiClient } from "@/api/client";
import { server } from "../msw/server";

const baseUrl = "http://api.test";
const pingSchema = z.strictObject({ status: z.literal("ok") });

describe("api client", () => {
  it("parses a successful response with the given schema", async () => {
    server.use(http.get(`${baseUrl}/api/ping`, () => HttpResponse.json({ status: "ok" })));
    const client = createApiClient({ baseUrl });

    await expect(client.request("/api/ping", { schema: pingSchema })).resolves.toEqual({
      status: "ok",
    });
  });
});
