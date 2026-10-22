import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionResponses } from "@/components/SubmissionResponses";
import { Avatar, PageHeader } from "@/components/ui";
import { decideSubmissionAction } from "@/actions/advancement";
import { requireRole } from "@/lib/auth";
import { getSubmissionDetail } from "@/lib/queries";
import type { QuizQuestion } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default async function ReviewSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["teacher", "admin"]);
  const data = await getSubmissionDetail(Number(id));
  if (!data) notFound();

  const { submission, badge, requirement, approvals } = data;
  const questions = (parse(requirement?.quizJson ?? null) as QuizQuestion[] | null) ?? [];
  const waitingLevel = submission.levelsApproved === 0 ? 1 : 2;
  const canDecide =
    (submission.status === "pending" || submission.status === "level1_approved") &&
    (waitingLevel === 1 || user.role === "admin") &&
    !approvals.some((approval) => approval.approverId === user.id);
  const decide = decideSubmissionAction.bind(null, submission.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/approvals" className="text-sm font-extrabold text-[var(--secondary)]">
          ← Back to approvals
        </Link>
      </div>

      <PageHeader
        eyebrow={badge ? `${badge.name}${requirement ? ` · ${requirement.title}` : " · badge application"}` : "Submission"}
        title={`${submission.scoutName}'s submission`}
        text={`Submitted ${formatDateTime(submission.submittedAt)}`}
      />

      <article className="bloom-card mb-5 flex items-center gap-3 p-5">
        <Avatar name={submission.scoutName} color={submission.scoutColor} size={48} />
        <div>
          <p className="font-extrabold">{submission.scoutName}</p>
          <p className="text-xs text-[var(--muted)]">{submission.scoutEmail}</p>
        </div>
        <span className="sticker ml-auto">
          Level {waitingLevel} · {waitingLevel === 1 ? "Scout Leader" : "Council Admin"}
        </span>
      </article>

      <article className="bloom-card mb-5 p-5">
        <h2 className="font-display mb-3 text-xl">What the Scout submitted</h2>
        <SubmissionResponses answer={submission} questions={questions} />
      </article>

      <h2 className="font-display mb-3 text-2xl">Approval history</h2>
      {approvals.length === 0 ? (
        <p className="bloom-card mb-5 p-5 text-[var(--muted)]">No decisions recorded yet.</p>
      ) : (
        <div className="mb-5 space-y-2">
          {approvals.map((approval) => (
            <div key={approval.id} className="bloom-card flex items-center gap-3 p-3">
              <Avatar name={approval.approverName} color={approval.approverColor} size={34} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">
                  {approval.approverName} · Level {approval.level}
                </p>
                <p className="text-xs text-[var(--muted)]">{approval.comment ?? "No comment."}</p>
              </div>
              <span className={`sticker ${approval.decision === "approved" ? "bg-[#d8f3dc]" : "bg-[#ffe0e8]"}`}>
                {approval.decision}
              </span>
            </div>
          ))}
        </div>
      )}

      {canDecide ? (
        <form action={decide} className="bloom-card space-y-3 p-5">
          <h2 className="font-display text-2xl">Your decision</h2>
          <textarea className="bloom-area" name="comment" rows={3} placeholder="Add a kind, useful note (optional)" />
          <div className="flex flex-wrap justify-end gap-2">
            <button className="bloom-btn" name="decision" value="approved">
              Approve
            </button>
            <button className="bloom-btn" name="decision" value="rejected" style={{ background: "#c1121f" }}>
              Ask for revision
            </button>
          </div>
        </form>
      ) : (
        <p className="bloom-card p-5 text-[var(--muted)]">
          This submission is not waiting for you (already decided, or it is the other level&apos;s turn).
        </p>
      )}
    </div>
  );
}
