"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CloudUpload, Loader2 } from "lucide-react";

export type UploadResult = {
  url: string;
  type: "video" | "image";
  driveFileId?: string;
  storage: "drive" | "server";
  sharedWith?: "council" | "link" | "private";
};

function kindOf(file: File): "video" | "image" {
  return file.type.startsWith("video") ? "video" : "image";
}

async function startSession(file: File, accessToken: string, folderId: string | null) {
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.type || "application/octet-stream",
        "X-Upload-Content-Length": String(file.size),
      },
      body: JSON.stringify({ name: file.name, ...(folderId ? { parents: [folderId] } : {}) }),
    },
  );
  if (!response.ok) throw new Error("Google would not start the upload.");
  const location = response.headers.get("Location");
  if (!location) throw new Error("Google did not return an upload link.");
  return location;
}

function sendBytes(location: string, file: File, onProgress: (percent: number) => void) {
  return new Promise<{ id: string; webViewLink?: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", location, true);
    request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error("Google refused the file."));
        return;
      }
      try {
        resolve(JSON.parse(request.responseText) as { id: string; webViewLink?: string });
      } catch {
        reject(new Error("Google sent an unexpected reply."));
      }
    };
    request.onerror = () => reject(new Error("The upload to Google was interrupted."));
    request.send(file);
  });
}

export function DriveUploader({
  label,
  accept = "video/*,image/*",
  onUploaded,
}: {
  label: string;
  accept?: string;
  onUploaded: (result: UploadResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [needsConnect, setNeedsConnect] = useState(false);

  return (
    <div>
      <button type="button" className="bloom-btn" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="animate-spin" size={16} /> : <CloudUpload size={16} />}
        {busy ? `Sending to your Drive… ${percent}%` : label}
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
          setNeedsConnect(false);
          setPercent(0);
          try {
            const tokenResponse = await fetch("/api/google/token", { method: "POST" });
            const token = (await tokenResponse.json()) as {
              accessToken?: string;
              folderId?: string | null;
              error?: string;
              reason?: string;
            };
            if (!tokenResponse.ok || !token.accessToken) {
              setNeedsConnect(token.reason === "not-connected" || token.reason === "expired");
              throw new Error(token.error ?? "Google Drive is not available right now.");
            }

            const location = await startSession(file, token.accessToken, token.folderId ?? null);
            const meta = await sendBytes(location, file, setPercent);

            const shared = await fetch("/api/google/share", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileId: meta.id }),
            });
            const share = shared.ok
              ? ((await shared.json()) as { url?: string; mode?: "council" | "link" | "private" })
              : ({ url: meta.webViewLink } as { url?: string; mode?: "council" | "link" | "private" });

            onUploaded({
              url: share.url ?? meta.webViewLink ?? `https://drive.google.com/file/d/${meta.id}/view`,
              type: kindOf(file),
              driveFileId: meta.id,
              storage: "drive",
              sharedWith: share.mode,
            });
          } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "The upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <p className="mt-1 text-xs text-[var(--muted)]">
        The file goes straight from this device to Google Drive — it is not stored on the council server.
      </p>
      {error ? (
        <p className="mt-1 text-sm font-bold text-[#c9184a]">
          {error}{" "}
          {needsConnect ? (
            <Link href="/profile" className="underline">
              Connect Google Drive →
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
