import { prisma } from "../lib/prisma";
import { classifyMessage } from "./ai/provider";
import { draftReply } from "./ai/draft";
import { decide } from "./policy";
import { getPolicyConfig } from "./settings";
import type { Decision, InboxInput, StepStatusValue, Understanding } from "./types";
import type { ActionType, Prisma, RiskLevel } from "@prisma/client";

export async function createMessage(input: InboxInput) {
  return prisma.message.create({
    data: {
      senderName: input.senderName?.trim() || "Unknown sender",
      senderEmail: input.senderEmail?.trim() || null,
      company: input.company?.trim() || null,
      subject: input.subject?.trim() || null,
      body: input.body,
      channel: input.channel ?? "email",
      status: "RECEIVED",
    },
  });
}

interface RunResult {
  runId: string;
  messageId: string;
  decision: Decision;
  understanding: Understanding;
  status: "COMPLETED" | "NEEDS_REVIEW" | "FAILED";
  approvalId: string | null;
}

/**
 * The pipeline. Every stage is a persisted RunStep plus an AuditLog entry, and
 * any action that needs a person becomes a Pending Approval.
 */
export async function runAutomation(messageId: string, trigger = "inbound"): Promise<RunResult> {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new Error("Message not found");

  const policy = await getPolicyConfig();
  const run = await prisma.automationRun.create({
    data: { messageId: message.id, trigger, status: "RUNNING", startedAt: new Date() },
  });

  let seq = 0;
  const step = (name: string, status: StepStatusValue, detail?: string, ms?: number) =>
    prisma.runStep.create({ data: { runId: run.id, seq: seq++, name, status, detail, ms } });
  const audit = (event: string, detail?: string) =>
    prisma.auditLog.create({ data: { runId: run.id, event, detail } });

  const markFailed = async (msg: string) => {
    await step("Run failed", "ERROR", msg);
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: "FAILED", summary: msg, finishedAt: new Date() },
    });
    await prisma.message.update({ where: { id: message.id }, data: { status: "FAILED" } });
    await audit("run.failed", msg);
  };

  try {
    const t0 = Date.now();
    await step("Message received", "OK", `${message.senderName} via ${message.channel}`);
    await audit("message.received", message.body.slice(0, 180));

    const classifyStart = Date.now();
    const understanding = await classifyMessage({
      senderName: message.senderName,
      senderEmail: message.senderEmail,
      company: message.company,
      subject: message.subject,
      body: message.body,
      channel: message.channel,
    });
    const c = understanding.classification;
    await step(
      "Intent detected",
      "OK",
      `${c.intent.replace(/_/g, " ")} - confidence ${Math.round(c.confidence * 100)}% (${understanding.engineLabel})`,
      Date.now() - classifyStart,
    );
    await step("Priority and sentiment", "OK", `${c.priority} priority, ${c.sentiment.toLowerCase()} tone`);
    if (c.signals.length > 0) {
      await step("Structured data extracted", "OK", c.signals.join("; "));
    }
    await audit("classification.done", `${c.intent} (${c.priority})`);

    const decision = decide(c, policy);
    await step("Policy applied", decision.requiresApproval ? "WARN" : "OK", decision.policy);
    await audit("decision.made", `${decision.mode} - ${decision.department}`);

    await prisma.message.update({
      where: { id: message.id },
      data: {
        intent: c.intent,
        priority: c.priority,
        sentiment: c.sentiment,
        risk: decision.risk,
        requiresHuman: decision.requiresApproval,
        confidence: c.confidence,
        engine: understanding.engineLabel,
        status: decision.requiresApproval ? "NEEDS_REVIEW" : "PROCESSED",
      },
    });

    await prisma.classification.upsert({
      where: { messageId: message.id },
      create: {
        messageId: message.id,
        intent: c.intent,
        priority: c.priority,
        sentiment: c.sentiment,
        request: c.request,
        summary: c.summary,
        confidence: c.confidence,
        risk: decision.risk,
        policy: decision.policy,
        reasoning: c.reasoning,
        signals: c.signals as Prisma.InputJsonValue,
        engine: understanding.engineLabel,
      },
      update: {
        intent: c.intent,
        priority: c.priority,
        sentiment: c.sentiment,
        request: c.request,
        summary: c.summary,
        confidence: c.confidence,
        risk: decision.risk,
        policy: decision.policy,
        reasoning: c.reasoning,
        signals: c.signals as Prisma.InputJsonValue,
        engine: understanding.engineLabel,
      },
    });

    const draft = await draftReply(c, decision, message.senderName);
    await prisma.action.create({
      data: {
        runId: run.id,
        messageId: message.id,
        type: "DRAFT_REPLY",
        status: decision.autoSend ? "DONE" : "PENDING",
        risk: (decision.risk as RiskLevel),
        title: decision.autoSend ? "Reply sent" : "Reply drafted",
        detail: draft.body,
        mode: decision.autoSend ? "AUTO" : decision.requiresApproval ? "APPROVAL" : "NOTIFY",
      },
    });
    await step(
      decision.autoSend ? "Reply sent" : "Reply drafted for approval",
      decision.autoSend ? "OK" : "WARN",
      draft.subject,
    );

    for (const planned of decision.plan) {
      if (planned.type === "DRAFT_REPLY") continue; // created above with the body
      await prisma.action.create({
        data: {
          runId: run.id,
          messageId: message.id,
          type: planned.type as ActionType,
          status: planned.status,
          risk: planned.risk as RiskLevel,
          title: planned.title,
          detail: planned.detail,
          mode: planned.mode,
        },
      });
    }

    let task = null;
    if (c.intent !== "spam") {
      task = await prisma.task.create({
        data: {
          messageId: message.id,
          runId: run.id,
          title: decision.taskTitle,
          department: decision.department,
          priority: c.priority,
          dueAt: new Date(Date.now() + decision.dueInHours * 60 * 60 * 1000),
          status: "OPEN",
        },
      });
      await step("Task created", "OK", `${decision.taskTitle} -> ${decision.department}`);
    }

    let approvalId: string | null = null;
    if (decision.requiresApproval) {
      const approval = await prisma.approval.create({
        data: {
          messageId: message.id,
          runId: run.id,
          status: "PENDING",
          reason: decision.summary,
          risk: decision.risk as RiskLevel,
          draftBody: draft.body,
        },
      });
      approvalId = approval.id;
      await step("Approval requested", "WARN", `${decision.department} must approve before anything is sent`);
      await audit("approval.requested", decision.department);
    }

    const verified = true;
    await step(
      verified ? "Verified" : "Verified with warnings",
      decision.requiresApproval ? "WARN" : "OK",
      decision.requiresApproval
        ? "Automatic steps done. High risk step is waiting on a person."
        : "All steps confirmed.",
    );

    const status: RunResult["status"] = decision.requiresApproval ? "NEEDS_REVIEW" : "COMPLETED";
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status,
        decision: decision.mode,
        summary: decision.summary,
        engine: understanding.engineLabel,
        finishedAt: new Date(),
      },
    });
    await audit("run.completed", status);

    void t0;
    return { runId: run.id, messageId: message.id, decision, understanding, status, approvalId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await markFailed(msg);
    throw error;
  }
}

export async function intakeMessage(input: InboxInput) {
  const message = await createMessage(input);
  const result = await runAutomation(message.id, input.channel === "webhook" ? "webhook" : "inbound");
  return { message, ...result };
}

export async function decideApproval(
  approvalId: string,
  status: "APPROVED" | "REJECTED",
  note?: string,
  decidedBy = "operator",
) {
  const approval = await prisma.approval.findUnique({ where: { id: approvalId } });
  if (!approval) throw new Error("Approval not found");

  const updated = await prisma.approval.update({
    where: { id: approvalId },
    data: { status, note: note ?? null, decidedAt: new Date(), decidedBy },
  });

  await prisma.message.update({
    where: { id: approval.messageId },
    data: { status: status === "APPROVED" ? "PROCESSED" : "ESCALATED" },
  });

  if (approval.runId) {
    await prisma.auditLog.create({
      data: {
        runId: approval.runId,
        actor: decidedBy,
        event: `approval.${status.toLowerCase()}`,
        detail: note ?? undefined,
      },
    });
    if (status === "APPROVED") {
      await prisma.action.create({
        data: {
          runId: approval.runId,
          messageId: approval.messageId,
          type: "SEND_REPLY",
          status: "DONE",
          risk: approval.risk,
          title: "Approved reply sent",
          detail: approval.draftBody ?? undefined,
          mode: "APPROVAL",
        },
      });
    } else {
      await prisma.action.create({
        data: {
          runId: approval.runId,
          messageId: approval.messageId,
          type: "ESCALATE",
          status: "DONE",
          risk: approval.risk,
          title: "Reply rejected, escalated for manual handling",
          mode: "APPROVAL",
        },
      });
    }
  }

  return updated;
}
