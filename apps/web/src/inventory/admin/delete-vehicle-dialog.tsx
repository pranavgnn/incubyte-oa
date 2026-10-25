import type { Vehicle } from "@dealership/shared";
import { type MouseEvent, useState } from "react";
import { ApiError } from "@/api/errors";
import { FormAlert } from "@/components/form-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

type DeleteVehicleDialogProps = {
  vehicle: Vehicle;
  onConfirm: () => Promise<void>;
  onError: (error: unknown) => boolean;
  onClose: () => void;
};

export function DeleteVehicleDialog({
  vehicle,
  onConfirm,
  onError,
  onClose,
}: DeleteVehicleDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async (event: MouseEvent) => {
    // Radix closes on Action by default; it stays open until the API answers.
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onConfirm();
    } catch (failure) {
      if (!onError(failure)) {
        setError(
          failure instanceof ApiError ? failure.message : "Something went wrong — please try again",
        );
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <AlertDialogContent className="max-w-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-h3 font-semibold">
            Delete vehicle
          </AlertDialogTitle>
          <AlertDialogDescription>
            Delete {vehicle.make} {vehicle.model}? This removes it from inventory and can't be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FormAlert message={error} />
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={confirm}>
            {pending ? (
              <>
                <Spinner data-icon="inline-start" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
