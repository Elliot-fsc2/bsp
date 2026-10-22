import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { normalizeRegistrationForm } from "@/lib/registration-form";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);

  const body = (await request.json()) as { form?: unknown };
  const form = normalizeRegistrationForm(body.form);

  const current = (await db.select().from(settings).limit(1))[0];
  if (current) {
    await db
      .update(settings)
      .set({ registrationForm: form, updatedAt: new Date() })
      .where(eq(settings.id, current.id));
  } else {
    await db.insert(settings).values({ academyName: "DeMolay Nexus", registrationForm: form });
  }

  return Response.json({ ok: true, form });
}
