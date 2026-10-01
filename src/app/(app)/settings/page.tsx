import { Panel, PanelHeader } from "@/components/ui/panel";
import { PolicyForm } from "@/components/settings/policy-form";
import { getPolicyConfig } from "@/core/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const policy = await getPolicyConfig();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">Configuration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Automation policy</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          These switches decide what the system does on its own and what it holds for a person. The
          classifier detects intent. The policy decides permission.
        </p>
      </header>

      <Panel className="p-4 md:p-6">
        <PolicyForm
          initial={{
            autoApproveMaxRefundUsd: policy.autoApproveMaxRefundUsd,
            requireApprovalForComplaints: policy.requireApprovalForComplaints,
            requireApprovalForPartnerships: policy.requireApprovalForPartnerships,
            autoSendFaqReplies: policy.autoSendFaqReplies,
            autoArchiveSpam: policy.autoArchiveSpam,
            opsChannel: policy.opsChannel,
          }}
        />
      </Panel>

      <Panel>
        <PanelHeader title="Risk tiers" />
        <div className="grid gap-4 p-4 text-sm text-ink-2 sm:grid-cols-3">
          <div>
            <p className="font-medium text-ink">Low risk</p>
            <p className="mt-1">The system executes and logs it. Examples: FAQ, scheduling.</p>
          </div>
          <div>
            <p className="font-medium text-ink">Medium risk</p>
            <p className="mt-1">The system executes, creates a task, and notifies the owner.</p>
          </div>
          <div>
            <p className="font-medium text-ink">High risk</p>
            <p className="mt-1">Nothing is sent. The reply is drafted and waits in Approvals.</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
