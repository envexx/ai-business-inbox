import * as React from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-surface", className)}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  hint,
  action,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b border-line px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          {title}
        </h2>
        {hint ? <p className="mt-0.5 truncate text-sm text-ink-2">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function PanelBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-line-2 bg-surface-2/40 px-4 py-8">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="max-w-prose text-sm text-ink-2">{body}</p>
      {action}
    </div>
  );
}
