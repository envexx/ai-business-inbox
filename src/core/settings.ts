import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export interface PolicyConfig {
  autoApproveMaxRefundUsd: number;
  requireApprovalForComplaints: boolean;
  requireApprovalForPartnerships: boolean;
  autoSendFaqReplies: boolean;
  autoArchiveSpam: boolean;
  opsChannel: string;
}

export const DEFAULT_POLICY: PolicyConfig = {
  autoApproveMaxRefundUsd: 100,
  requireApprovalForComplaints: true,
  requireApprovalForPartnerships: true,
  autoSendFaqReplies: true,
  autoArchiveSpam: true,
  opsChannel: "#ops",
};

const KEY = "policy";

export async function getPolicyConfig(): Promise<PolicyConfig> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    if (!row) return DEFAULT_POLICY;
    return { ...DEFAULT_POLICY, ...(row.value as Partial<PolicyConfig>) } as PolicyConfig;
  } catch {
    return DEFAULT_POLICY;
  }
}

export async function setPolicyConfig(patch: Partial<PolicyConfig>): Promise<PolicyConfig> {
  const current = await getPolicyConfig();
  const next = { ...current, ...patch };
  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: next as unknown as Prisma.InputJsonValue },
    update: { value: next as unknown as Prisma.InputJsonValue },
  });
  return next;
}
