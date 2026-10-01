import Link from "next/link";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/panel";
import { ApprovalActions } from "@/components/approval-actions";
import { ApprovalBadge, IntentBadge, RiskBadge } from "@/components/ui/status";
import { listApprovals } from "@/server/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const approvals = await listApprovals();
  const pending = approvals.filter((a) => a.status === "PENDING");
  const resolved = approvals.filter((a) => a.status !== "PENDING");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Human in the loop</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Approvals</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          High risk work is held here. Nothing is sent until a person approves it.
        </p>
      </header>

      <Panel className="overflow-hidden">
        <PanelHeader title="Pending" hint={`${pending.length} waiting`} />
        {pending.length === 0 ? (
          <EmptyState title="No approvals pending" body="Every high risk message has been resolved." />
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((approval) => (
              <li key={approval.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1.6fr_1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/inbox/${approval.message.id}`}
                      className="text-sm font-semibold text-ink hover:text-accent-strong"
                    >
                      {approval.message.senderName}
                    </Link>
                    <IntentBadge value={approval.message.intent} />
                    <RiskBadge value={approval.risk} />
                    <span className="tnum ml-auto text-[11px] text-ink-3">
                      {formatDateTime(approval.requestedAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-2">{approval.reason}</p>
                  {approval.draftBody ? (
                    <div className="mt-3 rounded-md border border-line-2 bg-surface-2/50 p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        Drafted reply
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
                        {approval.draftBody}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="lg:pl-4">
                  <ApprovalActions approvalId={approval.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader title="Resolved" hint={`${resolved.length} decided`} />
        {resolved.length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-2">No decisions recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {resolved.map((approval) => (
              <li key={approval.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <ApprovalBadge value={approval.status} />
                <Link
                  href={`/inbox/${approval.message.id}`}
                  className="text-sm text-ink hover:text-accent-strong"
                >
                  {approval.message.senderName}
                </Link>
                <span className="text-[13px] text-ink-3">{approval.reason}</span>
                <span className="tnum ml-auto text-[11px] text-ink-3">
                  {approval.decidedAt ? formatDateTime(approval.decidedAt) : ""}
                  {approval.decidedBy ? ` - ${approval.decidedBy}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
