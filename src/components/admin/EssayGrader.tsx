"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SnapshotQuestion, StudentAnswer } from "@/lib/types";

export function EssayGrader({
  attemptId,
  questions,
  answers,
}: {
  attemptId: number;
  questions: SnapshotQuestion[];
  answers: Record<string, StudentAnswer>;
}) {
  const router = useRouter();
  const essays = questions.filter((question) => question.type === "essay");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);

  if (!essays.length) return null;

  return (
    <div className="mt-6 rounded-2xl bg-[#F7F9FD] p-4">
      <h4 className="font-serif text-xl">Essay review</h4>
      {essays.map((question) => (
        <div key={question.id} className="mt-4">
          <div className="text-sm" dangerouslySetInnerHTML={{ __html: question.prompt }} />
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm">
            {answers[String(question.id)]?.text || "No response"}
          </p>
          <label className="mt-2 block text-sm">
            Points (max {question.points})
            <input
              className="input mt-1"
              type="number"
              min={0}
              max={question.points}
              value={scores[String(question.id)] ?? 0}
              onChange={(event) =>
                setScores((current) => ({ ...current, [question.id]: Number(event.target.value) }))
              }
            />
          </label>
        </div>
      ))}
      <button
        className="btn btn-dark mt-4 text-sm"
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await fetch("/api/admin/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "grade-essays", attemptId, essayScores: scores }),
          });
          setPending(false);
          router.refresh();
        }}
      >
        {pending ? "Saving…" : "Apply essay scores"}
      </button>
    </div>
  );
}
