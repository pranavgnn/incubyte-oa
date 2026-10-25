import type { User } from "@dealership/shared";
import type { Database } from "../db/client.js";
import { users } from "../db/schema.js";
import type { NewUser, UserRepository } from "../services/auth-service.js";

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(user: NewUser): Promise<User> {
    const [created] = await this.db
      .insert(users)
      .values(user)
      .returning({ id: users.id, email: users.email, role: users.role });
    return created as User;
  }
}
