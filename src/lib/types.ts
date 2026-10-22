export type UserRole = "admin" | "student";

export function isMemberRole(role: string): boolean {
  return role === "student";
}

export type AccountStatus =
  | "pending_payment"
  | "pending_verification"
  | "active"
  | "rejected"
  | "suspended";

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  pending_payment: "Awaiting payment",
  pending_verification: "Receipt review",
  active: "Active",
  rejected: "Rejected",
  suspended: "Access paused",
};

export type PublicUser = {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  education: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  profileBio: string | null;
  profilePhoto: string | null;
  coverPhoto: string | null;
  professionalHeadline: string | null;
  resumeSummary: string | null;
  skills: string | null;
  experience: string | null;
  birthDate: string | null;
  registrationDetails: string | null;
  guideCompletedAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
};

export type QuestionType =
  | "multiple_choice"
  | "multiple_select"
  | "true_false"
  | "short_answer"
  | "fill_blank"
  | "matching"
  | "essay";

export type Choice = { id: string; text: string };

export type QuestionOptions = {
  choices?: Choice[];
  left?: Choice[];
  right?: Choice[];
  blankCount?: number;
};

export type CorrectAnswer = {
  choiceId?: string;
  choiceIds?: string[];
  bool?: boolean;
  text?: string;
  texts?: string[];
  matches?: Record<string, string>;
};

export type SnapshotQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOptions | null;
  correctAnswer: CorrectAnswer | null;
  points: number;
  explanation: string | null;
};

export type StudentAnswer = {
  choiceId?: string;
  choiceIds?: string[];
  bool?: boolean;
  text?: string;
  texts?: string[];
  matches?: Record<string, string>;
};

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "multiple_select", label: "Multiple select" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short answer" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "matching", label: "Matching" },
  { value: "essay", label: "Essay" },
];
