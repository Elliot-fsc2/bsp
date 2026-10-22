import Link from "next/link";
import { createTopicAction } from "@/actions/community";
import { Modal } from "@/components/Modal";
import { RichTextEditor } from "@/components/RichTextEditor";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getForumList, getPrograms } from "@/lib/queries";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ForumsPage() {
  await requireUser();
  const [topics, programs] = await Promise.all([getForumList(), getPrograms()]);

  return (
    <div>
      <PageHeader
        eyebrow="Forums"
        title="The campfire lounge"
        text="Ask questions. Share tips. Celebrate your patrol."
        action={
          <Modal title="Start a thread" description="Ask the council a question." size="lg" trigger="Start a thread">
            <form action={createTopicAction} className="space-y-3">
              <input className="bloom-input" name="title" placeholder="A curious title" required />
              <select className="bloom-select" name="programId" defaultValue="">
                <option value="">Whole council</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
              <RichTextEditor name="body" minHeight={190} placeholder="Say the thing — add a list, attach a photo, be kind." />
              <button className="bloom-btn">Post it</button>
            </form>
          </Modal>
        }
      />

      <div className="mx-auto max-w-3xl grid gap-3">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/forums/${topic.id}`} className="bloom-card block p-5">
            <p className="sticker mb-2">{topic.programName ?? "Campfire lounge"}</p>
            <h2 className="font-display text-2xl">{topic.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {topic.authorName} · {topic.posts} posts · {relativeTime(topic.createdAt)}
            </p>
          </Link>
        ))}
        {topics.length === 0 ? <p className="bloom-card p-6 text-[var(--muted)]">No threads yet.</p> : null}
      </div>
    </div>
  );
}
