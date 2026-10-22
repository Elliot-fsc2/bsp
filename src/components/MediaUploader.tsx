"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

export async function uploadFile(file: File): Promise<{ url: string; type: "video" | "image" }> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  const data = (await response.json()) as { url?: string; type?: "video" | "image"; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return { url: data.url, type: data.type ?? "image" };
}

export function MediaUploader({
  label,
  accept = "image/*,video/*",
  onUploaded,
}: {
  label: string;
  accept?: string;
  onUploaded: (url: string, type: "video" | "image") => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button type="button" className="bloom-btn secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
        {busy ? "Uploading…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const result = await uploadFile(file);
            onUploaded(result.url, result.type);
          } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {error ? <p className="mt-1 text-sm font-bold text-[#c9184a]">{error}</p> : null}
    </div>
  );
}
