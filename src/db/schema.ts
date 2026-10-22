import {
  boolean,
  date,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import type { LandingContent } from "../lib/landing";
import type { RegistrationFormContent } from "../lib/registration-form";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  education: text("education"),
  latitude: varchar("latitude", { length: 40 }),
  longitude: varchar("longitude", { length: 40 }),
  registrationAnswers: json("registration_answers").$type<Record<string, string> | null>(),
  registrationDetails: text("registration_details"),
  profileBio: text("profile_bio"),
  profilePhoto: text("profile_photo"),
  coverPhoto: text("cover_photo"),
  professionalHeadline: varchar("professional_headline", { length: 180 }),
  resumeSummary: text("resume_summary"),
  skills: text("skills"),
  experience: text("experience"),
  birthDate: date("birth_date", { mode: "string" }),
  role: varchar("role", { length: 20 }).notNull().default("student"),
  accountStatus: varchar("account_status", { length: 40 })
    .notNull()
    .default("pending_payment"),
  guideCompletedAt: timestamp("guide_completed_at", { mode: "date" }),
  passwordChangedAt: timestamp("password_changed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const sessions = mysqlTable("sessions", {
  token: varchar("token", { length: 128 }).primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
});

export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  academyName: varchar("academy_name", { length: 255 }).notNull(),
  tagline: text("tagline"),
  announcement: text("announcement"),
  registrationFeeCents: int("registration_fee_cents").notNull().default(15000),
  currency: varchar("currency", { length: 10 }).notNull().default("PHP"),
  bankName: varchar("bank_name", { length: 255 }),
  accountName: varchar("account_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 100 }),
  paymentInstructions: text("payment_instructions"),
  retakeFeeCents: int("retake_fee_cents").notNull().default(9500),
  reinstatementFeeCents: int("reinstatement_fee_cents").notNull().default(12500),
  timeZone: varchar("time_zone", { length: 80 }).notNull().default("UTC"),
  logoFilename: varchar("logo_filename", { length: 255 }),
  faviconFilename: varchar("favicon_filename", { length: 255 }),
  examNote: text("exam_note"),
  landingContent: json("landing_content").$type<LandingContent | null>(),
  registrationForm: json("registration_form").$type<RegistrationFormContent | null>(),
  googleMapsApiKey: varchar("google_maps_api_key", { length: 255 }),
  demoSeedVersion: int("demo_seed_version").notNull().default(0),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const levels = mysqlTable("levels", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coverFilename: text("cover_filename"),
  requiredScore: int("required_score").notNull().default(70),
  studyDays: int("study_days").notNull().default(7),
  examDays: int("exam_days").notNull().default(3),
  isActive: boolean("is_active").notNull().default(true),
});

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  levelId: int("level_id")
    .notNull()
    .references(() => levels.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull().default(""),
  coverFilename: text("cover_filename"),
  videoUrl: text("video_url"),
  embedCode: text("embed_code"),
  sortOrder: int("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const questionBanks = mysqlTable("question_banks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  levelId: int("level_id").references(() => levels.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  bankId: int("bank_id")
    .notNull()
    .references(() => questionBanks.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 40 }).notNull(),
  prompt: text("prompt").notNull(),
  options: json("options").$type<Record<string, unknown> | null>(),
  correctAnswer: json("correct_answer").$type<Record<string, unknown> | null>(),
  points: int("points").notNull().default(1),
  explanation: text("explanation"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const exams = mysqlTable("exams", {
  id: int("id").autoincrement().primaryKey(),
  levelId: int("level_id")
    .notNull()
    .references(() => levels.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  bankId: int("bank_id").references(() => questionBanks.id, {
    onDelete: "set null",
  }),
  questionCount: int("question_count").notNull().default(10),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(true),
  shuffleOptions: boolean("shuffle_options").notNull().default(true),
  timeLimitMinutes: int("time_limit_minutes").notNull().default(30),
  passingScore: int("passing_score").notNull().default(70),
  maxAttempts: int("max_attempts").notNull().default(3),
  isPublished: boolean("is_published").notNull().default(true),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amountCents: int("amount_cents").notNull(),
  referenceNumber: varchar("reference_number", { length: 100 }).notNull(),
  receiptPath: text("receipt_path").notNull(),
  purpose: varchar("purpose", { length: 30 }).notNull().default("registration"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  notes: text("notes"),
  adminNote: text("admin_note"),
  submittedAt: timestamp("submitted_at", { mode: "date" }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  reviewedBy: int("reviewed_by").references(() => users.id),
});

export const levelProgress = mysqlTable(
  "level_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    levelId: int("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 30 }).notNull().default("locked"),
    unlockedAt: timestamp("unlocked_at", { mode: "date" }),
    studyDeadline: timestamp("study_deadline", { mode: "date" }),
    examDeadline: timestamp("exam_deadline", { mode: "date" }),
    passedAt: timestamp("passed_at", { mode: "date" }),
    bestScore: int("best_score"),
    attemptsUsed: int("attempts_used").notNull().default(0),
  },
  (table) => [uniqueIndex("level_progress_user_level").on(table.userId, table.levelId)],
);

export const lessonProgress = mysqlTable(
  "lesson_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: int("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("lesson_progress_user_lesson").on(table.userId, table.lessonId)],
);

export const examAttempts = mysqlTable("exam_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  examId: int("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  levelId: int("level_id").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("in_progress"),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  submittedAt: timestamp("submitted_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  scorePercent: int("score_percent"),
  pointsEarned: int("points_earned"),
  pointsPossible: int("points_possible"),
  passed: boolean("passed"),
  snapshot: json("snapshot").$type<Record<string, unknown> | null>(),
  answers: json("answers").$type<Record<string, unknown> | null>(),
});
