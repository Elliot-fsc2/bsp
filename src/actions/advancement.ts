"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  approvals,
  awardedBadges,
  badgeRequirements,
  badges,
  notifications,
  submissions,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { normalizeRich } from "@/lib/richtext";
import { getProgramLock, getRankLock } from "@/lib/queries";
import type { QuizQuestion } from "@/lib/types";

function parseQuestions(value: string | null): QuizQuestion[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as QuizQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function refreshAdvancement(badgeId: number) {
  revalidatePath("/dashboard");
  revalidatePath("/advancement");
  revalidatePath(`/advancement/badge/${badgeId}`);
  revalidatePath("/approvals");
  revalidatePath("/my-advancement");
}

async function notify(userId: number, title: string, body: string, href?: string) {
  await db.insert(notifications).values({ userId, title, body, href: href ?? null });
}

export async function submitRequirementAction(
  requirementId: number,
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const requirementRows = await db.select().from(badgeRequirements).where(eq(badgeRequirements.id, requirementId)).limit(1);
  const requirement = requirementRows[0];
  if (!requirement) return { error: "That requirement no longer exists." };
  if (requirement.type === "merit") return { error: "This requirement is met by earning another badge." };

  const lock = await getRankLock(requirement.badgeId, user.id);
  if (lock.locked) return { error: `This rank is locked. Earn the ${lock.lockedByName} first.` };

  const badgeRow = (await db.select().from(badges).where(eq(badges.id, requirement.badgeId)).limit(1))[0];
  if (badgeRow?.kind === "rank") {
    const programLock = await getProgramLock(badgeRow.programId, user.id);
    if (programLock.locked) {
      return { error: `Level ${programLock.level} is locked. Finish the ${programLock.lockedByName} first.` };
    }
  }

  const existing = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.userId, user.id), eq(submissions.requirementId, requirementId)))
    .limit(1);
  if (existing[0]?.status === "approved") return { error: "This requirement is already approved." };

  const textContent = normalizeRich(formData.get("textContent"));
  const mediaUrl = String(formData.get("mediaUrl") ?? "").trim() || null;
  const mediaType = String(formData.get("mediaType") ?? "").trim() || null;
  const externalUrl = String(formData.get("externalUrl") ?? "").trim() || null;
  const driveFileId = String(formData.get("driveFileId") ?? "").trim() || null;
  const driveSharedWith = String(formData.get("driveSharedWith") ?? "").trim() || null;
  const storageProvider = String(formData.get("storageProvider") ?? "").trim() || "server";

  if (requirement.requiresText && !textContent) return { error: "Please write your answer before submitting." };
  if (requirement.requiresMedia && !mediaUrl) return { error: "Please attach your video or image proof." };
  if (requirement.requiresLink && !externalUrl) return { error: "Please add your Google Drive link." };

  const questions = parseQuestions(requirement.quizJson);
  let answersJson: string | null = null;
  let quizScore: number | null = null;
  if (questions.length) {
    const answers: number[] = [];
    let correct = 0;
    questions.forEach((question, index) => {
      const picked = Number(formData.get(`quiz-${index}`));
      const value = Number.isFinite(picked) ? picked : -1;
      answers.push(value);
      if (value === question.answer) correct += 1;
    });
    answersJson = JSON.stringify(answers);
    quizScore = Math.round((correct / questions.length) * 100);
  }

  const values = {
    userId: user.id,
    kind: "requirement" as const,
    badgeId: requirement.badgeId,
    requirementId,
    textContent,
    mediaUrl,
    mediaType,
    externalUrl,
    driveFileId,
    driveUrl: driveFileId ? mediaUrl : null,
    driveSharedWith: driveFileId ? driveSharedWith : null,
    storageProvider,
    quizJson: answersJson,
    quizScore,
    status: "pending" as const,
    levelsApproved: 0,
    levelsRequired: 2,
    decidedAt: null,
  };

  if (existing[0]) {
    await db.update(submissions).set(values).where(eq(submissions.id, existing[0].id));
  } else {
    await db.insert(submissions).values(values);
  }

  await notify(
    user.id,
    "Submission sent for approval",
    `${requirement.title} was submitted. A Scout Leader will review it first.`,
    `/advancement/badge/${requirement.badgeId}`,
  );

  refreshAdvancement(requirement.badgeId);
  return { ok: true };
}

export async function submitBadgeApplicationAction(badgeId: number) {
  const user = await requireUser();
  const badgeRow = (await db.select().from(badges).where(eq(badges.id, badgeId)).limit(1))[0];
  if (!badgeRow) return;

  const lock = await getRankLock(badgeId, user.id);
  if (lock.locked) return;
  if (badgeRow.kind === "rank") {
    const programLock = await getProgramLock(badgeRow.programId, user.id);
    if (programLock.locked) return;
  }

  const awarded = await db
    .select()
    .from(awardedBadges)
    .where(and(eq(awardedBadges.userId, user.id), eq(awardedBadges.badgeId, badgeId)))
    .limit(1);
  if (awarded[0]) return;

  const existing = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, user.id),
        eq(submissions.badgeId, badgeId),
        eq(submissions.kind, "badge"),
        isNull(submissions.requirementId),
      ),
    )
    .limit(1);

  const requirementRows = await db.select().from(badgeRequirements).where(eq(badgeRequirements.badgeId, badgeId));
  const userSubmissions = await db.select().from(submissions).where(eq(submissions.userId, user.id));
  const userAwarded = await db.select().from(awardedBadges).where(eq(awardedBadges.userId, user.id));
  const earnedIds = new Set(userAwarded.map((row) => row.badgeId));
  const allMet = requirementRows.every((req) => {
    if (req.type === "merit" && req.requiredBadgeId) return earnedIds.has(req.requiredBadgeId);
    return userSubmissions.some((row) => row.requirementId === req.id && row.status === "approved");
  });
  if (!allMet) return;

  if (existing[0]) {
    await db
      .update(submissions)
      .set({ status: "pending", levelsApproved: 0, submittedAt: new Date(), decidedAt: null })
      .where(eq(submissions.id, existing[0].id));
  } else {
    await db.insert(submissions).values({
      userId: user.id,
      kind: "badge",
      badgeId,
      requirementId: null,
      status: "pending",
      levelsApproved: 0,
      levelsRequired: 2,
    });
  }

  await notify(
    user.id,
    "Badge submitted for approval",
    `${badgeRow.name} was submitted. A Scout Leader will review it first.`,
    `/advancement/badge/${badgeId}`,
  );
  refreshAdvancement(badgeId);
}

export async function decideSubmissionAction(submissionId: number, formData: FormData) {
  const user = await requireUser();
  if (user.role === "student") return;

  const submissionRows = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  const submission = submissionRows[0];
  if (!submission) return;
  if (submission.status === "approved" || submission.status === "rejected") return;

  const prior = await db
    .select()
    .from(approvals)
    .where(and(eq(approvals.submissionId, submissionId), eq(approvals.approverId, user.id)));
  if (prior.length > 0) return;

  const decision = String(formData.get("decision") ?? "approved") === "rejected" ? "rejected" : "approved";
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const level = submission.levelsApproved === 0 ? 1 : 2;

  if (level === 1 && submission.status !== "pending") return;
  if (level === 2 && (submission.status !== "level1_approved" || user.role !== "admin")) return;

  await db.insert(approvals).values({ submissionId, approverId: user.id, level, decision, comment });

  const badgeRow = (await db.select().from(badges).where(eq(badges.id, submission.badgeId)).limit(1))[0];
  const badgeName = badgeRow?.name ?? "badge";

  if (decision === "rejected") {
    await db
      .update(submissions)
      .set({ status: "rejected", decidedAt: new Date() })
      .where(eq(submissions.id, submissionId));
    await notify(
      submission.userId,
      "Submission needs revision",
      `${user.name} asked for changes on ${badgeName}. ${comment ?? ""}`.trim(),
      submission.requirementId ? `/advancement/requirement/${submission.requirementId}` : `/advancement/badge/${submission.badgeId}`,
    );
  } else {
    const nextLevels = submission.levelsApproved + 1;
    const approved = nextLevels >= submission.levelsRequired;
    await db
      .update(submissions)
      .set({ levelsApproved: nextLevels, status: approved ? "approved" : "level1_approved", decidedAt: approved ? new Date() : null })
      .where(eq(submissions.id, submissionId));

    if (approved && submission.kind === "badge") {
      const already = await db
        .select()
        .from(awardedBadges)
        .where(and(eq(awardedBadges.userId, submission.userId), eq(awardedBadges.badgeId, submission.badgeId)))
        .limit(1);
      if (!already[0]) {
        await db.insert(awardedBadges).values({ userId: submission.userId, badgeId: submission.badgeId });
      }
      await notify(submission.userId, "Badge awarded ⚜️", `${badgeName} is now on your record. Congratulations, Scout!`, "/advancement");
    } else {
      await notify(
        submission.userId,
        approved ? "Requirement approved" : "Progress confirmed (1 of 2)",
        approved
          ? `${user.name} approved your work on ${badgeName}.`
          : `${user.name} confirmed your work on ${badgeName}. Waiting for the council to confirm.`,
        submission.requirementId ? `/advancement/badge/${submission.badgeId}` : `/advancement/badge/${submission.badgeId}`,
      );
    }
  }

  refreshAdvancement(submission.badgeId);
  revalidatePath("/admin/reports");
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  revalidatePath("/dashboard");
}
