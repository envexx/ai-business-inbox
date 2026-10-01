import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-start justify-center gap-3 px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">404</p>
      <h1 className="text-2xl font-semibold text-ink">That record does not exist</h1>
      <p className="text-sm text-ink-2">
        The lead or run you asked for is not in the database. It may have been removed.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-on-accent hover:bg-accent-strong"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
