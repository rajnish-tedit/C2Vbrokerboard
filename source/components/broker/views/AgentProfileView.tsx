"use client";

import { ArrowLeft, ChevronRight, Copy, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { StatusPill } from "@/components/broker/views/AgentsView";
import { Avatar, LogoTile } from "@/components/ui/Avatar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/domain/money";
import {
  type AgentVendorRow,
  type RealEstateTxn,
  VENDOR_STATUS_DISPLAY,
  agentProfile,
  agentRows,
  agentTransactions,
  agentVendors,
  planName,
} from "@/lib/domain/network";
import { useDemo } from "@/lib/store/DemoProvider";
import { cn } from "@/lib/utils";

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function longDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AgentProfileView({ agentId }: { agentId: string }) {
  const { broker: data } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"vendors" | "transactions">("vendors");
  const [query, setQuery] = useState("");

  const row = useMemo(() => agentRows(data).find((r) => r.agent.id === agentId), [data, agentId]);
  const vendors = useMemo(() => (row ? agentVendors(data, agentId) : []), [data, agentId, row]);
  const txns = useMemo(() => (row ? agentTransactions(row.agent) : []), [row]);

  if (!row) {
    return (
      <div className="space-y-6">
        <BackLink href="/broker/agents" />
        <EmptyState title="Agent not found" body="This Agent is not part of your broker network." />
      </div>
    );
  }

  const { agent } = row;
  const profile = agentProfile(agent);
  const q = query.trim().toLowerCase();
  const vendorRows = vendors.filter((v) => !q || v.vendor.companyName.toLowerCase().includes(q) || v.vendor.trade.toLowerCase().includes(q));
  const txnRows = txns.filter((t) => !q || t.address.toLowerCase().includes(q) || t.number.toLowerCase().includes(q) || t.client.toLowerCase().includes(q));

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(profile.phone);
      toast("Phone number copied");
    } catch {
      toast(`Phone: ${profile.phone}`);
    }
  };

  const vendorColumns: Column<AgentVendorRow>[] = [
    {
      key: "vendor",
      header: "Vendor",
      cell: (r) => (
        <span className="flex items-center gap-3">
          <LogoTile name={r.vendor.companyName} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-navy-950">{r.vendor.companyName}</span>
            <span className="block truncate text-xs text-slate-500">{r.vendor.contactName}</span>
          </span>
        </span>
      ),
    },
    { key: "cat", header: "Category", cell: (r) => <span className="text-slate-600">{r.vendor.trade}</span>, hideBelow: "sm" },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", VENDOR_STATUS_DISPLAY[r.status].className)}>
          {VENDOR_STATUS_DISPLAY[r.status].label}
        </span>
      ),
    },
    { key: "plan", header: "Plan", cell: (r) => <span className="text-slate-600">{planName(r.planId)}</span>, hideBelow: "md" },
    { key: "rev", header: "Revenue", cell: (r) => <span className="num font-bold text-navy-950">{formatMoney(r.earningsCents)}</span> },
    { key: "go", header: "", align: "right", cell: () => <ChevronRight className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" /> },
  ];

  const txnColumns: Column<RealEstateTxn>[] = [
    {
      key: "txn",
      header: "Transaction",
      cell: (t) => (
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="num text-xs text-brand-600">
            <span className="mr-0.5 text-base">#</span>
            {t.number}
          </span>
          <span className="text-[15px] font-semibold text-navy-900">{t.client} - {t.address}</span>
        </span>
      ),
    },
    {
      key: "type",
      header: "Transaction type",
      hideBelow: "md",
      cell: (t) => (
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          {t.type === "buyer" ? "Buyer Transaction" : "Seller Transaction"}
        </span>
      ),
    },
    { key: "date", header: "Transaction date", hideBelow: "sm", cell: (t) => <span className="text-slate-600">{longDate(t.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <BackLink href="/broker/agents" />

      <section className="relative overflow-hidden rounded-2xl bg-brand-100">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 H1200 V30 C900 20 700 150 420 150 C240 150 120 90 0 40 Z" fill="#B6C4E3" opacity="0.7" />
        </svg>
        <div className="relative flex flex-wrap items-center gap-6 p-6 sm:px-8">
          <div className="relative">
            <Avatar name={agent.name} size="xl" />
            {agent.status === "active" && (
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-500" role="img" aria-label="Active" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-navy-950">{agent.name}</h1>
              <StatusPill status={row.display} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px] text-navy-900">
              <span>{agent.email}</span>
              <span className="num inline-flex items-center gap-2">
                {profile.phone}
                <button type="button" onClick={copyPhone} aria-label="Copy phone number" className="rounded p-1 text-slate-500 hover:bg-white/60 hover:text-navy-950">
                  <Copy className="h-4 w-4" />
                </button>
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="num rounded-full bg-brand-600 px-3 py-1 font-semibold text-white">License Number: {profile.licenseNumber}</span>
              <span className="text-navy-900">License Since: {profile.licenseSince}</span>
              <span className="text-navy-900">· {agent.office}</span>
            </div>
          </div>
        </div>
      </section>

      <div>
        <div role="tablist" aria-label="Agent details" className="flex gap-2 border-b border-slate-200">
          {(
            [
              ["vendors", "Vendors"],
              ["transactions", "Transactions"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setQuery("");
              }}
              className={cn(
                "-mb-px border-b-2 px-6 py-3 text-[15px] transition-colors",
                tab === key ? "border-brand-600 font-semibold text-brand-700" : "border-transparent text-navy-900 hover:text-brand-700",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <h2 className="text-xl font-semibold text-navy-950">
              {tab === "vendors" ? `Vendors (${vendors.length})` : `Transaction (${txns.length})`}
            </h2>
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="agent-detail-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="field h-11 pl-9" />
            </label>
          </div>
          {tab === "vendors" ? (
            <DataTable
              caption="Vendors referred by this agent"
              columns={vendorColumns}
              rows={vendorRows}
              rowKey={(r) => r.vendor.id}
              onRowClick={(r) => router.push(`/broker/vendors/${r.vendor.id}`)}
              rowLabel={(r) => `Open ${r.vendor.companyName}`}
              pageSize={10}
              empty={<EmptyState title="No vendors yet" body="Vendors this agent brings to C2V will appear here." />}
            />
          ) : (
            <DataTable
              caption="Agent transactions"
              columns={txnColumns}
              rows={txnRows}
              rowKey={(t) => t.id}
              onRowClick={(t) => router.push(`/broker/agents/${agent.id}/transactions/${t.id}`)}
              rowLabel={(t) => `Open transaction ${t.number}`}
              pageSize={10}
              empty={<EmptyState title="No transactions yet" body="Client transactions this agent creates in C2V will appear here." />}
            />
          )}
        </section>
      </div>
    </div>
  );
}
