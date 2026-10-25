import { type CreateVehicleRequest, VEHICLE_CATEGORIES } from "@dealership/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useId, useState } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type RefCallBack,
  useForm,
} from "react-hook-form";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { categoryLabels } from "@/inventory/category-labels";
import {
  keepImageFormSchema,
  type VehicleFormOutput,
  type VehicleFormValues,
  vehicleFormFields,
  vehicleFormSchema,
} from "./vehicle-form-schema";

type VehicleFormDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  defaultValues: VehicleFormValues;
  // Edit: nothing to save until a field differs from the vehicle, and
  // quantity is shown but never edited (stock changes through restock).
  editing?: boolean;
  // The vehicle already has an image, which may be replaced but not cleared.
  keepImage?: boolean;
  onSubmit: (input: CreateVehicleRequest) => Promise<void>;
  // Returns true when the error was dealt with outside the form (toast,
  // closing the dialog); anything else is shown in the form.
  onError: (error: unknown) => boolean;
  onClose: () => void;
};

// Add and edit share this form. It is mounted only while open, so every
// opening starts from its default values.
export function VehicleFormDialog({
  title,
  description,
  confirmLabel,
  pendingLabel,
  defaultValues,
  editing = false,
  keepImage = false,
  onSubmit,
  onError,
  onClose,
}: VehicleFormDialogProps) {
  const id = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<VehicleFormValues, unknown, VehicleFormOutput>({
    resolver: zodResolver(keepImage ? keepImageFormSchema : vehicleFormSchema),
    defaultValues,
  });
  const pending = form.formState.isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (onError(error)) return;
      setFormError(applyFormErrors(error, vehicleFormFields, form.setError));
    }
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // The dialog stays open while a request is in flight.
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="max-w-dialog sm:max-w-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-h3 font-semibold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
            <FormControl control={form.control} name="make" id={`${id}-make`} label="Make">
              {(props) => <Input {...props} autoComplete="off" />}
            </FormControl>
            <FormControl control={form.control} name="model" id={`${id}-model`} label="Model">
              {(props) => <Input {...props} autoComplete="off" />}
            </FormControl>
            <FormControl
              control={form.control}
              name="category"
              id={`${id}-category`}
              label="Category"
            >
              {({ value, onChange, ref, ...props }) => (
                <Select value={value} onValueChange={onChange} disabled={pending}>
                  <SelectTrigger ref={ref} {...props} className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {categoryLabels[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormControl>
            <FormControl control={form.control} name="price" id={`${id}-price`} label="Price">
              {(props) => (
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>₹</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput {...props} inputMode="numeric" className="font-mono" />
                </InputGroup>
              )}
            </FormControl>
            <FormControl
              control={form.control}
              name="quantity"
              id={`${id}-quantity`}
              label="Quantity"
              hint={editing ? "Stock changes only through purchase and restock" : undefined}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={0}
                  step={1}
                  readOnly={editing}
                  className="font-mono"
                />
              )}
            </FormControl>
            <FormControl
              control={form.control}
              name="imageUrl"
              id={`${id}-image-url`}
              label="Image URL"
            >
              {(props) => <Input {...props} type="url" placeholder="https://" autoComplete="off" />}
            </FormControl>
          </fieldset>
          <FormAlert message={formError} />
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || (editing && !form.formState.isDirty)}>
              {pending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {pendingLabel}
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ControlProps = {
  id: string;
  name: string;
  value: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  ref: RefCallBack;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

// One labelled field bound to the form; the error is linked to the
// control through aria-describedby and focus moves to it on submit.
function FormControl({
  control,
  name,
  id,
  label,
  hint,
  children,
}: {
  control: Control<VehicleFormValues, unknown, VehicleFormOutput>;
  name: FieldPath<VehicleFormValues>;
  id: string;
  label: string;
  hint?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const describedBy = [hint && hintId, fieldState.invalid && errorId].filter(Boolean);
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {children({
              id,
              name: field.name,
              value: String(field.value ?? ""),
              onChange: field.onChange,
              onBlur: field.onBlur,
              ref: field.ref,
              "aria-invalid": fieldState.invalid,
              "aria-describedby": describedBy.length > 0 ? describedBy.join(" ") : undefined,
            })}
            {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
            <FieldError id={errorId} errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
