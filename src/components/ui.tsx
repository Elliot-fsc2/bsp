import type { ReactNode } from "react";
import Link from "next/link";
import { toPlainText } from "@/lib/richtext";
import { initials, roleLabel } from "@/lib/utils";
import type { Role } from "@/lib/types";

export function Avatar({
  name,
  color,
  size = 40,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-[3px_3px_0_rgba(43,27,78,0.15)]"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role | string }) {
  const map: Record<string, string> = {
    admin: "bg-[#ffd166]",
    teacher: "bg-[#cbb6ff]",
    student: "bg-[#b8f2e6]",
  };
  return <span className={`sticker ${map[role] ?? "bg-white"}`}>{roleLabel(role)}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="sticker mb-3">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl font-semibold md:text-4xl">{title}</h1>
        {text ? <p className="mt-2 max-w-2xl text-[15px] text-[var(--muted)]">{text}</p> : null}
      </div>
      {action ? <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="bloom-card p-8 text-center">
      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-[24px] bg-[var(--accent)] text-3xl">⚜️</div>
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[var(--muted)]">{text}</p>
      {href && cta ? (
        <Link href={href} className="bloom-btn mt-5">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

export type BadgeCardData = {
  id: number;
  name: string;
  kind: string;
  description: string | null;
  imageUrl: string | null;
  isMembership: boolean;
  programId?: number;
  programName: string;
  programColor: string;
  programIcon: string;
  categoryName?: string | null;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  rankStep?: number | null;
  rankCount?: number | null;
  locked?: boolean;
  lockedByName?: string | null;
  canApply?: boolean;
  requiredBy?: { id: number; name: string }[];
  satisfiedCount: number;
  totalCount: number;
  percent: number;
  earned: boolean;
  applicationStatus: string | null;
};

export function BadgeCard({ badge }: { badge: BadgeCardData }) {
  const ring = badge.locked
    ? `Locked · earn the ${badge.lockedByName}`
    : badge.earned
      ? "Earned"
      : badge.applicationStatus === "pending" || badge.applicationStatus === "level1_approved"
        ? "In review"
        : `${badge.satisfiedCount}/${badge.totalCount} done`;
  return (
    <Link href={`/advancement/badge/${badge.id}`} className="bloom-card group block overflow-hidden">
      <div
        className="relative flex h-36 items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${badge.programColor}22, ${badge.programColor}55)` }}
      >
        {badge.imageUrl ? (
          <img
            src={badge.imageUrl}
            alt=""
            className={`h-28 w-28 drop-shadow transition duration-300 group-hover:scale-105 ${badge.locked ? "opacity-40 grayscale" : ""}`}
          />
        ) : (
          <span
            className={`grid h-24 w-24 place-items-center rounded-full text-4xl ${badge.locked ? "opacity-40 grayscale" : ""}`}
            style={{ background: badge.programColor }}
          >
            {badge.kind === "merit" ? "🎖️" : "⚜️"}
          </span>
        )}
        {typeof badge.rankStep === "number" ? (
          <span className="chip absolute top-3 left-3 bg-white/90">
            Rank {badge.rankStep}
            {badge.rankCount ? ` of ${badge.rankCount}` : ""}
          </span>
        ) : badge.isMembership ? (
          <span className="chip absolute top-3 left-3 bg-white/90">Membership</span>
        ) : null}
        {badge.locked ? (
          <span className="sticker absolute top-3 right-3 bg-[#e5e7eb]">🔒 Locked</span>
        ) : badge.earned ? (
          <span className="sticker absolute top-3 right-3">Earned</span>
        ) : null}
        {badge.categoryName ? (
          <span className="chip absolute bottom-3 left-3 text-[10px]" style={{ background: `${badge.categoryColor ?? "#2d6a4f"}22` }}>
            {badge.categoryIcon} {badge.categoryName}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <p className="text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
          {badge.programIcon} {badge.programName} · {badge.kind === "merit" ? "Merit badge" : "Rank"}
        </p>
        <h3 className="font-display mt-1 text-lg leading-tight">{badge.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{toPlainText(badge.description) || "—"}</p>
        {badge.requiredBy?.length ? (
          <p className="mt-2 text-[11px] font-bold text-[var(--muted)]">
            Required by: {badge.requiredBy.map((rank) => rank.name).join(", ")}
          </p>
        ) : null}
        <div className="mt-3 flex justify-between text-xs font-extrabold">
          <span>{ring}</span>
          {badge.locked ? null : <span>{badge.percent}%</span>}
        </div>
        <div className="progress-rail mt-1">
          <div className="progress-fill" style={{ width: `${badge.locked ? 0 : badge.percent}%` }} />
        </div>
      </div>
    </Link>
  );
}

export function RankLadder({ ranks, disabled = false }: { ranks: BadgeCardData[]; disabled?: boolean }) {
  return (
    <ol className="space-y-2">
      {ranks.map((badge, index) => {
        const body = (
          <>
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-extrabold ${badge.earned ? "" : "bg-white"}`}
              style={badge.earned ? { background: "#d8f3dc" } : undefined}
            >
              {index + 1}
            </span>
            {badge.imageUrl ? (
              <img src={badge.imageUrl} alt="" className={`h-10 w-10 ${badge.locked ? "opacity-40 grayscale" : ""}`} />
            ) : (
              <span className={`text-2xl ${badge.locked ? "opacity-40 grayscale" : ""}`}>⚜️</span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">
                {badge.name}
                {badge.isMembership ? <span className="chip ml-2 text-[10px]">Membership</span> : null}
              </span>
              <span className="block text-xs text-[var(--muted)]">
                {badge.locked
                  ? `🔒 Locked — earn the ${badge.lockedByName} first`
                  : badge.earned
                    ? "Earned"
                    : `${badge.satisfiedCount}/${badge.totalCount} requirements complete (${badge.percent}%)`}
              </span>
            </span>
            {badge.earned ? (
              <span className="sticker">Earned</span>
            ) : badge.canApply ? (
              <span className="sticker bg-[#dbeafe]">Ready to submit</span>
            ) : badge.locked || disabled ? (
              <span className="chip opacity-70">Locked</span>
            ) : (
              <span className="text-sm font-extrabold text-[var(--secondary)]">Open →</span>
            )}
          </>
        );
        const className = `bloom-card flex items-center gap-3 p-3 ${badge.locked ? "opacity-75" : ""}`;

        return (
          <li key={badge.id}>
            {disabled ? (
              <div className={`${className} cursor-not-allowed opacity-60 grayscale`}>{body}</div>
            ) : (
              <Link href={`/advancement/badge/${badge.id}`} className={className}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: string;
  tone?: string;
}) {
  return (
    <div className="bloom-card p-5">
      <div
        className="mb-3 grid h-11 w-11 place-items-center rounded-2xl text-xl"
        style={{ background: tone ?? "var(--accent)" }}
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
      <p className="font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
