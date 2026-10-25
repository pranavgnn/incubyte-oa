import { describe, expect, it, vi } from "vitest";
import { createDb } from "../../src/db/client.js";

describe("createDb", () => {
  it("survives errors from idle pool clients instead of crashing the process", async () => {
    const { pool } = createDb("postgres://user:pass@localhost:1/unused");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // What pg emits when the server drops an idle connection (restart, Neon idle timeout).
    expect(() =>
      pool.emit("error", new Error("terminating connection due to administrator command")),
    ).not.toThrow();

    consoleError.mockRestore();
    await pool.end();
  });

  it("applies caller pool options so serverless entries can keep the pool small", async () => {
    const { pool } = createDb("postgres://user:pass@localhost:1/unused", {
      max: 2,
      idleTimeoutMillis: 1234,
    });

    expect(pool.options.max).toBe(2);
    expect(pool.options.idleTimeoutMillis).toBe(1234);

    await pool.end();
  });
});
