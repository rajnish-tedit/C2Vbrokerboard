"use client";

import { ArrowUpDown, ListFilter, Store, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateInput, SearchInput } from "@/components/ui/Controls";
import { LogoTile } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
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
type SortKey = "newest" | "oldest" | "commission" | "name";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest registered" },
  { value: "oldest", label: "Oldest registered" },
  { value: "commission", label: "Highest commission" },
  { value: "name", label: "Name A–Z" },
];

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
  const [sort, setSort] = useState<SortKey>("newest");
  const [panel, setPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panel) return;
    const close = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setPanel(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPanel(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [panel]);

  const all = useMemo(() => vendorRows(data), [data]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all.filter(
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
    return [...list].sort((a, b) =>
      sort === "name"
        ? a.vendor.companyName.localeCompare(b.vendor.companyName)
        : sort === "commission"
          ? b.lifetimeCommissionCents - a.lifetimeCommissionCents
          : sort === "oldest"
            ? a.vendor.registeredAt.localeCompare(b.vendor.registeredAt)
            : b.vendor.registeredAt.localeCompare(a.vendor.registeredAt),
    );
  }, [all, filter, plan, query, regFrom, regTo, subFrom, subTo, sort]);

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (plan !== "all")
    chips.push({ key: "plan", label: `Plan: ${PLANS[plan].name}`, clear: () => setPlan("all") });
  if (regFrom || regTo)
    chips.push({
      key: "reg",
      label: `Registered: ${regFrom ? formatDate(regFrom) : "Any"} – ${regTo ? formatDate(regTo) : "Any"}`,
      clear: () => { setRegFrom(""); setRegTo(""); },
    });
  if (subFrom || subTo)
    chips.push({
      key: "sub",
      label: `First paid: ${subFrom ? formatDate(subFrom) : "Any"} – ${subTo ? formatDate(subTo) : "Any"}`,
      clear: () => { setSubFrom(""); setSubTo(""); },
    });
  const clearAll = () => {
    setPlan("all"); setQuery(""); setRegFrom(""); setRegTo(""); setSubFrom(""); setSubTo(""); setFilter("all");
  };
  const anyActive = chips.length > 0 || !!query || filter !== "all";

  const stats = useMemo(() => {
    const active = all.filter((r) => r.subscription.status === "active").length;
    const trial = all.filter((r) => FILTERS.registered.match(r)).length;
    const issues = all.filter((r) => r.subscription.status === "past_due").length;
    const commission = all.reduce((t, r) => t + r.lifetimeCommissionCents, 0);
    return { total: all.length, active, trial, issues, commission };
  }, [all]);

  const columns: Column<VendorRow>[] = [
    {
      key: "vendor",
      header: "Vendor",
      cell: (r) => (
        <span className="flex items-center gap-3">
          <LogoTile name={r.vendor.companyName} />
          <span>
            <span className="block font-medium text-navy-950">
              {r.vendor.companyName}
            </span>
            <span className="text-xs text-slate-500">
              {r.vendor.trade} · {r.vendor.city}, {r.vendor.state}
            </span>
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Referred vendors", value: String(stats.total), sub: "All time" },
          { label: "Active subscribers", value: String(stats.active), sub: "Paying on a plan" },
          { label: "Trial & registered", value: String(stats.trial), sub: "Not yet paying" },
          { label: "Lifetime commission", value: formatMoney(stats.commission), sub: stats.issues ? `${stats.issues} with payment issues` : "No payment issues" },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{t.label}</p>
            <p className="num mt-1 text-2xl font-bold text-navy-950">{t.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t.sub}</p>
          </div>
        ))}
      </div>
      <Card>
        <div role="tablist" aria-label="Referral status" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 sm:px-4">
          {(Object.keys(FILTERS) as FilterKey[]).map((key) => {
            const active = key === filter;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(key)}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors",
                  active
                    ? "border-brand-600 font-semibold text-brand-700"
                    : "border-transparent text-slate-600 hover:text-navy-950",
                )}
              >
                {FILTERS[key].label}
                <span className={cn("num rounded-full px-1.5 text-[11px]", active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500")}>
                  {all.filter(FILTERS[key].match).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search vendor or trade" className="min-w-0 flex-1 sm:max-w-xs" />
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={() => setPanel((v) => !v)}
              aria-expanded={panel}
              className={cn(
                "inline-flex h-[38px] items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                chips.length ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <ListFilter className="h-4 w-4" aria-hidden="true" />
              Filters
              {chips.length > 0 && (
                <span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] text-white">{chips.length}</span>
              )}
            </button>
            {panel && (
              <div role="dialog" aria-label="Filters" className="absolute left-0 top-full z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-overlay">
                <fieldset>
                  <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">Plan</legend>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {([["all", "All"], ["starter", "Starter"], ["professional", "Professional"], ["premium", "Premium"]] as const).map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={plan === v}
                        onClick={() => setPlan(v as "all" | PlanId)}
                        className={cn("rounded-full border px-3 py-1 text-xs font-medium", plan === v ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300")}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-4">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered between</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <DateInput label="From" value={regFrom} onChange={setRegFrom} />
                    <DateInput label="To" value={regTo} onChange={setRegTo} />
                  </div>
                </fieldset>
                <fieldset className="mt-4">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">First paid between</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <DateInput label="From" value={subFrom} onChange={setSubFrom} />
                    <DateInput label="To" value={subTo} onChange={setSubTo} />
                  </div>
                </fieldset>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button type="button" disabled={!chips.length} onClick={() => { setPlan("all"); setRegFrom(""); setRegTo(""); setSubFrom(""); setSubTo(""); }} className="text-sm font-medium text-brand-700 hover:underline disabled:text-slate-400 disabled:no-underline">
                    Reset
                  </button>
                  <Button size="sm" onClick={() => setPanel(false)}>Show {rows.length} vendors</Button>
                </div>
              </div>
            )}
          </div>
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <ArrowUpDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field w-auto py-1.5 pr-8">
              {SORTS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm sm:px-4">
          <span className="text-slate-600" aria-live="polite">
            Showing <span className="num font-semibold text-navy-950">{rows.length}</span> of <span className="num">{all.length}</span> vendors
          </span>
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand-700">
              {c.label}
              <button type="button" onClick={c.clear} aria-label={`Remove filter ${c.label}`} className="rounded-full p-0.5 hover:bg-brand-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {anyActive && (
            <button type="button" onClick={clearAll} className="ml-auto text-xs font-semibold text-brand-700 hover:underline">
              Clear all
            </button>
          )}
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
