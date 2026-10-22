"use client";

import { useState } from "react";
import { MediaUploader } from "@/components/MediaUploader";

export function ImageUrlField({
  name,
  label,
  defaultValue = "",
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue);

  return (
    <div>
      <span className="mb-1 block text-sm font-extrabold">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-wrap items-center gap-3">
        {url ? (
          <img src={url} alt="" className="h-14 w-14 rounded-2xl bg-white object-contain p-1" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[10px] font-bold text-[var(--muted)]">
            none
          </span>
        )}
        <MediaUploader label="Upload image" accept="image/*" onUploaded={(next) => setUrl(next)} />
        {url ? (
          <button type="button" className="bloom-btn ghost" onClick={() => setUrl("")}>
            Remove
          </button>
        ) : null}
      </div>
      <input
        className="bloom-input mt-2"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={placeholder}
      />
      {hint ? <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span> : null}
    </div>
  );
}
