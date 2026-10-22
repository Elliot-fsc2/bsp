export type LandingFeature = { title: string; copy: string };

export type LandingContent = {
  hero: {
    eyebrow: string;
    heading: string;
    paragraph: string;
    primaryCta: string;
    secondaryCta: string;
    image: string | null;
    imageAlt: string;
  };
  companion: {
    eyebrow: string;
    heading: string;
    paragraph: string;
    image: string | null;
    imageAlt: string;
    features: LandingFeature[];
  };
  levels: {
    eyebrow: string;
    heading: string;
    paragraph: string;
  };
  registration: {
    eyebrow: string;
    heading: string;
    paragraph: string;
    cta: string;
    image: string | null;
    imageAlt: string;
  };
  footer: {
    note: string;
  };
};

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    eyebrow: "DeMolay Nexus",
    heading: "Character. Leadership. Brotherhood. Service.",
    paragraph:
      "A five-level learning pathway to strengthen the habits that make a chapter and its members thrive. Study, serve, pass, and grow into greater responsibility.",
    primaryCta: "Become a pathway member",
    secondaryCta: "Member sign in",
    image: null,
    imageAlt: "DeMolay youth leaders entering a chapter hall",
  },
  companion: {
    eyebrow: "A DeMolay learning companion",
    heading: "Build the habits of a leader your chapter can count on.",
    paragraph:
      "This LMS turns chapter growth into an organized experience: DeMolay-focused lessons, study windows, general assessments, and verified registration — one clear level at a time.",
    image: null,
    imageAlt: "Five illuminated stages of the leadership pathway",
    features: [
      {
        title: "Member-first lessons",
        copy: "Administrators publish rich lessons with leadership videos, Google Drive material, and ready-to-use HTML embeds.",
      },
      {
        title: "Virtue-led assessment",
        copy: "Question banks can cover the Seven Cardinal Virtues, citizenship, service, and leadership judgment.",
      },
      {
        title: "Study with purpose",
        copy: "Your council chooses study days, exam days, required scores, time limits, and the number of attempts.",
      },
      {
        title: "Guided progression",
        copy: "Each level unlocks after focused study and a general assessment, so progress is earned and easy to track.",
      },
    ],
  },
  levels: {
    eyebrow: "Levels 1–5",
    heading: "The leadership climb",
    paragraph:
      "Registration is {fee}. After manual payment verification, Level 1 opens with a study calendar designed by your leadership council.",
  },
  registration: {
    eyebrow: "Verified and supported",
    heading: "Register once. Learn with accountability.",
    paragraph:
      "After registration, submit an offline payment receipt and reference number. You will receive an email once the leadership council verifies your payment. Then complete the new-member guide, choose a secure personal password, and begin Level 1.",
    cta: "Submit a registration",
    image: null,
    imageAlt: "DeMolay leadership training examination room",
  },
  footer: {
    note: "Demo council: council@demolaypathway.org / Admin123!",
  },
};

const BANNER_PATH = /^\/uploads\/banners\/[a-f0-9]{28}\.[a-z]+$/;

function str(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

function bannerImage(value: unknown): string | null {
  return typeof value === "string" && BANNER_PATH.test(value) ? value : null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parse(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function normalizeLandingContent(raw: unknown): LandingContent {
  const input = record(parse(raw));
  const hero = record(input.hero);
  const companion = record(input.companion);
  const levels = record(input.levels);
  const registration = record(input.registration);
  const footer = record(input.footer);
  const featureInput = Array.isArray(companion.features) ? companion.features : [];
  const features = DEFAULT_LANDING_CONTENT.companion.features.map((fallback, index) => {
    const item = record(featureInput[index]);
    return {
      title: str(item.title, fallback.title, 120),
      copy: str(item.copy, fallback.copy, 500),
    };
  });

  const fallback = DEFAULT_LANDING_CONTENT;
  return {
    hero: {
      eyebrow: str(hero.eyebrow, fallback.hero.eyebrow, 120),
      heading: str(hero.heading, fallback.hero.heading, 200),
      paragraph: str(hero.paragraph, fallback.hero.paragraph, 1200),
      primaryCta: str(hero.primaryCta, fallback.hero.primaryCta, 60),
      secondaryCta: str(hero.secondaryCta, fallback.hero.secondaryCta, 60),
      image: bannerImage(hero.image),
      imageAlt: str(hero.imageAlt, fallback.hero.imageAlt, 200),
    },
    companion: {
      eyebrow: str(companion.eyebrow, fallback.companion.eyebrow, 120),
      heading: str(companion.heading, fallback.companion.heading, 200),
      paragraph: str(companion.paragraph, fallback.companion.paragraph, 1200),
      image: bannerImage(companion.image),
      imageAlt: str(companion.imageAlt, fallback.companion.imageAlt, 200),
      features,
    },
    levels: {
      eyebrow: str(levels.eyebrow, fallback.levels.eyebrow, 120),
      heading: str(levels.heading, fallback.levels.heading, 200),
      paragraph: str(levels.paragraph, fallback.levels.paragraph, 1200),
    },
    registration: {
      eyebrow: str(registration.eyebrow, fallback.registration.eyebrow, 120),
      heading: str(registration.heading, fallback.registration.heading, 200),
      paragraph: str(registration.paragraph, fallback.registration.paragraph, 1200),
      cta: str(registration.cta, fallback.registration.cta, 60),
      image: bannerImage(registration.image),
      imageAlt: str(registration.imageAlt, fallback.registration.imageAlt, 200),
    },
    footer: {
      note: str(footer.note, fallback.footer.note, 300),
    },
  };
}
