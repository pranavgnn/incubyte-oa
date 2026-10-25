import { CarIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ApiError } from "@/api/errors";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export function NoInventory({ action }: { action?: ReactNode }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CarIcon />
        </EmptyMedia>
        <EmptyTitle>
          <h2 className="font-display text-h3 font-semibold">No vehicles yet</h2>
        </EmptyTitle>
        <EmptyDescription>Vehicles appear here as soon as they are added.</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

export function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>
          <h2 className="font-display text-h3 font-semibold">No matches</h2>
        </EmptyTitle>
        <EmptyDescription>Try a different make or widen the price range.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onClear}>
          Clear filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function InventoryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message =
    error instanceof ApiError ? error.message : "Something went wrong — please try again";
  return (
    <Alert variant="destructive">
      <AlertTitle>Couldn't load inventory</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertAction>
    </Alert>
  );
}

// Mirrors the vehicle card's layout so the grid does not jump on load.
export function InventorySkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {skeletonKeys.map((key) => (
        <li key={key} className="flex flex-col overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-col gap-2 p-5 pb-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="aspect-video rounded-none" />
          <div className="flex gap-5 p-5">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
          <div className="flex items-center justify-between gap-3 border-t p-5">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

const skeletonKeys = ["a", "b", "c", "d", "e", "f", "g", "h"];
