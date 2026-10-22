const TAG_RE = /<\/?[a-z][\s\S]*>/i;

export function isRichHtml(value: string | null | undefined) {
  return Boolean(value && TAG_RE.test(value));
}

/** Light, dependency-free sanitizer for the HTML TinyMCE produces. */
export function sanitizeHtml(html: string) {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|link|form|input|button)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*"?\s*javascript:[^">]*"?/gi, '$1="#"')
    .replace(/(<\s*a\b[^>]*?)target\s*=\s*["']_blank["']/gi, '$1target="_blank" rel="noopener noreferrer"');
}

/** Normalize TinyMCE output: keeps markup, drops "empty" editors that only hold <p><br></p>. */
export function normalizeRich(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  return toPlainText(raw) ? raw : "";
}

/** Turn rich HTML into a single-line preview string. */
export function toPlainText(value: string | null | undefined) {
  if (!value) return "";
  return sanitizeHtml(value)
    .replace(/<\s*(br|\/p|\/li|\/div|\/h[1-6])\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain seed text becomes safe paragraphs; TinyMCE HTML is sanitized and passed through. */
export function toSafeHtml(value: string | null | undefined) {
  if (!value) return "";
  if (isRichHtml(value)) return sanitizeHtml(value);
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br />").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}
