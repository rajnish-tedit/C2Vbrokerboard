import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

import { Tooltip } from "./Tooltip";

type PolicyBadgeProps = { label?: string; className?: string };

export function PolicyBadge({
  label = "Sample policy · awaiting approval",
  className,
}: PolicyBadgeProps) {
  return (
    <Tooltip content="Configurable business rule shown with a sample value. It is not final until the customer approves it (spec §23).">
      <span
        tabIndex={0}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-700 ring-1 ring-inset ring-gold-200",
          className,
        )}
      >
        <FlaskConical className="h-3 w-3" aria-hidden="true" />
        {label}
      </span>
    </Tooltip>
  );
}
