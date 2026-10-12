type Stage = { label: string; value: number; help: string };

const STEPS = ["#86b6ef", "#3987e5", "#1c5cab", "#104281"];

export function ReferralFunnel({ stages }: { stages: Stage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <ol className="space-y-3" aria-label="Referral funnel">
      {stages.map((stage, i) => {
        const prev = i > 0 ? stages[i - 1].value : null;
        const rate = prev ? Math.round((stage.value / prev) * 100) : null;
        return (
          <li key={stage.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-navy-950">{stage.label}</span>
              <span className="num text-slate-600">
                <span className="font-semibold text-navy-950">
                  {stage.value.toLocaleString("en-US")}
                </span>
                {rate !== null && (
                  <span className="ml-2 text-xs text-slate-500">
                    {rate}% of previous
                  </span>
                )}
              </span>
            </div>
            <div
              className="h-3 w-full rounded-full bg-slate-100"
              title={stage.help}
            >
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${Math.max(2, (stage.value / max) * 100)}%`,
                  background: STEPS[i % STEPS.length],
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
