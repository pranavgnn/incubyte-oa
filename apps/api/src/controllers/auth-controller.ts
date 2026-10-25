import type { AuthResponse, LoginRequest, RegisterRequest } from "@dealership/shared";
import type { Request, Response } from "express";
import type { AuthService } from "../services/auth-service.js";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (
    req: Request<unknown, AuthResponse, RegisterRequest>,
    res: Response<AuthResponse>,
  ): Promise<void> => {
    res.status(201).json(await this.service.register(req.body));
  };

  login = async (
    req: Request<unknown, AuthResponse, LoginRequest>,
    res: Response<AuthResponse>,
  ): Promise<void> => {
    res.status(200).json(await this.service.login(req.body));
  };
}
