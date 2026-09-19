export type Role = "customer" | "worker" | "shop";

const ROLE_KEY = "necto_role";
const ID_KEY = "necto_user_id";
const PHONE_KEY = "necto_user_phone";

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(ROLE_KEY) as Role | null) ?? null;
}
export function setRole(role: Role) {
  localStorage.setItem(ROLE_KEY, role);
}
export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ID_KEY);
}
export function setUserId(id: string) {
  localStorage.setItem(ID_KEY, id);
}
export function getUserPhone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PHONE_KEY);
}
export function setUserPhone(phone: string) {
  localStorage.setItem(PHONE_KEY, phone);
}
export function clearAccount() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(ID_KEY);
  localStorage.removeItem(PHONE_KEY);
}

export function homePathFor(role: Role): string {
  if (role === "customer") return "/c/home";
  if (role === "worker") return "/w/dashboard";
  return "/s/dashboard";
}
export function registerPathFor(role: Role): string {
  if (role === "customer") return "/c/register";
  if (role === "worker") return "/w/register";
  return "/s/register";
}
