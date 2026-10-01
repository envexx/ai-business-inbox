import type { Classification, Decision, PlanAction, Risk } from "./types";
import type { PolicyConfig } from "./settings";

function action(
  type: PlanAction["type"],
  title: string,
  opts: Partial<PlanAction> = {},
): PlanAction {
  return {
    type,
    title,
    status: opts.status ?? "DONE",
    mode: opts.mode ?? "AUTO",
    risk: opts.risk ?? "LOW",
    detail: opts.detail,
  };
}

/**
 * Policy layer. The classifier says what the message is. This function decides
 * what the system is allowed to do about it, and what must wait for a human.
 * Nothing here is delegated to the model.
 */
export function decide(classification: Classification, policy: PolicyConfig): Decision {
  const { intent, priority, extracted } = classification;

  let department = "Operations";
  let taskTitle = "Review message";
  let policyLabel = "Standard handling.";
  let requiresApproval = false;
  let baseRisk: Risk = "LOW";
  let autoSend = false;
  const plan: PlanAction[] = [];

  switch (intent) {
    case "refund_request": {
      const amount = extracted.amountUsd ?? 0;
      department = "Finance";
      baseRisk = "HIGH";
      requiresApproval = true;
      taskTitle = "Review refund request";
      policyLabel = `Refund requests always require human approval. Auto approve cap is $${policy.autoApproveMaxRefundUsd}.`;
      plan.push(
        action("EXTRACT_DATA", "Payment details extracted", { detail: amount ? `Amount on file: $${amount.toLocaleString("en-US")}` : "No amount stated in the message" }),
        action("DRAFT_REPLY", "Refund reply drafted", { status: "PENDING", mode: "APPROVAL", risk: "HIGH", detail: "Held until Finance approves." }),
        action("REQUEST_APPROVAL", "Approval requested from Finance", { status: "PENDING", mode: "APPROVAL", risk: "HIGH" }),
        action("ASSIGN_DEPARTMENT", "Assigned to Finance", { detail: "Finance owns the refund decision." }),
      );
      break;
    }
    case "billing_issue": {
      department = "Finance";
      baseRisk = extracted.duplicateCharge ? "HIGH" : "MEDIUM";
      requiresApproval = extracted.duplicateCharge;
      taskTitle = extracted.duplicateCharge ? "Investigate duplicate charge" : "Investigate billing issue";
      policyLabel = extracted.duplicateCharge
        ? "Duplicate charge detected, refund review required."
        : "Billing issues are handled automatically with a finance task.";
      autoSend = !requiresApproval;
      plan.push(
        action("EXTRACT_DATA", "Billing context extracted", { status: "DONE", detail: extracted.amountUsd ? `Amount: $${extracted.amountUsd.toLocaleString("en-US")}` : "No amount stated" }),
        action("DRAFT_REPLY", "Billing reply drafted", requiresApproval ? { status: "PENDING", mode: "APPROVAL", risk: "HIGH" } : { mode: "AUTO" }),
        requiresApproval
          ? action("REQUEST_APPROVAL", "Approval requested for refund review", { status: "PENDING", mode: "APPROVAL", risk: "HIGH" })
          : action("ASSIGN_DEPARTMENT", "Assigned to Finance"),
      );
      break;
    }
    case "invoice": {
      department = "Finance";
      baseRisk = "MEDIUM";
      taskTitle = "Process invoice";
      policyLabel = "Invoices are extracted and routed automatically.";
      plan.push(
        action("EXTRACT_DATA", "Invoice data extracted", { detail: extracted.invoiceId ? `Invoice ${extracted.invoiceId}` : "No invoice number found" }),
        action("ASSIGN_DEPARTMENT", "Assigned to Finance"),
      );
      break;
    }
    case "complaint": {
      department = "Support";
      baseRisk = "HIGH";
      requiresApproval = policy.requireApprovalForComplaints;
      taskTitle = "Escalate customer complaint";
      policyLabel = policy.requireApprovalForComplaints
        ? "Complaints require human approval before a reply is sent."
        : "Complaints are acknowledged automatically.";
      autoSend = !requiresApproval;
      plan.push(
        action("ESCALATE", "Escalated to Support lead", { risk: "HIGH", detail: "Flagged as a complaint." }),
        action("DRAFT_REPLY", "Acknowledgment drafted", requiresApproval ? { status: "PENDING", mode: "APPROVAL", risk: "HIGH" } : { mode: "AUTO" }),
        requiresApproval
          ? action("REQUEST_APPROVAL", "Approval requested from Support", { status: "PENDING", mode: "APPROVAL", risk: "HIGH" })
          : action("ASSIGN_DEPARTMENT", "Assigned to Support"),
      );
      break;
    }
    case "meeting_request": {
      department = "Sales";
      baseRisk = "LOW";
      taskTitle = "Confirm meeting time";
      policyLabel = "Meeting requests get an availability check and a reply.";
      autoSend = true;
      plan.push(
        action("CHECK_CALENDAR", "Calendar availability checked", { detail: "Two open slots found this week." }),
        action("DRAFT_REPLY", "Scheduling reply drafted", { mode: "AUTO" }),
        action("ASSIGN_DEPARTMENT", "Assigned to Sales"),
      );
      break;
    }
    case "sales_inquiry": {
      department = "Sales";
      baseRisk = "LOW";
      taskTitle = "Qualify inbound inquiry";
      policyLabel = "Sales inquiries are answered and queued for follow-up.";
      autoSend = true;
      plan.push(
        action("DRAFT_REPLY", "Sales reply drafted", { mode: "AUTO" }),
        action("ASSIGN_DEPARTMENT", "Assigned to Sales"),
      );
      break;
    }
    case "partnership": {
      department = "Partnerships";
      baseRisk = "MEDIUM";
      requiresApproval = policy.requireApprovalForPartnerships;
      taskTitle = "Review partnership request";
      policyLabel = policy.requireApprovalForPartnerships
        ? "Partnership requests require human review before reply."
        : "Partnership requests are acknowledged automatically.";
      if (requiresApproval) {
        plan.push(
          action("REQUEST_APPROVAL", "Approval requested from Partnerships", { status: "PENDING", mode: "APPROVAL", risk: "MEDIUM" }),
          action("DRAFT_REPLY", "Partnership reply drafted", { status: "PENDING", mode: "APPROVAL", risk: "MEDIUM" }),
        );
      } else {
        plan.push(action("DRAFT_REPLY", "Partnership reply drafted", { mode: "AUTO" }));
      }
      plan.push(action("ASSIGN_DEPARTMENT", "Assigned to Partnerships"));
      break;
    }
    case "support_request": {
      department = "Support";
      baseRisk = "MEDIUM";
      taskTitle = "Resolve support request";
      policyLabel = "Support requests receive a drafted reply and a ticket.";
      autoSend = true;
      plan.push(
        action("DRAFT_REPLY", "Support reply drafted", { mode: "AUTO" }),
        action("ASSIGN_DEPARTMENT", "Assigned to Support"),
      );
      break;
    }
    case "faq": {
      department = "Operations";
      baseRisk = "LOW";
      taskTitle = "Log answered question";
      autoSend = policy.autoSendFaqReplies;
      policyLabel = policy.autoSendFaqReplies
        ? "FAQ messages are answered automatically."
        : "FAQ messages are drafted and held for review.";
      plan.push(
        action("DRAFT_REPLY", "Answer drafted", autoSend ? { mode: "AUTO" } : { status: "PENDING", mode: "APPROVAL" }),
      );
      break;
    }
    case "internal_request": {
      department = "Operations";
      baseRisk = "LOW";
      taskTitle = "Handle internal request";
      policyLabel = "Internal requests become a task for the assigned team.";
      plan.push(action("ASSIGN_DEPARTMENT", "Assigned to Operations"));
      break;
    }
    case "spam":
    default: {
      department = "None";
      baseRisk = "LOW";
      taskTitle = "No task";
      policyLabel = policy.autoArchiveSpam ? "Unwanted message archived automatically." : "Unwanted message flagged.";
      if (policy.autoArchiveSpam) {
        plan.push(action("ARCHIVE_SPAM", "Message archived", { mode: "AUTO" }));
      }
      break;
    }
  }

  // Every non-spam message gets a tracked task and a department assignment.
  if (intent !== "spam") {
    plan.push(action("CREATE_TASK", "Task created", { status: "DONE", mode: "AUTO", detail: taskTitle }));
  }

  const risk: Risk = requiresApproval
    ? "HIGH"
    : baseRisk;
  const mode = requiresApproval ? "REQUIRE_APPROVAL" : autoSend || baseRisk === "LOW" ? "AUTO_SEND" : "AUTO_EXECUTE";
  const dueInHours = priority === "HIGH" ? 4 : priority === "MEDIUM" ? 24 : 72;

  return {
    mode,
    risk,
    requiresApproval,
    department,
    policy: policyLabel,
    summary: requiresApproval
      ? `${classification.intent.replace(/_/g, " ")} routed to ${department}. Waiting for human approval.`
      : `${classification.intent.replace(/_/g, " ")} routed to ${department}. Handled automatically.`,
    taskTitle,
    dueInHours,
    autoSend,
    plan,
  };
}
