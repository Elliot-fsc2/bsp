"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkCompleteButton({ lessonId, completed }: { lessonId: number; completed: boolean }) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [pending, setPending] = useState(false);

  if (done) {
    return <p className="text-sm font-medium text-[#0076AF]">Marked as reviewed.</p>;
  }

  return (
    <button
      className="btn btn-gold"
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch(`/api/student/lessons/${lessonId}/complete`, { method: "POST" });
        setDone(true);
        setPending(false);
        router.refresh();
      }}
    >
      {pending ? "Saving…" : "Mark lesson reviewed"}
    </button>
  );
}
