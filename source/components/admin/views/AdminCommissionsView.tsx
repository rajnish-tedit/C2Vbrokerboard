"use client";

import { useMemo, useState } from "react";

import { CommissionTransactionDrawer } from "@/components/broker/CommissionTransactionDrawer";
import { Card } from "@/components/ui/Card";
import { FilterPills, SearchInput, Select } from "@/components/ui/Controls";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMonth, formatShortDate } from "@/lib/domain/dates";
import { formatMoney, sum } from "@/lib/domain/money";
import { monthRange } from "@/lib/domain/dates";
import {
  ADJUSTMENT_FLAG,
  COMMISSION_STATUS,
  COMMISSION_TYPE,
} from "@/lib/domain/status";
import type { CommissionStatus, CommissionType } from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";

export function AdminCommissionsView() {
  const { brokers } = useDemo();
  const [broker, setBroker] = useState("all");
  const [month, setMonth] = useState("2026-09");
  const [type, setType] = useState<"all" | CommissionType>("all");
  const [status, setStatus] = useState<"all" | CommissionStatus>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<{ brokerId: string; id: string } | null>(
    null,
  );

  const all = useMemo(
    () =>
      brokers.flatMap((d) =>
        d.transactions.map((t) => ({
          t,
          broker: d.broker,
          vendor: d.vendors.find((v) => v.id === t.vendorId)!.companyName,
        })),
      ),
    [brokers],
  );
  const rows = all
    .filter(
      (r) =>
        (broker === "all" || r.broker.id === broker) &&
        (month === "all" || r.t.periodMonth === month) &&
        (type === "all" || r.t.type === type) &&
        (status === "all" || r.t.status === status) &&
        (!query ||
          r.vendor.toLowerCase().includes(query.toLowerCase()) ||
          r.t.reference.toLowerCase().includes(query.toLowerCase())),
    )
    .sort((a, b) => b.t.earnedAt.localeCompare(a.t.earnedAt));
  const openData = open
    ? brokers.find((b) => b.broker.id === open.brokerId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Transactions"
        description="The immutable commission ledger across all Brokers. Entries are created automatically from verified Recurly events; refunds add separate negative entries."
      />
      <Card>
        <div className="space-y-3 border-b border-slate-100 p-4">
          <FilterPills
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { value: "all", label: "All" },
              { value: "new", label: "New" },
              { value: "renewal", label: "Renewal" },
              { value: "adjustment", label: "Adjustment / Refund" },
            ]}
          />
          <div className="flex flex-wrap items-end gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search Vendor or reference"
              className="w-60"
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
            <Select
              label="Period"
              value={month}
              onChange={setMonth}
              options={[
                { value: "all", label: "All periods" },
                ...monthRange("2025-08", "2026-10")
                  .reverse()
                  .map((m) => ({ value: m, label: formatMonth(m) })),
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All statuses" },
                ...(Object.keys(COMMISSION_STATUS) as CommissionStatus[]).map(
                  (s) => ({ value: s, label: COMMISSION_STATUS[s].label }),
                ),
              ]}
            />
            <p className="num ml-auto text-sm text-slate-600">
              {rows.length} entries · net{" "}
              <strong className="text-navy-950">
                {formatMoney(sum(rows.map((r) => r.t.commissionCents)))}
              </strong>
            </p>
          </div>
        </div>
        <DataTable
          caption="Commission ledger, all Brokers"
          rows={rows}
          rowKey={(r) => r.t.id}
          onRowClick={(r) => setOpen({ brokerId: r.broker.id, id: r.t.id })}
          rowLabel={(r) => `Open ${r.t.reference}`}
          rowClassName={(r) =>
            r.t.type === "adjustment" ? "bg-amber-50/40" : undefined
          }
          pageSize={30}
          columns={[
            {
              key: "date",
              header: "Date",
              cell: (r) => formatShortDate(r.t.earnedAt),
            },
            {
              key: "broker",
              header: "Broker",
              cell: (r) => r.broker.companyName,
            },
            {
              key: "vendor",
              header: "Vendor",
              cell: (r) => (
                <span className="font-medium text-navy-950">{r.vendor}</span>
              ),
            },
            {
              key: "type",
              header: "Type",
              cell: (r) => COMMISSION_TYPE[r.t.type],
            },
            {
              key: "ref",
              header: "Reference",
              cell: (r) => (
                <span className="font-mono text-xs">{r.t.reference}</span>
              ),
              hideBelow: "lg",
            },
            {
              key: "amount",
              header: "Eligible",
              align: "right",
              cell: (r) => formatMoney(r.t.eligibleAmountCents),
            },
            {
              key: "commission",
              header: "Commission",
              align: "right",
              cell: (r) => (
                <span className="font-semibold">
                  {formatMoney(r.t.commissionCents)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (r) => (
                <span className="flex gap-1">
                  <StatusBadge meta={COMMISSION_STATUS[r.t.status]} />
                  {r.t.adjustmentFlag && (
                    <StatusBadge meta={ADJUSTMENT_FLAG[r.t.adjustmentFlag]} />
                  )}
                </span>
              ),
            },
          ]}
        />
      </Card>
      {openData && (
        <CommissionTransactionDrawer
          data={openData}
          transaction={
            openData.transactions.find((t) => t.id === open?.id) ?? null
          }
          onClose={() => setOpen(null)}
          onSelect={(id) => setOpen({ brokerId: openData.broker.id, id })}
          vendorHref={() => `/admin/brokers/${openData.broker.id}`}
          payoutHref={(id) => `/admin/payouts/${id}`}
        />
      )}
    </div>
  );
}
