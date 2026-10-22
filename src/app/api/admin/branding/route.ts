import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { isBrandAssetKind, removeBrandAsset, storeBrandAsset } from "@/lib/branding";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  const form = await request.formData();
  const kind = form.get("kind");
  const file = form.get("file");
  if (!isBrandAssetKind(kind)) return jsonError("Choose a valid brand asset.", 400);
  if (!(file instanceof File)) return jsonError("Select an image to upload.", 400);

  let filename: string;
  try {
    filename = await storeBrandAsset(kind, file);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not upload the image.", 400);
  }

  try {
    const current = (await db.select().from(settings).limit(1))[0];
    const oldFilename = kind === "logo" ? current?.logoFilename : current?.faviconFilename;
    const values = kind === "logo" ? { logoFilename: filename } : { faviconFilename: filename };
    if (current) {
      await db.update(settings).set({ ...values, updatedAt: new Date() }).where(eq(settings.id, current.id));
    } else {
      await db.insert(settings).values({ academyName: "DeMolay Nexus", ...values });
    }
    await removeBrandAsset(oldFilename);
    return Response.json({ ok: true, filename, url: `/api/branding/${kind}?v=${Date.now()}` });
  } catch (error) {
    await removeBrandAsset(filename);
    console.error("Brand upload failed:", error);
    return jsonError("Could not save the image. Please try again.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return jsonError("Forbidden", 403);

  const { kind } = (await request.json()) as { kind?: string };
  if (!isBrandAssetKind(kind)) return jsonError("Choose a valid brand asset.", 400);
  const current = (await db.select().from(settings).limit(1))[0];
  if (!current) return jsonError("Settings not found.", 404);
  const oldFilename = kind === "logo" ? current.logoFilename : current.faviconFilename;
  const values = kind === "logo" ? { logoFilename: null } : { faviconFilename: null };
  await db.update(settings).set({ ...values, updatedAt: new Date() }).where(eq(settings.id, current.id));
  await removeBrandAsset(oldFilename);
  return Response.json({ ok: true, url: `/api/branding/${kind}?v=${Date.now()}` });
}
