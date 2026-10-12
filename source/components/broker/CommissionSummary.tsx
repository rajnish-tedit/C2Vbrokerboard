import { DescriptionList } from "@/components/ui/DescriptionList";
import { PolicyBadge } from "@/components/ui/PolicyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatMonth } from "@/lib/domain/dates";
import { formatMoney, formatRate } from "@/lib/domain/money";
import type { MonthSummary } from "@/lib/domain/selectors";
import { BANK_STATUS, COMMISSION_STATUS } from "@/lib/domain/status";

type CommissionSummaryProps = {
  summary: MonthSummary;
  title?: string;
  nextSettlementDate?: string;
};

export const TERM_HELP = {
  subscriptionRevenue:
    "All Vendor subscription revenue collected from your referred Vendors this period, excluding tax.",
  eligibleRevenue:
    "The part of subscription revenue that earns commission: paid, after discounts and credits, excluding tax, and within each Vendor's 12-month commission period.",
  rate: "Your commission rate on eligible revenue.",
  gross: "Eligible revenue × commission rate, before refund adjustments.",
  adjustments:
    "Negative entries created by refunds or credits. Original commission rows are never edited.",
  net: "Gross commission plus adjustments. This is the amount paid out for the period.",
  pending: "Commission earned but still inside the 7-day holding period.",
  available:
    "Commission past its holding period that will be included in the next monthly settlement.",
  transfer:
    "Movement of funds from C2V's Stripe platform balance to your Stripe payout account.",
  bankPayout:
    "Movement of funds from your Stripe payout account to your bank account.",
};

export function CommissionSummary({
  summary,
  title,
  nextSettlementDate,
}: CommissionSummaryProps) {
  const batch = summary.batch;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {title ?? `Commission · ${formatMonth(summary.month)}`}
        </p>
        <PolicyBadge label="35% · sample rate" />
      </div>
      <DescriptionList
        className="mt-2"
        items={[
          {
            term: "Subscription revenue",
            value: formatMoney(summary.subscriptionRevenueCents),
            help: TERM_HELP.subscriptionRevenue,
          },
          {
            term: "Eligible revenue",
            value: formatMoney(summary.eligibleRevenueCents),
            help: TERM_HELP.eligibleRevenue,
          },
          {
            term: "Commission rate",
            value: formatRate(summary.rateBps),
            help: TERM_HELP.rate,
          },
          {
            term: "Gross commission",
            value: formatMoney(summary.grossCommissionCents),
            help: TERM_HELP.gross,
          },
          {
            term: "Refund adjustments",
            value: formatMoney(summary.adjustmentsCents),
            help: TERM_HELP.adjustments,
          },
          {
            term: "Net commission",
            value: (
              <span className="text-base">
                {formatMoney(summary.netCommissionCents)}
              </span>
            ),
            help: TERM_HELP.net,
            emphasis: true,
          },
          {
            term: "Payout status",
            value: batch ? (
              <StatusBadge meta={BANK_STATUS[batch.bankPayoutStatus]} />
            ) : (
              <StatusBadge
                meta={{ ...COMMISSION_STATUS.pending, label: "Accruing" }}
              />
            ),
          },
          {
            term: "Payout date",
            value: batch
              ? formatDate(
                  batch.bankPaidAt ??
                    batch.transferredAt ??
                    batch.bankPayoutExpectedAt,
                )
              : `Settles ${formatDate(nextSettlementDate)}`,
          },
        ]}
      />
    </div>
  );
}
