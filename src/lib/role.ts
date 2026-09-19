export type Role = "customer" | "worker" | "shop";

const ROLE_KEY = "necto_role";
const ID_KEY = "necto_user_id";
const PHONE_KEY = "necto_user_phone";
const PINCODE_KEY = "necto_user_pincode";
const AREA_KEY = "necto_user_area";

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
export function getUserPincode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PINCODE_KEY);
}
export function setUserPincode(pincode: string) {
  localStorage.setItem(PINCODE_KEY, pincode);
}
export function getUserArea(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AREA_KEY);
}
export function setUserArea(area: string) {
  localStorage.setItem(AREA_KEY, area);
}
export function clearAccount() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(ID_KEY);
  localStorage.removeItem(PHONE_KEY);
  localStorage.removeItem(PINCODE_KEY);
  localStorage.removeItem(AREA_KEY);
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
