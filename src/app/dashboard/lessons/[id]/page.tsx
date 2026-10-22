import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CirclePlay, Clock3, ListChecks } from "lucide-react";
import { db } from "@/db";
import { lessonProgress, lessons, levelProgress, levels } from "@/db/schema";
import { AppShell, studentNav } from "@/components/AppShell";
import { MarkCompleteButton } from "@/components/MarkCompleteButton";
import { requireUnpausedMember } from "@/lib/guards";
import { videoEmbedHtml } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUnpausedMember();
  const { id } = await params;
  const lesson = (await db.select().from(lessons).where(eq(lessons.id, Number(id))).limit(1))[0];
  if (!lesson || !lesson.isPublished) notFound();

  const level = (await db.select().from(levels).where(eq(levels.id, lesson.levelId)).limit(1))[0];
  if (!level) notFound();
  const progress = (
    await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, user.id), eq(levelProgress.levelId, lesson.levelId)))
      .limit(1)
  )[0];
  if (user.accountStatus !== "active" || !progress || progress.status === "locked") redirect("/dashboard/levels");

  const levelLessons = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.levelId, level.id), eq(lessons.isPublished, true)))
    .orderBy(lessons.sortOrder);
  const completed = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id));
  const completedIds = new Set(completed.map((item) => item.lessonId));
  const position = levelLessons.findIndex((item) => item.id === lesson.id);
  const nextLesson = levelLessons[position + 1];

  return (
    <AppShell user={user} nav={studentNav} title={lesson.title}>
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href={`/dashboard/levels/${level.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E4488] hover:text-[#0076AF]">
          <ArrowLeft size={16} /> Back to Level {level.number}
        </Link>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_265px]">
          <main className="min-w-0 space-y-5">
            <div className="relative overflow-hidden rounded-[26px] bg-[#1B365F] p-7 text-white">
              <span className="pointer-events-none absolute -bottom-16 right-0 h-44 w-44 rounded-full border-[26px] border-white/10" />
              <div className="relative">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#FFCF00]">
                  <BookOpen size={15} /> Level {level.number} · Lesson {String(position + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{lesson.title}</h2>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/75">
                  <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> Learn at your pace</span>
                  {lesson.videoUrl || lesson.embedCode ? <span className="inline-flex items-center gap-1.5"><CirclePlay size={14} /> Includes media</span> : null}
                  {completedIds.has(lesson.id) ? <span className="inline-flex items-center gap-1.5 text-[#FFCF00]"><CheckCircle2 size={14} /> Reviewed</span> : null}
                </div>
              </div>
            </div>
            <article className="rounded-[26px] border border-[#dce5f1] bg-white p-6 shadow-sm sm:p-8">
              <div className="lesson-content" dangerouslySetInnerHTML={{ __html: lesson.content }} />
              {lesson.videoUrl ? (
                <div className="embed-frame mt-8" dangerouslySetInnerHTML={{ __html: videoEmbedHtml(lesson.videoUrl) }} />
              ) : null}
              {lesson.embedCode ? (
                <div className="embed-frame mt-8" dangerouslySetInnerHTML={{ __html: lesson.embedCode }} />
              ) : null}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3eaf4] pt-6">
                <MarkCompleteButton lessonId={lesson.id} completed={completedIds.has(lesson.id)} />
                {nextLesson ? (
                  <Link href={`/dashboard/lessons/${nextLesson.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#1E4488] hover:text-[#0076AF]">
                    Next lesson <ArrowRight size={17} />
                  </Link>
                ) : (
                  <Link href={`/dashboard/levels/${level.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#1E4488] hover:text-[#0076AF]">
                    Back to this level <ArrowRight size={17} />
                  </Link>
                )}
              </div>
            </article>
          </main>
          <aside className="h-fit rounded-[24px] border border-[#dce5f1] bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0076AF]"><ListChecks size={15} /> Course outline</p>
            <h3 className="mt-2 font-serif text-xl text-[#1B365F]">{level.name}</h3>
            <p className="mt-1 text-xs text-[#64758A]">{levelLessons.filter((item) => completedIds.has(item.id)).length} of {levelLessons.length} lessons reviewed</p>
            <div className="mt-5 space-y-2">
              {levelLessons.map((item, index) => (
                <Link key={item.id} href={`/dashboard/lessons/${item.id}`} className={`flex items-start gap-3 rounded-xl p-3 text-sm transition ${item.id === lesson.id ? "bg-[#EAF1F9] text-[#1E4488]" : "text-[#52657A] hover:bg-[#F5F7FB]"}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${completedIds.has(item.id) ? "bg-[#E9F5EA] text-[#00694B]" : item.id === lesson.id ? "bg-[#1E4488] text-white" : "bg-[#F2F6FB] text-[#64758A]"}`}>
                    {completedIds.has(item.id) ? <CheckCircle2 size={14} /> : index + 1}
                  </span>
                  <span className="leading-5">{item.title}</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
