import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@dealership/shared";
import { UnauthorizedError } from "../errors/app-error.js";

export type NewUser = {
  email: string;
  passwordHash: string;
};

// Only the repository and the login check ever see the hash.
export type UserWithPasswordHash = User & { passwordHash: string };

export interface UserRepository {
  create(user: NewUser): Promise<User>;
  findByEmail(email: string): Promise<UserWithPasswordHash | undefined>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
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

  async login(input: LoginRequest): Promise<AuthResponse> {
    const found = await this.users.findByEmail(input.email);
    if (!found) throw new UnauthorizedError("Invalid credentials");
    const { passwordHash, ...user } = found;
    if (!(await this.passwords.verify(input.password, passwordHash))) {
      throw new UnauthorizedError("Invalid credentials");
    }
    return { token: await this.tokens.issue(user), user };
  }
}
