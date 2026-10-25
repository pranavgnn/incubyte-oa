import type { Vehicle } from "@dealership/shared";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SOLD_OUT_REASON = "Out of stock — check back after restock";

export function PurchaseButton({
  vehicle,
  onPurchase,
}: {
  vehicle: Vehicle;
  onPurchase: (vehicle: Vehicle) => Promise<void>;
}) {
  const reasonId = useId();
  const [pending, setPending] = useState(false);

  if (vehicle.quantity === 0) {
    // A disabled button gets no pointer or focus events, so the span
    // carries the tooltip and the reason is also linked for screen readers.
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: lets keyboard users reach the tooltip of a disabled button (DESIGN.md 4.3). */}
          <span tabIndex={0}>
            <Button disabled aria-describedby={reasonId}>
              Sold out
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{SOLD_OUT_REASON}</TooltipContent>
        <span id={reasonId} className="sr-only">
          {SOLD_OUT_REASON}
        </span>
      </Tooltip>
    );
  }

  const purchase = async () => {
    setPending(true);
    try {
      await onPurchase(vehicle);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button disabled={pending} onClick={purchase}>
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Purchasing…
        </>
      ) : (
        "Purchase"
      )}
    </Button>
  );
}
