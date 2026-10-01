import { prisma } from "@/lib/prisma";
import type { MessageStatus, RiskLevel, RunStatus } from "@prisma/client";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboard() {
  const since = startOfToday();

  const [messagesToday, autoHandled, humanReview, escalated, openTasks, pendingApprovals, total] =
    await Promise.all([
      prisma.message.count({ where: { createdAt: { gte: since } } }),
      prisma.message.count({ where: { createdAt: { gte: since }, status: "PROCESSED" } }),
      prisma.message.count({ where: { createdAt: { gte: since }, status: "NEEDS_REVIEW" } }),
      prisma.message.count({ where: { createdAt: { gte: since }, status: "ESCALATED" } }),
      prisma.task.count({ where: { status: "OPEN" } }),
      prisma.approval.count({ where: { status: "PENDING" } }),
      prisma.message.count(),
    ]);

  const liveQueue = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      classification: true,
      approvals: { where: { status: "PENDING" } },
      tasks: { where: { status: "OPEN" }, take: 1 },
    },
  });

  const approvals = await prisma.approval.findMany({
    where: { status: "PENDING" },
    orderBy: { requestedAt: "desc" },
    take: 4,
    include: { message: { select: { id: true, senderName: true, company: true, intent: true } } },
  });

  const latestRun = await prisma.automationRun.findFirst({
    orderBy: { startedAt: "desc" },
    include: {
      message: { select: { id: true, senderName: true, company: true, intent: true, priority: true } },
      steps: { orderBy: { seq: "asc" } },
    },
  });

  return {
    stats: { messagesToday, autoHandled, humanReview, escalated, openTasks, pendingApprovals, total },
    liveQueue,
    approvals,
    latestRun,
  };
}

export async function listMessages(params: { status?: MessageStatus; risk?: RiskLevel; q?: string } = {}) {
  const { status, risk, q } = params;
  return prisma.message.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(risk ? { risk } : {}),
      ...(q
        ? {
            OR: [
              { senderName: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { approvals: { where: { status: "PENDING" }, take: 1 } },
  });
}

export async function getMessage(id: string) {
  return prisma.message.findUnique({
    where: { id },
    include: {
      classification: true,
      tasks: { orderBy: { dueAt: "asc" } },
      approvals: { orderBy: { requestedAt: "desc" } },
      actions: { orderBy: { createdAt: "desc" } },
      runs: {
        orderBy: { startedAt: "desc" },
        include: { steps: { orderBy: { seq: "asc" } }, actions: true },
      },
    },
  });
}

export async function listTasks(params: { status?: "OPEN" | "DONE"; department?: string } = {}) {
  return prisma.task.findMany({
    where: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.department ? { department: params.department } : {}),
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    take: 100,
    include: { message: { select: { id: true, senderName: true, company: true, intent: true } } },
  });
}

export async function listApprovals(params: { status?: "PENDING" | "APPROVED" | "REJECTED" } = {}) {
  return prisma.approval.findMany({
    where: params.status ? { status: params.status } : {},
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
    take: 100,
    include: { message: { select: { id: true, senderName: true, company: true, intent: true, risk: true } } },
  });
}

export async function listRuns(params: { status?: RunStatus } = {}) {
  return prisma.automationRun.findMany({
    where: params.status ? { status: params.status } : {},
    orderBy: { startedAt: "desc" },
    take: 100,
    include: {
      message: { select: { id: true, senderName: true, company: true, intent: true } },
      _count: { select: { steps: true, actions: true } },
    },
  });
}

export async function getRun(id: string) {
  return prisma.automationRun.findUnique({
    where: { id },
    include: {
      message: { select: { id: true, senderName: true, company: true, intent: true, priority: true, risk: true } },
      steps: { orderBy: { seq: "asc" } },
      actions: true,
      audit: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function listDecisions() {
  return prisma.classification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      message: { select: { id: true, senderName: true, company: true, status: true, risk: true } },
    },
  });
}

export async function getAnalytics() {
  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  const [byIntent, byStatus, byDepartment, byPriority, recent] = await Promise.all([
    prisma.message.groupBy({ by: ["intent"], _count: { _all: true } }),
    prisma.message.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.task.groupBy({ by: ["department"], _count: { _all: true } }),
    prisma.message.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.message.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    }),
  ]);

  const days: Array<{ day: string; total: number; auto: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const inDay = recent.filter((m) => m.createdAt >= day && m.createdAt < next);
    days.push({
      day: day.toISOString().slice(5, 10),
      total: inDay.length,
      auto: inDay.filter((m) => m.status === "PROCESSED").length,
    });
  }

  return { byIntent, byStatus, byDepartment, byPriority, days };
}

export async function getAuditFeed(limit = 40) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { run: { select: { id: true, message: { select: { id: true, senderName: true } } } } },
  });
}
