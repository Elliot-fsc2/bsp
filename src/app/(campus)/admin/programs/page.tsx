import { createProgramAction, createSectionAction } from "@/actions/admin";
import { Modal } from "@/components/Modal";
import { ProgramList, type ProgramListItem, type ProgramSectionItem } from "@/components/ProgramList";
import { PageHeader } from "@/components/ui";
import { RichTextEditor } from "@/components/RichTextEditor";
import { requireRole } from "@/lib/auth";
import { getAdminPrograms, getAllBadges, getProgramSections } from "@/lib/queries";
import { toPlainText } from "@/lib/richtext";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage() {
  await requireRole(["admin"]);
  const [programs, badges, sections] = await Promise.all([
    getAdminPrograms(),
    getAllBadges(),
    getProgramSections(),
  ]);

  const sectionOptions: ProgramSectionItem[] = sections.map((section) => ({
    id: section.id,
    name: section.name,
    ageRange: section.ageRange,
  }));
  const sectionOrder = new Map(sectionOptions.map((section, index) => [section.id, index]));

  const items: ProgramListItem[] = programs
    .map((program) => {
      const programBadges = badges.filter((badge) => badge.programId === program.id);
      return {
        id: program.id,
        name: program.name,
        sectionId: program.sectionId,
        section: program.section,
        ageRange: program.ageRange,
        icon: program.icon,
        color: program.color,
        description: program.description,
        descriptionText: toPlainText(program.description),
        rankCount: programBadges.filter((badge) => badge.kind === "rank").length,
        meritCount: programBadges.filter((badge) => badge.kind === "merit").length,
      };
    })
    .sort((a, b) => {
      const aOrder = a.sectionId === null ? sectionOptions.length : sectionOrder.get(a.sectionId) ?? sectionOptions.length;
      const bOrder = b.sectionId === null ? sectionOptions.length : sectionOrder.get(b.sectionId) ?? sectionOptions.length;
      return aOrder - bOrder;
    });

  return (
    <div>
      <PageHeader
        eyebrow="Council office"
        title="Programs"
        text="Programs are levels, grouped under a section. A Scout can see every level, but a level only opens once the level before it is finished."
        action={
          <div className="flex flex-wrap gap-2">
            <Modal
              title="New section"
              description="A section groups programs and sets their age range."
              size="lg"
              trigger="Add section"
              triggerClass="bloom-btn secondary"
            >
              <form action={createSectionAction} className="space-y-3">
                <input className="bloom-input" name="name" placeholder="Section name" required />
                <input className="bloom-input" name="ageRange" placeholder="Age range (e.g. 10-12 years)" />
                <button className="bloom-btn">Add section</button>
              </form>
            </Modal>

            <Modal title="New program" description="Add a Scouting program." size="lg" trigger="Add program">
              <form action={createProgramAction} className="space-y-3">
                <input className="bloom-input" name="name" placeholder="Program name" required />
                <select className="bloom-select" name="sectionId" defaultValue="">
                  <option value="">No section</option>
                  {sectionOptions.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="bloom-input" name="icon" defaultValue="⚜️" />
                  <input className="bloom-input h-12" type="color" name="color" defaultValue="#2d6a4f" />
                </div>
                <RichTextEditor name="description" minHeight={120} placeholder="What is this program about?" />
                <button className="bloom-btn">Add program</button>
              </form>
            </Modal>
          </div>
        }
      />

      <p className="bloom-card mb-3 p-3 text-sm font-bold text-[var(--muted)]">
        Programs are grouped by section. Drag the handle on the left of a program to change the level order.
      </p>

      {items.length === 0 && sectionOptions.length === 0 ? (
        <p className="bloom-card p-6 text-[var(--muted)]">No programs yet. Add a section, then add your first level.</p>
      ) : (
        <ProgramList programs={items} sections={sectionOptions} />
      )}
    </div>
  );
}
