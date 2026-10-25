import { errorResponseSchema } from "@dealership/shared";
import type { z } from "zod";
import { ApiError } from "./errors";

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
};

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  schema: z.ZodType<T>;
  body?: unknown;
  // Public endpoints (login, register): no token is sent and a 401 means
  // bad credentials, not an expired session.
  anonymous?: boolean;
};

export function createApiClient({
  baseUrl,
  getToken = () => null,
  onUnauthorized = () => {},
}: ApiClientOptions) {
  async function request<T>(
    path: string,
    { method = "GET", schema, body: payload, anonymous = false }: RequestOptions<T>,
  ): Promise<T> {
    const headers = new Headers();
    const token = anonymous ? null : getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const init: RequestInit = { method, headers };
    if (payload !== undefined) {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(payload);
    }
    const response = await send(new URL(path, baseUrl), init);
    const body = await readJson(response);
    if (!response.ok) {
      const parsed = errorResponseSchema.safeParse(body);
      if (!parsed.success) throw unexpectedResponse(response.status);
      const { error } = parsed.data;
      if (response.status === 401 && !anonymous) onUnauthorized();
      throw new ApiError(response.status, error.code, error.message, error.details);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw unexpectedResponse(response.status);
    return parsed.data;
  }

  return { request };
}

export type ApiClient = ReturnType<typeof createApiClient>;

async function send(url: URL, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Network error — check your connection");
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function unexpectedResponse(status: number): ApiError {
  return new ApiError(status, "INTERNAL_ERROR", "Unexpected response from the server");
}
