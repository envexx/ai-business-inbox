import * as React from "react";
import { Badge } from "@/components/ui/badge";

type Tone = "neutral" | "hot" | "warm" | "cold" | "ok" | "warn" | "danger" | "accent";

const priorityTone: Record<string, Tone> = { HIGH: "danger", MEDIUM: "warm", LOW: "cold" };
const riskTone: Record<string, Tone> = { HIGH: "danger", MEDIUM: "warm", LOW: "cold" };
const messageTone: Record<string, Tone> = {
  RECEIVED: "neutral",
  PROCESSED: "ok",
  NEEDS_REVIEW: "warn",
  ESCALATED: "danger",
  FAILED: "danger",
};
const approvalTone: Record<string, Tone> = {
  PENDING: "warn",
  APPROVED: "ok",
  REJECTED: "danger",
};

export function PriorityBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <Badge tone="neutral">-</Badge>;
  return <Badge tone={priorityTone[value] ?? "neutral"}>{value}</Badge>;
}

export function RiskBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <Badge tone="neutral">-</Badge>;
  return <Badge tone={riskTone[value] ?? "neutral"}>{value} risk</Badge>;
}

export function MessageStatusBadge({ value }: { value: string }) {
  return <Badge tone={messageTone[value] ?? "neutral"}>{value.replace(/_/g, " ")}</Badge>;
}

export function ApprovalBadge({ value }: { value: string }) {
  return <Badge tone={approvalTone[value] ?? "neutral"}>{value}</Badge>;
}

export function IntentBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <Badge tone="neutral">unclassified</Badge>;
  return <Badge tone="accent">{value.replace(/_/g, " ")}</Badge>;
}

export { priorityTone, riskTone };
