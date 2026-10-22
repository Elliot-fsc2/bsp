import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { levelProgress, payments, settings, users } from "@/db/schema";

export type PaymentPurpose = "registration" | "exam_retake" | "reinstatement";

export const PURPOSE_LABELS: Record<PaymentPurpose, string> = {
  registration: "Registration fee",
  exam_retake: "Exam retake fee",
  reinstatement: "Platform access reinstatement fee",
};

export function isPaymentPurpose(value: unknown): value is PaymentPurpose {
  return value === "registration" || value === "exam_retake" || value === "reinstatement";
}

export async function siteFees() {
  const site = (await db.select().from(settings).limit(1))[0];
  return {
    site,
    registration: site?.registrationFeeCents ?? 18500,
    examRetake: site?.retakeFeeCents ?? 9500,
    reinstatement: site?.reinstatementFeeCents ?? 12500,
    currency: site?.currency ?? "PHP",
  };
}

export async function verifiedRetakeCount(userId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.purpose, "exam_retake"), eq(payments.status, "verified")));
  return Number(row?.count ?? 0);
}

export type PaymentState =
  | { reason: "registration"; feeCents: number; label: string }
  | { reason: "reinstatement"; feeCents: number; label: string }
  | { reason: "retake"; feeCents: number; label: string }
  | { reason: "waiting_verification"; feeCents: number; label: string; purpose: PaymentPurpose }
  | { reason: "ok"; feeCents: 0; label: string };

export async function studentPaymentState(userId: number): Promise<PaymentState> {
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  const fees = await siteFees();
  if (!user) return { reason: "registration", feeCents: fees.registration, label: PURPOSE_LABELS.registration };

  if (user.accountStatus === "pending_verification") {
    const pending = (
      await db
        .select()
        .from(payments)
        .where(and(eq(payments.userId, userId), eq(payments.status, "pending")))
        .orderBy(payments.submittedAt)
        .limit(1)
    )[0];
    const purpose: PaymentPurpose = isPaymentPurpose(pending?.purpose) ? pending.purpose : "registration";
    return {
      reason: "waiting_verification",
      feeCents: purpose === "exam_retake" ? fees.examRetake : purpose === "reinstatement" ? fees.reinstatement : fees.registration,
      label: PURPOSE_LABELS[purpose],
      purpose,
    };
  }

  if (user.accountStatus === "pending_payment" || user.accountStatus === "rejected") {
    return { reason: "registration", feeCents: fees.registration, label: PURPOSE_LABELS.registration };
  }

  if (user.accountStatus === "suspended") {
    return { reason: "reinstatement", feeCents: fees.reinstatement, label: PURPOSE_LABELS.reinstatement };
  }

  if (user.role === "student") {
    const progress = (
      await db
        .select()
        .from(levelProgress)
        .where(eq(levelProgress.userId, userId))
        .orderBy(levelProgress.id)
        .limit(1)
    )[0];
    const openLevel = progress && (progress.status === "unlocked" || progress.status === "in_progress") ? progress : null;
    if (openLevel) {
      const allowed = 1 + (await verifiedRetakeCount(userId));
      if (openLevel.attemptsUsed >= allowed) {
        return { reason: "retake", feeCents: fees.examRetake, label: PURPOSE_LABELS.exam_retake };
      }
    }
  }

  return { reason: "ok", feeCents: 0, label: "" };
}
