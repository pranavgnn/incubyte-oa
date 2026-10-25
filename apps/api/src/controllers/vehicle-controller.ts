import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  Vehicle,
  VehicleSearchQuery,
} from "@dealership/shared";
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

  update = async (
    req: Request<{ id: string }, Vehicle, UpdateVehicleRequest>,
    res: Response<Vehicle>,
  ): Promise<void> => {
    res.status(200).json(await this.service.update(req.params.id, req.body));
  };

  delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    await this.service.delete(req.params.id);
    res.status(204).end();
  };
}
