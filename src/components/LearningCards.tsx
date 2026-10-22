import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  HandHeart,
  HeartHandshake,
  LockKeyhole,
  Play,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import type { lessons, levels } from "@/db/schema";
import { formatDate } from "@/lib/utils";

const LEVEL_ART = [
  { bg: "#1E4488", icon: Compass },
  { bg: "#0076AF", icon: UsersRound },
  { bg: "#1B365F", icon: HeartHandshake },
  { bg: "#AC242A", icon: HandHeart },
  { bg: "#005695", icon: Award },
];

function summary(html: string) {
  return html
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 132);
}

export function LevelCard({
  level,
  status,
  lessonCount,
  completedCount,
  examDeadline,
  locked,
}: {
  level: typeof levels.$inferSelect;
  status: string;
  lessonCount: number;
  completedCount: number;
  examDeadline?: Date | null;
  locked: boolean;
}) {
  const art = LEVEL_ART[(level.number - 1) % LEVEL_ART.length];
  const Icon = art.icon;
  const percent = status === "passed" ? 100 : lessonCount ? Math.round((completedCount / lessonCount) * 100) : 0;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#dce5f1] bg-white shadow-[0_12px_32px_rgba(30,68,136,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(30,68,136,0.13)]">
      <div className="relative h-40 overflow-hidden p-5 text-white" style={{ background: art.bg }}>
        {level.coverFilename ? (
          <img src={level.coverFilename} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <span className="absolute -bottom-14 -right-8 h-48 w-48 rounded-full border-[26px] border-white/10" />
        <span className="absolute right-12 top-3 h-24 w-24 rounded-full border-[14px] border-white/8" />
        <div className="relative flex items-start justify-between">
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]">
            Level {String(level.number).padStart(2, "0")}
          </span>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Icon size={24} strokeWidth={1.8} />
          </span>
        </div>
        <span className="absolute bottom-3 left-5 font-serif text-6xl font-bold text-white/20">0{level.number}</span>
        {locked ? (
          <span className="absolute bottom-5 right-5 grid h-8 w-8 place-items-center rounded-full bg-white/20">
            <LockKeyhole size={16} />
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-serif text-[23px] font-semibold leading-tight text-[#1B365F]">{level.name}</h2>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status === "passed" ? "bg-[#E9F5EA] text-[#00694B]" : locked ? "bg-[#EDF1F6] text-[#708099]" : "bg-[#FFF7D7] text-[#705100]"}`}>
            {status === "in_progress" ? "In progress" : status}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#64758A]">{level.description}</p>
        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-[#64758A]">
          <span className="inline-flex items-center gap-1.5"><BookOpen size={14} className="text-[#0076AF]" /> {lessonCount} lessons</span>
          <span className="inline-flex items-center gap-1.5"><Award size={14} className="text-[#EAAB00]" /> {level.requiredScore}% to pass</span>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-medium text-[#64758A]">
            <span>{locked ? "Complete previous level to unlock" : `${completedCount} of ${lessonCount} lessons reviewed`}</span>
            {!locked ? <span>{percent}%</span> : null}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#E9EEF5]">
            <div className="h-full rounded-full bg-[#FFCF00] transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
        {examDeadline && !locked ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#64758A]"><CalendarDays size={13} /> Exam by {formatDate(examDeadline)}</p>
        ) : null}
        <div className="mt-auto pt-5">
          {locked ? (
            <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F1F4F8] px-4 py-3 text-sm font-semibold text-[#8895A6]"><LockKeyhole size={15} /> Locked</span>
          ) : (
            <Link href={`/dashboard/levels/${level.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#EAAB00] bg-[#FFCF00] px-4 py-3 text-sm font-bold text-[#1B365F] shadow-[0_8px_18px_rgba(234,171,0,0.2)] transition hover:bg-[#EAAB00] hover:text-[#1B365F]">
              {status === "passed" ? "Review level" : "Explore level"} <ArrowRight size={16} className="text-[#1B365F]" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function LessonCard({
  lesson,
  levelNumber,
  order,
  completed,
  locked,
  actions,
  admin = false,
}: {
  lesson: typeof lessons.$inferSelect;
  levelNumber: number;
  order: number;
  completed?: boolean;
  locked?: boolean;
  actions?: ReactNode;
  admin?: boolean;
}) {
  const readingMinutes = Math.max(3, Math.round(summary(lesson.content).split(" ").length / 40) + 2);
  const art = LEVEL_ART[(levelNumber - 1) % LEVEL_ART.length];
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#dce5f1] bg-white shadow-[0_8px_24px_rgba(30,68,136,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(30,68,136,0.12)]">
      <div className="relative flex h-28 items-start justify-between overflow-hidden p-4 text-white" style={{ background: art.bg }}>
        {lesson.coverFilename ? (
          <img src={lesson.coverFilename} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <span className="absolute -bottom-8 right-6 h-28 w-28 rounded-full border-[18px] border-white/10" />
        <span className="absolute bottom-0 right-16 font-serif text-[74px] font-bold leading-none text-white/20">{String(order).padStart(2, "0")}</span>
        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
          <Sparkles size={12} /> Lesson {String(order).padStart(2, "0")}
        </span>
        <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/15"><BookOpen size={19} /></span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.13em]">
          <span className="text-[#0076AF]">Level {levelNumber}</span>
          {admin ? (
            <span className={lesson.isPublished ? "text-[#00694B]" : "text-[#AC242A]"}>{lesson.isPublished ? "Published" : "Draft"}</span>
          ) : completed ? (
            <span className="inline-flex items-center gap-1 text-[#00694B]"><Check size={12} /> Reviewed</span>
          ) : (
            <span className="text-[#8895A6]">Not reviewed</span>
          )}
        </div>
        <h3 className="mt-3 font-serif text-[21px] font-semibold leading-tight text-[#1B365F]">{lesson.title}</h3>
        <p className="mt-2 line-clamp-3 min-h-[66px] text-sm leading-[22px] text-[#64758A]">
          {summary(lesson.content) || "A DeMolay lesson ready for your learning pathway."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#64758A]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F2F6FB] px-2.5 py-1.5"><Clock3 size={13} /> {readingMinutes} min read</span>
          {lesson.videoUrl || lesson.embedCode ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F4FA] px-2.5 py-1.5 text-[#005695]"><Play size={12} /> Media</span>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#E8EEF5] pt-4 text-sm">
          {admin ? (
            actions
          ) : locked ? (
            <span className="inline-flex items-center gap-1.5 text-[#8895A6]"><LockKeyhole size={15} /> Locked</span>
          ) : (
            <Link href={`/dashboard/lessons/${lesson.id}`} className="inline-flex w-full items-center justify-between font-semibold text-[#1E4488] transition hover:text-[#0076AF]">
              {completed ? "Review lesson" : "Start lesson"} <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
