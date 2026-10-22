import Link from "next/link";
import { AdvancementTimeline } from "@/components/AdvancementTimeline";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAdvancement, getMySubmissions } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  pending: "Waiting for Scout Leader",
  level1_approved: "Waiting for Council Admin",
  approved: "Approved",
  rejected: "Needs revision",
};

const STYLE: Record<string, string> = {
  pending: "bg-[#fff3c4]",
  level1_approved: "bg-[#dbeafe]",
  approved: "bg-[#d8f3dc]",
  rejected: "bg-[#ffe0e8]",
};

export default async function MyAdvancementPage() {
  const user = await requireUser();
  const [submissions, advancement] = await Promise.all([getMySubmissions(user.id), getAdvancement(user.id)]);

  return (
    <div>
      <PageHeader
        eyebrow="My advancement"
        title="My advancement"
        text="What you still need to do, and every task you have sent for approval. Tap any task to open its details."
      />
      <AdvancementTimeline programs={advancement.programs} badges={advancement.badges} />

      <h2 className="font-display mb-3 text-2xl">My submissions</h2>
      {submissions.length === 0 ? (
        <p className="bloom-card p-6 text-[var(--muted)]">
          Nothing submitted yet. Open a badge and start with your first requirement.
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map((item) => (
            <Link
              key={item.id}
              href={item.requirementId ? `/advancement/requirement/${item.requirementId}` : `/advancement/badge/${item.badgeId}`}
              className="bloom-card flex flex-wrap items-center gap-3 p-4"
            >
              {item.badgeImage ? <img src={item.badgeImage} alt="" className="h-11 w-11" /> : <span className="text-2xl">🎖️</span>}
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{item.requirementTitle ?? `${item.badgeName} — badge application`}</p>
                <p className="text-xs text-[var(--muted)]">
                  {item.badgeName} · submitted {formatDateTime(item.submittedAt)}
                </p>
              </div>
              <span className={`sticker ${STYLE[item.status] ?? "bg-white"}`}>{LABEL[item.status] ?? item.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
