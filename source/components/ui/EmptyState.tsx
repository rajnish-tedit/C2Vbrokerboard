import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </span>
      )}
      <p className="text-sm font-semibold text-navy-950">{title}</p>
      {body && (
        <div className="mt-1 max-w-md text-sm text-slate-500">{body}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
