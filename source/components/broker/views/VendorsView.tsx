"use client";

import { Store } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
import { formatDate } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import { PLANS } from "@/lib/domain/policy";
import { vendorRows, type VendorRow } from "@/lib/domain/selectors";
import { REFERRAL_STATUS, SUBSCRIPTION_STATUS } from "@/lib/domain/status";
import type { PlanId } from "@/lib/domain/types";
import { useDemo } from "@/lib/store/DemoProvider";

const FILTERS = {
  all: { label: "All", match: () => true },
  registered: {
    label: "Registered",
    match: (r: VendorRow) =>
      r.subscription.status === "none" || r.subscription.status === "trial",
  },
  not_subscribed: {
    label: "Not Subscribed",
    match: (r: VendorRow) => r.subscription.status === "free",
  },
  active: {
    label: "Active Subscribers",
    match: (r: VendorRow) => r.subscription.status === "active",
  },
  past_due: {
    label: "Payment Issue",
    match: (r: VendorRow) => r.subscription.status === "past_due",
  },
  canceled: {
    label: "Canceled",
    match: (r: VendorRow) => r.subscription.status === "canceled",
  },
  expired: {
    label: "Expired",
    match: (r: VendorRow) => r.subscription.status === "expired",
  },
} as const;

type FilterKey = keyof typeof FILTERS;

export function VendorsView() {
  const { broker: data } = useDemo();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("status");
  const [filter, setFilter] = useState<FilterKey>(
    initial && initial in FILTERS ? (initial as FilterKey) : "all",
  );
  const [plan, setPlan] = useState<"all" | PlanId>("all");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [regFrom, setRegFrom] = useState("");
  const [regTo, setRegTo] = useState("");
  const [subFrom, setSubFrom] = useState("");
  const [subTo, setSubTo] = useState("");

  const all = useMemo(() => vendorRows(data), [data]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (r) =>
        FILTERS[filter].match(r) &&
        (plan === "all" || r.subscription.planId === plan) &&
        (!regFrom || r.vendor.registeredAt >= regFrom) &&
        (!regTo || r.vendor.registeredAt <= regTo) &&
        (!subFrom || (r.subscription.firstPaidAt ?? "") >= subFrom) &&
        (!subTo ||
          (r.subscription.firstPaidAt &&
            r.subscription.firstPaidAt <= subTo)) &&
        (!q ||
          r.vendor.companyName.toLowerCase().includes(q) ||
          r.vendor.trade.toLowerCase().includes(q)),
    );
  }, [all, filter, plan, query, regFrom, regTo, subFrom, subTo]);

  const hasFilters =
    plan !== "all" || query || regFrom || regTo || subFrom || subTo;

  const columns: Column<VendorRow>[] = [
    {
      key: "vendor",
      header: "Vendor",
      cell: (r) => (
        <span>
          <span className="block font-medium text-navy-950">
            {r.vendor.companyName}
          </span>
          <span className="text-xs text-slate-500">
            {r.vendor.trade} · {r.vendor.city}, {r.vendor.state}
          </span>
        </span>
      ),
    },
    {
      key: "registered",
      header: "Registered",
      cell: (r) => formatDate(r.vendor.registeredAt),
    },
    {
      key: "subscription",
      header: "Subscription",
      cell: (r) => (
        <StatusBadge meta={SUBSCRIPTION_STATUS[r.subscription.status]} />
      ),
    },
    {
      key: "plan",
      header: "Plan",
      hideBelow: "md",
      cell: (r) =>
        r.subscription.planId ? (
          <span>
            {PLANS[r.subscription.planId].name}
            {r.subscription.billingFrequency && (
              <span className="text-xs text-slate-500">
                {" "}
                ·{" "}
                {r.subscription.billingFrequency === "annual"
                  ? "Annual"
                  : "Monthly"}
              </span>
            )}
          </span>
        ) : (
          <span className="text-slate-400">
            {r.subscription.status === "free" ? "Free" : "None"}
          </span>
        ),
    },
    {
      key: "firstPaid",
      header: "First paid",
      hideBelow: "2xl",
      cell: (r) => formatDate(r.subscription.firstPaidAt),
    },
    {
      key: "referral",
      header: "Referral status",
      cell: (r) => <StatusBadge meta={REFERRAL_STATUS[r.referralStatus]} />,
    },
    {
      key: "commission",
      header: "Commission earned",
      align: "right",
      help: "Net lifetime commission from this Vendor, including refund adjustments.",
      hideBelow: "sm",
      cell: (r) =>
        r.lifetimeCommissionCents ? (
          formatMoney(r.lifetimeCommissionCents)
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referred Vendors"
        description="Every Vendor attributed to your referral link or promo code, with their subscription and paid-conversion status."
      />
      <Card>
        <div className="space-y-3 border-b border-slate-100 p-4">
          <FilterPills
            label="Referral status"
            value={filter}
            onChange={setFilter}
            options={(Object.keys(FILTERS) as FilterKey[]).map((key) => ({
              value: key,
              label: FILTERS[key].label,
              count: all.filter(FILTERS[key].match).length,
            }))}
          />
          <div className="flex flex-wrap items-end gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search Vendor or trade"
              className="w-60"
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
            <DateInput
              label="Registered from"
              value={regFrom}
              onChange={setRegFrom}
            />
            <DateInput
              label="Registered to"
              value={regTo}
              onChange={setRegTo}
            />
            <DateInput
              label="Subscribed from"
              value={subFrom}
              onChange={setSubFrom}
            />
            <DateInput
              label="Subscribed to"
              value={subTo}
              onChange={setSubTo}
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPlan("all");
                  setQuery("");
                  setRegFrom("");
                  setRegTo("");
                  setSubFrom("");
                  setSubTo("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
        <DataTable
          caption="Referred Vendors"
          columns={columns}
          rows={rows}
          rowKey={(r) => r.vendor.id}
          onRowClick={(r) => router.push(`/broker/vendors/${r.vendor.id}`)}
          rowLabel={(r) => `Open ${r.vendor.companyName}`}
          pageSize={25}
          empty={
            data.vendors.length === 0 ? (
              <EmptyState
                icon={<Store className="h-5 w-5" />}
                title="No referred Vendors yet"
                body="Vendors who register with your referral link or promo code will appear here, along with their subscription status."
                action={
                  <Button href="/broker/referrals">
                    Get your referral link
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Store className="h-5 w-5" />}
                title="No Vendors match these filters"
              />
            )
          }
        />
      </Card>
    </div>
  );
}
