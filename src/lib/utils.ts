import type { Role, ThemeId } from "./types";

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || `item-${Date.now()}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function greetingForNow(name: string) {
  const hour = new Date().getHours();
  const first = name.split(" ")[0] ?? name;
  if (hour < 12) return `Good morning, ${first}!`;
  if (hour < 17) return `Good afternoon, ${first}!`;
  return `Good evening, ${first}!`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "No date";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatDate(date);
}

export function roleLabel(role: Role | string) {
  if (role === "admin") return "Council Admin";
  if (role === "teacher") return "Scout Leader";
  return "Scout";
}

export function isThemeId(value: string): value is ThemeId {
  return value === "bloom" || value === "ocean" || value === "sunset" || value === "forest";
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function dueSoon(value: Date | string | null | undefined) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  const diff = date.getTime() - Date.now();
  return diff > 0 && diff < 1000 * 60 * 60 * 72;
}

export function isOverdue(value: Date | string | null | undefined) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime() < Date.now();
}
