"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Exam = {
  id: number;
  title: string;
  description: string | null;
  bankId: number | null;
  questionCount: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimitMinutes: number;
  passingScore: number;
  maxAttempts: number;
  isPublished: boolean;
};

export function ExamEditor({
  exam,
  banks,
}: {
  exam: Exam;
  banks: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(exam);
  const [saved, setSaved] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved("Saved");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="rounded-[28px] bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          Title
          <input className="input mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="text-sm md:col-span-2">
          Description
          <textarea
            className="input mt-2 min-h-[80px]"
            value={form.description ?? ""}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <label className="text-sm">
          Question bank
          <select
            className="input mt-2"
            value={form.bankId ?? ""}
            onChange={(event) => setForm({ ...form, bankId: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">Select bank</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Questions drawn
          <input
            className="input mt-2"
            type="number"
            min={1}
            value={form.questionCount}
            onChange={(event) => setForm({ ...form, questionCount: Number(event.target.value) })}
          />
        </label>
        <label className="text-sm">
          Time limit (minutes)
          <input
            className="input mt-2"
            type="number"
            min={1}
            value={form.timeLimitMinutes}
            onChange={(event) => setForm({ ...form, timeLimitMinutes: Number(event.target.value) })}
          />
        </label>
        <label className="text-sm">
          Passing score %
          <input
            className="input mt-2"
            type="number"
            min={1}
            max={100}
            value={form.passingScore}
            onChange={(event) => setForm({ ...form, passingScore: Number(event.target.value) })}
          />
        </label>
        <label className="text-sm">
          Max attempts
          <input
            className="input mt-2"
            type="number"
            min={1}
            value={form.maxAttempts}
            onChange={(event) => setForm({ ...form, maxAttempts: Number(event.target.value) })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.shuffleQuestions}
            onChange={(event) => setForm({ ...form, shuffleQuestions: event.target.checked })}
          />
          Shuffle questions
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.shuffleOptions}
            onChange={(event) => setForm({ ...form, shuffleOptions: event.target.checked })}
          />
          Shuffle options
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
          />
          Published
        </label>
      </div>
      <button className="btn btn-dark mt-5" type="submit">
        Save exam
      </button>
      {saved ? <span className="ml-3 text-sm text-[#0076AF]">{saved}</span> : null}
    </form>
  );
}
