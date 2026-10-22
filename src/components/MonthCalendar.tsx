"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/Modal";

export type CalendarEntry = {
  id: number;
  title: string;
  date: string;
  when: string;
  kind: string;
  description: string;
  programName: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KIND_CLASS: Record<string, string> = {
  Event: "bg-[#cbb6ff]",
  "Council holiday": "bg-[#ffd0e3]",
};

const keyOf = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);

export function MonthCalendar({ entries }: { entries: CalendarEntry[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getUTCFullYear(), month: now.getUTCMonth() });

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date);
      if (list) list.push(entry);
      else map.set(entry.date, [entry]);
    }
    return map;
  }, [entries]);

  const weeks = useMemo(() => {
    const offset = new Date(Date.UTC(cursor.year, cursor.month, 1)).getUTCDay();
    const days = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
    const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
      const date = new Date(Date.UTC(cursor.year, cursor.month, 1 - offset + index));
      return { key: date.toISOString().slice(0, 10), day: date.getUTCDate(), inMonth: date.getUTCMonth() === cursor.month };
    });
    return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
  }, [cursor]);

  const label = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const todayKey = keyOf(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const shift = (delta: number) => {
    const next = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
    setCursor({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };

  return (
    <div className="bloom-card p-3 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 md:mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} />
          <p className="font-display text-lg md:text-xl">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="bloom-btn ghost" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="bloom-btn secondary"
            onClick={() => setCursor({ year: now.getUTCFullYear(), month: now.getUTCMonth() })}
          >
            Today
          </button>
          <button type="button" className="bloom-btn ghost" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {WEEKDAYS.map((day) => (
          <p key={day} className="pb-1 text-center text-[10px] font-extrabold tracking-wide text-[var(--muted)] uppercase md:text-[11px]">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day[0]}</span>
          </p>
        ))}
        {weeks.flat().map((cell) => {
          const dayEntries = byDate.get(cell.key) ?? [];
          return (
            <div
              key={cell.key}
              className={`min-h-[64px] rounded-xl border-2 p-1 md:min-h-[104px] md:rounded-2xl md:p-1.5 ${
                cell.inMonth ? "border-[var(--line)] bg-white/70" : "border-transparent bg-white/30 opacity-60"
              } ${cell.key === todayKey ? "ring-2 ring-[var(--primary)]" : ""}`}
            >
              <p
                className={`text-[11px] font-extrabold md:text-xs ${
                  cell.key === todayKey ? "text-[var(--primary)]" : "text-[var(--muted)]"
                }`}
              >
                {cell.day}
              </p>
              <div className="mt-1 space-y-1">
                {dayEntries.slice(0, 2).map((entry) => (
                  <Modal
                    key={entry.id}
                    title={entry.title}
                    description={entry.kind}
                    trigger={<span className="block truncate">{entry.title}</span>}
                    triggerClass={`block w-full truncate rounded-lg px-1 py-0.5 text-left text-[10px] font-extrabold ${
                      KIND_CLASS[entry.kind] ?? "bg-white"
                    }`}
                  >
                    <div className="space-y-2">
                      <p className="sticker">{entry.kind}</p>
                      <p className="text-sm font-extrabold">{entry.when}</p>
                      {entry.description ? <p className="text-sm text-[var(--muted)]">{entry.description}</p> : null}
                      {entry.programName ? (
                        <p className="text-xs font-bold text-[var(--muted)]">{entry.programName}</p>
                      ) : null}
                    </div>
                  </Modal>
                ))}
                {dayEntries.length > 2 ? (
                  <p className="px-1 text-[10px] font-bold text-[var(--muted)]">+{dayEntries.length - 2} more</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-[var(--muted)]">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#cbb6ff]" /> Event
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ffd0e3]" /> Council holiday
        </span>
        <span className="md:ml-auto">Tap an activity to see the details.</span>
      </div>
    </div>
  );
}
