"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { normalizeRich } from "@/lib/richtext";
import { getSettings } from "@/lib/settings";
import { ensureSeeded } from "@/db/seed";

export async function loginAction(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  await ensureSeeded();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Please add your email and password." };

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !user.isActive) return { error: "We couldn't find an active account with that email." };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "That password doesn't match. Try laginghanda for demo accounts." };

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  const nextRaw = String(formData.get("next") || "/dashboard");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";
  redirect(next);
}

export async function registerAction(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  await ensureSeeded();
  const settings = await getSettings();
  if (!settings.allowRegistration) {
    return { error: "New sign-ups are paused right now. Ask an admin for an invite." };
  }
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) return { error: "Name, email, and password are all needed." };
  if (password.length < 6) return { error: "Use at least 6 characters for your password." };

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return { error: "That email is already part of the council. Try logging in." };

  const colors = ["#2d6a4f", "#40916c", "#c9a227", "#bc6c25", "#1b4332", "#6b705c", "#a68a64"];
  const [{ id: createdId }] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "student",
      avatarColor: colors[Math.floor(Math.random() * colors.length)] ?? "#2d6a4f",
      bio: "New Scout on the trail and ready to learn.",
    })
    .$returningId();
  await createSession(createdId);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function updateProfileAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  const bio = normalizeRich(formData.get("bio"));
  const avatarColor = String(formData.get("avatarColor") ?? user.avatarColor);
  const password = String(formData.get("password") ?? "");
  if (!name) return { error: "Please keep a name so classmates can find you." };

  const patch: { name: string; bio: string; avatarColor: string; passwordHash?: string } = {
    name,
    bio,
    avatarColor,
  };
  if (password) {
    if (password.length < 6) return { error: "New passwords need at least 6 characters." };
    patch.passwordHash = await hashPassword(password);
  }
  await db.update(users).set(patch).where(eq(users.id, user.id));
  return { ok: true };
}
