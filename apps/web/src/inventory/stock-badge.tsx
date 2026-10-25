import { Badge } from "@/components/ui/badge";

// Text always states the level, so stock is never shown by color alone.
export function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) return <Badge variant="out-of-stock">{dot}Out of stock</Badge>;
  if (quantity <= 3)
    return (
      <Badge variant="low-stock">
        {dot}Only {quantity} left
      </Badge>
    );
  return <Badge variant="in-stock">{dot}In stock</Badge>;
}

const dot = <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />;
