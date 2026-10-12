"use client";

import { Printer, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { TERM_HELP } from "@/components/broker/CommissionSummary";
import { CommissionTransactionDrawer } from "@/components/broker/CommissionTransactionDrawer";
import { PayoutStatusTimeline } from "@/components/broker/PayoutStatusTimeline";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatMonth, formatShortDate } from "@/lib/domain/dates";
import { formatMoney, formatRate, sum } from "@/lib/domain/money";
import { monthSummary } from "@/lib/domain/selectors";
import {
  BANK_STATUS,
  COMMISSION_STATUS,
  COMMISSION_TYPE,
} from "@/lib/domain/status";
import type { BrokerDataset } from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";

type Props = {
  batchId: string;
  data?: BrokerDataset;
  backHref?: string;
  backLabel?: string;
  admin?: boolean;
};

export function PayoutStatementView({
  batchId,
  data: override,
  backHref = "/broker/payouts",
  backLabel = "Payouts & Statements",
  admin,
}: Props) {
  const demo = useDemo();
  const data = override ?? demo.broker;
  const [openTxn, setOpenTxn] = useState<string | null>(null);
  const batch = data.payoutBatches.find((b) => b.id === batchId);
  const summary = useMemo(
    () => (batch ? monthSummary(data, batch.periodMonth) : null),
    [data, batch],
  );

  if (!batch || !summary) {
    return (
      <Card>
        <EmptyState
          icon={<Wallet className="h-5 w-5" />}
          title="Statement not found"
          action={<Button href={backHref}>Back to payouts</Button>}
        />
      </Card>
    );
  }

  const rows = data.transactions.filter((t) =>
    batch.transactionIds.includes(t.id),
  );
  const carried = rows.filter((t) => t.carriedForward);
  const vendorName = (id: string) =>
    data.vendors.find((v) => v.id === id)?.companyName ?? "";
  const account = data.payoutAccount;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: backHref, label: backLabel }}
        title={`${formatMonth(batch.periodMonth)} Statement`}
        description={`${data.broker.companyName} · commission period ${formatDate(batch.periodStart)} – ${formatDate(batch.periodEnd)} · statement ${batch.id}`}
        meta={
          <StatusBadge meta={BANK_STATUS[batch.bankPayoutStatus]} size="md" />
        }
        actions={
          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="print:hidden"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print / save PDF
          </Button>
        }
      />

      {batch.bankPayoutStatus === "failed" && (
        <Callout
          tone="danger"
          title={
            admin
              ? "Bank payout failed — Broker action required"
              : "Your bank payout failed — your commission is still owed"
          }
          action={
            !admin && (
              <Button href="/broker/payout-settings" variant="danger" size="sm">
                Update payout account
              </Button>
            )
          }
        >
          {batch.failureReason} The commission calculation below is correct and
          was not changed. The Stripe transfer succeeded; only the final bank
          payout needs a valid payout account.
        </Callout>
      )}
      {batch.batchStatus === "on_hold" && (
        <Callout tone="warning" title="Payout on hold">
          {batch.holdReason}
        </Callout>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Statement summary" />
          <div className="px-5 py-2">
            <DescriptionList
              items={[
                {
                  term: "New subscription commission",
                  value: formatMoney(batch.newCommissionCents),
                },
                {
                  term: "Renewal commission",
                  value: formatMoney(batch.renewalCommissionCents),
                },
                {
                  term: "Refund adjustments",
                  value: formatMoney(batch.adjustmentsCents),
                  help: TERM_HELP.adjustments,
                },
                {
                  term: "Net commission",
                  value: (
                    <span className="text-lg">
                      {formatMoney(batch.netPayoutCents)}
                    </span>
                  ),
                  emphasis: true,
                  help: TERM_HELP.net,
                },
              ]}
            />
          </div>
          <div className="border-t border-slate-100 px-5 py-2">
            <DescriptionList
              items={[
                {
                  term: "Subscription revenue",
                  value: formatMoney(batch.subscriptionRevenueCents),
                  help: TERM_HELP.subscriptionRevenue,
                },
                {
                  term: "Gross eligible revenue",
                  value: formatMoney(batch.eligibleRevenueCents),
                  help: TERM_HELP.eligibleRevenue,
                },
                { term: "Commission rate", value: formatRate(summary.rateBps) },
                {
                  term: "Gross commission",
                  value: formatMoney(batch.grossCommissionCents),
                  help: TERM_HELP.gross,
                },
                {
                  term: "Settlement cutoff",
                  value: formatDate(batch.settlementCutoffAt),
                },
              ]}
            />
          </div>
          {carried.length > 0 && (
            <p className="border-t border-slate-100 px-5 py-3 text-sm text-amber-900">
              Includes {formatMoney(sum(carried.map((t) => t.commissionCents)))}{" "}
              carried forward from a refund on an earlier, already-paid month.
              The earlier statement was not changed.
            </p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Payout tracking"
            description="Transfer and bank payout are tracked separately"
          />
          <div className="p-5">
            <PayoutStatusTimeline batch={batch} />
            <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                Stripe transfer:{" "}
                <span className="font-mono">
                  {batch.stripeTransferReference ?? "—"}
                </span>
              </p>
              <p className="mt-0.5">
                Payout account: {account.bankName ?? "—"}{" "}
                {account.maskedBankDisplay ?? ""}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Commission transactions in this payout"
          description={`${rows.length} ledger entries · click a row for its calculation`}
        />
        <DataTable
          caption="Transactions included in this payout"
          rows={rows}
          rowKey={(t) => t.id}
          onRowClick={(t) => setOpenTxn(t.id)}
          rowLabel={(t) => `Open ${t.reference}`}
          rowClassName={(t) =>
            t.type === "adjustment" ? "bg-amber-50/40" : undefined
          }
          pageSize={25}
          columns={[
            {
              key: "date",
              header: "Date",
              cell: (t) => formatShortDate(t.earnedAt),
            },
            {
              key: "vendor",
              header: "Vendor",
              cell: (t) => (
                <span className="font-medium text-navy-950">
                  {vendorName(t.vendorId)}
                </span>
              ),
            },
            {
              key: "type",
              header: "Type",
              cell: (t) => COMMISSION_TYPE[t.type],
            },
            {
              key: "ref",
              header: "Reference",
              cell: (t) => (
                <span className="font-mono text-xs">{t.reference}</span>
              ),
              hideBelow: "sm",
            },
            {
              key: "amount",
              header: "Eligible amount",
              align: "right",
              cell: (t) => formatMoney(t.eligibleAmountCents),
            },
            {
              key: "commission",
              header: "Commission",
              align: "right",
              cell: (t) => (
                <span className="font-semibold text-navy-950">
                  {formatMoney(t.commissionCents)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (t) => <StatusBadge meta={COMMISSION_STATUS[t.status]} />,
              hideBelow: "md",
            },
          ]}
          footer={
            <tr>
              <td
                colSpan={4}
                className="px-4 py-3 text-sm font-semibold text-navy-950"
              >
                Net payout
              </td>
              <td className="num px-4 py-3 text-right text-sm font-semibold text-navy-950">
                {formatMoney(sum(rows.map((t) => t.eligibleAmountCents)))}
              </td>
              <td className="num px-4 py-3 text-right text-sm font-semibold text-navy-950">
                {formatMoney(batch.netPayoutCents)}
              </td>
              <td className="hidden md:table-cell" />
            </tr>
          }
        />
      </Card>

      <CommissionTransactionDrawer
        data={data}
        transaction={data.transactions.find((t) => t.id === openTxn) ?? null}
        onClose={() => setOpenTxn(null)}
        onSelect={setOpenTxn}
        vendorHref={
          admin ? () => `/admin/brokers/${data.broker.id}` : undefined
        }
        payoutHref={admin ? (id) => `/admin/payouts/${id}` : undefined}
      />
    </div>
  );
}
