import type { User } from "@dealership/shared";
import { eq } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { users } from "../db/schema.js";
import { ConflictError } from "../errors/app-error.js";
import type { NewUser, UserRepository } from "../services/auth-service.js";

// Postgres error code for unique_violation.
const UNIQUE_VIOLATION = "23505";

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(user: NewUser): Promise<User> {
    try {
      const [created] = await this.db
        .insert(users)
        .values(user)
        .returning({ id: users.id, email: users.email, role: users.role });
      return created as User;
    } catch (error) {
      // The insert itself is the uniqueness check, so two concurrent
      // registrations cannot both pass a separate lookup.
      if (isUniqueViolation(error)) {
        throw new ConflictError("Email is already registered", [], { cause: error });
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.email, email));
    return user;
  }
}

// Drizzle wraps driver errors, keeping the pg error as the cause.
function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined;
  return (cause as { code?: unknown } | undefined)?.code === UNIQUE_VIOLATION;
}
