import { formatInZone } from "@/lib/time";

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return formatInZone(value, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return formatInZone(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function daysRemaining(deadline: Date | string | null | undefined) {
  if (!deadline) return null;
  const date = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diff = date.getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function toIsoString(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function computeAge(birthDate: string | Date | null | undefined) {
  if (!birthDate) return null;
  const date = typeof birthDate === "string" ? new Date(`${birthDate}T00:00:00`) : birthDate;
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const birthdayPassed =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!birthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function addDays(from: Date, days: number) {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

export function videoEmbedHtml(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";

  const yt = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt?.[1]) {
    return `<iframe src="https://www.youtube.com/embed/${yt[1]}" title="Lesson video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo?.[1]) {
    return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="Lesson video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  const drive = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive?.[1]) {
    return `<iframe src="https://drive.google.com/file/d/${drive[1]}/preview" title="Google Drive media" allow="autoplay" allowfullscreen></iframe>`;
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) {
    return `<video controls src="${trimmed}"></video>`;
  }

  return `<iframe src="${trimmed}" title="Embedded media" allowfullscreen></iframe>`;
}
