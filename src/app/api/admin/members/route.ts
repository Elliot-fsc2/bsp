import { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { getCurrentUser, hashPassword, jsonError } from "@/lib/auth";
import { normalizeRegistrationForm, parseAnswers } from "@/lib/registration-form";

export const dynamic = "force-dynamic";

const STATUSES = ["pending_payment", "pending_verification", "active", "rejected", "suspended"];

type MemberBody = {
  action?: string;
  id?: number;
  ids?: number[];
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  education?: string;
  accountStatus?: string;
  password?: string;
  profileBio?: string;
  professionalHeadline?: string;
  resumeSummary?: string;
  skills?: string;
  experience?: string;
  birthDate?: string;
  registrationAnswers?: Record<string, unknown>;
};

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sanitizeAnswers(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" && raw.trim()) out[key.slice(0, 60)] = raw.trim().slice(0, 1000);
    if (Object.keys(out).length >= 60) break;
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);

  const body = (await request.json()) as MemberBody;

  if (body.action === "create") {
    const fullName = text(body.fullName, 255);
    const email = text(body.email, 255).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (fullName.length < 2) return jsonError("Please enter the member's full name.", 400);
    if (!email.includes("@")) return jsonError("Please enter a valid email.", 400);
    if (password.length < 6) return jsonError("Password must be at least 6 characters.", 400);

    const existing = (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0];
    if (existing) return jsonError("An account with that email already exists.", 409);

    const accountStatus = STATUSES.includes(body.accountStatus ?? "") ? (body.accountStatus as string) : "pending_payment";
    const [{ id }] = await db
      .insert(users)
      .values({
        email,
        passwordHash: await hashPassword(password),
        fullName,
        phone: text(body.phone, 50) || null,
        address: text(body.address, 2000) || null,
        latitude: text(body.latitude, 40) || null,
        longitude: text(body.longitude, 40) || null,
        education: text(body.education, 1000) || null,
        registrationAnswers: sanitizeAnswers(body.registrationAnswers),
        role: "student",
        accountStatus,
      })
      .$returningId();
    return Response.json({ ok: true, id });
  }

  if (body.action === "update") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return jsonError("A member id is required.", 400);
    const current = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
    if (!current || current.role !== "student") return jsonError("Member not found.", 404);

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (body.fullName !== undefined) {
      const fullName = text(body.fullName, 255);
      if (fullName.length < 2) return jsonError("Please enter a valid full name.", 400);
      values.fullName = fullName;
    }
    if (body.email !== undefined) {
      const email = text(body.email, 255).toLowerCase();
      if (!email.includes("@")) return jsonError("Please enter a valid email.", 400);
      if (email !== current.email) {
        const taken = (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0];
        if (taken) return jsonError("An account with that email already exists.", 409);
      }
      values.email = email;
    }
    if (body.phone !== undefined) values.phone = text(body.phone, 50) || null;
    if (body.address !== undefined) values.address = text(body.address, 2000) || null;
    if (body.latitude !== undefined) values.latitude = text(body.latitude, 40) || null;
    if (body.longitude !== undefined) values.longitude = text(body.longitude, 40) || null;
    if (body.education !== undefined) values.education = text(body.education, 1000) || null;
    if (body.accountStatus !== undefined && STATUSES.includes(body.accountStatus)) values.accountStatus = body.accountStatus;
    if (body.profileBio !== undefined) values.profileBio = text(body.profileBio, 500) || null;
    if (body.professionalHeadline !== undefined) values.professionalHeadline = text(body.professionalHeadline, 180) || null;
    if (body.resumeSummary !== undefined) values.resumeSummary = text(body.resumeSummary, 3000) || null;
    if (body.skills !== undefined) values.skills = text(body.skills, 1500) || null;
    if (body.experience !== undefined) values.experience = text(body.experience, 5000) || null;
    if (body.birthDate !== undefined) values.birthDate = text(body.birthDate, 10) || null;
    if (body.registrationAnswers !== undefined) values.registrationAnswers = sanitizeAnswers(body.registrationAnswers);

    await db.update(users).set(values).where(eq(users.id, id));
    return Response.json({ ok: true });
  }

  if (body.action === "delete") {
    const ids = (Array.isArray(body.ids) ? body.ids : body.id !== undefined ? [body.id] : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
    if (!ids.length) return jsonError("No members selected.", 400);
    await db.delete(users).where(and(eq(users.role, "student"), inArray(users.id, ids)));
    return Response.json({ ok: true, deleted: ids.length });
  }

  if (body.action === "sync-profile") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return jsonError("A member id is required.", 400);
    const user = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
    if (!user || user.role !== "student") return jsonError("Member not found.", 404);

    const academy = (await db.select().from(settings).limit(1))[0];
    const form = normalizeRegistrationForm(academy?.registrationForm);
    const answers = parseAnswers(user.registrationAnswers);
    const builtins: Record<string, string> = {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      address: user.address ?? "",
      education: user.education ?? "",
    };

    const lines: string[] = [];
    for (const field of form.fields) {
      if (field.key === "password") continue;
      const value = field.key in builtins ? builtins[field.key] : answers[field.key] ?? "";
      if (value) lines.push(`${field.label}: ${value}`);
    }
    for (const [key, value] of Object.entries(answers)) {
      if (key.endsWith("__lat") || key.endsWith("__lng")) continue;
      if (form.fields.some((field) => field.key === key)) continue;
      if (value) lines.push(`${key}: ${value}`);
    }

    const registrationDetails = lines.join("\n");
    await db.update(users).set({ registrationDetails, updatedAt: new Date() }).where(eq(users.id, id));
    return Response.json({ ok: true, registrationDetails });
  }

  return jsonError("Unknown action.", 400);
}
