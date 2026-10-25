import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "@/api/vehicle-contracts";
import { DashboardPage } from "@/pages/dashboard-page";
import { aVehicle } from "../fixtures";
import { aliceUser, baseUrl, errorBody, renderRoutes } from "../helpers";
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

describe("DashboardPage states", () => {
  it.each<[string, string, Vehicle[], Vehicle[], string]>([
    ["an empty inventory", "/", [], [], "No vehicles yet"],
    ["a search without matches", "/?make=Tata", inventory, [], "No matches"],
  ])("shows an empty state for %s", async (_label, path, all, results, title) => {
    serveInventory({ all, results });

    renderDashboard(path);

    expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("clears every filter from the no-matches state", async () => {
    serveInventory({ results: [] });
    const { router } = renderDashboard("/?make=Tata&q=zz");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Clear filters" }));

    expect(router.state.location.search).toBe("");
    expect(await cardTitles()).toEqual(["Nexon", "Thar", "Punch"]);
  });

  it("shows the error with a retry that reloads the inventory", async () => {
    let calls = 0;
    server.use(
      http.get(`${baseUrl}/api/vehicles`, () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(errorBody("INTERNAL_ERROR", "Database is down"), { status: 500 })
          : HttpResponse.json(inventory);
      }),
    );
    renderDashboard();
    const user = userEvent.setup();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load inventory");
    expect(alert).toHaveTextContent("Database is down");
    await user.click(within(alert).getByRole("button", { name: "Retry" }));

    expect(await cardTitles()).toEqual(["Nexon", "Thar", "Punch"]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("DashboardPage filter bar", () => {
  async function renderLoaded(path = "/") {
    const served = serveInventory();
    const view = renderDashboard(path);
    await cardTitles();
    return { ...served, ...view, user: userEvent.setup() };
  }

  it("debounces typing into one search with q", async () => {
    const { user, router, searches } = await renderLoaded();

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "nex");

    await vi.waitFor(() => expect(router.state.location.search).toBe("?q=nex"));
    await vi.waitFor(() => expect(searches).toEqual(["?q=nex"]));
  });

  it("offers sorted makes, enables model for a make, and resets model when make changes", async () => {
    const { user, router } = await renderLoaded();
    const model = screen.getByRole("combobox", { name: "Model" });
    expect(model).toBeDisabled();

    await user.click(screen.getByRole("combobox", { name: "Make" }));
    const makes = screen.getAllByRole("option").map((option) => option.textContent);
    expect(makes).toEqual(["All makes", "Mahindra", "Tata"]);
    await user.click(screen.getByRole("option", { name: "Tata" }));
    expect(router.state.location.search).toBe("?make=Tata");

    await user.click(screen.getByRole("combobox", { name: "Model" }));
    const models = screen.getAllByRole("option").map((option) => option.textContent);
    expect(models).toEqual(["All models", "Nexon", "Punch"]);
    await user.click(screen.getByRole("option", { name: "Punch" }));
    expect(router.state.location.search).toBe("?make=Tata&model=Punch");

    await user.click(screen.getByRole("combobox", { name: "Make" }));
    await user.click(screen.getByRole("option", { name: "Mahindra" }));
    expect(router.state.location.search).toBe("?make=Mahindra");
  });

  it("filters by category value while showing its label", async () => {
    const { user, router } = await renderLoaded();

    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(screen.getByRole("option", { name: "SUV" }));

    expect(router.state.location.search).toBe("?category=suv");
  });

  it("sets the price range from the popover and rejects a minimum above the maximum", async () => {
    const { user, router } = await renderLoaded();

    await user.click(screen.getByRole("button", { name: "Price" }));
    await user.type(screen.getByLabelText("Min price"), "900000");
    await user.type(screen.getByLabelText("Max price"), "100000");

    expect(await screen.findByText("Min must not be above max")).toBeInTheDocument();
    expect(router.state.location.search).toBe("");

    await user.clear(screen.getByLabelText("Max price"));
    await user.type(screen.getByLabelText("Max price"), "1500000");

    await vi.waitFor(() =>
      expect(router.state.location.search).toBe("?minPrice=900000&maxPrice=1500000"),
    );
  });

  it("shows active filters as chips that remove themselves", async () => {
    const { user, router } = await renderLoaded("/?make=Tata&model=Nexon&q=ne");

    await user.click(screen.getByRole("button", { name: "Remove filter: Tata" }));

    expect(router.state.location.search).toBe("?q=ne");
    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("ne");
    await user.click(screen.getByRole("button", { name: "Remove filter: “ne”" }));
    expect(router.state.location.search).toBe("");
    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("");
  });

  it("offers Reset only while a filter is active", async () => {
    const { user, router } = await renderLoaded("/?category=suv&q=ne");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(router.state.location.search).toBe("");
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });
});
