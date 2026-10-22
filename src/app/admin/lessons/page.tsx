import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowRight, BookOpen, CirclePlus, FilePenLine, LibraryBig, Plus, Video } from "lucide-react";
import { db } from "@/db";
import { lessons, levels } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { LessonCard } from "@/components/LearningCards";
import { LessonDeleteButton } from "@/components/admin/LessonDeleteButton";
import { requireAdminPage } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function AdminLessonsPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const admin = await requireAdminPage();
  const { level: selectedLevel } = await searchParams;
  const program = await db.select().from(levels).orderBy(levels.number);
  const rows = await db
    .select({ lesson: lessons, level: levels })
    .from(lessons)
    .innerJoin(levels, eq(lessons.levelId, levels.id))
    .orderBy(levels.number, lessons.sortOrder);
  const levelFilter = Number(selectedLevel);
  const filtered = program.some((level) => level.number === levelFilter)
    ? rows.filter((row) => row.level.number === levelFilter)
    : rows;
  const mediaCount = rows.filter(({ lesson }) => lesson.videoUrl || lesson.embedCode).length;

  return (
    <AppShell user={admin} nav={adminNav} title="Lesson library">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[26px] bg-[#1B365F] p-7 text-white">
          <span className="pointer-events-none absolute -bottom-16 right-6 h-48 w-48 rounded-full border-[28px] border-white/10" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFCF00]">Curriculum studio</p>
              <h2 className="mt-2 font-serif text-3xl">Teach what leadership looks like.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                Build rich lessons with text, video, Google Drive material, and HTML embeds. Keep every level moving forward.
              </p>
            </div>
            <Link href="/admin/lessons/new" className="btn btn-gold text-sm"><Plus size={17} /> Create lesson</Link>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: "Total lessons", value: rows.length },
            { icon: LibraryBig, label: "Published", value: rows.filter(({ lesson }) => lesson.isPublished).length },
            { icon: Video, label: "With media", value: mediaCount },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-[#dce5f1] bg-white p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F4FA] text-[#0076AF]"><Icon size={19} /></span>
                <div><p className="font-serif text-2xl font-bold text-[#1B365F]">{stat.value}</p><p className="text-xs text-[#64758A]">{stat.label}</p></div>
              </div>
            );
          })}
        </div>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0076AF]">Browse content</p>
              <h2 className="mt-1 font-serif text-[27px] text-[#1B365F]">All lessons</h2>
            </div>
            <span className="text-sm text-[#64758A]">Showing {filtered.length} of {rows.length}</span>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href="/admin/lessons" className={`rounded-full px-4 py-2 text-xs font-bold transition ${!Number.isInteger(levelFilter) || !program.some((level) => level.number === levelFilter) ? "bg-[#1E4488] text-white" : "border border-[#dce5f1] bg-white text-[#52657A] hover:border-[#1E4488]"}`}>
              All levels
            </Link>
            {program.map((level) => (
              <Link key={level.id} href={`/admin/lessons?level=${level.number}`} className={`rounded-full px-4 py-2 text-xs font-bold transition ${level.number === levelFilter ? "bg-[#1E4488] text-white" : "border border-[#dce5f1] bg-white text-[#52657A] hover:border-[#1E4488]"}`}>
                Level {level.number}
              </Link>
            ))}
          </div>
          {filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map(({ lesson, level }, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  levelNumber={level.number}
                  order={lesson.sortOrder || index + 1}
                  admin
                  actions={
                    <div className="flex w-full items-center justify-between gap-2">
                      <Link href={`/admin/lessons/${lesson.id}`} className="inline-flex items-center gap-1.5 font-bold text-[#1E4488] transition hover:text-[#0076AF]"><FilePenLine size={16} /> Edit lesson <ArrowRight size={15} /></Link>
                      <LessonDeleteButton id={lesson.id} />
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-[24px] bg-white p-10 text-center">
              <CirclePlus size={34} className="text-[#0076AF]" />
              <h3 className="mt-3 font-serif text-xl text-[#1B365F]">No lessons in this level yet</h3>
              <p className="mt-1 text-sm text-[#64758A]">Your next great learning card starts with a lesson.</p>
              <Link href="/admin/lessons/new" className="btn btn-dark mt-5 text-sm">Create the first lesson</Link>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
