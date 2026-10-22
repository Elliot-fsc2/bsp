import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { sanitizeAnswers } from "@/lib/registration-form";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = (await request.json()) as { registrationAnswers?: unknown };
  const answers = sanitizeAnswers(body.registrationAnswers);
  await db.update(users).set({ registrationAnswers: answers, updatedAt: new Date() }).where(eq(users.id, user.id));

  return Response.json({ ok: true, registrationAnswers: answers ?? {} });
}
