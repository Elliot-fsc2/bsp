import bcrypt from "bcryptjs";
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
  siteSettings,
  submissions,
  users,
} from "@/db/schema";

let seeded = false;

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function ensureSeeded() {
  if (seeded) return;
  try {
    const existing = await db.select({ id: users.id }).from(users).limit(1);
    if (existing.length > 0) {
      seeded = true;
      return;
    }
  } catch {
    return;
  }

  const passwordHash = await bcrypt.hash("laginghanda", 10);

  await db.insert(users).values([
    {
      name: "Ramon Delos Reyes",
      email: "admin@bsp.org.ph",
      passwordHash,
      role: "admin",
      avatarColor: "#1b4332",
      bio: "Council Executive. I review and approve advancement for the whole council.",
    },
    { name: "Miguel Tan", email: "miguel@bsp.org.ph", passwordHash, role: "teacher", avatarColor: "#2d6a4f", bio: "Scout Leader for outdoor skills — knots, pioneering, and campcraft." },
    { name: "Rosario Lim", email: "rosario@bsp.org.ph", passwordHash, role: "teacher", avatarColor: "#40916c", bio: "Scout Leader for safety — first aid and emergency response." },
    { name: "Ernesto Cruz", email: "ernesto@bsp.org.ph", passwordHash, role: "teacher", avatarColor: "#bc6c25", bio: "Scout Leader for citizenship and leadership — service and the Scout Law." },
    { name: "Lucia Fernandez", email: "lucia@bsp.org.ph", passwordHash, role: "teacher", avatarColor: "#7b6d8d", bio: "Scout Leader for signalling and Scout craft." },
    { name: "Paolo Reyes", email: "paolo@bsp.org.ph", passwordHash, role: "student", avatarColor: "#52b788", bio: "Boy Scout working on his Membership Rank." },
    { name: "Ana Villanueva", email: "ana@bsp.org.ph", passwordHash, role: "student", avatarColor: "#74c69d", bio: "Boy Scout who loves first aid drills and long hikes." },
    { name: "Kian Dalisay", email: "kian@bsp.org.ph", passwordHash, role: "student", avatarColor: "#95d5b2", bio: "Boy Scout who always asks one more question about the outdoors." },
    { name: "Bea Santiago", email: "bea@bsp.org.ph", passwordHash, role: "student", avatarColor: "#d4a373", bio: "Senior Scout and writer of campfire stories." },
    { name: "Ella Marquez", email: "ella@bsp.org.ph", passwordHash, role: "student", avatarColor: "#c9a227", bio: "KID Scout with a watercolor hobby and a love for nature." },
    { name: "Omar Haddad", email: "omar@bsp.org.ph", passwordHash, role: "student", avatarColor: "#6b705c", bio: "Boy Scout who shines during knot-tying drills." },
    { name: "Jasmine Ocampo", email: "jasmine@bsp.org.ph", passwordHash, role: "student", avatarColor: "#f4a261", bio: "KID Scout who loves songs and storytelling." },
    { name: "Noel Aquino", email: "noel@bsp.org.ph", passwordHash, role: "student", avatarColor: "#2a6f97", bio: "Senior Scout who is always the first to volunteer." },
    { name: "Tala Bautista", email: "tala@bsp.org.ph", passwordHash, role: "student", avatarColor: "#bc4749", bio: "Boy Scout with a steady hand for first aid." },
    { name: "Ivan Soriano", email: "ivan@bsp.org.ph", passwordHash, role: "student", avatarColor: "#40916c", bio: "Senior Scout who never misses a hike." },
  ]);

  const userRows = await db.select().from(users);
  const byEmail = Object.fromEntries(userRows.map((u) => [u.email, u]));
  const admin = byEmail["admin@bsp.org.ph"]!;
  const miguel = byEmail["miguel@bsp.org.ph"]!;
  const rosario = byEmail["rosario@bsp.org.ph"]!;
  const ernesto = byEmail["ernesto@bsp.org.ph"]!;
  const paolo = byEmail["paolo@bsp.org.ph"]!;
  const ana = byEmail["ana@bsp.org.ph"]!;
  const kian = byEmail["kian@bsp.org.ph"]!;
  const bea = byEmail["bea@bsp.org.ph"]!;
  const ella = byEmail["ella@bsp.org.ph"]!;
  const ivan = byEmail["ivan@bsp.org.ph"]!;
  const tala = byEmail["tala@bsp.org.ph"]!;

  await db.insert(siteSettings).values([
    { key: "siteName", value: "Boy Scouts of the Philippines" },
    { key: "tagline", value: "Laging Handa — Always Prepared" },
    { key: "theme", value: "forest" },
    { key: "allowRegistration", value: "true" },
    {
      key: "welcomeMessage",
      value:
        "Welcome to the Boy Scouts of the Philippines Advancement Portal. Join a program, climb the ranks in order, and earn merit badges. Every task is submitted with your proof and confirmed by your Scout Leader and the Council.",
    },
    { key: "maintenanceMode", value: "false" },
    { key: "supportEmail", value: "support@bsp.org.ph" },
    { key: "mascotName", value: "Handa" },
    { key: "logoUrl", value: "" },
    { key: "faviconUrl", value: "/images/logo.svg" },
  ]);

  await db.insert(programs).values([
    {
      name: "KID Scout Program",
      slug: "kid-scouts",
      section: "Kabataang Imumulat sa Diwa ng Scouting",
      ageRange: "6-9 years",
      description: "The first steps in Scouting — songs, games, and simple promises for our youngest members.",
      color: "#52b788",
      icon: "🌱",
      position: 0,
    },
    {
      name: "Boy Scout Program",
      slug: "boy-scouts",
      section: "Boy Scout Program",
      ageRange: "10-12 years",
      description:
        "The core Scouting program. Earn the Membership Rank first, then climb the ranks — Tenderfoot, Second Class, and First Class — collecting merit badges along the way.",
      color: "#2d6a4f",
      icon: "⚜️",
      position: 1,
    },
    {
      name: "Senior Scout Program",
      slug: "senior-scouts",
      section: "Senior Scout Program",
      ageRange: "13-16 years",
      description: "For older Scouts: leadership, signalling, service, and advanced outdoor skills.",
      color: "#1d4e89",
      icon: "🧭",
      position: 2,
    },
  ]);

  const programRows = await db.select().from(programs);
  const programBySlug = Object.fromEntries(programRows.map((p) => [p.slug, p]));

  await db.insert(badgeCategories).values([
    { name: "Scout Ideals", slug: "scout-ideals", description: "The Oath, the Law, and the promise of a Scout.", color: "#2d6a4f", icon: "⚜️", position: 0 },
    { name: "Outdoor Skills", slug: "outdoor-skills", description: "Campcraft, knots, pioneering, and life in the open.", color: "#40916c", icon: "🏕️", position: 1 },
    { name: "Safety & First Aid", slug: "safety-first-aid", description: "Be prepared to help in an emergency.", color: "#bc4749", icon: "⛑️", position: 2 },
    { name: "Citizenship & Leadership", slug: "citizenship-leadership", description: "Duty to country, service to others, and leading a patrol.", color: "#1d4e89", icon: "🇵🇭", position: 3 },
    { name: "Scout Craft & Signalling", slug: "scout-craft", description: "Messages, observation, and outdoor know-how.", color: "#2a6f97", icon: "🧭", position: 4 },
  ]);
  const categoryRows = await db.select().from(badgeCategories);
  const categoryBySlug = Object.fromEntries(categoryRows.map((c) => [c.slug, c]));

  const badgeDefs: {
    program: string;
    category: string;
    kind: "rank" | "merit";
    slug: string;
    name: string;
    description: string;
    image: string | null;
    isMembership: boolean;
    position: number;
  }[] = [
    {
      program: "boy-scouts",
      category: "scout-ideals",
      kind: "rank",
      slug: "boy-membership",
      name: "Membership Rank",
      description: "The first rank of the Boy Scout Program. Show your love of country and your promise to the movement.",
      image: "/images/badges/membership-badge.svg",
      isMembership: true,
      position: 0,
    },
    {
      program: "boy-scouts",
      category: "scout-ideals",
      kind: "rank",
      slug: "boy-tenderfoot",
      name: "Tenderfoot Scout Rank",
      description: "The first step after the Membership Rank — a Scout learning the basics of the outdoors and the movement.",
      image: "/images/badges/tenderfoot-scout.svg",
      isMembership: false,
      position: 1,
    },
    {
      program: "boy-scouts",
      category: "outdoor-skills",
      kind: "rank",
      slug: "boy-second-class",
      name: "Second Class Scout Rank",
      description: "A Scout who can camp, cook, and care for the outdoors.",
      image: "/images/badges/second-class-scout.svg",
      isMembership: false,
      position: 2,
    },
    {
      program: "boy-scouts",
      category: "outdoor-skills",
      kind: "rank",
      slug: "boy-first-class",
      name: "First Class Scout Rank",
      description: "A confident outdoorsman who leads others on the trail.",
      image: "/images/badges/first-class-scout.svg",
      isMembership: false,
      position: 3,
    },
    { program: "boy-scouts", category: "safety-first-aid", kind: "merit", slug: "merit-first-aid", name: "First Aid", description: "Be prepared to help in an emergency.", image: "/images/badges/first-aid.svg", isMembership: false, position: 10 },
    { program: "boy-scouts", category: "outdoor-skills", kind: "merit", slug: "merit-knot-tying", name: "Knot Tying and Pioneering", description: "Ropes, knots, and camp gadgets.", image: "/images/badges/knot-tying.svg", isMembership: false, position: 11 },
    { program: "boy-scouts", category: "outdoor-skills", kind: "merit", slug: "merit-campcraft", name: "Campcraft", description: "Live well and safely in the outdoors.", image: "/images/badges/campcraft.svg", isMembership: false, position: 12 },
    { program: "boy-scouts", category: "citizenship-leadership", kind: "merit", slug: "merit-citizenship", name: "Citizenship", description: "Know your country and serve your community.", image: "/images/badges/citizenship.svg", isMembership: false, position: 13 },

    {
      program: "kid-scouts",
      category: "scout-ideals",
      kind: "rank",
      slug: "kid-membership",
      name: "Membership Rank",
      description: "The KID Scout welcome rank.",
      image: "/images/badges/kid-membership.svg",
      isMembership: true,
      position: 0,
    },
    {
      program: "kid-scouts",
      category: "scout-ideals",
      kind: "rank",
      slug: "kid-scout-rank",
      name: "KID Scout Rank",
      description: "A young Scout who knows the promise and loves the outdoors.",
      image: "/images/badges/kid-scout.svg",
      isMembership: false,
      position: 1,
    },
    { program: "kid-scouts", category: "outdoor-skills", kind: "merit", slug: "merit-nature-study", name: "Nature Study", description: "Notice the world around you.", image: "/images/badges/nature-study.svg", isMembership: false, position: 10 },

    {
      program: "senior-scouts",
      category: "scout-ideals",
      kind: "rank",
      slug: "senior-membership",
      name: "Membership Rank",
      description: "The Senior Scout welcome rank.",
      image: "/images/badges/senior-membership.svg",
      isMembership: true,
      position: 0,
    },
    {
      program: "senior-scouts",
      category: "citizenship-leadership",
      kind: "rank",
      slug: "senior-scout-rank",
      name: "Senior Scout Rank",
      description: "A Scout who leads patrols and sets the example.",
      image: "/images/badges/senior-scout.svg",
      isMembership: false,
      position: 1,
    },
    {
      program: "senior-scouts",
      category: "citizenship-leadership",
      kind: "rank",
      slug: "explorer-scout-rank",
      name: "Explorer Scout Rank",
      description: "A Scout who plans and carries out service that matters.",
      image: "/images/badges/explorer-scout.svg",
      isMembership: false,
      position: 2,
    },
    { program: "senior-scouts", category: "citizenship-leadership", kind: "merit", slug: "merit-leadership", name: "Leadership", description: "Lead a patrol and plan an activity.", image: "/images/badges/leadership.svg", isMembership: false, position: 10 },
    { program: "senior-scouts", category: "scout-craft", kind: "merit", slug: "merit-signalling", name: "Signalling", description: "Send messages without a phone.", image: "/images/badges/signalling.svg", isMembership: false, position: 11 },
    { program: "senior-scouts", category: "citizenship-leadership", kind: "merit", slug: "merit-community-service", name: "Community Service", description: "Plan and carry out service that matters.", image: "/images/badges/community-service.svg", isMembership: false, position: 12 },
  ];

  await db.insert(badges).values(
    badgeDefs.map((b) => ({
      programId: programBySlug[b.program]!.id,
      categoryId: categoryBySlug[b.category]!.id,
      kind: b.kind,
      name: b.name,
      slug: b.slug,
      description: b.description,
      imageUrl: b.image,
      isMembership: b.isMembership,
      position: b.position,
    })),
  );

  const badgeRows = await db.select().from(badges);
  const badgeBySlug = Object.fromEntries(badgeRows.map((b) => [b.slug, b]));

  type Quiz = { q: string; options: string[]; answer: number };
  const requirementDefs: {
    key: string;
    badge: string;
    title: string;
    type: "recite" | "quiz" | "task" | "merit";
    position: number;
    description?: string;
    instructions?: string;
    requiresText?: boolean;
    requiresMedia?: boolean;
    mediaKind?: "video" | "image";
    requiresLink?: boolean;
    quiz?: Quiz[];
    requiredBadge?: string;
    points?: number;
  }[] = [
    {
      key: "boy-membership.anthem",
      badge: "boy-membership",
      title: "Sing the Philippine National Anthem (Lupang Hinirang)",
      type: "recite",
      position: 0,
      description: "Show your love of country.",
      instructions:
        "Stand at attention, sing Lupang Hinirang with proper bearing, and record yourself on video.\n\nUpload the video of your performance, then submit it for approval.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 15,
    },
    {
      key: "boy-membership.flag-oath",
      badge: "boy-membership",
      title: "Recite the Panunumpa ng Katapatan sa Watawat",
      type: "recite",
      position: 1,
      description: "The Oath of Allegiance to the Flag.",
      instructions: "Recite the Panunumpa ng Katapatan sa Watawat from memory. Record a video of your recitation.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 15,
    },
    {
      key: "boy-membership.panatang",
      badge: "boy-membership",
      title: "Recite the Panatang Makabayan",
      type: "recite",
      position: 2,
      description: "The Patriotic Pledge.",
      instructions: "Recite the Panatang Makabayan from memory. Record a video of your recitation.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 15,
    },
    {
      key: "boy-membership.oath-quiz",
      badge: "boy-membership",
      title: "Scout Oath and Law check",
      type: "quiz",
      position: 3,
      description: "Answer the questions, then explain what the Law means to you.",
      instructions: "Answer the questions below, then write a short reflection in your own words.",
      requiresText: true,
      quiz: [
        { q: "How many points does the Scout Law have?", options: ["Eight", "Ten", "Twelve", "Twenty"], answer: 2 },
        { q: "The BSP motto is…", options: ["Laging Handa", "Bahala na", "Kanya-kanya", "Never mind"], answer: 0 },
        { q: "A Scout is trustworthy. Which point of the Law is this?", options: ["First", "Third", "Fifth", "Twelfth"], answer: 0 },
      ],
      points: 10,
    },

    {
      key: "boy-tenderfoot.signs",
      badge: "boy-tenderfoot",
      title: "Demonstrate the Scout sign, salute, and handshake",
      type: "task",
      position: 0,
      description: "Show the three Scout gestures correctly.",
      instructions: "Record a short video showing the Scout sign, the Scout salute, and the Scout handshake.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 10,
    },
    {
      key: "boy-tenderfoot.knot-quiz",
      badge: "boy-tenderfoot",
      title: "Knot knowledge check",
      type: "quiz",
      position: 1,
      description: "Know your basic knots.",
      requiresText: false,
      quiz: [
        { q: "Which knot joins two ropes of different thickness?", options: ["Square knot", "Sheet bend", "Clove hitch", "Overhand"], answer: 1 },
        { q: "A square knot joins…", options: ["Two ropes of equal thickness", "A rope to a pole", "Two ropes of different thickness", "Nothing"], answer: 0 },
      ],
      points: 10,
    },
    {
      key: "boy-tenderfoot.first-aid-mb",
      badge: "boy-tenderfoot",
      title: "Earn the First Aid merit badge",
      type: "merit",
      position: 2,
      description: "A Scout must be prepared to help.",
      requiredBadge: "merit-first-aid",
      points: 20,
    },

    {
      key: "boy-second-class.campcraft-mb",
      badge: "boy-second-class",
      title: "Earn the Campcraft merit badge",
      type: "merit",
      position: 0,
      description: "Live well in the outdoors.",
      requiredBadge: "merit-campcraft",
      points: 20,
    },
    {
      key: "boy-second-class.fire",
      badge: "boy-second-class",
      title: "Campfire safety plan",
      type: "task",
      position: 1,
      description: "Safety before sparks.",
      instructions: "Write your campfire safety plan: siting, clearing, water on hand, and how you will put it out cold.",
      requiresText: true,
      points: 15,
    },
    {
      key: "boy-second-class.citizenship-mb",
      badge: "boy-second-class",
      title: "Earn the Citizenship merit badge",
      type: "merit",
      position: 2,
      description: "Know your country and serve your community.",
      requiredBadge: "merit-citizenship",
      points: 20,
    },

    {
      key: "boy-first-class.knot-mb",
      badge: "boy-first-class",
      title: "Earn the Knot Tying and Pioneering merit badge",
      type: "merit",
      position: 0,
      description: "Master ropes and lashings.",
      requiredBadge: "merit-knot-tying",
      points: 20,
    },
    {
      key: "boy-first-class.patrol-lead",
      badge: "boy-first-class",
      title: "Plan and lead a patrol activity",
      type: "task",
      position: 1,
      description: "Lead by example.",
      instructions:
        "Plan a short patrol activity, lead it, and summarise what you learned. Attach your activity plan from Google Drive if you have one.",
      requiresText: true,
      requiresLink: true,
      points: 20,
    },

    {
      key: "kid-membership.anthem",
      badge: "kid-membership",
      title: "Sing the Philippine National Anthem (Lupang Hinirang)",
      type: "recite",
      position: 0,
      description: "Our national anthem.",
      instructions: "Sing Lupang Hinirang with your patrol and record it.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 10,
    },
    {
      key: "kid-membership.panatang",
      badge: "kid-membership",
      title: "Recite the Panatang Makabayan",
      type: "recite",
      position: 1,
      description: "Our patriotic pledge.",
      instructions: "Recite the Panatang Makabayan and record a video.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 10,
    },
    {
      key: "kid-scout-rank.nature-mb",
      badge: "kid-scout-rank",
      title: "Earn the Nature Study merit badge",
      type: "merit",
      position: 0,
      description: "Notice the world around you.",
      requiredBadge: "merit-nature-study",
      points: 15,
    },

    {
      key: "senior-membership.oath",
      badge: "senior-membership",
      title: "Recite the Scout Oath and Law",
      type: "recite",
      position: 0,
      description: "The promise of a Scout.",
      instructions: "Recite the Scout Oath and the twelve points of the Scout Law from memory on video.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 15,
    },
    {
      key: "senior-membership.law-words",
      badge: "senior-membership",
      title: "Explain the Scout Law in your own words",
      type: "task",
      position: 1,
      description: "Make it your own.",
      instructions: "Write what each point of the Scout Law means to you, with one example from your week.",
      requiresText: true,
      points: 15,
    },
    {
      key: "senior-scout-rank.leadership-mb",
      badge: "senior-scout-rank",
      title: "Earn the Leadership merit badge",
      type: "merit",
      position: 0,
      description: "Lead by example.",
      requiredBadge: "merit-leadership",
      points: 20,
    },
    {
      key: "senior-scout-rank.signalling-mb",
      badge: "senior-scout-rank",
      title: "Earn the Signalling merit badge",
      type: "merit",
      position: 1,
      description: "Send messages without a phone.",
      requiredBadge: "merit-signalling",
      points: 20,
    },
    {
      key: "explorer-scout-rank.service-mb",
      badge: "explorer-scout-rank",
      title: "Earn the Community Service merit badge",
      type: "merit",
      position: 0,
      description: "Service is the Scout way.",
      requiredBadge: "merit-community-service",
      points: 20,
    },

    {
      key: "merit-first-aid.three-ps",
      badge: "merit-first-aid",
      title: "The three Ps of first aid",
      type: "quiz",
      position: 0,
      description: "Preserve life, Prevent further injury, Promote recovery.",
      requiresText: false,
      quiz: [
        { q: "The three Ps are Preserve life, Prevent further injury, and…", options: ["Provide snacks", "Promote recovery", "Pay attention", "Practice more"], answer: 1 },
        { q: "For a minor burn you should…", options: ["Apply butter", "Cool it with running water", "Pop the blister", "Toothpaste"], answer: 1 },
      ],
      points: 10,
    },
    {
      key: "merit-first-aid.bandage",
      badge: "merit-first-aid",
      title: "Bandaging drill",
      type: "task",
      position: 1,
      description: "Show a clean bandaging technique.",
      instructions: "Record a video of yourself bandaging a partner's forearm. Describe the steps you took.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 15,
    },
    {
      key: "merit-knot-tying.four-knots",
      badge: "merit-knot-tying",
      title: "Tie four basic knots",
      type: "task",
      position: 0,
      description: "Square knot, sheet bend, clove hitch, and two half hitches.",
      instructions: "Tie each knot and record a short video, naming each one as you tie it.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 15,
    },
    {
      key: "merit-knot-tying.quiz",
      badge: "merit-knot-tying",
      title: "Knots quiz",
      type: "quiz",
      position: 1,
      description: "Check your knot knowledge.",
      requiresText: false,
      quiz: [{ q: "Which knot is used to start a lashing?", options: ["Clove hitch", "Square knot", "Sheet bend", "Bowline"], answer: 0 }],
      points: 10,
    },
    {
      key: "merit-campcraft.tent",
      badge: "merit-campcraft",
      title: "Pitch and strike a tent",
      type: "task",
      position: 0,
      description: "Set up a tent correctly.",
      instructions: "Record a video pitching your tent, then explain how you chose the ground and the direction.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 15,
    },
    {
      key: "merit-campcraft.fire",
      badge: "merit-campcraft",
      title: "Campfire safety plan",
      type: "task",
      position: 1,
      description: "Safety before sparks.",
      instructions: "Write your campfire safety plan: siting, clearing, water on hand, and how you will put it out cold.",
      requiresText: true,
      points: 15,
    },
    {
      key: "merit-citizenship.flag",
      badge: "merit-citizenship",
      title: "Join a flag ceremony",
      type: "task",
      position: 0,
      description: "Respect for the flag.",
      instructions: "Take part in a flag ceremony and upload a photo. Describe your role and what you felt.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "image",
      points: 15,
    },
    {
      key: "merit-citizenship.rights",
      badge: "merit-citizenship",
      title: "Rights and responsibilities",
      type: "quiz",
      position: 1,
      description: "Every right has a duty.",
      requiresText: true,
      quiz: [
        { q: "Good community service begins with…", options: ["Buying materials", "Listening to the community", "Taking photos", "Choosing a title"], answer: 1 },
        { q: "In the flag ceremony, the flag is lowered…", options: ["At noon", "At dusk", "At dawn", "Never"], answer: 1 },
      ],
      points: 10,
    },
    {
      key: "merit-nature-study.walk",
      badge: "merit-nature-study",
      title: "Nature walk observation",
      type: "task",
      position: 0,
      description: "Notice what others miss.",
      instructions: "Take a nature walk. Upload a photo of three things you noticed and write what you learned.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "image",
      points: 15,
    },
    {
      key: "merit-leadership.lead",
      badge: "merit-leadership",
      title: "Lead a patrol activity",
      type: "task",
      position: 0,
      description: "Lead by example.",
      instructions: "Plan and lead one patrol activity. Record a short video and describe how you shared the roles.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 20,
    },
    {
      key: "merit-signalling.semaphore",
      badge: "merit-signalling",
      title: "Send a message by semaphore",
      type: "task",
      position: 0,
      description: "Send without a phone.",
      instructions: "Send three short words by semaphore or Morse. Record it and write the words you sent.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "video",
      points: 15,
    },
    {
      key: "merit-community-service.plan",
      badge: "merit-community-service",
      title: "Plan a service project",
      type: "task",
      position: 0,
      description: "Listen first, then act.",
      instructions:
        "Write your service plan: the need, who you will help, what you will do, and how you will measure success. Attach a document from Google Drive if you have one.",
      requiresText: true,
      requiresLink: true,
      points: 20,
    },
    {
      key: "merit-community-service.report",
      badge: "merit-community-service",
      title: "Service report",
      type: "task",
      position: 1,
      description: "Show what happened.",
      instructions: "Report on your service: photos and a short write-up of the outcome.",
      requiresText: true,
      requiresMedia: true,
      mediaKind: "image",
      points: 20,
    },
  ];

  const requirementId: Record<string, number> = {};
  const requirementBadge: Record<string, string> = {};
  for (const r of requirementDefs) {
    const [{ id }] = await db
      .insert(badgeRequirements)
      .values({
        badgeId: badgeBySlug[r.badge]!.id,
        title: r.title,
        description: r.description ?? null,
        instructions: r.instructions ?? null,
        type: r.type,
        position: r.position,
        requiresText: r.requiresText ?? true,
        requiresMedia: r.requiresMedia ?? false,
        mediaKind: r.mediaKind ?? "video",
        requiresLink: r.requiresLink ?? false,
        quizJson: r.quiz ? JSON.stringify(r.quiz) : null,
        requiredBadgeId: r.requiredBadge ? badgeBySlug[r.requiredBadge]!.id : null,
        points: r.points ?? 10,
      })
      .$returningId();
    requirementId[r.key] = id;
    requirementBadge[r.key] = r.badge;
  }

  const approvedSeeds: {
    user: number;
    key: string;
    text: string;
    mediaUrl?: string;
    mediaType?: string;
    quizJson?: string;
    quizScore?: number;
    level1By: number;
    level2By: number;
  }[] = [
    {
      user: paolo.id,
      key: "boy-membership.anthem",
      text: "I sang Lupang Hinirang standing at attention with my patrol. Practice made it much easier.",
      mediaUrl: "/images/badges/membership-badge.svg",
      mediaType: "image",
      level1By: miguel.id,
      level2By: admin.id,
    },
    {
      user: paolo.id,
      key: "boy-membership.oath-quiz",
      text: "The Scout Law is a checklist for being a good person. For me, 'helpful' is the hardest and the most important.",
      quizJson: JSON.stringify([2, 0, 0]),
      quizScore: 100,
      level1By: miguel.id,
      level2By: admin.id,
    },
    {
      user: kian.id,
      key: "merit-first-aid.three-ps",
      text: "Check, Call, Care. I remembered it by saying it out loud before each drill.",
      quizJson: JSON.stringify([1, 1]),
      quizScore: 100,
      level1By: rosario.id,
      level2By: admin.id,
    },
    {
      user: kian.id,
      key: "merit-first-aid.bandage",
      text: "I bandaged Ana's forearm, then checked her fingers for warmth and colour. Two fingers slid under the bandage, so the pressure was right.",
      mediaUrl: "/images/badges/first-aid.svg",
      mediaType: "image",
      level1By: rosario.id,
      level2By: admin.id,
    },
    {
      user: bea.id,
      key: "merit-nature-study.walk",
      text: "On my walk I noticed a spider web with dew, a fallen nest, and tiny tracks by the creek.",
      mediaUrl: "/images/badges/nature-study.svg",
      mediaType: "image",
      level1By: rosario.id,
      level2By: admin.id,
    },
  ];

  for (const item of approvedSeeds) {
    const [{ id: submissionId }] = await db
      .insert(submissions)
      .values({
        userId: item.user,
        kind: "requirement",
        badgeId: badgeBySlug[requirementBadge[item.key]]!.id,
        requirementId: requirementId[item.key],
        textContent: item.text,
        mediaUrl: item.mediaUrl ?? null,
        mediaType: item.mediaType ?? null,
        quizJson: item.quizJson ?? null,
        quizScore: item.quizScore ?? null,
        status: "approved",
        levelsApproved: 2,
        levelsRequired: 2,
        decidedAt: new Date(),
      })
      .$returningId();
    await db.insert(approvals).values([
      { submissionId, approverId: item.level1By, level: 1, decision: "approved", comment: "Well done. Requirement met." },
      { submissionId, approverId: item.level2By, level: 2, decision: "approved", comment: "Confirmed. Recorded for advancement." },
    ]);
  }

  const level1Seeds: { user: number; key: string; text: string; mediaUrl?: string; mediaType?: string; quizJson?: string; level1By: number }[] = [
    { user: paolo.id, key: "boy-membership.flag-oath", text: "I recited the Panunumpa ng Katapatan sa Watawat from memory.", mediaUrl: "/images/badges/membership-badge.svg", mediaType: "image", level1By: miguel.id },
    { user: ana.id, key: "merit-first-aid.three-ps", text: "The three Ps help me stay calm. I will practise the bandaging next.", quizJson: JSON.stringify([1, 1]), level1By: rosario.id },
  ];
  for (const item of level1Seeds) {
    const [{ id: submissionId }] = await db
      .insert(submissions)
      .values({
        userId: item.user,
        kind: "requirement",
        badgeId: badgeBySlug[requirementBadge[item.key]]!.id,
        requirementId: requirementId[item.key],
        textContent: item.text,
        mediaUrl: item.mediaUrl ?? null,
        mediaType: item.mediaType ?? null,
        quizJson: item.quizJson ?? null,
        quizScore: item.quizJson ? 100 : null,
        status: "level1_approved",
        levelsApproved: 1,
        levelsRequired: 2,
      })
      .$returningId();
    await db.insert(approvals).values({
      submissionId,
      approverId: item.level1By,
      level: 1,
      decision: "approved",
      comment: "Checked by the unit. Forwarded to the council for confirmation.",
    });
  }

  const pendingSeeds: { user: number; key: string; text: string; mediaUrl?: string; mediaType?: string }[] = [
    { user: paolo.id, key: "boy-membership.panatang", text: "I practised the Panatang Makabayan every morning this week.", mediaUrl: "/images/badges/membership-badge.svg", mediaType: "image" },
    { user: tala.id, key: "boy-membership.anthem", text: "Here is my video singing Lupang Hinirang with my patrol.", mediaUrl: "/images/badges/membership-badge.svg", mediaType: "image" },
    { user: kian.id, key: "boy-tenderfoot.signs", text: "I showed the Scout sign, salute, and handshake in the video.", mediaUrl: "/images/badges/leadership.svg", mediaType: "image" },
    { user: ivan.id, key: "merit-signalling.semaphore", text: "I sent three words: CAMP, WATER, TIRED.", mediaUrl: "/images/badges/signalling.svg", mediaType: "image" },
  ];
  for (const item of pendingSeeds) {
    await db.insert(submissions).values({
      userId: item.user,
      kind: "requirement",
      badgeId: badgeBySlug[requirementBadge[item.key]]!.id,
      requirementId: requirementId[item.key],
      textContent: item.text,
      mediaUrl: item.mediaUrl ?? null,
      mediaType: item.mediaType ?? null,
      status: "pending",
      levelsApproved: 0,
      levelsRequired: 2,
    });
  }

  await db.insert(awardedBadges).values([
    { userId: bea.id, badgeId: badgeBySlug["merit-nature-study"]!.id },
  ]);

  await db.insert(announcements).values([
    {
      programId: null,
      authorId: admin.id,
      title: "Welcome to the BSP Advancement Portal ⚜️",
      body: "Scouts — join a program, climb the ranks in order, and earn merit badges. Submit your proof and track your approvals. Laging Handa!",
      pinned: true,
    },
    {
      programId: programBySlug["boy-scouts"]!.id,
      authorId: miguel.id,
      title: "Membership Rank videos this meeting",
      body: "Bring your recording ready: Lupang Hinirang, the Panunumpa ng Katapatan sa Watawat, and the Panatang Makabayan. We will record together.",
      pinned: false,
    },
    {
      programId: programBySlug["boy-scouts"]!.id,
      authorId: rosario.id,
      title: "First Aid merit badge drill day",
      body: "We practise bandaging and splinting in pairs. The bandaging drill requirement needs a short video.",
      pinned: false,
    },
    {
      programId: programBySlug["senior-scouts"]!.id,
      authorId: ernesto.id,
      title: "Senior Scout service project",
      body: "Start thinking about your Community Service merit badge. Bring one idea for a project that helps the barangay.",
      pinned: false,
    },
  ]);

  const [{ id: membershipTopicId }] = await db
    .insert(forumTopics)
    .values({
      programId: programBySlug["boy-scouts"]!.id,
      authorId: paolo.id,
      title: "How do you memorise the Panatang Makabayan?",
    })
    .$returningId();
  const [{ id: firstAidTopicId }] = await db
    .insert(forumTopics)
    .values({
      programId: programBySlug["boy-scouts"]!.id,
      authorId: tala.id,
      title: "Bandage too tight? Ask here",
    })
    .$returningId();
  const [{ id: loungeId }] = await db
    .insert(forumTopics)
    .values({ programId: null, authorId: bea.id, title: "Campfire lounge: what rank are you working on?" })
    .$returningId();

  await db.insert(forumPosts).values([
    { topicId: membershipTopicId, authorId: paolo.id, body: "I keep mixing up the middle lines. Any tricks?" },
    { topicId: membershipTopicId, authorId: miguel.id, body: "Say it out loud with the flag in front of you, three times a day. Rhythm helps more than reading." },
    { topicId: membershipTopicId, authorId: tala.id, body: "I record myself and listen back. It is easier to spot the line I drop." },
  ]);
  await db.insert(forumPosts).values([
    { topicId: firstAidTopicId, authorId: tala.id, body: "How do I know the bandage is snug but not too tight?" },
    { topicId: firstAidTopicId, authorId: rosario.id, body: "Slide two fingers under it. If they fit comfortably, the pressure is right. Always re-check the fingers." },
  ]);
  await db.insert(forumPosts).values([
    { topicId: loungeId, authorId: bea.id, body: "I am on the Senior Scout Rank now. Leadership next." },
    { topicId: loungeId, authorId: ivan.id, body: "Signalling merit badge for me this week. Semaphore is harder than it looks." },
  ]);

  await db.insert(notifications).values([
    {
      userId: paolo.id,
      title: "Membership Rank in progress",
      body: "Your Lupang Hinirang video was approved. Submit the Panunumpa ng Katapatan sa Watawat next.",
      href: "/advancement/badge/" + badgeBySlug["boy-membership"]!.id,
    },
    {
      userId: miguel.id,
      title: "Approvals waiting",
      body: "Submissions are waiting for unit (level 1) approval.",
      href: "/approvals",
    },
    {
      userId: admin.id,
      title: "Council approvals waiting",
      body: "Submissions are waiting for council (level 2) confirmation.",
      href: "/approvals",
    },
    {
      userId: bea.id,
      title: "Nature Study merit badge awarded ⚜️",
      body: "The badge is on your sash. On to the Senior Scout Rank!",
      href: "/advancement",
    },
  ]);

  await db.insert(calendarEvents).values([
    { programId: null, title: "Council Jamboree & camporee", description: "Troops from every district gather for games, skills, and a big campfire.", startAt: daysFromNow(4), type: "event" },
    { programId: programBySlug["boy-scouts"]!.id, title: "Membership Rank recording day", description: "Bring your videos for the anthem and pledges.", startAt: daysFromNow(2), type: "event" },
    { programId: programBySlug["boy-scouts"]!.id, title: "First aid demo day", description: "Patrols show a two-minute bandaging drill.", startAt: daysFromNow(6), type: "event" },
    { programId: null, title: "Tree Planting Day", description: "Optional half-day tree planting in the community.", startAt: daysFromNow(9), type: "holiday" },
  ]);

  seeded = true;
}
