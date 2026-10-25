import { VEHICLE_CATEGORIES } from "@dealership/shared";
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

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

export const vehicleCategory = pgEnum("vehicle_category", VEHICLE_CATEGORIES);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    category: vehicleCategory("category").notNull(),
    // Whole currency units, so there is no floating-point rounding.
    price: integer("price").notNull(),
    quantity: integer("quantity").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // The last line of defence behind the atomic purchase update.
  (table) => [check("vehicles_quantity_non_negative", sql`${table.quantity} >= 0`)],
);
