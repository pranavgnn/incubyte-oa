import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Full-width submit that shows a spinner and an -ing label while pending.
export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
