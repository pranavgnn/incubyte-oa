import { errorResponseSchema } from "@dealership/shared";
import type { z } from "zod";
import { ApiError } from "./errors";

export type ApiClientOptions = {
  baseUrl: string;
};

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  schema: z.ZodType<T>;
};

export function createApiClient({ baseUrl }: ApiClientOptions) {
  async function request<T>(
    path: string,
    { method = "GET", schema }: RequestOptions<T>,
  ): Promise<T> {
    const response = await send(new URL(path, baseUrl), { method });
    const body = await readJson(response);
    if (!response.ok) {
      const parsed = errorResponseSchema.safeParse(body);
      if (!parsed.success) throw unexpectedResponse(response.status);
      const { error } = parsed.data;
      throw new ApiError(response.status, error.code, error.message, error.details);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw unexpectedResponse(response.status);
    return parsed.data;
  }

  return { request };
}

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
