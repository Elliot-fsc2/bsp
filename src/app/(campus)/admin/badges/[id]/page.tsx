import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBadgeAction, deleteRequirementAction, updateBadgeAction } from "@/actions/admin";
import { AdminRequirementForm } from "@/components/AdminRequirementForm";
import { BadgeForm } from "@/components/BadgeForm";
import { MeritRequirementPicker } from "@/components/MeritRequirementPicker";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import {
  getAdminPrograms,
  getBadgeCategories,
  getBadgeWithRequirements,
  getMeritRequirementUsage,
  getRequirementOptions,
} from "@/lib/queries";
import type { QuizQuestion } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseQuiz(value: string | null): QuizQuestion[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as QuizQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function AdminBadgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const badgeId = Number(id);
  await requireRole(["admin"]);
  const [data, programs, badgeOptions, categories, meritUsage] = await Promise.all([
    getBadgeWithRequirements(badgeId),
    getAdminPrograms(),
    getRequirementOptions(),
    getBadgeCategories(),
    getMeritRequirementUsage(),
  ]);
  if (!data) notFound();
  const { badge, requirements } = data;
  const meritBadges = badgeOptions
    .filter((option) => option.kind === "merit")
    .map((option) => ({ id: option.id, name: option.name, programName: option.programName, imageUrl: option.imageUrl }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/badges" className="text-sm font-extrabold text-[var(--secondary)]">
          ← Back to badges
        </Link>
      </div>

      <PageHeader
        eyebrow={`${badge.programName} · ${badge.kind === "merit" ? "Merit badge" : "Rank"}`}
        title={badge.name}
        text={badge.description ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <Modal title={`Edit ${badge.name}`} size="lg" trigger="Edit badge" triggerClass="bloom-btn secondary">
              <BadgeForm
                action={updateBadgeAction.bind(null, badge.id)}
                badge={badge}
                programs={programs}
                categories={categories}
                fixedProgramId={badge.programId}
                fixedKind={badge.kind === "merit" ? "merit" : "rank"}
                submitLabel="Save badge"
              />
            </Modal>

            <Modal
              title={`Delete ${badge.name}?`}
              description="This removes the badge, its requirements, and all Scout submissions for it."
              size="sm"
              trigger="Delete badge"
              triggerClass="bloom-btn ghost"
            >
              <form action={deleteBadgeAction.bind(null, badge.id, "/admin/badges")}>
                <button className="bloom-btn" style={{ background: "#c1121f" }}>
                  Yes, delete this badge
                </button>
              </form>
            </Modal>
          </div>
        }
      />

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Requirements ({requirements.length})</h2>
          <div className="flex flex-wrap gap-2">
            {badge.kind === "rank" ? (
              <Modal
                title="Add merit badge requirement"
                description={`Pick a merit badge that ${badge.name} will require.`}
                size="lg"
                trigger="Add merit badge"
                triggerClass="bloom-btn secondary"
              >
                <MeritRequirementPicker
                  badgeId={badge.id}
                  meritBadges={meritBadges}
                  usedIds={meritUsage[badge.id] ?? []}
                />
              </Modal>
            ) : null}
            <Modal
              title="Add requirement"
              description={`New requirement for ${badge.name}.`}
              size="lg"
              trigger="Add requirement"
            >
              <AdminRequirementForm badgeId={badge.id} badgeOptions={badgeOptions} />
            </Modal>
          </div>
        </div>
        <div className="space-y-2">
          {requirements.length === 0 ? (
            <p className="bloom-card p-5 text-[var(--muted)]">No requirements yet. Add the first one.</p>
          ) : (
            requirements.map((requirement, index) => (
              <div key={requirement.id} className="bloom-card flex flex-wrap items-center gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white font-extrabold">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{requirement.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {requirement.type}
                    {requirement.requiresMedia ? ` · ${requirement.mediaKind}` : ""}
                    {requirement.quizJson ? " · quiz" : ""}
                    {requirement.requiredBadgeId ? " · requires another badge" : ""} · {requirement.points} pts
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Modal
                    title="Edit requirement"
                    description={requirement.title}
                    size="lg"
                    trigger="Edit"
                    triggerClass="bloom-btn secondary"
                  >
                    <AdminRequirementForm
                      badgeId={badge.id}
                      badgeOptions={badgeOptions}
                      requirement={{
                        id: requirement.id,
                        title: requirement.title,
                        description: requirement.description,
                        instructions: requirement.instructions,
                        type: requirement.type,
                        position: requirement.position,
                        points: requirement.points,
                        requiresText: requirement.requiresText,
                        requiresMedia: requirement.requiresMedia,
                        mediaKind: requirement.mediaKind,
                        requiresLink: requirement.requiresLink,
                        quiz: parseQuiz(requirement.quizJson),
                        requiredBadgeId: requirement.requiredBadgeId,
                      }}
                    />
                  </Modal>

                  <Modal
                    title="Delete requirement?"
                    description={requirement.title}
                    size="sm"
                    trigger="Delete"
                    triggerClass="bloom-btn ghost"
                  >
                    <form action={deleteRequirementAction.bind(null, requirement.id)}>
                      <button className="bloom-btn" style={{ background: "#c1121f" }}>
                        Yes, delete this requirement
                      </button>
                    </form>
                  </Modal>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
