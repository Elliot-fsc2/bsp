import { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, settings, users } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { siteFees, studentPaymentState, type PaymentPurpose } from "@/lib/fees";
import { isMemberRole } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.submittedAt));
  return Response.json({ payments: rows });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!isMemberRole(user.role)) return jsonError("Forbidden", 403);

  const form = await request.formData();
  const referenceNumber = String(form.get("referenceNumber") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const file = form.get("receipt");

  if (!referenceNumber) return jsonError("Reference number is required.", 400);
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Please upload a receipt image or PDF.", 400);
  }
  if (!ALLOWED.has(file.type)) {
    return jsonError("Receipt must be JPG, PNG, WEBP, or PDF.", 400);
  }
  if (file.size > 8 * 1024 * 1024) return jsonError("Receipt must be under 8MB.", 400);

  const state = await studentPaymentState(user.id);
  if (state.reason === "ok") return jsonError("You do not have a payment due right now.", 400);
  if (state.reason === "waiting_verification") return jsonError("Your payment is already awaiting verification.", 400);
  const purpose: PaymentPurpose = state.reason === "registration" ? "registration" : state.reason === "reinstatement" ? "reinstatement" : "exam_retake";

  const fees = await siteFees();
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] || "jpg";
  const filename = `${user.id}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "receipts");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const [{ id: paymentId }] = await db
    .insert(payments)
    .values({
      userId: user.id,
      purpose,
      amountCents: purpose === "exam_retake" ? fees.examRetake : purpose === "reinstatement" ? fees.reinstatement : fees.registration,
      referenceNumber,
      receiptPath: `/uploads/receipts/${filename}`,
      status: "pending",
      notes: notes || null,
    })
    .$returningId();

  if (purpose !== "exam_retake") {
    await db
      .update(users)
      .set({ accountStatus: "pending_verification", updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  return Response.json({
    ok: true,
    payment: {
      id: paymentId,
      userId: user.id,
      purpose,
      amountCents: purpose === "exam_retake" ? fees.examRetake : purpose === "reinstatement" ? fees.reinstatement : fees.registration,
      referenceNumber,
      receiptPath: `/uploads/receipts/${filename}`,
      status: "pending",
      notes: notes || null,
    },
    purpose,
  });
}
