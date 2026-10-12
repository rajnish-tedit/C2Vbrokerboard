"use client";

import { Receipt } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { CommissionSummary } from "@/components/broker/CommissionSummary";
import { CommissionTransactionDrawer } from "@/components/broker/CommissionTransactionDrawer";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  DateInput,
  FilterPills,
  SearchInput,
  Select,
} from "@/components/ui/Controls";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMonth, formatShortDate, monthKey } from "@/lib/domain/dates";
import { formatMoney, formatRate, sum } from "@/lib/domain/money";
import { PLANS } from "@/lib/domain/policy";
import {
  brokerKpis,
  commissionMonths,
  CURRENT_MONTH,
  monthSummary,
} from "@/lib/domain/selectors";
import {
  ADJUSTMENT_FLAG,
  COMMISSION_STATUS,
  COMMISSION_TYPE,
  PAYMENT_STATUS,
} from "@/lib/domain/status";
import type {
  CommissionStatus,
  CommissionTransaction,
  CommissionType,
  PlanId,
} from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";

type TypeFilter = "all" | CommissionType;
type StatusFilter = "all" | CommissionStatus | "adjusted";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "eligible", label: "Eligible" },
  { value: "included_in_payout", label: "Included in Payout" },
  { value: "transferred", label: "Transferred" },
  { value: "paid", label: "Paid" },
  { value: "adjusted", label: "Adjusted / Reversed" },
  { value: "not_eligible", label: "Not Eligible" },
];

export function CommissionsView() {
  const { broker: data } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const months = useMemo(() => commissionMonths(data), [data]);
  const statusParam = params.get("status") as StatusFilter | null;

  const [month, setMonth] = useState<string>(
    params.get("month") ??
      (statusParam === "pending" || statusParam === "eligible"
        ? CURRENT_MONTH
        : "2026-09"),
  );
  const [mode, setMode] = useState<"month" | "range">("month");
  const [from, setFrom] = useState("2026-08-01");
  const [to, setTo] = useState("2026-10-28");
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>(statusParam ?? "all");
  const [plan, setPlan] = useState<"all" | PlanId>("all");
  const [query, setQuery] = useState("");
  const openTxn = params.get("txn");

  const setTxn = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (id) next.set("txn", id);
      else next.delete("txn");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const summary = useMemo(() => monthSummary(data, month), [data, month]);
  const vendorName = useCallback(
    (id: string) => data.vendors.find((v) => v.id === id)?.companyName ?? "",
    [data],
  );
  const kpis = brokerKpis(data);

  const base = useMemo(
    () =>
      mode === "month"
        ? summary.transactions
        : data.transactions.filter(
            (t) => t.earnedAt >= from && t.earnedAt <= to,
          ),
    [mode, summary, data, from, to],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return base.filter(
      (t) =>
        (type === "all" || t.type === type) &&
        (status === "all" ||
          (status === "adjusted"
            ? t.adjustmentFlag !== null || t.type === "adjustment"
            : t.status === status)) &&
        (plan === "all" || t.planId === plan) &&
        (!q ||
          vendorName(t.vendorId).toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q)),
    );
  }, [base, type, status, plan, query, vendorName]);

  const invoiceById = useMemo(
    () => new Map(data.invoices.map((i) => [i.id, i])),
    [data],
  );
  const ineligible = summary.transactions.filter(
    (t) => t.status === "not_eligible",
  );

  const columns: Column<CommissionTransaction>[] = [
    { key: "date", header: "Date", cell: (t) => formatShortDate(t.earnedAt) },
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
      cell: (t) => (
        <span
          className={
            t.type === "adjustment" ? "font-medium text-amber-800" : undefined
          }
        >
          {COMMISSION_TYPE[t.type]}
        </span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (t) => PLANS[t.planId].name,
      hideBelow: "lg",
    },
    {
      key: "invoice",
      header: "Invoice",
      cell: (t) => <span className="font-mono text-xs">{t.reference}</span>,
      hideBelow: "md",
    },
    {
      key: "paid",
      header: "Paid amount",
      align: "right",
      help: "Collected subscription amount excluding tax. Refunds show as negative.",
      cell: (t) => {
        const inv = invoiceById.get(t.invoiceId)!;
        return formatMoney(
          t.type === "adjustment" ? t.eligibleAmountCents : inv.amountCents,
        );
      },
    },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      cell: (t) => formatRate(t.rateBps),
      hideBelow: "sm",
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      cell: (t) => (
        <span className="font-semibold text-navy-950">
          {formatMoney(t.commissionCents, { signed: t.type === "adjustment" })}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Vendor payment",
      hideBelow: "xl",
      cell: (t) => (
        <StatusBadge
          meta={PAYMENT_STATUS[invoiceById.get(t.invoiceId)!.paymentStatus]}
        />
      ),
    },
    {
      key: "status",
      header: "Commission status",
      cell: (t) => (
        <span className="flex items-center gap-1">
          <StatusBadge meta={COMMISSION_STATUS[t.status]} />
          {t.adjustmentFlag && (
            <StatusBadge meta={ADJUSTMENT_FLAG[t.adjustmentFlag]} />
          )}
        </span>
      ),
    },
  ];

  const totalPaid = sum(
    rows.map((t) =>
      t.type === "adjustment"
        ? t.eligibleAmountCents
        : invoiceById.get(t.invoiceId)!.amountCents,
    ),
  );
  const totalCommission = sum(rows.map((t) => t.commissionCents));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commissions"
        description="Every Vendor payment used in your commission calculation, the rate applied and the result. Vendor payment status and commission status are tracked separately."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <div
              className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium"
              role="tablist"
              aria-label="Period mode"
            >
              {(["month", "range"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={
                    mode === m
                      ? "rounded-md bg-white px-3 py-1.5 text-navy-950 shadow-sm"
                      : "px-3 py-1.5 text-slate-500"
                  }
                >
                  {m === "month" ? "Monthly" : "Custom range"}
                </button>
              ))}
            </div>
            {mode === "month" ? (
              <Select
                label="Commission month"
                hideLabel
                value={month}
                onChange={(m) => {
                  setMonth(m);
                  setTxn(null);
                }}
                options={months.map((m) => ({
                  value: m,
                  label: `${formatMonth(m)}${m === CURRENT_MONTH ? " (in progress)" : ""}`,
                }))}
              />
            ) : (
              <>
                <DateInput label="From" value={from} onChange={setFrom} />
                <DateInput label="To" value={to} onChange={setTo} />
              </>
            )}
          </div>
        }
      />

      {data.transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt className="h-5 w-5" />}
            title="No commission yet"
            body="Commission appears here after a referred Vendor pays for an eligible subscription. Each payment becomes its own ledger entry."
            action={
              <Button href="/broker/referrals">Share your referral link</Button>
            }
          />
        </Card>
      ) : (
        <>
          {mode === "month" && (
            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="px-5 py-4 lg:col-span-2">
                <CommissionSummary
                  summary={summary}
                  nextSettlementDate={kpis.nextSettlementDate}
                />
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader
                  title="How this month was calculated"
                  description={formatMonth(month)}
                />
                <div className="space-y-4 p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        New subscription commission
                      </p>
                      <p className="num mt-1 text-lg font-semibold text-navy-950">
                        {formatMoney(summary.newCommissionCents)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {
                          summary.transactions.filter((t) => t.type === "new")
                            .length
                        }{" "}
                        payments
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Renewal commission
                      </p>
                      <p className="num mt-1 text-lg font-semibold text-navy-950">
                        {formatMoney(summary.renewalCommissionCents)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {
                          summary.transactions.filter(
                            (t) =>
                              t.type === "renewal" &&
                              t.status !== "not_eligible",
                          ).length
                        }{" "}
                        payments
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3">
                      <p className="text-xs text-amber-900">
                        Refund adjustments
                      </p>
                      <p className="num mt-1 text-lg font-semibold text-navy-950">
                        {formatMoney(summary.adjustmentsCents)}
                      </p>
                      <p className="text-xs text-amber-900">
                        {
                          summary.transactions.filter(
                            (t) => t.type === "adjustment",
                          ).length
                        }{" "}
                        separate entries
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-navy-50 p-4">
                    <p className="num text-sm text-navy-900">
                      {formatMoney(summary.eligibleRevenueCents)} eligible
                      revenue × {formatRate(summary.rateBps)} ={" "}
                      <strong>
                        {formatMoney(summary.grossCommissionCents)}
                      </strong>{" "}
                      gross
                    </p>
                    <p className="num mt-1 text-sm text-navy-900">
                      {formatMoney(summary.grossCommissionCents)}{" "}
                      {summary.adjustmentsCents < 0 ? "−" : "+"}{" "}
                      {formatMoney(Math.abs(summary.adjustmentsCents))}{" "}
                      adjustments ={" "}
                      <strong>{formatMoney(summary.netCommissionCents)}</strong>{" "}
                      net
                    </p>
                  </div>
                  {ineligible.length > 0 && (
                    <p className="text-sm text-slate-600">
                      {formatMoney(
                        summary.subscriptionRevenueCents -
                          summary.eligibleRevenueCents,
                      )}{" "}
                      of subscription revenue earned no commission:{" "}
                      {ineligible.length} payment
                      {ineligible.length > 1 ? "s" : ""} from{" "}
                      {Array.from(
                        new Set(ineligible.map((t) => vendorName(t.vendorId))),
                      ).join(", ")}
                      , which {ineligible.length > 1 ? "are" : "is"} outside the
                      12-month commission period.
                    </p>
                  )}
                  {!summary.batch && (
                    <p className="text-sm text-slate-600">
                      This month is still open. Rows stay{" "}
                      <strong>Pending</strong> for 7 days after payment, then
                      become <strong>Eligible</strong> and settle on Nov 05,
                      2026.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}

          <Card>
            <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
              <FilterPills
                label="Payment type"
                value={type}
                onChange={setType}
                options={[
                  { value: "all", label: "All", count: base.length },
                  {
                    value: "new",
                    label: "New Subscription",
                    count: base.filter((t) => t.type === "new").length,
                  },
                  {
                    value: "renewal",
                    label: "Renewal",
                    count: base.filter((t) => t.type === "renewal").length,
                  },
                  {
                    value: "adjustment",
                    label: "Adjustment / Refund",
                    count: base.filter((t) => t.type === "adjustment").length,
                  },
                ]}
              />
              <div className="ml-auto flex flex-wrap items-end gap-3">
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search Vendor or invoice"
                  className="w-56"
                />
                <Select
                  label="Commission status"
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS}
                />
                <Select
                  label="Plan"
                  value={plan}
                  onChange={setPlan}
                  options={[
                    { value: "all", label: "All plans" },
                    { value: "starter", label: "Starter" },
                    { value: "professional", label: "Professional" },
                    { value: "premium", label: "Premium" },
                  ]}
                />
              </div>
            </div>
            <DataTable
              caption="Commission transactions"
              columns={columns}
              rows={rows}
              rowKey={(t) => t.id}
              onRowClick={(t) => setTxn(t.id)}
              rowLabel={(t) =>
                `Open ${t.reference} for ${vendorName(t.vendorId)}`
              }
              rowClassName={(t) =>
                t.type === "adjustment"
                  ? "bg-amber-50/40"
                  : t.status === "not_eligible"
                    ? "text-slate-400"
                    : undefined
              }
              pageSize={30}
              empty={
                <EmptyState
                  icon={<Receipt className="h-5 w-5" />}
                  title="No transactions match these filters"
                />
              }
              footer={
                <tr>
                  <td
                    colSpan={2}
                    className="px-3 py-3 text-sm font-semibold text-navy-950"
                  >
                    {rows.length} rows{" "}
                    {mode === "range" &&
                      `· ${monthKey(from)} to ${monthKey(to)}`}
                  </td>
                  <td className="hidden 2xl:table-cell" />
                  <td className="hidden md:table-cell" />
                  <td />
                  <td className="num px-3 py-3 text-right text-sm font-semibold text-navy-950">
                    {formatMoney(totalPaid)}
                  </td>
                  <td className="hidden sm:table-cell" />
                  <td className="num px-3 py-3 text-right text-sm font-semibold text-navy-950">
                    {formatMoney(totalCommission)}
                  </td>
                  <td className="hidden xl:table-cell" />
                  <td />
                </tr>
              }
            />
          </Card>
        </>
      )}

      <CommissionTransactionDrawer
        data={data}
        transaction={data.transactions.find((t) => t.id === openTxn) ?? null}
        onClose={() => setTxn(null)}
        onSelect={setTxn}
      />
    </div>
  );
}
