import { toast } from "sonner";
import { useApi } from "@/api/api-provider";
import { ApiError } from "@/api/errors";
import type { Vehicle } from "@/api/vehicle-contracts";
import { actionErrorMessage, ERROR_TOAST_MS } from "../action-errors";
import type { VehicleAction } from "./vehicle-actions";
import { VehicleFormDialog } from "./vehicle-form-dialog";
import { emptyVehicleForm, toVehicleForm } from "./vehicle-form-schema";

export type AdminDialog = { action: "add" } | { action: VehicleAction; vehicle: Vehicle };

type AdminDialogsProps = {
  dialog: AdminDialog;
  onClose: () => void;
  // Reloads the inventory after a change.
  onChanged: () => void;
};

// The one admin dialog that is open, if any.
export function AdminDialogs({ dialog, onClose, onChanged }: AdminDialogsProps) {
  const { vehiclesApi } = useApi();

  const succeed = (message: string) => {
    toast.success(message);
    onClose();
    onChanged();
  };

  // Errors that are not about the form, per DESIGN.md section 0. The rest
  // (VALIDATION_ERROR, CONFLICT, anything unexpected) stay in the dialog.
  const handleError = (error: unknown): boolean => {
    if (!(error instanceof ApiError)) return false;
    if (error.code === "UNAUTHORIZED") return true;
    if (error.code === "FORBIDDEN" || error.code === "NOT_FOUND") {
      toast.error(actionErrorMessage(error), { duration: ERROR_TOAST_MS });
      if (error.code === "NOT_FOUND") {
        onClose();
        onChanged();
      }
      return true;
    }
    return false;
  };

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
          succeed(`${input.make} ${input.model} added`);
        }}
        onError={handleError}
        onClose={onClose}
      />
    );
  }
  const { vehicle } = dialog;
  if (dialog.action === "edit") {
    return (
      <VehicleFormDialog
        title="Edit vehicle"
        description={`Update the details of ${vehicle.make} ${vehicle.model}.`}
        confirmLabel="Save changes"
        pendingLabel="Saving…"
        defaultValues={toVehicleForm(vehicle)}
        requireDirty
        onSubmit={async (input) => {
          await vehiclesApi.update(vehicle.id, input);
          succeed("Changes saved");
        }}
        onError={handleError}
        onClose={onClose}
      />
    );
  }
  return null;
}
