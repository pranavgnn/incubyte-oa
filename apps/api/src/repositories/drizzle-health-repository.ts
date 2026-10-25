import type { Database } from "../db/client.js";
import type { HealthRepository } from "../services/health-service.js";

export class DrizzleHealthRepository implements HealthRepository {
  constructor(private readonly db: Database) {}

  async ping(): Promise<void> {
    throw new Error("not implemented");
  }
}
