import { PageHeader } from "@/components/ui";
import { MeritBadgeBrowser } from "@/components/MeritBadgeBrowser";
import { requireUser } from "@/lib/auth";
import { getAdvancement } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MeritBadgesPage() {
  const user = await requireUser();
  const { badges, programs } = await getAdvancement(user.id);
  const merits = badges.filter((badge) => badge.kind === "merit");

  return (
    <div>
      <PageHeader
        eyebrow="Merit badges"
        title="Merit badge catalogue"
        text="Merit badges are earned on their own, in any order — they are not part of a rank ladder. Finish every task inside a badge, then submit it for approval. Some ranks also require a merit badge before you can finish them."
      />
      <MeritBadgeBrowser badges={merits} programs={programs.map((program) => ({ id: program.id, name: program.name }))} />
    </div>
  );
}
