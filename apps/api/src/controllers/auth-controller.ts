import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@dealership/shared";
import type { Request, Response } from "express";
import type { AuthContext, AuthService } from "../services/auth-service.js";

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

  // Mounted behind authenticate, which always sets req.auth.
  me = async (req: Request, res: Response<User>): Promise<void> => {
    const { userId } = req.auth as AuthContext;
    res.status(200).json(await this.service.currentUser(userId));
  };
}
