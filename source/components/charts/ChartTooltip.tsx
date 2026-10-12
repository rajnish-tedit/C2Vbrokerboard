type ChartTooltipProps = {
  x: number;
  y: number;
  containerWidth: number;
  title: string;
  rows: { label: string; value: string; swatch?: string }[];
};

export function ChartTooltip({
  x,
  y,
  containerWidth,
  title,
  rows,
}: ChartTooltipProps) {
  const left = Math.min(Math.max(x, 90), containerWidth - 90);
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 w-max min-w-[160px] -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-overlay"
      style={{ left, top: y - 8 }}
    >
      <p className="mb-1 font-semibold text-navy-950">{title}</p>
      {rows.map((r) => (
        <p
          key={r.label}
          className="flex items-center justify-between gap-4 text-slate-600"
        >
          <span className="flex items-center gap-1.5">
            {r.swatch && (
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: r.swatch }}
              />
            )}
            {r.label}
          </span>
          <span className="num font-medium text-navy-950">{r.value}</span>
        </p>
      ))}
    </div>
  );
}
