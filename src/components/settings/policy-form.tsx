"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

export interface PolicyShape {
  autoApproveMaxRefundUsd: number;
  requireApprovalForComplaints: boolean;
  requireApprovalForPartnerships: boolean;
  autoSendFaqReplies: boolean;
  autoArchiveSpam: boolean;
  opsChannel: string;
}

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

export function PolicyForm({ initial }: { initial: PolicyShape }) {
  const router = useRouter();
  const [form, setForm] = React.useState<PolicyShape>(initial);
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });

  function set<K extends keyof PolicyShape>(key: K, value: PolicyShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus({ kind: "idle" });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save policy");
      setStatus({ kind: "saved" });
      router.refresh();
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Save failed" });
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Auto approve refund cap (USD)"
          hint="Refunds at or above this always need a person. Refund requests are never sent automatically."
        >
          <Input
            type="number"
            min={0}
            value={form.autoApproveMaxRefundUsd}
            onChange={(e) => set("autoApproveMaxRefundUsd", Number(e.target.value))}
          />
        </Field>
        <Field label="Ops channel" hint="Where escalations and hot work are announced.">
          <Input value={form.opsChannel} onChange={(e) => set("opsChannel", e.target.value)} placeholder="#ops" />
        </Field>
      </div>

      <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {(
          [
            ["requireApprovalForComplaints", "Require approval for complaints", "Hold complaint replies until a support lead approves."],
            ["requireApprovalForPartnerships", "Require approval for partnerships", "Hold partnership replies until the partnerships team approves."],
            ["autoSendFaqReplies", "Auto-send FAQ answers", "Send answers to simple questions without review."],
            ["autoArchiveSpam", "Auto-archive spam", "Archive unwanted messages and skip task creation."],
          ] as const
        ).map(([key, label, hint]) => (
          <label key={key} className="flex items-center justify-between gap-4 px-4 py-3">
            <span>
              <span className="text-sm font-medium text-ink">{label}</span>
              <span className="mt-0.5 block text-[13px] text-ink-2">{hint}</span>
            </span>
            <Switch
              checked={form[key]}
              onCheckedChange={(v) => set(key, v)}
              aria-label={label}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status.kind === "saving"}>
          {status.kind === "saving" ? "Saving..." : "Save policy"}
        </Button>
        {status.kind === "saved" ? (
          <span className="text-sm text-ok">Policy saved. New messages use it immediately.</span>
        ) : null}
        {status.kind === "error" ? <span className="text-sm text-danger">{status.message}</span> : null}
      </div>
    </form>
  );
}
