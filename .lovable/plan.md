# NECTO Production Audit & SEO Plan

## Deployment status
Live site `https://nectoweb.vercel.app/` returns **HTTP 200** — deployment is healthy. No fix needed there. PWA manifest, icons, and Google verification tag are already in HTML. Vercel SPA fallback (`vercel.json` rewrite) is correct.

No build/TS/routing/import errors found in current source. Existing functionality (roles, profiles, 7-day lock, delete, PWA) stays untouched.

## What I will change (SEO + production hardening only — zero business-logic edits)

### 1. SEO meta + structured data (`index.html`)
Upgrade the static head with:
- Canonical: `<link rel="canonical" href="https://nectoweb.vercel.app/" />`
- Open Graph: `og:site_name=NECTO`, `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image=/icon-512.png`
- Twitter card: `summary_large_image` + same fields
- JSON-LD **WebSite** schema (with `SearchAction` placeholder) + **Organization** schema (name NECTO, url, logo)
- `robots` meta = `index,follow`

### 2. Per-route SEO (lightweight, no new deps)
Add a tiny `useSeo(title, description, canonicalPath)` hook in `src/lib/seo.ts` that mutates `document.title` and the description/canonical/og tags on route change. Wire into the 4 public-facing pages only:
- `/` (landing)
- `/c/register`, `/w/register`, `/s/register`
All dashboard / contacts / profile / id routes get `noindex` via the same hook (they're private after role selection).

Avoid `react-helmet-async` to keep bundle + risk minimal.

### 3. `public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /c/home
Disallow: /c/profile
Disallow: /c/worker/
Disallow: /c/shop/
Disallow: /w/dashboard
Disallow: /w/contacts
Disallow: /w/profile
Disallow: /w/shop/
Disallow: /s/dashboard
Disallow: /s/contacts
Disallow: /s/workers
Disallow: /s/products
Disallow: /s/profile
Disallow: /s/worker/

Sitemap: https://nectoweb.vercel.app/sitemap.xml
```

### 4. `public/sitemap.xml` + generator
Add `scripts/generate-sitemap.ts` and `prebuild`/`predev` npm scripts. Entries: `/`, `/c/register`, `/w/register`, `/s/register`, `/c/workers`, `/c/shops` (public discovery). `lastmod` = build date.

### 5. Vercel headers (optional, in `vercel.json`)
Add long-cache headers for `/assets/*` (immutable, hashed) and `no-cache` for `/index.html` + `/sw.js` to prevent stale-app issues after deploys. Pure perf — no behavior change.

### 6. Performance/scalability notes (no code change unless approved)
- React Query already in place ✓
- Supabase client lazy via Proxy ✓
- PWA caching strategies already sane (NetworkFirst HTML) ✓
- Suggestion (NOT applied without OK): lazy-load route components with `React.lazy` to shrink initial bundle. Flagging for your decision since it touches `App.tsx`.

## Out of scope (won't touch)
- Auth flow, role logic, 7-day lock, profile edit/delete
- Supabase schema/RLS
- PWA service worker
- `index.html` body / app bootstrap

## Validation
After edits I'll run `bun run build`, fetch `/robots.txt` + `/sitemap.xml` locally, and confirm no TS errors.

## Deliverables in final message
Audit report, issues found (none critical), fixes applied list, SEO improvements, deployment safety ✅, scalability notes, readiness score.

---

**Question before I build:** Should I also apply the optional **route-level `React.lazy` code-splitting** in step 6? It improves initial load (LCP) but lightly touches `App.tsx`. Reply yes/no, or just "go" to proceed without it.
