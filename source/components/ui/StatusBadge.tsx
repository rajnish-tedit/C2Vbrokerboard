import {
  ArrowRight,
  Circle,
  CircleCheck,
  CircleX,
  Clock,
  Minus,
  Pause,
  Sparkles,
  TriangleAlert,
  Undo2,
} from "lucide-react";

import type { StatusIcon, StatusMeta, StatusTone } from "@/lib/domain/status";
import { cn } from "@/lib/utils";

import { Tooltip } from "./Tooltip";

const TONES: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  info: "bg-sky-50 text-sky-800 ring-sky-600/20",
  warning: "bg-amber-50 text-amber-900 ring-amber-600/25",
  danger: "bg-rose-50 text-rose-800 ring-rose-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
  pending: "bg-violet-50 text-violet-800 ring-violet-600/20",
  brand: "bg-navy-50 text-navy-800 ring-navy-600/20",
};

const ICONS: Record<StatusIcon, typeof Circle> = {
  check: CircleCheck,
  clock: Clock,
  alert: TriangleAlert,
  x: CircleX,
  arrow: ArrowRight,
  pause: Pause,
  minus: Minus,
  spark: Sparkles,
  dot: Circle,
  undo: Undo2,
};

type StatusBadgeProps = {
  meta: StatusMeta;
  size?: "sm" | "md";
  showHelp?: boolean;
  className?: string;
};

export function StatusBadge({
  meta,
  size = "sm",
  showHelp = true,
  className,
}: StatusBadgeProps) {
  const Icon = ICONS[meta.icon];
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        TONES[meta.tone],
        className,
      )}
    >
      <Icon
        className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
  if (!showHelp) return badge;
  return (
    <Tooltip content={meta.help}>
      <span tabIndex={0} className="inline-flex rounded-full">
        {badge}
      </span>
    </Tooltip>
  );
}
