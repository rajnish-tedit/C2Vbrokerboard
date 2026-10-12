"use client";

import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

import { Drawer } from "@/components/ui/Drawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/domain/dates";
import { formatMoney, formatRate } from "@/lib/domain/money";
import { PLANS } from "@/lib/domain/policy";
import {
  ADJUSTMENT_FLAG,
  COMMISSION_STATUS,
  COMMISSION_TYPE,
  PAYMENT_STATUS,
} from "@/lib/domain/status";
import type { BrokerDataset, CommissionTransaction } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type Props = {
  data: BrokerDataset;
  transaction: CommissionTransaction | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  vendorHref?: (vendorId: string) => string;
  payoutHref?: (batchId: string) => string;
};

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-1.5 text-sm",
        muted && "text-slate-400",
      )}
    >
      <span className={muted ? undefined : "text-slate-600"}>{label}</span>
      <span
        className={cn(
          "num",
          strong
            ? "font-semibold text-navy-950"
            : muted
              ? undefined
              : "text-navy-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function CommissionTransactionDrawer({
  data,
  transaction: t,
  onClose,
  onSelect,
  vendorHref = (id) => `/broker/vendors/${id}`,
  payoutHref = (id) => `/broker/payouts/${id}`,
}: Props) {
  if (!t) return null;
  const vendor = data.vendors.find((v) => v.id === t.vendorId)!;
  const invoice = data.invoices.find((i) => i.id === t.invoiceId)!;
  const credit = t.creditId
    ? data.credits.find((c) => c.id === t.creditId)
    : null;
  const related = t.relatedTransactionId
    ? data.transactions.find((x) => x.id === t.relatedTransactionId)
    : data.transactions.find((x) => x.relatedTransactionId === t.id);
  const batch = t.payoutBatchId
    ? data.payoutBatches.find((b) => b.id === t.payoutBatchId)
    : null;
  const isAdjustment = t.type === "adjustment";

  const lifecycle = [
    {
      label: isAdjustment
        ? "Refund recorded by Recurly"
        : "Payment verified with Recurly",
      date: t.earnedAt,
      done: true,
    },
    {
      label: "Commission created: Pending (7-day hold)",
      date: t.earnedAt,
      done: t.status !== "not_eligible",
    },
    {
      label: "Eligible for settlement",
      date: t.eligibleAt,
      done: ["eligible", "included_in_payout", "transferred", "paid"].includes(
        t.status,
      ),
    },
    {
      label: "Included in monthly payout",
      date: batch?.settlementCutoffAt ?? null,
      done: ["included_in_payout", "transferred", "paid"].includes(t.status),
    },
    {
      label: "Transferred via Stripe",
      date: batch?.transferredAt ?? null,
      done: ["transferred", "paid"].includes(t.status),
    },
    {
      label: "Paid to bank",
      date: batch?.bankPaidAt ?? null,
      done: t.status === "paid",
    },
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${COMMISSION_TYPE[t.type]} commission · ${vendor.companyName}`}
      subtitle={`${t.reference} · ${formatDate(t.earnedAt)}`}
      width="lg"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <StatusBadge meta={COMMISSION_STATUS[t.status]} size="md" />
          {t.adjustmentFlag && (
            <StatusBadge meta={ADJUSTMENT_FLAG[t.adjustmentFlag]} size="md" />
          )}
          {t.carriedForward && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-600/25">
              Carried forward
            </span>
          )}
        </div>

        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Calculation
          </h3>
          {isAdjustment && credit ? (
            <div className="mt-2 divide-y divide-slate-100">
              <Row
                label={`Original payment (${invoice.number})`}
                value={formatMoney(invoice.amountCents)}
              />
              <Row
                label={`${credit.kind === "refund" ? "Refund" : "Partial refund"} (${credit.number})`}
                value={formatMoney(-credit.amountCents)}
              />
              <Row label="Commission rate" value={formatRate(t.rateBps)} />
              <Row
                label="Commission adjustment"
                value={formatMoney(t.commissionCents)}
                strong
              />
            </div>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              <Row
                label={`${PLANS[invoice.planId].name} plan price`}
                value={formatMoney(invoice.listPriceCents)}
              />
              <Row
                label="Discount / credit"
                value={formatMoney(-invoice.discountCents)}
              />
              <Row
                label="Commissionable amount"
                value={formatMoney(invoice.amountCents)}
                strong
              />
              <Row
                label="Tax (excluded from commission)"
                value={formatMoney(invoice.taxCents)}
                muted
              />
              <Row
                label="Customer charged"
                value={formatMoney(invoice.chargedCents)}
                muted
              />
            </div>
          )}
          <div className="mt-4 rounded-lg bg-navy-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">
              Formula
            </p>
            <p className="num mt-1 text-lg font-semibold text-navy-950">
              {formatMoney(t.eligibleAmountCents)} × {formatRate(t.rateBps)} ={" "}
              {formatMoney(t.commissionCents)}
            </p>
            {t.ineligibleReason && (
              <p className="mt-1 text-sm text-slate-600">
                Eligible amount is $0.00 because this payment is{" "}
                {t.ineligibleReason.toLowerCase()}.
              </p>
            )}
          </div>
        </section>

        {related && (
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <h3 className="text-sm font-semibold text-navy-950">
              {isAdjustment
                ? "Adjusts this original commission"
                : "Linked refund adjustment"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {isAdjustment
                ? "The original row stays in the ledger unchanged. This separate negative entry keeps the history auditable."
                : "This original row was not edited. The refund created a separate negative entry instead."}
              {t.carriedForward &&
                " The original month was already paid out, so this adjustment was carried forward into the next settlement."}
            </p>
            <button
              type="button"
              onClick={() => onSelect(related.id)}
              className="mt-3 flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm ring-1 ring-inset ring-amber-200 hover:bg-amber-50"
            >
              <span>
                <span className="font-medium text-navy-950">
                  {related.reference}
                </span>
                <span className="text-slate-500">
                  {" "}
                  · {formatDate(related.earnedAt)}
                </span>
              </span>
              <span className="num flex items-center gap-2 font-semibold text-navy-950">
                {formatMoney(related.commissionCents, { signed: true })}
                <ArrowRight
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </span>
            </button>
            {!isAdjustment && (
              <p className="num mt-3 text-sm font-medium text-navy-950">
                Net for this payment:{" "}
                {formatMoney(t.commissionCents + related.commissionCents)}
              </p>
            )}
          </section>
        )}

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment & references
          </h3>
          <div className="mt-2 divide-y divide-slate-100">
            <Row
              label="Vendor"
              value={
                <Link
                  href={vendorHref(vendor.id)}
                  className="font-medium text-navy-700 hover:underline"
                >
                  {vendor.companyName}
                </Link>
              }
            />
            <Row
              label="Vendor payment status"
              value={
                <StatusBadge meta={PAYMENT_STATUS[invoice.paymentStatus]} />
              }
            />
            <Row
              label="Invoice"
              value={`${invoice.number} · ${invoice.description}`}
            />
            <Row
              label="Recurly invoice ID"
              value={
                <span className="font-mono text-xs">
                  {invoice.recurlyInvoiceId}
                </span>
              }
            />
            <Row
              label="Payment reference"
              value={
                <span className="font-mono text-xs">
                  {t.paymentReference ?? "—"}
                </span>
              }
            />
            <Row
              label="Ledger entry"
              value={<span className="font-mono text-xs">{t.id}</span>}
            />
            {credit && <Row label="Refund reason" value={credit.reason} />}
            {batch && (
              <Row
                label="Payout batch"
                value={
                  <Link
                    href={payoutHref(batch.id)}
                    className="font-medium text-navy-700 hover:underline"
                  >
                    {batch.id}
                  </Link>
                }
              />
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lifecycle
          </h3>
          <ol className="mt-3 space-y-2.5">
            {lifecycle.map((step) => (
              <li key={step.label} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    step.done ? "bg-emerald-500" : "bg-slate-300",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "flex-1",
                    step.done ? "text-navy-950" : "text-slate-400",
                  )}
                >
                  {step.label}
                  <span className="sr-only">
                    {step.done ? " (done)" : " (not yet)"}
                  </span>
                </span>
                <span className="num text-xs text-slate-500">
                  {step.done && step.date ? formatDate(step.date) : ""}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Commission ledger entries are immutable. Brokers can view them but
          cannot change amounts or mark payouts paid.
        </p>
      </div>
    </Drawer>
  );
}
