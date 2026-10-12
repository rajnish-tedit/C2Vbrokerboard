"use client";

import { Lock, Store } from "lucide-react";
import { useMemo, useState } from "react";

import { CommissionTransactionDrawer } from "@/components/broker/CommissionTransactionDrawer";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PolicyBadge } from "@/components/ui/PolicyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { daysBetween, formatDate } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import { DEMO_TODAY, PLANS } from "@/lib/domain/policy";
import {
  commissionWindowMonthsLeft,
  eligibilityStatus,
  vendorRows,
} from "@/lib/domain/selectors";
import {
  COMMISSION_STATUS,
  COMMISSION_TYPE,
  PAYMENT_STATUS,
  REFERRAL_STATUS,
  SUBSCRIPTION_STATUS,
} from "@/lib/domain/status";
import type { BrokerDataset, Invoice } from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";

const SOURCE_LABEL = {
  referral_link: "Referral link",
  promo_code: "Promo code at registration",
  admin_override: "Admin attribution (audited)",
};

type EventRow = {
  invoice: Invoice;
  commissionId: string | null;
  commission: number | null;
  status: string | null;
  kind: "invoice" | "credit";
  label: string;
  date: string;
  amount: number;
};

function events(data: BrokerDataset, vendorId: string): EventRow[] {
  const out: EventRow[] = [];
  data.invoices
    .filter((i) => i.vendorId === vendorId)
    .forEach((invoice) => {
      const txn = data.transactions.find(
        (t) => t.invoiceId === invoice.id && t.type !== "adjustment",
      );
      out.push({
        invoice,
        commissionId: txn?.id ?? null,
        commission: txn ? txn.commissionCents : null,
        status: txn?.status ?? null,
        kind: "invoice",
        label: invoice.number,
        date: invoice.date,
        amount: invoice.amountCents,
      });
    });
  data.credits
    .filter((c) => c.vendorId === vendorId)
    .forEach((credit) => {
      const txn = data.transactions.find((t) => t.creditId === credit.id);
      const invoice = data.invoices.find((i) => i.id === credit.invoiceId)!;
      out.push({
        invoice,
        commissionId: txn?.id ?? null,
        commission: txn?.commissionCents ?? null,
        status: txn?.status ?? null,
        kind: "credit",
        label: credit.number,
        date: credit.date,
        amount: -credit.amountCents,
      });
    });
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function VendorDetailView({ vendorId }: { vendorId: string }) {
  const { broker: data } = useDemo();
  const [openTxn, setOpenTxn] = useState<string | null>(null);
  const row = useMemo(
    () => vendorRows(data).find((r) => r.vendor.id === vendorId),
    [data, vendorId],
  );
  const rows = useMemo(() => events(data, vendorId), [data, vendorId]);

  if (!row) {
    return (
      <Card>
        <EmptyState
          icon={<Store className="h-5 w-5" />}
          title="Vendor not found"
          body="This Vendor isn't attributed to your brokerage."
          action={
            <Button href="/broker/vendors">Back to Referred Vendors</Button>
          }
        />
      </Card>
    );
  }

  const { vendor, subscription: sub, referral } = row;
  const eligibility = eligibilityStatus(referral);
  const monthsLeft = commissionWindowMonthsLeft(referral);
  const progress =
    referral.commissionStartAt && referral.commissionEndAt
      ? Math.min(
          100,
          Math.max(
            0,
            (daysBetween(referral.commissionStartAt, DEMO_TODAY) /
              daysBetween(
                referral.commissionStartAt,
                referral.commissionEndAt,
              )) *
              100,
          ),
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/broker/vendors", label: "Referred Vendors" }}
        title={vendor.companyName}
        description={`${vendor.trade} · ${vendor.city}, ${vendor.state} · contact ${vendor.contactName}`}
        meta={
          <>
            <StatusBadge meta={SUBSCRIPTION_STATUS[sub.status]} size="md" />
            <StatusBadge meta={REFERRAL_STATUS[row.referralStatus]} size="md" />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Lifetime eligible revenue
          </p>
          <p className="num mt-2 text-2xl font-semibold text-navy-950">
            {formatMoney(row.lifetimeEligibleRevenueCents)}
          </p>
          <p className="text-xs text-slate-500">After refunds, excluding tax</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Commission generated
          </p>
          <p className="num mt-2 text-2xl font-semibold text-navy-950">
            {formatMoney(row.lifetimeCommissionCents)}
          </p>
          <p className="text-xs text-slate-500">Net of adjustments</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Commission period
            </p>
            <PolicyBadge label="12 months · sample" />
          </div>
          {referral.commissionStartAt ? (
            <>
              <p className="num mt-2 text-sm font-semibold text-navy-950">
                {formatDate(referral.commissionStartAt)} –{" "}
                {formatDate(referral.commissionEndAt)}
              </p>
              <div
                className="mt-2 h-2 rounded-full bg-slate-100"
                aria-hidden="true"
              >
                <div
                  className={
                    eligibility === "ended"
                      ? "h-2 rounded-full bg-slate-400"
                      : "h-2 rounded-full bg-chart-1"
                  }
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {eligibility === "ended"
                  ? "Ended — renewals no longer earn commission"
                  : `${monthsLeft} month${monthsLeft === 1 ? "" : "s"} of eligibility remaining`}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              Starts with the first successful paid invoice.
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Referral & attribution" />
          <div className="px-5 py-2">
            <DescriptionList
              items={[
                { term: "Registered", value: formatDate(vendor.registeredAt) },
                {
                  term: "Referral source",
                  value: SOURCE_LABEL[referral.attributionSource],
                },
                {
                  term: "Referral code",
                  value: (
                    <span className="font-mono">{referral.promoCode}</span>
                  ),
                },
                {
                  term: "Attribution date",
                  value: formatDate(referral.referredAt),
                },
                {
                  term: "Broker relationship",
                  value: `${data.broker.companyName} (first valid attribution)`,
                },
                { term: "Commission rate", value: "35%" },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Subscription"
            description="From Recurly (source of truth)"
          />
          <div className="px-5 py-2">
            <DescriptionList
              items={[
                {
                  term: "Plan",
                  value: sub.planId
                    ? PLANS[sub.planId].name
                    : sub.status === "free"
                      ? "Free"
                      : "None",
                },
                {
                  term: "Status",
                  value: <StatusBadge meta={SUBSCRIPTION_STATUS[sub.status]} />,
                },
                {
                  term: "Billing frequency",
                  value: sub.billingFrequency
                    ? sub.billingFrequency === "annual"
                      ? "Annual"
                      : "Monthly"
                    : "—",
                },
                { term: "First paid", value: formatDate(sub.firstPaidAt) },
                {
                  term:
                    sub.status === "trial"
                      ? "Trial ends"
                      : sub.canceledAt
                        ? sub.status === "expired"
                          ? "Expired"
                          : "Canceled"
                        : "Current period ends",
                  value: formatDate(
                    sub.trialEndsAt ??
                      sub.canceledAt ??
                      sub.currentPeriodEndsAt,
                  ),
                },
                {
                  term: "Last successful payment",
                  value: formatDate(row.lastPaymentAt),
                },
              ]}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Payments & commission events"
          description="Every Vendor payment, refund and failed charge, with the commission it produced"
        />
        <DataTable
          caption="Payments and commission events"
          rows={rows}
          rowKey={(r) => `${r.kind}-${r.label}`}
          onRowClick={(r) => r.commissionId && setOpenTxn(r.commissionId)}
          rowLabel={(r) => `Open ${r.label}`}
          empty={
            <EmptyState
              title="No payments yet"
              body={
                sub.status === "trial"
                  ? "This Vendor is in a free trial. Commission starts once their first paid invoice succeeds."
                  : "This Vendor hasn't paid for a subscription, so no commission has been earned."
              }
            />
          }
          columns={[
            { key: "date", header: "Date", cell: (r) => formatDate(r.date) },
            {
              key: "ref",
              header: "Reference",
              cell: (r) => (
                <span className="font-medium text-navy-950">{r.label}</span>
              ),
            },
            {
              key: "type",
              header: "Type",
              cell: (r) =>
                r.kind === "credit"
                  ? COMMISSION_TYPE.adjustment
                  : r.invoice.kind === "new"
                    ? COMMISSION_TYPE.new
                    : COMMISSION_TYPE.renewal,
            },
            {
              key: "amount",
              header: "Amount (excl. tax)",
              align: "right",
              cell: (r) => formatMoney(r.amount),
            },
            {
              key: "payment",
              header: "Vendor payment",
              cell: (r) =>
                r.kind === "credit" ? (
                  <span className="text-slate-500">Refund issued</span>
                ) : (
                  <StatusBadge meta={PAYMENT_STATUS[r.invoice.paymentStatus]} />
                ),
            },
            {
              key: "commission",
              header: "Commission",
              align: "right",
              cell: (r) =>
                r.commission === null ? (
                  <span className="text-xs text-slate-400">No commission</span>
                ) : (
                  formatMoney(r.commission, { signed: r.commission !== 0 })
                ),
            },
            {
              key: "status",
              header: "Commission status",
              cell: (r) =>
                r.status ? (
                  <StatusBadge
                    meta={
                      COMMISSION_STATUS[
                        r.status as keyof typeof COMMISSION_STATUS
                      ]
                    }
                  />
                ) : (
                  <span className="text-xs text-slate-500">
                    Failed payments earn nothing
                  </span>
                ),
            },
          ]}
        />
        <p className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Vendor card and bank details are never shown to Brokers.
        </p>
      </Card>

      <CommissionTransactionDrawer
        data={data}
        transaction={data.transactions.find((t) => t.id === openTxn) ?? null}
        onClose={() => setOpenTxn(null)}
        onSelect={setOpenTxn}
      />
    </div>
  );
}
