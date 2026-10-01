import Link from "next/link";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/panel";
import { IntentBadge, PriorityBadge, RiskBadge } from "@/components/ui/status";
import { listDecisions } from "@/server/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const decisions = await listDecisions();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Transparency</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">AI decisions</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          What the system read, how confident it was, which policy applied, and the reason behind the
          routing.
        </p>
      </header>

      {decisions.length === 0 ? (
        <Panel>
          <EmptyState title="No decisions recorded" body="Process a message to create the first decision record." />
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {decisions.map((decision) => {
            const signals = Array.isArray(decision.signals) ? (decision.signals as string[]) : [];
            return (
              <Panel key={decision.id} className="flex flex-col">
                <PanelHeader
                  title={
                    <Link href={`/inbox/${decision.message.id}`} className="hover:text-brand-strong">
                      {decision.message.senderName}
                    </Link>
                  }
                  hint={formatDateTime(decision.createdAt)}
                  action={<RiskBadge value={decision.risk} />}
                />
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <IntentBadge value={decision.intent} />
                    <PriorityBadge value={decision.priority} />
                    <span className="tnum text-[12px] text-ink-3">
                      confidence {Math.round(decision.confidence * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Input</p>
                    <p className="mt-1 text-[13px] text-ink-2">{decision.summary}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Policy</p>
                    <p className="mt-1 text-[13px] text-ink-2">{decision.policy}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Reason</p>
                    <p className="mt-1 text-[13px] text-ink-2">{decision.reasoning}</p>
                  </div>
                  {signals.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {signals.map((signal) => (
                        <li
                          key={signal}
                          className="rounded border border-line-2 bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2"
                        >
                          {signal}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
