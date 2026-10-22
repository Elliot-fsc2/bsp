import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, levels } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { LessonForm } from "@/components/admin/LessonForm";
import { requireAdminPage } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const lesson = (await db.select().from(lessons).where(eq(lessons.id, Number(id))).limit(1))[0];
  if (!lesson) notFound();
  const program = await db.select().from(levels).orderBy(levels.number);
  return (
    <AppShell user={admin} nav={adminNav} title="Edit lesson">
      <div className="rounded-[28px] bg-white p-6">
        <LessonForm levels={program} lesson={lesson} />
      </div>
    </AppShell>
  );
}
