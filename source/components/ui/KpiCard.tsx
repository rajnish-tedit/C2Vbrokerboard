import Link from "next/link";

import { cn } from "@/lib/utils";

import { InfoTip } from "./Tooltip";

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  help?: string;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  emphasis?: boolean;
};

export function KpiCard({
  label,
  value,
  help,
  sub,
  icon,
  href,
  emphasis,
}: KpiCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
          {help && <InfoTip content={help} label={`About ${label}`} />}
        </p>
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              emphasis
                ? "bg-gold-100 text-gold-700"
                : "bg-navy-50 text-navy-600",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="num mt-2 text-2xl font-semibold tracking-tight text-navy-950">
        {value}
      </p>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </>
  );
  const classes = cn(
    "block rounded-xl border bg-white p-4 shadow-card",
    emphasis ? "border-gold-200" : "border-slate-200",
    href && "transition-colors hover:border-navy-300",
  );
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
