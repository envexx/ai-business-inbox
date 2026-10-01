import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/panel";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { RunTimeline } from "@/components/runs/run-timeline";
import { IntentBadge, MessageStatusBadge, PriorityBadge } from "@/components/ui/status";
import { getDashboard } from "@/server/queries";
import { aiConfigured } from "@/core/ai/provider";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { stats, liveQueue, approvals, latestRun } = await getDashboard();
  const engine = aiConfigured() ? "OpenAI live" : "deterministic classifier";
  const hasData = stats.total > 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
            Inbox operations
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Message routing and approvals
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="accent">engine: {engine}</Badge>
          <span className="tnum text-xs text-ink-3">{formatDateTime(new Date())}</span>
        </div>
      </header>

      <StatStrip
        items={[
          { label: "Messages today", value: stats.messagesToday },
          { label: "Auto handled", value: stats.autoHandled, tone: "accent" },
          { label: "Human review", value: stats.humanReview, tone: "hot" },
          { label: "Escalated", value: stats.escalated },
        ]}
      />

      {!hasData ? (
        <EmptyState
          title="No messages have arrived yet"
          body="Send a message through the intake console or the webhook endpoint to watch the classifier, the policy layer, and the approval gate run end to end."
          action={
            <Link
              href="/intake"
              className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-on-accent hover:bg-accent-strong"
            >
              Open intake console
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Live queue"
              hint="latest messages with the decision the system reached"
              action={
                <Link href="/inbox" className="text-[13px] text-accent-strong hover:underline">
                  Open inbox
                </Link>
              }
            />
            <ul className="divide-y divide-line">
              {liveQueue.map((message) => {
                const waiting = message.approvals.length > 0;
                return (
                  <li key={message.id} className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/inbox/${message.id}`}
                        className="text-sm font-semibold text-ink hover:text-accent-strong"
                      >
                        {message.senderName}
                      </Link>
                      <span className="text-[13px] text-ink-3">{message.company ?? ""}</span>
                      <span className="ml-auto flex items-center gap-2">
                        <PriorityBadge value={message.priority} />
                        <MessageStatusBadge value={message.status} />
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[13px] text-ink-2">
                      {message.subject ?? message.body.slice(0, 90)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
                      <IntentBadge value={message.intent} />
                      {message.classification ? (
                        <span>request: {message.classification.request}</span>
                      ) : null}
                      {waiting ? (
                        <span className="text-warn">waiting for human approval</span>
                      ) : (
                        <span className="text-ok">handled automatically</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <div className="flex flex-col gap-6">
            <Panel>
              <PanelHeader
                title="Pending approvals"
                action={
                  <Link href="/approvals" className="text-[13px] text-accent-strong hover:underline">
                    Review all
                  </Link>
                }
              />
              {approvals.length === 0 ? (
                <p className="px-4 py-5 text-sm text-ink-2">Nothing is waiting on a person.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {approvals.map((approval) => (
                    <li key={approval.id} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/inbox/${approval.message.id}`}
                          className="text-sm font-medium text-ink hover:text-accent-strong"
                        >
                          {approval.message.senderName}
                        </Link>
                        <span className="ml-auto text-[11px] text-warn">{approval.risk} risk</span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-ink-2">{approval.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel className="overflow-hidden">
              <PanelHeader
                title="Latest run"
                hint={latestRun?.message ? latestRun.message.senderName : undefined}
                action={
                  latestRun ? (
                    <Link href={`/runs/${latestRun.id}`} className="text-[13px] text-accent-strong hover:underline">
                      Detail
                    </Link>
                  ) : null
                }
              />
              {latestRun ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <RunTimeline steps={latestRun.steps} dense />
                </div>
              ) : (
                <p className="px-4 py-5 text-sm text-ink-2">No runs yet.</p>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
