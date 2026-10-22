export type Role = "admin" | "teacher" | "student";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  bio: string | null;
  isActive: boolean;
};

export type ThemeId = "bloom" | "ocean" | "sunset" | "forest";

export type SiteSettings = {
  siteName: string;
  tagline: string;
  theme: ThemeId;
  allowRegistration: boolean;
  welcomeMessage: string;
  maintenanceMode: boolean;
  supportEmail: string;
  mascotName: string;
  logoUrl: string;
  faviconUrl: string;
};

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
};

export type BadgeKind = "rank" | "merit";

export type RequirementType = "recite" | "quiz" | "task" | "merit";

export type MediaKind = "video" | "image";

export type SubmissionStatus = "pending" | "level1_approved" | "approved" | "rejected";

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "Waiting for Scout Leader",
  level1_approved: "Waiting for Council Admin",
  approved: "Approved",
  rejected: "Needs revision",
};
