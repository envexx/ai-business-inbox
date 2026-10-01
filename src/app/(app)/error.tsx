"use client";

import * as React from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-line bg-surface p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Error</p>
      <h1 className="mt-1 text-xl font-semibold text-ink">This view could not load</h1>
      <p className="mt-2 text-sm text-ink-2">
        {error.message || "An unexpected error occurred while reading data."} The most likely cause
        is that the database is unreachable or has not been initialized yet.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-on-brand hover:bg-brand-strong"
        >
          Try again
        </button>
        <Link
          href="/intake"
          className="rounded-md border border-line-2 px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          Open intake console
        </Link>
      </div>
    </div>
  );
}
