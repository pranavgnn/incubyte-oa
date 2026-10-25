import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// Drizzle table definitions. Tables are added with the features that need them.

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Case-insensitive uniqueness enforced by the database itself, so rows
  // written without the API's normalisation (seed, manual SQL) are covered.
  (table) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`)],
);
