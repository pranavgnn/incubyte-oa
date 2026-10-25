import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { Vehicle } from "@/api/vehicle-contracts";
import { DashboardPage } from "@/pages/dashboard-page";
import { aVehicle } from "./fixtures";
import { aliceUser, baseUrl, renderRoutes } from "./helpers";
import { server } from "./msw/server";

export type Role = "user" | "admin";

export const inventory = [
  aVehicle({ make: "Tata", model: "Nexon", quantity: 5 }),
  aVehicle({ make: "Mahindra", model: "Thar", quantity: 0 }),
  aVehicle({ make: "Tata", model: "Punch", quantity: 2 }),
];

// Serves the full list and, separately, search results, recording every
// search query string the page sends and how often the list is loaded.
export function serveInventory({
  all = inventory,
  results = inventory,
}: {
  all?: Vehicle[];
  results?: Vehicle[];
} = {}) {
  const searches: string[] = [];
  const lists = { count: 0 };
  server.use(
    http.get(`${baseUrl}/api/vehicles`, () => {
      lists.count += 1;
      return HttpResponse.json(all);
    }),
    http.get(`${baseUrl}/api/vehicles/search`, ({ request }) => {
      searches.push(new URL(request.url).search);
      return HttpResponse.json(results);
    }),
  );
  return { searches, lists };
}

export function renderDashboard(path = "/", role: Role = "user") {
  localStorage.setItem("dealership.token", "t0k3n");
  server.use(http.get(`${baseUrl}/api/auth/me`, () => HttpResponse.json({ ...aliceUser, role })));
  return renderRoutes([{ path: "/", element: <DashboardPage /> }], path);
}

export async function cardTitles() {
  const titles = await screen.findAllByRole("heading", { level: 3 });
  return titles.map((title) => title.textContent);
}
