import { NextResponse } from "next/server";
import { z } from "zod";
import { intakeMessage } from "@/core/engine";
import { listMessages } from "@/server/queries";

export const dynamic = "force-dynamic";

const MessageSchema = z.object({
  senderName: z.string().trim().max(120).optional().nullable(),
  senderEmail: z.string().trim().max(200).optional().nullable(),
  company: z.string().trim().max(160).optional().nullable(),
  subject: z.string().trim().max(200).optional().nullable(),
  body: z.string().trim().min(1, "A message body is required").max(6000),
  channel: z.enum(["email", "form", "chat", "webhook"]).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const risk = url.searchParams.get("risk");
  const q = url.searchParams.get("q") ?? undefined;
  const messages = await listMessages({
    status: status && ["RECEIVED", "PROCESSED", "NEEDS_REVIEW", "ESCALATED", "FAILED"].includes(status)
      ? (status as never)
      : undefined,
    risk: risk && ["LOW", "MEDIUM", "HIGH"].includes(risk) ? (risk as never) : undefined,
    q: q || undefined,
  });
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const parsed = MessageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message payload", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const result = await intakeMessage(parsed.data);
    return NextResponse.json(
      {
        messageId: result.message.id,
        runId: result.runId,
        status: result.status,
        intent: result.understanding.classification.intent,
        priority: result.understanding.classification.priority,
        risk: result.decision.risk,
        mode: result.decision.mode,
        department: result.decision.department,
        requiresApproval: result.decision.requiresApproval,
        approvalId: result.approvalId,
        engine: result.understanding.engineLabel,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
