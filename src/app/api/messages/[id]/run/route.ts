import { NextResponse } from "next/server";
import { runAutomation } from "@/core/engine";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const result = await runAutomation(id, "manual");
    return NextResponse.json({
      runId: result.runId,
      status: result.status,
      intent: result.understanding.classification.intent,
      mode: result.decision.mode,
      risk: result.decision.risk,
      requiresApproval: result.decision.requiresApproval,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
