import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Outfit } from "next/font/google";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { getTimeZone, isValidTimeZone, setServerTimeZone } from "@/lib/time";
import "./globals.css";

export const dynamic = "force-dynamic";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export async function generateMetadata(): Promise<Metadata> {
  await ensureSeed();
  const site = (await db.select().from(settings).limit(1))[0];
  setServerTimeZone(site?.timeZone ?? "UTC");
  const iconVersion = site?.faviconFilename ?? "default";
  const iconUrl = `/api/branding/icon?v=${encodeURIComponent(iconVersion)}`;
  return {
    title: site?.academyName ?? "DeMolay Nexus",
    description:
      site?.tagline ||
      "A five-level DeMolay leadership LMS with lessons, exams, and offline registration.",
    icons: { icon: iconUrl, shortcut: iconUrl, apple: iconUrl },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const zone = getTimeZone();
  const safeZone = isValidTimeZone(zone) ? zone : "UTC";
  setServerTimeZone(safeZone);
  return (
    <html lang="en" data-demolay-tz={safeZone}>
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
