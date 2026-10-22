import Link from "next/link";
import { BadgeForm } from "@/components/BadgeForm";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { createBadgeAction } from "@/actions/admin";
import { getAllBadges, getAdminPrograms, getBadgeCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminBadgesPage() {
  await requireRole(["admin"]);
  const [programs, badges, categories] = await Promise.all([getAdminPrograms(), getAllBadges(), getBadgeCategories()]);
  const meritPositions = badges.filter((badge) => badge.kind === "merit").map((badge) => badge.position);
  const nextMeritPosition = meritPositions.length ? Math.max(...meritPositions) + 10 : 10;

  return (
    <div>
      <PageHeader
        eyebrow="Council office"
        title="All badges"
        text="Every rank and merit badge across the council. Ranks are added under their program; merit badges are added here."
        action={
          <Modal title="Add merit badge" description="A merit badge Scouts earn on their own." size="lg" trigger="Add merit badge">
            <BadgeForm
              action={createBadgeAction}
              programs={programs}
              categories={categories}
              fixedKind="merit"
              submitLabel="Add merit badge"
              defaultPosition={nextMeritPosition}
            />
          </Modal>
        }
      />

      {programs.map((program) => {
        const programBadges = badges.filter((badge) => badge.programId === program.id);
        if (programBadges.length === 0) return null;
        return (
          <section key={program.id} className="mb-6">
            <h2 className="font-display mb-2 text-xl">
              {program.icon} {program.name}
            </h2>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {programBadges.map((badge) => (
                <Link key={badge.id} href={`/admin/badges/${badge.id}`} className="bloom-card flex items-center gap-3 p-3">
                  {badge.imageUrl ? <img src={badge.imageUrl} alt="" className="h-10 w-10" /> : <span className="text-xl">🎖️</span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{badge.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {badge.kind === "merit" ? "Merit badge" : badge.isMembership ? "Rank · Membership" : "Rank"} ·{" "}
                      {badge.categoryName ?? "Uncategorised"} · {Number(badge.requirementCount)} requirements
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-[var(--secondary)]">Manage →</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
