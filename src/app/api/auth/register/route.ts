import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { createSession, hashPassword, jsonError } from "@/lib/auth";
import { isBuiltinFieldKey, normalizeRegistrationForm } from "@/lib/registration-form";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const value = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");

  const academy = (await db.select().from(settings).limit(1))[0];
  const form = normalizeRegistrationForm(academy?.registrationForm);

  const fullName = value("fullName");
  const email = value("email").toLowerCase();
  const password = typeof body.password === "string" ? (body.password as string) : "";

  if (fullName.length < 2) return jsonError("Please enter your full name.", 400);
  if (!email.includes("@")) return jsonError("Please enter a valid email.", 400);
  if (password.length < 6) return jsonError("Password must be at least 6 characters.", 400);

  for (const field of form.fields) {
    if (!field.visible) continue;
    const submitted = value(field.key);
    if (field.required && !submitted) {
      return jsonError(`Please fill in ${field.label.replace(/\s*\(optional\)\s*$/i, "")}.`, 400);
    }
    if (field.type === "select" && submitted && !(field.options ?? []).includes(submitted)) {
      return jsonError(`Choose a valid option for ${field.label}.`, 400);
    }
  }

  const existing = (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0];
  if (existing) return jsonError("An account with that email already exists.", 409);

  const answers: Record<string, string> = {};
  for (const field of form.fields) {
    if (isBuiltinFieldKey(field.key)) continue;
    const submitted = value(field.key);
    if (submitted) answers[field.key] = submitted;
    if (field.type === "location") {
      const lat = value(`${field.key}__lat`);
      const lng = value(`${field.key}__lng`);
      if (lat || lng) {
        answers[`${field.key}__lat`] = lat;
        answers[`${field.key}__lng`] = lng;
      }
    }
  }

  const [{ id: userId }] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword(password),
      fullName,
      phone: value("phone") || null,
      address: value("address") || null,
      latitude: value("address__lat") || null,
      longitude: value("address__lng") || null,
      education: value("education") || null,
      registrationAnswers: Object.keys(answers).length ? answers : null,
      role: "student",
      accountStatus: "pending_payment",
    })
    .$returningId();

  await createSession(userId);
  return Response.json({ ok: true });
}
