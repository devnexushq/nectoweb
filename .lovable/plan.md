# Add Terms & Conditions, Privacy Policy, and Legal & Info

## 1. New pages

Create two static, mobile-friendly pages with back arrow (top-left), white background, `#1E3A8A` headings, readable typography, scrollable sections, and `useSeo` for title/description/canonical.

- `src/pages/legal/terms.tsx` — route `/terms-and-conditions`
- `src/pages/legal/privacy.tsx` — route `/privacy-policy`

Both reuse a small shared layout component `src/components/LegalLayout.tsx`:

- Max-w-2xl, px-5 py-6, back button (`ArrowLeft` from lucide → `navigate(-1)`).
- Headings styled `text-[#1E3A8A] font-bold`.
- Section spacing with horizontal dividers between numbered sections.
- Content uses the exact copy supplied in the request (Terms 1–10, Privacy 1–11).

Register routes in `src/App.tsx` (lazy import alongside existing routes). Add both URLs to `public/sitemap.xml` and `scripts/generate-sitemap.ts`.

There is already an About page concept referenced ("About Necto") — if no existing route exists, the Legal & Info "About" item will link to `/` (home) so nothing breaks; we will not create a new About page in this plan unless requested.

## 2. Registration consent checkbox

Edit `src/pages/c/register.tsx`, `src/pages/w/register.tsx`, `src/pages/s/register.tsx`.

Just above the existing submit button, add:

```
[ ] I have read and agree to the Terms & Conditions and Privacy Policy of Necto.
```

- Use existing shadcn `Checkbox` (`@/components/ui/checkbox`).
- Local state `const [agreed, setAgreed] = useState(false)`.
- "Terms & Conditions" and "Privacy Policy" are `<Link>`s opening `/terms-and-conditions` and `/privacy-policy` in a new tab (`target="_blank" rel="noopener"`), styled with `text-primary underline`.
- Submit button: add `disabled={loading || !agreed}` to existing disabled prop. No other layout/style change.
- Validation in `submit()` also rejects when `!agreed` with a toast, as a safety net.

All other form behavior, fields, navigation, and Supabase inserts remain unchanged.

## 3. Profile pages — add Legal & Info, move Delete to bottom

Edit `src/pages/c/profile.tsx`, `src/pages/w/profile.tsx`, `src/pages/s/profile.tsx`.

Currently `<ProfileActions>` renders Edit + Delete together. To avoid changing that component's API for other consumers, refactor minimally:

- Update `src/components/ProfileActions.tsx` to accept an optional `slot?: React.ReactNode` rendered between the Edit and Delete buttons. Default (when omitted) preserves existing behavior exactly.
- In each profile page, pass a `<LegalInfoSection />` as the `slot`.

New component `src/components/LegalInfoSection.tsx`:

- Heading "Legal & Info" (muted small caps style consistent with app).
- Card with top + bottom dividers, 3 rows: Terms & Conditions, Privacy Policy, About Necto.
- Each row: lucide icon (FileText, Shield, Info) on left, label, chevron `ChevronRight` on right; full-width clickable `Link` row, `h-12`, hover bg `bg-muted/50`, border between rows.
- Terms → `/terms-and-conditions`, Privacy → `/privacy-policy`, About → `/` (placeholder until a dedicated About page is requested).

Resulting profile order: details card → Edit Profile → Legal & Info → Delete Profile → InstallButton (existing). InstallButton currently sits at the bottom; keep its current position to preserve PWA install discoverability, since the request only specifies Delete must come after Legal & Info (not after Install). If you want Delete to be the absolute last element, confirm and I'll move InstallButton above Legal & Info instead.

## 4. SEO & deployment safety

- Add `/terms-and-conditions` and `/privacy-policy` to `public/sitemap.xml` and `scripts/generate-sitemap.ts` with `changefreq=yearly, priority=0.3`.
- `useSeo` titles: "Terms & Conditions — NECTO", "Privacy Policy — NECTO" with canonicals.
- No DB changes, no env changes, no edge functions — zero deployment risk.
- After implementation: visual check of `/c/register`, `/w/register`, `/s/register`, `/c/profile`, `/w/profile`, `/s/profile`, `/terms-and-conditions`, `/privacy-policy` in the preview.

## Files touched

- new: `src/components/LegalLayout.tsx`, `src/components/LegalInfoSection.tsx`, `src/pages/legal/terms.tsx`, `src/pages/legal/privacy.tsx`
- edit: `src/App.tsx`, `src/components/ProfileActions.tsx`, `src/pages/c/register.tsx`, `src/pages/w/register.tsx`, `src/pages/s/register.tsx`, `src/pages/c/profile.tsx`, `src/pages/w/profile.tsx`, `src/pages/s/profile.tsx`, `public/sitemap.xml`, `scripts/generate-sitemap.ts`

No existing functionality, styling, colors, animations, or backend behavior changes.                           When any user submits registration form 

and agrees to Terms & Conditions, save 

complete approval data to Supabase.

Add these fields to customers, 

workers and shops tables:

- terms_accepted (boolean)

- terms_accepted_at (timestamp - server generated)

- terms_version (text - "June 2026 v1.0")

- approval_status (text - "pending/approved/rejected")

- account_created_at (timestamp - server generated)

- last_updated_at (timestamp - server generated)

- approval_notes (text - optional)

IMPORTANT RULES:

- Use server-generated timestamps only

- Never use device/user time

- Save in UTC format

- Do not overwrite historical records

- No duplicate records

- Every registration must create one record

WHEN USER REGISTERS:

- terms_accepted = true

- terms_accepted_at = exact server timestamp

- terms_version = "June 2026 v1.0"

- approval_status = "pending"

- account_created_at = exact server timestamp

DATA MUST BE:

- Traceable

- Accurate

- Consistent after every deployment

- Legally valid proof of user consent

Do not create any admin panel.

Do not change existing UI.

Do not change existing functionality.