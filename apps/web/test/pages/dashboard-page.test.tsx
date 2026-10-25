import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { Vehicle } from "@/api/vehicle-contracts";
import { DashboardPage } from "@/pages/dashboard-page";
import { aVehicle } from "../fixtures";
import { aliceUser, baseUrl, renderRoutes } from "../helpers";
import { server } from "../msw/server";

type Role = "user" | "admin";

const inventory = [
  aVehicle({ make: "Tata", model: "Nexon", quantity: 5 }),
  aVehicle({ make: "Mahindra", model: "Thar", quantity: 0 }),
  aVehicle({ make: "Tata", model: "Punch", quantity: 2 }),
];

// Serves the full list and, separately, search results, recording every
// search query string the page sends.
function serveInventory({
  all = inventory,
  results = inventory,
}: {
  all?: Vehicle[];
  results?: Vehicle[];
} = {}) {
  const searches: string[] = [];
  server.use(
    http.get(`${baseUrl}/api/vehicles`, () => HttpResponse.json(all)),
    http.get(`${baseUrl}/api/vehicles/search`, ({ request }) => {
      searches.push(new URL(request.url).search);
      return HttpResponse.json(results);
    }),
  );
  return { searches };
}

function renderDashboard(path = "/", role: Role = "user") {
  localStorage.setItem("dealership.token", "t0k3n");
  server.use(http.get(`${baseUrl}/api/auth/me`, () => HttpResponse.json({ ...aliceUser, role })));
  return renderRoutes([{ path: "/", element: <DashboardPage /> }], path);
}

async function cardTitles() {
  const titles = await screen.findAllByRole("heading", { level: 3 });
  return titles.map((title) => title.textContent);
}

describe("DashboardPage data source", () => {
  it.each<[string, string, string | null]>([
    ["no filter", "/", null],
    ["an invalid filter only", "/?category=spaceship", null],
    ["a make", "/?make=Tata", "?make=Tata"],
    [
      "several filters",
      "/?q=pu&make=Tata&category=suv&minPrice=0&maxPrice=900000",
      "?q=pu&make=Tata&category=suv&minPrice=0&maxPrice=900000",
    ],
  ])("with %s shows the right vehicles", async (_label, path, expectedSearch) => {
    const punchOnly = [inventory[2] as Vehicle];
    const { searches } = serveInventory({ results: punchOnly });

    renderDashboard(path);

    if (expectedSearch === null) {
      expect(await cardTitles()).toEqual(["Nexon", "Thar", "Punch"]);
      expect(searches).toEqual([]);
    } else {
      expect(await cardTitles()).toEqual(["Punch"]);
      expect(searches).toEqual([expectedSearch]);
    }
  });

  it("counts the whole inventory in the header band", async () => {
    serveInventory({ results: [] });

    renderDashboard("/?make=Tata");

    expect(await screen.findByText("3 vehicles · 2 in stock")).toBeInTheDocument();
  });
});
