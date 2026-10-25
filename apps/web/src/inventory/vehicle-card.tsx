import type { Vehicle } from "@dealership/shared";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { categoryLabels } from "@/inventory/category-labels";
import { formatPrice } from "@/lib/format";
import { StockBadge } from "./stock-badge";
import { VehicleImage } from "./vehicle-image";

type VehicleCardProps = {
  vehicle: Vehicle;
  // Admin menu, rendered top-right next to the title; absent for customers.
  actions?: ReactNode;
  // Purchase button, rendered next to the price.
  purchase?: ReactNode;
};

export function VehicleCard({ vehicle, actions, purchase }: VehicleCardProps) {
  const { make, model, category, quantity, price, imageUrl } = vehicle;
  return (
    <Card className="group relative gap-0 p-0 motion-safe:transition-shadow motion-safe:duration-base motion-safe:ease-showroom motion-safe:hover:shadow-card-hover">
      <div className="flex flex-col gap-1 p-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-overline font-semibold text-muted-foreground uppercase">
            {make}
          </p>
          <StockBadge quantity={quantity} />
        </div>
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h3 className="truncate font-display text-h3 font-semibold">{model}</h3>
          {actions}
        </div>
      </div>
      <VehicleImage src={imageUrl} alt={`${make} ${model}`} />
      <Separator />
      <dl className="flex p-5">
        <div className="flex flex-1 flex-col-reverse gap-1">
          <dt className="text-overline font-semibold text-muted-foreground uppercase">Category</dt>
          <dd className="font-display text-h3">{categoryLabels[category]}</dd>
        </div>
        <Separator orientation="vertical" className="mx-5" />
        <div className="flex flex-1 flex-col-reverse gap-1">
          <dt className="text-overline font-semibold text-muted-foreground uppercase">Units</dt>
          <dd className="font-mono text-h3 tabular-nums">{quantity}</dd>
        </div>
      </dl>
      <Separator />
      <div className="flex items-center justify-between gap-3 p-5">
        <p className="font-mono text-price tabular-nums">{formatPrice(price)}</p>
        {purchase}
      </div>
    </Card>
  );
}
