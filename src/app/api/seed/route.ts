import { NextResponse } from "next/server";
import { seedDemoData } from "@/core/seed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const reset = url.searchParams.get("reset") !== "false";
  try {
    const result = await seedDemoData({ reset });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
