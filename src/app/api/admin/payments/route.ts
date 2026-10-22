import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { initializeStudentProgress } from "@/lib/progress";
import { sendPaymentVerifiedEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);

  const body = (await request.json()) as {
    paymentId?: number;
    action?: "verify" | "reject";
    adminNote?: string;
  };

  const payment = (
    await db.select().from(payments).where(eq(payments.id, Number(body.paymentId))).limit(1)
  )[0];
  if (!payment) return jsonError("Payment not found.", 404);

  if (body.action === "verify") {
    await db
      .update(payments)
      .set({
        status: "verified",
        adminNote: body.adminNote ?? null,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      })
      .where(eq(payments.id, payment.id));

    if (payment.purpose === "exam_retake") {
      const member = (await db.select().from(users).where(eq(users.id, payment.userId)).limit(1))[0];
      if (member) await sendPaymentVerifiedEmail(member.fullName, member.email, "exam_retake");
      return Response.json({ ok: true, purpose: payment.purpose });
    }

    await db
      .update(users)
      .set({ accountStatus: "active", updatedAt: new Date() })
      .where(eq(users.id, payment.userId));
    await initializeStudentProgress(payment.userId);
    const member = (await db.select().from(users).where(eq(users.id, payment.userId)).limit(1))[0];
    if (member) await sendPaymentVerifiedEmail(member.fullName, member.email, payment.purpose);
    return Response.json({ ok: true, purpose: payment.purpose });
  }

  if (body.action === "reject") {
    await db
      .update(payments)
      .set({
        status: "rejected",
        adminNote: body.adminNote ?? null,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      })
      .where(eq(payments.id, payment.id));
    if (payment.purpose !== "exam_retake") {
      await db
        .update(users)
        .set({ accountStatus: "pending_payment", updatedAt: new Date() })
        .where(eq(users.id, payment.userId));
    }
    return Response.json({ ok: true, purpose: payment.purpose });
  }

  return jsonError("Unknown action.", 400);
}
