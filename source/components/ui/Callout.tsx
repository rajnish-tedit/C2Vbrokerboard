import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const TONES = {
  info: {
    box: "border-sky-200 bg-sky-50",
    icon: Info,
    iconClass: "text-sky-600",
  },
  warning: {
    box: "border-amber-200 bg-amber-50",
    icon: TriangleAlert,
    iconClass: "text-amber-600",
  },
  danger: {
    box: "border-rose-200 bg-rose-50",
    icon: CircleAlert,
    iconClass: "text-rose-600",
  },
  success: {
    box: "border-emerald-200 bg-emerald-50",
    icon: CircleCheck,
    iconClass: "text-emerald-600",
  },
} as const;

type CalloutProps = {
  tone?: keyof typeof TONES;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function Callout({
  tone = "info",
  title,
  children,
  action,
  className,
}: CalloutProps) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-xl border p-4",
        t.box,
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 h-5 w-5 shrink-0", t.iconClass)}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy-950">{title}</p>
        {children && (
          <div className="mt-1 text-sm text-slate-700">{children}</div>
        )}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
