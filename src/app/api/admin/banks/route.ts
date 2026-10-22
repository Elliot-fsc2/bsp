import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { questionBanks, questions } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { CorrectAnswer, QuestionOptions, QuestionType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return jsonError("Forbidden", 403);
  const body = (await request.json()) as {
    action?: string;
    id?: number;
    name?: string;
    description?: string;
    levelId?: number | null;
    bankId?: number;
    type?: QuestionType;
    prompt?: string;
    options?: QuestionOptions | null;
    correctAnswer?: CorrectAnswer | null;
    points?: number;
    explanation?: string;
  };

  if (body.action === "create-bank") {
    const [{ id: bankId }] = await db
      .insert(questionBanks)
      .values({
        name: body.name?.trim() || "New bank",
        description: body.description ?? "",
        levelId: body.levelId ? Number(body.levelId) : null,
      })
      .$returningId();
    return Response.json({ ok: true, id: bankId });
  }

  if (body.action === "update-bank" && body.id) {
    await db
      .update(questionBanks)
      .set({
        name: body.name?.trim() || "Question bank",
        description: body.description ?? "",
        levelId: body.levelId ? Number(body.levelId) : null,
      })
      .where(eq(questionBanks.id, body.id));
    return Response.json({ ok: true });
  }

  if (body.action === "delete-question" && body.id) {
    await db.delete(questions).where(eq(questions.id, body.id));
    return Response.json({ ok: true });
  }

  if (body.action === "save-question") {
    const values = {
      bankId: Number(body.bankId),
      type: body.type ?? "multiple_choice",
      prompt: body.prompt?.trim() || "Untitled question",
      options: (body.options ?? null) as Record<string, unknown> | null,
      correctAnswer: (body.correctAnswer ?? null) as Record<string, unknown> | null,
      points: Number(body.points ?? 1),
      explanation: body.explanation ?? null,
    };
    if (body.id) {
      await db.update(questions).set(values).where(eq(questions.id, body.id));
      return Response.json({ ok: true, id: body.id });
    }
    const [{ id: createdId }] = await db.insert(questions).values(values).$returningId();
    return Response.json({ ok: true, id: createdId });
  }

  return jsonError("Unknown action.", 400);
}
