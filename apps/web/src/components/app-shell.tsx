import { Outlet } from "react-router";
import { useAuth } from "@/auth/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Wordmark } from "@/components/wordmark";

// Sticky top bar plus the routed page. Rendered inside RequireAuth.
export function AppShell() {
  const { state } = useAuth();

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 h-16 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-page items-center justify-between px-4 sm:px-6 lg:px-8">
          <Wordmark />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {state.status === "signed-in" && <UserMenu user={state.user} />}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
