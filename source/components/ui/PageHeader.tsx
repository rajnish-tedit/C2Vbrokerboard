import { ChevronLeft } from "lucide-react";
import Link from "next/link";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  meta?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  actions,
  back,
  meta,
}: PageHeaderProps) {
  return (
    <header className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy-900"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              {description}
            </p>
          )}
          {meta && (
            <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
