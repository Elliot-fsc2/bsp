import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { isValidTimeZone, setServerTimeZone } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);

  const body = (await request.json()) as {
    academyName?: string;
    tagline?: string;
    announcement?: string;
    examNote?: string;
    registrationFeeCents?: number;
    currency?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    paymentInstructions?: string;
    retakeFeeCents?: number;
    reinstatementFeeCents?: number;
    timeZone?: string;
    googleMapsApiKey?: string;
  };

  const academyName = body.academyName?.trim() ?? "";
  const registrationFeeCents = Number(body.registrationFeeCents);
  const currency = body.currency?.trim().toUpperCase() ?? "";
  if (academyName.length < 3 || academyName.length > 255) {
    return jsonError("Academy name must be between 3 and 255 characters.", 400);
  }
  if (!Number.isInteger(registrationFeeCents) || registrationFeeCents < 0 || registrationFeeCents > 10_000_000) {
    return jsonError("Enter a valid registration fee.", 400);
  }
  if (!/^[A-Z]{3}$/.test(currency)) return jsonError("Use a three-letter currency code such as USD or PHP.", 400);
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(1);
  } catch {
    return jsonError("This currency code is not supported.", 400);
  }

  const retakeFeeCents = Number(body.retakeFeeCents ?? 9500);
  const reinstatementFeeCents = Number(body.reinstatementFeeCents ?? 12500);
  if (!Number.isInteger(retakeFeeCents) || retakeFeeCents < 0 || retakeFeeCents > 10_000_000) {
    return jsonError("Enter a valid exam retake fee.", 400);
  }
  if (!Number.isInteger(reinstatementFeeCents) || reinstatementFeeCents < 0 || reinstatementFeeCents > 10_000_000) {
    return jsonError("Enter a valid reinstatement fee.", 400);
  }
  const timeZone = body.timeZone?.trim() || "UTC";
  if (!isValidTimeZone(timeZone)) return jsonError("Choose a valid IANA time zone.", 400);

  const current = (await db.select().from(settings).limit(1))[0];
  const values = {
    retakeFeeCents,
    reinstatementFeeCents,
    timeZone,
    academyName,
    tagline: body.tagline?.trim().slice(0, 500) ?? "",
    announcement: body.announcement?.trim().slice(0, 2000) ?? "",
    examNote: body.examNote?.trim().slice(0, 4000) ?? "",
    registrationFeeCents,
    currency,
    bankName: body.bankName?.trim().slice(0, 255) ?? "",
    accountName: body.accountName?.trim().slice(0, 255) ?? "",
    accountNumber: body.accountNumber?.trim().slice(0, 100) ?? "",
    paymentInstructions: body.paymentInstructions?.trim().slice(0, 4000) ?? "",
    googleMapsApiKey: body.googleMapsApiKey?.trim().slice(0, 255) || null,
    updatedAt: new Date(),
  };

  if (current) {
    await db.update(settings).set(values).where(eq(settings.id, current.id));
  } else {
    await db.insert(settings).values(values);
  }
  setServerTimeZone(timeZone);
  return Response.json({ ok: true });
}
