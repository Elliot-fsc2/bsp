"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { deleteProgramAction, reorderProgramsAction, updateProgramAction } from "@/actions/admin";
import { Modal } from "@/components/Modal";
import { RichTextEditor } from "@/components/RichTextEditor";

export type ProgramListItem = {
  id: number;
  name: string;
  section: string | null;
  ageRange: string | null;
  icon: string;
  color: string;
  description: string | null;
  descriptionText: string;
  rankCount: number;
  meritCount: number;
};

export function ProgramList({ programs }: { programs: ProgramListItem[] }) {
  const [order, setOrder] = useState<number[] | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);
  const rectsRef = useRef<DOMRect[]>([]);
  const fromRef = useRef(0);
  const slotRef = useRef(0);

  const items = useMemo(() => {
    if (!order) return programs;
    const byId = new Map(programs.map((program) => [program.id, program]));
    const listed = order.map((id) => byId.get(id)).filter((program): program is ProgramListItem => Boolean(program));
    for (const program of programs) {
      if (!order.includes(program.id)) listed.push(program);
    }
    return listed;
  }, [order, programs]);

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, index: number, id: number) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rows = Array.from(listRef.current?.children ?? []) as HTMLElement[];
    rectsRef.current = rows.map((row) => row.getBoundingClientRect());
    fromRef.current = index;
    slotRef.current = index;
    setDragId(id);
    setSlot(index);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragId === null) return;
    const rects = rectsRef.current;
    let next = rects.length;
    for (let i = 0; i < rects.length; i += 1) {
      if (event.clientY < rects[i].top + rects[i].height / 2) {
        next = i;
        break;
      }
    }
    slotRef.current = next;
    setSlot(next);
  };

  const endDrag = async () => {
    if (dragId === null) return;
    const from = fromRef.current;
    const target = slotRef.current;
    setDragId(null);
    setSlot(null);
    if (target === from || target === from + 1) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(target > from ? target - 1 : target, 0, moved);
    setOrder(next.map((program) => program.id));
    await reorderProgramsAction(next.map((program) => program.id));
  };

  return (
    <ol ref={listRef} className="space-y-2">
      {items.map((program, index) => (
        <li key={program.id} className="relative">
          {dragId !== null && slot === index && dragId !== program.id ? (
            <span className="pointer-events-none absolute inset-x-0 -top-1 h-1.5 rounded-full bg-[var(--primary)]" />
          ) : null}

          <div
            className={`bloom-card flex flex-wrap items-center gap-3 p-3 transition ${
              dragId === program.id ? "opacity-60 ring-2 ring-[var(--primary)]" : ""
            }`}
          >
            <button
              type="button"
              aria-label={`Drag ${program.name} to change its level`}
              onPointerDown={(event) => beginDrag(event, index, program.id)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="grid h-11 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-xl bg-white text-[var(--muted)] active:cursor-grabbing"
            >
              <GripVertical size={18} />
            </button>

            <span className="sticker shrink-0">Level {index + 1}</span>

            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl"
              style={{ background: `${program.color}33` }}
            >
              {program.icon}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{program.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {program.section ? `${program.section} · ` : ""}
                {program.ageRange ?? "—"} · {program.rankCount} ranks · {program.meritCount} merit badges
              </p>
              <p className="line-clamp-1 text-xs text-[var(--muted)]">{program.descriptionText || "No description"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/programs/${program.id}`} className="bloom-btn secondary">
                Ranks &amp; badges →
              </Link>

              <Modal title={`Edit ${program.name}`} size="lg" trigger="Edit" triggerClass="bloom-btn secondary">
                <form action={updateProgramAction.bind(null, program.id)} className="space-y-3">
                  <input className="bloom-input" name="name" defaultValue={program.name} />
                  <input className="bloom-input" name="section" defaultValue={program.section ?? ""} placeholder="Section" />
                  <input className="bloom-input" name="ageRange" defaultValue={program.ageRange ?? ""} placeholder="Age range" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="bloom-input" name="icon" defaultValue={program.icon} placeholder="Icon" />
                    <input className="bloom-input h-12" type="color" name="color" defaultValue={program.color} />
                  </div>
                  <RichTextEditor name="description" defaultValue={program.description ?? ""} minHeight={120} />
                  <button className="bloom-btn">Save program</button>
                </form>
              </Modal>

              <Modal
                title={`Delete ${program.name}?`}
                description="This also removes every rank, merit badge, and requirement in the program."
                size="sm"
                trigger="Delete"
                triggerClass="bloom-btn ghost"
              >
                <form action={deleteProgramAction.bind(null, program.id)}>
                  <button className="bloom-btn" style={{ background: "#c1121f" }}>
                    Yes, delete this program
                  </button>
                </form>
              </Modal>
            </div>
          </div>
        </li>
      ))}

      {dragId !== null && slot === items.length ? (
        <li className="pointer-events-none relative h-1.5 rounded-full bg-[var(--primary)]" />
      ) : null}
    </ol>
  );
}
