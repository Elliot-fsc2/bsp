import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  examAttempts,
  exams,
  lessonProgress,
  lessons,
  levelProgress,
  levels,
  questionBanks,
  questions,
  settings,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { DEMO_MEMBER_EMAILS, seedExpandedMockData, seedImagesDemo, seedRegistrationDetailsMock, seedStoreAndRetakeDemo } from "@/lib/demo-seed";
import { EXAM_NOTE_DEFAULT } from "@/lib/defaults";
import { initializeStudentProgress } from "@/lib/progress";

const LEVEL_COVERS = [
  "/images/group-lab-cover.jpg",
  "/images/group-service-cover.jpg",
  "/images/group-book-cover.jpg",
  "/images/community.jpg",
  "/images/cover-default.jpg",
];

const LESSON_COVERS = [
  "/images/group-service-photo.jpg",
  "/images/group-book-photo.jpg",
  "/images/group-lab-photo.jpg",
];

const LEVELS = [
  {
    number: 1,
    name: "DeMolay Foundations",
    description: "Learn the story, purpose, traditions, and respectful culture of DeMolay.",
    requiredScore: 70,
    studyDays: 7,
    examDays: 3,
  },
  {
    number: 2,
    name: "Leadership & Chapter Life",
    description: "Practice dependable leadership, meeting roles, planning, and brotherhood in action.",
    requiredScore: 75,
    studyDays: 10,
    examDays: 3,
  },
  {
    number: 3,
    name: "Seven Cardinal Virtues",
    description: "Apply filial love, reverence, courtesy, comradeship, fidelity, cleanness, and patriotism.",
    requiredScore: 75,
    studyDays: 12,
    examDays: 4,
  },
  {
    number: 4,
    name: "Service & Citizenship",
    description: "Plan service, represent your chapter well, and build a positive impact in your community.",
    requiredScore: 80,
    studyDays: 14,
    examDays: 4,
  },
  {
    number: 5,
    name: "Master Councilor Capstone",
    description: "Synthesize leadership, service, virtues, and chapter stewardship in a final pathway exam.",
    requiredScore: 85,
    studyDays: 14,
    examDays: 5,
  },
];

function lessonHtml(title: string, summary: string, focus: string[]) {
  return `<h2>${title}</h2><p>${summary}</p><h3>Practice this week</h3><ul>${focus
    .map((item) => `<li>${item}</li>`)
    .join("")}</ul><blockquote><p>A DeMolay leader carries himself with respect, service, and care for his brothers — in the chapter room and beyond it.</p></blockquote>`;
}

const LESSONS: Record<number, { title: string; content: string; videoUrl?: string; embedCode?: string }[]> = {
  1: [
    {
      title: "Welcome to DeMolay",
      videoUrl: "https://www.youtube.com/watch?v=Oa0ZHf16yEU",
      content: lessonHtml("A brotherhood for young men", "DeMolay is a leadership organization for young men built around friendship, character, civic responsibility, and practical growth. This LMS helps you prepare for chapter life through a respectful, sequential learning pathway.", ["Introduce yourself to a member in the Community room.", "Write down one quality you bring to a chapter.", "Review the pathway rules and exam calendar."]),
    },
    {
      title: "A Culture of Respect",
      content: lessonHtml("How a DeMolay carries himself", "Courtesy, reliability, good humor, and attention to others create a chapter where every member can grow. Respect applies to advisors, family, fellow members, guests, and the larger community.", ["Practice using a clear, respectful greeting.", "Notice one moment where a teammate deserves encouragement.", "Keep your chapter commitments in a calendar."]),
    },
    {
      title: "Your Learning Pathway",
      embedCode: '<iframe src="https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview" width="100%" height="360" allow="autoplay"></iframe>',
      content: lessonHtml("Five stages of growth", "Each level has lessons, a scheduled study window, and one general examination. Review lessons as often as you wish. A passing score unlocks the next level, just like steady growth unlocks greater responsibility.", ["Mark each study deadline in your personal planner.", "Learn how your account and payment verification work.", "Ask for help early if a deadline is at risk."]),
    },
  ],
  2: [
    {
      title: "The Chapter Team",
      content: lessonHtml("Leadership is a shared effort", "Chapter life works when members arrive prepared, fulfill their roles, and support each other. Every office and committee role contributes to a successful meeting and a stronger brotherhood.", ["Identify a role you would like to learn more about.", "Arrive five minutes early for your next chapter activity.", "Thank a brother who follows through."]),
    },
    {
      title: "Running a Strong Meeting",
      videoUrl: "https://www.youtube.com/watch?v=5MgBikgcWnY",
      content: lessonHtml("Prepared, purposeful, welcoming", "Strong meetings have an agenda, clear responsibilities, respectful participation, and follow-up. Leadership means making the room better for the member who speaks least as well as the member who leads.", ["Draft a three-item agenda for a chapter activity.", "Practice stating an update in one clear minute.", "Record one action and its owner."]),
    },
    {
      title: "Brotherhood in Action",
      content: lessonHtml("Dependability builds trust", "Brotherhood is more than attendance. It is checking in, celebrating effort, resolving conflict with maturity, and keeping commitments when no one is watching.", ["Send one encouraging message in the positive-only timeline.", "Offer practical help on a chapter task.", "Reflect on how reliability earns trust."]),
    },
  ],
  3: [
    {
      title: "The Seven Cardinal Virtues",
      content: lessonHtml("A durable compass", "The Seven Cardinal Virtues give DeMolays a practical standard: filial love, reverence for sacred things, courtesy, comradeship, fidelity, cleanness, and patriotism. They are meant to guide everyday choices.", ["Name a virtue you used this week.", "Discuss a virtue with a trusted adult.", "Choose one behavior that demonstrates courtesy."]),
    },
    {
      title: "Courtesy, Fidelity & Comradeship",
      videoUrl: "https://www.youtube.com/watch?v=N0ymMQkLdfM",
      content: lessonHtml("The virtues people can feel", "Courtesy shapes how we speak; fidelity shapes how we keep trust; comradeship shapes how we stand with friends. Together they make a chapter safer, warmer, and more dependable.", ["Give a specific compliment rather than a generic one.", "Keep one small promise without being reminded.", "Make space for another member's idea."]),
    },
    {
      title: "Character Under Pressure",
      content: lessonHtml("Choose what is right", "Character becomes visible when a choice is inconvenient. A DeMolay leader pauses, considers who may be affected, asks for advice when needed, and chooses a path he can explain with confidence.", ["Use a pause before responding to a difficult message.", "List the people affected by one decision.", "Ask a mentor how they evaluate a tough choice."]),
    },
  ],
  4: [
    {
      title: "Service With Purpose",
      content: lessonHtml("See a need, serve together", "Service is not a photo opportunity. The best projects listen to a real need, define a manageable outcome, assign roles, and follow up with gratitude and reflection.", ["Name a need in your school or community.", "Write a one-sentence service goal.", "Invite a brother to help plan."]),
    },
    {
      title: "Citizenship & Representation",
      videoUrl: "https://www.youtube.com/watch?v=rfxmk0b2MII",
      content: lessonHtml("Represent the chapter well", "A DeMolay represents himself, his family, and his chapter. Good citizenship means informed participation, respect for others, and a readiness to contribute without needing the spotlight.", ["Practice an introduction at a community event.", "Learn one fact about a local community issue.", "Thank a volunteer or public servant."]),
    },
    {
      title: "Planning a Chapter Project",
      content: lessonHtml("From idea to follow-through", "Use a simple plan: purpose, people, place, materials, schedule, communication, safety, and review. The final review lets the chapter celebrate impact and improve the next project.", ["Build a basic project checklist.", "Assign one owner for each next step.", "Schedule a five-minute after-action review."]),
    },
  ],
  5: [
    {
      title: "Leading the Whole Chapter",
      content: lessonHtml("The capstone standard", "A Master Councilor thinks beyond his own task. He prepares others to lead, balances tradition with welcome, listens to advisors, and leaves the chapter stronger than he found it.", ["Name one member you can encourage to lead.", "Review the chapter calendar for balance.", "Practice saying thank you to a mentor."]),
    },
    {
      title: "Mentorship & Legacy",
      videoUrl: "https://www.youtube.com/watch?v=Unzc731iCUY",
      content: lessonHtml("Make the next leader ready", "Legacy is not about titles. It is the confidence, habits, and care you leave in another member. Mentor with patience, model preparation, and celebrate progress without taking over.", ["Teach a simple task to another member.", "Ask for feedback on your leadership.", "Write one lesson you want to pass forward."]),
    },
    {
      title: "Your Continuing DeMolay Journey",
      content: lessonHtml("Certification is a beginning", "Completing this pathway recognizes disciplined study and thoughtful practice. Continue learning through chapter activities, service, friendships, mentors, and opportunities to lead.", ["Update your profile with a leadership goal.", "Share a positive message with your group.", "Plan your next chapter contribution."]),
    },
  ],
};

function questionsFor(level: number) {
  const common = [
    {
      type: "multiple_choice",
      prompt: "Which quality best supports a healthy DeMolay chapter?",
      options: { choices: [{ id: "a", text: "Reliability" }, { id: "b", text: "Ignoring commitments" }, { id: "c", text: "Excluding others" }, { id: "d", text: "Taking credit for every task" }] },
      correctAnswer: { choiceId: "a" },
    },
    {
      type: "true_false",
      prompt: "Positive leadership includes listening carefully and treating others with courtesy.",
      correctAnswer: { bool: true },
    },
    {
      type: "multiple_select",
      prompt: "Select actions that strengthen brotherhood.",
      options: { choices: [{ id: "a", text: "Following through" }, { id: "b", text: "Encouraging a brother" }, { id: "c", text: "Keeping someone out" }, { id: "d", text: "Sharing responsibility" }] },
      correctAnswer: { choiceIds: ["a", "b", "d"] },
    },
    {
      type: "short_answer",
      prompt: "What word describes treating others with respect and good manners?",
      correctAnswer: { text: "courtesy" },
    },
    {
      type: "fill_blank",
      prompt: "DeMolay leadership is practiced through service and ______.",
      options: { blankCount: 1 },
      correctAnswer: { texts: ["brotherhood"] },
    },
    {
      type: "matching",
      prompt: "Match the leadership habit to its meaning.",
      options: { left: [{ id: "l1", text: "Reliability" }, { id: "l2", text: "Courtesy" }, { id: "l3", text: "Service" }], right: [{ id: "r1", text: "Helping a real need" }, { id: "r2", text: "Following through on commitments" }, { id: "r3", text: "Respectful conduct" }] },
      correctAnswer: { matches: { l1: "r2", l2: "r3", l3: "r1" } },
    },
    {
      type: "essay",
      prompt: "In 4–6 sentences, describe one way you will make your chapter more welcoming and dependable.",
    },
  ];
  const specific: Record<number, { prompt: string; options: Record<string, unknown>; correctAnswer: Record<string, unknown> }> = {
    1: { prompt: "The first level of this pathway focuses on:", options: { choices: [{ id: "a", text: "DeMolay foundations" }, { id: "b", text: "Skipping directly to capstone" }, { id: "c", text: "Only payment records" }, { id: "d", text: "Social media metrics" }] }, correctAnswer: { choiceId: "a" } },
    2: { prompt: "A strong chapter meeting starts with:", options: { choices: [{ id: "a", text: "No plan" }, { id: "b", text: "A clear agenda and responsibilities" }, { id: "c", text: "Leaving tasks unowned" }, { id: "d", text: "Avoiding member input" }] }, correctAnswer: { choiceId: "b" } },
    3: { prompt: "Which is one of the Seven Cardinal Virtues?", options: { choices: [{ id: "a", text: "Courtesy" }, { id: "b", text: "Carelessness" }, { id: "c", text: "Disloyalty" }, { id: "d", text: "Isolation" }] }, correctAnswer: { choiceId: "a" } },
    4: { prompt: "A well-planned service project begins by:", options: { choices: [{ id: "a", text: "Finding a genuine community need" }, { id: "b", text: "Skipping safety" }, { id: "c", text: "Working without a goal" }, { id: "d", text: "Avoiding follow-up" }] }, correctAnswer: { choiceId: "a" } },
    5: { prompt: "A leadership legacy is best measured by:", options: { choices: [{ id: "a", text: "How ready others are to lead" }, { id: "b", text: "How many tasks you keep for yourself" }, { id: "c", text: "Never asking mentors for advice" }, { id: "d", text: "Avoiding the chapter" }] }, correctAnswer: { choiceId: "a" } },
  };
  return [...common, specific[level]];
}

async function resetLegacyProgram() {
  await db.delete(examAttempts);
  await db.delete(lessonProgress);
  await db.delete(levelProgress);
  await db.delete(exams);
  await db.delete(questions);
  await db.delete(questionBanks);
  await db.delete(lessons);
  await db.delete(levels);
}

let seeding: Promise<void> | null = null;

export async function ensureSeed() {
  if (seeding) return seeding;
  seeding = (async () => {
    const currentSettings = (await db.select().from(settings).limit(1))[0];
    const firstRun = !currentSettings;
    const legacy = currentSettings?.academyName === "Summit Pathway";

    if (legacy) await resetLegacyProgram();

    const [existingAdmin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    const [existingMember] = await db.select().from(users).where(eq(users.role, "student")).limit(1);
    let admin = existingAdmin;
    if (!admin) {
      admin = (
        await db.select().from(users).where(eq(users.email, "council@demolaypathway.org")).limit(1)
      )[0];
      if (!admin) {
        const [{ id: adminId }] = await db.insert(users).values({
          email: "council@demolaypathway.org",
          passwordHash: await hashPassword("Admin123!"),
          fullName: "DeMolay Leadership Council",
          profileBio: "Supporting chapter leaders and member growth.",
          role: "admin",
          accountStatus: "active",
          guideCompletedAt: new Date(),
          passwordChangedAt: new Date(),
        }).$returningId();
        admin = (await db.select().from(users).where(eq(users.id, adminId)).limit(1))[0];
      }
    } else if (legacy) {
      await db.update(users).set({
        email: "council@demolaypathway.org",
        passwordHash: await hashPassword("Admin123!"),
        fullName: "DeMolay Leadership Council",
        profileBio: "Supporting chapter leaders and member growth.",
        accountStatus: "active",
        guideCompletedAt: new Date(),
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(users.id, admin.id));
    }

    let member = existingMember;
    if (!member) {
      member = (
        await db.select().from(users).where(eq(users.email, "member@demolaypathway.org")).limit(1)
      )[0];
      if (!member) {
        const [{ id: memberId }] = await db.insert(users).values({
          email: "member@demolaypathway.org",
          passwordHash: await hashPassword("Member123!"),
          fullName: "Alex Carter",
          phone: "+1 555 010 480",
          education: "Chapter candidate",
          profileBio: "Learning to lead through service, brotherhood, and the Seven Cardinal Virtues.",
          role: "student",
          accountStatus: "active",
          guideCompletedAt: new Date(),
          passwordChangedAt: new Date(),
        }).$returningId();
        member = (await db.select().from(users).where(eq(users.id, memberId)).limit(1))[0];
      }
    } else if (legacy) {
      await db.update(users).set({
        email: "member@demolaypathway.org",
        passwordHash: await hashPassword("Member123!"),
        fullName: "Alex Carter",
        education: "Chapter candidate",
        profileBio: "Learning to lead through service, brotherhood, and the Seven Cardinal Virtues.",
        accountStatus: "active",
        guideCompletedAt: new Date(),
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(users.id, member.id));
    }

    const brandSettings = {
      academyName: "DeMolay Nexus",
      tagline: "Character. Leadership. Brotherhood. Service.",
      registrationFeeCents: 18500,
      currency: "PHP",
      bankName: "DeMolay Leadership Fund",
      accountName: "DeMolay Leadership Pathway",
      accountNumber: "DML-8802-1943",
      paymentInstructions: "Submit the registration fee through your approved local process. Enter your payment reference and upload a clear receipt. The leadership council verifies payments manually before your Level 1 study window opens.",
      examNote: EXAM_NOTE_DEFAULT,
      updatedAt: new Date(),
    };
    if (firstRun || legacy) {
      if (currentSettings) {
        await db.update(settings).set(brandSettings).where(eq(settings.id, currentSettings.id));
      } else {
        await db.insert(settings).values(brandSettings);
      }
    }

    if (firstRun || legacy) {
      for (const [i, level] of LEVELS.entries()) {
        const coverFilename = LEVEL_COVERS[i % LEVEL_COVERS.length];
        const [{ id: createdLevelId }] = await db.insert(levels).values({ ...level, coverFilename }).$returningId();
        for (const [index, lesson] of (LESSONS[level.number] ?? []).entries()) {
          const lessonCover = LESSON_COVERS[index % LESSON_COVERS.length];
          await db.insert(lessons).values({
            levelId: createdLevelId,
            title: lesson.title,
            content: lesson.content,
            coverFilename: lessonCover,
            videoUrl: lesson.videoUrl ?? null,
            embedCode: lesson.embedCode ?? null,
            sortOrder: index + 1,
            isPublished: true,
          });
        }
        const [{ id: bankId }] = await db.insert(questionBanks).values({ name: `${level.name} assessment bank`, description: `DeMolay learning questions for ${level.name}.`, levelId: createdLevelId }).$returningId();
        for (const question of questionsFor(level.number)) {
          const item = question as { type?: string; prompt: string; options?: Record<string, unknown>; correctAnswer?: Record<string, unknown> };
          await db.insert(questions).values({ bankId, type: item.type ?? "multiple_choice", prompt: item.prompt, options: (item.options ?? null) as Record<string, unknown> | null, correctAnswer: (item.correctAnswer ?? null) as Record<string, unknown> | null, points: 1, explanation: null });
        }
        await db.insert(exams).values({ levelId: createdLevelId, title: `Level ${level.number} General Examination`, description: `DeMolay assessment for ${level.name}. Review all lessons and sit this exam during the scheduled window.`, bankId, questionCount: 8, shuffleQuestions: true, shuffleOptions: true, timeLimitMinutes: 25, passingScore: level.requiredScore, maxAttempts: 3, isPublished: true });
      }
      await initializeStudentProgress(member.id);
    }

    const allDbUsers = await db.select().from(users);
    for (const u of allDbUsers) {
      if (!u.profilePhoto || !u.coverPhoto) {
        await db.update(users).set({
          profilePhoto: u.profilePhoto || "/images/profile-council.jpg",
          coverPhoto: u.coverPhoto || "/images/cover-default.jpg",
        }).where(eq(users.id, u.id));
      }
    }

    if (firstRun || legacy) {
      const peerPassword = await hashPassword("Member123!");
      const [{ id: marcusId }] = await db.insert(users).values({ email: "marcus@demolaypathway.org", passwordHash: peerPassword, fullName: "Marcus Reed", education: "Member", profileBio: "Service project planner and meeting regular.", role: "student", accountStatus: "active", guideCompletedAt: new Date(), passwordChangedAt: new Date() }).$returningId();
      const [{ id: owenId }] = await db.insert(users).values({ email: "owen@demolaypathway.org", passwordHash: peerPassword, fullName: "Owen Brooks", education: "Member", profileBio: "Building confidence, connections, and good study habits.", role: "student", accountStatus: "active", guideCompletedAt: new Date(), passwordChangedAt: new Date() }).$returningId();
      await initializeStudentProgress(marcusId);
      await initializeStudentProgress(owenId);
    }

    const demoRow = (await db.select().from(settings).limit(1))[0];
    if (demoRow && demoRow.demoSeedVersion < 4) {
      if (demoRow.demoSeedVersion < 1) await seedExpandedMockData();
      if (demoRow.demoSeedVersion < 2) await seedStoreAndRetakeDemo();
      await seedImagesDemo();
      await db.update(settings).set({ demoSeedVersion: 4 }).where(eq(settings.id, demoRow.id));
    }

    const missingRegistration = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.email, DEMO_MEMBER_EMAILS), isNull(users.registrationDetails)))
      .limit(1);
    if (missingRegistration.length) await seedRegistrationDetailsMock();
  })();

  try {
    await seeding;
  } finally {
    seeding = null;
  }
}
