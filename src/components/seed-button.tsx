"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SeedButton({ label = "Load demo data" }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function seed() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Seed failed");
      setMessage(`Loaded ${data.seeded} demo messages.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Seed failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" size="sm" onClick={seed} disabled={pending}>
        {pending ? "Loading..." : label}
      </Button>
      {message ? <p className="text-xs text-ink-2">{message}</p> : null}
    </div>
  );
}
