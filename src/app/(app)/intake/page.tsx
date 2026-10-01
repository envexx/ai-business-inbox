import { Panel, PanelHeader } from "@/components/ui/panel";
import { IntakeForm } from "@/components/intake/intake-form";
import { SeedButton } from "@/components/seed-button";

export const dynamic = "force-dynamic";

const WEBHOOK_BODY = `curl -X POST http://localhost:3000/api/webhooks/message \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "Sarah Mendez",
    "company": "Fieldstone Retail",
    "text": "We have been charged twice this month. Please help."
  }'`;

export default function IntakePage() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Input</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Intake console</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Send a message through the real pipeline. The classifier detects intent, the policy layer
            sets risk, and high risk work is held for approval.
          </p>
        </div>
        <SeedButton />
      </header>

      <Panel className="p-4 md:p-6">
        <IntakeForm />
      </Panel>

      <Panel>
        <PanelHeader title="Pipeline stages" />
        <ol className="grid gap-3 p-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {["Receive", "Classify", "Policy", "Draft", "Act or approve", "Audit"].map((stage, i) => (
            <li key={stage} className="flex items-center gap-2">
              <span className="tnum text-[11px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-ink-2">{stage}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel>
        <PanelHeader title="Webhook endpoint" hint="POST /api/webhooks/message" />
        <div className="p-4">
          <p className="text-sm text-ink-2">
            Point an email parser or form at this endpoint. The response returns the message id, run
            id, detected intent, decision mode, and whether approval is required.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md border border-line-2 bg-surface-2 p-3 font-mono text-[12px] leading-relaxed text-ink">
            {WEBHOOK_BODY}
          </pre>
        </div>
      </Panel>
    </div>
  );
}
