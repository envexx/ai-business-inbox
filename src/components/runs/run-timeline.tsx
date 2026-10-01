import { formatClock } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  id: string;
  seq: number;
  name: string;
  status: string;
  detail: string | null;
  createdAt: Date;
  ms: number | null;
}

const markClass: Record<string, string> = {
  OK: "border-ok/50 bg-ok/15 text-ok",
  WARN: "border-warn/50 bg-warn/15 text-warn",
  ERROR: "border-danger/50 bg-danger/15 text-danger",
};

const glyph: Record<string, string> = { OK: "check", WARN: "!", ERROR: "x" };

export function RunTimeline({ steps, dense = false }: { steps: TimelineStep[]; dense?: boolean }) {
  if (steps.length === 0) {
    return <p className="px-4 py-6 text-sm text-ink-2">No steps recorded for this run yet.</p>;
  }

  return (
    <ol className={cn("relative", dense ? "py-1" : "py-2")}>
      {steps.map((step, i) => (
        <li key={step.id} className="relative flex gap-3 pl-4 pr-4">
          {i < steps.length - 1 ? (
            <span aria-hidden="true" className="absolute left-[26px] top-7 h-full w-px bg-line" />
          ) : null}
          <span
            className={cn(
              "relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] leading-none",
              markClass[step.status] ?? markClass.OK,
            )}
            title={step.status}
          >
            {glyph[step.status] ?? "-"}
          </span>
          <div className="min-w-0 flex-1 pb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-ink">{step.name}</p>
              <span className="tnum text-[11px] text-ink-3">
                {formatClock(step.createdAt)}
                {step.ms !== null ? ` +${step.ms}ms` : ""}
              </span>
            </div>
            {step.detail ? (
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{step.detail}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
