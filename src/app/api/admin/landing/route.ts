import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { normalizeLandingContent } from "@/lib/landing";
import { removeImage, storeImage } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const IMAGE_SLOTS = ["hero", "companion", "registration"] as const;

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("Expected a form submission.", 400);
  }

  const form = await request.formData();
  const rawContent = form.get("content");
  let parsed: unknown = {};
  if (typeof rawContent === "string" && rawContent.trim()) {
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return jsonError("Could not read the landing content.", 400);
    }
  }

  const current = (await db.select().from(settings).limit(1))[0];
  const content = normalizeLandingContent(parsed);
  const existing = normalizeLandingContent(current?.landingContent);

  for (const slot of IMAGE_SLOTS) {
    const section = content[slot];
    const previous = existing[slot].image;

    if (form.get(`remove_${slot}`) === "1") {
      section.image = null;
      if (previous) await removeImage(previous);
      continue;
    }

    const file = form.get(slot);
    if (file instanceof File && file.size > 0) {
      try {
        section.image = await storeImage("banners", file);
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : "Could not upload the image.", 400);
      }
      if (previous) await removeImage(previous);
    } else {
      section.image = previous;
    }
  }

  if (current) {
    await db
      .update(settings)
      .set({ landingContent: content, updatedAt: new Date() })
      .where(eq(settings.id, current.id));
  } else {
    await db.insert(settings).values({ academyName: "DeMolay Nexus", landingContent: content });
  }

  return Response.json({ ok: true, content });
}
