import Link from "next/link";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/status";
import { TaskToggle } from "@/components/task-toggle";
import { listTasks } from "@/server/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = ["OPEN", "DONE"] as const;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status ?? "OPEN").toUpperCase();
  const department = sp.department?.trim() || undefined;

  const tasks = await listTasks({
    status: ["OPEN", "DONE"].includes(status) ? (status as "OPEN" | "DONE") : undefined,
    department,
  });

  const departments = Array.from(new Set(tasks.map((t) => t.department))).sort();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Work</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Tasks</h1>
        <p className="mt-1 text-sm text-ink-2">
          Every message that needs follow-through becomes a task owned by a department.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-1">
        {FILTERS.map((filter) => (
          <Link
            key={filter}
            href={`/tasks?status=${filter}`}
            aria-current={status === filter ? "page" : undefined}
            className={
              status === filter
                ? "rounded-md bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-surface-2/70 hover:text-ink"
            }
          >
            {filter}
          </Link>
        ))}
        <span className="tnum ml-auto text-xs text-ink-3">{tasks.length} tasks</span>
      </div>

      <Panel>
        <PanelHeader title="Task list" hint={department ? `department ${department}` : undefined} />
        {tasks.length === 0 ? (
          <EmptyState title="No tasks here" body="Switch the filter or process a new message." />
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <TaskToggle taskId={task.id} done={task.status === "DONE"} title={task.title} />
                <span className="text-[13px] text-ink-3">
                  <Link href={`/inbox/${task.message.id}`} className="hover:text-accent-strong">
                    {task.message.senderName}
                  </Link>
                  {task.message.company ? ` - ${task.message.company}` : ""}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <Badge tone="neutral">{task.department}</Badge>
                  <PriorityBadge value={task.priority} />
                  <span className="tnum text-[11px] text-ink-3">{formatDateTime(task.dueAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {departments.length > 0 ? (
        <p className="text-xs text-ink-3">Departments in this view: {departments.join(", ")}</p>
      ) : null}
    </div>
  );
}
