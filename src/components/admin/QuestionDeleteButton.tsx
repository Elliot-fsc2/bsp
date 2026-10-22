"use client";

import { useRouter } from "next/navigation";

export function QuestionDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  return (
    <button
      className="text-sm text-[#AC242A]"
      type="button"
      onClick={async () => {
        if (!confirm("Delete this question?")) return;
        await fetch("/api/admin/banks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete-question", id }),
        });
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
