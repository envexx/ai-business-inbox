import Link from "next/link";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/panel";
import { RunStatusBadge } from "@/components/ui/badge";
import { listRuns } from "@/server/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = ["ALL", "COMPLETED", "NEEDS_REVIEW", "FAILED"] as const;

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status ?? "ALL").toUpperCase();
  const runs = await listRuns({
    status:
      status !== "ALL" && ["COMPLETED", "NEEDS_REVIEW", "FAILED", "RUNNING"].includes(status)
        ? (status as never)
        : undefined,
  });

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Audit</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Automation runs</h1>
        <p className="mt-1 text-sm text-ink-2">
          Every pass through the pipeline, with the exact steps it executed.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-1">
        {FILTERS.map((filter) => {
          const active = status === filter;
          const href = filter === "ALL" ? "/runs" : `/runs?status=${filter}`;
          return (
            <Link
              key={filter}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-md bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink"
                  : "rounded-md px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-surface-2/70 hover:text-ink"
              }
            >
              {filter.replace(/_/g, " ")}
            </Link>
          );
        })}
      </div>

      <Panel>
        <PanelHeader title="Run log" hint={`${runs.length} runs`} />
        {runs.length === 0 ? (
          <EmptyState title="No runs in this view" body="Run the automation from a message, or send a new one." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  <th className="px-4 py-2 font-medium">Message</th>
                  <th className="px-4 py-2 font-medium">Trigger</th>
                  <th className="px-4 py-2 font-medium">Decision</th>
                  <th className="px-4 py-2 font-medium">Steps</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-line last:border-b-0 transition-colors hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/runs/${run.id}`} className="font-medium text-ink hover:text-accent-strong">
                        {run.message?.senderName ?? "Unlinked"}
                      </Link>
                      <span className="block text-[13px] text-ink-2">
                        {run.message?.intent?.replace(/_/g, " ") ?? ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-ink-2">{run.trigger}</td>
                    <td className="px-4 py-3 text-ink-2">{run.decision?.replace(/_/g, " ") ?? "-"}</td>
                    <td className="tnum px-4 py-3 text-ink-2">{run._count.steps}</td>
                    <td className="px-4 py-3">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="tnum px-4 py-3 text-right text-ink-3">
                      {formatDateTime(run.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
