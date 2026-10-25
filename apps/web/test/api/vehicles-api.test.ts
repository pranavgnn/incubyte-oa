import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { VehicleSearch } from "@/api/vehicle-contracts";
import { createVehiclesApi } from "@/api/vehicles-api";
import { aVehicle } from "../fixtures";
import { baseUrl, createTestServices } from "../helpers";
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
