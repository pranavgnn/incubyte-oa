# Walkthrough

A step-by-step tour of the DRIVE. dealership app, captured from a local run (`pnpm dev`) against a freshly seeded database. It follows one customer from sign-up to purchase, then an admin managing inventory.

Back to the [README](README.md).

## Contents

1. [Signing in and registering](#1-signing-in-and-registering)
2. [Browsing the inventory](#2-browsing-the-inventory)
3. [Searching and filtering](#3-searching-and-filtering)
4. [Buying a vehicle](#4-buying-a-vehicle)
5. [Admin: signing in](#5-admin-signing-in)
6. [Admin: restocking](#6-admin-restocking)
7. [Admin: adding a vehicle](#7-admin-adding-a-vehicle)
8. [Admin: editing and deleting](#8-admin-editing-and-deleting)
9. [Themes, mobile and API docs](#9-themes-mobile-and-api-docs)

## 1. Signing in and registering

Every page except sign-in and registration needs an account, so a signed-out visitor lands on the sign-in page.

![Sign-in page with the DRIVE. wordmark and a car silhouette](images/01-login.png)

Submitting an empty form shows inline errors under each field. The inputs are validated with the same Zod schemas the API uses.

![Sign-in form with "Enter a valid email address" and "Enter your password" errors](images/02-login-validation.png)

"Create one" opens registration. The password must be 8 characters to 72 bytes, and the confirmation must match. New accounts are always regular users.

![Registration form filled in for jordan@example.com](images/03-register.png)

## 2. Browsing the inventory

After registering, the user is signed in and taken straight to the inventory. The header counts all vehicles and those in stock. Each card shows the make, model, category, units and price, with a stock badge: green "In stock", amber "Only N left" or red "Out of stock".

![Inventory grid for a regular user](images/04-inventory-user.png)

The whole seeded inventory: 12 vehicles across every category. Sold-out vehicles stay listed with a disabled "Sold out" button, and vehicles without a photo show a silhouette.

![Full-page view of all 12 seeded vehicles](images/05-inventory-full.png)

## 3. Searching and filtering

Typing in the search box matches make or model, case-insensitively. The active filter appears as a removable chip, and the URL updates (`/?q=ford`) so the view can be shared.

![Search for "ford" showing three Ford vehicles](images/06-search.png)

Filtering by category narrows the grid to electric vehicles.

![Category filter set to Electric showing two Teslas](images/07-filter-category.png)

The price filter takes a minimum and a maximum in whole rupees. The placeholders show the cheapest and dearest price in the full list.

![Price filter between ₹30,000 and ₹60,000](images/08-filter-price.png)

When nothing matches, an empty state offers to clear the filters.

![Search for "lamborghini" with a "No matches" message](images/21-no-matches.png)

## 4. Buying a vehicle

"Purchase" buys one unit. Here the user buys the last BMW M5: a toast confirms it, the units drop to 0, the badge turns to "Out of stock" and the button becomes a disabled "Sold out". The in-stock count in the header drops from 8 to 7.

![BMW M5 sold out after the purchase, with a "Purchased BMW M5" toast](images/09-purchase-sold-out.png)

## 5. Admin: signing in

The user signs out from the account menu. A wrong password gives the same generic error whether or not the email exists, so the form never reveals which accounts are registered.

![Sign-in form showing "Invalid email or password"](images/10-login-invalid.png)

With the credentials printed by `pnpm --filter api db:seed`, the admin sees an "Add vehicle" button and an actions menu on every card. Regular users never see these, and the API answers 403 if they try.

![Inventory as an admin with the Add vehicle button](images/11-inventory-admin.png)

Each card's actions menu has Edit, Restock and Delete.

![Actions menu open on the BMW M5 card](images/12-admin-actions-menu.png)

## 6. Admin: restocking

Restock adds units to the current stock. The dialog shows the current count and the new total. A single restock adds 1 to 1000 units.

![Restock dialog for the BMW M5 adding 3 units for a new total of 3](images/13-restock-dialog.png)

After restocking, the M5 is back to "Only 3 left" and can be bought again.

![BMW M5 card showing 3 units after restocking](images/14-restocked.png)

## 7. Admin: adding a vehicle

"Add vehicle" opens a form for make, model, category, price, starting quantity and an optional https image URL. Submitting it empty shows what is missing.

![Add vehicle dialog with validation errors](images/15-add-vehicle-validation.png)

The filled-in form for a Porsche 911 Carrera.

![Add vehicle dialog filled in for a Porsche 911 Carrera](images/16-add-vehicle.png)

The new vehicle appears at the top of the grid. Without an image URL it shows the silhouette.

![Porsche 911 Carrera added to the inventory](images/17-vehicle-added.png)

## 8. Admin: editing and deleting

Edit changes the details but not the stock. Quantity is read-only here because stock only changes through purchase and restock, so an edit can never overwrite a purchase that happened in the meantime. "Save changes" stays disabled until something changes.

![Edit vehicle dialog changing the price to 119000](images/18-edit-vehicle.png)

Delete asks for confirmation first, because it cannot be undone.

![Delete confirmation for the Porsche 911 Carrera](images/19-delete-confirm.png)

## 9. Themes, mobile and API docs

The sun and moon button in the header switches between dark and light themes.

![Inventory in the light theme](images/20-light-theme.png)

On a phone-sized screen the filters stack and the cards fill the width.

![Inventory on a 390px-wide mobile screen](images/22-mobile-inventory.png)

The API serves an interactive reference at `/api/docs`, generated from the shared Zod schemas.

![Scalar API reference for the Car Dealership Inventory API](images/23-api-docs.png)
