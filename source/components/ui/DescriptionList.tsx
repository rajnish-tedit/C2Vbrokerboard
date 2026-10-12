import { cn } from "@/lib/utils";

import { InfoTip } from "./Tooltip";

export type DescriptionItem = {
  term: string;
  value: React.ReactNode;
  help?: string;
  emphasis?: boolean;
};

export function DescriptionList({
  items,
  className,
  columns = 1,
  termClassName,
}: {
  items: DescriptionItem[];
  className?: string;
  columns?: 1 | 2;
  termClassName?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6",
        columns === 2 && "sm:grid-cols-2",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.term}
          className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0"
        >
          <dt
            className={cn(
              "flex shrink-0 items-center gap-1 text-sm text-slate-500",
              termClassName,
            )}
          >
            {item.term}
            {item.help && <InfoTip content={item.help} />}
          </dt>
          <dd
            className={cn(
              "num min-w-0 break-words text-right text-sm",
              item.emphasis ? "font-semibold text-navy-950" : "text-navy-900",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
