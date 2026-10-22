import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, PageHeader } from "@/components/ui";
import { RichText } from "@/components/RichText";
import { RequirementForm } from "@/components/RequirementForm";
import { requireUser } from "@/lib/auth";
import { getProgramLock, getRankLock, getRequirementWork } from "@/lib/queries";
import { driveConfigured } from "@/lib/drive";
import { getDriveAccount } from "@/lib/drive-account";
import type { QuizQuestion } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parseQuestions(value: string | null): QuizQuestion[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as QuizQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseAnswers(value: string | null): number[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as number[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export default async function RequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getRequirementWork(Number(id), user.id);
  if (!data) notFound();

  const { requirement, badge, submission, approvals } = data;
  const questions = parseQuestions(requirement.quizJson);
  const approved = submission?.status === "approved";
  const lock = await getRankLock(requirement.badgeId, user.id);
  const programLock =
    badge?.kind === "rank"
      ? await getProgramLock(badge.programId, user.id)
      : { locked: false, lockedByName: null, level: 0 };
  const driveAvailable = driveConfigured();
  const drive = driveAvailable ? await getDriveAccount(user.id) : null;
  const driveReady = driveAvailable && Boolean(drive?.refreshToken);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href={`/advancement/badge/${requirement.badgeId}`} className="text-sm font-extrabold text-[var(--secondary)]">
          ← {badge?.name ?? "Back to badge"}
        </Link>
      </div>

      <PageHeader
        eyebrow={requirement.type === "merit" ? "Badge requirement" : `${requirement.points} points`}
        title={requirement.title}
        text={requirement.description ?? undefined}
      />

      {requirement.instructions ? (
        <article className="bloom-card mb-5 p-5">
          <h2 className="font-display mb-2 text-xl">What to do</h2>
          <RichText value={requirement.instructions} />
        </article>
      ) : null}

      {programLock.locked ? (
        <p className="bloom-card mb-5 p-5 font-bold">
          🔒 {badge?.name ?? "This program"} is part of level {programLock.level}, which is still locked. Finish{" "}
          <strong>{programLock.lockedByName}</strong> first, then come back to this task.
        </p>
      ) : lock.locked ? (
        <p className="bloom-card mb-5 p-5 font-bold">
          🔒 This rank is locked. Finish the <strong>{lock.lockedByName}</strong> first, then come back to this task.
        </p>
      ) : approved ? (
        <p className="bloom-card mb-5 p-5 font-bold text-[#2d6a4f]">
          ✅ This requirement is approved. Great work, Scout.
        </p>
      ) : requirement.type === "merit" ? (
        <p className="bloom-card mb-5 p-5 font-bold">
          This requirement is met by earning the required merit badge.
          {requirement.requiredBadgeId ? (
            <>
              {" "}
              <Link href={`/advancement/badge/${requirement.requiredBadgeId}`} className="text-[var(--secondary)] underline">
                Open the badge →
              </Link>
            </>
          ) : null}
        </p>
      ) : (
        <div className="bloom-card mb-5 p-5">
          <RequirementForm
            requirementId={requirement.id}
            questions={questions}
            requiresText={requirement.requiresText}
            requiresMedia={requirement.requiresMedia}
            mediaKind={requirement.mediaKind}
            requiresLink={requirement.requiresLink}
            driveReady={driveReady}
            driveAvailable={driveAvailable}
            existing={
              submission
                ? {
                    textContent: submission.textContent ?? "",
                    mediaUrl: submission.mediaUrl,
                    mediaType: submission.mediaType,
                    externalUrl: submission.externalUrl,
                    driveFileId: submission.driveFileId,
                    driveSharedWith: submission.driveSharedWith,
                    quizAnswers: parseAnswers(submission.quizJson),
                  }
                : null
            }
          />
        </div>
      )}

      {submission && (submission.mediaUrl || submission.externalUrl) ? (
        <article className="bloom-card mb-5 p-5">
          <h2 className="font-display mb-2 text-xl">Your submission</h2>
          {submission.mediaUrl ? (
            submission.mediaType === "video" ? (
              <video src={submission.mediaUrl} controls className="w-full rounded-xl" />
            ) : (
              <img src={submission.mediaUrl} alt="" className="max-h-80 rounded-xl" />
            )
          ) : null}
          {submission.textContent ? (
            <div className="mt-3">
              <RichText value={submission.textContent} compact />
            </div>
          ) : null}
          {submission.externalUrl ? (
            <a href={submission.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-extrabold text-[var(--secondary)] underline">
              Open attached Google Drive file →
            </a>
          ) : null}
        </article>
      ) : null}

      <h2 className="font-display mb-3 text-2xl">Approvals</h2>
      {approvals.length === 0 ? (
        <p className="bloom-card p-5 text-[var(--muted)]">
          No approvals yet. Level 1 is a Scout Leader; level 2 is a Council Admin.
        </p>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => (
            <article key={approval.id} className="bloom-card flex items-center gap-3 p-4">
              <Avatar name={approval.approverName} color={approval.approverColor} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">
                  {approval.approverName}{" "}
                  <span className="text-xs font-bold text-[var(--muted)]">Level {approval.level}</span>
                </p>
                <p className="text-sm text-[var(--muted)]">{approval.comment ?? "No comment."}</p>
              </div>
              <span className={`sticker ${approval.decision === "approved" ? "bg-[#d8f3dc]" : "bg-[#ffe0e8]"}`}>
                {approval.decision}
              </span>
              <span className="text-xs font-bold text-[var(--muted)]">{formatDateTime(approval.createdAt)}</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
