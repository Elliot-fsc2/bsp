import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#1B365F] px-6 text-[#F7F9FD]">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-[#FFCF00]">Missing trail</p>
        <h1 className="mt-3 font-serif text-4xl">This page is not on the pathway</h1>
        <Link href="/" className="btn btn-gold mt-8">
          Return home
        </Link>
      </div>
    </main>
  );
}
