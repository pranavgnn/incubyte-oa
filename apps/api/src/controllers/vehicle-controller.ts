import type { CreateVehicleRequest, Vehicle, VehicleSearchQuery } from "@dealership/shared";
import type { Request, Response } from "express";
import type { VehicleService } from "../services/vehicle-service.js";

export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  list = async (_req: Request, res: Response<Vehicle[]>): Promise<void> => {
    res.status(200).json(await this.service.list());
  };

  // Mounted behind validate, which replaces req.query with the parsed filters.
  search = async (req: Request, res: Response<Vehicle[]>): Promise<void> => {
    res.status(200).json(await this.service.search(req.query as VehicleSearchQuery));
  };

  create = async (
    req: Request<unknown, Vehicle, CreateVehicleRequest>,
    res: Response<Vehicle>,
  ): Promise<void> => {
    res.status(201).json(await this.service.create(req.body));
  };
}
