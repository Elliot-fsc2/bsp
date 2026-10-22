import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, jsonError, verifyPassword } from "@/lib/auth";
import { toIsoString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string; password?: string; remember?: boolean };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) return jsonError("Email and password are required.", 400);

  const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("Invalid email or password.", 401);
  }

  await createSession(user.id, body.remember === false ? 1 : 14);
  return Response.json({
    ok: true,
    role: user.role,
    accountStatus: user.accountStatus,
    guideCompleted: toIsoString(user.guideCompletedAt) !== null,
    passwordChanged: toIsoString(user.passwordChangedAt) !== null,
  });
}
