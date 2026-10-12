import { DataTable } from "@/components/ui/DataTable";
import { formatDateTime } from "@/lib/domain/dates";
import type { AuditEvent } from "@/lib/domain/types";

export function AuditLogTable({
  events,
  pageSize = 20,
}: {
  events: AuditEvent[];
  pageSize?: number;
}) {
  return (
    <DataTable
      caption="Audit events"
      rows={events}
      rowKey={(e) => e.id}
      pageSize={pageSize}
      columns={[
        {
          key: "time",
          header: "When",
          cell: (e) => (
            <span className="text-xs">{formatDateTime(e.createdAt)}</span>
          ),
        },
        { key: "actor", header: "Actor", cell: (e) => e.actor },
        {
          key: "action",
          header: "Action",
          cell: (e) => (
            <span className="block max-w-md whitespace-normal">
              <span className="block font-medium text-navy-950">
                {e.summary}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {e.action}
              </span>
            </span>
          ),
        },
        {
          key: "change",
          header: "Before → after",
          hideBelow: "lg",
          cell: (e) =>
            e.before || e.after ? (
              <span className="block max-w-xs whitespace-normal text-xs">
                {e.before ?? "—"} → {e.after ?? "—"}
              </span>
            ) : (
              "—"
            ),
        },
        {
          key: "reason",
          header: "Reason",
          hideBelow: "md",
          cell: (e) => (
            <span className="block max-w-xs whitespace-normal text-xs text-slate-600">
              {e.reason ?? "—"}
            </span>
          ),
        },
      ]}
    />
  );
}
