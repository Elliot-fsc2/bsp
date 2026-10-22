import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="bloom-card max-w-md p-8 text-center">
        <p className="text-5xl">⚜️</p>
        <h1 className="font-display mt-3 text-3xl">This trail goes off the map</h1>
        <p className="mt-2 text-[var(--muted)]">We couldn&apos;t find that page. Handa suggests heading back to the dashboard.</p>
        <Link href="/dashboard" className="bloom-btn mt-5">
          Back to the portal
        </Link>
      </div>
    </div>
  );
}
