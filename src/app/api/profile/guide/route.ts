import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { isMemberRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isMemberRole(user.role)) return jsonError("Unauthorized", 401);
  await db
    .update(users)
    .set({ guideCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return Response.json({ ok: true });
}
