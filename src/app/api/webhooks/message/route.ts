import { NextResponse } from "next/server";
import { z } from "zod";
import { intakeMessage } from "@/core/engine";

export const dynamic = "force-dynamic";

// Inbound message webhook. Point an email parser or form at this endpoint.
const WebhookSchema = z.object({
  from: z.string().trim().max(120).optional(),
  email: z.string().trim().max(200).optional(),
  company: z.string().trim().max(160).optional(),
  subject: z.string().trim().max(200).optional(),
  text: z.string().trim().min(1).max(6000),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }
  const parsed = WebhookSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid webhook payload", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const result = await intakeMessage({
    senderName: parsed.data.from,
    senderEmail: parsed.data.email,
    company: parsed.data.company,
    subject: parsed.data.subject,
    body: parsed.data.text,
    channel: "webhook",
  });
  return NextResponse.json(
    {
      accepted: true,
      messageId: result.message.id,
      runId: result.runId,
      intent: result.understanding.classification.intent,
      mode: result.decision.mode,
      requiresApproval: result.decision.requiresApproval,
    },
    { status: 202 },
  );
}
