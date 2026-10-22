"use server";

import { and, asc, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  announcements,
  approvals,
  awardedBadges,
  badgeCategories,
  badgeRequirements,
  badges,
  calendarEvents,
  forumTopics,
  programs,
  submissions,
  users,
} from "@/db/schema";
import { hashPassword, requireRole } from "@/lib/auth";
import { normalizeRich } from "@/lib/richtext";
import { saveSettings } from "@/lib/settings";
import type { SiteSettings } from "@/lib/types";
import { slugify } from "@/lib/utils";

export async function saveSettingsAction(formData: FormData) {
  await requireRole(["admin"]);
  const theme = String(formData.get("theme") ?? "forest");
  await saveSettings({
    siteName: String(formData.get("siteName") ?? "Boy Scouts of the Philippines").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    theme: theme === "ocean" || theme === "sunset" || theme === "bloom" ? theme : "forest",
    allowRegistration: String(formData.get("allowRegistration") ?? "") === "on",
    welcomeMessage: normalizeRich(formData.get("welcomeMessage")) || "Welcome, Scout!",
    maintenanceMode: String(formData.get("maintenanceMode") ?? "") === "on",
    supportEmail: String(formData.get("supportEmail") ?? "").trim(),
    mascotName: String(formData.get("mascotName") ?? "Handa").trim(),
    logoUrl: String(formData.get("logoUrl") ?? "").trim(),
    faviconUrl: String(formData.get("faviconUrl") ?? "").trim() || "/images/logo.svg",
  } satisfies Partial<SiteSettings>);
  revalidatePath("/", "layout");
}

export async function createUserAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  await requireRole(["admin"]);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "student");
  const password = String(formData.get("password") ?? "laginghanda");
  if (!name || !email) return { error: "Name and email are required." };
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return { error: "That email already belongs to someone in the council." };
  await db.insert(users).values({
    name,
    email,
    role: role === "admin" || role === "teacher" ? role : "student",
    passwordHash: await hashPassword(password || "laginghanda"),
    avatarColor: "#2d6a4f",
    bio: "Invited to the BSP Advancement Portal.",
  });
  revalidatePath("/admin/users");
  revalidatePath("/people");
  return { ok: true };
}

export async function updateUserAction(userId: number, formData: FormData) {
  await requireRole(["admin"]);
  const role = String(formData.get("role") ?? "student");
  const isActive = String(formData.get("isActive") ?? "on") === "on";
  await db
    .update(users)
    .set({
      role: role === "admin" || role === "teacher" || role === "student" ? role : "student",
      isActive,
    })
    .where(eq(users.id, userId));
  revalidatePath("/admin/users");
  revalidatePath("/people");
}

export async function createProgramAction(formData: FormData) {
  await requireRole(["admin"]);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const existing = await db.select().from(programs);
  await db.insert(programs).values({
    name,
    slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
    section: String(formData.get("section") ?? "").trim() || null,
    ageRange: String(formData.get("ageRange") ?? "").trim() || null,
    description: normalizeRich(formData.get("description")) || null,
    color: String(formData.get("color") ?? "#2d6a4f"),
    icon: String(formData.get("icon") ?? "*"),
    position: existing.length,
  });
  revalidatePath("/admin/programs");
  revalidatePath("/advancement");
}

export async function updateProgramAction(programId: number, formData: FormData) {
  await requireRole(["admin"]);
  await db
    .update(programs)
    .set({
      name: String(formData.get("name") ?? "").trim() || "Program",
      section: String(formData.get("section") ?? "").trim() || null,
      ageRange: String(formData.get("ageRange") ?? "").trim() || null,
      description: normalizeRich(formData.get("description")) || null,
      color: String(formData.get("color") ?? "#2d6a4f"),
      icon: String(formData.get("icon") ?? "*"),
    })
    .where(eq(programs.id, programId));
  revalidatePath("/admin/programs");
  revalidatePath("/advancement");
}

async function purgeBadge(badgeId: number) {
  const requirements = await db.select({ id: badgeRequirements.id }).from(badgeRequirements).where(eq(badgeRequirements.badgeId, badgeId));
  const requirementIds = requirements.map((row) => row.id);

  const submissionRows = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      requirementIds.length
        ? or(eq(submissions.badgeId, badgeId), inArray(submissions.requirementId, requirementIds))
        : eq(submissions.badgeId, badgeId),
    );
  const submissionIds = submissionRows.map((row) => row.id);
  if (submissionIds.length) {
    await db.delete(approvals).where(inArray(approvals.submissionId, submissionIds));
    await db.delete(submissions).where(inArray(submissions.id, submissionIds));
  }
  await db.delete(awardedBadges).where(eq(awardedBadges.badgeId, badgeId));
  await db
    .update(badgeRequirements)
    .set({ requiredBadgeId: null })
    .where(eq(badgeRequirements.requiredBadgeId, badgeId));
  await db.delete(badgeRequirements).where(eq(badgeRequirements.badgeId, badgeId));
  await db.delete(badges).where(eq(badges.id, badgeId));
}

export async function deleteProgramAction(programId: number) {
  await requireRole(["admin"]);
  const programBadges = await db.select({ id: badges.id }).from(badges).where(eq(badges.programId, programId));
  for (const badge of programBadges) await purgeBadge(badge.id);
  await db.update(announcements).set({ programId: null }).where(eq(announcements.programId, programId));
  await db.update(forumTopics).set({ programId: null }).where(eq(forumTopics.programId, programId));
  await db.update(calendarEvents).set({ programId: null }).where(eq(calendarEvents.programId, programId));
  await db.delete(programs).where(eq(programs.id, programId));
  revalidatePath("/admin/programs");
  revalidatePath("/advancement");
}

export async function reorderProgramsAction(orderedIds: number[]) {
  await requireRole(["admin"]);
  for (const [position, programId] of orderedIds.entries()) {
    await db.update(programs).set({ position }).where(eq(programs.id, programId));
  }
  revalidatePath("/admin/programs");
  revalidatePath("/advancement");
  revalidatePath("/my-advancement");
}

export async function createCategoryAction(formData: FormData) {
  await requireRole(["admin"]);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const existing = await db.select().from(badgeCategories);
  await db.insert(badgeCategories).values({
    name,
    slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
    description: normalizeRich(formData.get("description")) || null,
    color: String(formData.get("color") ?? "#2d6a4f"),
    icon: String(formData.get("icon") ?? "*"),
    position: existing.length,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/advancement");
}

export async function updateCategoryAction(categoryId: number, formData: FormData) {
  await requireRole(["admin"]);
  await db
    .update(badgeCategories)
    .set({
      name: String(formData.get("name") ?? "").trim() || "Category",
      description: normalizeRich(formData.get("description")) || null,
      color: String(formData.get("color") ?? "#2d6a4f"),
      icon: String(formData.get("icon") ?? "*"),
    })
    .where(eq(badgeCategories.id, categoryId));
  revalidatePath("/admin/categories");
  revalidatePath("/advancement");
}

export async function deleteCategoryAction(categoryId: number) {
  await requireRole(["admin"]);
  await db.update(badges).set({ categoryId: null }).where(eq(badges.categoryId, categoryId));
  await db.delete(badgeCategories).where(eq(badgeCategories.id, categoryId));
  revalidatePath("/admin/categories");
  revalidatePath("/admin/badges");
  revalidatePath("/advancement");
}

export async function moveBadgeAction(badgeId: number, direction: "up" | "down") {
  await requireRole(["admin"]);
  const rows = await db.select().from(badges).where(eq(badges.id, badgeId)).limit(1);
  const badge = rows[0];
  if (!badge) return;

  const siblings = await db
    .select()
    .from(badges)
    .where(and(eq(badges.programId, badge.programId), eq(badges.kind, badge.kind)))
    .orderBy(asc(badges.position), asc(badges.id));
  const index = siblings.findIndex((item) => item.id === badge.id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;

  const base = badge.kind === "rank" ? 100 : 10;
  for (const [position, sibling] of siblings.entries()) {
    await db.update(badges).set({ position: base + position * 10 }).where(eq(badges.id, sibling.id));
  }
  await db.update(badges).set({ position: base + targetIndex * 10 }).where(eq(badges.id, badge.id));
  await db.update(badges).set({ position: base + index * 10 }).where(eq(badges.id, siblings[targetIndex].id));

  revalidatePath(`/admin/programs/${badge.programId}`);
  revalidatePath("/admin/badges");
  revalidatePath("/advancement");
}

export async function addMeritRequirementAction(badgeId: number, formData: FormData) {
  await requireRole(["admin"]);
  const requiredBadgeId = Number(formData.get("requiredBadgeId") ?? 0) || null;
  if (!requiredBadgeId) return;

  const meritRows = await db.select().from(badges).where(eq(badges.id, requiredBadgeId)).limit(1);
  const merit = meritRows[0];
  if (!merit || merit.kind !== "merit") return;

  const existing = await db.select().from(badgeRequirements).where(eq(badgeRequirements.badgeId, badgeId));
  if (existing.some((row) => row.requiredBadgeId === requiredBadgeId)) return;

  await db.insert(badgeRequirements).values({
    badgeId,
    title: `Earn the ${merit.name} merit badge`,
    description: merit.description ?? null,
    type: "merit",
    position: existing.reduce((max, row) => Math.max(max, row.position), -1) + 1,
    requiresText: false,
    requiresMedia: false,
    requiresLink: false,
    requiredBadgeId,
    points: 20,
  });

  revalidatePath(`/admin/badges/${badgeId}`);
  revalidatePath("/admin/badges");
  revalidatePath("/advancement");
}

export async function createBadgeAction(formData: FormData) {
  await requireRole(["admin"]);
  const programId = Number(formData.get("programId") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  if (!programId || !name) return;
  await db.insert(badges).values({
    programId,
    categoryId: Number(formData.get("categoryId") ?? 0) || null,
    kind: String(formData.get("kind") ?? "rank") === "merit" ? "merit" : "rank",
    name,
    slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
    description: normalizeRich(formData.get("description")) || null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    isMembership: String(formData.get("isMembership") ?? "") === "on",
    position: Number(formData.get("position") ?? 0) || 0,
  });
  revalidatePath("/admin/badges");
  revalidatePath("/advancement");
}

export async function updateBadgeAction(badgeId: number, formData: FormData) {
  await requireRole(["admin"]);
  const programId = Number(formData.get("programId") ?? 0);
  await db
    .update(badges)
    .set({
      ...(programId ? { programId } : {}),
      categoryId: Number(formData.get("categoryId") ?? 0) || null,
      kind: String(formData.get("kind") ?? "rank") === "merit" ? "merit" : "rank",
      name: String(formData.get("name") ?? "").trim() || "Badge",
      description: normalizeRich(formData.get("description")) || null,
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
      isMembership: String(formData.get("isMembership") ?? "") === "on",
      position: Number(formData.get("position") ?? 0) || 0,
    })
    .where(eq(badges.id, badgeId));
  revalidatePath("/admin/badges");
  revalidatePath(`/admin/badges/${badgeId}`);
  revalidatePath("/advancement");
}

export async function deleteBadgeAction(badgeId: number, returnTo: string, _formData: FormData) {
  void _formData;
  await requireRole(["admin"]);
  await purgeBadge(badgeId);
  revalidatePath("/admin/badges");
  revalidatePath("/advancement");
  redirect(returnTo || "/admin/badges");
}

function requirementValues(formData: FormData) {
  const type = String(formData.get("type") ?? "task");
  const quizRaw = String(formData.get("quizJson") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim() || "Requirement",
    description: normalizeRich(formData.get("description")) || null,
    instructions: normalizeRich(formData.get("instructions")) || null,
    type: type === "recite" || type === "quiz" || type === "merit" ? type : "task",
    position: Number(formData.get("position") ?? 0) || 0,
    requiresText: String(formData.get("requiresText") ?? "") === "on",
    requiresMedia: String(formData.get("requiresMedia") ?? "") === "on",
    mediaKind: String(formData.get("mediaKind") ?? "video") === "image" ? "image" : "video",
    requiresLink: String(formData.get("requiresLink") ?? "") === "on",
    quizJson: quizRaw && quizRaw !== "[]" ? quizRaw : null,
    requiredBadgeId: type === "merit" ? Number(formData.get("requiredBadgeId") ?? 0) || null : null,
    points: Number(formData.get("points") ?? 10) || 10,
  };
}

export async function createRequirementAction(badgeId: number, formData: FormData) {
  await requireRole(["admin"]);
  const values = requirementValues(formData);
  const existing = await db.select().from(badgeRequirements).where(eq(badgeRequirements.badgeId, badgeId));
  await db.insert(badgeRequirements).values({
    ...values,
    badgeId,
    position: values.position || existing.length,
  });
  revalidatePath(`/admin/badges/${badgeId}`);
  revalidatePath("/advancement");
}

export async function updateRequirementAction(requirementId: number, formData: FormData) {
  await requireRole(["admin"]);
  const values = requirementValues(formData);
  await db.update(badgeRequirements).set(values).where(eq(badgeRequirements.id, requirementId));
  revalidatePath("/advancement");
}

export async function deleteRequirementAction(requirementId: number) {
  await requireRole(["admin"]);
  const rows = await db.select().from(badgeRequirements).where(eq(badgeRequirements.id, requirementId)).limit(1);
  const requirement = rows[0];
  if (!requirement) return;
  const submissionRows = await db.select({ id: submissions.id }).from(submissions).where(eq(submissions.requirementId, requirementId));
  const submissionIds = submissionRows.map((row) => row.id);
  if (submissionIds.length) {
    await db.delete(approvals).where(inArray(approvals.submissionId, submissionIds));
    await db.delete(submissions).where(inArray(submissions.id, submissionIds));
  }
  await db.delete(badgeRequirements).where(eq(badgeRequirements.id, requirementId));
  revalidatePath(`/admin/badges/${requirement.badgeId}`);
  revalidatePath("/advancement");
}
