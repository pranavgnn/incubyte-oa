import type { z } from "zod";

export type ApiClientOptions = {
  baseUrl: string;
};

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  schema: z.ZodType<T>;
};

export function createApiClient(_options: ApiClientOptions) {
  async function request<T>(_path: string, _init: RequestOptions<T>): Promise<T> {
    throw new Error("not implemented");
  }

  return { request };
}
