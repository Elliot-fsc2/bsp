import { ImageUrlField } from "@/components/ImageUrlField";

type ProgramOption = { id: number; name: string };
type CategoryOption = { id: number; name: string; icon: string };

type BadgeValues = {
  id: number;
  programId: number;
  categoryId: number | null;
  kind: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isMembership: boolean;
  position: number;
};

export function BadgeForm({
  action,
  badge,
  programs,
  categories,
  fixedProgramId,
  fixedKind,
  submitLabel,
  defaultPosition = 0,
}: {
  action: (formData: FormData) => void | Promise<void>;
  badge?: BadgeValues;
  programs: ProgramOption[];
  categories: CategoryOption[];
  fixedProgramId?: number;
  fixedKind?: "rank" | "merit";
  submitLabel: string;
  defaultPosition?: number;
}) {
  const nameField = (
    <input className="bloom-input" name="name" placeholder="Badge name" defaultValue={badge?.name ?? ""} required />
  );
  const kindField = (
    <select className="bloom-select" name="kind" defaultValue={badge?.kind ?? fixedKind ?? "rank"}>
      <option value="rank">Rank</option>
      <option value="merit">Merit badge</option>
    </select>
  );
  const programField = (
    <select className="bloom-select" name="programId" defaultValue={badge?.programId ?? ""} required>
      <option value="">Choose a program…</option>
      {programs.map((program) => (
        <option key={program.id} value={program.id}>
          {program.name}
        </option>
      ))}
    </select>
  );

  return (
    <form action={action} className="space-y-3">
      {fixedProgramId ? <input type="hidden" name="programId" value={fixedProgramId} /> : programField}
      {fixedKind ? <input type="hidden" name="kind" value={fixedKind} /> : kindField}
      {nameField}
      <input className="bloom-input" name="description" placeholder="Short description" defaultValue={badge?.description ?? ""} />
      <ImageUrlField
        name="imageUrl"
        label="Badge artwork"
        defaultValue={badge?.imageUrl ?? ""}
        placeholder="/images/badges/first-aid.svg"
        hint="Upload the official BSP artwork, or paste a path to a file in public/images/badges/."
      />
      <select className="bloom-select" name="categoryId" defaultValue={badge?.categoryId ?? ""}>
        <option value="">No category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.icon} {category.name}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="bloom-input"
          name="position"
          type="number"
          defaultValue={badge?.position ?? defaultPosition}
          placeholder="Order"
        />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="isMembership" defaultChecked={badge?.isMembership ?? false} /> Membership badge
        </label>
      </div>
      <button className="bloom-btn">{submitLabel}</button>
    </form>
  );
}
