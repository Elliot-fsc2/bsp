"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProgressActions({
  userId,
  levelId,
  studyDays,
  examDays,
}: {
  userId: number;
  levelId: number;
  studyDays: number;
  examDays: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(action: "extend" | "reset-attempts") {
    setPending(true);
    await fetch("/api/admin/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId, levelId, studyDays, examDays }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-ghost text-xs" type="button" disabled={pending} onClick={() => void run("extend")}>
        Extend window
      </button>
      <button className="btn btn-ghost text-xs" type="button" disabled={pending} onClick={() => void run("reset-attempts")}>
        Reset attempts
      </button>
    </div>
  );
}
