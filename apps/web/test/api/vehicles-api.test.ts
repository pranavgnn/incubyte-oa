import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { VehicleInput, VehicleSearch } from "@/api/vehicle-contracts";
import { createVehiclesApi, type VehiclesApi } from "@/api/vehicles-api";
import { aVehicle } from "../fixtures";
import { baseUrl, createTestServices, errorBody } from "../helpers";
import { server } from "../msw/server";

function setup() {
  localStorage.setItem("dealership.token", "t0k3n");
  return createVehiclesApi(createTestServices().client);
}

describe("vehiclesApi reads", () => {
  it("lists every vehicle with the bearer token", async () => {
    const vehicles = [aVehicle(), aVehicle({ quantity: 0, imageUrl: "https://img.test/a.webp" })];
    let authorization: string | null = null;
    server.use(
      http.get(`${baseUrl}/api/vehicles`, ({ request }) => {
        authorization = request.headers.get("Authorization");
        return HttpResponse.json(vehicles);
      }),
    );

    await expect(setup().list()).resolves.toEqual(vehicles);
    expect(authorization).toBe("Bearer t0k3n");
  });

  it.each<[string, VehicleSearch, string]>([
    ["a text query", { q: "nex" }, "q=nex"],
    [
      "every filter",
      { q: "a", make: "Tata", model: "Nexon", category: "suv", minPrice: 1, maxPrice: 9 },
      "q=a&make=Tata&model=Nexon&category=suv&minPrice=1&maxPrice=9",
    ],
    ["only the non-empty keys", { q: "", make: "Tata", model: undefined }, "make=Tata"],
    ["a zero minimum price", { minPrice: 0 }, "minPrice=0"],
  ])("searches with %s", async (_label, filters, expected) => {
    let search = "";
    server.use(
      http.get(`${baseUrl}/api/vehicles/search`, ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json([aVehicle()]);
      }),
    );

    await setup().search(filters);

    expect(search).toBe(`?${expected}`);
  });
});

const input: VehicleInput = {
  make: "Tata",
  model: "Nexon",
  category: "suv",
  price: 1_250_000,
  quantity: 3,
};

describe("vehiclesApi writes", () => {
  it.each<[string, (api: VehiclesApi) => Promise<void>, string, string, unknown]>([
    ["purchase", (api) => api.purchase("v1"), "POST", "/api/vehicles/v1/purchase", undefined],
    ["create", (api) => api.create(input), "POST", "/api/vehicles", input],
    ["update", (api) => api.update("v1", input), "PUT", "/api/vehicles/v1", input],
    ["restock", (api) => api.restock("v1", 4), "POST", "/api/vehicles/v1/restock", { quantity: 4 }],
    ["remove", (api) => api.remove("v1"), "DELETE", "/api/vehicles/v1", undefined],
  ])("%s sends the right method, path and body", async (_name, call, method, path, body) => {
    let seen: { method: string; path: string; body: unknown; auth: string | null } | null = null;
    server.use(
      http.all(`${baseUrl}/api/vehicles*`, async ({ request }) => {
        const text = await request.text();
        seen = {
          method: request.method,
          path: new URL(request.url).pathname,
          body: text ? JSON.parse(text) : undefined,
          auth: request.headers.get("Authorization"),
        };
        return method === "DELETE"
          ? new HttpResponse(null, { status: 204 })
          : HttpResponse.json(aVehicle());
      }),
    );

    await call(setup());

    expect(seen).toEqual({ method, path, body, auth: "Bearer t0k3n" });
  });

  it("surfaces the API error code", async () => {
    server.use(
      http.post(`${baseUrl}/api/vehicles/v1/purchase`, () =>
        HttpResponse.json(errorBody("OUT_OF_STOCK", "Out of stock"), { status: 409 }),
      ),
    );

    await expect(setup().purchase("v1")).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
  });
});
