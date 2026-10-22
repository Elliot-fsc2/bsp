import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);
  const body = (await request.json()) as {
    id?: number;
    levelId?: number;
    title?: string;
    description?: string;
    bankId?: number | null;
    questionCount?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    timeLimitMinutes?: number;
    passingScore?: number;
    maxAttempts?: number;
    isPublished?: boolean;
  };

  if (!body.id) return jsonError("Exam id required.", 400);

  await db
    .update(exams)
    .set({
      title: body.title?.trim() || "General exam",
      description: body.description ?? "",
      bankId: body.bankId ? Number(body.bankId) : null,
      questionCount: Number(body.questionCount ?? 10),
      shuffleQuestions: body.shuffleQuestions !== false,
      shuffleOptions: body.shuffleOptions !== false,
      timeLimitMinutes: Number(body.timeLimitMinutes ?? 30),
      passingScore: Number(body.passingScore ?? 70),
      maxAttempts: Number(body.maxAttempts ?? 3),
      isPublished: body.isPublished !== false,
    })
    .where(eq(exams.id, body.id));

  return Response.json({ ok: true });
}
