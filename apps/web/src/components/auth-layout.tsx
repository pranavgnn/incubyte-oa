import { useState } from "react";
import { Outlet } from "react-router";
import { CarSilhouette } from "@/components/car-silhouette";
import { Wordmark } from "@/components/wordmark";

// The photo is optional: drop src/assets/hero.webp in and it is used;
// until then (or if it fails to load) the silhouette stands in.
const heroImages = import.meta.glob<string>("../assets/hero.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const heroUrl = Object.values(heroImages)[0];

// Split layout for /login and /register: a dark showroom pane on lg+,
// the form card centred beside it.
export function AuthLayout() {
  const [heroFailed, setHeroFailed] = useState(false);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-hero p-10 text-hero-foreground lg:flex">
        <Wordmark />
        {heroUrl && !heroFailed ? (
          <img
            src={heroUrl}
            alt=""
            className="absolute inset-0 size-full object-cover object-bottom"
            onError={() => setHeroFailed(true)}
          />
        ) : (
          <CarSilhouette className="w-full text-hero-foreground/20" />
        )}
        <p className="relative font-display text-display font-bold">Every car. One floor.</p>
      </aside>
      <main className="flex flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <Wordmark />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
