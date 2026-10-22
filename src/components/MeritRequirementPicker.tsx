"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { addMeritRequirementAction } from "@/actions/admin";

export type MeritOption = {
  id: number;
  name: string;
  programName: string;
  imageUrl?: string | null;
};

export function MeritRequirementPicker({
  badgeId,
  meritBadges,
  usedIds = [],
}: {
  badgeId: number;
  meritBadges: MeritOption[];
  usedIds?: number[];
}) {
  const [query, setQuery] = useState("");
  const action = addMeritRequirementAction.bind(null, badgeId);

  const available = useMemo(
    () => meritBadges.filter((merit) => !usedIds.includes(merit.id)),
    [meritBadges, usedIds],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return available;
    return available.filter((merit) => `${merit.name} ${merit.programName}`.toLowerCase().includes(term));
  }, [available, query]);

  if (available.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Every merit badge is already one of this rank&apos;s requirements.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <label className="relative block">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]" />
        <input
          className="bloom-input pl-9"
          placeholder="Search merit badges…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
        />
      </label>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white/70 p-4 text-center text-sm font-bold text-[var(--muted)]">
          No merit badge matches “{query}”.
        </p>
      ) : (
        <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
          {filtered.map((merit) => (
            <button
              key={merit.id}
              type="submit"
              name="requiredBadgeId"
              value={merit.id}
              className="flex items-center gap-3 rounded-2xl border-2 border-transparent bg-white/80 p-3 text-left transition hover:border-[var(--primary)]"
            >
              {merit.imageUrl ? (
                <img src={merit.imageUrl} alt="" className="h-10 w-10" />
              ) : (
                <span className="text-xl">🎖️</span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-extrabold">{merit.name}</span>
                <span className="block truncate text-xs text-[var(--muted)]">{merit.programName}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--muted)]">
        Pick a merit badge — the requirement is met automatically once that badge is awarded, so no proof is uploaded for
        it.
      </p>
    </form>
  );
}
