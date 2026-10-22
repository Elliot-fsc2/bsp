import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import type { SiteSettings } from "./types";
import { isThemeId } from "./utils";

export const defaultSettings: SiteSettings = {
  siteName: "Boy Scouts of the Philippines",
  tagline: "Laging Handa — Always Prepared",
  theme: "forest",
  allowRegistration: true,
  welcomeMessage:
    "Welcome to the Boy Scouts of the Philippines eLearning Portal — a home on the trail for Scouts, Scout Leaders, and Council Admins. Learn the Scout Oath and Law, earn your badges, and always be prepared.",
  maintenanceMode: false,
  supportEmail: "support@bsp.org.ph",
  mascotName: "Handa",
  logoUrl: "",
  faviconUrl: "/images/logo.svg",
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await db.select().from(siteSettings);
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const theme = map.theme && isThemeId(map.theme) ? map.theme : defaultSettings.theme;
    return {
      siteName: map.siteName || defaultSettings.siteName,
      tagline: map.tagline || defaultSettings.tagline,
      theme,
      allowRegistration: (map.allowRegistration ?? "true") === "true",
      welcomeMessage: map.welcomeMessage || defaultSettings.welcomeMessage,
      maintenanceMode: map.maintenanceMode === "true",
      supportEmail: map.supportEmail || defaultSettings.supportEmail,
      mascotName: map.mascotName || defaultSettings.mascotName,
      logoUrl: map.logoUrl || defaultSettings.logoUrl,
      faviconUrl: map.faviconUrl || defaultSettings.faviconUrl,
    };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(next: Partial<SiteSettings>) {
  const current = await getSettings();
  const merged: SiteSettings = { ...current, ...next };
  const entries: [string, string][] = [
    ["siteName", merged.siteName],
    ["tagline", merged.tagline],
    ["theme", merged.theme],
    ["allowRegistration", String(merged.allowRegistration)],
    ["welcomeMessage", merged.welcomeMessage],
    ["maintenanceMode", String(merged.maintenanceMode)],
    ["supportEmail", merged.supportEmail],
    ["mascotName", merged.mascotName],
    ["logoUrl", merged.logoUrl],
    ["faviconUrl", merged.faviconUrl],
  ];
  for (const [key, value] of entries) {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing[0]) {
      await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value });
    }
  }
  return merged;
}
