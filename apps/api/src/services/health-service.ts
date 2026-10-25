export interface HealthRepository {
  ping(): Promise<void>;
}

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  async check(): Promise<void> {
    throw new Error("not implemented");
  }
}
