import { ServiceUnavailableError } from "../errors/app-error.js";

export interface HealthRepository {
  ping(): Promise<void>;
}

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  async check(): Promise<void> {
    try {
      await this.repository.ping();
    } catch (cause) {
      // The driver error stays on `cause` for logs; clients only see this message.
      throw new ServiceUnavailableError("Database is unreachable", [], { cause });
    }
  }
}
