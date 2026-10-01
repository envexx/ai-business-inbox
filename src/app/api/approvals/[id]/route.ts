import { NextResponse } from "next/server";
import { z } from "zod";
import { decideApproval } from "@/core/engine";

export const dynamic = "force-dynamic";

const Schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(1000).optional(),
  decidedBy: z.string().trim().max(120).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid approval decision" }, { status: 422 });
  }

  try {
    const approval = await decideApproval(id, parsed.data.status, parsed.data.note, parsed.data.decidedBy);
    return NextResponse.json({ approval });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
