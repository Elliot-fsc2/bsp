"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuestionOptions, QuestionType, StudentAnswer } from "@/lib/types";

type PublicQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOptions | null;
  points: number;
};

type Result = {
  scorePercent: number;
  pointsEarned: number;
  pointsPossible: number;
  passed: boolean;
  status: string;
  passingScore: number;
  suspended?: boolean;
};

export function ExamTaker({
  examTitle,
  attemptId,
  expiresAt,
  questions,
  initialAnswers,
  note,
}: {
  examTitle: string;
  attemptId: number;
  expiresAt: string;
  questions: PublicQuestion[];
  initialAnswers: Record<string, StudentAnswer>;
  note?: string | null;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>(initialAnswers ?? {});
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const showNote = Boolean(note?.trim());
  const question = questions[index];

  useEffect(() => {
    const timer = setInterval(() => {
      const next = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(next);
      if (next <= 0) {
        clearInterval(timer);
        void submit();
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void fetch(`/api/attempts/${attemptId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
    }, 800);
    return () => window.clearTimeout(handle);
  }, [answers, attemptId]);

  const clock = useMemo(() => {
    const total = Math.floor(remaining / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  function setAnswer(update: StudentAnswer) {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: { ...current[String(question.id)], ...update } }));
  }

  async function submit() {
    if (submitting || result) return;
    setSubmitting(true);
    const response = await fetch(`/api/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = (await response.json()) as Result & { error?: string };
    setSubmitting(false);
    if (!response.ok) {
      setError(data.error ?? "Could not submit exam.");
      return;
    }
    setResult(data);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-[32px] bg-white p-8 shadow-[0_24px_60px_rgba(16,35,30,0.08)]">
        <p className="text-xs uppercase tracking-[0.2em] text-[#718096]">Exam result</p>
        <h2 className="mt-2 font-serif text-4xl">{result.passed ? "You passed this level" : "Not yet"}</h2>
        <p className="mt-4 text-lg">
          Score <strong>{result.scorePercent}%</strong> · {result.pointsEarned}/{result.pointsPossible} points ·
          required {result.passingScore}%
        </p>
        {result.status === "pending_review" ? (
          <p className="mt-3 text-sm text-[#705100]">
            An essay still needs administrator review before the final pass/fail is confirmed.
          </p>
        ) : null}
        {result.suspended ? (
          <div className="mt-5 rounded-2xl border border-[#AC242A]/30 bg-[#FFF0EF] p-4 text-sm text-[#AC242A]">
            Your second attempt was not successful. Platform access is paused until the reinstatement fee is settled.
            <button className="btn btn-dark mt-4 w-full text-sm" type="button" onClick={() => router.push("/dashboard/payment")}>
              Continue to payment
            </button>
          </div>
        ) : (
          <button className="btn btn-dark mt-8" type="button" onClick={() => router.push("/dashboard/exams")}>
            Return to exams
          </button>
        )}
      </div>
    );
  }

  if (!question) {
    return <p>No questions in this attempt.</p>;
  }

  const current = answers[String(question.id)] ?? {};
  const blankCount = question.options?.blankCount ?? 1;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#718096]">{examTitle}</p>
          <h2 className="font-serif text-3xl">
            Question {index + 1} of {questions.length}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {showNote ? (
            <button type="button" onClick={() => setNoteOpen(true)} className="btn bg-[#EAF1F9] py-2 text-sm text-[#1E4488]">
              📒 Exam notes
            </button>
          ) : null}
          <div className={`rounded-full px-4 py-2 text-sm font-semibold ${remaining < 60000 ? "bg-[#AC242A] text-white" : "bg-[#1B365F] text-[#F7F9FD]"}`}>
            {clock}
          </div>
        </div>
      </div>

      {noteOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1f3a]/60 p-4" role="dialog" aria-modal="true" onClick={() => setNoteOpen(false)}>
          <div className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-[0_30px_70px_rgba(11,31,58,0.35)] md:p-7" onClick={(event) => event.stopPropagation()}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">From the leadership council</p>
            <h3 className="mt-1 font-serif text-2xl text-[#1B365F]">Exam notes</h3>
            <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-[#e3eaf4] bg-[#F7F9FD] p-4 text-sm leading-6 text-[#1B365F]">{note?.trim()}</div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#718096]">The timer keeps running while this is open.</p>
              <button className="btn btn-dark" type="button" onClick={() => setNoteOpen(false)}>
                Back to the exam
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {questions.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            className={`h-9 w-9 rounded-full text-sm ${itemIndex === index ? "bg-[#EAAB00]" : answers[String(item.id)] ? "bg-[#0076AF] text-white" : "bg-white"}`}
            onClick={() => setIndex(itemIndex)}
          >
            {itemIndex + 1}
          </button>
        ))}
      </div>

      <article className="rounded-[28px] bg-white p-7 shadow-[0_20px_50px_rgba(16,35,30,0.06)]">
        <div className="text-sm text-[#718096]">
          {question.type.replaceAll("_", " ")} · {question.points} pt
        </div>
        <div className="lesson-content mt-3" dangerouslySetInnerHTML={{ __html: question.prompt }} />

        <div className="mt-6 space-y-3">
          {question.type === "multiple_choice" || question.type === "true_false" ? (
            (question.type === "true_false"
              ? [
                  { id: "true", text: "True" },
                  { id: "false", text: "False" },
                ]
              : question.options?.choices ?? []
            ).map((choice) => (
              <label key={choice.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#1B365F]/10 p-3">
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={
                    question.type === "true_false"
                      ? current.bool === (choice.id === "true")
                      : current.choiceId === choice.id
                  }
                  onChange={() =>
                    question.type === "true_false"
                      ? setAnswer({ bool: choice.id === "true" })
                      : setAnswer({ choiceId: choice.id })
                  }
                />
                <span>{choice.text}</span>
              </label>
            ))
          ) : null}

          {question.type === "multiple_select" ? (
            (question.options?.choices ?? []).map((choice) => {
              const selected = current.choiceIds ?? [];
              const checked = selected.includes(choice.id);
              return (
                <label key={choice.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#1B365F]/10 p-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter((id) => id !== choice.id)
                        : [...selected, choice.id];
                      setAnswer({ choiceIds: next });
                    }}
                  />
                  <span>{choice.text}</span>
                </label>
              );
            })
          ) : null}

          {question.type === "short_answer" || question.type === "essay" ? (
            <textarea
              className="input min-h-[140px]"
              value={current.text ?? ""}
              onChange={(event) => setAnswer({ text: event.target.value })}
            />
          ) : null}

          {question.type === "fill_blank" ? (
            <div className="grid gap-3">
              {Array.from({ length: blankCount }).map((_, blankIndex) => (
                <input
                  key={blankIndex}
                  className="input"
                  placeholder={`Blank ${blankIndex + 1}`}
                  value={current.texts?.[blankIndex] ?? ""}
                  onChange={(event) => {
                    const texts = [...(current.texts ?? Array(blankCount).fill(""))];
                    texts[blankIndex] = event.target.value;
                    setAnswer({ texts });
                  }}
                />
              ))}
            </div>
          ) : null}

          {question.type === "matching" ? (
            <div className="grid gap-3">
              {(question.options?.left ?? []).map((left) => (
                <label key={left.id} className="grid gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                  <span>{left.text}</span>
                  <select
                    className="input"
                    value={current.matches?.[left.id] ?? ""}
                    onChange={(event) =>
                      setAnswer({
                        matches: { ...(current.matches ?? {}), [left.id]: event.target.value },
                      })
                    }
                  >
                    <option value="">Select a match</option>
                    {(question.options?.right ?? []).map((right) => (
                      <option key={right.id} value={right.id}>
                        {right.text}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      </article>

      {error ? <p className="mt-4 text-sm text-[#AC242A]">{error}</p> : null}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <button className="btn btn-ghost" type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Previous
        </button>
        <div className="flex gap-3">
          {index < questions.length - 1 ? (
            <button className="btn btn-dark" type="button" onClick={() => setIndex(index + 1)}>
              Next
            </button>
          ) : (
            <button className="btn btn-gold" type="button" disabled={submitting} onClick={() => void submit()}>
              {submitting ? "Submitting…" : "Submit exam"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
