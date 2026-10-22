"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BankCreateForm({
  levels,
}: {
  levels: { id: number; number: number; name: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-bank",
        name: form.get("name"),
        description: form.get("description"),
        levelId: form.get("levelId") ? Number(form.get("levelId")) : null,
      }),
    });
    const data = (await response.json()) as { id?: number };
    setPending(false);
    if (data.id) router.push(`/admin/banks/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <input className="input" name="name" placeholder="Bank name" required />
      <textarea className="input min-h-[80px]" name="description" placeholder="Description" />
      <select className="input" name="levelId" defaultValue="">
        <option value="">No specific level</option>
        {levels.map((level) => (
          <option key={level.id} value={level.id}>
            Level {level.number}: {level.name}
          </option>
        ))}
      </select>
      <button className="btn btn-dark" disabled={pending} type="submit">
        {pending ? "Creating…" : "Create bank"}
      </button>
    </form>
  );
}
