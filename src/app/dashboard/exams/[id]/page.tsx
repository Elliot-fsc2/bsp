import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { exams, levelProgress, settings } from "@/db/schema";
import { AppShell, studentNav } from "@/components/AppShell";
import { ExamSession } from "@/components/ExamSession";
import { requireUnpausedMember } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUnpausedMember();
  const { id } = await params;
  const exam = (await db.select().from(exams).where(eq(exams.id, Number(id))).limit(1))[0];
  if (!exam) notFound();

  const academy = (await db.select().from(settings).limit(1))[0];

  const progress = (
    await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, user.id), eq(levelProgress.levelId, exam.levelId)))
      .limit(1)
  )[0];

  if (user.accountStatus !== "active" || !progress || progress.status === "locked") {
    redirect("/dashboard/exams");
  }

  return (
    <AppShell user={user} nav={studentNav} title="Examination">
      <ExamSession
        examId={exam.id}
        examTitle={exam.title}
        passingScore={exam.passingScore}
        timeLimitMinutes={exam.timeLimitMinutes}
        questionCount={exam.questionCount}
        note={academy?.examNote}
      />
    </AppShell>
  );
}
