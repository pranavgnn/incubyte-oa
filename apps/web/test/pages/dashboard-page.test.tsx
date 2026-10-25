import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "@/api/vehicle-contracts";
import {
  cardTitles,
  inventory,
  type Role,
  renderDashboard,
  serveInventory,
} from "../dashboard-helpers";
import { baseUrl, errorBody } from "../helpers";
import { server } from "../msw/server";

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
    expect(screen.queryAllByRole("heading", { level: 3 })).toEqual([]);
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

describe("DashboardPage purchase", () => {
  function nexonCard() {
    return within(screen.getByRole("listitem", { name: "Tata Nexon" }));
  }

  it("buys one unit, lowers the units and confirms with a toast", async () => {
    serveInventory();
    let purchased: string | null = null;
    server.use(
      http.post(`${baseUrl}/api/vehicles/:id/purchase`, ({ params }) => {
        purchased = String(params.id);
        return HttpResponse.json({ ...inventory[0], quantity: 4 });
      }),
    );
    renderDashboard();
    await cardTitles();
    const user = userEvent.setup();

    await user.click(nexonCard().getByRole("button", { name: "Purchase" }));

    expect(await screen.findByText("Purchased Tata Nexon")).toBeInTheDocument();
    expect(purchased).toBe(inventory[0]?.id);
    expect(nexonCard().getByText("4")).toBeInTheDocument();
  });

  it("disables purchase at zero units and says why", async () => {
    serveInventory();
    renderDashboard();
    await cardTitles();

    const soldOut = within(screen.getByRole("listitem", { name: "Mahindra Thar" })).getByRole(
      "button",
      { name: "Sold out" },
    );

    expect(soldOut).toBeDisabled();
    expect(soldOut).toHaveAccessibleDescription("Out of stock — check back after restock");
  });

  it.each<[string, () => Response, string, string, boolean]>([
    [
      "OUT_OF_STOCK",
      () => HttpResponse.json(errorBody("OUT_OF_STOCK", "Out of stock"), { status: 409 }),
      "Sold out — no units left",
      "Sold out",
      true,
    ],
    [
      "NOT_FOUND",
      () => HttpResponse.json(errorBody("NOT_FOUND", "Vehicle not found"), { status: 404 }),
      "This vehicle no longer exists",
      "Purchase",
      true,
    ],
    [
      "FORBIDDEN",
      () => HttpResponse.json(errorBody("FORBIDDEN", "Forbidden"), { status: 403 }),
      "You don't have permission to do that",
      "Purchase",
      false,
    ],
    [
      "INTERNAL_ERROR",
      () => HttpResponse.json(errorBody("INTERNAL_ERROR", "Something broke"), { status: 500 }),
      "Something broke",
      "Purchase",
      false,
    ],
    [
      "a network failure",
      () => HttpResponse.error(),
      "Network error — check your connection",
      "Purchase",
      false,
    ],
  ])("handles %s", async (code, reply, message, buttonAfter, refetches) => {
    let listCalls = 0;
    server.use(
      http.get(`${baseUrl}/api/vehicles`, () => {
        listCalls += 1;
        // After a refetch the server reports the stock it really has.
        const soldOut = code === "OUT_OF_STOCK" && listCalls > 1;
        return HttpResponse.json(
          soldOut ? inventory.map((v, i) => (i === 0 ? { ...v, quantity: 0 } : v)) : inventory,
        );
      }),
      http.post(`${baseUrl}/api/vehicles/:id/purchase`, reply),
    );
    renderDashboard();
    await cardTitles();
    const user = userEvent.setup();

    await user.click(nexonCard().getByRole("button", { name: "Purchase" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(nexonCard().getByRole("button", { name: buttonAfter })).toBeInTheDocument(),
    );
    const unitsAfter = code === "OUT_OF_STOCK" ? "0" : "5";
    expect(nexonCard().getByText(unitsAfter)).toBeInTheDocument();
    await vi.waitFor(() => expect(listCalls).toBe(refetches ? 2 : 1));
  });
});

describe("DashboardPage admin controls", () => {
  it.each<[Role, number]>([
    ["admin", 1],
    ["user", 0],
  ])("renders Add vehicle and card menus only for admins (%s)", async (role, expected) => {
    serveInventory();

    renderDashboard("/", role);
    await cardTitles();

    expect(screen.queryAllByRole("button", { name: "Add vehicle" })).toHaveLength(expected);
    expect(screen.queryAllByRole("button", { name: /^Actions for / })).toHaveLength(
      expected * inventory.length,
    );
  });

  it.each<[Role, number]>([
    ["admin", 2],
    ["user", 0],
  ])("offers Add vehicle from the empty inventory only to admins (%s)", async (role, expected) => {
    serveInventory({ all: [] });

    renderDashboard("/", role);
    await screen.findByRole("heading", { name: "No vehicles yet" });

    expect(screen.queryAllByRole("button", { name: "Add vehicle" })).toHaveLength(expected);
  });

  it("lists Edit, Restock and Delete in a card's admin menu", async () => {
    serveInventory();
    renderDashboard("/", "admin");
    await cardTitles();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Actions for Tata Nexon" }));

    const items = (await screen.findAllByRole("menuitem")).map((item) => item.textContent);
    expect(items).toEqual(["Edit", "Restock", "Delete"]);
  });
});
