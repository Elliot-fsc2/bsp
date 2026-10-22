"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createRequirementAction, updateRequirementAction } from "@/actions/admin";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { QuizQuestion } from "@/lib/types";

export type BadgeOption = { id: number; name: string; kind: string; programName: string };

function QuizBuilder({ initial }: { initial: QuizQuestion[] }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initial.length ? initial : [],
  );

  function update(index: number, patch: Partial<QuizQuestion>) {
    setQuestions((current) => current.map((question, i) => (i === index ? { ...question, ...patch } : question)));
  }

  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-extrabold">Quiz questions</span>
        <button
          type="button"
          className="bloom-btn secondary"
          onClick={() =>
            setQuestions((current) => [...current, { q: "", options: ["", "", "", ""], answer: 0 }])
          }
        >
          <Plus size={14} /> Add question
        </button>
      </div>
      <input type="hidden" name="quizJson" value={JSON.stringify(questions)} />
      {questions.length === 0 ? <p className="text-sm text-[var(--muted)]">No quiz for this requirement.</p> : null}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div key={index} className="rounded-xl border border-[var(--line)] p-3">
            <div className="flex items-center gap-2">
              <input
                className="bloom-input"
                placeholder={`Question ${index + 1}`}
                value={question.q}
                onChange={(event) => update(index, { q: event.target.value })}
              />
              <button
                type="button"
                className="bloom-btn ghost"
                onClick={() => setQuestions((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={question.answer === optionIndex}
                    onChange={() => update(index, { answer: optionIndex })}
                    title="Correct answer"
                  />
                  <input
                    className="bloom-input"
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(event) =>
                      update(index, {
                        options: question.options.map((value, i) => (i === optionIndex ? event.target.value : value)),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminRequirementForm({
  badgeId,
  requirement,
  badgeOptions,
}: {
  badgeId: number;
  requirement?: {
    id: number;
    title: string;
    description: string | null;
    instructions: string | null;
    type: string;
    position: number;
    points: number;
    requiresText: boolean;
    requiresMedia: boolean;
    mediaKind: string;
    requiresLink: boolean;
    quiz: QuizQuestion[];
    requiredBadgeId: number | null;
  };
  badgeOptions: BadgeOption[];
}) {
  const [type, setType] = useState(requirement?.type ?? "task");
  const formAction = requirement
    ? updateRequirementAction.bind(null, requirement.id)
    : createRequirementAction.bind(null, badgeId);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl bg-white/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-extrabold">Title</span>
          <input className="bloom-input" name="title" defaultValue={requirement?.title ?? ""} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Type</span>
          <select className="bloom-select" name="type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="task">Task / proof</option>
            <option value="recite">Recitation</option>
            <option value="quiz">Quiz</option>
            <option value="merit">Earn a merit badge</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Points</span>
          <input className="bloom-input" name="points" type="number" min={0} defaultValue={requirement?.points ?? 10} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Order</span>
          <input className="bloom-input" name="position" type="number" min={0} defaultValue={requirement?.position ?? 0} />
        </label>
        {type === "merit" ? (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-extrabold">Merit badge to earn</span>
            <select className="bloom-select" name="requiredBadgeId" defaultValue={requirement?.requiredBadgeId ?? ""}>
              <option value="">Choose a merit badge…</option>
              {Array.from(new Set(badgeOptions.filter((option) => option.kind === "merit").map((option) => option.programName))).map(
                (program) => (
                  <optgroup key={program} label={program}>
                    {badgeOptions
                      .filter((option) => option.kind === "merit" && option.programName === program)
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                  </optgroup>
                ),
              )}
            </select>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              The Scout does not upload proof for this one — it is met automatically once that merit badge is awarded.
            </span>
          </label>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-extrabold">Short description</span>
        <input className="bloom-input" name="description" defaultValue={requirement?.description ?? ""} />
      </label>

      <div>
        <span className="mb-1 block text-sm font-extrabold">Instructions for the Scout</span>
        <RichTextEditor
          name="instructions"
          defaultValue={requirement?.instructions ?? ""}
          minHeight={160}
          placeholder="Tell the Scout exactly what to do and what to submit."
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="requiresText" defaultChecked={requirement ? requirement.requiresText : true} />
          Requires a written answer
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="requiresMedia" defaultChecked={requirement?.requiresMedia ?? false} />
          Requires video / photo proof
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          Media type
          <select className="bloom-select" name="mediaKind" defaultValue={requirement?.mediaKind ?? "video"}>
            <option value="video">Video</option>
            <option value="image">Photo</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="requiresLink" defaultChecked={requirement?.requiresLink ?? false} />
          Requires a Google Drive link
        </label>
      </div>

      <QuizBuilder initial={requirement?.quiz ?? []} />

      <button className="bloom-btn">{requirement ? "Save requirement" : "Add requirement"}</button>
    </form>
  );
}
