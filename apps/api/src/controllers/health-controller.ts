import type { Request, Response } from "express";
import type { HealthService } from "../services/health-service.js";

export class HealthController {
  constructor(private readonly service: HealthService) {}

  check = async (_req: Request, _res: Response): Promise<void> => {
    throw new Error("not implemented");
  };
}
