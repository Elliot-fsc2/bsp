import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, hashPassword, jsonError, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
  if (!body.currentPassword || !body.newPassword || body.newPassword.length < 8) {
    return jsonError("Enter your current password and a new password of at least 8 characters.", 400);
  }
  const user = (await db.select().from(users).where(eq(users.id, current.id)).limit(1))[0];
  if (!user || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
    return jsonError("Your current password is not correct.", 400);
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(body.newPassword), passwordChangedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return Response.json({ ok: true });
}
