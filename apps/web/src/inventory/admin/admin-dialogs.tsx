import { useApi } from "@/api/api-provider";
import type { Vehicle } from "@/api/vehicle-contracts";
import type { VehicleAction } from "./vehicle-actions";
import { VehicleFormDialog } from "./vehicle-form-dialog";
import { emptyVehicleForm } from "./vehicle-form-schema";

export type AdminDialog = { action: "add" } | { action: VehicleAction; vehicle: Vehicle };

// The one admin dialog that is open, if any.
export function AdminDialogs({ dialog, onClose }: { dialog: AdminDialog; onClose: () => void }) {
  const { vehiclesApi } = useApi();

  if (dialog.action === "add") {
    return (
      <VehicleFormDialog
        title="Add vehicle"
        description="List a new vehicle in the inventory."
        confirmLabel="Add vehicle"
        pendingLabel="Adding…"
        defaultValues={emptyVehicleForm}
        onSubmit={async (input) => {
          await vehiclesApi.create(input);
          onClose();
        }}
        onClose={onClose}
      />
    );
  }
  return null;
}
