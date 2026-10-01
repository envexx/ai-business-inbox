import { cn } from "@/lib/utils";

export function ScoreMeter({
  score,
  tone = "accent",
  className,
}: {
  score: number;
  tone?: "accent" | "hot" | "warm" | "cold";
  className?: string;
}) {
  const toneBg = {
    accent: "bg-accent",
    hot: "bg-hot",
    warm: "bg-warm",
    cold: "bg-cold",
  }[tone];

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Lead score"
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", toneBg)}
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
      />
    </div>
  );
}
