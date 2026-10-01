import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { RunStatusBadge } from "@/components/ui/badge";
import { RunTimeline } from "@/components/runs/run-timeline";
import { ActionList } from "@/components/runs/action-list";
import { getRun } from "@/server/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/runs" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 hover:text-ink">
          &larr; Runs
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {run.message ? (
              <Link href={`/inbox/${run.message.id}`} className="hover:text-brand-strong">
                {run.message.senderName}
              </Link>
            ) : (
              "Unlinked run"
            )}
          </h1>
          <RunStatusBadge status={run.status} />
        </div>
        <p className="mt-1 text-sm text-ink-2">
          trigger {run.trigger} - started {formatDateTime(run.startedAt)}
          {run.finishedAt ? ` - finished ${formatDateTime(run.finishedAt)}` : ""}
          {run.engine ? ` - engine ${run.engine}` : ""}
        </p>
      </div>

      {run.summary ? (
        <div className="rounded-lg border border-line bg-surface-2/50 px-4 py-3 text-sm text-ink">
          {run.summary}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader title="Steps" hint={`${run.steps.length} recorded`} />
          <RunTimeline steps={run.steps} />
        </Panel>
        <div className="flex flex-col gap-5">
          <Panel className="overflow-hidden">
            <PanelHeader title="Actions" hint={`${run.actions.length} recorded`} />
            <ActionList actions={run.actions} />
          </Panel>
          <Panel className="overflow-hidden">
            <PanelHeader title="Audit trail" />
            {run.audit.length === 0 ? (
              <p className="px-4 py-5 text-sm text-ink-2">No audit entries.</p>
            ) : (
              <ul className="divide-y divide-line">
                {run.audit.map((entry) => (
                  <li key={entry.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                    <span className="font-mono text-[12px] text-ink">{entry.event}</span>
                    <span className="tnum text-[11px] text-ink-3">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
