import type { User } from "@supabase/supabase-js";

const configuredFounderEmails = (import.meta.env.VITE_FOUNDER_EMAILS ?? "")
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

export function isFounderUser(user: User | null | undefined) {
  const email = user?.email?.toLowerCase();
  return Boolean(email && configuredFounderEmails.includes(email));
}

export function hasFounderAccessConfigured() {
  return configuredFounderEmails.length > 0;
}

export function maskEmail(email?: string | null) {
  if (!email) return "not configured";
  const [name, domain] = email.split("@");
  if (!domain) return "configured";
  return `${name.slice(0, 2)}***@${domain}`;
}
