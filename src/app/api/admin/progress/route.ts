import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, levelProgress, levels } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { addDays } from "@/lib/utils";
import { gradeAttempt, snapshotQuestions } from "@/lib/grading";
import { unlockNextLevel } from "@/lib/progress";
import type { SnapshotQuestion, StudentAnswer } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);
  const body = (await request.json()) as {
    action?: string;
    userId?: number;
    levelId?: number;
    studyDays?: number;
    examDays?: number;
    attemptId?: number;
    essayScores?: Record<string, number>;
  };

  if (body.action === "extend" && body.userId && body.levelId) {
    const progress = (
      await db
        .select()
        .from(levelProgress)
        .where(
          and(
            eq(levelProgress.userId, body.userId),
            eq(levelProgress.levelId, body.levelId),
          ),
        )
        .limit(1)
    )[0];
    const level = (await db.select().from(levels).where(eq(levels.id, body.levelId)).limit(1))[0];
    if (!progress || !level) return jsonError("Progress not found.", 404);
    const now = new Date();
    await db
      .update(levelProgress)
      .set({
        status: progress.status === "passed" ? "passed" : "unlocked",
        unlockedAt: progress.unlockedAt ?? now,
        studyDeadline: addDays(now, Number(body.studyDays ?? level.studyDays)),
        examDeadline: addDays(
          now,
          Number(body.studyDays ?? level.studyDays) + Number(body.examDays ?? level.examDays),
        ),
      })
      .where(eq(levelProgress.id, progress.id));
    return Response.json({ ok: true });
  }

  if (body.action === "reset-attempts" && body.userId && body.levelId) {
    await db
      .update(levelProgress)
      .set({ attemptsUsed: 0, status: "unlocked" })
      .where(
        and(eq(levelProgress.userId, body.userId), eq(levelProgress.levelId, body.levelId)),
      );
    return Response.json({ ok: true });
  }

  if (body.action === "grade-essays" && body.attemptId) {
    const attempt = (
      await db.select().from(examAttempts).where(eq(examAttempts.id, body.attemptId)).limit(1)
    )[0];
    if (!attempt) return jsonError("Attempt not found.", 404);
    const questions = snapshotQuestions(attempt.snapshot);
    const answers = (attempt.answers ?? {}) as Record<string, StudentAnswer>;
    const result = gradeAttempt(questions, answers);
    let extra = 0;
    for (const question of questions) {
      if (question.type !== "essay") continue;
      extra += Number(body.essayScores?.[String(question.id)] ?? 0);
    }
    const pointsEarned = result.pointsEarned + extra;
    const scorePercent =
      result.pointsPossible === 0
        ? 0
        : Math.round((pointsEarned / result.pointsPossible) * 100);
    const level = (
      await db.select().from(levels).where(eq(levels.id, attempt.levelId)).limit(1)
    )[0];
    const passed = scorePercent >= (level?.requiredScore ?? 70);

    await db
      .update(examAttempts)
      .set({
        status: "graded",
        scorePercent,
        pointsEarned,
        passed,
      })
      .where(eq(examAttempts.id, attempt.id));

    if (passed && level) {
      const progress = (
        await db
          .select()
          .from(levelProgress)
          .where(
            and(
              eq(levelProgress.userId, attempt.userId),
              eq(levelProgress.levelId, attempt.levelId),
            ),
          )
          .limit(1)
      )[0];
      if (progress && progress.status !== "passed") {
        await db
          .update(levelProgress)
          .set({
            status: "passed",
            passedAt: new Date(),
            bestScore: Math.max(progress.bestScore ?? 0, scorePercent),
          })
          .where(eq(levelProgress.id, progress.id));
        await unlockNextLevel(attempt.userId, level.number);
      }
    }

    return Response.json({ ok: true, scorePercent, passed });
  }

  return jsonError("Unknown action.", 400);
}
