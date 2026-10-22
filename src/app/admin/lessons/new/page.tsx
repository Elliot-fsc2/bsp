import { db } from "@/db";
import { levels } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { LessonForm } from "@/components/admin/LessonForm";
import { requireAdminPage } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  const admin = await requireAdminPage();
  const program = await db.select().from(levels).orderBy(levels.number);
  return (
    <AppShell user={admin} nav={adminNav} title="New lesson">
      <div className="rounded-[28px] bg-white p-6">
        <LessonForm levels={program} />
      </div>
    </AppShell>
  );
}
