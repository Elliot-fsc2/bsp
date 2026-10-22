"use client";

import { useRouter } from "next/navigation";

export function LessonDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  return (
    <button
      className="text-sm text-[#AC242A]"
      type="button"
      onClick={async () => {
        if (!confirm("Delete this lesson?")) return;
        await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, delete: true }),
        });
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
