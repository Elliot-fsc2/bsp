import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonProgress, lessons } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.accountStatus !== "active") return jsonError("Forbidden", 403);
  const { id } = await context.params;
  const lessonId = Number(id);
  const lesson = (await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1))[0];
  if (!lesson) return jsonError("Lesson not found.", 404);

  const existing = (
    await db
      .select({ id: lessonProgress.id })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lessonId)))
      .limit(1)
  )[0];

  if (!existing) {
    await db.insert(lessonProgress).values({ userId: user.id, lessonId });
  }

  return Response.json({ ok: true });
}
