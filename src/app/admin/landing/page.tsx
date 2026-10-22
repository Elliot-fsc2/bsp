import { db } from "@/db";
import { settings } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { LandingPageForm } from "@/components/admin/LandingPageForm";
import { requireAdminPage } from "@/lib/guards";
import { normalizeLandingContent } from "@/lib/landing";

export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const admin = await requireAdminPage();
  const academy = (await db.select().from(settings).limit(1))[0];
  const content = normalizeLandingContent(academy?.landingContent);

  return (
    <AppShell user={admin} nav={adminNav} title="Landing page">
      <div className="mx-auto max-w-4xl">
        <LandingPageForm content={content} />
      </div>
    </AppShell>
  );
}
