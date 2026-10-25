import type { Vehicle } from "@dealership/shared";
import type { Request, Response } from "express";
import type { VehicleService } from "../services/vehicle-service.js";

export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  list = async (_req: Request, res: Response<Vehicle[]>): Promise<void> => {
    res.status(200).json(await this.service.list());
  };
}
