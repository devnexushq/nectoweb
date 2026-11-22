# Security Summary

**Reviewed Files**: 56 (frontend React pages/components, shared helpers, Supabase Edge Functions, and SQL migrations)
**Issues Resolved**: 9 fixed in code, 3 external/database actions documented for follow-up

### Issues Resolved

| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Discovery Filter & Approval Bypass | `src/components/ListingsView.tsx` | 136 | Worker and shop browse queries fetched all statuses without filtering `approval_status = 'approved'`, `visibility`, or `pincode` at the database level, and pulled raw `pincode` values into the browser. | High | Fixed | Scoped queries directly to `approval_status = 'approved'`, exact `visibility`, and matching `pincode` in Local mode, stopped fetching without a saved PIN, and removed `pincode` from selected discovery columns. |
| Unapproved Profile Exposure | `src/components/ProfileViews.tsx` | 41 | Direct worker and shop detail pages queried records by ID without filtering by `approval_status = 'approved'`. | Medium | Fixed | Added `.eq("approval_status", "approved")` to both worker and shop detail lookups (with schema fallback for older schemas). |
| Admin Action Auth & Wildcard Origin | `supabase/functions/admin-actions/index.ts` | 3 | Authenticated admin moderation actions returned `Access-Control-Allow-Origin: *`, and `update_approval_status` returned HTTP 410 instead of updating records server-side. | High | Fixed | Implemented server-side role-checked `update_approval_status` with audit logging and replaced wildcard origin headers with request-validated `Origin` + `ALLOWED_ORIGINS` allowlist support and `Vary: Origin`. |
| Consent & Approval Overwrite | `src/lib/legal.ts` | 12 | `consentInsertFields()` injected `approval_status: "pending"`, which could overwrite `"approved"` in fallback registration inserts, while signup Edge Functions silently ignored `terms_accepted: false`. | Medium | Fixed | Removed `approval_status` from `consentInsertFields()` and added explicit `terms_accepted === false` rejection (`400`) in `customer-signup`, `worker-signup`, and `shop-signup`. |
| Unvalidated WhatsApp & Experience | `supabase/functions/worker-signup/index.ts` | 95 | Invalid optional WhatsApp numbers were ignored instead of rejected, and negative experience numbers were stored as-is; `shop-signup` had the same WhatsApp gap. | Medium | Fixed | Added strict E.164 phone validation (`400` on invalid WhatsApp) in `worker-signup` and `shop-signup` plus `Math.max(0, ...)` experience clamping. |
| Unsafe Image URL Scheme | `src/components/ProfileActions.tsx` | 161 | Profile edit allowed saving non-HTTP schemes (such as `javascript:` or `data:`) in optional `photo_url`. | Medium | Fixed | Added validation requiring optional `photo_url` values to begin with `http://` or `https://`. |
| Dynamic Style Tag Injection | `src/components/ui/chart.tsx` | 64 | `ChartStyle` interpolated chart IDs, keys, and color values into an inline `<style>` tag without character filtering. | Low | Fixed | Restricted chart IDs, keys, and color tokens to safe CSS identifier and color character sets before rendering. |
| Unsafe Client Local Delete | `src/components/ProfileActions.tsx` | 229 | Profile delete cleared local session state even if server deletion failed, leaving orphaned records while also leaving `reviews` intact. | Low | Fixed | Cleared `reviews` alongside related data, checked delete errors before `clearAccount()`, and surfaced failure messages without signing the user out on error. |
| Unsafe SVG File Upload Vector | `src/pages/s/products.tsx` | 64 | Product image upload accepted any `image/*` file (including `image/svg+xml` containing executable scripts) into a public storage bucket (`product-images`). | High | Fixed | Replaced wildcard `image/*` check and input accept attribute with an explicit safe raster MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) in `src/pages/s/products.tsx` and added bucket MIME enforcement in `supabase/PROPOSED_SECURITY_AND_RLS_MIGRATION.sql`. |
| Historical Seed Admin Credential | `supabase/migrations/20260612150754_daa620bb-f00c-42b9-a489-030d2b1d51fa.sql` | 1 | A historical migration file sets a known seed password on the admin account (`niharmohanta14@gmail.com`). | High | Needs Follow-Up | Rotate the admin password immediately in Supabase Auth and enforce strong MFA. |
| Overly Permissive Live RLS Policies | `supabase/migrations/20260526145511_e507e113-b3f5-43a7-9b3d-565d366cfd4e.sql` | 13 | Initial policies grant broad anonymous `SELECT`/`UPDATE`/`DELETE` (`USING (true)`) across `customers`, `workers`, `shops`, `products`, and `reviews`. | High | Needs Follow-Up | Prepared non-destructive `supabase/PROPOSED_SECURITY_AND_RLS_MIGRATION.sql` (Phase A non-breaking RLS hardening + Phase B auth-paired PII lockdown) for review and backup before applying. |
| Dependency Advisories (`vite`, `zod`) | `package.json` | 71 | `bun audit` flags dev/build tooling advisories (including `vite@7.3.6` and `zod@3.25.76`). None of the vulnerable dev-server or build-time packages ship runtime server handlers or Zod parsers (`src/` has zero direct `zod` imports). | Low | Needs Follow-Up | Review major/tooling upgrade path (`vite` and `@hookform/resolvers` / `zod` v4) when scheduling the next dependency maintenance release. |

### Safeguards Verified

| Area | File | How It's Protected |
|---|---|---|
| Admin Auth & Role Guard | `supabase/functions/admin-actions/index.ts` | Verifies the caller's Bearer token via `auth.getClaims(token)` and checks `user_roles` (`role = 'admin'`) before performing moderation updates. |
| Parameterized Supabase Queries | `src/components/ListingsView.tsx`, `src/components/ReviewsSection.tsx` | All filters (`eq`, `in`, `gte`, `order`) use the Supabase PostgREST typed query builder rather than raw interpolated SQL strings. |
| Server-Side Key Separation | `vite.config.ts`, `src/integrations/supabase/client.ts` | Client bundles only use public Supabase URL and publishable/anon keys; service role credentials stay isolated inside Supabase Edge Functions (`Deno.env.get`). |
| Phone Normalization & Duplicates | `src/lib/phone.ts`, `supabase/functions/*-signup/index.ts` | Phone numbers are normalized to E.164 (`+91...`) on both client and server before duplicate checks and storage. |
| Approval-Scoped Offers & Start Time | `src/lib/activity.ts` | Shop offers join shop `approval_status`, skip offers from suspended/rejected shops, and filter out offers whose `offer_start_at` is still in the future. |
| Abort-Safe PIN Lookup | `src/components/PinCodeField.tsx` | Postal PIN lookups attach an `AbortController` and ignore aborted or unmounted callbacks so stale area names never overwrite user input. |

## PoC Verification

### Unapproved & Cross-PIN Discovery Listing Query

#### Summary
| Field | Value |
|---|---|
| Issue Type | Missing Approval & Query-Level Visibility Filtering |
| Impact | High |
| Affected File | `src/components/ListingsView.tsx:136` |
| Test Scenario | A Local viewer with saved PIN `751001` loads Workers discovery while the database contains an `all_india` worker, a `suspended` worker at `751001`, and a `local` worker at `560001`. |

#### How It Was Fixed
Moved `approval_status = 'approved'`, `visibility`, and exact `pincode` equality directly into the database query builders and excluded the `pincode` column from browse responses.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Viewer selects `Local` tab with saved PIN `751001` (`ListingsView.tsx:113`) | Query checks `visibility === 'local'` and non-empty `vPin` |
| 2 | `fetchWorkers` builds PostgREST query (`ListingsView.tsx:136-144`) | Applies `.eq("approval_status", "approved").eq("visibility", "local").eq("pincode", "751001")` |
| 3 | Selected columns (`ListingsView.tsx:20-23`) exclude `pincode` | Only approved PIN `751001` local workers return without exposing provider PINs |
| 4 | Memoized defense-in-depth `visFilter` (`ListingsView.tsx:202-210`) verifies `visibility === "local"` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Neither suspended/rejected records, other-PIN local providers, nor raw provider PIN codes are returned to discovery callers, and missing viewer PINs execute zero listing queries.

---

### Privileged Admin Actions & CORS Restriction

#### Summary
| Field | Value |
|---|---|
| Issue Type | Missing Origin Allowlist & Stubbed Admin Moderation Handler |
| Impact | High |
| Affected File | `supabase/functions/admin-actions/index.ts:3` |
| Test Scenario | A cross-origin request with `Origin: https://untrusted.example` sends an unauthenticated `POST` `{ "action": "update_approval_status", "table": "workers", "id": "...", "status": "suspended" }` without a valid admin Bearer token. |

#### How It Was Fixed
Replaced wildcard CORS (`*`) with request-validated origin headers supporting `ALLOWED_ORIGINS`, enforced Bearer JWT verification and `user_roles` `admin` verification before checking `body.action`, and validated both table and status against strict allowlists.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Request reaches `Deno.serve` (`admin-actions/index.ts:33`) | `getCorsHeaders(req)` checks `Origin` against `ALLOWED_ORIGINS` (or HTTPS/localhost fallback) |
| 2 | Missing or invalid `Authorization: Bearer` header checked (`admin-actions/index.ts:38-53`) | Returns `401 Unauthorized` immediately |
| 3 | Even with a valid non-admin JWT, `user_roles` query checks `role = 'admin'` (`admin-actions/index.ts:59-66`) | Non-admins receive `403 Forbidden` before reaching any moderation branch |
| 4 | Authorized admin calls `update_approval_status` (`admin-actions/index.ts:73-102`) | Validates table (`workers`/`shops`/`customers`) & status allowlist, updates record, and logs to `activity_logs` |

#### Conclusion
**Fix Verified** - Unauthenticated and non-admin callers are blocked at lines 40–66, and cross-origin access is governed by explicit origin headers instead of wildcard `*`.

---

### Malicious Photo URL Injection on Profile Save

#### Summary
| Field | Value |
|---|---|
| Issue Type | Unvalidated URL Scheme in Profile Form |
| Impact | Medium |
| Affected File | `src/components/ProfileActions.tsx:161` |
| Test Scenario | A worker or shop submits `javascript:alert(document.domain)` in the Profile Edit `Photo URL` field. |

#### How It Was Fixed
Added an explicit protocol prefix check (`/^https?:\/\//i`) in `ProfileActions.tsx` `save()` before sending the update payload to Supabase.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | User clicks Save in Edit Profile modal (`ProfileActions.tsx:303`) | Enters `save()` at `ProfileActions.tsx:96` |
| 2 | Reaches `photo_url` validation (`ProfileActions.tsx:161-169`) | `/^https?:\/\//i.test("javascript:alert(document.domain)")` evaluates to `false` |
| 3 | Returns `toast.error("Photo URL must start with http:// or https://")` | **Handled Safely** (database write never executes) |

#### Conclusion
**Fix Verified** - Only `http://` and `https://` URLs (or `null` when blank) are accepted by profile saves.

---

### Unsafe SVG File Upload Blocked on Shop Products

#### Summary
| Field | Value |
|---|---|
| Issue Type | Permissive Image Upload Allowlist Allowing Scriptable SVG Files |
| Impact | High |
| Affected File | `src/pages/s/products.tsx:64` |
| Test Scenario | A user selects a malicious `.svg` file (`type: "image/svg+xml"`) containing an embedded `<script>` tag in the Shop Products upload form. |

#### How It Was Fixed
Replaced the wildcard `file.type.startsWith("image/")` check and `<input accept="image/*">` with an explicit raster-only MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) in `src/pages/s/products.tsx`, and added the matching `allowed_mime_types` constraint to `supabase/PROPOSED_SECURITY_AND_RLS_MIGRATION.sql` (`storage.buckets` for `product-images`).

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | User selects a file in Shop Products (`src/pages/s/products.tsx:167`) | File picker filters to `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` |
| 2 | `onFile()` runs MIME validation (`src/pages/s/products.tsx:64-72`) | Checks `ALLOWED_IMAGE_TYPES.has(file.type)` |
| 3 | `"image/svg+xml"` is rejected before upload | Displays `toast.error("Only JPG, PNG, WebP, or GIF images are allowed")` and returns early (**Handled Safely**) |

#### Conclusion
**Fix Verified** - Scriptable SVG uploads are rejected client-side before touching Supabase Storage, with server-side bucket MIME enforcement prepared in the proposed SQL migration.
