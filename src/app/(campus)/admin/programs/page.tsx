import { createProgramAction } from "@/actions/admin";
import { Modal } from "@/components/Modal";
import { ProgramList, type ProgramListItem } from "@/components/ProgramList";
import { PageHeader } from "@/components/ui";
import { RichTextEditor } from "@/components/RichTextEditor";
import { requireRole } from "@/lib/auth";
import { getAdminPrograms, getAllBadges } from "@/lib/queries";
import { toPlainText } from "@/lib/richtext";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage() {
  await requireRole(["admin"]);
  const [programs, badges] = await Promise.all([getAdminPrograms(), getAllBadges()]);

  const items: ProgramListItem[] = programs.map((program) => {
    const programBadges = badges.filter((badge) => badge.programId === program.id);
    return {
      id: program.id,
      name: program.name,
      section: program.section,
      ageRange: program.ageRange,
      icon: program.icon,
      color: program.color,
      description: program.description,
      descriptionText: toPlainText(program.description),
      rankCount: programBadges.filter((badge) => badge.kind === "rank").length,
      meritCount: programBadges.filter((badge) => badge.kind === "merit").length,
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Council office"
        title="Programs"
        text="Programs are levels. A Scout can see every level, but a level only opens once the level before it is finished."
        action={
          <Modal title="New program" description="Add a Scouting program." size="lg" trigger="Add program">
            <form action={createProgramAction} className="space-y-3">
              <input className="bloom-input" name="name" placeholder="Program name" required />
              <input className="bloom-input" name="section" placeholder="Section" />
              <input className="bloom-input" name="ageRange" placeholder="Age range (e.g. 10-12 years)" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="bloom-input" name="icon" defaultValue="⚜️" />
                <input className="bloom-input h-12" type="color" name="color" defaultValue="#2d6a4f" />
              </div>
              <RichTextEditor name="description" minHeight={120} placeholder="What is this program about?" />
              <button className="bloom-btn">Add program</button>
            </form>
          </Modal>
        }
      />

      <p className="bloom-card mb-3 p-3 text-sm font-bold text-[var(--muted)]">
        Drag the handle on the left of a program to change the level order.
      </p>

      {items.length === 0 ? (
        <p className="bloom-card p-6 text-[var(--muted)]">No programs yet. Add your first level.</p>
      ) : (
        <ProgramList programs={items} />
      )}
    </div>
  );
}
