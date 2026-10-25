import type { Vehicle } from "@dealership/shared";
import { toast } from "sonner";
import { useApi } from "@/api/api-provider";
import { ApiError } from "@/api/errors";
import { actionErrorMessage, ERROR_TOAST_MS, isNetworkError } from "./action-errors";
import type { useInventory } from "./use-inventory";

type Inventory = Pick<ReturnType<typeof useInventory>, "setQuantity" | "refetch">;

// Buys one unit: the card drops a unit at once and rolls back if the
// API refuses. One toast id follows the purchase from pending to result.
export function usePurchase({ setQuantity, refetch }: Inventory) {
  const { vehiclesApi } = useApi();

  const purchase = async (vehicle: Vehicle): Promise<void> => {
    const name = `${vehicle.make} ${vehicle.model}`;
    const id = toast.loading(`Purchasing ${name}…`);
    setQuantity(vehicle.id, (quantity) => quantity - 1);
    try {
      await vehiclesApi.purchase(vehicle.id);
      toast.success(`Purchased ${name}`, { id });
    } catch (error) {
      const code = error instanceof ApiError ? error.code : null;
      // Someone else bought the last unit: the stock is known to be 0.
      setQuantity(vehicle.id, (quantity) => (code === "OUT_OF_STOCK" ? 0 : quantity + 1));
      if (code === "OUT_OF_STOCK" || code === "NOT_FOUND") refetch();
      const message = actionErrorMessage(error);
      if (!message) {
        toast.dismiss(id);
        return;
      }
      toast.error(message, {
        id,
        duration: ERROR_TOAST_MS,
        action: isNetworkError(error)
          ? { label: "Retry", onClick: () => void purchase(vehicle) }
          : undefined,
      });
    }
  };

  return purchase;
}
