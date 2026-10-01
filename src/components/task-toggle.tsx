"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

export function TaskToggle({
  taskId,
  done,
  title,
}: {
  taskId: string;
  done: boolean;
  title: string;
}) {
  const router = useRouter();
  const [checked, setChecked] = React.useState(done);
  const [pending, setPending] = React.useState(false);

  async function update(next: boolean) {
    setChecked(next);
    setPending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next ? "DONE" : "OPEN" }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } catch {
      setChecked(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <Switch
        checked={checked}
        disabled={pending}
        onCheckedChange={update}
        id={`task-${taskId}`}
        aria-label={`Mark ${title} as ${checked ? "open" : "done"}`}
      />
      <label
        htmlFor={`task-${taskId}`}
        className={checked ? "cursor-pointer text-sm text-ink-3 line-through" : "cursor-pointer text-sm text-ink"}
      >
        {title}
      </label>
    </div>
  );
}
