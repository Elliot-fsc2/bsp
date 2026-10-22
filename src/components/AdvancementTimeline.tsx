import Link from "next/link";
import type { BadgeProgress, ProgramProgress, RequirementView } from "@/lib/queries";

const STATUS: Record<string, { label: string; className: string }> = {
  done: { label: "Approved", className: "bg-[#d8f3dc]" },
  merit: { label: "Merit badge earned", className: "bg-[#d8f3dc]" },
  leader: { label: "Waiting for Scout Leader", className: "bg-[#fff3c4]" },
  council: { label: "Waiting for Council Admin", className: "bg-[#dbeafe]" },
  revise: { label: "Needs revision", className: "bg-[#ffe0e8]" },
  todo: { label: "To do", className: "bg-white" },
  locked: { label: "Locked", className: "bg-white opacity-70" },
};

function toneOf(requirement: RequirementView, locked: boolean) {
  if (requirement.satisfiedByMerit) return "merit";
  if (requirement.satisfied) return "done";
  if (requirement.status === "rejected") return "revise";
  if (requirement.status === "level1_approved") return "council";
  if (requirement.status === "pending") return "leader";
  if (locked) return "locked";
  return "todo";
}

function rankTone(rank: BadgeProgress) {
  if (rank.earned) return "Earned";
  if (rank.locked) return `Locked — earn the ${rank.lockedByName} first`;
  if (rank.canApply) return "Ready to submit for approval";
  if (rank.satisfiedCount > 0) return "In progress";
  return "Not started";
}

export function AdvancementTimeline({
  programs,
  badges,
}: {
  programs: ProgramProgress[];
  badges: BadgeProgress[];
}) {
  if (programs.length === 0) return null;

  const current =
    programs.find((program) => !program.locked && !program.complete) ??
    [...programs].reverse().find((program) => !program.locked) ??
    programs[0];

  const ranks = badges
    .filter((badge) => badge.programId === current.id && badge.kind === "rank")
    .sort((a, b) => a.position - b.position || a.id - b.id);
  const tasks = ranks.flatMap((rank) => rank.requirements);
  const done = tasks.filter((task) => task.satisfied).length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const lockedNext = programs.find((program) => program.locked);

  return (
    <section className="bloom-card mb-5 p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sticker mb-2">
            Level {current.level} · {current.icon} {current.name}
          </p>
          <h2 className="font-display text-2xl">What you still need to do</h2>
          <p className="text-sm text-[var(--muted)]">
            {done} of {tasks.length} tasks done · {current.ranksEarned}/{current.ranksTotal} ranks earned
          </p>
        </div>
        <Link href={`/advancement/${current.slug}`} className="text-sm font-extrabold text-[var(--secondary)]">
          Open the program →
        </Link>
      </div>

      <div className="progress-rail mt-3">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>

      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">This program has no tasks yet. Check back soon, Scout.</p>
      ) : (
        <ol className="relative mt-5 space-y-6 border-l-2 border-[var(--line)] pl-4 md:pl-6">
          {ranks.map((rank, index) => (
            <li key={rank.id} className="relative">
              <span
                className={`absolute top-0.5 -left-[26px] grid h-5 w-5 place-items-center rounded-full border-2 border-[var(--line)] text-[10px] font-extrabold md:-left-[34px] ${
                  rank.earned ? "bg-[#d8f3dc]" : "bg-white"
                }`}
              >
                {rank.earned ? "✓" : index + 1}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {rank.locked ? (
                  <span className="font-extrabold opacity-60">{rank.name}</span>
                ) : (
                  <Link
                    href={`/advancement/badge/${rank.id}`}
                    className="font-extrabold text-[var(--secondary)] underline"
                  >
                    {rank.name}
                  </Link>
                )}
                <span className="chip text-[10px]">
                  {rank.satisfiedCount}/{rank.totalCount} tasks
                </span>
                <span
                  className={`sticker text-[10px] ${
                    rank.earned
                      ? "bg-[#d8f3dc]"
                      : rank.canApply
                        ? "bg-[#dbeafe]"
                        : rank.locked
                          ? "bg-white opacity-70"
                          : "bg-white"
                  }`}
                >
                  {rankTone(rank)}
                </span>
              </div>

              <div className="mt-2 space-y-1.5">
                {rank.requirements.map((requirement) => {
                  const status = STATUS[toneOf(requirement, rank.locked)];
                  const href =
                    requirement.type === "merit" && requirement.requiredBadgeId
                      ? `/advancement/badge/${requirement.requiredBadgeId}`
                      : `/advancement/requirement/${requirement.id}`;
                  const row = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{requirement.title}</span>
                        <span className="block text-[11px] text-[var(--muted)]">
                          {requirement.points} pts
                          {requirement.requiresMedia
                            ? ` · ${requirement.mediaKind === "video" ? "video proof" : "photo proof"}`
                            : ""}
                          {requirement.quiz ? " · quiz" : ""}
                          {requirement.type === "merit" && requirement.requiredBadgeName
                            ? ` · merit badge: ${requirement.requiredBadgeName}`
                            : ""}
                        </span>
                      </span>
                      <span className={`sticker shrink-0 text-[10px] ${status.className}`}>{status.label}</span>
                      {rank.locked ? null : (
                        <span className="text-sm font-extrabold text-[var(--secondary)]">›</span>
                      )}
                    </>
                  );

                  return rank.locked ? (
                    <div
                      key={requirement.id}
                      className="flex cursor-not-allowed items-center gap-3 rounded-xl border-2 border-[var(--line)] bg-white/60 px-3 py-2 opacity-70"
                    >
                      {row}
                    </div>
                  ) : (
                    <Link
                      key={requirement.id}
                      href={href}
                      className="flex items-center gap-3 rounded-xl border-2 border-[var(--line)] bg-white/70 px-3 py-2 hover:border-[var(--primary)]"
                    >
                      {row}
                    </Link>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}

      {lockedNext ? (
        <p className="mt-5 rounded-2xl bg-white/70 p-3 text-sm font-bold text-[var(--muted)]">
          🔒 Next level: <strong>{lockedNext.icon} {lockedNext.name}</strong> — opens when you finish{" "}
          {lockedNext.lockedByName}.
        </p>
      ) : null}
    </section>
  );
}
