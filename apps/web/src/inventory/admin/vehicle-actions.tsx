import { MoreHorizontalIcon, PackagePlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Vehicle } from "@/api/vehicle-contracts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type VehicleAction = "edit" | "restock" | "delete";

// Admin-only card menu. Callers must not render it for customers.
export function VehicleActions({
  vehicle,
  onAction,
}: {
  vehicle: Vehicle;
  onAction: (action: VehicleAction, vehicle: Vehicle) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${vehicle.make} ${vehicle.model}`}
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onAction("edit", vehicle)}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("restock", vehicle)}>
          <PackagePlusIcon />
          Restock
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onAction("delete", vehicle)}>
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
