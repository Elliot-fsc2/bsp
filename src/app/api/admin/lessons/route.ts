import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { removeImage, storeImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const id = Number(form.get("id"));
    const deleteFlag = form.get("delete") === "true";

    if (deleteFlag && id) {
      const lesson = (await db.select().from(lessons).where(eq(lessons.id, id)).limit(1))[0];
      if (lesson?.coverFilename) await removeImage(lesson.coverFilename);
      await db.delete(lessons).where(eq(lessons.id, id));
      return Response.json({ ok: true });
    }

    const levelId = Number(form.get("levelId"));
    const title = (form.get("title") as string)?.trim() || "Untitled lesson";
    const content = (form.get("content") as string) ?? "";
    const videoUrl = (form.get("videoUrl") as string)?.trim() || null;
    const embedCode = (form.get("embedCode") as string)?.trim() || null;
    const sortOrder = Number(form.get("sortOrder") ?? 0);
    const isPublished = form.get("isPublished") === "true";
    const file = form.get("image");

    if (id) {
      const lesson = (await db.select().from(lessons).where(eq(lessons.id, id)).limit(1))[0];
      let coverFilename = lesson?.coverFilename ?? null;

      if (file instanceof File && file.size > 0) {
        try {
          const stored = await storeImage("lessons", file);
          if (lesson?.coverFilename) await removeImage(lesson.coverFilename);
          coverFilename = stored;
        } catch (err) {
          return jsonError(err instanceof Error ? err.message : "Could not upload image.", 400);
        }
      }

      await db
        .update(lessons)
        .set({
          levelId,
          title,
          content,
          videoUrl,
          embedCode,
          sortOrder,
          isPublished,
          coverFilename,
          updatedAt: new Date(),
        })
        .where(eq(lessons.id, id));

      return Response.json({ ok: true, id, coverFilename });
    }

    let coverFilename: string | null = null;
    if (file instanceof File && file.size > 0) {
      try {
        coverFilename = await storeImage("lessons", file);
      } catch (err) {
        return jsonError(err instanceof Error ? err.message : "Could not upload image.", 400);
      }
    }

    const [{ id: createdId }] = await db
      .insert(lessons)
      .values({
        levelId,
        title,
        content,
        videoUrl,
        embedCode,
        sortOrder,
        isPublished,
        coverFilename,
      })
      .$returningId();

    return Response.json({ ok: true, id: createdId, coverFilename });
  }

  const body = (await request.json()) as {
    id?: number;
    levelId?: number;
    title?: string;
    content?: string;
    videoUrl?: string;
    embedCode?: string;
    sortOrder?: number;
    isPublished?: boolean;
    delete?: boolean;
  };

  if (body.delete && body.id) {
    const lesson = (await db.select().from(lessons).where(eq(lessons.id, body.id)).limit(1))[0];
    if (lesson?.coverFilename) await removeImage(lesson.coverFilename);
    await db.delete(lessons).where(eq(lessons.id, body.id));
    return Response.json({ ok: true });
  }

  if (body.id) {
    await db
      .update(lessons)
      .set({
        levelId: Number(body.levelId),
        title: body.title?.trim() || "Untitled lesson",
        content: body.content ?? "",
        videoUrl: body.videoUrl?.trim() || null,
        embedCode: body.embedCode?.trim() || null,
        sortOrder: Number(body.sortOrder ?? 0),
        isPublished: body.isPublished !== false,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, body.id));
    return Response.json({ ok: true, id: body.id });
  }

  const [{ id: createdId }] = await db
    .insert(lessons)
    .values({
      levelId: Number(body.levelId),
      title: body.title?.trim() || "Untitled lesson",
      content: body.content ?? "",
      videoUrl: body.videoUrl?.trim() || null,
      embedCode: body.embedCode?.trim() || null,
      sortOrder: Number(body.sortOrder ?? 0),
      isPublished: body.isPublished !== false,
    })
    .$returningId();

  return Response.json({ ok: true, id: createdId });
}
