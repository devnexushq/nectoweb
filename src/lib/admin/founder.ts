import type { User } from "@supabase/supabase-js";

const FOUNDER_EMAIL = "niharmohanta14@gmail.com";

export function isFounderUser(user: User | null | undefined) {
  const email = user?.email?.toLowerCase();
  return email === FOUNDER_EMAIL;
}

export function hasFounderAccessConfigured() {
  return true;
}

export function maskEmail(email?: string | null) {
  if (!email) return "not configured";
  const [name, domain] = email.split("@");
  if (!domain) return "configured";
  return `${name.slice(0, 2)}***@${domain}`;
}
