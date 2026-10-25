import type { ComponentProps } from "react";

// Neutral side-profile car, used wherever a vehicle photo is missing.
export function CarSilhouette(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 240 96" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 66c0-6 3-10 9-12l34-8 26-20c5-4 11-6 18-6h46c8 0 15 3 21 9l17 17 22 4c8 2 13 8 13 16v6c0 3-2 5-5 5h-12a22 22 0 0 0-43 0H83a22 22 0 0 0-43 0H27c-3 0-5-2-5-5z" />
      <circle cx="61.5" cy="77" r="15" />
      <circle cx="183.5" cy="77" r="15" />
    </svg>
  );
}
