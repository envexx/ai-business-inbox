import { Panel, PanelHeader } from "@/components/ui/panel";
import { getAnalytics } from "@/server/queries";

export const dynamic = "force-dynamic";

function BarList({
  title,
  rows,
  tone = "accent",
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  tone?: "accent" | "hot";
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const barColor = tone === "hot" ? "bg-hot" : "bg-accent";

  return (
    <Panel>
      <PanelHeader title={title} hint={`${total} total`} />
      <ul className="flex flex-col gap-3 p-4">
        {rows.length === 0 ? <li className="text-sm text-ink-2">No data.</li> : null}
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3">
            <span className="w-36 shrink-0 truncate text-[13px] text-ink-2">
              {row.label.replace(/_/g, " ")}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span
                className={`block h-full rounded-full ${barColor}`}
                style={{ width: `${Math.round((row.value / max) * 100)}%` }}
              />
            </span>
            <span className="tnum w-8 shrink-0 text-right text-[13px] text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default async function AnalyticsPage() {
  const { byIntent, byStatus, byPriority, byDepartment, days } = await getAnalytics();

  const intentRows = byIntent
    .map((r) => ({ label: r.intent ?? "unclassified", value: r._count._all }))
    .sort((a, b) => b.value - a.value);
  const statusRows = byStatus.map((r) => ({ label: r.status, value: r._count._all }));
  const priorityRows = byPriority
    .map((r) => ({ label: r.priority ?? "unknown", value: r._count._all }))
    .sort((a, b) => b.value - a.value);
  const departmentRows = byDepartment
    .map((r) => ({ label: r.department, value: r._count._all }))
    .sort((a, b) => b.value - a.value);

  const maxDay = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Measurement</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-2">
          Volume and routing across the pipeline. Counts come straight from the database.
        </p>
      </header>

      <Panel>
        <PanelHeader title="Volume, last 14 days" hint="total messages per day" />
        <div className="p-4">
          <div className="flex h-40 items-end gap-2">
            {days.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end">
                  <div
                    className="w-full rounded-t bg-accent/80"
                    style={{ height: `${Math.round((day.total / maxDay) * 100)}%` }}
                    title={`${day.day}: ${day.total} messages`}
                  />
                </div>
                <span className="tnum text-[10px] text-ink-3">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="By intent" rows={intentRows} />
        <BarList title="By priority" rows={priorityRows} tone="hot" />
        <BarList title="By status" rows={statusRows} />
        <BarList title="Tasks by department" rows={departmentRows} />
      </div>
    </div>
  );
}
