import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { StudentAnswer } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.accountStatus !== "active") return jsonError("Forbidden", 403);
  const { id } = await context.params;
  const body = (await request.json()) as { answers?: Record<string, StudentAnswer> };
  const attempt = (
    await db.select().from(examAttempts).where(eq(examAttempts.id, Number(id))).limit(1)
  )[0];
  if (!attempt || attempt.userId !== user.id) return jsonError("Attempt not found.", 404);
  if (attempt.status !== "in_progress") return jsonError("Attempt is closed.", 400);

  await db
    .update(examAttempts)
    .set({ answers: body.answers ?? {} })
    .where(eq(examAttempts.id, attempt.id));

  return Response.json({ ok: true });
}
