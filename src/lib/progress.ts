import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { exams, levelProgress, levels } from "@/db/schema";
import { addDays } from "@/lib/utils";

export async function initializeStudentProgress(userId: number) {
  const allLevels = await db.select().from(levels).orderBy(levels.number);
  const now = new Date();

  for (const level of allLevels) {
    const existing = await db
      .select({ id: levelProgress.id })
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, userId), eq(levelProgress.levelId, level.id)))
      .limit(1);

    if (existing.length) continue;

    const isFirst = level.number === 1;
    await db.insert(levelProgress).values({
      userId,
      levelId: level.id,
      status: isFirst ? "unlocked" : "locked",
      unlockedAt: isFirst ? now : null,
      studyDeadline: isFirst ? addDays(now, level.studyDays) : null,
      examDeadline: isFirst ? addDays(now, level.studyDays + level.examDays) : null,
      attemptsUsed: 0,
    });
  }
}

export async function unlockNextLevel(userId: number, currentLevelNumber: number) {
  const next = (
    await db
      .select()
      .from(levels)
      .where(eq(levels.number, currentLevelNumber + 1))
      .limit(1)
  )[0];

  if (!next) return;

  const now = new Date();
  const existing = (
    await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, userId), eq(levelProgress.levelId, next.id)))
      .limit(1)
  )[0];

  if (!existing) {
    await db.insert(levelProgress).values({
      userId,
      levelId: next.id,
      status: "unlocked",
      unlockedAt: now,
      studyDeadline: addDays(now, next.studyDays),
      examDeadline: addDays(now, next.studyDays + next.examDays),
      attemptsUsed: 0,
    });
    return;
  }

  if (existing.status === "passed") return;

  await db
    .update(levelProgress)
    .set({
      status: "unlocked",
      unlockedAt: existing.unlockedAt ?? now,
      studyDeadline: existing.studyDeadline ?? addDays(now, next.studyDays),
      examDeadline: existing.examDeadline ?? addDays(now, next.studyDays + next.examDays),
    })
    .where(eq(levelProgress.id, existing.id));
}

export async function getExamForLevel(levelId: number) {
  return (
    await db.select().from(exams).where(eq(exams.levelId, levelId)).limit(1)
  )[0];
}
