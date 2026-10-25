import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cardTitles, renderDashboard, serveInventory } from "../dashboard-helpers";
import { setupUser } from "../helpers";

async function openAddDialog() {
  serveInventory();
  renderDashboard("/", "admin");
  await cardTitles();
  const user = setupUser();
  await user.click(screen.getByRole("button", { name: "Add vehicle" }));
  const dialog = within(await screen.findByRole("dialog", { name: "Add vehicle" }));
  return { user, dialog };
}

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
