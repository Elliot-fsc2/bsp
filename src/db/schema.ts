import {
  boolean,
  int,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 32 }).notNull().default("student"),
  avatarColor: varchar("avatar_color", { length: 32 }).notNull().default("#2d6a4f"),
  bio: text("bio"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
  googleEmail: varchar("google_email", { length: 191 }),
  googleRefreshToken: varchar("google_refresh_token", { length: 512 }),
  googleFolderId: varchar("google_folder_id", { length: 191 }),
  googleConnectedAt: timestamp("google_connected_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
});

export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  section: varchar("section", { length: 160 }),
  ageRange: varchar("age_range", { length: 80 }),
  description: text("description"),
  color: varchar("color", { length: 32 }).notNull().default("#2d6a4f"),
  icon: varchar("icon", { length: 32 }).notNull().default("*"),
  position: int("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const badgeCategories = mysqlTable("badge_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 32 }).notNull().default("#2d6a4f"),
  icon: varchar("icon", { length: 32 }).notNull().default("*"),
  position: int("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("program_id")
    .notNull()
    .references(() => programs.id),
  categoryId: int("category_id").references(() => badgeCategories.id),
  kind: varchar("kind", { length: 16 }).notNull().default("rank"),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  isMembership: boolean("is_membership").notNull().default(false),
  position: int("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const badgeRequirements = mysqlTable("badge_requirements", {
  id: int("id").autoincrement().primaryKey(),
  badgeId: int("badge_id")
    .notNull()
    .references(() => badges.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  type: varchar("type", { length: 16 }).notNull().default("task"),
  position: int("position").notNull().default(0),
  requiresText: boolean("requires_text").notNull().default(true),
  requiresMedia: boolean("requires_media").notNull().default(false),
  mediaKind: varchar("media_kind", { length: 16 }).notNull().default("video"),
  requiresLink: boolean("requires_link").notNull().default(false),
  quizJson: text("quiz_json"),
  requiredBadgeId: int("required_badge_id").references(() => badges.id),
  points: int("points").notNull().default(10),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const submissions = mysqlTable(
  "submissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id),
    kind: varchar("kind", { length: 16 }).notNull().default("requirement"),
    badgeId: int("badge_id")
      .notNull()
      .references(() => badges.id),
    requirementId: int("requirement_id").references(() => badgeRequirements.id),
    textContent: text("text_content"),
    mediaUrl: text("media_url"),
    mediaType: varchar("media_type", { length: 16 }),
    externalUrl: text("external_url"),
    storageProvider: varchar("storage_provider", { length: 16 }).notNull().default("server"),
    driveFileId: varchar("drive_file_id", { length: 191 }),
    driveUrl: varchar("drive_url", { length: 512 }),
    driveSharedWith: varchar("drive_shared_with", { length: 191 }),
    quizJson: text("quiz_json"),
    quizScore: int("quiz_score"),
    status: varchar("status", { length: 24 }).notNull().default("pending"),
    levelsApproved: int("levels_approved").notNull().default(0),
    levelsRequired: int("levels_required").notNull().default(2),
    submittedAt: timestamp("submitted_at", { mode: "date" }).defaultNow().notNull(),
    decidedAt: timestamp("decided_at", { mode: "date" }),
  },
  (t) => [unique("submissions_user_requirement").on(t.userId, t.requirementId)],
);

export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submission_id")
    .notNull()
    .references(() => submissions.id),
  approverId: int("approver_id")
    .notNull()
    .references(() => users.id),
  level: int("level").notNull(),
  decision: varchar("decision", { length: 16 }).notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const awardedBadges = mysqlTable(
  "awarded_badges",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id),
    badgeId: int("badge_id")
      .notNull()
      .references(() => badges.id),
    awardedAt: timestamp("awarded_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [unique("awarded_user_badge").on(t.userId, t.badgeId)],
);

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("program_id").references(() => programs.id),
  authorId: int("author_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const forumTopics = mysqlTable("forum_topics", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("program_id").references(() => programs.id),
  authorId: int("author_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const forumPosts = mysqlTable("forum_posts", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topic_id")
    .notNull()
    .references(() => forumTopics.id),
  authorId: int("author_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  href: text("href"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("program_id").references(() => programs.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startAt: timestamp("start_at", { mode: "date" }).notNull(),
  type: varchar("type", { length: 32 }).notNull().default("event"),
});

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type ProgramRow = typeof programs.$inferSelect;
export type BadgeCategoryRow = typeof badgeCategories.$inferSelect;
export type BadgeRow = typeof badges.$inferSelect;
export type RequirementRow = typeof badgeRequirements.$inferSelect;
export type SubmissionRow = typeof submissions.$inferSelect;
export type ApprovalRow = typeof approvals.$inferSelect;
