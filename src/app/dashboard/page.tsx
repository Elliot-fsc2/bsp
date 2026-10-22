import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, exams, lessonProgress, lessons, levelProgress, levels, settings } from "@/db/schema";
import { AppShell, studentNav } from "@/components/AppShell";
import { Megaphone } from "lucide-react";
import { StatusChip } from "@/components/StatusChip";
import { requireUnpausedMember } from "@/lib/guards";
import { daysRemaining, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await requireUnpausedMember();
  const academy = (await db.select().from(settings).limit(1))[0];
  const announcement = academy?.announcement?.trim() ?? "";
  const progressRows = await db
    .select({ progress: levelProgress, level: levels })
    .from(levelProgress)
    .innerJoin(levels, eq(levelProgress.levelId, levels.id))
    .where(eq(levelProgress.userId, user.id))
    .orderBy(levels.number);

  const current =
    progressRows.find((row) => row.progress.status === "unlocked" || row.progress.status === "in_progress") ??
    progressRows.find((row) => row.progress.status !== "passed") ??
    progressRows[progressRows.length - 1];

  const passedCount = progressRows.filter((row) => row.progress.status === "passed").length;
  const lessonCount = current
    ? await db.select().from(lessons).where(eq(lessons.levelId, current.level.id))
    : [];
  const completed = current
    ? await db
        .select()
        .from(lessonProgress)
        .where(eq(lessonProgress.userId, user.id))
    : [];
  const completedIds = new Set(completed.map((row) => row.lessonId));
  const doneLessons = lessonCount.filter((lesson) => completedIds.has(lesson.id)).length;
  const exam = current
    ? (await db.select().from(exams).where(eq(exams.levelId, current.level.id)).limit(1))[0]
    : null;
  const attempts = exam
    ? await db
        .select()
        .from(examAttempts)
        .where(and(eq(examAttempts.userId, user.id), eq(examAttempts.examId, exam.id)))
        .orderBy(desc(examAttempts.startedAt))
    : [];

  return (
    <AppShell user={user} nav={studentNav} title="Overview">
      {announcement ? (
        <section className="mb-6 flex items-start gap-3 overflow-hidden rounded-[26px] border border-[#FFCF00]/60 bg-gradient-to-r from-[#FFFBEB] to-[#FFF6D6] p-5 shadow-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#FFCF00] text-[#1B365F]">
            <Megaphone size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E4488]">Announcement from the council</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#1B365F]">{announcement}</p>
          </div>
        </section>
      ) : null}
      {user.accountStatus !== "active" ? (
        <section className="rounded-[28px] bg-white p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#718096]">Registration</p>
          <h2 className="mt-2 font-serif text-3xl">Your climb has not opened yet</h2>
          <p className="mt-3 max-w-2xl text-[#52657A]">
            {user.accountStatus === "pending_payment"
              ? "Submit the registration fee receipt so the academy can verify payment."
              : user.accountStatus === "pending_verification"
                ? "Your receipt is with the registrar. Level 1 unlocks after verification."
                : "This account is not active. Contact your DeMolay leadership council if you believe this is a mistake."}
          </p>
          <Link href="/dashboard/payment" className="btn btn-gold mt-6">
            Open payment desk
          </Link>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[28px] bg-white p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[#718096]">Current standing</p>
            <h2 className="mt-2 font-serif text-4xl">
              {current ? `Level ${current.level.number}: ${current.level.name}` : "Pathway complete"}
            </h2>
            {current ? (
              <>
                <p className="mt-3 max-w-2xl text-[#52657A]">{current.level.description}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <StatusChip status={current.progress.status} />
                  <span className="chip bg-black/5">
                    Study by {formatDate(current.progress.studyDeadline)}
                  </span>
                  <span className="chip bg-black/5">
                    Exam by {formatDate(current.progress.examDeadline)}
                  </span>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Lessons reviewed", `${doneLessons}/${lessonCount.length}`],
                    ["Days left to exam", String(daysRemaining(current.progress.examDeadline) ?? "—")],
                    ["Attempts used", `${current.progress.attemptsUsed}${exam ? ` / ${exam.maxAttempts}` : ""}`],
                  ].map(([label, value]) => (
                    <article key={label} className="rounded-2xl bg-[#F7F9FD] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#718096]">{label}</p>
                      <p className="mt-2 font-serif text-3xl">{value}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/dashboard/levels" className="btn btn-dark">
                    Continue lessons
                  </Link>
                  <Link href="/dashboard/exams" className="btn btn-gold">
                    General exam
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-4">You have passed every level. The pathway is complete.</p>
            )}
          </section>
          <aside className="space-y-4">
            <article className="rounded-[28px] bg-[#1B365F] p-6 text-[#F7F9FD]">
              <p className="text-xs uppercase tracking-[0.2em] text-[#FFCF00]">Progress</p>
              <p className="mt-3 font-serif text-4xl">{passedCount} / 5</p>
              <p className="mt-2 text-sm text-[#F7F9FD]/70">levels passed</p>
              <ol className="mt-6 space-y-2">
                {progressRows.map((row) => (
                  <li key={row.level.id} className="flex items-center justify-between text-sm">
                    <span>
                      {row.level.number}. {row.level.name}
                    </span>
                    <StatusChip status={row.progress.status} />
                  </li>
                ))}
              </ol>
            </article>
            <article className="rounded-[28px] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#718096]">Recent sittings</p>
              <ul className="mt-4 space-y-3 text-sm">
                {attempts.slice(0, 4).map((attempt) => (
                  <li key={attempt.id} className="flex items-center justify-between">
                    <span>{formatDate(attempt.startedAt)}</span>
                    <span>
                      {attempt.scorePercent ?? "—"}% · <StatusChip status={attempt.status} />
                    </span>
                  </li>
                ))}
                {!attempts.length ? <li className="text-[#718096]">No exam attempts yet.</li> : null}
              </ul>
            </article>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
