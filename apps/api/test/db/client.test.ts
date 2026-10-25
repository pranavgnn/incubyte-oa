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
});
