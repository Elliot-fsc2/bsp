import { notFound } from "next/navigation";
import { createPostAction } from "@/actions/community";
import { Modal } from "@/components/Modal";
import { RichText } from "@/components/RichText";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Avatar, PageHeader, RoleBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getForumTopic } from "@/lib/queries";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ForumTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const data = await getForumTopic(Number(id));
  if (!data) notFound();
  const reply = createPostAction.bind(null, data.topic.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={data.topic.programName ?? "Campfire lounge"}
        title={data.topic.title}
        text={`Started by ${data.topic.authorName}`}
        action={
          <Modal title="Reply" description={`Replying to ${data.topic.title}`} size="lg" trigger="Reply">
            <form action={reply} className="space-y-3">
              <RichTextEditor name="body" minHeight={180} placeholder="Add to the conversation" />
              <button className="bloom-btn">Send</button>
            </form>
          </Modal>
        }
      />
      <div className="space-y-3">
        {data.posts.map((post) => (
          <article key={post.id} className="bloom-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <Avatar name={post.authorName} color={post.authorColor} size={40} />
              <div>
                <p className="font-extrabold">{post.authorName}</p>
                <RoleBadge role={post.authorRole} />
              </div>
              <span className="ml-auto text-xs font-bold text-[var(--muted)]">{relativeTime(post.createdAt)}</span>
            </div>
            <RichText value={post.body} />
          </article>
        ))}
      </div>
    </div>
  );
}
