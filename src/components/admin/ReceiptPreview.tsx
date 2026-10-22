"use client";

import { useEffect, useState } from "react";
import { FileText, X, ZoomIn } from "lucide-react";

const IMAGE_PATTERN = /\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i;

export function ReceiptPreview({ path, label = "Receipt" }: { path: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const isImage = IMAGE_PATTERN.test(path);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${label}`}
        title={`View ${label}`}
        className="group relative block h-14 w-14 overflow-hidden rounded-xl border border-[#dce5f1] bg-[#EAF1F9]"
      >
        {isImage ? (
          <img src={path} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[#1E4488]">
            <FileText size={20} />
          </span>
        )}
        <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition group-hover:bg-[#0b1f3a]/45 group-hover:opacity-100">
          <ZoomIn size={16} />
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#0b1f3a]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#1B365F]/10 px-5 py-3">
              <p className="text-sm font-semibold text-[#1B365F]">{label}</p>
              <div className="flex items-center gap-2">
                <a
                  href={path}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#0076AF] hover:underline"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full bg-[#F3F6FA] text-[#6b7280] hover:bg-[#e9edf5]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[#F5F7FB] p-3">
              {isImage ? (
                <img src={path} alt={label} className="mx-auto max-h-[78vh] w-auto rounded-2xl object-contain" />
              ) : (
                <iframe src={path} title={label} className="h-[80vh] w-full rounded-2xl bg-white" />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
