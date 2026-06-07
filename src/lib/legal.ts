export const TERMS_VERSION = "June 2026 v1.0";

/**
 * Returns the consent fields to merge into a registration insert.
 * Timestamps are intentionally omitted — Postgres column defaults (now()) generate them
 * server-side so we never rely on device clocks.
 */
export function consentInsertFields() {
  return {
    terms_accepted: true,
    terms_version: TERMS_VERSION,
    approval_status: "pending" as const,
  };
}
