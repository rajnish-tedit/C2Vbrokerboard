import { cn } from "@/lib/utils";

type CardProps = {
  className?: string;
  children?: React.ReactNode;
  as?: "section" | "div" | "article";
};

export function Card({ className, children, as: Tag = "section" }: CardProps) {
  return (
    <Tag
      className={cn(
        "min-w-0 rounded-xl border border-slate-200 bg-white shadow-card",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

type CardHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function CardHeader({
  title,
  description,
  actions,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-navy-950">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
