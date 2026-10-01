import { NextResponse } from "next/server";
import { z } from "zod";
import { getPolicyConfig, setPolicyConfig } from "@/core/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ policy: await getPolicyConfig() });
}

const PolicySchema = z.object({
  autoApproveMaxRefundUsd: z.number().int().min(0).max(1000000).optional(),
  requireApprovalForComplaints: z.boolean().optional(),
  requireApprovalForPartnerships: z.boolean().optional(),
  autoSendFaqReplies: z.boolean().optional(),
  autoArchiveSpam: z.boolean().optional(),
  opsChannel: z.string().trim().max(60).optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }
  const parsed = PolicySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid policy payload" }, { status: 422 });
  }
  const policy = await setPolicyConfig(parsed.data);
  return NextResponse.json({ policy });
}
