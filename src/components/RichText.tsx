import { toSafeHtml } from "@/lib/richtext";

export function RichText({
  value,
  className = "",
  compact = false,
}: {
  value: string | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  const html = toSafeHtml(value);
  if (!html.trim()) {
    return <p className={`text-[var(--muted)] ${className}`}>Nothing written yet.</p>;
  }
  const classes = [`rt`, compact ? "rt-compact" : "", className].filter(Boolean).join(" ");
  return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />;
}
