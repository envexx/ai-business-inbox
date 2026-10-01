import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ActionRecord {
  id: string;
  type: string;
  status: string;
  risk: string;
  title: string;
  detail: string | null;
  mode: string | null;
}

const statusTone: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  DONE: "ok",
  PENDING: "warn",
  FAILED: "danger",
  SKIPPED: "neutral",
};

const riskTone: Record<string, "neutral" | "warm" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "warm",
  HIGH: "danger",
};

export function ActionList({ actions }: { actions: ActionRecord[] }) {
  if (actions.length === 0) {
    return <p className="px-4 py-6 text-sm text-ink-2">No actions recorded.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {actions.map((action) => (
        <li key={action.id} className="flex items-start gap-3 px-4 py-3">
          <span
            aria-hidden="true"
            className={cn(
              "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
              action.status === "DONE"
                ? "bg-ok"
                : action.status === "PENDING"
                  ? "bg-warn"
                  : action.status === "FAILED"
                    ? "bg-danger"
                    : "bg-ink-3",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-ink">{action.title}</p>
              <Badge tone={statusTone[action.status] ?? "neutral"}>{action.status}</Badge>
              <Badge tone={riskTone[action.risk] ?? "neutral"}>{action.risk} risk</Badge>
              {action.mode ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  {action.mode}
                </span>
              ) : null}
            </div>
            {action.detail ? (
              <p className="mt-0.5 text-[13px] text-ink-2">{action.detail}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
