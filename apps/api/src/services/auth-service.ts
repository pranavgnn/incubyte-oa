import type { AuthResponse, RegisterRequest, User } from "@dealership/shared";

export type NewUser = {
  email: string;
};

export interface UserRepository {
  create(user: NewUser): Promise<User>;
}

export interface TokenIssuer {
  issue(user: User): Promise<string>;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenIssuer,
  ) {}

  async register(input: RegisterRequest): Promise<AuthResponse> {
    const user = await this.users.create({ email: input.email });
    return { token: await this.tokens.issue(user), user };
  }
}
