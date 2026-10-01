import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "hot" | "warm" | "cold" | "ok" | "warn" | "danger" | "accent";

const toneClass: Record<Tone, string> = {
  neutral: "border-line-2 bg-surface-2 text-ink-2",
  hot: "border-hot/35 bg-hot/12 text-hot",
  warm: "border-warm/35 bg-warm/12 text-warm",
  cold: "border-cold/35 bg-cold/12 text-cold",
  ok: "border-ok/35 bg-ok/12 text-ok",
  warn: "border-warn/35 bg-warn/12 text-warn",
  danger: "border-danger/35 bg-danger/12 text-danger",
  accent: "border-accent/40 bg-accent-soft text-accent-strong",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em]",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === "HOT" ? "hot" : status === "WARM" ? "warm" : status === "COLD" ? "cold" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function RunStatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    COMPLETED: "ok",
    NEEDS_REVIEW: "warn",
    FAILED: "danger",
    RUNNING: "accent",
    PENDING: "neutral",
  };
  const label = status.replace(/_/g, " ");
  return <Badge tone={map[status] ?? "neutral"}>{label}</Badge>;
}

export { toneClass };
