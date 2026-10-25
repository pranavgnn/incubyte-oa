import { Alert, AlertDescription } from "@/components/ui/alert";

// Form-level error for anything that cannot be shown next to a field.
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
