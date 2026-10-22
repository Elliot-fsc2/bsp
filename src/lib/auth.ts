import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import type { AccountStatus, PublicUser, UserRole } from "@/lib/types";
import { toIsoString } from "@/lib/utils";

const SESSION_COOKIE = "demolay_pathway_session";
const SESSION_DAYS = 14;

export function toPublicUser(user: typeof users.$inferSelect): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    education: user.education,
    role: user.role as UserRole,
    accountStatus: user.accountStatus as AccountStatus,
    profileBio: user.profileBio,
    profilePhoto: user.profilePhoto,
    coverPhoto: user.coverPhoto,
    professionalHeadline: user.professionalHeadline,
    resumeSummary: user.resumeSummary,
    skills: user.skills,
    experience: user.experience,
    birthDate: user.birthDate ?? null,
    registrationDetails: user.registrationDetails,
    guideCompletedAt: toIsoString(user.guideCompletedAt),
    passwordChangedAt: toIsoString(user.passwordChangedAt),
    createdAt: toIsoString(user.createdAt) ?? new Date().toISOString(),
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number, days: number = SESSION_DAYS) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token));
    jar.delete(SESSION_COOKIE);
    return null;
  }
  return toPublicUser(row.user);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
