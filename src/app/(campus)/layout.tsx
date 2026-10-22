import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CampusLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const settings = await getSettings();
  const notices = await getNotifications(user.id);
  const jar = await cookies();
  const defaultCollapsed = jar.get("bsp_nav")?.value === "collapsed";

  return (
    <AppShell user={user} settings={settings} notices={notices} defaultCollapsed={defaultCollapsed}>
      {children}
    </AppShell>
  );
}
