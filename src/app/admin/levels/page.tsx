import { BookOpen, Layers3 } from "lucide-react";
import { db } from "@/db";
import { lessons, levels } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { LevelEditor } from "@/components/admin/LevelEditor";
import { requireAdminPage } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function AdminLevelsPage() {
  const admin = await requireAdminPage();
  const program = await db.select().from(levels).orderBy(levels.number);
  const content = await db.select({ levelId: lessons.levelId }).from(lessons);

  return (
    <AppShell user={admin} nav={adminNav} title="Manage levels">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] bg-[#1B365F] p-6 text-white sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFCF00]">The learning journey</p>
            <h2 className="mt-2 font-serif text-3xl">Five levels. One step at a time.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
              Set each level’s study window, exam window, and passing requirement. The next level opens only after a passing exam result.
            </p>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FFCF00] text-[#1B365F]"><Layers3 size={27} /></span>
        </section>
        <div className="flex items-center gap-2 text-sm text-[#64758A]"><BookOpen size={16} className="text-[#0076AF]" /> Edit a card and save it individually.</div>
        <div className="grid items-stretch gap-5 xl:grid-cols-2">
          {program.map((level) => (
            <LevelEditor key={level.id} level={level} lessonCount={content.filter((item) => item.levelId === level.id).length} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
