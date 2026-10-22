import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fredoka, Nunito } from "next/font/google";
import { ensureSeeded } from "@/db/seed";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700", "800"],
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { default: settings.siteName, template: `%s · ${settings.siteName}` },
    description: settings.tagline,
    icons: { icon: settings.faviconUrl || "/images/logo.svg" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const settings = await getSettings();

  return (
    <html lang="en" data-theme={settings.theme} className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
