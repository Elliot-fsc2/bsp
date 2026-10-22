import Link from "next/link";
import { notFound } from "next/navigation";
import { createBadgeAction, deleteBadgeAction, moveBadgeAction, updateBadgeAction } from "@/actions/admin";
import { BadgeForm } from "@/components/BadgeForm";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAllBadges, getBadgeCategories, getProgramById } from "@/lib/queries";

export const dynamic = "force-dynamic";

type BadgeItem = Awaited<ReturnType<typeof getAllBadges>>[number];

function RankRow({
  badge,
  index,
  total,
  programId,
  programs,
  categories,
}: {
  badge: BadgeItem;
  index: number;
  total: number;
  programId: number;
  programs: { id: number; name: string }[];
  categories: { id: number; name: string; icon: string }[];
}) {
  return (
    <div className="bloom-card flex flex-wrap items-center gap-3 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-extrabold">{index + 1}</span>
      {badge.imageUrl ? <img src={badge.imageUrl} alt="" className="h-10 w-10" /> : <span className="text-2xl">⚜️</span>}
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">
          {badge.name}
          {badge.isMembership ? <span className="chip ml-2 text-[10px]">Membership</span> : null}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {badge.categoryName ?? "Uncategorised"} · {Number(badge.requirementCount)} requirements
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <form action={moveBadgeAction.bind(null, badge.id, "up")}>
          <button className="chip" disabled={index === 0} aria-label="Move up">
            ↑
          </button>
        </form>
        <form action={moveBadgeAction.bind(null, badge.id, "down")}>
          <button className="chip" disabled={index === total - 1} aria-label="Move down">
            ↓
          </button>
        </form>
        <Link href={`/admin/badges/${badge.id}`} className="bloom-btn secondary">
          Requirements
        </Link>
        <Modal title={`Edit ${badge.name}`} size="lg" trigger="Edit" triggerClass="bloom-btn secondary">
          <BadgeForm
            action={updateBadgeAction.bind(null, badge.id)}
            badge={badge}
            programs={programs}
            categories={categories}
            fixedProgramId={programId}
            fixedKind="rank"
            submitLabel="Save rank"
          />
        </Modal>
        <Modal
          title={`Delete ${badge.name}?`}
          description="This removes the rank, its requirements, and all Scout submissions for it."
          size="sm"
          trigger="Delete"
          triggerClass="bloom-btn ghost"
        >
          <form action={deleteBadgeAction.bind(null, badge.id, `/admin/programs/${programId}`)}>
            <button className="bloom-btn" style={{ background: "#c1121f" }}>
              Yes, delete this rank
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}

export default async function AdminProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const programId = Number(id);
  await requireRole(["admin"]);
  const [program, badges, categories] = await Promise.all([
    getProgramById(programId),
    getAllBadges(),
    getBadgeCategories(),
  ]);
  if (!program) notFound();

  const ranks = badges
    .filter((badge) => badge.programId === program.id && badge.kind === "rank")
    .sort((a, b) => a.position - b.position || a.id - b.id);
  const nextRankPosition = ranks.length ? ranks[ranks.length - 1].position + 10 : 100;

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/programs" className="text-sm font-extrabold text-[var(--secondary)]">
          ← Back to programs
        </Link>
      </div>

      <PageHeader
        eyebrow={program.section ?? "Program"}
        title={`${program.icon} ${program.name}`}
        text={`${program.ageRange ?? ""} · ${ranks.length} ranks`}
        action={
          <Modal title="Add rank" description={`A new rank in the ${program.name} ladder.`} size="lg" trigger="Add rank">
            <BadgeForm
              action={createBadgeAction}
              programs={[program]}
              categories={categories}
              fixedProgramId={program.id}
              fixedKind="rank"
              submitLabel="Add rank"
              defaultPosition={nextRankPosition}
            />
          </Modal>
        }
      />

      <section>
        <h2 className="font-display mb-1 text-2xl">Ranks</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          The ladder, top to bottom — Scouts must finish each rank before the next unlocks. Use ↓ ↑ to reorder.
        </p>
        <div className="space-y-2">
          {ranks.length === 0 ? (
            <p className="bloom-card p-5 text-[var(--muted)]">No ranks yet. Add the Membership Rank first.</p>
          ) : (
            ranks.map((badge, index) => (
              <RankRow
                key={badge.id}
                badge={badge}
                index={index}
                total={ranks.length}
                programId={program.id}
                programs={[program]}
                categories={categories}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
