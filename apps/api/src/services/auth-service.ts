import type { AuthResponse, RegisterRequest, User } from "@dealership/shared";

export type NewUser = {
  email: string;
  passwordHash: string;
};

export interface UserRepository {
  create(user: NewUser): Promise<User>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

export interface TokenIssuer {
  issue(user: User): Promise<string>;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenIssuer,
  ) {}

  async register(input: RegisterRequest): Promise<AuthResponse> {
    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.create({ email: input.email, passwordHash });
    return { token: await this.tokens.issue(user), user };
  }
}
