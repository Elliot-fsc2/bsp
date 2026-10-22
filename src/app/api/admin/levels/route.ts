import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { levels } from "@/db/schema";
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
    if (!id) return jsonError("Level id required.", 400);
    const name = (form.get("name") as string)?.trim() || "Untitled level";
    const description = (form.get("description") as string) ?? "";
    const requiredScore = Number(form.get("requiredScore") ?? 70);
    const studyDays = Number(form.get("studyDays") ?? 7);
    const examDays = Number(form.get("examDays") ?? 3);
    const isActive = form.get("isActive") === "true";
    const file = form.get("image");

    const level = (await db.select().from(levels).where(eq(levels.id, id)).limit(1))[0];
    let coverFilename = level?.coverFilename ?? null;

    if (file instanceof File && file.size > 0) {
      try {
        const stored = await storeImage("levels", file);
        if (level?.coverFilename) await removeImage(level.coverFilename);
        coverFilename = stored;
      } catch (err) {
        return jsonError(err instanceof Error ? err.message : "Could not upload image.", 400);
      }
    }

    await db
      .update(levels)
      .set({ name, description, requiredScore, studyDays, examDays, isActive, coverFilename })
      .where(eq(levels.id, id));

    return Response.json({ ok: true, coverFilename });
  }

  const body = (await request.json()) as {
    id?: number;
    name?: string;
    description?: string;
    requiredScore?: number;
    studyDays?: number;
    examDays?: number;
    isActive?: boolean;
  };

  if (!body.id) return jsonError("Level id required.", 400);

  await db
    .update(levels)
    .set({
      name: body.name?.trim() || "Untitled level",
      description: body.description ?? "",
      requiredScore: Number(body.requiredScore ?? 70),
      studyDays: Number(body.studyDays ?? 7),
      examDays: Number(body.examDays ?? 3),
      isActive: body.isActive !== false,
    })
    .where(eq(levels.id, body.id));

  return Response.json({ ok: true });
}
