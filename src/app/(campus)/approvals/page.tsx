import Link from "next/link";
import { SubmissionResponses } from "@/components/SubmissionResponses";
import { Avatar, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getApprovalQueue } from "@/lib/queries";
import type { QuizQuestion } from "@/lib/types";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-[#fff3c4]",
    level1_approved: "bg-[#dbeafe]",
    approved: "bg-[#d8f3dc]",
    rejected: "bg-[#ffe0e8]",
  };
  const label: Record<string, string> = {
    pending: "Level 1 · Scout Leader",
    level1_approved: "Level 2 · Council Admin",
    approved: "Approved",
    rejected: "Needs revision",
  };
  return <span className={`sticker ${map[status] ?? "bg-white"}`}>{label[status] ?? status}</span>;
}

function parseQuestions(value: string | null): QuizQuestion[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as QuizQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function ApprovalsPage() {
  const user = await requireRole(["teacher", "admin"]);
  const { pending, decided } = await getApprovalQueue(user);

  return (
    <div>
      <PageHeader
        eyebrow="Approvals"
        title="Advancement approvals"
        text="Every answer the Scout sent is shown below — written work, video or photo proof, Drive files, and quiz answers. Two approvals complete a task: a Scout Leader (level 1), then a Council Admin (level 2)."
      />

      <section className="mb-8">
        <h2 className="font-display mb-3 text-2xl">Waiting for you ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="bloom-card p-6 text-[var(--muted)]">Inbox zero — nothing waiting for your approval.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((item) => (
              <article key={item.id} className="bloom-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {item.badgeImage ? (
                    <img src={item.badgeImage} alt="" className="h-12 w-12" />
                  ) : (
                    <span className="text-2xl">🎖️</span>
                  )}
                  <Avatar name={item.scoutName} color={item.scoutColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{item.requirementTitle ?? `${item.badgeName} — badge application`}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {item.scoutName} · {item.badgeName} · submitted {relativeTime(item.submittedAt)}
                    </p>
                  </div>
                  <StatusChip status={item.status} />
                  <Link href={`/approvals/${item.id}`} className="bloom-btn secondary">
                    Review &amp; decide →
                  </Link>
                </div>

                <div className="mt-3 rounded-2xl border-2 border-[var(--line)] bg-white/60 p-3">
                  <SubmissionResponses answer={item} questions={parseQuestions(item.requirementQuiz)} compact />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display mb-3 text-2xl">Recently decided</h2>
        {decided.length === 0 ? (
          <p className="bloom-card p-6 text-[var(--muted)]">Nothing decided yet.</p>
        ) : (
          <div className="space-y-2">
            {decided.map((item) => (
              <Link key={item.id} href={`/approvals/${item.id}`} className="bloom-card flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{item.requirementTitle ?? `${item.badgeName} — badge application`}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {item.scoutName} · {item.badgeName}
                  </p>
                </div>
                <StatusChip status={item.status} />
                <span className="text-xs font-bold text-[var(--muted)]">{formatDateTime(item.decidedAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
