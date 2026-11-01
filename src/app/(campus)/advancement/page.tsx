import Link from "next/link";
import { AdvancementRanks, type AdvancementProgram } from "@/components/AdvancementRanks";
import { BadgeImage } from "@/components/BadgeImage";
import { BadgeCard, type BadgeCardData, PageHeader } from "@/components/ui";
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

  const rankCards: BadgeCardData[] = badges
    .filter((badge) => badge.kind === "rank")
    .map((badge) => ({
      id: badge.id,
      name: badge.name,
      kind: badge.kind,
      description: badge.description,
      imageUrl: badge.imageUrl,
      isMembership: badge.isMembership,
      programId: badge.programId,
      programName: badge.programName,
      programColor: badge.programColor,
      programIcon: badge.programIcon,
      categoryName: badge.categoryName,
      categoryColor: badge.categoryColor,
      categoryIcon: badge.categoryIcon,
      rankStep: badge.rankStep,
      rankCount: badge.rankCount,
      locked: badge.locked,
      lockedByName: badge.lockedByName,
      canApply: badge.canApply,
      requiredBy: badge.requiredBy.map((rank) => ({ id: rank.id, name: rank.name })),
      satisfiedCount: badge.satisfiedCount,
      totalCount: badge.totalCount,
      percent: badge.percent,
      earned: badge.earned,
      applicationStatus: badge.applicationStatus,
    }));

  const programOptions: AdvancementProgram[] = programs.map((program) => ({
    id: program.id,
    name: program.name,
    icon: program.icon,
    slug: program.slug,
    ageRange: program.ageRange,
    level: program.level,
    locked: program.locked,
    lockedByName: program.lockedByName,
    complete: program.complete,
    ranksEarned: program.ranksEarned,
    ranksTotal: program.ranksTotal,
  }));

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
                <BadgeImage src={badge.badgeImage} className="h-14 w-14" fallback={<span className="text-3xl">🎖️</span>} />
                <div>
                  <p className="font-extrabold">{badge.badgeName}</p>
                  <p className="text-xs font-bold text-[var(--muted)]">{badge.programName}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <AdvancementRanks programs={programOptions} ranks={rankCards} />
    </div>
  );
}
