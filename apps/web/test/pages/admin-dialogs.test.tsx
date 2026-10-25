import { screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { cardTitles, renderDashboard, serveInventory } from "../dashboard-helpers";
import { aVehicle } from "../fixtures";
import { baseUrl, errorBody, setupUser } from "../helpers";
import { server } from "../msw/server";

async function openAddDialog() {
  const { lists } = serveInventory();
  renderDashboard("/", "admin");
  await cardTitles();
  const user = setupUser();
  await user.click(screen.getByRole("button", { name: "Add vehicle" }));
  const dialog = within(await screen.findByRole("dialog", { name: "Add vehicle" }));
  return { user, dialog, lists };
}

type User = ReturnType<typeof setupUser>;
type Scope = ReturnType<typeof within>;

async function fillVehicleForm(user: User, dialog: Scope, imageUrl = "") {
  await user.type(dialog.getByLabelText("Make"), "Maruti");
  await user.type(dialog.getByLabelText("Model"), "Swift");
  await user.click(dialog.getByRole("combobox", { name: "Category" }));
  await user.click(screen.getByRole("option", { name: "Hatchback" }));
  await user.type(dialog.getByLabelText("Price"), "650000");
  await user.clear(dialog.getByLabelText("Quantity"));
  await user.type(dialog.getByLabelText("Quantity"), "4");
  if (imageUrl) await user.type(dialog.getByLabelText("Image URL"), imageUrl);
}

const swift = {
  make: "Maruti",
  model: "Swift",
  category: "hatchback",
  price: 650000,
  quantity: 4,
};

describe("Add vehicle validation", () => {
  it("requires make, model, category and price and sends nothing", async () => {
    // MSW fails the test on any request without a handler, so a submit
    // that slipped through would be caught.
    const { user, dialog } = await openAddDialog();

    await user.click(dialog.getByRole("button", { name: "Add vehicle" }));

    expect(dialog.getByLabelText("Make")).toHaveAccessibleDescription("Enter a make");
    expect(dialog.getByLabelText("Model")).toHaveAccessibleDescription("Enter a model");
    expect(dialog.getByRole("combobox", { name: "Category" })).toHaveAccessibleDescription(
      "Choose a category",
    );
    expect(dialog.getByLabelText("Price")).toHaveAccessibleDescription(
      "Enter a price in whole rupees",
    );
    expect(dialog.getByLabelText("Quantity")).toHaveValue(0);
    expect(dialog.getByLabelText("Make")).toHaveFocus();
  });

  it.each<[string, string, string]>([
    ["Price", "0", "Enter a price in whole rupees"],
    ["Price", "12.5", "Enter a price in whole rupees"],
    ["Price", "abc", "Enter a price in whole rupees"],
    ["Quantity", "-1", "Enter a whole number, 0 or more"],
    ["Quantity", "1.5", "Enter a whole number, 0 or more"],
    ["Image URL", "http://img.test/car.webp", "Use an https:// image URL"],
    ["Image URL", "not a url", "Use an https:// image URL"],
  ])("rejects %s %j", async (label, value, message) => {
    const { user, dialog } = await openAddDialog();

    await user.clear(dialog.getByLabelText(label));
    await user.type(dialog.getByLabelText(label), value);
    await user.click(dialog.getByRole("button", { name: "Add vehicle" }));

    expect(dialog.getByLabelText(label)).toHaveAccessibleDescription(message);
  });
});

describe("Add vehicle submit", () => {
  it.each<[string, string, Record<string, unknown>]>([
    ["without an image", "", swift],
    [
      "with an image",
      "https://img.test/swift.webp",
      { ...swift, imageUrl: "https://img.test/swift.webp" },
    ],
  ])(
    "sends exactly the editable fields %s, then toasts, closes and refetches",
    async (_label, imageUrl, payload) => {
      const { user, dialog, lists } = await openAddDialog();
      let received: unknown;
      server.use(
        http.post(`${baseUrl}/api/vehicles`, async ({ request }) => {
          received = await request.json();
          return HttpResponse.json(aVehicle(payload), { status: 201 });
        }),
      );

      await fillVehicleForm(user, dialog, imageUrl);
      await user.click(dialog.getByRole("button", { name: "Add vehicle" }));

      expect(await screen.findByText("Maruti Swift added")).toBeInTheDocument();
      expect(received).toEqual(payload);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await vi.waitFor(() => expect(lists.count).toBe(2));
    },
  );

  it.each<[string, () => Response, (dialog: Scope) => void]>([
    [
      "VALIDATION_ERROR onto its field",
      () =>
        HttpResponse.json(
          errorBody("VALIDATION_ERROR", "Invalid request", [
            { path: ["price"], message: "Price is too high" },
          ]),
          { status: 400 },
        ),
      (dialog) =>
        expect(dialog.getByLabelText("Price")).toHaveAccessibleDescription("Price is too high"),
    ],
    [
      "CONFLICT as an alert in the dialog",
      () =>
        HttpResponse.json(errorBody("CONFLICT", "This vehicle is already listed"), {
          status: 409,
        }),
      (dialog) =>
        expect(dialog.getByRole("alert")).toHaveTextContent("This vehicle is already listed"),
    ],
    [
      "FORBIDDEN as a toast",
      () => HttpResponse.json(errorBody("FORBIDDEN", "Forbidden"), { status: 403 }),
      () => expect(screen.getByText("You don't have permission to do that")).toBeInTheDocument(),
    ],
  ])("keeps the dialog open and shows %s", async (_label, reply, check) => {
    const { user, dialog } = await openAddDialog();
    server.use(http.post(`${baseUrl}/api/vehicles`, reply));

    await fillVehicleForm(user, dialog);
    await user.click(dialog.getByRole("button", { name: "Add vehicle" }));

    await vi.waitFor(() => check(dialog));
    expect(screen.getByRole("dialog", { name: "Add vehicle" })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Add vehicle" })).toBeEnabled();
  });
});
