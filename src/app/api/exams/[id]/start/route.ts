import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, exams, levelProgress, questions } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { verifiedRetakeCount } from "@/lib/fees";
import { publicQuestion, snapshotQuestions } from "@/lib/grading";
import type { QuestionOptions, QuestionType, SnapshotQuestion } from "@/lib/types";
import { shuffle } from "@/lib/utils";

export const dynamic = "force-dynamic";

function shuffleChoices(options: QuestionOptions | null, enabled: boolean) {
  if (!options || !enabled) return options;
  return {
    ...options,
    choices: options.choices ? shuffle(options.choices) : options.choices,
    left: options.left ? shuffle(options.left) : options.left,
    right: options.right ? shuffle(options.right) : options.right,
  };
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.accountStatus === "suspended") {
    return jsonError(
      "Access is paused after your second exam result. Settle the reinstatement fee on the payment page to continue.",
      403,
    );
  }
  if (user.accountStatus !== "active") {
    return jsonError("Your registration is not active yet.", 403);
  }

  const { id } = await context.params;
  const exam = (await db.select().from(exams).where(eq(exams.id, Number(id))).limit(1))[0];
  if (!exam || !exam.isPublished) return jsonError("Exam not found.", 404);

  const progress = (
    await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, user.id), eq(levelProgress.levelId, exam.levelId)))
      .limit(1)
  )[0];

  if (!progress || progress.status === "locked") {
    return jsonError("This level is still locked.", 403);
  }
  if (progress.status === "passed") {
    return jsonError("You already passed this level.", 400);
  }
  if (progress.examDeadline && progress.examDeadline.getTime() < Date.now()) {
    return jsonError("The exam window for this level has closed. Ask an administrator to extend it.", 403);
  }

  const open = (
    await db
      .select()
      .from(examAttempts)
      .where(
        and(
          eq(examAttempts.userId, user.id),
          eq(examAttempts.examId, exam.id),
          eq(examAttempts.status, "in_progress"),
        ),
      )
      .orderBy(desc(examAttempts.startedAt))
      .limit(1)
  )[0];

  if (open) {
    const snapshot = snapshotQuestions(open.snapshot);
    return Response.json({
      attemptId: open.id,
      expiresAt: open.expiresAt,
      questions: snapshot.map(publicQuestion),
      answers: open.answers ?? {},
    });
  }

  const allowedAttempts = 1 + (await verifiedRetakeCount(user.id));
  if (progress.attemptsUsed >= allowedAttempts) {
    return jsonError(
      "Your first attempt is included. Pay the exam retake fee on the payment page to unlock another attempt.",
      402,
    );
  }
  if (progress.attemptsUsed >= exam.maxAttempts) {
    return jsonError("No attempts remaining.", 403);
  }
  if (!exam.bankId) return jsonError("This exam has no question bank.", 400);

  const bankQuestions = await db.select().from(questions).where(eq(questions.bankId, exam.bankId));
  if (!bankQuestions.length) return jsonError("The question bank is empty.", 400);

  const picked = (exam.shuffleQuestions ? shuffle(bankQuestions) : bankQuestions).slice(
    0,
    Math.min(exam.questionCount, bankQuestions.length),
  );

  const preparedQuestions: SnapshotQuestion[] = picked.map((question) => {
    const options = (question.options ?? null) as QuestionOptions | null;
    return {
      id: question.id,
      type: question.type as QuestionType,
      prompt: question.prompt,
      options: shuffleChoices(options, exam.shuffleOptions),
      correctAnswer: (question.correctAnswer ?? null) as SnapshotQuestion["correctAnswer"],
      points: question.points,
      explanation: question.explanation,
    };
  });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + exam.timeLimitMinutes * 60 * 1000);
  const [{ id: attemptId }] = await db
    .insert(examAttempts)
    .values({
      userId: user.id,
      examId: exam.id,
      levelId: exam.levelId,
      status: "in_progress",
      startedAt: now,
      expiresAt,
      snapshot: { questions: snapshotQuestions, examTitle: exam.title },
      answers: {},
    })
    .$returningId();

  await db
    .update(levelProgress)
    .set({
      attemptsUsed: progress.attemptsUsed + 1,
      status: "in_progress",
    })
    .where(eq(levelProgress.id, progress.id));

  return Response.json({
    attemptId,
    expiresAt,
    questions: preparedQuestions.map(publicQuestion),
    answers: {},
  });
}
