import type { AuthResponse, RegisterRequest, User } from "@dealership/shared";

export type NewUser = {
  email: string;
};

export interface UserRepository {
  create(user: NewUser): Promise<User>;
}

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: RegisterRequest): Promise<AuthResponse> {
    const user = await this.users.create({ email: input.email });
    return { token: "", user };
  }
}
