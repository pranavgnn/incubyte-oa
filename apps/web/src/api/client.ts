import type { z } from "zod";

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
    return schema.parse(await response.json());
  }

  return { request };
}
