import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  approvals,
  awardedBadges,
  badgeCategories,
  badgeRequirements,
  badges,
  calendarEvents,
  forumPosts,
  forumTopics,
  notifications,
  programs,
  submissions,
  users,
} from "@/db/schema";
import type { AuthUser, QuizQuestion, RequirementType, SubmissionStatus } from "./types";

export type RequirementView = {
  id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  type: RequirementType;
  position: number;
  requiresText: boolean;
  requiresMedia: boolean;
  mediaKind: string;
  requiresLink: boolean;
  points: number;
  quiz: QuizQuestion[] | null;
  requiredBadgeId: number | null;
  requiredBadgeName: string | null;
  submissionId: number | null;
  status: SubmissionStatus | null;
  satisfied: boolean;
  satisfiedByMerit: boolean;
};

export type BadgeProgress = {
  id: number;
  name: string;
  slug: string;
  kind: string;
  description: string | null;
  imageUrl: string | null;
  isMembership: boolean;
  position: number;
  programId: number;
  programName: string;
  programColor: string;
  programIcon: string;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  rankStep: number | null;
  rankCount: number | null;
  locked: boolean;
  lockedByName: string | null;
  requiredBy: { id: number; name: string; programName: string }[];
  requirements: RequirementView[];
  satisfiedCount: number;
  totalCount: number;
  percent: number;
  earned: boolean;
  awardedAt: Date | null;
  applicationStatus: SubmissionStatus | null;
  canApply: boolean;
};

export type ProgramProgress = (typeof programs.$inferSelect) & {
  level: number;
  locked: boolean;
  lockedByName: string | null;
  ranksEarned: number;
  ranksTotal: number;
  complete: boolean;
};

type ProgramAccess = {
  level: number;
  locked: boolean;
  lockedByName: string | null;
  ranksEarned: number;
  ranksTotal: number;
  complete: boolean;
};

export function computeProgramAccess(
  programRows: { id: number; name: string }[],
  ranksByProgram: Map<number, { id: number }[]>,
  earned: Map<number, unknown>,
  engagedProgramIds: Set<number>,
): Map<number, ProgramAccess> {
  const access = new Map<number, ProgramAccess>();
  let blocker: string | null = null;
  programRows.forEach((program, index) => {
    const ranks = ranksByProgram.get(program.id) ?? [];
    const ranksEarned = ranks.filter((rank) => earned.has(rank.id)).length;
    const complete = ranks.length === 0 || ranksEarned === ranks.length;
    const allowed = index === 0 || blocker === null || engagedProgramIds.has(program.id);
    access.set(program.id, {
      level: index + 1,
      locked: !allowed,
      lockedByName: allowed ? null : blocker,
      ranksEarned,
      ranksTotal: ranks.length,
      complete,
    });
    if (!complete && blocker === null) blocker = program.name;
  });
  return access;
}

function parseQuiz(value: string | null): QuizQuestion[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as QuizQuestion[];
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export async function getPrograms() {
  return db.select().from(programs).orderBy(asc(programs.position), asc(programs.id));
}

export async function getProgramBySlug(slug: string) {
  const rows = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getAllBadges() {
  return db
    .select({
      id: badges.id,
      programId: badges.programId,
      categoryId: badges.categoryId,
      kind: badges.kind,
      name: badges.name,
      slug: badges.slug,
      description: badges.description,
      imageUrl: badges.imageUrl,
      isMembership: badges.isMembership,
      position: badges.position,
      programName: programs.name,
      programColor: programs.color,
      programIcon: programs.icon,
      categoryName: badgeCategories.name,
      categoryColor: badgeCategories.color,
      categoryIcon: badgeCategories.icon,
      requirementCount: sql<number>`(select count(*) from ${badgeRequirements} where ${badgeRequirements.badgeId} = ${badges.id})`,
    })
    .from(badges)
    .innerJoin(programs, eq(badges.programId, programs.id))
    .leftJoin(badgeCategories, eq(badges.categoryId, badgeCategories.id))
    .orderBy(asc(programs.position), asc(badges.kind), asc(badges.position), asc(badges.id));
}

export async function getBadgeCategories() {
  return db
    .select()
    .from(badgeCategories)
    .orderBy(asc(badgeCategories.position), asc(badgeCategories.id));
}

async function earnedBadgeIds(userId: number) {
  const rows = await db.select().from(awardedBadges).where(eq(awardedBadges.userId, userId));
  return new Map(rows.map((row) => [row.badgeId, row.awardedAt]));
}

export async function getAdvancement(userId: number): Promise<{
  programs: ProgramProgress[];
  badges: BadgeProgress[];
}> {
  const [programRows, badgeRows, requirementRows, submissionRows, earned, categoryRows] = await Promise.all([
    getPrograms(),
    db.select().from(badges).orderBy(asc(badges.position), asc(badges.id)),
    db.select().from(badgeRequirements).orderBy(asc(badgeRequirements.position), asc(badgeRequirements.id)),
    db.select().from(submissions).where(eq(submissions.userId, userId)),
    earnedBadgeIds(userId),
    getBadgeCategories(),
  ]);

  const programMap = new Map(programRows.map((p) => [p.id, p]));
  const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));
  const badgeNameMap = new Map(badgeRows.map((b) => [b.id, b.name]));

  const ranksByProgram = new Map<number, typeof badgeRows>();
  for (const badge of badgeRows) {
    if (badge.kind !== "rank") continue;
    const list = ranksByProgram.get(badge.programId) ?? [];
    list.push(badge);
    ranksByProgram.set(badge.programId, list);
  }
  for (const list of ranksByProgram.values()) {
    list.sort((a, b) => a.position - b.position || a.id - b.id);
  }

  const badgeProgram = new Map(badgeRows.map((badge) => [badge.id, badge.programId]));
  const engagedProgramIds = new Set<number>();
  for (const row of submissionRows) {
    const programId = badgeProgram.get(row.badgeId);
    if (programId) engagedProgramIds.add(programId);
  }
  for (const badgeId of earned.keys()) {
    const programId = badgeProgram.get(badgeId);
    if (programId) engagedProgramIds.add(programId);
  }
  const access = computeProgramAccess(programRows, ranksByProgram, earned, engagedProgramIds);
  const programProgress: ProgramProgress[] = programRows.map((program) => ({
    ...program,
    ...(access.get(program.id) ?? {
      level: 0,
      locked: false,
      lockedByName: null,
      ranksEarned: 0,
      ranksTotal: 0,
      complete: false,
    }),
  }));

  const submissionsByRequirement = new Map<number, typeof submissionRows[number]>();
  const badgeApplications = new Map<number, typeof submissionRows[number]>();
  for (const row of submissionRows) {
    if (row.kind === "requirement" && row.requirementId) submissionsByRequirement.set(row.requirementId, row);
    if (row.kind === "badge") badgeApplications.set(row.badgeId, row);
  }

  const badgeById = new Map(badgeRows.map((badge) => [badge.id, badge]));
  const requiredByMap = new Map<number, { id: number; name: string; programName: string }[]>();
  for (const requirement of requirementRows) {
    if (requirement.type !== "merit" || !requirement.requiredBadgeId) continue;
    const rank = badgeById.get(requirement.badgeId);
    if (!rank) continue;
    const list = requiredByMap.get(requirement.requiredBadgeId) ?? [];
    list.push({ id: rank.id, name: rank.name, programName: programMap.get(rank.programId)?.name ?? "Program" });
    requiredByMap.set(requirement.requiredBadgeId, list);
  }

  const progress: BadgeProgress[] = badgeRows.map((badge) => {
    const program = programMap.get(badge.programId)!;
    const category = badge.categoryId ? categoryMap.get(badge.categoryId) ?? null : null;
    const programRanks = ranksByProgram.get(badge.programId) ?? [];
    const rankIndex = programRanks.findIndex((rank) => rank.id === badge.id);
    const rankStep = badge.kind === "rank" && rankIndex >= 0 ? rankIndex + 1 : null;
    let lockedByName: string | null = null;
    if (badge.kind === "rank" && rankIndex > 0) {
      for (let i = 0; i < rankIndex; i += 1) {
        if (!earned.has(programRanks[i].id)) {
          lockedByName = programRanks[i].name;
          break;
        }
      }
    }
    const requirements: RequirementView[] = requirementRows
      .filter((r) => r.badgeId === badge.id)
      .map((r) => {
        const submission = submissionsByRequirement.get(r.id) ?? null;
        const satisfiedByMerit = r.type === "merit" && r.requiredBadgeId ? earned.has(r.requiredBadgeId) : false;
        const satisfied = satisfiedByMerit || (submission?.status === "approved");
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          instructions: r.instructions,
          type: r.type as RequirementType,
          position: r.position,
          requiresText: r.requiresText,
          requiresMedia: r.requiresMedia,
          mediaKind: r.mediaKind,
          requiresLink: r.requiresLink,
          points: r.points,
          quiz: parseQuiz(r.quizJson),
          requiredBadgeId: r.requiredBadgeId,
          requiredBadgeName: r.requiredBadgeId ? badgeNameMap.get(r.requiredBadgeId) ?? null : null,
          submissionId: submission?.id ?? null,
          status: (submission?.status as SubmissionStatus | undefined) ?? null,
          satisfied,
          satisfiedByMerit,
        };
      });

    const satisfiedCount = requirements.filter((r) => r.satisfied).length;
    const totalCount = requirements.length;
    const application = badgeApplications.get(badge.id) ?? null;
    const awardedAt = earned.get(badge.id) ?? null;
    const canApply =
      !awardedAt &&
      totalCount > 0 &&
      satisfiedCount === totalCount &&
      (!application || application.status === "rejected");

    return {
      id: badge.id,
      name: badge.name,
      slug: badge.slug,
      kind: badge.kind,
      description: badge.description,
      imageUrl: badge.imageUrl,
      isMembership: badge.isMembership,
      position: badge.position,
      programId: badge.programId,
      programName: program?.name ?? "Program",
      programColor: program?.color ?? "#2d6a4f",
      programIcon: program?.icon ?? "*",
      categoryId: badge.categoryId,
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
      categoryIcon: category?.icon ?? null,
      rankStep,
      rankCount: badge.kind === "rank" ? programRanks.length : null,
      locked: lockedByName !== null,
      lockedByName,
      requiredBy: requiredByMap.get(badge.id) ?? [],
      requirements,
      satisfiedCount,
      totalCount,
      percent: totalCount ? Math.round((satisfiedCount / totalCount) * 100) : 0,
      earned: Boolean(awardedAt),
      awardedAt,
      applicationStatus: (application?.status as SubmissionStatus | undefined) ?? null,
      canApply,
    };
  });

  return { programs: programProgress, badges: progress };
}

export async function getProgramLock(
  programId: number,
  userId: number,
): Promise<{ locked: boolean; lockedByName: string | null; level: number }> {
  const [programRows, badgeRows, submissionRows, earned] = await Promise.all([
    getPrograms(),
    db.select().from(badges),
    db.select({ badgeId: submissions.badgeId }).from(submissions).where(eq(submissions.userId, userId)),
    earnedBadgeIds(userId),
  ]);

  const ranksByProgram = new Map<number, { id: number }[]>();
  const badgeProgram = new Map<number, number>();
  for (const badge of badgeRows) {
    badgeProgram.set(badge.id, badge.programId);
    if (badge.kind !== "rank") continue;
    const list = ranksByProgram.get(badge.programId) ?? [];
    list.push({ id: badge.id });
    ranksByProgram.set(badge.programId, list);
  }

  const engagedProgramIds = new Set<number>();
  for (const row of submissionRows) {
    const id = badgeProgram.get(row.badgeId);
    if (id) engagedProgramIds.add(id);
  }
  for (const badgeId of earned.keys()) {
    const id = badgeProgram.get(badgeId);
    if (id) engagedProgramIds.add(id);
  }

  const entry = computeProgramAccess(programRows, ranksByProgram, earned, engagedProgramIds).get(programId);
  return entry ?? { locked: false, lockedByName: null, level: 0 };
}

export async function getBadgeProgress(badgeId: number, userId: number) {
  const { badges: all } = await getAdvancement(userId);
  return all.find((b) => b.id === badgeId) ?? null;
}

export async function getRankLock(badgeId: number, userId: number): Promise<{ locked: boolean; lockedByName: string | null }> {
  const badgeRows = await db.select().from(badges).where(eq(badges.id, badgeId)).limit(1);
  const badge = badgeRows[0];
  if (!badge || badge.kind !== "rank") return { locked: false, lockedByName: null };
  const programRanks = await db
    .select()
    .from(badges)
    .where(and(eq(badges.programId, badge.programId), eq(badges.kind, "rank")))
    .orderBy(asc(badges.position), asc(badges.id));
  const earned = await earnedBadgeIds(userId);
  const index = programRanks.findIndex((rank) => rank.id === badge.id);
  for (let i = 0; i < index; i += 1) {
    if (!earned.has(programRanks[i].id)) {
      return { locked: true, lockedByName: programRanks[i].name };
    }
  }
  return { locked: false, lockedByName: null };
}

export async function getSubmissionDetail(submissionId: number) {
  const rows = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      kind: submissions.kind,
      badgeId: submissions.badgeId,
      requirementId: submissions.requirementId,
      textContent: submissions.textContent,
      mediaUrl: submissions.mediaUrl,
      mediaType: submissions.mediaType,
      externalUrl: submissions.externalUrl,
      storageProvider: submissions.storageProvider,
      driveFileId: submissions.driveFileId,
      driveUrl: submissions.driveUrl,
      driveSharedWith: submissions.driveSharedWith,
      quizJson: submissions.quizJson,
      quizScore: submissions.quizScore,
      status: submissions.status,
      levelsApproved: submissions.levelsApproved,
      levelsRequired: submissions.levelsRequired,
      submittedAt: submissions.submittedAt,
      decidedAt: submissions.decidedAt,
      scoutName: users.name,
      scoutColor: users.avatarColor,
      scoutEmail: users.email,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
    .where(eq(submissions.id, submissionId))
    .limit(1);
  const submission = rows[0];
  if (!submission) return null;

  const badgeRows = await db.select().from(badges).where(eq(badges.id, submission.badgeId)).limit(1);
  const requirementRows = submission.requirementId
    ? await db.select().from(badgeRequirements).where(eq(badgeRequirements.id, submission.requirementId)).limit(1)
    : [];

  const approvalRows = await db
    .select({
      id: approvals.id,
      level: approvals.level,
      decision: approvals.decision,
      comment: approvals.comment,
      createdAt: approvals.createdAt,
      approverId: approvals.approverId,
      approverName: users.name,
      approverColor: users.avatarColor,
      approverRole: users.role,
    })
    .from(approvals)
    .innerJoin(users, eq(approvals.approverId, users.id))
    .where(eq(approvals.submissionId, submissionId))
    .orderBy(asc(approvals.level), asc(approvals.createdAt));

  return {
    submission,
    badge: badgeRows[0] ?? null,
    requirement: requirementRows[0] ?? null,
    approvals: approvalRows,
  };
}

export async function getApprovalQueue(user: AuthUser) {
  const statuses = user.role === "admin" ? ["pending", "level1_approved"] : ["pending"];
  const rows = await db
    .select({
      id: submissions.id,
      kind: submissions.kind,
      status: submissions.status,
      submittedAt: submissions.submittedAt,
      levelsApproved: submissions.levelsApproved,
      scoutName: users.name,
      scoutColor: users.avatarColor,
      scoutEmail: users.email,
      badgeId: badges.id,
      badgeName: badges.name,
      badgeKind: badges.kind,
      badgeImage: badges.imageUrl,
      requirementTitle: badgeRequirements.title,
      requirementPoints: badgeRequirements.points,
      requirementQuiz: badgeRequirements.quizJson,
      textContent: submissions.textContent,
      mediaUrl: submissions.mediaUrl,
      mediaType: submissions.mediaType,
      externalUrl: submissions.externalUrl,
      storageProvider: submissions.storageProvider,
      driveFileId: submissions.driveFileId,
      driveUrl: submissions.driveUrl,
      driveSharedWith: submissions.driveSharedWith,
      quizJson: submissions.quizJson,
      quizScore: submissions.quizScore,
      decidedAt: submissions.decidedAt,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
    .innerJoin(badges, eq(submissions.badgeId, badges.id))
    .leftJoin(badgeRequirements, eq(submissions.requirementId, badgeRequirements.id))
    .where(inArray(submissions.status, statuses))
    .orderBy(asc(submissions.status), asc(submissions.submittedAt));

  const decidedRows = await db
    .select({
      id: submissions.id,
      kind: submissions.kind,
      status: submissions.status,
      submittedAt: submissions.submittedAt,
      decidedAt: submissions.decidedAt,
      scoutName: users.name,
      scoutColor: users.avatarColor,
      scoutEmail: users.email,
      badgeId: badges.id,
      badgeName: badges.name,
      badgeKind: badges.kind,
      badgeImage: badges.imageUrl,
      requirementTitle: badgeRequirements.title,
      textContent: submissions.textContent,
      mediaUrl: submissions.mediaUrl,
      mediaType: submissions.mediaType,
      externalUrl: submissions.externalUrl,
      storageProvider: submissions.storageProvider,
      driveFileId: submissions.driveFileId,
      driveUrl: submissions.driveUrl,
      driveSharedWith: submissions.driveSharedWith,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
    .innerJoin(badges, eq(submissions.badgeId, badges.id))
    .leftJoin(badgeRequirements, eq(submissions.requirementId, badgeRequirements.id))
    .where(inArray(submissions.status, ["approved", "rejected"]))
    .orderBy(desc(submissions.decidedAt))
    .limit(30);

  return { pending: rows, decided: decidedRows };
}

export async function getMySubmissions(userId: number) {
  return db
    .select({
      id: submissions.id,
      kind: submissions.kind,
      status: submissions.status,
      submittedAt: submissions.submittedAt,
      decidedAt: submissions.decidedAt,
      badgeId: badges.id,
      badgeName: badges.name,
      badgeKind: badges.kind,
      badgeImage: badges.imageUrl,
      requirementId: submissions.requirementId,
      requirementTitle: badgeRequirements.title,
    })
    .from(submissions)
    .innerJoin(badges, eq(submissions.badgeId, badges.id))
    .leftJoin(badgeRequirements, eq(submissions.requirementId, badgeRequirements.id))
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.submittedAt));
}

export async function getAwardedBadges(userId: number) {
  return db
    .select({
      id: awardedBadges.id,
      awardedAt: awardedBadges.awardedAt,
      badgeId: badges.id,
      badgeName: badges.name,
      badgeKind: badges.kind,
      badgeDescription: badges.description,
      badgeImage: badges.imageUrl,
      programName: programs.name,
      programColor: programs.color,
    })
    .from(awardedBadges)
    .innerJoin(badges, eq(awardedBadges.badgeId, badges.id))
    .innerJoin(programs, eq(badges.programId, programs.id))
    .where(eq(awardedBadges.userId, userId))
    .orderBy(desc(awardedBadges.awardedAt));
}

export async function getDashboardData(user: AuthUser) {
  const advancement = await getAdvancement(user.id);
  const awarded = await getAwardedBadges(user.id);
  const inProgress = advancement.badges
    .filter((b) => !b.earned && b.satisfiedCount > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  const announcementRows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      pinned: announcements.pinned,
      createdAt: announcements.createdAt,
      programId: announcements.programId,
      authorName: users.name,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))
    .limit(6);

  const events = await db.select().from(calendarEvents).orderBy(asc(calendarEvents.startAt)).limit(5);

  const pendingApprovals =
    user.role === "student"
      ? []
      : (
          await db
            .select({
              id: submissions.id,
              status: submissions.status,
              submittedAt: submissions.submittedAt,
              scoutName: users.name,
              badgeName: badges.name,
              requirementTitle: badgeRequirements.title,
            })
            .from(submissions)
            .innerJoin(users, eq(submissions.userId, users.id))
            .innerJoin(badges, eq(submissions.badgeId, badges.id))
            .leftJoin(badgeRequirements, eq(submissions.requirementId, badgeRequirements.id))
            .where(
              user.role === "admin"
                ? inArray(submissions.status, ["pending", "level1_approved"])
                : eq(submissions.status, "pending"),
            )
            .orderBy(asc(submissions.submittedAt))
            .limit(6)
        );

  const allUsers = user.role === "admin" ? await getUsers() : [];

  return {
    programs: advancement.programs,
    badges: advancement.badges,
    awarded,
    inProgress,
    announcements: announcementRows,
    events,
    pendingApprovals,
    allUsers,
    totals: {
      users: allUsers.length,
      programs: advancement.programs.length,
      awarded: awarded.length,
      inProgress: advancement.badges.filter((b) => !b.earned && b.satisfiedCount > 0).length,
    },
  };
}

export async function getNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(12);
}

export async function getUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarColor: users.avatarColor,
      bio: users.bio,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt));
}

export async function getPeople() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarColor: users.avatarColor,
      bio: users.bio,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(asc(users.role), asc(users.name));
}

export async function getSiteAnnouncements() {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      pinned: announcements.pinned,
      createdAt: announcements.createdAt,
      programId: announcements.programId,
      programName: programs.name,
      authorName: users.name,
      authorColor: users.avatarColor,
      authorRole: users.role,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .leftJoin(programs, eq(announcements.programId, programs.id))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
}

export async function getForumList() {
  const topics = await db
    .select({
      id: forumTopics.id,
      title: forumTopics.title,
      createdAt: forumTopics.createdAt,
      programId: forumTopics.programId,
      programName: programs.name,
      authorName: users.name,
      authorColor: users.avatarColor,
    })
    .from(forumTopics)
    .innerJoin(users, eq(forumTopics.authorId, users.id))
    .leftJoin(programs, eq(forumTopics.programId, programs.id))
    .orderBy(desc(forumTopics.createdAt));

  const counts = await db
    .select({ topicId: forumPosts.topicId, count: sql<number>`count(*)` })
    .from(forumPosts)
    .groupBy(forumPosts.topicId);
  const countMap = Object.fromEntries(counts.map((row) => [row.topicId, row.count]));
  return topics.map((topic) => ({ ...topic, posts: Number(countMap[topic.id] ?? 0) }));
}

export async function getForumTopic(topicId: number) {
  const topicRows = await db
    .select({
      id: forumTopics.id,
      title: forumTopics.title,
      createdAt: forumTopics.createdAt,
      programId: forumTopics.programId,
      programName: programs.name,
      authorName: users.name,
    })
    .from(forumTopics)
    .innerJoin(users, eq(forumTopics.authorId, users.id))
    .leftJoin(programs, eq(forumTopics.programId, programs.id))
    .where(eq(forumTopics.id, topicId))
    .limit(1);
  const topic = topicRows[0];
  if (!topic) return null;
  const posts = await db
    .select({
      id: forumPosts.id,
      body: forumPosts.body,
      createdAt: forumPosts.createdAt,
      authorName: users.name,
      authorColor: users.avatarColor,
      authorRole: users.role,
    })
    .from(forumPosts)
    .innerJoin(users, eq(forumPosts.authorId, users.id))
    .where(eq(forumPosts.topicId, topicId))
    .orderBy(asc(forumPosts.createdAt));
  return { topic, posts };
}

export async function getCalendarItems() {
  const events = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startAt: calendarEvents.startAt,
      type: calendarEvents.type,
      programName: programs.name,
    })
    .from(calendarEvents)
    .leftJoin(programs, eq(calendarEvents.programId, programs.id))
    .orderBy(asc(calendarEvents.startAt));
  return { events };
}

export async function getAdminReport() {
  const userRows = await getUsers();
  const programRows = await getPrograms();
  const badgeRows = await getAllBadges();
  const submissionRows = await db.select().from(submissions);
  const awardedRows = await db.select().from(awardedBadges);
  const pending = submissionRows.filter((row) => row.status === "pending" || row.status === "level1_approved");
  const roleCounts = {
    admin: userRows.filter((row) => row.role === "admin").length,
    teacher: userRows.filter((row) => row.role === "teacher").length,
    student: userRows.filter((row) => row.role === "student").length,
  };
  const badgeCounts = badgeRows.map((badge) => ({
    id: badge.id,
    name: badge.name,
    kind: badge.kind,
    programName: badge.programName,
    awarded: awardedRows.filter((row) => row.badgeId === badge.id).length,
  }));
  return {
    users: userRows.length,
    programs: programRows.length,
    badges: badgeRows.length,
    submissions: submissionRows.length,
    pending: pending.length,
    awarded: awardedRows.length,
    roleCounts,
    badgeCounts: badgeCounts.sort((a, b) => b.awarded - a.awarded),
  };
}

export async function getAdminPrograms() {
  return db.select().from(programs).orderBy(asc(programs.position), asc(programs.id));
}

export async function getProgramById(id: number) {
  const rows = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getBadgeWithRequirements(badgeId: number) {
  const badgeRows = await db
    .select({
      id: badges.id,
      programId: badges.programId,
      categoryId: badges.categoryId,
      kind: badges.kind,
      name: badges.name,
      slug: badges.slug,
      description: badges.description,
      imageUrl: badges.imageUrl,
      isMembership: badges.isMembership,
      position: badges.position,
      programName: programs.name,
      programColor: programs.color,
      categoryName: badgeCategories.name,
    })
    .from(badges)
    .innerJoin(programs, eq(badges.programId, programs.id))
    .leftJoin(badgeCategories, eq(badges.categoryId, badgeCategories.id))
    .where(eq(badges.id, badgeId))
    .limit(1);
  if (!badgeRows[0]) return null;
  const requirementRows = await db
    .select()
    .from(badgeRequirements)
    .where(eq(badgeRequirements.badgeId, badgeId))
    .orderBy(asc(badgeRequirements.position), asc(badgeRequirements.id));
  return { badge: badgeRows[0], requirements: requirementRows };
}

export async function getRequirementOptions() {
  return db
    .select({
      id: badges.id,
      name: badges.name,
      kind: badges.kind,
      imageUrl: badges.imageUrl,
      programName: programs.name,
    })
    .from(badges)
    .innerJoin(programs, eq(badges.programId, programs.id))
    .orderBy(asc(programs.position), asc(badges.position));
}

export async function getMeritRequirementUsage() {
  const rows = await db
    .select({ badgeId: badgeRequirements.badgeId, requiredBadgeId: badgeRequirements.requiredBadgeId })
    .from(badgeRequirements)
    .where(eq(badgeRequirements.type, "merit"));
  const usage: Record<number, number[]> = {};
  for (const row of rows) {
    if (!row.requiredBadgeId) continue;
    const list = usage[row.badgeId] ?? [];
    list.push(row.requiredBadgeId);
    usage[row.badgeId] = list;
  }
  return usage;
}

export async function getRequirementWork(requirementId: number, userId: number) {
  const requirementRows = await db.select().from(badgeRequirements).where(eq(badgeRequirements.id, requirementId)).limit(1);
  const requirement = requirementRows[0];
  if (!requirement) return null;

  const badgeRows = await db
    .select({ id: badges.id, name: badges.name, kind: badges.kind, programId: badges.programId, imageUrl: badges.imageUrl })
    .from(badges)
    .where(eq(badges.id, requirement.badgeId))
    .limit(1);

  const submissionRows = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.userId, userId), eq(submissions.requirementId, requirementId)))
    .limit(1);
  const submission = submissionRows[0] ?? null;

  const approvalRows = submission
    ? await db
        .select({
          id: approvals.id,
          level: approvals.level,
          decision: approvals.decision,
          comment: approvals.comment,
          createdAt: approvals.createdAt,
          approverName: users.name,
          approverColor: users.avatarColor,
        })
        .from(approvals)
        .innerJoin(users, eq(approvals.approverId, users.id))
        .where(eq(approvals.submissionId, submission.id))
        .orderBy(asc(approvals.level), asc(approvals.createdAt))
    : [];

  return { requirement, badge: badgeRows[0] ?? null, submission, approvals: approvalRows };
}
