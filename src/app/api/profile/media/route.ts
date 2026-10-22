import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { removeImage, storeImage } from "@/lib/uploads";
import { isMemberRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current || !isMemberRole(current.role)) return jsonError("Unauthorized", 401);
  const form = await request.formData();
  const kind = form.get("kind");
  const file = form.get("file");
  if (kind !== "profile" && kind !== "cover") return jsonError("Choose a profile or cover photo.", 400);
  if (!(file instanceof File) || file.size === 0) return jsonError("Select a photo to upload.", 400);
  let stored: string;
  try {
    stored = await storeImage("profiles", file);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not upload photo.", 400);
  }
  const user = (await db.select().from(users).where(eq(users.id, current.id)).limit(1))[0];
  const previous = kind === "profile" ? user.profilePhoto : user.coverPhoto;
  await db
    .update(users)
    .set(kind === "profile" ? { profilePhoto: stored, updatedAt: new Date() } : { coverPhoto: stored, updatedAt: new Date() })
    .where(eq(users.id, current.id));
  await removeImage(previous);
  return Response.json({ ok: true, url: stored });
}

export async function DELETE(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current || !isMemberRole(current.role)) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as { kind?: string };
  if (body.kind !== "profile" && body.kind !== "cover") return jsonError("Choose a profile or cover photo.", 400);
  const user = (await db.select().from(users).where(eq(users.id, current.id)).limit(1))[0];
  const previous = body.kind === "profile" ? user.profilePhoto : user.coverPhoto;
  await db
    .update(users)
    .set(body.kind === "profile" ? { profilePhoto: null, updatedAt: new Date() } : { coverPhoto: null, updatedAt: new Date() })
    .where(eq(users.id, current.id));
  await removeImage(previous);
  return Response.json({ ok: true });
}
