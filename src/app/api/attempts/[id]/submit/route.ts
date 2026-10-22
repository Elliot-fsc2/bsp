import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, exams, levelProgress, levels, users } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { gradeAttempt, snapshotQuestions } from "@/lib/grading";
import { unlockNextLevel } from "@/lib/progress";
import type { StudentAnswer } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.accountStatus !== "active") return jsonError("Forbidden", 403);
  const { id } = await context.params;
  const body = (await request.json()) as { answers?: Record<string, StudentAnswer> };

  const attempt = (
    await db.select().from(examAttempts).where(eq(examAttempts.id, Number(id))).limit(1)
  )[0];
  if (!attempt || attempt.userId !== user.id) return jsonError("Attempt not found.", 404);
  if (attempt.status !== "in_progress") {
    return Response.json({
      alreadySubmitted: true,
      scorePercent: attempt.scorePercent,
      passed: attempt.passed,
      status: attempt.status,
    });
  }

  const questions = snapshotQuestions(attempt.snapshot);
  const result = gradeAttempt(questions, body.answers ?? {});
  const exam = (await db.select().from(exams).where(eq(exams.id, attempt.examId)).limit(1))[0];
  const passingScore = exam?.passingScore ?? 70;
  const passed = !result.needsReview && result.scorePercent >= passingScore;
  const status = result.needsReview ? "pending_review" : "submitted";

  await db
    .update(examAttempts)
    .set({
      status,
      submittedAt: new Date(),
      scorePercent: result.scorePercent,
      pointsEarned: result.pointsEarned,
      pointsPossible: result.pointsPossible,
      passed,
      answers: { ...(body.answers ?? {}), _details: result.details },
    })
    .where(eq(examAttempts.id, attempt.id));

  const progress = (
    await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, user.id), eq(levelProgress.levelId, attempt.levelId)))
      .limit(1)
  )[0];

  if (progress) {
    const best = Math.max(progress.bestScore ?? 0, result.scorePercent);
    if (passed) {
      await db
        .update(levelProgress)
        .set({
          status: "passed",
          passedAt: new Date(),
          bestScore: best,
        })
        .where(eq(levelProgress.id, progress.id));
      const level = (
        await db.select().from(levels).where(eq(levels.id, attempt.levelId)).limit(1)
      )[0];
      if (level) await unlockNextLevel(user.id, level.number);
    } else {
      await db
        .update(levelProgress)
        .set({
          status: progress.status === "passed" ? "passed" : "unlocked",
          bestScore: best,
        })
        .where(eq(levelProgress.id, progress.id));
      if (progress.attemptsUsed >= 2) {
        await db
          .update(users)
          .set({ accountStatus: "suspended", updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }
    }
  }

  const suspended =
    !passed && progress ? progress.attemptsUsed >= 2 : false;

  return Response.json({
    scorePercent: result.scorePercent,
    pointsEarned: result.pointsEarned,
    pointsPossible: result.pointsPossible,
    passed,
    status,
    passingScore,
    suspended,
    details: result.details,
  });
}
