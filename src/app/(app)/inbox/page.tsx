import Link from "next/link";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/panel";
import { IntentBadge, MessageStatusBadge, PriorityBadge, RiskBadge } from "@/components/ui/status";
import { listMessages } from "@/server/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = ["ALL", "NEEDS_REVIEW", "PROCESSED", "ESCALATED"] as const;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status ?? "ALL").toUpperCase();
  const q = sp.q?.trim() ?? "";

  const messages = await listMessages({
    status:
      status !== "ALL" && ["RECEIVED", "PROCESSED", "NEEDS_REVIEW", "ESCALATED", "FAILED"].includes(status)
        ? (status as never)
        : undefined,
    q: q || undefined,
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Queue</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Inbox</h1>
        </div>
        <form action="/inbox" className="flex items-center gap-2">
          <input type="hidden" name="status" value={status === "ALL" ? "" : status} />
          <label htmlFor="q" className="sr-only">
            Search messages
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search sender, subject, body"
            className="h-9 w-56 rounded-md border border-line-2 bg-surface px-3 text-sm text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          />
          <button
            type="submit"
            className="h-9 rounded-md border border-line-2 bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Search
          </button>
        </form>
      </header>

      <div className="flex flex-wrap items-center gap-1">
        {FILTERS.map((filter) => {
          const active = status === filter;
          const href =
            filter === "ALL"
              ? `/inbox${q ? `?q=${encodeURIComponent(q)}` : ""}`
              : `/inbox?status=${filter}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
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
        <span className="tnum ml-auto text-xs text-ink-3">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <Panel>
        <PanelHeader title="Messages" hint={q ? `matching "${q}"` : undefined} />
        {messages.length === 0 ? (
          <EmptyState
            title="No messages match this view"
            body="Adjust the filter or send a message through the intake console."
            action={
              <Link
                href="/intake"
                className="mt-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-on-brand hover:bg-brand-strong"
              >
                New message
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  <th className="px-4 py-2 font-medium">From</th>
                  <th className="px-4 py-2 font-medium">Subject</th>
                  <th className="px-4 py-2 font-medium">Intent</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 font-medium">Risk</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr
                    key={message.id}
                    className="border-b border-line last:border-b-0 transition-colors hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/inbox/${message.id}`} className="block">
                        <span className="font-medium text-ink hover:text-brand-strong">
                          {message.senderName}
                        </span>
                        <span className="block text-[13px] text-ink-2">{message.company ?? ""}</span>
                      </Link>
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-ink-2">
                      {message.subject ?? message.body.slice(0, 60)}
                    </td>
                    <td className="px-4 py-3">
                      <IntentBadge value={message.intent} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge value={message.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge value={message.risk} />
                    </td>
                    <td className="px-4 py-3">
                      <MessageStatusBadge value={message.status} />
                    </td>
                    <td className="tnum px-4 py-3 text-right text-ink-3">
                      {formatDateTime(message.createdAt)}
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
