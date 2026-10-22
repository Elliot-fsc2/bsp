import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Play, Clock, XCircle, Award } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { RichText } from "@/components/RichText";
import { submitBadgeApplicationAction } from "@/actions/advancement";
import { requireUser } from "@/lib/auth";
import { getBadgeProgress, getProgramLock } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#fff3c4]",
  level1_approved: "bg-[#dbeafe]",
  approved: "bg-[#d8f3dc]",
  rejected: "bg-[#ffe0e8]",
};

function statusLabel(status: string | null) {
  if (status === "pending") return "Waiting for Scout Leader";
  if (status === "level1_approved") return "Waiting for Council Admin";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Needs revision";
  return "Not started";
}

export default async function BadgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const badge = await getBadgeProgress(Number(id), user.id);
  if (!badge) notFound();

  const apply = submitBadgeApplicationAction.bind(null, badge.id);
  const programLock =
    badge.kind === "rank" ? await getProgramLock(badge.programId, user.id) : { locked: false, lockedByName: null, level: 0 };
  const locked = badge.locked || programLock.locked;
  const lockedByName = badge.locked ? badge.lockedByName : programLock.lockedByName;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link href="/advancement" className="text-sm font-extrabold text-[var(--secondary)]">
          ← Back to advancement
        </Link>
      </div>

      <section className="bloom-card mb-5 flex flex-wrap items-center gap-5 p-6">
        {badge.imageUrl ? (
          <img src={badge.imageUrl} alt="" className="h-24 w-24" />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-full text-4xl" style={{ background: badge.programColor }}>
            {badge.kind === "merit" ? "🎖️" : "⚜️"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="sticker mb-2">
            {badge.programIcon} {badge.programName} · {badge.kind === "merit" ? "Merit badge" : "Rank"}
            {typeof badge.rankStep === "number" ? ` ${badge.rankStep} of ${badge.rankCount}` : ""}
            {badge.isMembership ? " · Membership" : ""}
          </p>
          <h1 className="font-display text-3xl">{badge.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{badge.description}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="progress-rail w-56">
              <div className="progress-fill" style={{ width: `${badge.percent}%` }} />
            </div>
            <span className="text-sm font-extrabold">
              {badge.satisfiedCount}/{badge.totalCount} requirements
            </span>
          </div>
        </div>
        {badge.earned ? (
          <div className="rounded-2xl bg-[#d8f3dc] px-4 py-3 text-center">
            <Award className="mx-auto mb-1" size={22} />
            <p className="text-sm font-extrabold">Earned</p>
            <p className="text-xs text-[var(--muted)]">{badge.awardedAt ? formatDate(badge.awardedAt) : ""}</p>
          </div>
        ) : null}
      </section>

      {locked ? (
        <p className="bloom-card mb-5 p-5 font-bold">
          {programLock.locked ? (
            <>
              🔒 {badge.programName} is level {programLock.level} and is still locked. Finish{" "}
              <strong>{programLock.lockedByName}</strong> first, then come back to this rank.
            </>
          ) : (
            <>
              🔒 This rank is locked. Finish the <strong>{lockedByName}</strong> first, then come back to this one.
            </>
          )}
        </p>
      ) : badge.earned ? (
        <p className="bloom-card mb-5 p-5 font-bold text-[#2d6a4f]">
          ⚜️ This badge is on your record. Congratulations, Scout!
        </p>
      ) : badge.canApply ? (
        <form action={apply} className="bloom-card mb-5 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-display text-xl">All requirements complete!</p>
            <p className="text-sm text-[var(--muted)]">Submit this badge for approval. It needs a Scout Leader and a Council Admin.</p>
          </div>
          <button className="bloom-btn">Submit badge for approval</button>
        </form>
      ) : badge.applicationStatus === "pending" || badge.applicationStatus === "level1_approved" ? (
        <p className="bloom-card mb-5 p-5 font-bold">
          <Clock className="mr-2 inline" size={16} />
          {statusLabel(badge.applicationStatus)} — your badge application is in review.
        </p>
      ) : badge.applicationStatus === "rejected" ? (
        <p className="bloom-card mb-5 p-5 font-bold text-[#c9184a]">
          <XCircle className="mr-2 inline" size={16} /> Your badge application needs revision. Submit it again when ready.
        </p>
      ) : null}

      {badge.requiredBy.length ? (
        <section className="bloom-card mb-5 p-5">
          <h2 className="font-display mb-1 text-xl">Required by</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            These ranks need this merit badge before they can be completed — it is one of their requirements.
          </p>
          <div className="flex flex-wrap gap-2">
            {badge.requiredBy.map((rank) => (
              <Link key={rank.id} href={`/advancement/badge/${rank.id}`} className="chip">
                ⚜️ {rank.name} <span className="text-[var(--muted)]">· {rank.programName}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <h2 className="font-display mb-3 text-2xl">Requirements</h2>
      <div className="space-y-3">
        {badge.requirements.map((requirement, index) => (
          <article key={requirement.id} className="bloom-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
                  Requirement {index + 1} · {requirement.points} pts
                </p>
                <h3 className="font-display text-xl">{requirement.title}</h3>
                {requirement.description ? <p className="mt-1 text-sm text-[var(--muted)]">{requirement.description}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold">
                  {requirement.type === "merit" ? (
                    <span className="chip">🎖️ Earn a merit badge</span>
                  ) : null}
                  {requirement.requiresText ? <span className="chip">✍️ Written answer</span> : null}
                  {requirement.requiresMedia ? (
                    <span className="chip">{requirement.mediaKind === "video" ? "🎥 Video proof" : "📷 Photo proof"}</span>
                  ) : null}
                  {requirement.requiresLink ? <span className="chip">🔗 Drive link</span> : null}
                  {requirement.quiz ? <span className="chip">❓ Quiz</span> : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`sticker ${STATUS_STYLE[requirement.status ?? ""] ?? "bg-white"}`}>
                  {requirement.satisfied ? "Completed" : statusLabel(requirement.status)}
                </span>
                {requirement.satisfiedByMerit ? (
                  requirement.requiredBadgeId ? (
                    <Link href={`/advancement/badge/${requirement.requiredBadgeId}`} className="bloom-btn secondary">
                      View {requirement.requiredBadgeName}
                    </Link>
                  ) : null
                ) : requirement.satisfied ? (
                  <span className="inline-flex items-center gap-1 text-sm font-extrabold text-[#2d6a4f]">
                    <CheckCircle2 size={16} /> Done
                  </span>
                ) : requirement.type === "merit" ? (
                  requirement.requiredBadgeId ? (
                    <Link href={`/advancement/badge/${requirement.requiredBadgeId}`} className="bloom-btn">
                      Earn {requirement.requiredBadgeName}
                    </Link>
                  ) : null
                ) : locked ? (
                  <span className="chip opacity-60">🔒 Locked</span>
                ) : (
                  <Link href={`/advancement/requirement/${requirement.id}`} className="bloom-btn">
                    <Play size={16} /> Proceed
                  </Link>
                )}
              </div>
            </div>
            {requirement.instructions && !requirement.satisfied ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-extrabold text-[var(--secondary)]">What to do</summary>
                <div className="mt-2 text-sm">
                  <RichText value={requirement.instructions} compact />
                </div>
              </details>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
