export function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: number | string; hint?: string; tone?: "hot" | "brand" }>;
}) {
  return (
    <dl className="grid grid-cols-2 divide-line overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-4 sm:divide-x">
      {items.map((item) => (
        <div key={item.label} className="border-b border-line px-4 py-3 last:border-b-0 sm:border-b-0">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            {item.label}
          </dt>
          <dd
            className={
              item.tone === "hot"
                ? "tnum mt-1 text-2xl font-semibold text-hot"
                : item.tone === "brand"
                  ? "tnum mt-1 text-2xl font-semibold text-brand"
                  : "tnum mt-1 text-2xl font-semibold text-ink"
            }
          >
            {item.value}
          </dd>
          {item.hint ? <p className="mt-0.5 text-xs text-ink-3">{item.hint}</p> : null}
        </div>
      ))}
    </dl>
  );
}
