import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, exams, levelProgress, levels, payments, settings, users } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { FacebookButton, isFacebookUrl } from "@/components/FacebookButton";
import { MapViewButton } from "@/components/MapViewButton";
import { EssayGrader } from "@/components/admin/EssayGrader";
import { ProgressActions } from "@/components/admin/ProgressActions";
import { ReceiptPreview } from "@/components/admin/ReceiptPreview";
import { StatusChip } from "@/components/StatusChip";
import { siteFees } from "@/lib/fees";
import { requireAdminPage } from "@/lib/guards";
import { memberRegistrationRows, normalizeRegistrationForm } from "@/lib/registration-form";
import { isMemberRole, type SnapshotQuestion, type StudentAnswer } from "@/lib/types";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

function snapshotQuestions(snapshot: Record<string, unknown> | null): SnapshotQuestion[] {
  if (!snapshot || !Array.isArray(snapshot.questions)) return [];
  return snapshot.questions as SnapshotQuestion[];
}

export default async function ApplicantFilePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const user = (await db.select().from(users).where(eq(users.id, Number(id))).limit(1))[0];
  if (!user || !isMemberRole(user.role)) notFound();

  const program = await db.select().from(levels).orderBy(levels.number);
  const progressRows = await db
    .select()
    .from(levelProgress)
    .where(eq(levelProgress.userId, user.id));
  const progressByLevel = new Map(progressRows.map((row) => [row.levelId, row]));
  const { currency } = await siteFees();

  const academy = (await db.select().from(settings).limit(1))[0];
  const registrationForm = normalizeRegistrationForm(academy?.registrationForm);
  const registrationRows = memberRegistrationRows(user, registrationForm);

  const receipts = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.submittedAt));
  const attempts = await db
    .select({ attempt: examAttempts, exam: exams })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .where(eq(examAttempts.userId, user.id))
    .orderBy(desc(examAttempts.startedAt));

  return (
    <AppShell user={admin} nav={adminNav} title={user.fullName}>
      <Link href="/admin/applicants" className="text-sm text-[#0076AF]">
        ← Applicants
      </Link>
      <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] bg-white p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#718096]">Applicant file</p>
          <div className="mt-4 space-y-2 text-sm">
            <p>{user.email}</p>
            <p>{user.phone ?? "No phone"}</p>
            <p>{user.address ?? "No address"}</p>
            <MapViewButton latitude={user.latitude} longitude={user.longitude} address={user.address} />
            <p>{user.education ?? "No education listed"}</p>
            <StatusChip status={user.accountStatus} />
            <p className="text-[#718096]">Applied {formatDate(user.createdAt)}</p>
          </div>
          {registrationRows.length ? (
            <>
              <h3 className="mt-8 font-serif text-2xl">Registration details</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {registrationRows.map((row) => (
                  <div key={row.label} className="rounded-2xl bg-[#F7F9FD] p-3">
                    <dt className="text-xs uppercase tracking-[0.12em] text-[#718096]">
                      {row.label}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap">
                      {isFacebookUrl(row.value) ? (
                        <FacebookButton url={row.value} />
                      ) : /^https?:\/\//i.test(row.value) ? (
                        <a
                          href={row.value}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all font-semibold text-[#0076AF] hover:underline"
                        >
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
          <h3 className="mt-8 font-serif text-2xl">Payments</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {receipts.map((payment) => (
              <li key={payment.id} className="rounded-2xl bg-[#F7F9FD] p-3">
                <div className="flex justify-between gap-2">
                  <span>{payment.referenceNumber}</span>
                  <StatusChip status={payment.status} />
                </div>
                <p>{formatMoney(payment.amountCents)}</p>
                <div className="mt-2">
                  <ReceiptPreview path={payment.receiptPath} label={`Receipt · ${user.fullName}`} />
                </div>
              </li>
            ))}
            {!receipts.length ? <li className="text-[#718096]">No receipts.</li> : null}
          </ul>
        </section>
        <section className="space-y-4">
          {program.map((level) => {
            const progress = progressByLevel.get(level.id);
            return (
              <article key={level.id} className="rounded-[28px] bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#718096]">Level {level.number}</p>
                    <h3 className="font-serif text-2xl">{level.name}</h3>
                  </div>
                  <StatusChip status={progress?.status ?? "locked"} />
                </div>
                <p className="mt-2 text-sm text-[#718096]">
                  Best {progress?.bestScore ?? "—"}% · attempts {progress?.attemptsUsed ?? 0} · study{" "}
                  {formatDate(progress?.studyDeadline)} · exam {formatDate(progress?.examDeadline)}
                </p>
                <div className="mt-4">
                  <ProgressActions
                    userId={user.id}
                    levelId={level.id}
                    studyDays={level.studyDays}
                    examDays={level.examDays}
                  />
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <section className="mt-6 rounded-[28px] bg-white p-6">
        <h3 className="font-serif text-2xl">Exam attempts</h3>
        {attempts.map(({ attempt, exam }) => (
          <article key={attempt.id} className="mt-4 rounded-2xl border border-[#1B365F]/10 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{exam.title}</strong>
              <StatusChip status={attempt.status} />
            </div>
            <p className="mt-1 text-sm text-[#718096]">
              {formatDateTime(attempt.startedAt)} · {attempt.scorePercent ?? "—"}% · {attempt.pointsEarned ?? 0}/
              {attempt.pointsPossible ?? 0}
            </p>
            {attempt.status === "pending_review" || attempt.status === "graded" ? (
              <EssayGrader
                attemptId={attempt.id}
                questions={snapshotQuestions(attempt.snapshot)}
                answers={(attempt.answers ?? {}) as Record<string, StudentAnswer>}
              />
            ) : null}
          </article>
        ))}
        {!attempts.length ? <p className="mt-3 text-sm text-[#718096]">No sittings yet.</p> : null}
      </section>
    </AppShell>
  );
}
