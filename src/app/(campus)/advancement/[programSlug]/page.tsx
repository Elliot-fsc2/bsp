import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, RankLadder } from "@/components/ui";
import { RichText } from "@/components/RichText";
import { requireUser } from "@/lib/auth";
import { getAdvancement, getProgramBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProgramPage({ params }: { params: Promise<{ programSlug: string }> }) {
  const { programSlug } = await params;
  const user = await requireUser();
  const program = await getProgramBySlug(programSlug);
  if (!program) notFound();

  const { programs, badges } = await getAdvancement(user.id);
  const entry = programs.find((row) => row.id === program.id);
  const locked = entry?.locked ?? false;
  const ranks = badges
    .filter((badge) => badge.programId === program.id && badge.kind === "rank")
    .sort((a, b) => a.position - b.position || a.id - b.id);

  return (
    <div>
      <PageHeader
        eyebrow={program.section ?? "Scouting program"}
        title={`${program.icon} ${program.name}`}
        text={program.ageRange ?? undefined}
      />
      <div className="mb-6 max-w-3xl text-[var(--muted)]">
        <RichText value={program.description} />
      </div>

      {locked ? (
        <p className="bloom-card mb-5 p-5 font-bold">
          🔒 This is level {entry?.level} of your advancement trail and it is not open yet. Finish{" "}
          <strong>{entry?.lockedByName}</strong> first — you can look at the trail ahead, but you cannot start it yet.
        </p>
      ) : null}

      <section className="mb-8">
        <h2 className="font-display mb-1 text-2xl">Rank ladder</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Ranks are earned in order. The next rank stays locked until you finish the one before it.
        </p>
        <RankLadder ranks={ranks} disabled={locked} />
      </section>

      {locked ? null : (
        <p className="bloom-card p-5 text-sm">
          🎖️ Merit badges are separate from the rank ladder and can be earned in any order.{" "}
          <Link href="/merit-badges" className="font-extrabold text-[var(--secondary)]">
            Browse all merit badges →
          </Link>
        </p>
      )}
    </div>
  );
}
