import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({ status: z.enum(["OPEN", "DONE"]) });

export async function PATCH(
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

  const parsed = PatchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task update" }, { status: 422 });
  }

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        status: parsed.data.status,
        completedAt: parsed.data.status === "DONE" ? new Date() : null,
      },
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}
