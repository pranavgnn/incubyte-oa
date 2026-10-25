import { useState } from "react";
import { CarSilhouette } from "@/components/car-silhouette";

// Vehicle photo on a muted stage. A missing or broken image falls back to
// the silhouette, never the browser's broken-image icon.
export function VehicleImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex aspect-video items-center justify-center bg-muted px-6">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <CarSilhouette className="w-3/4 text-muted-foreground/40" />
      )}
    </div>
  );
}
