import type { AuthResponse, LoginRequest, RegisterRequest, Role, User } from "@dealership/shared";
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
  findById(id: string): Promise<User | undefined>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  // `hash` is undefined when no user matched. Implementations must still
  // spend the same time as a real comparison, then return false.
  verify(password: string, hash: string | undefined): Promise<boolean>;
}

export interface TokenIssuer {
  issue(user: User): Promise<string>;
}

// Who the caller is, as proven by a verified token.
export type AuthContext = {
  userId: string;
  role: Role;
};

export interface TokenVerifier {
  verify(token: string): Promise<AuthContext>;
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
    // Verify before branching on `found`, so an unknown email costs the
    // same as a wrong password.
    const valid = await this.passwords.verify(input.password, found?.passwordHash);
    if (!found || !valid) throw new UnauthorizedError("Invalid credentials");
    const { passwordHash: _hash, ...user } = found;
    return { token: await this.tokens.issue(user), user };
  }

  async currentUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new Error("not implemented");
    return user;
  }
}
