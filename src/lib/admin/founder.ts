import type { User } from "@supabase/supabase-js";

const primaryFounderEmails = ["niharmohanta14@gmail.com"];
const configuredFounderEmails = (import.meta.env.VITE_FOUNDER_EMAILS ?? "")
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

const founderEmails = Array.from(new Set([...primaryFounderEmails, ...configuredFounderEmails]));

export function isFounderUser(user: User | null | undefined) {
  const email = user?.email?.toLowerCase();
  return Boolean(email && founderEmails.includes(email));
}

export function hasFounderAccessConfigured() {
  return founderEmails.length > 0;
}

export function maskEmail(email?: string | null) {
  if (!email) return "not configured";
  const [name, domain] = email.split("@");
  if (!domain) return "configured";
  return `${name.slice(0, 2)}***@${domain}`;
}
