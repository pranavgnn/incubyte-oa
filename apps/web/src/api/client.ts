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
    const response = await fetch(new URL(path, baseUrl), { method });
    const body: unknown = await response.json();
    if (!response.ok) {
      const { error } = errorResponseSchema.parse(body);
      throw new ApiError(response.status, error.code, error.message, error.details);
    }
    return schema.parse(body);
  }

  return { request };
}
