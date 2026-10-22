"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { toPlainText } from "@/lib/richtext";
import type { BadgeCardData } from "@/components/ui";

function actionFor(badge: BadgeCardData) {
  if (badge.earned) return "View badge";
  if (badge.applicationStatus === "pending" || badge.applicationStatus === "level1_approved") return "In review — view";
  if (badge.canApply) return "Submit for approval";
  if (badge.satisfiedCount > 0) return "Continue badge";
  return "Apply for this badge";
}

function statusFor(badge: BadgeCardData) {
  if (badge.earned) return "Earned";
  if (badge.applicationStatus === "pending") return "Waiting for Scout Leader";
  if (badge.applicationStatus === "level1_approved") return "Waiting for Council Admin";
  if (badge.applicationStatus === "rejected") return "Needs revision";
  return `${badge.satisfiedCount}/${badge.totalCount} tasks done`;
}

export function MeritBadgeBrowser({
  badges,
  programs,
}: {
  badges: BadgeCardData[];
  programs: { id: number; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string>("ALL");
  const [programId, setProgramId] = useState<"all" | number>("all");

  const letters = useMemo(() => {
    const set = new Set<string>();
    for (const badge of badges) set.add(badge.name.trim().charAt(0).toUpperCase());
    return Array.from(set).sort();
  }, [badges]);

  const filtered = useMemo(() => {
    return badges
      .filter((badge) => {
        if (programId !== "all" && badge.programId !== programId) return false;
        if (letter !== "ALL" && badge.name.trim().charAt(0).toUpperCase() !== letter) return false;
        const haystack = `${badge.name} ${badge.programName} ${badge.categoryName ?? ""}`.toLowerCase();
        if (query && !haystack.includes(query.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [badges, query, letter, programId]);

  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <div>
      <div className="bloom-card mb-5 p-4">
        <label className="relative block">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="bloom-input pl-9"
            placeholder="Search merit badges…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-1">
          <button type="button" className={`chip ${letter === "ALL" ? "bg-[var(--accent)]" : ""}`} onClick={() => setLetter("ALL")}>
            All
          </button>
          {letters.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${letter === value ? "bg-[var(--accent)]" : ""}`}
              onClick={() => setLetter(value)}
            >
              {value}
            </button>
          ))}
        </div>

        {programs.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`chip ${programId === "all" ? "bg-[#cbb6ff]" : ""}`}
              onClick={() => setProgramId("all")}
            >
              All programs
            </button>
            {programs.map((program) => (
              <button
                key={program.id}
                type="button"
                className={`chip ${programId === program.id ? "bg-[#cbb6ff]" : ""}`}
                onClick={() => setProgramId(program.id)}
              >
                {program.name}
              </button>
            ))}
          </div>
        ) : null}

        <p className="mt-3 text-xs font-extrabold text-[var(--muted)]">
          {filtered.length} of {badges.length} merit badges · {earned} earned
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="bloom-card p-8 text-center font-bold text-[var(--muted)]">
          No merit badges match that search. Try another letter.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((badge) => (
            <article key={badge.id} className="bloom-card flex flex-col overflow-hidden">
              <Link
                href={`/advancement/badge/${badge.id}`}
                className="relative flex h-40 items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${badge.programColor}22, ${badge.programColor}55)` }}
              >
                {badge.imageUrl ? (
                  <img src={badge.imageUrl} alt="" className="h-28 w-28 drop-shadow" />
                ) : (
                  <span className="grid h-24 w-24 place-items-center rounded-full text-4xl" style={{ background: badge.programColor }}>
                    🎖️
                  </span>
                )}
                {badge.earned ? <span className="sticker absolute top-3 right-3">Earned</span> : null}
                {badge.categoryName ? (
                  <span className="chip absolute bottom-3 left-3 text-[10px]" style={{ background: `${badge.categoryColor ?? "#2d6a4f"}22` }}>
                    {badge.categoryIcon} {badge.categoryName}
                  </span>
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
                  {badge.programIcon} {badge.programName}
                </p>
                <h3 className="font-display mt-1 text-lg leading-tight">{badge.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                  {toPlainText(badge.description) || "—"}
                </p>
                {badge.requiredBy?.length ? (
                  <p className="mt-2 text-[11px] font-bold text-[var(--muted)]">
                    Required by: {badge.requiredBy.map((rank) => rank.name).join(", ")}
                  </p>
                ) : null}

                <div className="mt-3 flex justify-between text-xs font-extrabold">
                  <span>{statusFor(badge)}</span>
                  <span>{badge.percent}%</span>
                </div>
                <div className="progress-rail mt-1">
                  <div className="progress-fill" style={{ width: `${badge.percent}%` }} />
                </div>

                <Link href={`/advancement/badge/${badge.id}`} className="bloom-btn mt-4">
                  {actionFor(badge)}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
