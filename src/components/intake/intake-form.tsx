"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/field";
import { IntentBadge, PriorityBadge, RiskBadge } from "@/components/ui/status";

interface Result {
  messageId: string;
  runId: string;
  status: string;
  intent: string;
  priority: string;
  risk: string;
  mode: string;
  department: string;
  requiresApproval: boolean;
  approvalId: string | null;
  engine: string;
}

const EMPTY = {
  senderName: "",
  senderEmail: "",
  company: "",
  subject: "",
  body: "",
};

const SAMPLE = {
  senderName: "Sarah Mendez",
  senderEmail: "sarah.mendez@fieldstoneretail.com",
  company: "Fieldstone Retail",
  subject: "Charged twice this month",
  body:
    "Hello, we have been charged twice for our subscription this month. Can someone help us resolve this? The second charge is $184 and it should not be there.",
};

export function IntakeForm() {
  const router = useRouter();
  const [form, setForm] = React.useState({ ...EMPTY });
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Result | null>(null);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function fillSample() {
    setForm({ ...SAMPLE });
    setResult(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.body.trim()) {
      setError("A message body is required so the classifier has something to read.");
      return;
    }
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: form.senderName || null,
          senderEmail: form.senderEmail || null,
          company: form.company || null,
          subject: form.subject || null,
          body: form.body,
          channel: "form",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.issues ? JSON.stringify(data.issues) : data.error;
        throw new Error(detail ?? "The pipeline rejected this message.");
      }
      setResult(data);
      setForm({ ...EMPTY });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From">
            <Input value={form.senderName} onChange={(e) => set("senderName", e.target.value)} placeholder="Sender name" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.senderEmail} onChange={(e) => set("senderEmail", e.target.value)} placeholder="sender@example.com" />
          </Field>
          <Field label="Company">
            <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Subject">
            <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Optional" />
          </Field>
        </div>
        <Field label="Message" hint="Paste the raw message. The classifier reads intent, priority, and sentiment.">
          <Textarea
            rows={6}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder="We have been charged twice this month and need help resolving it."
          />
        </Field>

        {error ? (
          <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Running pipeline..." : "Process message"}
          </Button>
          <Button type="button" variant="outline" onClick={fillSample} disabled={pending}>
            Fill sample message
          </Button>
        </div>
      </form>

      <div className="rounded-lg border border-line bg-surface p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Pipeline result</p>
        {result ? (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <IntentBadge value={result.intent} />
              <PriorityBadge value={result.priority} />
              <RiskBadge value={result.risk} />
            </div>
            <p className="text-sm text-ink">
              Mode: <span className="font-medium">{result.mode.replace(/_/g, " ")}</span>
            </p>
            <p className="text-sm text-ink-2">Routed to {result.department}</p>
            {result.requiresApproval ? (
              <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-[13px] text-warn">
                Held for human approval. Nothing was sent.
              </p>
            ) : (
              <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-[13px] text-ok">
                Handled automatically. The reply was sent and a task was created.
              </p>
            )}
            <p className="text-[13px] text-ink-3">engine {result.engine}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              <Link href={`/inbox/${result.messageId}`} className="text-accent-strong hover:underline">
                Open message
              </Link>
              <Link href={`/runs/${result.runId}`} className="text-accent-strong hover:underline">
                Open run
              </Link>
              {result.approvalId ? (
                <Link href="/approvals" className="text-accent-strong hover:underline">
                  Review approval
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-2">
            Send a message and the classifier output, the policy decision, and the routing appear
            here. Unresolved work lands in Approvals.
          </p>
        )}
        <div className="mt-4 border-t border-line pt-3">
          <Badge tone="neutral">
            {result ? result.status.replace(/_/g, " ") : "idle"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
