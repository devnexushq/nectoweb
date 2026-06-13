import type { User } from "@supabase/supabase-js";

export const FOUNDER_EMAIL = "nexivon.official@gmail.com";

export function isFounderUser(user: User | null | undefined) {
  return user?.email?.toLowerCase() === FOUNDER_EMAIL;
}

export function maskEmail(email?: string | null) {
  if (!email) return "not configured";
  const [name, domain] = email.split("@");
  if (!domain) return "configured";
  return `${name.slice(0, 2)}***@${domain}`;
}
