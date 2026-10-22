import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  examAttempts,
  exams,
  lessonProgress,
  levelProgress,
  levels,
  lessons,
  payments,
  settings,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { initializeStudentProgress } from "@/lib/progress";
import { isBuiltinFieldKey, normalizeRegistrationForm, type RegistrationField } from "@/lib/registration-form";
import { addDays } from "@/lib/utils";

const DEMO_RECEIPT = "/images/demo-receipt.svg";

export async function seedImagesDemo() {
  const now = new Date();

  const profilePhoto: Record<string, string> = {
    "member@demolaypathway.org": "/images/member-alex.jpg",
    "mateo@demolaypathway.org": "/images/profile-mateo.jpg",
    "daniel@demolaypathway.org": "/images/profile-daniel.jpg",
    "isaiah@demolaypathway.org": "/images/profile-isaiah.jpg",
    "liam@demolaypathway.org": "/images/profile-liam.jpg",
    "caleb@demolaypathway.org": "/images/profile-caleb.jpg",
    "noah@demolaypathway.org": "/images/profile-noah.jpg",
    "ethan@demolaypathway.org": "/images/profile-ethan.jpg",
    "marcus@demolaypathway.org": "/images/profile-marcus.jpg",
    "owen@demolaypathway.org": "/images/profile-owen.jpg",
    "council@demolaypathway.org": "/images/profile-council.jpg",
  };

  for (const [email, photo] of Object.entries(profilePhoto)) {
    const account = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (!account) continue;
    const memberRow = account.email === "member@demolaypathway.org";
    await db
      .update(users)
      .set({
        profilePhoto: photo,
        coverPhoto: memberRow ? "/images/community.jpg" : account.coverPhoto ?? "/images/cover-default.jpg",
        updatedAt: now,
      })
      .where(eq(users.id, account.id));
  }

  const academy = (await db.select().from(settings).limit(1))[0];
  if (academy) {
    await db
      .update(settings)
      .set({
        announcement: "Reminder: the Level 2 exam window closes Sunday at midnight. Review your lessons and take the general examination when you are ready. ⚜️",
        updatedAt: now,
      })
      .where(eq(settings.id, academy.id));
  }
}

export async function seedStoreAndRetakeDemo() {
  const now = new Date();
  const caleb = (await db.select().from(users).where(eq(users.email, "caleb@demolaypathway.org")).limit(1))[0];
  const program = await db.select().from(levels).orderBy(levels.number);
  const levelOne = program.find((level) => level.number === 1);
  if (caleb && levelOne) {
    await initializeStudentProgress(caleb.id);
    const progress = (
      await db
        .select()
        .from(levelProgress)
        .where(and(eq(levelProgress.userId, caleb.id), eq(levelProgress.levelId, levelOne.id)))
        .limit(1)
    )[0];
    if (progress && progress.attemptsUsed === 0) {
      await db
        .update(levelProgress)
        .set({ attemptsUsed: 1, bestScore: 58, status: "unlocked" })
        .where(eq(levelProgress.id, progress.id));
      const exam = (await db.select().from(exams).where(eq(exams.levelId, levelOne.id)).limit(1))[0];
      if (exam) {
        const existingAttempt = (
          await db
            .select({ id: examAttempts.id })
            .from(examAttempts)
            .where(and(eq(examAttempts.userId, caleb.id), eq(examAttempts.examId, exam.id)))
            .limit(1)
        )[0];
        if (!existingAttempt) {
          await db.insert(examAttempts).values({
            userId: caleb.id,
            examId: exam.id,
            levelId: levelOne.id,
            status: "submitted",
            startedAt: addDays(now, -3),
            submittedAt: addDays(now, -3),
            scorePercent: 58,
            pointsEarned: 4,
            pointsPossible: 8,
            passed: false,
            snapshot: { sample: true },
            answers: {},
          });
        }
      }
    }
  }
}

const PEOPLE = [
  {
    fullName: "Mateo Sullivan",
    email: "mateo@demolaypathway.org",
    bio: "Learning to run welcoming chapter meetings, one small promise at a time.",
    education: "Chapter Junior Councilor · North Star Chapter",
    status: "active",
    currentLevel: 2,
    birthDate: "2007-09-22",
  },
  {
    fullName: "Daniel Reyes",
    email: "daniel@demolaypathway.org",
    bio: "Every good service project starts by listening to our neighbors.",
    education: "Chapter member · Beacon Chapter",
    status: "active",
    currentLevel: 3,
    birthDate: "2008-01-05",
  },
  {
    fullName: "Isaiah Brooks",
    email: "isaiah@demolaypathway.org",
    bio: "Chapter service chair. Building a team that makes room for everyone.",
    education: "Chapter Service Chair · Harbor Chapter",
    status: "active",
    currentLevel: 4,
    birthDate: "2007-06-11",
  },
  {
    fullName: "Liam Parker",
    email: "liam@demolaypathway.org",
    bio: "Preparing to mentor the next generation of chapter leaders.",
    education: "Senior Councilor · North Star Chapter",
    status: "active",
    currentLevel: 5,
    birthDate: "2006-11-02",
  },
  {
    fullName: "Caleb Morgan",
    email: "caleb@demolaypathway.org",
    bio: "New member. Ready to learn, show up, and help out.",
    education: "New member · Beacon Chapter",
    status: "active",
    currentLevel: 1,
    birthDate: "2009-02-18",
  },
  {
    fullName: "Noah Collins",
    email: "noah@demolaypathway.org",
    bio: "Looking forward to meeting the brothers and starting my pathway.",
    education: "Applicant · Harbor Chapter",
    status: "pending_verification",
    currentLevel: 0,
    birthDate: "2009-06-03",
  },
  {
    fullName: "Ethan Hayes",
    email: "ethan@demolaypathway.org",
    bio: "An applicant interested in leadership and community service.",
    education: "Applicant · North Star Chapter",
    status: "pending_payment",
    currentLevel: 0,
    birthDate: "2008-12-17",
  },
] as const;

export async function seedExpandedMockData() {
  const now = new Date();
  const passwordHash = await hashPassword("Member123!");
  const people = new Map<string, typeof users.$inferSelect>();
  for (const person of PEOPLE) {
    await db
      .insert(users)
      .values({
        email: person.email,
        passwordHash,
        fullName: person.fullName,
        profileBio: person.bio,
        education: person.education,
        birthDate: person.birthDate,
        role: "student",
        accountStatus: person.status,
        guideCompletedAt: person.status === "active" ? now : null,
        passwordChangedAt: person.status === "active" ? now : null,
      })
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    const found = (await db.select().from(users).where(eq(users.email, person.email)).limit(1))[0];
    if (found) people.set(person.email, found);
  }

  const member = (await db.select().from(users).where(eq(users.email, "member@demolaypathway.org")).limit(1))[0];
  const mateo = people.get("mateo@demolaypathway.org");
  const daniel = people.get("daniel@demolaypathway.org");
  const isaiah = people.get("isaiah@demolaypathway.org");
  const liam = people.get("liam@demolaypathway.org");
  const caleb = people.get("caleb@demolaypathway.org");
  const noah = people.get("noah@demolaypathway.org");
  const ethan = people.get("ethan@demolaypathway.org");

  const program = await db.select().from(levels).orderBy(levels.number);
  const examRows = await db.select().from(exams);
  const lessonRows = await db.select().from(lessons).orderBy(lessons.sortOrder);

  for (const person of PEOPLE) {
    if (person.status !== "active") continue;
    const account = people.get(person.email);
    if (!account) continue;
    await initializeStudentProgress(account.id);
    for (const level of program) {
      const progress = (
        await db
          .select()
          .from(levelProgress)
          .where(and(eq(levelProgress.userId, account.id), eq(levelProgress.levelId, level.id)))
          .limit(1)
      )[0];
      if (!progress) continue;
      if (level.number < person.currentLevel) {
        await db
          .update(levelProgress)
          .set({
            status: "passed",
            bestScore: 88,
            attemptsUsed: 1,
            unlockedAt: addDays(now, -18 * (person.currentLevel - level.number)),
            passedAt: addDays(now, -10 * (person.currentLevel - level.number)),
          })
          .where(eq(levelProgress.id, progress.id));
        const exam = examRows.find((row) => row.levelId === level.id);
        const existingAttempt = exam
          ? (
              await db
                .select({ id: examAttempts.id })
                .from(examAttempts)
                .where(and(eq(examAttempts.userId, account.id), eq(examAttempts.examId, exam.id)))
                .limit(1)
            )[0]
          : null;
        if (exam && !existingAttempt) {
          await db.insert(examAttempts).values({
            userId: account.id,
            levelId: level.id,
            examId: exam.id,
            status: "submitted",
            startedAt: addDays(now, -11 * (person.currentLevel - level.number)),
            submittedAt: addDays(now, -10 * (person.currentLevel - level.number)),
            scorePercent: 88,
            pointsEarned: 7,
            pointsPossible: 8,
            passed: true,
            snapshot: { sample: true },
            answers: {},
          });
        }
      } else if (level.number === person.currentLevel) {
        await db
          .update(levelProgress)
          .set({
            status: "unlocked",
            unlockedAt: now,
            studyDeadline: addDays(now, level.studyDays),
            examDeadline: addDays(now, level.studyDays + level.examDays),
          })
          .where(eq(levelProgress.id, progress.id));
      }

      if (level.number <= person.currentLevel) {
        const relevantLessons = lessonRows.filter((row) => row.levelId === level.id);
        const toComplete = level.number < person.currentLevel ? relevantLessons : relevantLessons.slice(0, person.currentLevel === 1 ? 1 : 2);
        if (toComplete.length) {
          await db
            .insert(lessonProgress)
            .values(toComplete.map((lesson) => ({ userId: account.id, lessonId: lesson.id })))
            .onDuplicateKeyUpdate({ set: { id: sql`id` } });
        }
      }
    }
  }

  if (mateo) {
    const currentLevel = program.find((level) => level.number === 2);
    const exam = examRows.find((row) => row.levelId === currentLevel?.id);
    if (currentLevel && exam) {
      const failed = (
        await db
          .select({ id: examAttempts.id })
          .from(examAttempts)
          .where(and(eq(examAttempts.userId, mateo.id), eq(examAttempts.examId, exam.id)))
          .limit(1)
      )[0];
      if (!failed) {
        await db.insert(examAttempts).values({
          userId: mateo.id,
          levelId: currentLevel.id,
          examId: exam.id,
          status: "submitted",
          startedAt: addDays(now, -2),
          submittedAt: addDays(now, -2),
          scorePercent: 63,
          pointsEarned: 5,
          pointsPossible: 8,
          passed: false,
          snapshot: { sample: true },
          answers: {},
        });
        await db
          .update(levelProgress)
          .set({ attemptsUsed: 1, bestScore: 63 })
          .where(and(eq(levelProgress.userId, mateo.id), eq(levelProgress.levelId, currentLevel.id)));
      }
    }
  }

  const receipts = [
    { user: member, ref: "DEMO-REG-1001", status: "verified" },
    { user: mateo, ref: "DEMO-REG-1002", status: "verified" },
    { user: daniel, ref: "DEMO-REG-1003", status: "verified" },
    { user: isaiah, ref: "DEMO-REG-1004", status: "verified" },
    { user: liam, ref: "DEMO-REG-1005", status: "verified" },
    { user: caleb, ref: "DEMO-REG-1006", status: "verified" },
    { user: noah, ref: "DEMO-REG-1007", status: "pending" },
    { user: ethan, ref: "DEMO-REG-1008", status: "rejected" },
  ];
  for (const receipt of receipts) {
    if (!receipt.user) continue;
    const existing = (await db.select({ id: payments.id }).from(payments).where(eq(payments.referenceNumber, receipt.ref)).limit(1))[0];
    if (existing) continue;
    await db.insert(payments).values({
      userId: receipt.user.id,
      referenceNumber: receipt.ref,
      receiptPath: DEMO_RECEIPT,
      amountCents: 18500,
      status: receipt.status,
      notes: "Sample registration payment — demonstration data only.",
      adminNote: receipt.status === "rejected" ? "Demo: receipt needs a clearer reference number. Please resubmit." : null,
      reviewedAt: receipt.status !== "pending" ? addDays(now, -4) : null,
    });
  }
}

export const DEMO_MEMBER_EMAILS = [
  "member@demolaypathway.org",
  "mateo@demolaypathway.org",
  "daniel@demolaypathway.org",
  "isaiah@demolaypathway.org",
  "liam@demolaypathway.org",
  "caleb@demolaypathway.org",
  "noah@demolaypathway.org",
  "ethan@demolaypathway.org",
  "marcus@demolaypathway.org",
  "owen@demolaypathway.org",
];

function demoAnswerFor(field: RegistrationField, user: typeof users.$inferSelect): string {
  const label = field.label.toLowerCase();
  const nameParts = user.fullName.split(/\s+/);
  const given = nameParts[0] ?? user.fullName;
  const family = nameParts.slice(1).join(" ");
  if (field.type === "select" && field.options?.length) return field.options[0];
  if (label.includes("given")) return given;
  if (label.includes("middle")) return "A.";
  if (label.includes("facebook") && label.includes("link")) return `https://facebook.com/${`${given}${family}`.toLowerCase()}`;
  if (label.includes("facebook")) return user.fullName;
  if (label.includes("lodge")) return "Lodge No. 12";
  if (label.includes("mason")) return "Yes";
  if (field.type === "location") return user.address ?? "";
  if (field.type === "email") return user.email;
  if (field.type === "tel") return user.phone ?? "";
  return `${field.label} on file`;
}

export async function seedRegistrationDetailsMock() {
  const now = new Date();
  const academy = (await db.select().from(settings).limit(1))[0];
  const form = normalizeRegistrationForm(academy?.registrationForm);

  for (const email of DEMO_MEMBER_EMAILS) {
    const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (!user || user.registrationDetails) continue;

    const builtins: Record<string, string> = {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      address: user.address ?? "",
      education: user.education ?? "",
    };
    const answers: Record<string, string> = {};
    const parts: string[] = [];

    for (const field of form.fields) {
      if (field.key === "password") continue;
      if (isBuiltinFieldKey(field.key)) {
        const value = builtins[field.key] ?? "";
        if (value) parts.push(`${field.label}: ${value}`);
        continue;
      }
      const value = demoAnswerFor(field, user);
      if (value) {
        answers[field.key] = value;
        parts.push(`${field.label}: ${value}`);
      }
    }

    await db
      .update(users)
      .set({
        registrationAnswers: Object.keys(answers).length ? answers : null,
        registrationDetails: parts.join("\n"),
        updatedAt: now,
      })
      .where(eq(users.id, user.id));
  }
}
