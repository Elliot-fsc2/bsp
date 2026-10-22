"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { LessonEditor } from "@/components/LessonEditor";
import { ImagePlus } from "lucide-react";

type LevelOption = { id: number; number: number; name: string };

export function LessonForm({
  levels,
  lesson,
}: {
  levels: LevelOption[];
  lesson?: {
    id: number;
    levelId: number;
    title: string;
    content: string;
    coverFilename: string | null;
    videoUrl: string | null;
    embedCode: string | null;
    sortOrder: number;
    isPublished: boolean;
  };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [levelId, setLevelId] = useState(lesson?.levelId ?? levels[0]?.id ?? 0);
  const [content, setContent] = useState(lesson?.content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [embedCode, setEmbedCode] = useState(lesson?.embedCode ?? "");
  const [sortOrder, setSortOrder] = useState(lesson?.sortOrder ?? 1);
  const [isPublished, setIsPublished] = useState(lesson?.isPublished ?? true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData();
    if (lesson?.id) data.set("id", String(lesson.id));
    data.set("levelId", String(levelId));
    data.set("title", title);
    data.set("content", content);
    data.set("videoUrl", videoUrl);
    data.set("embedCode", embedCode);
    data.set("sortOrder", String(sortOrder));
    data.set("isPublished", String(isPublished));
    if (file) data.set("image", file);

    const response = await fetch("/api/admin/lessons", {
      method: "POST",
      body: data,
    });
    const resData = (await response.json()) as { error?: string; id?: number };
    setPending(false);
    if (!response.ok) {
      setError(resData.error ?? "Could not save lesson.");
      return;
    }
    router.push("/admin/lessons");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Title
          <input className="input mt-2" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label className="text-sm">
          Level
          <select className="input mt-2" value={levelId} onChange={(event) => setLevelId(Number(event.target.value))}>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                Level {level.number}: {level.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Sort order
          <input
            className="input mt-2"
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm pt-6">
          <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
          Published
        </label>
      </div>

      <label className="block text-sm">
        Cover image
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#b9c9e0] bg-[#F5F7FB] px-4 py-3 text-xs font-semibold text-[#1E4488]"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus size={15} /> {file ? file.name : lesson?.coverFilename ? "Change cover image" : "Upload cover image"}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium">TinyMCE lesson body</p>
        <LessonEditor value={content} onChange={setContent} />
      </div>
      <label className="block text-sm">
        Dedicated video URL (YouTube, Vimeo, MP4, Drive)
        <input className="input mt-2" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} />
      </label>
      <label className="block text-sm">
        Dedicated Google Drive / HTML embed code
        <textarea
          className="input mt-2 min-h-[120px] font-mono text-sm"
          value={embedCode}
          onChange={(event) => setEmbedCode(event.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-[#AC242A]">{error}</p> : null}
      <button className="btn btn-dark" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save lesson"}
      </button>
    </form>
  );
}
