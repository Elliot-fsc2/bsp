import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, ArrowRight, Award, BookOpen, CalendarDays, CircleCheck, Clock3 } from "lucide-react";
import { db } from "@/db";
import { exams, lessonProgress, lessons, levelProgress, levels } from "@/db/schema";
import { AppShell, studentNav } from "@/components/AppShell";
import { LessonCard } from "@/components/LearningCards";
import { requireUnpausedMember } from "@/lib/guards";
import { daysRemaining, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LevelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUnpausedMember();
  const { id } = await params;
  const level = (await db.select().from(levels).where(eq(levels.id, Number(id))).limit(1))[0];
  if (!level) notFound();

  const progress = (
    await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, user.id), eq(levelProgress.levelId, level.id)))
      .limit(1)
  )[0];
  if (user.accountStatus !== "active" || !progress || progress.status === "locked") redirect("/dashboard/levels");

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.levelId, level.id), eq(lessons.isPublished, true)))
    .orderBy(lessons.sortOrder);
  const completed = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id));
  const completedIds = new Set(completed.map((row) => row.lessonId));
  const completedCount = courseLessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const exam = (await db.select().from(exams).where(eq(exams.levelId, level.id)).limit(1))[0];
  const percent = courseLessons.length ? Math.round((completedCount / courseLessons.length) * 100) : 0;
  const remaining = daysRemaining(progress.examDeadline);

  return (
    <AppShell user={user} nav={studentNav} title={level.name}>
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href="/dashboard/levels" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E4488] hover:text-[#0076AF]">
          <ArrowLeft size={16} /> All levels
        </Link>

        <section className="relative overflow-hidden rounded-[28px] bg-[#1B365F] p-7 text-white sm:p-9">
          <span className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#FFCF00]">
              Level {String(level.number).padStart(2, "0")} of 05
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-tight">{level.name}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">{level.description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/90">
              <span className="inline-flex items-center gap-2"><BookOpen size={17} className="text-[#FFCF00]" /> {courseLessons.length} lessons</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={17} className="text-[#FFCF00]" /> {level.studyDays} study days</span>
              <span className="inline-flex items-center gap-2"><Award size={17} className="text-[#FFCF00]" /> {level.requiredScore}% to pass</span>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
          <section>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0076AF]">Lesson library</p>
              <h3 className="mt-1 font-serif text-[27px] text-[#1B365F]">Learn at your own pace</h3>
              <p className="mt-1 text-sm text-[#64758A]">Open a card to read, watch, or review the lesson.</p>
            </div>
            {courseLessons.length ? (
              <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {courseLessons.map((lesson, index) => (
                  <LessonCard key={lesson.id} lesson={lesson} levelNumber={level.number} order={index + 1} completed={completedIds.has(lesson.id)} />
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] bg-white p-8 text-sm text-[#64758A]">No lessons have been published for this level yet.</div>
            )}
          </section>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
            <article className="rounded-[24px] bg-white p-5 shadow-sm">
              <h4 className="font-serif text-xl text-[#1B365F]">Your progress</h4>
              <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[#1B365F]">
                <span>Lessons reviewed</span><span>{completedCount} / {courseLessons.length}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E9EEF5]">
                <div className="h-full rounded-full bg-[#FFCF00]" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-[#64758A]">Review lessons again whenever you need a refresher.</p>
              <div className="mt-5 space-y-2 border-t border-[#E8EEF5] pt-4 text-sm text-[#52657A]">
                <p className="flex items-center gap-2"><CalendarDays size={15} className="text-[#0076AF]" /> Study by {formatDate(progress.studyDeadline)}</p>
                <p className="flex items-center gap-2"><CalendarDays size={15} className="text-[#0076AF]" /> Exam by {formatDate(progress.examDeadline)}</p>
                {remaining !== null && remaining >= 0 ? <p className="font-semibold text-[#1E4488]">{remaining} day{remaining === 1 ? "" : "s"} left in this window</p> : null}
              </div>
            </article>

            <article className="rounded-[24px] bg-[#1B365F] p-5 text-white shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFCF00] text-[#1B365F]"><Award size={23} /></span>
              <h4 className="mt-4 font-serif text-2xl">General exam</h4>
              <p className="mt-2 text-sm leading-6 text-white/75">
                When you are ready, sit the Level {level.number} exam. A score of {exam?.passingScore ?? level.requiredScore}% unlocks the next level.
              </p>
              <p className="mt-3 text-xs text-white/70">
                {exam ? `${exam.timeLimitMinutes} min · ${exam.maxAttempts} attempts allowed` : "Your council is preparing this exam."}
              </p>
              {progress.status === "passed" ? (
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#FFCF00]"><CircleCheck size={18} /> Level passed · {progress.bestScore ?? "—"}%</span>
              ) : exam ? (
                <Link href={`/dashboard/exams/${exam.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFCF00] px-4 py-3 text-sm font-bold text-[#1B365F] transition hover:bg-[#EAAB00]">
                  Go to exam <ArrowRight size={16} />
                </Link>
              ) : null}
            </article>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
