"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCard, type BadgeCardData } from "@/components/ui";

export type AdvancementProgram = {
  id: number;
  name: string;
  icon: string;
  slug: string;
  ageRange: string | null;
  level: number;
  locked: boolean;
  lockedByName: string | null;
  complete: boolean;
  ranksEarned: number;
  ranksTotal: number;
};

export function AdvancementRanks({
  programs,
  ranks,
}: {
  programs: AdvancementProgram[];
  ranks: BadgeCardData[];
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const program = programs.find((item) => item.id === selected) ?? null;
  const programRanks = program ? ranks.filter((rank) => rank.programId === program.id) : [];

  return (
    <section className="mb-8">
      <div className="mb-4">
        <p className="mb-2 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">Choose a program</p>
        <div className="flex flex-wrap gap-1">
          {programs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${selected === item.id ? "bg-[var(--accent)]" : ""}`}
              onClick={() => setSelected(item.id)}
            >
              {item.icon} {item.name}
            </button>
          ))}
        </div>
      </div>

      {!program ? (
        <p className="bloom-card p-6 text-[var(--muted)]">Pick a program above to see its ranks.</p>
      ) : (
        <div className={program.locked ? "opacity-80" : ""}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="mb-2 flex flex-wrap items-center gap-2">
                <span className="sticker">Level {program.level}</span>
                {program.complete ? <span className="sticker bg-[#d8f3dc]">Program complete</span> : null}
                {program.locked ? <span className="sticker bg-[#ffe0e8]">🔒 Locked</span> : null}
              </p>
              <h2 className="font-display text-2xl">
                {program.icon} {program.name}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {program.ageRange} · {program.ranksEarned}/{program.ranksTotal} ranks earned
              </p>
            </div>
            {program.locked ? null : (
              <Link href={`/advancement/${program.slug}`} className="text-sm font-extrabold text-[var(--secondary)]">
                Program details →
              </Link>
            )}
          </div>

          {program.locked ? (
            <p className="bloom-card mb-3 p-3 text-sm font-bold text-[var(--muted)]">
              🔒 Level {program.level} opens when you finish <strong>{program.lockedByName}</strong>. You can see the
              trail ahead, but it is not open yet.
            </p>
          ) : null}

          <h3 className="mb-2 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
            Ranks — earn them in order
          </h3>
          {programRanks.length === 0 ? (
            <p className="bloom-card p-4 text-sm text-[var(--muted)]">No ranks in this program yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {programRanks.map((rank) => (
                <BadgeCard key={rank.id} badge={rank} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
