
# NECTO — Hyperlocal Marketplace Plan

A mobile-first marketplace connecting Customers, Workers, and Shops in local areas. Role is chosen once and locked in `localStorage`; each role gets its own UI shell and bottom navigation.

## Tech Stack

- React + Vite + TypeScript + React Router + Tailwind
- Lovable Cloud (Supabase) for database
- Poppins via Google Fonts
- Deployable to Vercel (SPA fallback via `vercel.json`)

## Design System

- Background `#FFFFFF`, Primary `#1E3A8A`, Accent `#F97316`
- Poppins everywhere; clean, minimal, Swiggy/Rapido-style clarity
- Tokens defined in `index.css` + `tailwind.config.ts` (no hardcoded colors in components)
- Reusable components: `Button`, `Card`, `SearchBar`, `AreaFilterBar`, `EmptyState`, `BottomNav`, `FloatingHelpButton`, `RatingStars`, `Badge`

## Routing & Role Gate

- `/` landing page with 3 buttons → writes `necto_role` to `localStorage` → routes to that role's registration (or dashboard if already registered, tracked by `necto_user_id`)
- `RoleGuard` wrapper redirects users to their locked role's section; landing never reappears
- Route groups:
  - Customer: `/c/register`, `/c/home`, `/c/workers`, `/c/shops`, `/c/worker/:id`, `/c/shop/:id`, `/c/profile`
  - Worker: `/w/register`, `/w/dashboard`, `/w/contacts`, `/w/shops`, `/w/shop/:id`, `/w/profile`
  - Shop: `/s/register`, `/s/dashboard`, `/s/contacts`, `/s/products`, `/s/workers`, `/s/worker/:id`, `/s/profile`

## Two-Level Search (shared component)

- `SearchBar` (Level 1) for service/category keywords
- After first query, `AreaFilterBar` (Level 2) appears with placeholder "Filter by area..."
- Results recompute on each keystroke; empty states show "No {term} found in {area}" + "Be the first to register!" CTA routing to the relevant role registration

## Customer Flow

1. Registration form → inserts into `customers`, stores returned id in localStorage
2. Home: search across workers + shops merged, mixed cards with Worker/Shop badge
3. Workers / Shops pages: same card grid, filtered to one type
4. Profile pages: photo, info, big green WhatsApp + big blue Call buttons (wa.me / tel:), reviews placeholder section. Each tap logs to `contacts_log`
5. Profile tab: shows customer's own info + logout/role-reset hidden (no switching)

## Worker Flow

1. Registration with job type, experience, hours, visibility (Local/All India)
2. Dashboard: welcome + stat cards (totals from `contacts_log` where `to_id`=worker)
3. My Profile: read-only for 7 days post `registered_at`; countdown via date diff; editable after
4. Contacts page: list from `contacts_log` joined to `customers`
5. Browse Shops: customer-style shop search/cards/profile

## Shop Flow

1. Registration similar to worker
2. Dashboard with stats
3. Profile (7-day edit lock)
4. Contacts page
5. Products CRUD (name, description, price, photo URL) in `products` table
6. Browse Workers: same shared search/cards/profile

## Support System

- `FloatingHelpButton` on every authenticated page → modal form (name, phone, message) → inserts into `support_queries` → confirmation toast

## Supabase Tables

Created via migration with RLS + grants:

- `customers(id uuid pk, name, area, phone, role text, created_at)`
- `workers(id, name, job_type, experience int, phone, whatsapp, description, area, visibility text, business_hours jsonb, photo_url, rating numeric default 0, registered_at)`
- `shops(id, owner_name, shop_name, category, phone, whatsapp, description, area, visibility, business_hours jsonb, photo_url, rating numeric default 0, registered_at)`
- `products(id, shop_id fk, name, description, price numeric, photo_url, created_at)`
- `contacts_log(id, from_phone, to_id uuid, to_type text, contact_type text, timestamp)`
- `support_queries(id, name, phone, message, status text default 'open', created_at)`

Since the app has no auth (role stored client-side), RLS will be permissive: `anon` + `authenticated` granted SELECT/INSERT on all listing/log tables; UPDATE/DELETE limited to rows matching the stored id passed from the client (enforced via policy on id match). Acceptable for a public directory MVP; documented for user.

## Vercel Deploy

- Add `vercel.json` with SPA rewrite `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`
- Standard Vite build (`npm run build`, output `dist`)
- Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) set in Vercel dashboard

## File Structure (high level)

```text
src/
  pages/
    Landing.tsx
    customer/  (Register, Home, Workers, Shops, WorkerProfile, ShopProfile, Profile)
    worker/    (Register, Dashboard, Contacts, Shops, ShopProfile, Profile)
    shop/      (Register, Dashboard, Contacts, Products, Workers, WorkerProfile, Profile)
  components/
    SearchBar, AreaFilterBar, ListingCard, EmptyState,
    BottomNav (3 variants), FloatingHelpButton, SupportModal,
    ContactButtons, RatingStars, RoleGuard
  hooks/ useRole, useListings, useCountdown
  lib/ supabase.ts, format.ts
  index.css, main.tsx, App.tsx
supabase/migrations/0001_init.sql
vercel.json
```

## Open Assumption

- No photo upload backend specified → product/profile photos accept a URL field (Storage bucket can be added later if needed).
- "Reviews & Rating" section will render the stored `rating` + a static "Reviews coming soon" placeholder since no reviews table was specified.

Confirm or tweak and I'll build it.
