import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RunTimeline } from "@/components/runs/run-timeline";
import { ActionList } from "@/components/runs/action-list";
import { IntentBadge, MessageStatusBadge, PriorityBadge, RiskBadge } from "@/components/ui/status";
import { RunButton } from "@/components/run-button";
import { TaskToggle } from "@/components/task-toggle";
import { ApprovalActions } from "@/components/approval-actions";
import { getMessage } from "@/server/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-b-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{label}</dt>
      <dd className="text-right text-sm text-ink">{value}</dd>
    </div>
  );
}

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const message = await getMessage(id);
  if (!message) notFound();

  const pendingApprovals = message.approvals.filter((a) => a.status === "PENDING");
  const signals = Array.isArray(message.classification?.signals)
    ? (message.classification?.signals as string[])
    : [];
  const replyAction = message.actions.find((a) => a.type === "DRAFT_REPLY");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/inbox" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 hover:text-ink">
            &larr; Inbox
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{message.senderName}</h1>
            <MessageStatusBadge value={message.status} />
            <IntentBadge value={message.intent} />
          </div>
          <p className="mt-1 text-sm text-ink-2">
            {message.subject ?? "(no subject)"} - {message.company ?? "Unknown company"} - {message.channel}
          </p>
        </div>
        <RunButton messageId={message.id} label="Re-run automation" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <Tabs defaultValue="understanding">
          <TabsList>
            <TabsTrigger value="understanding">Understanding</TabsTrigger>
            <TabsTrigger value="reply">Reply and actions</TabsTrigger>
            <TabsTrigger value="runs">Runs ({message.runs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="understanding" className="mt-4">
            <Panel>
              <PanelHeader title="AI understanding" hint={message.classification?.engine} />
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <dl className="text-sm">
                  <Fact label="Intent" value={<IntentBadge value={message.intent} />} />
                  <Fact label="Request" value={message.classification?.request ?? "-"} />
                  <Fact label="Priority" value={<PriorityBadge value={message.priority} />} />
                  <Fact label="Sentiment" value={message.sentiment ?? "-"} />
                  <Fact label="Risk" value={<RiskBadge value={message.risk} />} />
                  <Fact
                    label="Confidence"
                    value={message.confidence ? `${Math.round(message.confidence * 100)}%` : "-"}
                  />
                </dl>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                    Signals
                  </p>
                  {signals.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {signals.map((signal) => (
                        <li key={signal} className="flex gap-2 text-sm text-ink-2">
                          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                          {signal}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-ink-2">No structured signals found.</p>
                  )}
                  {message.classification?.policy ? (
                    <div className="mt-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        Policy applied
                      </p>
                      <p className="mt-1 border-l-2 border-line-2 pl-3 text-[13px] text-ink-2">
                        {message.classification.policy}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="border-t border-line px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  Original message
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{message.body}</p>
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="reply" className="mt-4">
            <div className="flex flex-col gap-4">
              <Panel>
                <PanelHeader
                  title={replyAction?.title ?? "No reply drafted"}
                  hint={replyAction?.mode ? `mode ${replyAction.mode}` : undefined}
                  action={
                    replyAction ? (
                      <Badge tone={replyAction.status === "DONE" ? "ok" : "warn"}>
                        {replyAction.status}
                      </Badge>
                    ) : undefined
                  }
                />
                <div className="p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
                    {replyAction?.detail ?? "The pipeline did not draft a reply for this message."}
                  </p>
                </div>
              </Panel>

              <Panel className="overflow-hidden">
                <PanelHeader title="Actions" hint={`${message.actions.length} recorded`} />
                <ActionList actions={message.actions} />
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="runs" className="mt-4">
            <div className="flex flex-col gap-4">
              {message.runs.length === 0 ? (
                <Panel>
                  <p className="px-4 py-6 text-sm text-ink-2">No automation runs yet.</p>
                </Panel>
              ) : (
                message.runs.map((run) => (
                  <Panel key={run.id} className="overflow-hidden">
                    <PanelHeader
                      title={`Run ${run.trigger}`}
                      hint={run.summary ?? undefined}
                      action={
                        <Link href={`/runs/${run.id}`} className="text-[13px] text-brand-strong hover:underline">
                          Detail
                        </Link>
                      }
                    />
                    <RunTimeline steps={run.steps} />
                  </Panel>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-6">
          {pendingApprovals.length > 0 ? (
            <Panel className="border-warn/40">
              <PanelHeader title="Waiting for approval" hint={pendingApprovals[0].reason} />
              <div className="p-4">
                <ApprovalActions approvalId={pendingApprovals[0].id} />
              </div>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Record" />
            <dl className="px-4 py-2">
              <Fact label="Received" value={formatDateTime(message.createdAt)} />
              <Fact label="Email" value={message.senderEmail ?? "-"} />
              <Fact label="Channel" value={message.channel} />
              <Fact label="Human required" value={message.requiresHuman ? "Yes" : "No"} />
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Tasks" />
            {message.tasks.length === 0 ? (
              <p className="px-4 py-5 text-sm text-ink-2">No tasks created.</p>
            ) : (
              <ul className="divide-y divide-line">
                {message.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <TaskToggle taskId={task.id} done={task.status === "DONE"} title={task.title} />
                    <span className="tnum shrink-0 text-[11px] text-ink-3">
                      {formatDateTime(task.dueAt)}
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
