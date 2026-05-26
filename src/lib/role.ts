export type Role = "customer" | "worker" | "shop";

const ROLE_KEY = "necto_role";
const ID_KEY = "necto_user_id";

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
