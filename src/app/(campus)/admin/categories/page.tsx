import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/actions/admin";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/ui";
import { RichTextEditor } from "@/components/RichTextEditor";
import { requireRole } from "@/lib/auth";
import { getAllBadges, getBadgeCategories } from "@/lib/queries";
import { toPlainText } from "@/lib/richtext";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireRole(["admin"]);
  const [categories, badges] = await Promise.all([getBadgeCategories(), getAllBadges()]);

  return (
    <div>
      <PageHeader
        eyebrow="Council office"
        title="Advancement categories"
        text="Group badges into categories (Outdoor Skills, Safety, Citizenship, and so on)."
        action={
          <Modal title="New category" description="Add an advancement category." size="lg" trigger="Add category">
            <form action={createCategoryAction} className="space-y-3">
              <input className="bloom-input" name="name" placeholder="Category name" required />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="bloom-input" name="icon" defaultValue="⚜️" />
                <input className="bloom-input h-12" type="color" name="color" defaultValue="#2d6a4f" />
              </div>
              <RichTextEditor name="description" minHeight={120} placeholder="What kinds of badges belong here?" />
              <button className="bloom-btn">Add category</button>
            </form>
          </Modal>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.length === 0 ? (
          <p className="bloom-card p-6 text-[var(--muted)]">No categories yet.</p>
        ) : (
          categories.map((category) => {
            const count = badges.filter((badge) => badge.categoryId === category.id).length;
            return (
              <div key={category.id} className="bloom-card flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: `${category.color}33` }}>
                    {category.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{category.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {count} badge{count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <p className="line-clamp-2 text-sm text-[var(--muted)]">{toPlainText(category.description) || "No description"}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Modal
                    title={`Edit ${category.name}`}
                    size="lg"
                    trigger="Edit"
                    triggerClass="bloom-btn secondary"
                  >
                    <form action={updateCategoryAction.bind(null, category.id)} className="space-y-3">
                      <input className="bloom-input" name="name" defaultValue={category.name} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className="bloom-input" name="icon" defaultValue={category.icon} placeholder="Icon" />
                        <input className="bloom-input h-12" type="color" name="color" defaultValue={category.color} />
                      </div>
                      <RichTextEditor name="description" defaultValue={category.description ?? ""} minHeight={120} />
                      <button className="bloom-btn">Save category</button>
                    </form>
                  </Modal>

                  <Modal
                    title={`Delete ${category.name}?`}
                    description="Badges in this category will become uncategorised."
                    size="sm"
                    trigger="Delete"
                    triggerClass="bloom-btn ghost"
                  >
                    <form action={deleteCategoryAction.bind(null, category.id)}>
                      <button className="bloom-btn" style={{ background: "#c1121f" }}>
                        Yes, delete this category
                      </button>
                    </form>
                  </Modal>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
