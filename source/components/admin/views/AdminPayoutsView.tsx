"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { latestPayoutMeta } from "@/components/admin/views/AdminBrokersView";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Controls";
import { DataTable } from "@/components/ui/DataTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatMonth, monthRange } from "@/lib/domain/dates";
import { formatMoney, sum } from "@/lib/domain/money";
import { BATCH_STATUS, TRANSFER_STATUS } from "@/lib/domain/status";
import { useDemo } from "@/lib/store/DemoProvider";

export function AdminPayoutsView() {
  const { brokers } = useDemo();
  const router = useRouter();
  const [month, setMonth] = useState("2026-09");
  const [broker, setBroker] = useState("all");
  const all = useMemo(
    () =>
      brokers.flatMap((d) =>
        d.payoutBatches.map((batch) => ({ batch, broker: d.broker })),
      ),
    [brokers],
  );
  const rows = all
    .filter(
      (r) =>
        (month === "all" || r.batch.periodMonth === month) &&
        (broker === "all" || r.broker.id === broker),
    )
    .sort(
      (a, b) =>
        b.batch.periodMonth.localeCompare(a.batch.periodMonth) ||
        a.broker.companyName.localeCompare(b.broker.companyName),
    );

  const inMonth = all.filter((r) => r.batch.periodMonth === month);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Batches"
        description="Monthly settlement batches for every Broker, with separate Stripe transfer and bank payout status for reconciliation."
      />
      {month !== "all" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={`${formatMonth(month)} batches`}
            value={inMonth.length}
          />
          <KpiCard
            label="Net to transfer"
            value={formatMoney(sum(inMonth.map((r) => r.batch.netPayoutCents)))}
          />
          <KpiCard
            label="Transferred"
            value={`${inMonth.filter((r) => r.batch.transferStatus === "transferred").length} / ${inMonth.length}`}
          />
          <KpiCard
            label="Bank payouts paid"
            value={`${inMonth.filter((r) => r.batch.bankPayoutStatus === "paid").length} / ${inMonth.length}`}
            sub={`${inMonth.filter((r) => r.batch.bankPayoutStatus === "failed").length} failed · ${inMonth.filter((r) => r.batch.batchStatus === "on_hold").length} on hold`}
            href="/admin/exceptions"
          />
        </div>
      )}
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <Select
            label="Period"
            value={month}
            onChange={setMonth}
            options={[
              { value: "all", label: "All periods" },
              ...monthRange("2025-08", "2026-09")
                .reverse()
                .map((m) => ({ value: m, label: formatMonth(m) })),
            ]}
          />
          <Select
            label="Broker"
            value={broker}
            onChange={setBroker}
            options={[
              { value: "all", label: "All Brokers" },
              ...brokers.map((b) => ({
                value: b.broker.id,
                label: b.broker.companyName,
              })),
            ]}
          />
        </div>
        <DataTable
          caption="Payout batches"
          rows={rows}
          rowKey={(r) => r.batch.id}
          onRowClick={(r) => router.push(`/admin/payouts/${r.batch.id}`)}
          rowLabel={(r) =>
            `Open ${r.broker.companyName} ${formatMonth(r.batch.periodMonth)}`
          }
          rowClassName={(r) =>
            r.batch.bankPayoutStatus === "failed"
              ? "bg-rose-50/50"
              : r.batch.batchStatus === "on_hold"
                ? "bg-amber-50/40"
                : undefined
          }
          pageSize={25}
          columns={[
            {
              key: "broker",
              header: "Broker",
              cell: (r) => (
                <span className="font-medium text-navy-950">
                  {r.broker.companyName}
                </span>
              ),
            },
            {
              key: "period",
              header: "Period",
              cell: (r) => formatMonth(r.batch.periodMonth),
            },
            {
              key: "gross",
              header: "Gross",
              align: "right",
              cell: (r) => formatMoney(r.batch.grossCommissionCents),
              hideBelow: "md",
            },
            {
              key: "adj",
              header: "Adj.",
              align: "right",
              cell: (r) => formatMoney(r.batch.adjustmentsCents),
              hideBelow: "md",
            },
            {
              key: "net",
              header: "Net",
              align: "right",
              cell: (r) => (
                <span className="font-semibold">
                  {formatMoney(r.batch.netPayoutCents)}
                </span>
              ),
            },
            {
              key: "batch",
              header: "Batch",
              cell: (r) => (
                <StatusBadge meta={BATCH_STATUS[r.batch.batchStatus]} />
              ),
              hideBelow: "lg",
            },
            {
              key: "transfer",
              header: "Transfer",
              cell: (r) => (
                <StatusBadge meta={TRANSFER_STATUS[r.batch.transferStatus]} />
              ),
            },
            {
              key: "bank",
              header: "Bank payout",
              cell: (r) => <StatusBadge meta={latestPayoutMeta(r.batch)!} />,
            },
            {
              key: "ref",
              header: "Transfer ref · date",
              hideBelow: "lg",
              cell: (r) => (
                <span className="text-xs">
                  <span className="font-mono">
                    {r.batch.stripeTransferReference ?? "—"}
                  </span>{" "}
                  · {formatDate(r.batch.transferredAt)}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
