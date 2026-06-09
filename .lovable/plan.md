
# Necto Admin Dashboard — Plan

A self-contained admin area under `/admin/*` powered by real Supabase Auth + a `user_roles` table. Existing public app (localStorage phone-based identity) is untouched.

## 1. Backend (single migration)

### New tables
- `app_role` enum: `admin`.
- `user_roles(id, user_id → auth.users, role, created_at)` — unique(user_id, role).
- `approval_history(id, entity_type [customer|worker|shop], entity_id, previous_status, new_status, changed_by → auth.users, notes, created_at)`.
- `activity_logs(id, actor_id [nullable for system], actor_email, action, entity_type, entity_id, metadata jsonb, created_at)`.
- Indexes on `(entity_type, entity_id)`, `created_at desc`, `approval_status` on customers/workers/shops.

### Security definer function
- `public.has_role(_user_id uuid, _role app_role) returns boolean` (SECURITY DEFINER, search_path=public).

### RLS / GRANTs
- `user_roles`: select to authenticated (own rows only via `auth.uid() = user_id`); admins can read all via `has_role`. No public insert.
- `approval_history`, `activity_logs`: admins-only read; inserts via service role (edge functions). Grants to authenticated + service_role.
- `customers`, `workers`, `shops`, `products`, `support_queries`: keep existing public policies intact. Add additional admin policies: `has_role(auth.uid(),'admin')` → full SELECT/UPDATE. No DELETE policy (logical suspension only).

### Triggers (system audit)
- AFTER INSERT on customers/workers/shops → write to `activity_logs` with `action='registration'`.
- AFTER UPDATE OF approval_status on customers/workers/shops → write to `approval_history` + `activity_logs`.

### Admin seeding
After migration runs, you sign up at `/admin/login`. I'll then run a one-line SQL insert into `user_roles` granting your `auth.uid()` the `admin` role.

## 2. Edge function: `admin-actions` (verify_jwt=false, validates JWT in code)

Single function handling privileged writes so admin RLS is minimal & auditable:
- `approve | reject | suspend` an entity → updates `approval_status`, `approval_notes`; trigger writes history+log.
- `update_support_status` → updates `support_queries.status`; writes activity log.
- `hide_product | restore_product` → toggles a new `products.visibility` column.
- Validates `has_role(auth.uid(),'admin')` before every action.

Adds `products.visibility` column (`'visible' | 'hidden'`, default `'visible'`) — only field added to existing tables besides what already exists.

## 3. Frontend (`src/pages/admin/*`, fully isolated)

### Routes (added to `App.tsx` only)
```
/admin/login         → AdminLogin
/admin               → Overview (default)
/admin/customers     → CustomersTable
/admin/workers       → WorkersTable
/admin/shops         → ShopsTable
/admin/products      → ProductsTable
/admin/support       → SupportTable
/admin/activity      → ActivityLog
/admin/analytics     → Analytics
```

### Components
- `AdminLayout` — sidebar (shadcn `sidebar`), top bar with admin email + sign out. Mobile-responsive.
- `RequireAdmin` guard — checks session via `onAuthStateChange` + `getUser()`, then `has_role` RPC. Redirects non-admins to `/admin/login`.
- `StatCard`, `DataTable` (search + filter + pagination via TanStack-like manual paging using `range()`), `StatusBadge`, `ApprovalActions`, `DetailDrawer`.
- Analytics: simple charts via `recharts` (already in shadcn ecosystem; add if missing) — registrations per day (last 30d), approval status breakdown.

### Styling
Modern SaaS look, but using existing Necto tokens (primary `#1E3A8A`-family already in CSS). Dark mode opt-in for admin only via a `.admin` scope, no impact on public app.

## 4. Safety guarantees

- Zero edits to `src/pages/c/*`, `src/pages/w/*`, `src/pages/s/*`, `src/components/*` (except `AppShell` left alone). Only `src/App.tsx` gets new routes appended.
- No changes to existing RLS policies — only additive admin policies.
- No changes to `.env`, `vercel.json`, auto-gen Supabase files.
- Approval status remains admin-only metadata; public listings unchanged.
- `npm run build` will be verified after implementation.

## 5. Files

**New**
- `supabase/migrations/<ts>_admin.sql`
- `supabase/functions/admin-actions/index.ts`
- `src/pages/admin/{login,overview,customers,workers,shops,products,support,activity,analytics}.tsx`
- `src/components/admin/{AdminLayout,RequireAdmin,StatCard,DataTable,StatusBadge,ApprovalActions,DetailDrawer}.tsx`
- `src/lib/admin/{api.ts,useAdminAuth.ts}`

**Edited**
- `src/App.tsx` (append admin routes only)
- `src/integrations/supabase/types.ts` (auto-regen after migration)

## 6. Post-deploy verification
- Build passes.
- `/admin/login` reachable; non-admin sign-in redirected.
- After granting admin role: overview loads counts, each table paginates, approve/reject writes to `approval_history` + `activity_logs`.
- Public site (`/`, `/c/*`, `/w/*`, `/s/*`) unchanged — spot-check registration + listings.
