"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, FileImage, ImagePlus, RotateCcw } from "lucide-react";
import type { BrandAssetKind } from "@/lib/branding";

type Asset = { kind: BrandAssetKind; title: string; hint: string; accept: string; filename: string | null };

export function BrandingUploads({
  logoFilename,
  faviconFilename,
}: {
  logoFilename: string | null;
  faviconFilename: string | null;
}) {
  const router = useRouter();
  const [filenames, setFilenames] = useState<Record<BrandAssetKind, string | null>>({ logo: logoFilename, icon: faviconFilename });
  const [versions, setVersions] = useState<Record<BrandAssetKind, string>>({ logo: logoFilename ?? "default", icon: faviconFilename ?? "default" });
  const [busy, setBusy] = useState<BrandAssetKind | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const assets: Asset[] = [
    {
      kind: "logo",
      title: "Site logo",
      hint: "Shown in the navigation, login, and public site. PNG, JPG or WEBP · up to 4 MB.",
      accept: "image/png,image/jpeg,image/webp",
      filename: filenames.logo,
    },
    {
      kind: "icon",
      title: "Browser tab icon",
      hint: "Shown in the browser tab. PNG, JPG or WEBP (up to 4 MB) are optimized automatically; ICO up to 1 MB.",
      accept: "image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico",
      filename: filenames.icon,
    },
  ];

  async function upload(kind: BrandAssetKind, file: File) {
    setBusy(kind);
    setError("");
    setNotice("");
    const form = new FormData();
    form.set("kind", kind);
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/branding", { method: "POST", body: form });
      const data = (await response.json()) as { error?: string; filename?: string };
      if (!response.ok || !data.filename) {
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      setFilenames((current) => ({ ...current, [kind]: data.filename ?? null }));
      setVersions((current) => ({ ...current, [kind]: String(Date.now()) }));
      setNotice(`${kind === "logo" ? "Site logo" : "Browser tab icon"} updated. Refresh the tab to see your new icon.`);
      router.refresh();
    } catch {
      setError("Upload failed. Please check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function restore(kind: BrandAssetKind) {
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/branding", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not restore the default image.");
        return;
      }
      setFilenames((current) => ({ ...current, [kind]: null }));
      setVersions((current) => ({ ...current, [kind]: String(Date.now()) }));
      setNotice("Default DeMolay mark restored.");
      router.refresh();
    } catch {
      setError("Could not restore the default image.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {assets.map((asset) => (
        <div key={asset.kind} className="rounded-[22px] border border-[#d9e3f2] bg-[#F7F9FD] p-4">
          <div className="flex items-center gap-3">
            <span className={`grid shrink-0 place-items-center overflow-hidden border border-[#d9e3f2] bg-white shadow-sm ${asset.kind === "logo" ? "h-16 w-16 rounded-2xl" : "h-14 w-14 rounded-xl"}`}>
              <img
                src={`/api/branding/${asset.kind}?v=${versions[asset.kind]}`}
                alt={`Current ${asset.title.toLowerCase()}`}
                className={`object-contain ${asset.kind === "logo" ? "h-14 w-14" : "h-10 w-10"}`}
              />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#1B365F]">{asset.title}</p>
              <p className="mt-0.5 text-xs font-medium text-[#5F7087]">
                {asset.filename ? <span className="inline-flex items-center gap-1 text-[#00694B]"><Check size={12} /> Custom image active</span> : "Default DeMolay mark"}
              </p>
            </div>
          </div>
          <p className="mt-4 min-h-12 text-xs leading-5 text-[#5F7087]">{asset.hint}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1E4488] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1B365F] ${busy ? "pointer-events-none opacity-60" : ""}`}>
              <ImagePlus size={15} /> {busy === asset.kind ? "Uploading…" : asset.filename ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept={asset.accept}
                className="sr-only"
                disabled={busy !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(asset.kind, file);
                  event.target.value = "";
                }}
              />
            </label>
            {asset.filename ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e3f2] px-3.5 py-2.5 text-xs font-semibold text-[#1E4488] transition hover:bg-white disabled:opacity-50"
                disabled={busy !== null}
                onClick={() => void restore(asset.kind)}
              >
                <RotateCcw size={14} /> Use default
              </button>
            ) : null}
          </div>
        </div>
      ))}
      <div className="md:col-span-2">
        {notice ? <p role="status" className="text-sm text-[#00694B]">{notice}</p> : null}
        {error ? <p role="alert" className="flex items-center gap-2 text-sm text-[#AC242A]"><FileImage size={16} />{error}</p> : null}
      </div>
    </div>
  );
}
