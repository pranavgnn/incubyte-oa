import type { HealthResponse } from "@dealership/shared";
import type { Request, Response } from "express";
import type { HealthService } from "../services/health-service.js";

export class HealthController {
  constructor(private readonly service: HealthService) {}

  check = async (_req: Request, res: Response<HealthResponse>): Promise<void> => {
    await this.service.check();
    res.status(200).json({ status: "ok" });
  };
}
