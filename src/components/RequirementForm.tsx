"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitRequirementAction } from "@/actions/advancement";
import { DriveUploader } from "@/components/DriveUploader";
import { MediaUploader } from "@/components/MediaUploader";
import { RichTextEditor } from "@/components/RichTextEditor";
import { SubmissionResponses } from "@/components/SubmissionResponses";
import { VideoRecorder } from "@/components/VideoRecorder";
import type { QuizQuestion } from "@/lib/types";

type Media = {
  url: string;
  type: string;
  driveFileId?: string;
  storage: "drive" | "server";
  sharedWith?: string;
};

export function RequirementForm({
  requirementId,
  questions,
  requiresText,
  requiresMedia,
  mediaKind,
  requiresLink,
  existing,
  driveReady,
  driveAvailable,
}: {
  requirementId: number;
  questions: QuizQuestion[];
  requiresText: boolean;
  requiresMedia: boolean;
  mediaKind: string;
  requiresLink: boolean;
  existing: {
    textContent: string;
    mediaUrl: string | null;
    mediaType: string | null;
    externalUrl: string | null;
    driveFileId: string | null;
    driveSharedWith: string | null;
    quizAnswers: number[] | null;
  } | null;
  driveReady: boolean;
  driveAvailable: boolean;
}) {
  const action = submitRequirementAction.bind(null, requirementId);
  const [state, formAction, pending] = useActionState(action, { error: "", ok: false });
  const [media, setMedia] = useState<Media | null>(
    existing?.mediaUrl
      ? {
          url: existing.mediaUrl,
          type: existing.mediaType ?? mediaKind,
          driveFileId: existing.driveFileId ?? undefined,
          storage: existing.driveFileId ? "drive" : "server",
          sharedWith: existing.driveSharedWith ?? undefined,
        }
      : null,
  );

  const quizAnswers = existing?.quizAnswers ?? [];
  const mediaLabel = mediaKind === "video" ? "Upload a video to your Drive" : "Upload a photo to your Drive";

  return (
    <form action={formAction} className="space-y-5">
      {questions.length ? (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <fieldset key={question.q} className="rounded-2xl bg-white/80 p-4">
              <legend className="font-extrabold">
                {index + 1}. {question.q}
              </legend>
              <div className="mt-2 space-y-1">
                {question.options.map((option, optionIndex) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`quiz-${index}`}
                      value={optionIndex}
                      defaultChecked={quizAnswers[index] === optionIndex}
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      {requiresText ? (
        <div>
          <span className="mb-1 block text-sm font-extrabold">
            {questions.length ? "Your explanation" : "Your answer"}
          </span>
          <RichTextEditor
            name="textContent"
            defaultValue={existing?.textContent ?? ""}
            minHeight={180}
            placeholder="Write your answer. You can add images and video links with the toolbar."
          />
        </div>
      ) : (
        <input type="hidden" name="textContent" value={existing?.textContent ?? ""} />
      )}

      {requiresMedia ? (
        <div className="space-y-3">
          <span className="block text-sm font-extrabold">{mediaKind === "video" ? "Video proof" : "Photo proof"}</span>
          <div className="flex flex-wrap gap-3">
            {mediaKind === "video" ? (
              <VideoRecorder onUploaded={(url, type) => setMedia({ url, type, storage: "server" })} />
            ) : null}
            {driveReady ? (
              <DriveUploader
                label={mediaLabel}
                accept={mediaKind === "video" ? "video/*" : "image/*"}
                onUploaded={(result) =>
                  setMedia({
                    url: result.url,
                    type: result.type,
                    driveFileId: result.driveFileId,
                    storage: "drive",
                    sharedWith: result.sharedWith,
                  })
                }
              />
            ) : null}
            <MediaUploader
              label={mediaKind === "video" ? "Upload to the council server" : "Upload to the council server"}
              accept={mediaKind === "video" ? "video/*" : "image/*"}
              onUploaded={(url, type) => setMedia({ url, type, storage: "server" })}
            />
          </div>

          {driveReady ? null : driveAvailable ? (
            <p className="text-xs font-bold text-[var(--muted)]">
              Tip: keep the file off the council server entirely —{" "}
              <Link href="/profile" className="text-[var(--secondary)] underline">
                connect your Google Drive
              </Link>{" "}
              and upload straight there.
            </p>
          ) : null}

          {media ? (
            <div className="mt-1 rounded-2xl bg-white/80 p-3">
              <p className="mb-2 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
                {media.storage === "drive" ? "Attachment · in your Google Drive" : "Attachment · council server"}
              </p>
              <SubmissionResponses
                answer={{
                  textContent: null,
                  mediaUrl: media.url,
                  mediaType: media.type,
                  externalUrl: null,
                  driveFileId: media.driveFileId ?? null,
                  driveUrl: media.driveFileId ? media.url : null,
                  driveSharedWith: media.sharedWith ?? null,
                  storageProvider: media.storage,
                  quizJson: null,
                  quizScore: null,
                }}
              />
              <button
                type="button"
                className="mt-2 text-xs font-extrabold text-[#c9184a]"
                onClick={() => setMedia(null)}
              >
                Remove attachment
              </button>
            </div>
          ) : null}

          <input type="hidden" name="mediaUrl" value={media?.url ?? ""} />
          <input type="hidden" name="mediaType" value={media?.type ?? ""} />
          <input type="hidden" name="driveFileId" value={media?.driveFileId ?? ""} />
          <input type="hidden" name="driveSharedWith" value={media?.sharedWith ?? ""} />
          <input type="hidden" name="storageProvider" value={media?.storage ?? "server"} />
        </div>
      ) : null}

      {requiresLink ? (
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Google Drive link</span>
          <input
            className="bloom-input"
            name="externalUrl"
            type="url"
            placeholder="https://drive.google.com/…"
            defaultValue={existing?.externalUrl ?? ""}
            required
          />
        </label>
      ) : null}

      {state?.error ? (
        <p className="rounded-2xl bg-[#ffe0e8] px-3 py-2 text-sm font-bold">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-2xl bg-[#d8f3dc] px-3 py-2 text-sm font-bold">
          Submitted! A Scout Leader will review it, then a Council Admin confirms it.
        </p>
      ) : null}

      <button className="bloom-btn" disabled={pending}>
        {pending ? "Submitting…" : existing ? "Resubmit for approval" : "Submit for approval"}
      </button>
    </form>
  );
}
