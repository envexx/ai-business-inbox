// Shared types for the Switchboard automation core.
// Pipeline: input -> normalize -> classify -> structured data -> policy/risk
// -> decision -> action -> verify -> audit.

export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
export type Risk = "LOW" | "MEDIUM" | "HIGH";
export type DecisionMode = "AUTO_SEND" | "AUTO_EXECUTE" | "REQUIRE_APPROVAL";
export type StepStatusValue = "OK" | "WARN" | "ERROR";

export type ActionTypeValue =
  | "DRAFT_REPLY"
  | "SEND_REPLY"
  | "CREATE_TASK"
  | "ASSIGN_DEPARTMENT"
  | "ESCALATE"
  | "ARCHIVE_SPAM"
  | "EXTRACT_DATA"
  | "CHECK_CALENDAR"
  | "REQUEST_APPROVAL";

export interface InboxInput {
  senderName?: string | null;
  senderEmail?: string | null;
  company?: string | null;
  subject?: string | null;
  body: string;
  channel?: string;
}

export interface ExtractedData {
  amountUsd: number | null;
  invoiceId: string | null;
  duplicateCharge: boolean;
}

export interface Classification {
  intent: string;
  priority: Priority;
  sentiment: Sentiment;
  request: string;
  summary: string;
  confidence: number;
  signals: string[];
  reasoning: string;
  extracted: ExtractedData;
}

export interface Understanding {
  classification: Classification;
  engine: "openai" | "heuristic" | "heuristic-fallback";
  engineLabel: string;
}

export interface PlanAction {
  type: ActionTypeValue;
  title: string;
  detail?: string;
  status: "DONE" | "PENDING" | "SKIPPED";
  mode: "AUTO" | "NOTIFY" | "APPROVAL";
  risk: Risk;
}

export interface Decision {
  mode: DecisionMode;
  risk: Risk;
  requiresApproval: boolean;
  department: string;
  policy: string;
  summary: string;
  taskTitle: string;
  dueInHours: number;
  autoSend: boolean;
  plan: PlanAction[];
}
