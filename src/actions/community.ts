"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { announcements, forumPosts, forumTopics, notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { normalizeRich } from "@/lib/richtext";

export async function createAnnouncementAction(formData: FormData) {
  const user = await requireUser();
  if (user.role === "student") return;
  const title = String(formData.get("title") ?? "").trim();
  const body = normalizeRich(formData.get("body"));
  const programId = Number(formData.get("programId") || 0) || null;
  if (!title || !body) return;
  await db.insert(announcements).values({
    title,
    body,
    programId,
    authorId: user.id,
    pinned: String(formData.get("pinned") ?? "") === "on",
  });
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
}

export async function createTopicAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const body = normalizeRich(formData.get("body"));
  const programId = Number(formData.get("programId") || 0) || null;
  if (!title || !body) return;
  const [{ id: topicId }] = await db.insert(forumTopics).values({ title, programId, authorId: user.id }).$returningId();
  await db.insert(forumPosts).values({ topicId, authorId: user.id, body });
  revalidatePath("/forums");
  redirect(`/forums/${topicId}`);
}

export async function createPostAction(topicId: number, formData: FormData) {
  const user = await requireUser();
  const body = normalizeRich(formData.get("body"));
  if (!body) return;
  await db.insert(forumPosts).values({ topicId, authorId: user.id, body });
  revalidatePath(`/forums/${topicId}`);
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  revalidatePath("/dashboard");
}
