import { createAnnouncementAction } from "@/actions/community";
import { Modal } from "@/components/Modal";
import { RichText } from "@/components/RichText";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Avatar, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPrograms, getSiteAnnouncements } from "@/lib/queries";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await requireUser();
  const [items, programs] = await Promise.all([getSiteAnnouncements(), getPrograms()]);

  return (
    <div>
      <PageHeader
        eyebrow="News"
        title="Council noticeboard"
        text="Pinned notes sit at the top like gold stars."
        action={
          user.role !== "student" ? (
            <Modal title="Post news" description="Share a note with the council." size="lg" trigger="Post news">
              <form action={createAnnouncementAction} className="space-y-3">
                <input className="bloom-input" name="title" required placeholder="Headline" />
                <select className="bloom-select" name="programId" defaultValue="">
                  <option value="">Whole council</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                <RichTextEditor name="body" minHeight={200} placeholder="The note itself — bold a date, add a list, attach a photo." />
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" name="pinned" /> Pin this
                </label>
                <button className="bloom-btn">Publish</button>
              </form>
            </Modal>
          ) : null
        }
      />

      <div className="mx-auto max-w-3xl space-y-3">
        {items.map((item) => (
          <article key={item.id} className="bloom-card p-5">
            {item.pinned ? <p className="sticker mb-2">Pinned</p> : null}
            <div className="mb-2 flex items-center gap-2">
              <Avatar name={item.authorName} color={item.authorColor} size={32} />
              <span className="text-sm font-extrabold">{item.authorName}</span>
              <span className="text-xs text-[var(--muted)]">{relativeTime(item.createdAt)}</span>
            </div>
            <h2 className="font-display text-2xl">{item.title}</h2>
            <RichText value={item.body} className="mt-2" />
            <p className="mt-2 text-xs font-bold text-[var(--muted)]">{item.programName ?? "Whole council"}</p>
          </article>
        ))}
        {items.length === 0 ? <p className="bloom-card p-6 text-[var(--muted)]">No news yet.</p> : null}
      </div>
    </div>
  );
}
