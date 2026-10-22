"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const SIZES: Record<string, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  trigger,
  triggerClass = "bloom-btn",
  title,
  description,
  size = "md",
  children,
}: {
  trigger: ReactNode;
  triggerClass?: string;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const overlay = (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[rgba(43,27,78,0.45)] p-4 py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`bloom-card relative mx-auto w-full ${SIZES[size]} p-5`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="shrink-0 rounded-full bg-white p-1.5 shadow-[2px_2px_0_rgba(43,27,78,0.12)]"
          >
            <X size={18} />
          </button>
        </div>
        <div onSubmit={() => setOpen(false)}>{children}</div>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setOpen(true)}>
        {trigger}
      </button>
      {open ? createPortal(overlay, document.body) : null}
    </>
  );
}
