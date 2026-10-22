import { ExternalLink } from "lucide-react";
import { RichText } from "@/components/RichText";
import type { QuizQuestion } from "@/lib/types";

export type SubmissionAnswer = {
  textContent: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  externalUrl: string | null;
  driveFileId: string | null;
  driveUrl: string | null;
  driveSharedWith?: string | null;
  storageProvider: string | null;
  quizJson: string | null;
  quizScore: number | null;
};

function parseAnswers(value: string | null): number[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as number[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * One place that renders every kind of answer a Scout can submit: written
 * answers, uploaded or recorded proof, a Drive file, a Drive link, and quiz
 * answers. Used by the approval queue and the review page.
 */
export function SubmissionResponses({
  answer,
  questions = [],
  compact = false,
}: {
  answer: SubmissionAnswer;
  questions?: QuizQuestion[];
  compact?: boolean;
}) {
  const quizAnswers = parseAnswers(answer.quizJson) ?? [];
  const driveId = answer.driveFileId;
  const driveLink = answer.driveUrl ?? (driveId ? `https://drive.google.com/file/d/${driveId}/view` : null);
  const isVideo = answer.mediaType === "video";
  const mediaBox = compact ? "max-h-64" : "max-h-[26rem]";
  const hasSomething =
    Boolean(answer.textContent) ||
    Boolean(answer.mediaUrl) ||
    Boolean(driveId) ||
    Boolean(answer.externalUrl) ||
    questions.length > 0;

  if (!hasSomething) {
    return <p className="text-sm text-[var(--muted)]">No answer was attached to this task.</p>;
  }

  return (
    <div className="space-y-3">
      {driveId ? (
        <div>
          <p className="mb-1 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
            {isVideo ? "Video proof" : "Photo proof"} · Google Drive
          </p>
          {isVideo ? (
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview`}
              className="aspect-video w-full rounded-xl"
              allow="autoplay"
              title="Submitted proof"
            />
          ) : (
            <img
              src={`https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`}
              alt="Submitted proof"
              className={`${mediaBox} rounded-xl bg-white`}
            />
          )}
          {driveLink ? (
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-extrabold text-[var(--secondary)] underline"
            >
              Open in Google Drive <ExternalLink size={14} />
            </a>
          ) : null}
          {answer.driveSharedWith === "council" ? (
            <p className="mt-1 text-xs font-bold text-[var(--muted)]">
              Shared with the connected Scout Leader and Council Admin Google accounts.
            </p>
          ) : answer.driveSharedWith === "link" ? (
            <p className="mt-1 text-xs font-bold text-[#c9184a]">
              No reviewer had connected Google Drive yet, so this file is shared as an unlisted link.
            </p>
          ) : null}
        </div>
      ) : answer.mediaUrl ? (
        <div>
          <p className="mb-1 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
            {isVideo ? "Video proof" : "Photo proof"}
          </p>
          {isVideo ? (
            <video src={answer.mediaUrl} controls className="w-full rounded-xl" />
          ) : (
            <img src={answer.mediaUrl} alt="Submitted proof" className={`${mediaBox} rounded-xl`} />
          )}
        </div>
      ) : null}

      {answer.textContent ? (
        <div>
          <p className="mb-1 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">Written answer</p>
          <RichText value={answer.textContent} compact />
        </div>
      ) : null}

      {questions.length ? (
        <div>
          <p className="mb-1 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
            Quiz answers{answer.quizScore !== null ? ` · ${answer.quizScore}%` : ""}
          </p>
          <div className="space-y-2">
            {questions.map((question, index) => {
              const picked = quizAnswers[index];
              const correct = picked === question.answer;
              return (
                <div key={question.q} className="rounded-xl bg-white/70 p-3">
                  <p className="text-sm font-bold">{question.q}</p>
                  <p className={`text-sm ${correct ? "text-[#2d6a4f]" : "text-[#c9184a]"}`}>
                    {correct ? "✓" : "✗"} Answered: {question.options[picked] ?? "—"}
                  </p>
                  {correct ? null : (
                    <p className="text-xs text-[var(--muted)]">Correct: {question.options[question.answer]}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {answer.externalUrl ? (
        <div>
          <p className="mb-1 text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">Attached link</p>
          <a
            href={answer.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 break-all text-sm font-extrabold text-[var(--secondary)] underline"
          >
            {answer.externalUrl} <ExternalLink size={14} />
          </a>
        </div>
      ) : null}
    </div>
  );
}
