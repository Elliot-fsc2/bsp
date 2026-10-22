import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, exams, levelProgress, levels } from "@/db/schema";
import { AppShell, studentNav } from "@/components/AppShell";
import { StatusChip } from "@/components/StatusChip";
import { studentPaymentState } from "@/lib/fees";
import { requireUnpausedMember } from "@/lib/guards";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentExamsPage() {
  const user = await requireUnpausedMember();
  const rows = await db
    .select({ exam: exams, level: levels })
    .from(exams)
    .innerJoin(levels, eq(exams.levelId, levels.id))
    .orderBy(levels.number);
  const progressRows = await db
    .select()
    .from(levelProgress)
    .where(eq(levelProgress.userId, user.id));
  const progressByLevel = new Map(progressRows.map((row) => [row.levelId, row]));
  const paymentState = await studentPaymentState(user.id);
  const retakeBlocked = paymentState.reason === "retake" || paymentState.reason === "reinstatement";
  const attempts = await db
    .select()
    .from(examAttempts)
    .where(eq(examAttempts.userId, user.id))
    .orderBy(desc(examAttempts.startedAt));

  return (
    <AppShell user={user} nav={studentNav} title="General exams">
      <div className="grid gap-4">
        {rows.map(({ exam, level }) => {
          const progress = progressByLevel.get(exam.levelId);
          const locked = user.accountStatus !== "active" || !progress || progress.status === "locked";
          const passed = progress?.status === "passed";
          const remaining = exam.maxAttempts - (progress?.attemptsUsed ?? 0);
          const canTake = !locked && !passed && remaining > 0 && !retakeBlocked;
          return (
            <article key={exam.id} className="rounded-[28px] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#718096]">
                    Level {level.number} · {level.name}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl">{exam.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64758A]">{exam.description}</p>
                </div>
                <StatusChip status={progress?.status ?? "locked"} />
              </div>
              <p className="mt-4 text-sm text-[#718096]">
                {exam.questionCount} questions · {exam.timeLimitMinutes} minutes · {exam.maxAttempts} attempts ·
                pass {exam.passingScore}% · shuffle {exam.shuffleQuestions ? "on" : "off"}
              </p>
              <p className="mt-2 text-sm text-[#718096]">
                Window {formatDate(progress?.studyDeadline)} study / {formatDate(progress?.examDeadline)} exam
                · remaining attempts {Math.max(remaining, 0)}
              </p>
              <div className="mt-5">
                {canTake ? (
                  <Link href={`/dashboard/exams/${exam.id}`} className="btn btn-gold">
                    {progress?.status === "in_progress" ? "Resume exam" : "Start exam"}
                  </Link>
                ) : passed ? (
                  <p className="text-sm text-[#0076AF]">Passed. You may review lessons but not retake this exam.</p>
                ) : locked ? (
                  <p className="text-sm text-[#708099]">Pass the previous level to unlock this sitting.</p>
                ) : retakeBlocked ? (
                  <div className="rounded-2xl bg-[#FFF7D1] p-4 text-sm text-[#705100]">
                    Your first attempt is included with registration. Settle the{" "}
                    {paymentState.label.toLowerCase()} to unlock another attempt.
                    <Link href="/dashboard/payment" className="btn btn-dark ml-3 inline-flex py-2 text-xs">
                      Payment desk
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-[#708099]">No attempts remaining or window closed.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-8 rounded-[28px] bg-white p-6">
        <h3 className="font-serif text-2xl">Attempt history</h3>
        <div className="table-wrap mt-4">
          <table className="data">
            <thead>
              <tr>
                <th>Started</th>
                <th>Status</th>
                <th>Score</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{formatDateTime(attempt.startedAt)}</td>
                  <td>
                    <StatusChip status={attempt.status} />
                  </td>
                  <td>{attempt.scorePercent ?? "—"}%</td>
                  <td>{formatDateTime(attempt.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!attempts.length ? <p className="mt-4 text-sm text-[#718096]">No sittings yet.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}
