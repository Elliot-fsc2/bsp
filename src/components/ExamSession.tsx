"use client";

import { useState } from "react";
import { ExamTaker } from "@/components/ExamTaker";
import type { QuestionOptions, QuestionType, StudentAnswer } from "@/lib/types";

type PublicQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOptions | null;
  points: number;
};

export function ExamSession({
  examId,
  examTitle,
  passingScore,
  timeLimitMinutes,
  questionCount,
  note,
}: {
  examId: number;
  examTitle: string;
  passingScore: number;
  timeLimitMinutes: number;
  questionCount: number;
  note?: string | null;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [session, setSession] = useState<{
    attemptId: number;
    expiresAt: string;
    questions: PublicQuestion[];
    answers: Record<string, StudentAnswer>;
  } | null>(null);

  async function start() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/exams/${examId}/start`, { method: "POST" });
    const data = (await response.json()) as {
      error?: string;
      attemptId: number;
      expiresAt: string;
      questions: PublicQuestion[];
      answers: Record<string, StudentAnswer>;
    };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to start exam.");
      return;
    }
    setSession({
      attemptId: data.attemptId,
      expiresAt: data.expiresAt,
      questions: data.questions,
      answers: data.answers ?? {},
    });
  }

  if (session) {
    return (
      <ExamTaker
        examTitle={examTitle}
        attemptId={session.attemptId}
        expiresAt={session.expiresAt}
        questions={session.questions}
        initialAnswers={session.answers}
        note={note}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-[#718096]">Ready hall</p>
      <h2 className="mt-2 font-serif text-4xl">{examTitle}</h2>
      <ul className="mt-5 space-y-2 text-sm leading-6 text-[#52657A]">
        <li>{questionCount} questions drawn from the level bank, shuffled when enabled.</li>
        <li>{timeLimitMinutes} minute time limit. Unfinished work auto-submits.</li>
        <li>Required score {passingScore}%. Passing unlocks the next level.</li>
        <li>Starting consumes one attempt unless you are resuming an open sitting.</li>
      </ul>
      {error ? <p className="mt-4 text-sm text-[#AC242A]">{error}</p> : null}
      <button className="btn btn-gold mt-6" type="button" disabled={pending} onClick={() => void start()}>
        {pending ? "Opening…" : "Begin or resume sitting"}
      </button>
    </div>
  );
}
