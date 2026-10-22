import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowRight, BookOpen, Sparkles, Trophy } from "lucide-react";
import { db } from "@/db";
import { lessonProgress, lessons, levelProgress, levels } from "@/db/schema";
import { AppShell, studentNav } from "@/components/AppShell";
import { LessonCard, LevelCard } from "@/components/LearningCards";
import { requireUnpausedMember } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function StudentLevelsPage() {
  const user = await requireUnpausedMember();
  const program = await db.select().from(levels).orderBy(levels.number);
  const progressRows = await db.select().from(levelProgress).where(eq(levelProgress.userId, user.id));
  const progressByLevel = new Map(progressRows.map((row) => [row.levelId, row]));
  const completed = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, user.id));
  const completedIds = new Set(completed.map((row) => row.lessonId));
  const allLessons = await db.select().from(lessons).orderBy(lessons.sortOrder);
  const passedCount = progressRows.filter((row) => row.status === "passed").length;
  const current =
    program.find((level) => {
      const status = progressByLevel.get(level.id)?.status;
      return status === "unlocked" || status === "in_progress";
    }) ?? program.find((level) => progressByLevel.get(level.id)?.status === "passed");
  const currentLessons = current ? allLessons.filter((lesson) => lesson.levelId === current.id && lesson.isPublished) : [];

  return (
    <AppShell user={user} nav={studentNav} title="Levels & lessons">
      <div className="mx-auto max-w-7xl space-y-9">
        <section className="relative overflow-hidden rounded-[28px] bg-[#1B365F] p-7 text-white sm:p-9">
          <span className="pointer-events-none absolute -bottom-24 -right-8 h-72 w-72 rounded-full border-[38px] border-white/5" />
          <span className="pointer-events-none absolute right-16 top-0 h-36 w-36 rounded-full bg-[#FFCF00]/10 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.17em] text-[#FFCF00]">
                <Sparkles size={13} /> Your DeMolay pathway
              </span>
              <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">Every lesson takes you a step further.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                Study each level, review at your pace, then pass its general exam to unlock what comes next.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFCF00] text-[#1B365F]"><Trophy size={23} /></span>
              <div>
                <p className="font-serif text-2xl font-bold">{passedCount} <span className="text-base font-normal text-white/60">/ {program.length}</span></p>
                <p className="text-xs text-white/70">Levels complete</p>
              </div>
            </div>
          </div>
        </section>

        {user.accountStatus !== "active" ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#FFCF00]/50 bg-[#FFF7D1] p-5 text-sm text-[#705100]">
            <p>Your learning levels open after your registration payment is verified by the council.</p>
            <Link href="/dashboard/payment" className="btn btn-gold py-2.5 text-xs">View payment status <ArrowRight size={15} /></Link>
          </div>
        ) : null}

        <section>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.19em] text-[#0076AF]">Your progression</p>
              <h2 className="mt-1 font-serif text-[28px] text-[#1B365F]">The five levels</h2>
            </div>
            <span className="hidden text-sm text-[#64758A] sm:block">Complete one to unlock the next</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {program.map((level) => {
              const progress = progressByLevel.get(level.id);
              const publishedLessons = allLessons.filter((lesson) => lesson.levelId === level.id && lesson.isPublished);
              return (
                <LevelCard
                  key={level.id}
                  level={level}
                  status={progress?.status ?? "locked"}
                  lessonCount={publishedLessons.length}
                  completedCount={publishedLessons.filter((lesson) => completedIds.has(lesson.id)).length}
                  examDeadline={progress?.examDeadline}
                  locked={!progress || progress.status === "locked" || user.accountStatus !== "active"}
                />
              );
            })}
          </div>
        </section>

        {current && user.accountStatus === "active" ? (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.19em] text-[#0076AF]">Continue learning</p>
                <h2 className="mt-1 font-serif text-[28px] text-[#1B365F]">Level {current.number} · {current.name}</h2>
                <p className="mt-1 text-sm text-[#64758A]">Pick up where you left off, or revisit anything you have learned.</p>
              </div>
              <Link href={`/dashboard/levels/${current.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#1E4488] hover:text-[#0076AF]">
                View the whole level <ArrowRight size={17} />
              </Link>
            </div>
            {currentLessons.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {currentLessons.slice(0, 3).map((lesson, index) => (
                  <LessonCard key={lesson.id} lesson={lesson} levelNumber={current.number} order={index + 1} completed={completedIds.has(lesson.id)} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 text-sm text-[#64758A]"><BookOpen size={21} className="mb-2 text-[#0076AF]" /> Lessons are being prepared by the council.</div>
            )}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
