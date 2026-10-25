# DESIGN.md — Dealership Inventory (Frontend)

Stack: React + React Router · Tailwind CSS v4 (CSS-first, no `tailwind.config.*`) · shadcn/ui · `@shadcn/lint`.
This file is the source of truth. If something isn't specified here, use the closest existing token or component. Never invent new values inline.

---

## 0. API contract (what the UI may rely on)

Don't render, send, or invent fields beyond these.

**Auth**

- `POST /api/auth/register` and `POST /api/auth/login`:
  - Body is exactly `{ email, password }`. The schema is strict: any extra key returns 400. Strip everything else before sending (for example, `confirmPassword` stays client-side).
  - Response: `{ token, user: { id, email, role } }`, where `role` is `"user" | "admin"`.
- Store `token` and send it as `Authorization: Bearer <token>`.
- There is no name field anywhere. Identify the user by `email`.

**Vehicle**

```ts
type Category =
  | "sedan"
  | "suv"
  | "hatchback"
  | "coupe"
  | "convertible"
  | "truck"
  | "van"
  | "electric";
type Vehicle = {
  id: string;
  make: string;
  model: string;
  category: Category;
  price: number; // positive integer, whole rupees
  quantity: number; // integer >= 0
  imageUrl?: string; // https URL, optional
  createdAt: string;
  updatedAt: string;
};
```

Category labels for display:

| API value   | Label       |
| ----------- | ----------- |
| sedan       | Sedan       |
| suv         | SUV         |
| hatchback   | Hatchback   |
| coupe       | Coupe       |
| convertible | Convertible |
| truck       | Truck       |
| van         | Van         |
| electric    | Electric    |

**Endpoints**

| Method & path                                                            | Who   | Notes                                                                                                                                           |
| ------------------------------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/vehicles`                                                      | auth  | All vehicles, including out-of-stock ones. Use this when no filter is active, and as the source for Make/Model options and price-slider bounds. |
| `GET /api/vehicles/search?q=&make=&model=&category=&minPrice=&maxPrice=` | auth  | `q` does a partial match on make or model. Omit empty params.                                                                                   |
| `POST /api/vehicles/:id/purchase`                                        | auth  | Buys 1 unit. Returns `409 OUT_OF_STOCK` when `quantity` is 0.                                                                                   |
| `POST /api/vehicles`                                                     | admin | Add a vehicle.                                                                                                                                  |
| `PUT /api/vehicles/:id`                                                  | admin | Update; send the full editable payload.                                                                                                         |
| `DELETE /api/vehicles/:id`                                               | admin | No undo.                                                                                                                                        |
| `POST /api/vehicles/:id/restock`                                         | admin | Body `{ quantity }` = units to add.                                                                                                             |

**Errors** — every error response is `{ error: { code, message, details } }`. The UI branches on `code`, never on HTTP text.

| code               | status | UI handling                                                                                                                                                                                          |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR` | 400    | Map `details` entries onto matching form fields. Anything that can't be mapped goes in an inline `Alert` showing `message`.                                                                          |
| `UNAUTHORIZED`     | 401    | On `/login`: inline Alert "Invalid email or password" (the API message is "invalid credentials"). Elsewhere: clear the token, redirect to `/login?next=…`, toast "Session expired — please sign in". |
| `FORBIDDEN`        | 403    | Toast "You don't have permission to do that".                                                                                                                                                        |
| `NOT_FOUND`        | 404    | Close any open dialog, toast "This vehicle no longer exists", refetch the list.                                                                                                                      |
| `CONFLICT`         | 409    | On register: field error on email, "An account with this email already exists". On vehicle forms: Alert showing `message`.                                                                           |
| `OUT_OF_STOCK`     | 409    | Set that vehicle's `quantity` to 0 in the cache, toast error "Sold out — no units left", refetch.                                                                                                    |

---

## 1. Design direction — "Showroom"

Premium automotive, modern, quiet. Think a dark showroom floor with one blue accent light.

- **Monochrome base, one accent.** Ink and graphite neutrals do 95% of the work. A single electric-periwinkle `brand` color marks focus, selection and one featured item. No gradients, no extra hues apart from status colors.
- **Wide, heavy display type** for headings (expanded grotesk). Calm sans for UI. Tabular mono for prices and numbers.
- **The car is the hero.** Cards keep generous whitespace around the vehicle image. Specs sit in a quiet two-stat row (category, units) below it.
- **Hairlines over shadows.** 1px borders separate surfaces. Shadows are reserved for floating layers (dialogs, popovers, hovered cards).
- **Square-ish geometry.** Small radius on cards and inputs. Pill shape only for buttons and badges.

Do not use: stock-template hero gradients, emoji, rainbow category colors, rounded-3xl bubbly cards, or centred marketing layouts on app screens.

---

## 2. Theme tokens (`src/index.css`)

All styling flows from these variables. App code must pass `@shadcn/lint` with zero raw colors, zero arbitrary values (`[#…]`, `[13px]`, `ring-[3px]`), and zero default-palette classes (`bg-zinc-900`, `text-blue-500`).

### Lint scope

The generated shadcn primitives in `src/components/ui/**` ship with arbitrary values (for example `ring-[3px]`, `h-[calc(...)]`), so that folder is exempt from **no-arbitrary-values only**. Every other rule (no raw colors, no palette classes) still applies there, and everything outside that folder gets the full rule set.

```jsonc
// lint config — express this in @shadcn/lint's own config format
{
  "rules": { "no-arbitrary-values": "error" },
  "overrides": [
    {
      "files": ["src/components/ui/**"],
      "rules": { "no-arbitrary-values": "off" },
    },
  ],
}
```

Don't move app components into `components/ui` to dodge the rule. Only shadcn-generated files (and their `cva` variant extensions) belong there.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@fontsource-variable/archivo/wdth.css";
@import "@fontsource-variable/geist";
@import "@fontsource-variable/geist-mono";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.5rem;

  --background: oklch(0.985 0.002 260);
  --foreground: oklch(0.17 0.01 260);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.17 0.01 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.17 0.01 260);

  --primary: oklch(0.17 0.01 260); /* ink — main CTAs */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.955 0.004 260);
  --secondary-foreground: oklch(0.21 0.01 260);
  --muted: oklch(0.955 0.004 260);
  --muted-foreground: oklch(0.48 0.012 260);
  --accent: oklch(0.94 0.008 260); /* hover/selected surfaces */
  --accent-foreground: oklch(0.17 0.01 260);

  --brand: oklch(0.7 0.14 266); /* periwinkle fill */
  --brand-foreground: oklch(0.17 0.01 260); /* ink text on brand */
  --brand-subtle: oklch(0.93 0.035 266); /* featured card tint */
  --brand-strong: oklch(0.5 0.19 266); /* brand text/links on light */

  --destructive: oklch(0.56 0.21 25);
  --destructive-foreground: oklch(0.985 0 0);
  --success: oklch(0.52 0.13 155);
  --success-foreground: oklch(0.985 0 0);
  --warning: oklch(0.78 0.15 75);
  --warning-foreground: oklch(0.22 0.04 75);

  --border: oklch(0.91 0.005 260);
  --input: oklch(0.88 0.006 260);
  --ring: oklch(0.6 0.17 266);

  --hero: oklch(0.145 0.006 260); /* dark band, same in both themes */
  --hero-foreground: oklch(0.97 0 0);
}

.dark {
  --background: oklch(0.145 0.006 260);
  --foreground: oklch(0.96 0.003 260);
  --card: oklch(0.185 0.007 260);
  --card-foreground: oklch(0.96 0.003 260);
  --popover: oklch(0.2 0.008 260);
  --popover-foreground: oklch(0.96 0.003 260);

  --primary: oklch(0.96 0.003 260); /* white CTAs on dark */
  --primary-foreground: oklch(0.145 0.006 260);
  --secondary: oklch(0.24 0.008 260);
  --secondary-foreground: oklch(0.96 0.003 260);
  --muted: oklch(0.24 0.008 260);
  --muted-foreground: oklch(0.7 0.012 260);
  --accent: oklch(0.26 0.01 260);
  --accent-foreground: oklch(0.96 0.003 260);

  --brand: oklch(0.74 0.13 266);
  --brand-foreground: oklch(0.145 0.006 260);
  --brand-subtle: oklch(0.26 0.05 266);
  --brand-strong: oklch(0.8 0.11 266);

  --destructive: oklch(0.66 0.2 25);
  --destructive-foreground: oklch(0.145 0.006 260);
  --success: oklch(0.72 0.15 155);
  --success-foreground: oklch(0.145 0.006 260);
  --warning: oklch(0.82 0.14 80);
  --warning-foreground: oklch(0.2 0.04 75);

  --border: oklch(1 0 0 / 9%);
  --input: oklch(1 0 0 / 14%);
  --ring: oklch(0.74 0.13 266);

  --hero: oklch(0.11 0.005 260);
  --hero-foreground: oklch(0.97 0 0);
}

@theme inline {
  /* colors → utilities (bg-brand, text-success, …) */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-subtle: var(--brand-subtle);
  --color-brand-strong: var(--brand-strong);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-hero: var(--hero);
  --color-hero-foreground: var(--hero-foreground);

  /* radius */
  --radius-sm: calc(var(--radius) - 4px); /* 4px  — badges inside inputs, kbd */
  --radius-md: calc(var(--radius) - 2px); /* 6px  — inputs, selects */
  --radius-lg: var(--radius); /* 8px  — cards, dialogs */
  --radius-xl: calc(var(--radius) + 4px); /* 12px — hero search bar, sheets */

  /* fonts */
  --font-display: "Archivo Variable", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, monospace;
}

@theme {
  /* type scale: size / line-height / tracking */
  --text-display: 3.5rem;
  --text-display--line-height: 1;
  --text-display--letter-spacing: -0.03em;
  --text-h1: 2.5rem;
  --text-h1--line-height: 1.05;
  --text-h1--letter-spacing: -0.025em;
  --text-h2: 1.75rem;
  --text-h2--line-height: 1.15;
  --text-h2--letter-spacing: -0.02em;
  --text-h3: 1.25rem;
  --text-h3--line-height: 1.3;
  --text-h3--letter-spacing: -0.01em;
  --text-body: 0.9375rem;
  --text-body--line-height: 1.55;
  --text-label: 0.8125rem;
  --text-label--line-height: 1.3;
  --text-label--letter-spacing: 0.01em;
  --text-overline: 0.6875rem;
  --text-overline--line-height: 1;
  --text-overline--letter-spacing: 0.14em;
  --text-price: 1.5rem;
  --text-price--line-height: 1;
  --text-price--letter-spacing: -0.02em;

  /* shadows — floating layers only */
  --shadow-card-hover:
    0 1px 2px oklch(0 0 0 / 4%), 0 12px 32px -12px oklch(0 0 0 / 18%);
  --shadow-overlay:
    0 2px 4px oklch(0 0 0 / 6%), 0 24px 64px -16px oklch(0 0 0 / 32%);
  --shadow-focus: 0 0 0 3px oklch(from var(--ring) l c h / 35%);

  /* layout */
  --container-page: 80rem; /* max-w-page */
  --container-form: 26rem; /* max-w-form — auth cards */
  --container-dialog: 32rem; /* max-w-dialog */

  /* motion */
  --ease-showroom: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 150ms;
  --duration-base: 220ms;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans text-body antialiased;
  }
  h1,
  h2,
  h3,
  .font-display {
    font-variation-settings: "wdth" 125;
  }
}
```

### Typography usage

| Role                                 | Classes                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| Hero / page title (dashboard)        | `font-display text-display font-bold` (mobile: `text-h1`)        |
| Section / auth title                 | `font-display text-h1 font-bold`                                 |
| Dialog title, card title             | `font-display text-h3 font-semibold`                             |
| Body copy                            | `text-body`                                                      |
| Form labels, button text, table text | `text-label font-medium`                                         |
| Overline (category, "IN STOCK")      | `text-overline font-semibold uppercase`                          |
| Prices, quantities, stats            | `font-mono text-price tabular-nums` (stats: `font-mono text-h3`) |

### Spacing

Use Tailwind's default 4px scale (`--spacing: 0.25rem`) only. Allowed rhythm:

- Inside components: `gap-2`, `gap-3`, `p-4`, `p-5`.
- Between card groups and form fields: `gap-4` (fields), `gap-6` (grid).
- Between page sections: `gap-12` (mobile `gap-8`).
- Page gutter: `px-4 sm:px-6 lg:px-8` inside `mx-auto max-w-page`.

### Radius usage

Cards, dialogs, and images use `rounded-lg`. Inputs and selects use `rounded-md`. The hero search bar uses `rounded-xl`. Buttons, badges, and avatar use `rounded-full`. Override shadcn's `Button` base classes once, to `rounded-full`.

---

## 3. App shell

- **Top bar** (`<header>`, sticky, `h-16`, `bg-background/80 backdrop-blur border-b`): wordmark left (`font-display font-bold`, "DRIVE" plus a `text-brand` dot), centre is empty on the dashboard, right side has the theme toggle (`Button variant="ghost" size="icon"`) and a user `DropdownMenu`. Its trigger is an `Avatar` whose `AvatarFallback` is the uppercase first letter of the email. The menu shows a label with the full email (`text-label`, truncated), a role `Badge` ("Admin" uses `bg-brand text-brand-foreground`; "User" uses `variant="secondary"`), a Separator, then "Sign out".
- The theme toggle sets `.dark` on `<html>`, persists to `localStorage`, and defaults to the system setting.
- Routes: `/login`, `/register`, `/` (dashboard, protected). Unauthenticated users are sent to `/login?next=…`.
- Mount a single `<Toaster position="bottom-right" richColors closeButton />` (Sonner) at the root.

---

## 4. Screens

### 4.1 Login `/login` and Register `/register`

Split layout on `lg+`. Single column below `lg`.

- **Left pane (lg+ only, `bg-hero text-hero-foreground`):** a full-height panel with a vehicle image (object-cover, bottom-anchored) and a tagline in `font-display text-display`, e.g. "Every car. One floor." The wordmark sits top-left.
- **Right pane:** a centred `Card` (`max-w-form w-full`, no shadow, `border`), with `CardHeader`, a title (`text-h1 font-display`), and a muted one-line description.
- **Form:** `react-hook-form` + `zod` + shadcn `Field` / `Form` components.
  - Login: email, password (with show/hide `Button variant="ghost" size="icon"` inside an `InputGroup`).
  - Register: email, password, confirm password. There is no name field. `confirmPassword` is validated only on the client (must match) and is never sent.
  - The submitted payload for both forms is exactly `{ email, password }`.
  - Show password rules as helper text, mirroring the API's validation rules.
- **Submit:** a full-width `Button` that shows `Spinner` plus "Signing in…" / "Creating account…" while pending and is disabled during the request.
- **Errors:** field errors appear inline (`FieldError`, `text-destructive text-label`). Server errors are mapped per section 0:
  - Login `UNAUTHORIZED` → `Alert variant="destructive"` above the submit button reading "Invalid email or password". Not a toast.
  - Register `CONFLICT` → field error on email.
  - `VALIDATION_ERROR` → field errors.
- **Footer link:** "No account? Create one" / "Already registered? Sign in", styled `text-brand-strong underline-offset-4 hover:underline`.
- **On success:** store the token and user, navigate to `next` or `/`, then toast "Welcome back, {email}" after login or "Account created — signed in as {email}" after registering.

### 4.2 Vehicle dashboard `/`

**Header band** (`bg-hero text-hero-foreground`, `pt-10 pb-20`):

- An overline reading "INVENTORY", then the title "Find your next drive" (`text-display font-display`), then a muted count: "{n} vehicles · {m} in stock" (`font-mono`).
- If the user is an admin, an "Add vehicle" `Button` (`variant="secondary"`, plus icon) sits right-aligned in the band.

**Filter bar** overlaps the band (`-mt-10`) in a `Card` with `rounded-xl shadow-card-hover p-2`:

- **Desktop (`md+`):** one row of segments divided by `Separator orientation="vertical"`:
  1. **Search:** an `InputGroup` with a search icon, placeholder "Search make or model", debounced 300ms.
  2. **Make:** `Select` with the distinct makes from `GET /api/vehicles`, sorted, plus "All makes".
  3. **Model:** `Select` with the distinct models for the chosen make. Disabled until a make is chosen; reset when the make changes.
  4. **Category:** `Select` with the fixed enum from section 0 (submit lowercase values, display labels), plus "All categories".
  5. **Price:** a `Popover` trigger showing "₹min – ₹max". Inside, a dual-thumb `Slider` (step 10,000) bounded by the lowest and highest prices in the full list, plus two whole-number `Input`s. Integers only.
  6. **Reset:** `Button variant="ghost"`, shown only when any filter is active.
- **Mobile (`< md`):** the search input stays full width, with a "Filters" `Button variant="outline"` next to it that shows a count `Badge`. The button opens a bottom `Sheet` containing the same controls stacked, plus "Apply" and "Reset".
- Filters live in URL search params named exactly like the API (`?q=&make=&model=&category=&minPrice=&maxPrice=`) so they survive reload and can be shared.
- Data source:
  - No active filter → `GET /api/vehicles`.
  - Any active filter → `GET /api/vehicles/search`, passing only the non-empty params.
  - Price params are sent only when the user has moved them off the slider bounds.
- Below the bar, render active filters as removable `Badge variant="secondary"` chips with an × button (`aria-label="Remove filter: {value}"`).

**Grid:**

- `grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` inside `max-w-page`, with `mt-8`.
- A sort `Select` sits right-aligned above the grid. Sorting is done on the client:
  - Price ↑ / Price ↓ — by `price`
  - Newest — by `createdAt` (default)
  - Most stock — by `quantity`

### 4.3 Vehicle card

Use `Card` with `group relative overflow-hidden rounded-lg border bg-card p-0 transition-shadow duration-base ease-showroom hover:shadow-card-hover`.

```
┌─────────────────────────────────┐
│ MERCEDES-BENZ       [● In stock]│  make as overline (muted) + stock Badge
│ GLE 450                    [⋯]  │  model: font-display text-h3 + admin menu
│                                 │
│        [ vehicle image ]        │  aspect-video
│                                 │
│ ─────────────────────────────── │  Separator
│  SUV              12            │  stats: 2 columns, divided by a vertical Separator
│  CATEGORY         UNITS         │  value: text-h3 (quantity in font-mono) / overline label
│ ─────────────────────────────── │
│ ₹84,90,000         [ Purchase ] │  price + primary Button
└─────────────────────────────────┘
```

- **Stats:** exactly two — Category (display label from section 0) and Units (`quantity`). There is no year or fuel; never render fields that aren't in the Vehicle type.

- **Image:** `aspect-video object-contain` on a `bg-muted` stage, with `px-6`. Use `loading="lazy"` and an `alt` of "{make} {model}". If `imageUrl` is absent or fails to load (`onError`), show a neutral car-silhouette SVG (`text-muted-foreground/40`). Never show a broken image icon.
- **Stock badge** (`Badge`, `rounded-full`, with a leading 6px dot):
  - `quantity > 3`: "In stock", `bg-success/12 text-success`
  - `1–3`: "Only {n} left", `bg-warning/20 text-warning-foreground`
  - `0`: "Out of stock", `bg-destructive/12 text-destructive`
- **Price:** `font-mono text-price tabular-nums`. `price` is whole rupees, so format it with `new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })`. Never divide by 100.
- **Purchase button:** `Button` (default/primary), `rounded-full`.
  - Pending state: `Spinner` plus "Purchasing…", disabled.
  - At `quantity === 0`: `disabled`, label "Sold out", wrapped in a `Tooltip` reading "Out of stock — check back after restock". Wrap the disabled button in a `<span tabIndex={0}>` so the tooltip still works.
  - Calls `POST /api/vehicles/:id/purchase` and buys one unit.
  - On success, decrement `quantity` optimistically and toast "Purchased {make} {model}".
  - On error, roll back. If the code is `OUT_OF_STOCK`, set quantity to 0 so the button flips to "Sold out", toast "Sold out — no units left", and refetch. Other errors follow section 0.
- **Admin menu:** a `DropdownMenu` triggered by `Button variant="ghost" size="icon"` (`aria-label="Actions for {make} {model}"`), placed top-right. Items: Edit, Restock, Separator, then Delete (`variant="destructive"`). The menu is not rendered at all for non-admin users; don't just hide it.
- **Featured treatment (optional):** at most one card per row may use `bg-brand-subtle` (for example, the newest arrival). Never use it for more than one card at a time.

### 4.4 Admin dialogs

All admin dialogs use `Dialog` with `max-w-dialog`, `DialogHeader` (title `font-display text-h3` plus a `DialogDescription`), and a `DialogFooter` with "Cancel" (`variant="ghost"`) and the confirm button on the right. Forms use `react-hook-form` + `zod` with the same schema as the API.

| Dialog           | Component                                                                 | Fields / behaviour                                                                                                                                                                                                                                                                                                                                                | Confirm                                                                             |
| ---------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Add vehicle**  | `Dialog` → `POST /api/vehicles`                                           | make (`Input`, required), model (`Input`, required), category (`Select` with the enum), price (`InputGroup` with ₹ prefix; positive whole number; `inputMode="numeric"`), quantity (`Input type="number" min=0 step=1`, default 0), image URL (optional; must start with `https://`). Arrange in a 2-column grid on `sm+`. Send `imageUrl` only when it's filled. | "Add vehicle" → toast "{make} {model} added"                                        |
| **Edit vehicle** | `Dialog` → `PUT /api/vehicles/:id`                                        | Same form, prefilled. Confirm is disabled until the form is dirty. Send the full editable payload; never send `id`, `createdAt` or `updatedAt`.                                                                                                                                                                                                                   | "Save changes" → toast "Changes saved"                                              |
| **Restock**      | `Dialog` (compact) → `POST /api/vehicles/:id/restock` with `{ quantity }` | Shows the current quantity (read-only, mono). The "Add units" field is a positive integer with −/+ `Button size="icon"` controls, min 1. A live preview reads "New total: {current + n}".                                                                                                                                                                         | "Restock" → toast "Restocked: +{n} units"                                           |
| **Delete**       | `AlertDialog` → `DELETE /api/vehicles/:id`                                | Text: "Delete {make} {model}? This removes it from inventory and can't be undone."                                                                                                                                                                                                                                                                                | `AlertDialogAction` styled destructive → toast "Vehicle deleted". There is no undo. |

Zod schemas for these forms mirror section 0 exactly: integers via `z.coerce.number().int()`, price `.positive()`, quantity `.min(0)`, restock `.min(1)`, `imageUrl` as `z.string().url().startsWith("https://")` and optional. Category labels are only for display; the payload always uses the lowercase enum values.

Rules for all admin dialogs:

- While a request is in flight, the confirm button shows `Spinner` and is disabled, inputs are disabled, and the dialog stays open.
- Close the dialog only on success.
- `VALIDATION_ERROR` details map back onto their fields. `CONFLICT` and any unmappable error appear as an `Alert variant="destructive"` inside the dialog, showing `message`. `NOT_FOUND` and `FORBIDDEN` follow section 0.
- Focus the first field on open. Return focus to the triggering card's menu button on close (Radix handles this — don't break it).

---

## 5. States

| State                                 | Where                       | Spec                                                                                                                                                                                        |
| ------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading (initial)**                 | Grid                        | 8 skeleton cards that match the real card layout: `Skeleton` blocks for the overline, title, `aspect-video` image, stat row, and price/button. Filter bar controls render but are disabled. |
| **Loading (refetch / filter change)** | Grid                        | Keep the current cards visible at `opacity-60` and show a 2px indeterminate bar (`bg-brand`) under the filter bar. Don't flash skeletons.                                                   |
| **Loading (action)**                  | Buttons                     | Inline `Spinner` plus a verb in -ing form. Never block the whole page.                                                                                                                      |
| **Empty — no inventory**              | Grid                        | `Empty` component: car icon, title "No vehicles yet", description. Admins also get an "Add vehicle" button; customers get no CTA.                                                           |
| **Empty — no results**                | Grid                        | `Empty`: search icon, "No matches", text "Try a different make or widen the price range.", plus a "Clear filters" `Button variant="outline"`.                                               |
| **Error — list failed**               | Grid                        | `Alert variant="destructive"` with the title "Couldn't load inventory", the message, and a "Retry" `Button variant="outline" size="sm"`. Keep the filter bar usable.                        |
| **Error — `UNAUTHORIZED`**            | Global (not the login form) | Clear the token, redirect to `/login?next=…`, toast "Session expired — please sign in".                                                                                                     |
| **Error — `FORBIDDEN`**               | Admin action                | Error toast "You don't have permission to do that".                                                                                                                                         |
| **Error — `NOT_FOUND`**               | Card or dialog action       | Close the dialog, toast "This vehicle no longer exists", refetch.                                                                                                                           |
| **Error — `OUT_OF_STOCK`**            | Purchase                    | See 4.3.                                                                                                                                                                                    |
| **Offline / network**                 | Global                      | Error toast "Network error — check your connection" with a "Retry" action.                                                                                                                  |

**Toast rules (Sonner):** use `toast.success` for completed actions, `toast.error` for failures (use the mapped message from section 0, falling back to `error.message`), and `toast.promise` for purchase and restock. Toasts last 4s (errors 6s). Keep messages to one line, no exclamation marks. Don't toast validation errors — those stay inline.

---

## 6. shadcn component map

| Need                                 | Component                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Buttons                              | `button` (variants: default, secondary, outline, ghost, destructive; sizes: sm, default, icon) |
| Text fields                          | `input`, `input-group`, `label`, `field` (or `form`)                                           |
| Dropdown filters, sort, category     | `select`                                                                                       |
| Price range                          | `popover` + `slider`                                                                           |
| Mobile filters                       | `sheet` (side="bottom")                                                                        |
| Vehicle card, auth card              | `card`                                                                                         |
| Stock, role, filter chips            | `badge`                                                                                        |
| Admin card actions, user menu        | `dropdown-menu`, `avatar`                                                                      |
| Add / Edit / Restock                 | `dialog`                                                                                       |
| Delete confirm                       | `alert-dialog`                                                                                 |
| Disabled purchase hint, icon buttons | `tooltip`                                                                                      |
| Loading                              | `skeleton`, `spinner`                                                                          |
| Empty states                         | `empty`                                                                                        |
| Inline errors                        | `alert`                                                                                        |
| Toasts                               | `sonner`                                                                                       |
| Dividers                             | `separator`                                                                                    |

Install only these. Extend variants with `cva` inside the component files; never restyle with ad-hoc classes at call sites when a variant should exist.

---

## 7. Accessibility

- **Contrast:** body text ≥ 4.5:1 and large text/UI ≥ 3:1 in both themes. Brand-colored text on light backgrounds uses `text-brand-strong`, never `text-brand`. `bg-brand` fills use `text-brand-foreground` (ink).
- **Focus:** every interactive element shows the shadcn focus ring, which is built into the `components/ui` primitives. App code gets it by composing those primitives, not by writing `ring-[3px]` itself. For the rare custom focusable element, use `focus-visible:ring-3 focus-visible:ring-ring/50`. Never remove outlines.
- **Keyboard:** the whole flow — filter, purchase, open the admin menu, complete a dialog — must work without a mouse. The tab order follows the visual order. `Esc` closes overlays.
- **Semantics:** one `<h1>` per page. The grid is a `<ul role="list">` of `<li>` cards, and each card title is an `<h3>`. The filter bar is a `<form role="search">`.
- **Labels:** every input has a visible `Label` (search may use `sr-only`). Icon-only buttons have an `aria-label`.
- **Status isn't color-only:** stock badges always include text. The result count updates in an `aria-live="polite"` region ("{n} results").
- **Disabled purchase:** use the native `disabled` attribute plus the tooltip text (see 4.3) so screen readers announce the reason.
- **Motion:** wrap transitions in `motion-safe:`, and disable hover lifts and the progress bar animation under `prefers-reduced-motion`.
- **Targets:** at least 40×40px on touch (`size="icon"` buttons are `size-10` on mobile).
- **Forms:** errors are linked via `aria-describedby` (handled by `Field`/`FormMessage`), and focus moves to the first invalid field on submit.

---

## 8. Do / Don't for agents

- **Do** use semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`, `bg-brand`).
- **Do** use the type tokens (`text-h3`, `text-price`).
- **Don't** use `bg-gray-*`, `text-[#…]`, `rounded-2xl`, `shadow-lg`, or `text-xl` for headings.
- **Do** read role from auth context and gate admin UI by not rendering it. Also handle 403 errors as a fallback.
- **Do** keep money and counts in `font-mono tabular-nums`.
- **Don't** add new colors. If a status needs one, add a token pair to section 2 first, in both themes.
- **Do** run `@shadcn/lint` and fix every violation before committing. Arbitrary values are allowed only inside `src/components/ui/**` (see Lint scope).
- **Don't** send fields the API doesn't accept (no `name`, no `confirmPassword`, no `id`/timestamps in bodies), and don't render fields it doesn't return (no year, fuel or currency).
