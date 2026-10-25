import { zodResolver } from "@hookform/resolvers/zod";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { Vehicle } from "@/api/vehicle-contracts";
import { applyFormErrors } from "@/auth/apply-form-errors";
import { FormAlert } from "@/components/form-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const UNITS_MESSAGE = "Enter a whole number of at least 1";

const restockSchema = z.object({
  quantity: z.coerce
    .number({ error: UNITS_MESSAGE })
    .int({ error: UNITS_MESSAGE })
    .min(1, { error: UNITS_MESSAGE }),
});

type RestockValues = z.input<typeof restockSchema>;
type RestockOutput = z.output<typeof restockSchema>;

type RestockDialogProps = {
  vehicle: Vehicle;
  onSubmit: (units: number) => Promise<void>;
  onError: (error: unknown) => boolean;
  onClose: () => void;
};

export function RestockDialog({ vehicle, onSubmit, onError, onClose }: RestockDialogProps) {
  const id = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RestockValues, unknown, RestockOutput>({
    resolver: zodResolver(restockSchema),
    defaultValues: { quantity: "1" },
  });
  const pending = form.formState.isSubmitting;
  const units = restockSchema.safeParse({ quantity: form.watch("quantity") });
  const current = units.success ? units.data.quantity : null;

  const step = (by: number) =>
    form.setValue("quantity", String((current ?? 1) + by), {
      shouldDirty: true,
      shouldValidate: true,
    });

  const submit = form.handleSubmit(async ({ quantity }) => {
    setFormError(null);
    try {
      await onSubmit(quantity);
    } catch (error) {
      if (onError(error)) return;
      setFormError(applyFormErrors(error, ["quantity"] as const, form.setError));
    }
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="max-w-dialog sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-h3 font-semibold">
            Restock {vehicle.make} {vehicle.model}
          </DialogTitle>
          <DialogDescription>Add units that have arrived on the floor.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <dl className="flex items-baseline justify-between">
            <dt className="text-label font-medium text-muted-foreground">Current units</dt>
            <dd className="font-mono text-h3 tabular-nums">{vehicle.quantity}</dd>
          </dl>
          <Controller
            control={form.control}
            name="quantity"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-units`}>Add units</FieldLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Decrease units"
                    disabled={pending || current === null || current <= 1}
                    onClick={() => step(-1)}
                  >
                    <MinusIcon />
                  </Button>
                  <Input
                    {...field}
                    value={String(field.value ?? "")}
                    id={`${id}-units`}
                    type="number"
                    min={1}
                    step={1}
                    disabled={pending}
                    className="text-center font-mono"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? `${id}-error` : `${id}-total`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Increase units"
                    disabled={pending}
                    onClick={() => step(1)}
                  >
                    <PlusIcon />
                  </Button>
                </div>
                {fieldState.invalid ? (
                  <FieldError id={`${id}-error`} errors={[fieldState.error]} />
                ) : (
                  <FieldDescription id={`${id}-total`} className="font-mono tabular-nums">
                    {current !== null && `New total: ${vehicle.quantity + current}`}
                  </FieldDescription>
                )}
              </Field>
            )}
          />
          <FormAlert message={formError} />
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Restocking…
                </>
              ) : (
                "Restock"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
