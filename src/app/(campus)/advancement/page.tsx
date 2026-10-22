import Link from "next/link";
import { BadgeCard, PageHeader, RankLadder } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAdvancement, getAwardedBadges } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdvancementPage() {
  const user = await requireUser();
  const [{ programs, badges }, awarded] = await Promise.all([
    getAdvancement(user.id),
    getAwardedBadges(user.id),
  ]);
  const inProgress = badges.filter((badge) => !badge.earned && badge.satisfiedCount > 0);
  const readyToApply = badges.filter((badge) => badge.canApply);

  return (
    <div>
      <PageHeader
        eyebrow="Advancement"
        title="Your trail to the top"
        text="Choose a program, complete each requirement, and submit your proof. Every requirement needs two approvals: a Scout Leader, then a Council Admin."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/my-advancement" className="bloom-btn">
              🧭 What&apos;s left to do
            </Link>
            <Link href="/merit-badges" className="bloom-btn secondary">
              🎖️ Browse merit badges
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bloom-card p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Badges earned</p>
          <p className="font-display text-3xl">{awarded.length}</p>
        </div>
        <div className="bloom-card p-5">
          <p className="text-sm font-bold text-[var(--muted)]">In progress</p>
          <p className="font-display text-3xl">{inProgress.length}</p>
        </div>
        <div className="bloom-card p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Ready to submit</p>
          <p className="font-display text-3xl">{readyToApply.length}</p>
        </div>
        <div className="bloom-card p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Programs</p>
          <p className="font-display text-3xl">{programs.length}</p>
        </div>
      </div>

      {readyToApply.length > 0 ? (
        <section className="mb-6">
          <h2 className="font-display mb-3 text-2xl">Ready to submit for approval</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {readyToApply.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      ) : null}

      {awarded.length > 0 ? (
        <section className="mb-6">
          <h2 className="font-display mb-3 text-2xl">Earned badges</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {awarded.map((badge) => (
              <Link key={badge.id} href={`/advancement/badge/${badge.badgeId}`} className="bloom-card flex items-center gap-3 p-4">
                {badge.badgeImage ? (
                  <img src={badge.badgeImage} alt="" className="h-14 w-14" />
                ) : (
                  <span className="text-3xl">🎖️</span>
                )}
                <div>
                  <p className="font-extrabold">{badge.badgeName}</p>
                  <p className="text-xs font-bold text-[var(--muted)]">{badge.programName}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {programs.map((program) => {
        const ranks = badges
          .filter((badge) => badge.programId === program.id && badge.kind === "rank")
          .sort((a, b) => a.position - b.position);
        return (
          <section key={program.id} className={`mb-8 ${program.locked ? "opacity-80" : ""}`}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="sticker">Level {program.level}</span>
                  {program.complete ? <span className="sticker bg-[#d8f3dc]">Program complete</span> : null}
                  {program.locked ? <span className="sticker bg-[#ffe0e8]">🔒 Locked</span> : null}
                </p>
                <h2 className="font-display text-2xl">
                  {program.icon} {program.name}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  {program.ageRange} · {program.ranksEarned}/{program.ranksTotal} ranks earned
                </p>
              </div>
              {program.locked ? null : (
                <Link href={`/advancement/${program.slug}`} className="text-sm font-extrabold text-[var(--secondary)]">
                  Program details →
                </Link>
              )}
            </div>
            {program.locked ? (
              <p className="bloom-card mb-3 p-3 text-sm font-bold text-[var(--muted)]">
                🔒 Level {program.level} opens when you finish <strong>{program.lockedByName}</strong>. You can see the
                trail ahead, but it is not open yet.
              </p>
            ) : null}
            <h3 className="mb-2 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
              Ranks — earn them in order
            </h3>
            <RankLadder ranks={ranks} disabled={program.locked} />
          </section>
        );
      })}
    </div>
  );
}
