export function isFacebookUrl(value: string): boolean {
  return /^https?:\/\/(www\.)?facebook\.com\//i.test(value);
}

export function FacebookButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{ color: "#ffffff" }}
      className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f5fc4]"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" className="shrink-0">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.25 10.44 22v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22C18.34 21.25 22 17.08 22 12.06Z" />
      </svg>
      Facebook
    </a>
  );
}
