"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { InfoTip } from "./Tooltip";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  help?: string;
  className?: string;
  hideBelow?: "sm" | "md" | "lg" | "xl" | "2xl";
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
  empty?: React.ReactNode;
  pageSize?: number;
  footer?: React.ReactNode;
  caption?: string;
};

const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;
const HIDE = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
  "2xl": "hidden 2xl:table-cell",
} as const;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowLabel,
  rowClassName,
  empty,
  pageSize,
  footer,
  caption,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows.length]);

  const pageCount = pageSize
    ? Math.max(1, Math.ceil(rows.length / pageSize))
    : 1;
  const visible = pageSize
    ? rows.slice(page * pageSize, (page + 1) * pageSize)
    : rows;

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500",
                    ALIGN[col.align ?? "left"],
                    col.hideBelow && HIDE[col.hideBelow],
                    col.className,
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      col.align === "right" && "flex-row-reverse",
                    )}
                  >
                    {col.header}
                    {col.help && <InfoTip content={col.help} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  onRowClick &&
                    "cursor-pointer hover:bg-navy-50/60 focus-within:bg-navy-50/60",
                  rowClassName?.(row),
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-3 py-3 text-slate-700",
                      ALIGN[col.align ?? "left"],
                      col.align === "right" && "num",
                      col.hideBelow && HIDE[col.hideBelow],
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50/70">
              {footer}
            </tfoot>
          )}
        </table>
      </div>
      {pageSize && rows.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span className="num">
            Showing {page * pageSize + 1}–
            {Math.min(rows.length, (page + 1) * pageSize)} of {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-40"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="num px-2">
              Page {page + 1} of {pageCount}
            </span>
            <button
              type="button"
              className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount - 1}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
