"use client";

import { Landmark, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

import { PayoutSetupAlert } from "@/components/broker/PayoutSetupAlert";
import { TERM_HELP } from "@/components/broker/CommissionSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PolicyBadge } from "@/components/ui/PolicyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatMonth } from "@/lib/domain/dates";
import { formatMoney, sum } from "@/lib/domain/money";
import {
  brokerKpis,
  CURRENT_MONTH,
  monthSummary,
} from "@/lib/domain/selectors";
import {
  BANK_STATUS,
  BATCH_STATUS,
  COMMISSION_STATUS,
  STRIPE_STATUS,
  TRANSFER_STATUS,
} from "@/lib/domain/status";
import type { PayoutBatch } from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";

type Row =
  | { kind: "batch"; batch: PayoutBatch }
  | { kind: "open"; month: string; gross: number; adj: number; net: number };

export function PayoutsView() {
  const { broker: data } = useDemo();
  const router = useRouter();
  const kpis = brokerKpis(data);
  const open = monthSummary(data, CURRENT_MONTH);
  const paidTotal = sum(
    data.payoutBatches
      .filter((b) => b.bankPayoutStatus === "paid")
      .map((b) => b.netPayoutCents),
  );
  const batches = [...data.payoutBatches].reverse();
  const rows: Row[] = [
    ...(open.transactions.length
      ? [
          {
            kind: "open" as const,
            month: CURRENT_MONTH,
            gross: open.grossCommissionCents,
            adj: open.adjustmentsCents,
            net: open.netCommissionCents,
          },
        ]
      : []),
    ...batches.map((batch) => ({ kind: "batch" as const, batch })),
  ];
  const account = data.payoutAccount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts & Statements"
        description="Monthly payout batches, their Stripe transfer and bank payout status, and a statement for each period."
        meta={<PolicyBadge label="Monthly · settles on the 5th · sample" />}
      />
      <PayoutSetupAlert data={data} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Paid to your bank"
          value={formatMoney(paidTotal)}
          sub={`${data.payoutBatches.filter((b) => b.bankPayoutStatus === "paid").length} monthly payouts`}
          icon={<Landmark className="h-4 w-4" />}
        />
        <KpiCard
          label="Last payout"
          value={
            kpis.lastPayout ? formatMoney(kpis.lastPayout.netPayoutCents) : "—"
          }
          sub={
            kpis.lastPayout
              ? `${formatMonth(kpis.lastPayout.periodMonth)} · ${BANK_STATUS[kpis.lastPayout.bankPayoutStatus].label}`
              : "No payouts yet"
          }
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="October to date"
          value={formatMoney(open.netCommissionCents)}
          help={`${TERM_HELP.available} Includes ${formatMoney(kpis.pendingCommissionCents)} still pending.`}
          sub={`Settles ${formatDate(kpis.nextSettlementDate)}`}
          emphasis
        />
        <KpiCard
          label="Payout account"
          value={account.maskedBankDisplay ?? "Not set up"}
          sub={
            <StatusBadge
              meta={STRIPE_STATUS[account.onboardingStatus]}
              showHelp={false}
            />
          }
          href="/broker/payout-settings"
        />
      </div>

      <Card>
        <DataTable
          caption="Monthly payouts"
          rows={rows}
          rowKey={(r) => (r.kind === "batch" ? r.batch.id : "open")}
          onRowClick={(r) =>
            router.push(
              r.kind === "batch"
                ? `/broker/payouts/${r.batch.id}`
                : `/broker/commissions?month=${CURRENT_MONTH}`,
            )
          }
          rowLabel={(r) =>
            r.kind === "batch"
              ? `Open ${formatMonth(r.batch.periodMonth)} statement`
              : "Open October commissions"
          }
          rowClassName={(r) =>
            r.kind === "open"
              ? "bg-slate-50/70"
              : r.batch.bankPayoutStatus === "failed"
                ? "bg-rose-50/50"
                : undefined
          }
          empty={
            <EmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="No payouts yet"
              body="Your first payout is created on the 5th of the month after you earn eligible commission."
              action={
                <Button href="/broker/payout-settings">
                  Check payout setup
                </Button>
              }
            />
          }
          columns={[
            {
              key: "period",
              header: "Commission period",
              cell: (r) => (
                <span className="font-medium text-navy-950">
                  {formatMonth(
                    r.kind === "batch" ? r.batch.periodMonth : r.month,
                  )}
                </span>
              ),
            },
            {
              key: "gross",
              header: "Gross commission",
              align: "right",
              cell: (r) =>
                formatMoney(
                  r.kind === "batch" ? r.batch.grossCommissionCents : r.gross,
                ),
            },
            {
              key: "adj",
              header: "Adjustments",
              align: "right",
              cell: (r) =>
                formatMoney(
                  r.kind === "batch" ? r.batch.adjustmentsCents : r.adj,
                ),
            },
            {
              key: "net",
              header: "Net payout",
              align: "right",
              cell: (r) => (
                <span className="font-semibold text-navy-950">
                  {formatMoney(
                    r.kind === "batch" ? r.batch.netPayoutCents : r.net,
                  )}
                </span>
              ),
            },
            {
              key: "batch",
              header: "Batch",
              hideBelow: "2xl",
              cell: (r) =>
                r.kind === "batch" ? (
                  <StatusBadge meta={BATCH_STATUS[r.batch.batchStatus]} />
                ) : (
                  <StatusBadge
                    meta={{ ...COMMISSION_STATUS.pending, label: "Accruing" }}
                  />
                ),
            },
            {
              key: "transfer",
              header: "Stripe transfer",
              help: TERM_HELP.transfer,
              hideBelow: "md",
              cell: (r) =>
                r.kind === "batch" ? (
                  <StatusBadge meta={TRANSFER_STATUS[r.batch.transferStatus]} />
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                ),
            },
            {
              key: "bank",
              header: "Bank payout",
              help: TERM_HELP.bankPayout,
              cell: (r) =>
                r.kind === "batch" ? (
                  <StatusBadge meta={BANK_STATUS[r.batch.bankPayoutStatus]} />
                ) : (
                  <span className="text-xs text-slate-400">Not started</span>
                ),
            },
            {
              key: "date",
              header: "Payout date",
              cell: (r) =>
                r.kind === "batch"
                  ? formatDate(r.batch.bankPaidAt ?? r.batch.transferredAt)
                  : `Est. ${formatDate(kpis.nextSettlementDate)}`,
            },
          ]}
        />
      </Card>
    </div>
  );
}
