"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTION_TYPES, type Choice, type CorrectAnswer, type QuestionOptions, type QuestionType } from "@/lib/types";

function freshId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

export function QuestionBuilder({
  bankId,
  question,
}: {
  bankId: number;
  question?: {
    id: number;
    type: string;
    prompt: string;
    options: QuestionOptions | null;
    correctAnswer: CorrectAnswer | null;
    points: number;
    explanation: string | null;
  };
}) {
  const router = useRouter();
  const [type, setType] = useState<QuestionType>((question?.type as QuestionType) ?? "multiple_choice");
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [points, setPoints] = useState(question?.points ?? 1);
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [choices, setChoices] = useState<Choice[]>(
    question?.options?.choices?.length
      ? question.options.choices
      : [
          { id: "a", text: "" },
          { id: "b", text: "" },
        ],
  );
  const [left, setLeft] = useState<Choice[]>(
    question?.options?.left?.length ? question.options.left : [{ id: "l1", text: "" }],
  );
  const [right, setRight] = useState<Choice[]>(
    question?.options?.right?.length ? question.options.right : [{ id: "r1", text: "" }],
  );
  const [choiceId, setChoiceId] = useState(question?.correctAnswer?.choiceId ?? "a");
  const [choiceIds, setChoiceIds] = useState<string[]>(question?.correctAnswer?.choiceIds ?? []);
  const [bool, setBool] = useState(question?.correctAnswer?.bool ?? true);
  const [text, setText] = useState(question?.correctAnswer?.text ?? "");
  const [texts, setTexts] = useState<string[]>(question?.correctAnswer?.texts ?? [""]);
  const [matches, setMatches] = useState<Record<string, string>>(question?.correctAnswer?.matches ?? {});
  const [pending, setPending] = useState(false);

  const options = useMemo<QuestionOptions>(() => {
    if (type === "multiple_choice" || type === "multiple_select") return { choices };
    if (type === "matching") return { left, right };
    if (type === "fill_blank") return { blankCount: texts.length };
    return {};
  }, [type, choices, left, right, texts.length]);

  const correctAnswer = useMemo<CorrectAnswer>(() => {
    if (type === "multiple_choice") return { choiceId };
    if (type === "multiple_select") return { choiceIds };
    if (type === "true_false") return { bool };
    if (type === "short_answer") return { text };
    if (type === "fill_blank") return { texts };
    if (type === "matching") return { matches };
    return {};
  }, [type, choiceId, choiceIds, bool, text, texts, matches]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    await fetch("/api/admin/banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-question",
        id: question?.id,
        bankId,
        type,
        prompt,
        options,
        correctAnswer,
        points,
        explanation,
      }),
    });
    setPending(false);
    router.refresh();
    if (!question) {
      setPrompt("");
      setExplanation("");
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl bg-[#F7F9FD] p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Type
          <select className="input mt-2" value={type} onChange={(event) => setType(event.target.value as QuestionType)}>
            {QUESTION_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Points
          <input className="input mt-2" type="number" min={1} value={points} onChange={(event) => setPoints(Number(event.target.value))} />
        </label>
      </div>
      <label className="block text-sm">
        Prompt
        <textarea className="input mt-2 min-h-[90px]" value={prompt} onChange={(event) => setPrompt(event.target.value)} required />
      </label>

      {(type === "multiple_choice" || type === "multiple_select") && (
        <div className="space-y-2">
          {choices.map((choice, index) => (
            <div key={choice.id} className="flex items-center gap-2">
              {type === "multiple_choice" ? (
                <input type="radio" name="correct" checked={choiceId === choice.id} onChange={() => setChoiceId(choice.id)} />
              ) : (
                <input
                  type="checkbox"
                  checked={choiceIds.includes(choice.id)}
                  onChange={() =>
                    setChoiceIds((current) =>
                      current.includes(choice.id) ? current.filter((id) => id !== choice.id) : [...current, choice.id],
                    )
                  }
                />
              )}
              <input
                className="input"
                value={choice.text}
                onChange={(event) =>
                  setChoices((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, text: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
          ))}
          <button
            className="btn btn-ghost text-sm"
            type="button"
            onClick={() => setChoices((current) => [...current, { id: freshId("c"), text: "" }])}
          >
            Add choice
          </button>
        </div>
      )}

      {type === "true_false" && (
        <label className="text-sm">
          Correct answer
          <select className="input mt-2" value={String(bool)} onChange={(event) => setBool(event.target.value === "true")}>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </label>
      )}

      {type === "short_answer" && (
        <label className="text-sm">
          Accepted answer
          <input className="input mt-2" value={text} onChange={(event) => setText(event.target.value)} />
        </label>
      )}

      {type === "fill_blank" && (
        <div className="space-y-2">
          {texts.map((value, index) => (
            <input
              key={index}
              className="input"
              placeholder={`Blank ${index + 1} answer`}
              value={value}
              onChange={(event) =>
                setTexts((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
              }
            />
          ))}
          <button className="btn btn-ghost text-sm" type="button" onClick={() => setTexts((current) => [...current, ""])}>
            Add blank
          </button>
        </div>
      )}

      {type === "matching" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Left</p>
            {left.map((item, index) => (
              <input
                key={item.id}
                className="input mt-2"
                value={item.text}
                onChange={(event) =>
                  setLeft((current) =>
                    current.map((row, rowIndex) => (rowIndex === index ? { ...row, text: event.target.value } : row)),
                  )
                }
              />
            ))}
            <button className="btn btn-ghost mt-2 text-sm" type="button" onClick={() => setLeft((current) => [...current, { id: freshId("l"), text: "" }])}>
              Add left
            </button>
          </div>
          <div>
            <p className="text-sm font-medium">Right + matches</p>
            {right.map((item, index) => (
              <input
                key={item.id}
                className="input mt-2"
                value={item.text}
                onChange={(event) =>
                  setRight((current) =>
                    current.map((row, rowIndex) => (rowIndex === index ? { ...row, text: event.target.value } : row)),
                  )
                }
              />
            ))}
            <button className="btn btn-ghost mt-2 text-sm" type="button" onClick={() => setRight((current) => [...current, { id: freshId("r"), text: "" }])}>
              Add right
            </button>
            <div className="mt-3 space-y-2">
              {left.map((item) => (
                <label key={item.id} className="block text-sm">
                  {item.text || item.id} matches
                  <select
                    className="input mt-1"
                    value={matches[item.id] ?? ""}
                    onChange={(event) => setMatches((current) => ({ ...current, [item.id]: event.target.value }))}
                  >
                    <option value="">Select</option>
                    {right.map((rightItem) => (
                      <option key={rightItem.id} value={rightItem.id}>
                        {rightItem.text || rightItem.id}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <label className="block text-sm">
        Explanation
        <textarea className="input mt-2" value={explanation} onChange={(event) => setExplanation(event.target.value)} />
      </label>
      <button className="btn btn-dark text-sm" disabled={pending} type="submit">
        {pending ? "Saving…" : question ? "Update question" : "Add to bank"}
      </button>
    </form>
  );
}
