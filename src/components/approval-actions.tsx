"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<null | "APPROVED" | "REJECTED">(null);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function decide(status: "APPROVED" | "REJECTED") {
    setPending(status);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined, decidedBy: "operator" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not record decision");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record decision");
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-ink-2">Decision note</span>
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional context for the audit trail"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => decide("APPROVED")} disabled={pending !== null} size="sm">
          {pending === "APPROVED" ? "Approving..." : "Approve and send"}
        </Button>
        <Button
          variant="danger"
          onClick={() => decide("REJECTED")}
          disabled={pending !== null}
          size="sm"
        >
          {pending === "REJECTED" ? "Rejecting..." : "Reject"}
        </Button>
      </div>
    </div>
  );
}
