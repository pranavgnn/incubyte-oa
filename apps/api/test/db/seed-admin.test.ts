import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { users } from "../../src/db/schema.js";
import { seedAdmin } from "../../src/db/seed-admin.js";
import { BcryptPasswordHasher } from "../../src/services/bcrypt-password-hasher.js";
import { testDatabase } from "../db.js";

type UserRow = { id: string; email: string; role: string; password_hash: string };

async function usersWithEmail(email: string): Promise<UserRow[]> {
  const { rows } = await testDatabase.pool.query<UserRow>(
    "SELECT id, email, role, password_hash FROM users WHERE lower(email) = lower($1)",
    [email],
  );
  return rows;
}

const hasher = new BcryptPasswordHasher();

describe("seedAdmin", () => {
  it("creates an admin whose stored hash matches the returned password", async () => {
    const credentials = await seedAdmin(testDatabase.db, "admin@example.com", hasher);

    expect(credentials.email).toBe("admin@example.com");
    const rows = await usersWithEmail("admin@example.com");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.role).toBe("admin");
    expect(await bcrypt.compare(credentials.password, rows[0]?.password_hash ?? "")).toBe(true);
  });

  it("resets the password on every run, keeping a single admin row with the same id", async () => {
    const first = await seedAdmin(testDatabase.db, "admin@example.com", hasher);
    const [before] = await usersWithEmail("admin@example.com");

    const second = await seedAdmin(testDatabase.db, "admin@example.com", hasher);

    expect(second.password).not.toBe(first.password);
    const rows = await usersWithEmail("admin@example.com");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(before?.id);
    const hash = rows[0]?.password_hash ?? "";
    expect(await bcrypt.compare(second.password, hash)).toBe(true);
    expect(await bcrypt.compare(first.password, hash)).toBe(false);
  });

  it("promotes an existing regular user with that email, in any case, to admin with a new password", async () => {
    await testDatabase.db
      .insert(users)
      .values({ email: "Admin@Example.com", passwordHash: "old-hash", role: "user" });

    const credentials = await seedAdmin(testDatabase.db, "admin@example.com", hasher);

    const rows = await usersWithEmail("admin@example.com");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.role).toBe("admin");
    expect(await bcrypt.compare(credentials.password, rows[0]?.password_hash ?? "")).toBe(true);
  });
});
